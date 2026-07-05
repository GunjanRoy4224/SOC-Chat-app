import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput  from './MessageInput';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { decryptRoomKey, encryptMessage, decryptMessage, encryptFile } from '../lib/crypto';
import { useWebRTC } from '../hooks/useWebRTC';
import { getLocalMessages, saveLocalMessages } from '../lib/storage';

function getTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindow({ activeChatId, onBackClick }) {
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [replyToMsg, setReplyToMsg] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  const areaRef = useRef(null);
  const { user, onlineUsers } = useAuth();
  
  const typingTimeoutRef = useRef(null);
  const aesKeyRef = useRef(null); // Ref to hold key for the websocket listener

  // WebRTC Hook
  const { callState, remoteStream, startCall, acceptCall, endCall } = useWebRTC(activeChatId, user?.id, handleCallLog);

  async function handleCallLog(metadata) {
    if (!activeChatId || !user || !aesKeyRef.current) return;
    const encryptedMetadata = await encryptMessage(JSON.stringify(metadata), aesKeyRef.current);
    await supabase.from('messages').insert({
      room_id: activeChatId,
      sender_id: user.id,
      text: encryptedMetadata,
      type: 'call_log'
    });
  }

  useEffect(() => {
    if (areaRef.current) {
      areaRef.current.scrollTop = areaRef.current.scrollHeight;
    }
  }, [messages, typingVisible]);

  useEffect(() => {
    if (!activeChatId || !user) return;
    
    setLoading(true);
    setMessages([]);
    setTypingVisible(false);
    setShowDropdown(false);
    aesKeyRef.current = null;
    
    async function fetchRoom() {
      const { data } = await supabase
        .from('rooms')
        .select(`
          id, type, name, avatar_url,
          room_participants (
            encrypted_room_key,
            users ( id, username, avatar_url, last_seen )
          )
        `)
        .eq('id', activeChatId)
        .single();
        
      if (data) {
        const others = data.room_participants.filter(p => p.users.id !== user.id).map(p => p.users);
        const myParticipant = data.room_participants.find(p => p.users.id === user.id);

        let name = 'Group Chat';
        let status = 'Offline';
        let initials = 'GC';
        
        if (data.type === 'direct') {
          name = others[0]?.username || 'Unknown User';
          initials = name.substring(0, 2).toUpperCase();
          const otherId = others[0]?.id;
          if (otherId && onlineUsers?.[otherId]) {
            status = 'Online';
          } else if (others[0]?.last_seen) {
            status = 'Last seen ' + new Date(others[0].last_seen).toLocaleString();
          }
        } else {
          name = data.name || others.map(u => u.username).join(', ') || 'Group Chat';
          initials = name.substring(0, 2).toUpperCase();
          const onlineCount = others.filter(u => onlineUsers?.[u.id]).length;
          status = `${onlineCount} online`;
        }
        
        setRoomInfo({ name, status, initials, type: data.type, otherUserIds: others.map(o => o.id) });

        // Decrypt Room Key
        let aesKey = null;
        if (myParticipant?.encrypted_room_key) {
           const privateKey = localStorage.getItem(`pulse_priv_key_${user.id}`);
           aesKey = await decryptRoomKey(myParticipant.encrypted_room_key, privateKey);
           aesKeyRef.current = aesKey;
        }

        // Load from IndexedDB cache first
        const localMsgs = await getLocalMessages(activeChatId);
        if (localMsgs && localMsgs.length > 0) {
          setMessages(localMsgs);
        }

        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', activeChatId)
          .order('timestamp', { ascending: true });
          
        if (msgData) {
          const decryptedMsgs = await Promise.all(msgData.map(async (m) => {
             const dec = await decryptMessage(m.text, aesKey);
             return { ...m, text: dec };
          }));
          
          // Only update state if different length or force update. For simplicity, just update state.
          setMessages(decryptedMsgs);
          saveLocalMessages(activeChatId, decryptedMsgs);
        }
      }
      setLoading(false);
    }
    
    fetchRoom();

    const messageSub = supabase.channel(`messages:${activeChatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${activeChatId}` }, async payload => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.sender_id === user.id) return;
          const dec = await decryptMessage(payload.new.text, aesKeyRef.current);
          setMessages(prev => {
            const updated = [...prev, { ...payload.new, text: dec }];
            saveLocalMessages(activeChatId, updated);
            
            // Auto mark as read if in focus
            if (document.hasFocus()) {
               supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then();
            }
            return updated;
          });
        } else if (payload.eventType === 'UPDATE') {
           setMessages(prev => {
              const updated = prev.map(m => m.id === payload.new.id ? { ...m, is_deleted: payload.new.is_deleted, is_read: payload.new.is_read } : m);
              saveLocalMessages(activeChatId, updated);
              return updated;
           });
        }
      })
      .subscribe();
      
    const typingSub = supabase.channel(`typing:${activeChatId}`)
      .on('broadcast', { event: 'typing' }, payload => {
        if (payload.payload.userId !== user.id) {
          setTypingVisible(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingVisible(false), 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(typingSub);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChatId, user, onlineUsers]);

  async function handleSend(text, file) {
    if (!activeChatId || !user) return;
    
    if (file) {
      // 1. ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // 2. Encrypt
      const encryptedBuffer = await encryptFile(arrayBuffer, aesKeyRef.current);
      // 3. Upload
      const ext = file.name.split('.').pop();
      const path = `${activeChatId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const tempMsg = { id: Date.now().toString(), sender_id: user.id, text: `Encrypting & Uploading ${file.name}...`, type: 'text', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, tempMsg]);

      const { data, error: uploadError } = await supabase.storage.from('chat-media').upload(path, encryptedBuffer, {
        contentType: 'application/octet-stream'
      });

      if (uploadError) {
        console.error("Upload error", uploadError);
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        alert("Failed to upload file. Check console for details.");
        return;
      }
      
      // Determine type
      let type = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const encryptedFileName = await encryptMessage(file.name, aesKeyRef.current);

      await supabase.from('messages').insert({
        room_id: activeChatId,
        sender_id: user.id,
        text: encryptedFileName,
        media_url: path,
        type: type,
        reply_to_id: replyToMsg?.id || null
      });
      
      setReplyToMsg(null);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } else {
      // Encrypt message text
      const encryptedText = await encryptMessage(text, aesKeyRef.current);
      
      // Optimistic UI update
      const tempMsg = { id: Date.now().toString(), sender_id: user.id, text: text, type: 'text', timestamp: new Date().toISOString(), reply_to_id: replyToMsg?.id || null };
      setMessages(prev => [...prev, tempMsg]);

      const { data: inserted, error } = await supabase.from('messages').insert({
        room_id: activeChatId,
        sender_id: user.id,
        text: encryptedText,
        type: 'text',
        reply_to_id: replyToMsg?.id || null
      }).select().single();
      
      setReplyToMsg(null);
      if (error) console.error("Error sending message:", error);
      
      // Update local storage
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempMsg.id);
        const updated = inserted ? [...filtered, { ...inserted, text: text }] : [...filtered];
        saveLocalMessages(activeChatId, updated);
        return updated;
      });
    }
  }
  
  async function handleDelete(msgId) {
    if (!confirm('Delete this message for everyone?')) return;
    
    // Optimistic Update
    setMessages(prev => {
      const updated = prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m);
      saveLocalMessages(activeChatId, updated);
      return updated;
    });

    const { error } = await supabase.from('messages').update({ is_deleted: true }).eq('id', msgId);
    if (error) alert("Failed to delete message.");
  }
  
  function handleTyping() {
    if (!activeChatId || !user) return;
    supabase.channel(`typing:${activeChatId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: user.username }
    });
  }

  function handleScroll() {
    if (!areaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = areaRef.current;
    if (scrollHeight - scrollTop - clientHeight > 150) {
      setShowScrollDown(true);
    } else {
      setShowScrollDown(false);
    }
  }

  function scrollToBottom() {
    if (areaRef.current) {
      areaRef.current.scrollTop = areaRef.current.scrollHeight;
      setShowScrollDown(false);
    }
  }

  if (!activeChatId) {
    return (
      <div className="welcome-view">
        <div className="welcome-center">
          <div className="welcome-ring">
            <i className="fa-solid fa-message" />
          </div>
          <h2 className="welcome-title">Pulse</h2>
          <p className="welcome-desc">
            Chat with Anyone &amp; Anywhere<br />
            Pulse — Secure &amp; Instant
          </p>
          <div className="welcome-tags">
            <span><i className="fa-solid fa-lock" /> End-to-end encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window" id="view-chat">
      <div className="chat-header">
        <button className="icon-btn mobile-back" id="chatBackBtn" onClick={onBackClick}>
          <i className="fa-solid fa-chevron-left" />
        </button>

        {roomInfo && (
          <div className="chat-header-info" id="chatHeaderInfo">
            <div className="chat-hdr-avatar av1" id="chatHdrAvatar">
              {roomInfo.initials}
            </div>
            <div>
              <div className="chat-hdr-name" id="chatHdrName">{roomInfo.name}</div>
              <div className="chat-hdr-status" id="chatHdrStatus">{roomInfo.status}</div>
            </div>
          </div>
        )}

        <div className="chat-header-actions" style={{ position: 'relative' }}>
          <button className="icon-btn" title="Voice Call" onClick={startCall} disabled={callState !== 'idle'}>
            <i className="fa-solid fa-phone" />
          </button>
          <button className="icon-btn" id="chatDotsBtn" title="More" onClick={(e) => { e.stopPropagation(); setShowDropdown(o => !o); }}>
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
          {showDropdown && (
            <div className="dropdown-menu" style={{ display: 'block', right: '0', left: 'auto', top: '100%', zIndex: 100 }}>
              <div className="dd-item" onClick={() => { alert(`Chat Info:\nName: ${roomInfo.name}\nStatus: ${roomInfo.status}\nType: ${roomInfo.type}`); setShowDropdown(false); }}>
                <i className="fa-solid fa-circle-info" />Info
              </div>
              <div className="dd-item" onClick={() => { alert('Search functionality coming soon.'); setShowDropdown(false); }}>
                <i className="fa-solid fa-magnifying-glass" />Search
              </div>
              <div className="dd-item" onClick={() => { alert('Chat muted.'); setShowDropdown(false); }}>
                <i className="fa-solid fa-bell-slash" />Mute
              </div>
              <div className="dd-item" onClick={() => { alert('Chat locked.'); setShowDropdown(false); }}>
                <i className="fa-solid fa-lock" />Lock Chat
              </div>
              <div className="dd-item" onClick={async () => {
                 if (confirm('Clear history for everyone?')) {
                   await supabase.from('messages').delete().eq('room_id', activeChatId);
                   setMessages([]);
                 }
                 setShowDropdown(false);
              }}>
                <i className="fa-solid fa-trash" />Clear History
              </div>
              <div className="dd-item" onClick={() => { alert('Wallpaper feature coming soon.'); setShowDropdown(false); }}>
                <i className="fa-solid fa-images" />Wallpaper
              </div>
              <div className="dd-separator" />
              <div className="dd-item danger" onClick={() => { alert('User blocked.'); setShowDropdown(false); }}>
                <i className="fa-solid fa-ban" />Block
              </div>
            </div>
          )}
        </div>
      </div>

      {callState === 'incoming' && (
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', padding: '30px', background: 'var(--bg-sidebar)', borderRadius: '24px', boxShadow: '0 12px 48px rgba(0,0,0,0.6)', border: '1px solid var(--border)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '280px' }}>
          <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '32px', marginBottom: '10px' }}>{roomInfo.initials}</div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)', fontSize: '20px' }}>{roomInfo.name}</h3>
            <p style={{ margin: 0, color: 'var(--incoming-g)', fontWeight: 'bold' }}>Incoming Call...</p>
          </div>
          <div style={{ display: 'flex', gap: 30, marginTop: '10px' }}>
            <button onClick={endCall} style={{ background: 'var(--missed-red)', color: '#fff', border: 'none', width: '56px', height: '56px', borderRadius: '50%', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}><i className="fa-solid fa-phone-slash"></i></button>
            <button onClick={acceptCall} className="pulse-anim" style={{ background: 'var(--incoming-g)', color: '#fff', border: 'none', width: '56px', height: '56px', borderRadius: '50%', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}><i className="fa-solid fa-phone"></i></button>
          </div>
        </div>
      )}

      {(callState === 'ringing' || callState === 'active') && (
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', padding: '30px', background: 'var(--bg-sidebar)', borderRadius: '24px', boxShadow: '0 12px 48px rgba(0,0,0,0.6)', border: '1px solid var(--border)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '280px' }}>
          <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '32px', marginBottom: '10px' }}>{roomInfo.initials}</div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)', fontSize: '20px' }}>{roomInfo.name}</h3>
            <p style={{ margin: 0, color: callState === 'active' ? 'var(--incoming-g)' : 'var(--text-sub)', fontWeight: callState === 'active' ? 'bold' : 'normal' }}>
              {callState === 'ringing' ? 'Ringing...' : 'Active Call 00:00'}
            </p>
            {remoteStream && (
              <audio
                autoPlay
                ref={audio => {
                  if (audio && !audio.srcObject) audio.srcObject = remoteStream;
                }}
              />
            )}
          </div>
          <div style={{ marginTop: '10px' }}>
             <button onClick={endCall} style={{ background: 'var(--missed-red)', color: '#fff', border: 'none', width: '56px', height: '56px', borderRadius: '50%', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}><i className="fa-solid fa-phone-slash"></i></button>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="messages-area" id="messagesArea" ref={areaRef} onScroll={handleScroll}>
          <div className="date-chip">
            <span><i className="fa-solid fa-lock"></i> Messages are end-to-end encrypted</span>
          </div>

          {loading ? (
           <div style={{textAlign: 'center', marginTop: 20, color: 'var(--text-dim)'}}>Loading messages...</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isSent={msg.sender_id === user?.id}
              time={getTime(msg.timestamp)}
              roomAesKey={aesKeyRef.current}
              onReply={(m) => setReplyToMsg(m)}
              onDelete={handleDelete}
            />
          ))
        )}

          {typingVisible && (
            <div className="typing-bubble" id="typingBubble">
              <div className="t-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {showScrollDown && (
          <button 
            onClick={scrollToBottom}
            style={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-panel)', color: 'var(--text-sub)', border: '1px solid var(--border)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-chevron-down" />
          </button>
        )}
      </div>

      {replyToMsg && (
        <div style={{ padding: '8px 15px', background: 'var(--bg-active)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <div style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)'}}>Replying to message</div>
             <div style={{fontSize: '13px', color: 'var(--text-main)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '250px'}}>
               {replyToMsg.type === 'text' ? replyToMsg.text : `[${replyToMsg.type}]`}
             </div>
           </div>
           <button className="icon-btn" onClick={() => setReplyToMsg(null)}><i className="fa-solid fa-xmark" /></button>
        </div>
      )}

      <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={!activeChatId || loading} />
    </div>
  );
}
