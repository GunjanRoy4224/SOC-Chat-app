import { useState, useRef } from 'react';
import Picker from 'emoji-picker-react';

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [msg, setMsg] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!msg.trim()) return;
    onSend(msg, null); // text only
    setMsg('');
    setShowEmoji(false);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check size limit (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert("File is too large. Please select a file under 20MB.");
      e.target.value = '';
      return;
    }
    
    onSend('', file);
    e.target.value = '';
    setShowEmoji(false);
  }

  function handleEmojiClick(emojiObj) {
    setMsg(prev => prev + emojiObj.emoji);
  }

  return (
    <div className="chat-input-bar">
      {showEmoji && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 50, marginBottom: '10px' }}>
          <Picker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}
      
      <button 
        className="icon-btn input-icon-btn" 
        type="button"
        onClick={() => setShowEmoji(v => !v)}
        disabled={disabled}
      >
        <i className="fa-regular fa-face-smile" />
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button 
        className="icon-btn attach-btn" 
        type="button"
        disabled={disabled}
        onClick={() => { setShowEmoji(false); fileInputRef.current?.click(); }}
      >
        <i className="fa-solid fa-paperclip" />
      </button>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, gap: '10px' }}>
        <div className="input-field-wrap">
          <input
            type="text"
            className="msg-input"
            placeholder="Type a message"
            value={msg}
            disabled={disabled}
            onChange={e => {
              setMsg(e.target.value);
              onTyping && onTyping();
            }}
          />
        </div>
        <button type="submit" className="send-btn" disabled={disabled || !msg.trim()}>
          <i className="fa-solid fa-paper-plane" />
        </button>
      </form>
    </div>
  );
}
