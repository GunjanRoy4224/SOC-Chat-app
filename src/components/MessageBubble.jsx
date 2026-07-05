import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { decryptFile } from '../lib/crypto';

export default function MessageBubble({ msg, isSent, time, roomAesKey, onReply, onDelete }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    let activeUrl = null;
    if (msg.media_url && !mediaUrl && roomAesKey && !msg.is_deleted) {
      async function fetchAndDecrypt() {
        setLoadingMedia(true);
        try {
          const { data, error } = await supabase.storage.from('chat-media').download(msg.media_url);
          if (error) throw error;
          
          const arrayBuffer = await data.arrayBuffer();
          const decryptedBuffer = await decryptFile(arrayBuffer, roomAesKey);
          
          if (decryptedBuffer) {
             let mime = 'application/octet-stream';
             if (msg.type === 'image') mime = 'image/*';
             else if (msg.type === 'video') mime = 'video/*';
             else if (msg.type === 'audio') mime = 'audio/*';
             
             const blob = new Blob([decryptedBuffer], { type: mime });
             activeUrl = URL.createObjectURL(blob);
             setMediaUrl(activeUrl);
          }
        } catch(e) {
          console.error("Failed to load media", e);
        }
        setLoadingMedia(false);
      }
      fetchAndDecrypt();
    }
    
    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [msg.media_url, roomAesKey, msg.is_deleted]); 

  if (msg.is_deleted) {
    return (
       <div className={`msg ${isSent ? 'sent' : 'received'}`}>
         <div className="msg-content" style={{fontStyle: 'italic', opacity: 0.6}}>
           <i className="fa-solid fa-ban" /> This message was deleted
         </div>
       </div>
    );
  }

  return (
    <div 
      className={`msg ${isSent ? 'sent' : 'received'}`} 
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showActions && (
        <div style={{position:'absolute', top: -15, right: isSent ? 10 : 'auto', left: isSent ? 'auto' : 10, background: 'var(--bg-panel)', borderRadius: '15px', padding: '4px 10px', display:'flex', gap:'15px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10}}>
           {onReply && <i className="fa-solid fa-reply" title="Reply" style={{cursor:'pointer', color: 'var(--text-main)'}} onClick={() => onReply(msg)} />}
           {isSent && onDelete && <i className="fa-solid fa-trash" title="Delete" style={{cursor:'pointer', color: 'var(--missed-red)'}} onClick={() => onDelete(msg.id)} />}
        </div>
      )}

      <div className="msg-content">
        {msg.reply_to_id && (
           <div style={{ fontSize: '12px', borderLeft: '3px solid var(--primary-color)', paddingLeft: '8px', marginBottom: '6px', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
             <i className="fa-solid fa-reply" style={{fontSize: '10px', marginRight: '5px'}}/> Replied to message
           </div>
        )}

        {loadingMedia && <div style={{fontStyle:'italic', color:'var(--text-muted)', fontSize:'12px'}}>Decrypting media...</div>}
        
        {msg.type === 'image' && mediaUrl && (
          <img src={mediaUrl} alt="Encrypted image" style={{maxWidth: '250px', maxHeight: '250px', borderRadius: '8px', marginBottom: '5px', display: 'block'}} />
        )}
        
        {msg.type === 'video' && mediaUrl && (
          <video controls src={mediaUrl} style={{maxWidth: '250px', borderRadius: '8px', marginBottom: '5px', display: 'block'}} />
        )}
        
        {msg.type === 'audio' && mediaUrl && (
          <audio controls src={mediaUrl} style={{maxWidth: '250px', marginBottom: '5px', display: 'block'}} />
        )}
        
        {msg.type === 'document' && mediaUrl && (
          <a href={mediaUrl} download={msg.text} style={{display: 'flex', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', textDecoration: 'none', marginBottom: '5px'}}>
             <i className="fa-solid fa-file" style={{marginRight: '8px'}}></i>
             <span style={{wordBreak: 'break-all'}}>{msg.text}</span>
          </a>
        )}

        {msg.type === 'call_log' && (
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-active)', borderRadius: '8px', color: 'var(--text-main)'}}>
            {(() => {
              try {
                const call = JSON.parse(msg.text);
                const isMissed = call.status === 'declined' || call.status === 'cancelled';
                const icon = isMissed ? 'fa-phone-slash' : 'fa-phone';
                const color = isMissed ? 'var(--missed-red)' : (isSent ? 'var(--outgoing-b)' : 'var(--incoming-g)');
                
                return (
                  <>
                    <i className={`fa-solid ${icon}`} style={{color: color, fontSize: '18px'}}></i>
                    <div>
                      <div style={{fontWeight: 'bold', fontSize: '14px'}}>Voice Call</div>
                      <div style={{fontSize: '12px', opacity: 0.8, textTransform: 'capitalize'}}>
                        {call.status} {call.duration > 0 ? `• ${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : ''}
                      </div>
                    </div>
                  </>
                );
              } catch(e) {
                return <div>Voice Call Log</div>;
              }
            })()}
          </div>
        )}

        {msg.type === 'text' && <div>{msg.text}</div>}
      </div>
      <div className="msg-meta">
        <span className="msg-time">{time}</span>
        {isSent && <i className={`fa-solid fa-check-double msg-status ${msg.is_read ? 'read' : ''}`} />}
      </div>
    </div>
  );
}
