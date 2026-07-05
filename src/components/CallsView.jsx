import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { decryptRoomKey, decryptMessage } from '../lib/crypto';

export default function CallsView() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCalls() {
      if (!user) return;
      setLoading(true);

      // 1. Fetch all call logs
      const { data: callMsgs, error } = await supabase
        .from('messages')
        .select(`
          id, text, timestamp, sender_id, room_id,
          rooms (
            type, name,
            room_participants (
              user_id, encrypted_room_key,
              users (id, username)
            )
          )
        `)
        .eq('type', 'call_log')
        .order('timestamp', { ascending: false })
        .limit(50);
        
      if (error || !callMsgs) {
        setLoading(false);
        return;
      }
      
      // Filter out messages where the user isn't a participant (safety check)
      const validCalls = callMsgs.filter(m => m.rooms && m.rooms.room_participants.some(p => p.user_id === user.id));

      const privateKey = localStorage.getItem(`pulse_priv_key_${user.id}`);
      const parsedCalls = [];

      for (const msg of validCalls) {
        const myParticipant = msg.rooms.room_participants.find(p => p.user_id === user.id);
        let metadata = { status: 'unknown', duration: 0 };
        
        if (myParticipant?.encrypted_room_key && privateKey) {
          try {
            const aesKey = await decryptRoomKey(myParticipant.encrypted_room_key, privateKey);
            const decStr = await decryptMessage(msg.text, aesKey);
            metadata = JSON.parse(decStr);
          } catch (e) {
            console.warn("Could not decrypt call log", e);
          }
        }
        
        const others = msg.rooms.room_participants.filter(p => p.user_id !== user.id).map(p => p.users);
        let name = 'Unknown';
        if (msg.rooms.type === 'direct') {
          name = others[0]?.username || 'Unknown User';
        } else {
          name = msg.rooms.name || others.map(u => u.username).join(', ') || 'Group Chat';
        }

        // Determine call type relative to current user
        // The sender of the call_log is the caller.
        let callType = 'incoming';
        if (msg.sender_id === user.id) {
          callType = 'outgoing';
        } else if (metadata.status === 'missed') {
          callType = 'missed';
        } else if (metadata.status === 'declined') {
           callType = 'missed';
        }

        parsedCalls.push({
          id: msg.id,
          name,
          initials: name.substring(0, 2).toUpperCase(),
          timestamp: new Date(msg.timestamp).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
          type: callType,
          duration: metadata.duration || 0,
          status: metadata.status || 'unknown'
        });
      }
      
      setCalls(parsedCalls);
      setLoading(false);
    }
    
    loadCalls();
  }, [user]);

  const filteredCalls = calls.filter(c => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  return (
    <div className="rp-view" id="view-calls">
      <div className="page-header">
        <h2>Calls</h2>
        <div className="page-header-tabs">
          <button className={`ptab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`ptab ${filter === 'missed' ? 'active' : ''}`} onClick={() => setFilter('missed')}>Missed</button>
          <button className={`ptab ${filter === 'incoming' ? 'active' : ''}`} onClick={() => setFilter('incoming')}>In</button>
          <button className={`ptab ${filter === 'outgoing' ? 'active' : ''}`} onClick={() => setFilter('outgoing')}>Out</button>
        </div>
      </div>
      <div className="calls-list scrollable-content" id="callsList">
        
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sub)' }}>Loading calls...</div>
        ) : filteredCalls.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px', color: 'var(--border)' }}>
               <i className="fa-solid fa-phone-slash" />
            </div>
            <h3>No Calls Found</h3>
            <p style={{ fontSize: '14px' }}>Your recent voice and video calls will appear here.</p>
          </div>
        ) : (
          filteredCalls.map(c => (
            <div key={c.id} className="call-item" data-ct={c.type}>
              <div className="avatar av-self">{c.initials}</div>
              <div className="call-item-info">
                <div className="call-name">{c.name}</div>
                <div className={`call-detail ${c.type}`}>
                  {c.type === 'missed' && <i className="fa-solid fa-phone-missed"></i>}
                  {c.type === 'incoming' && <i className="fa-solid fa-phone-arrow-down-left"></i>}
                  {c.type === 'outgoing' && <i className="fa-solid fa-phone-arrow-up-right"></i>}
                  {' '}{c.type.charAt(0).toUpperCase() + c.type.slice(1)} · {c.timestamp} 
                  {c.duration > 0 && ` · ${Math.floor(c.duration/60)}m ${c.duration%60}s`}
                </div>
              </div>
              <button className="call-back-btn" title="Call back" style={{ border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: '18px', cursor: 'pointer' }}>
                <i className="fa-solid fa-phone"></i>
              </button>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
