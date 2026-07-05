import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput  from './MessageInput';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { decryptRoomKey, encryptMessage, decryptMessage } from '../lib/crypto';

function getTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindow({ activeChatId, onBackClick }) {
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const areaRef = useRef(null);
  const { user, onlineUsers } = useAuth();
  
  const typingTimeoutRef = useRef(null);
  const aesKeyRef = useRef(null); // Ref to hold key for the websocket listener

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
          id, type,
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
          name = others.map(u => u.username).join(', ') || 'Group Chat';
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
          setMessages(decryptedMsgs);
        }
      }
      setLoading(false);
    }
    
    fetchRoom();

    const messageSub = supabase.channel(`messages:${activeChatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeChatId}` }, async payload => {
        // Prevent adding message twice if we sent it
        if (payload.new.sender_id === user.id) return;
        const dec = await decryptMessage(payload.new.text, aesKeyRef.current);
        setMessages(prev => [...prev, { ...payload.new, text: dec }]);
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

  async function handleSend(text) {
    if (!activeChatId || !user) return;
    
    // Encrypt message text
    const encryptedText = await encryptMessage(text, aesKeyRef.current);
    
    // Optimistic UI update
    const tempMsg = { id: Date.now().toString(), sender_id: user.id, text: text, type: 'text', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase.from('messages').insert({
      room_id: activeChatId,
      sender_id: user.id,
      text: encryptedText,
      type: 'text'
    });
    
    if (error) console.error("Error sending message:", error);
  }
  
  function handleTyping() {
    if (!activeChatId || !user) return;
    supabase.channel(`typing:${activeChatId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id },
    });
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
          <button className="icon-btn" title="Voice Call">
            <i className="fa-solid fa-phone" />
          </button>
          <button className="icon-btn" id="chatDotsBtn" title="More" onClick={(e) => { e.stopPropagation(); setShowDropdown(o => !o); }}>
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
          {showDropdown && (
            <div className="dropdown-menu" style={{ display: 'block', right: '0', left: 'auto', top: '100%' }}>
              <div className="dd-item"><i className="fa-solid fa-circle-info" />Info</div>
              <div className="dd-item"><i className="fa-solid fa-magnifying-glass" />Search</div>
              <div className="dd-item"><i className="fa-solid fa-bell-slash" />Mute</div>
              <div className="dd-item"><i className="fa-solid fa-lock" />Lock Chat</div>
              <div className="dd-item" onClick={async () => {
                 if (confirm('Clear history?')) {
                   await supabase.from('messages').delete().eq('room_id', activeChatId);
                   setMessages([]);
                 }
                 setShowDropdown(false);
              }}>
                <i className="fa-solid fa-trash" />Clear History
              </div>
              <div className="dd-item"><i className="fa-solid fa-images" />Wallpaper</div>
              <div className="dd-separator" />
              <div className="dd-item danger"><i class="fa-solid fa-ban" />Block</div>
            </div>
          )}
        </div>
      </div>

      <div className="messages-area" id="messagesArea" ref={areaRef}>
        <div className="date-chip">
          <span><i className="fa-solid fa-lock"></i> Messages are end-to-end encrypted</span>
        </div>

        {loading ? (
           <div style={{textAlign: 'center', marginTop: 20, color: 'var(--text-dim)'}}>Loading messages...</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              text={msg.text}
              isSent={msg.sender_id === user?.id}
              time={getTime(msg.timestamp)}
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

      <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={!activeChatId || loading} />
    </div>
  );
}
