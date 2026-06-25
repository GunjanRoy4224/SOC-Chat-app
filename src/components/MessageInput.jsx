import { useState } from 'react';

const EMOJIS = ['😀','😂','🥹','😍','🥰','😎','🤩','🥳','😅','😭','😤','🤔','💀',
                 '🔥','❤️','🎉','👍','🙌','💪','🫶','🌟','✨','💯','🎊','🏆','😜',
                 '🥴','🫠','🤗','🙏'];


export default function MessageInput({ onSend, disabled }) {
  const [text, setText]           = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    setShowEmoji(false);
    setShowAttach(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSend();
  }

  function insertEmoji(emoji) {
    setText(prev => prev + emoji);
  }

  return (
    <div style={{ position: 'relative' }}>

      {/* popup */}
      {showAttach && (
        <div className="attach-popup" id="attachPopup">
          <div className="attach-grid">
            {[
              { icon: 'fa-image',               color: '#2196f3', label: 'Photo / Video' },
              { icon: 'fa-file-alt',             color: '#ff9800', label: 'Docs'         },
              { icon: 'fa-music',                color: '#e91e63', label: 'Audio'        },
              { icon: 'fa-square-poll-vertical', color: '#9c27b0', label: 'Poll'         },
              { icon: 'fa-location-dot',         color: '#4caf50', label: 'Location'     },
            ].map(item => (
              <button
                key={item.label}
                className="attach-tile"
                onClick={() => setShowAttach(false)}
              >
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji */}
      {showEmoji && (
        <div className="emoji-panel" id="emojiPanel">
          <div className="emoji-scroll">
            {EMOJIS.map(e => (
              <span
                key={e}
                style={{ cursor: 'pointer' }}
                onClick={() => insertEmoji(e)}
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-input-bar">
        {/* Attach button */}
        <button
          className="input-icon-btn"
          id="attachBtn"
          title="Attach"
          onClick={e => { e.stopPropagation(); setShowAttach(o => !o); setShowEmoji(false); }}
          disabled={disabled}
        >
          <i className="fa-solid fa-plus" />
        </button>

        {/* Text input + emoji + camera */}
        <div className="input-field-wrap">
          <input
            id="msgInput"
            type="text"
            placeholder={disabled ? 'Select a chat to start messaging…' : 'Send a message...'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
          />
          <button
            className="emoji-btn"
            id="emojiBtn"
            title="Emoji"
            onClick={e => { e.stopPropagation(); setShowEmoji(o => !o); setShowAttach(false); }}
            disabled={disabled}
          >
            <i className="fa-regular fa-face-smile" />
          </button>
          <button className="input-icon-btn cam-btn" title="Camera" disabled={disabled}>
            <i className="fa-solid fa-camera" />
          </button>
        </div>

        {/* Send button */}
        <button
          className="send-btn"
          id="sendBtn"
          title="Send"
          onClick={handleSend}
          disabled={disabled}
        >
          <i className="fa-solid fa-arrow-right" />
        </button>
      </div>
    </div>
  );
}
