import { useState, useEffect } from 'react';
import '../index.css';
import Sidebar from '../components/Sidebar';
import ChatWindow, { chatData } from '../components/ChatWindow';
import ProfileView from '../components/ProfileView';

export default function Home() {
  const [activeChatId,  setActiveChatId]  = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [typingVisible, setTyping]        = useState(false);
  const [theme,         setTheme]         = useState('light');
  const [currentView,   setCurrentView]   = useState('chats');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  function handleSelectChat(id) {
    setActiveChatId(id);
    setMessages(chatData[id]?.messages ?? []);
    setTyping(false);
    setCurrentView('chats');
  }

  function handleViewChange(view) {
    setCurrentView(view);
    if (view !== 'chats') setActiveChatId(null);
  }

  function handleBackClick() {
    setActiveChatId(null);
    setMessages([]);
    setTyping(false);
  }

  const showProfile = currentView === 'profile';
  const showChat    = !showProfile;

  return (
    <div className="Pulse-app">
      <Sidebar
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onViewChange={handleViewChange}
      />

      <main
        className="right-panel"
        style={{ display: window.innerWidth <= 768 && activeChatId === null && !showProfile ? 'none' : 'flex' }}
      >
        {showProfile ? (
          <ProfileView />
        ) : (
          <ChatWindow
            activeChatId={activeChatId}
            messages={messages}
            onNewMessages={updaterOrArray => setMessages(updaterOrArray)}
            typingVisible={typingVisible}
            onTyping={setTyping}
            onBackClick={handleBackClick}
          />
        )}
      </main>
    </div>
  );
}
