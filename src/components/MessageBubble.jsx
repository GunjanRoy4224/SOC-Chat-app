
export default function MessageBubble({ text, isSent, time }) {
  return (
    <div className={`msg ${isSent ? 'sent' : 'received'}`}>
      <p>{text}</p>
      <span className="msg-time">
        {time}
        {isSent && (
          <i
            className="fa-solid fa-check-double"
            style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}
          />
        )}
      </span>
    </div>
  );
}
