import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput  from './MessageInput';


const chatData = {
  preetam: {
    name: 'Preetam Chemistry',
    initials: 'PC',
    av: 'av2',
    status: 'Online',
    messages: [
      { type: 'recv', text: 'Hey! How are you?',                                    time: '4:38 PM' },
      { type: 'sent', text: "I'm doing great! Just finished a project I've been working on.", time: '4:40 PM' },
      { type: 'recv', text: 'That sounds awesome! What was it about?',               time: '4:42 PM' },
      { type: 'sent', text: "It's a messaging app design. Want to see it?",          time: '4:43 PM' },
      { type: 'recv', text: 'Absolutely! Send it over',                              time: '4:44 PM' },
      { type: 'recv', text: "I'd love to give you some feedback",                    time: '4:44 PM' },
    ],
  },
  rohan: {
    name: 'Rohan Roomie',
    initials: 'RR',
    av: 'av1',
    status: 'Online',
    messages: [
      { type: 'recv', text: 'Hey When are you going college?', time: '6:00 PM' },
      { type: 'sent', text: 'Leaving in 10 mins!',             time: '6:05 PM' },
    ],
  },
  uday: {
    name: 'Uday Sanp',
    initials: 'US',
    av: 'av6',
    status: 'Online',
    messages: [
      { type: 'sent', text: 'Hey Uday, how are you doing?', time: '8:00 PM' },
      { type: 'recv', text: 'All good! You?',               time: '8:05 PM' },
    ],
  },
  devteam: {
    name: 'Dev Team',
    initials: 'DT',
    av: 'av7',
    status: '3 members online',
    messages: [
      { type: 'recv', text: 'Team standup in 5 mins',         time: '9:00 AM' },
      { type: 'sent', text: 'On my way',                   time: '9:01 AM' },
      { type: 'recv', text: 'Ravi: Push the update ASAP!',    time: '9:10 AM' },
      { type: 'sent', text: 'Done! Pushed to main branch', time: '9:25 AM' },
    ],
  },
  mom: {
    name: 'Maa',
    initials: 'Ma',
    av: 'av8',
    status: 'last seen 1h ago',
    messages: [
      { type: 'recv', text: 'Beta, did you have lunch?',    time: 'Yesterday' },
      { type: 'sent', text: 'Yes mom, had rice and dal', time: 'Yesterday' },
      { type: 'recv', text: 'Good! Drink water too',     time: 'Yesterday' },
      { type: 'recv', text: 'Did you eat? Call me!',         time: 'Yesterday' },
    ],
  },
};

const autoReplies = ['Got it, thanks', 'Totally agree', 'Amazing!', 'On it!'];

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


export default function ChatWindow({
  activeChatId,
  messages,
  onNewMessages,
  typingVisible,
  onTyping,
  onBackClick,
}) {
  const areaRef = useRef(null);

  useEffect(() => {
    if (areaRef.current) {
      areaRef.current.scrollTop = areaRef.current.scrollHeight;
    }
  }, [messages, typingVisible]);


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

  const chat = chatData[activeChatId];
  if (!chat) return null;


  function handleSend(text) {
    const newMsg = { type: 'sent', text, time: getTime() };
    const updated = [...messages, newMsg];
    onNewMessages(updated);


    onTyping(true);
    setTimeout(() => {
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      onTyping(false);
      onNewMessages(prev => [...prev, { type: 'recv', text: reply, time: getTime() }]);
    }, 1600 + Math.random() * 900);
  }

  return (
    <div className="chat-window" id="view-chat">


      <div className="chat-header">
        <button className="icon-btn mobile-back" id="chatBackBtn" onClick={onBackClick}>
          <i className="fa-solid fa-chevron-left" />
        </button>

        <div className="chat-header-info" id="chatHeaderInfo">
          <div className={`chat-hdr-avatar ${chat.av}`} id="chatHdrAvatar">
            {chat.initials}
          </div>
          <div>
            <div className="chat-hdr-name" id="chatHdrName">{chat.name}</div>
            <div className="chat-hdr-status" id="chatHdrStatus">{chat.status}</div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="icon-btn" title="Voice Call">
            <i className="fa-solid fa-phone" />
          </button>
          <button className="icon-btn" id="chatDotsBtn" title="More">
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
        </div>
      </div>


      <div className="messages-area" id="messagesArea" ref={areaRef}>
        <div className="date-chip"><span>Today</span></div>

        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            text={msg.text}
            isSent={msg.type === 'sent'}
            time={msg.time}
          />
        ))}


        {typingVisible && (
          <div className="typing-bubble" id="typingBubble">
            <div className="t-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>


      <MessageInput onSend={handleSend} disabled={false} />
    </div>
  );
}

export { chatData };
