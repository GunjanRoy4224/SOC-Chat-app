import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ProfileView from '../components/ProfileView';
import SettingsView from '../components/SettingsView';
import CallsView from '../components/CallsView';

export default function Home() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('chats');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [theme]);

  function handleSelectChat(id) {
    setCurrentView('chats');
    navigate(`/room/${id}`);
  }

  function handleViewChange(view) {
    setCurrentView(view);
  }

  function handleBackClick() {
    navigate('/');
  }

  const showProfile = currentView === 'profile';
  const showSettings = currentView === 'settings';
  const showCalls = currentView === 'calls';

  return (
    <div className="Pulse-app">
      <Sidebar
        activeChatId={roomId}
        onSelectChat={handleSelectChat}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onViewChange={handleViewChange}
      />

      <main
        className="right-panel"
        style={{ 
          flex: 1,
          flexDirection: 'column',
          minWidth: 0,
          display: window.innerWidth <= 768 && !roomId && !showProfile && !showSettings && !showCalls ? 'none' : 'flex' 
        }}
      >
        {showProfile ? (
          <ProfileView />
        ) : showSettings ? (
          <SettingsView onBack={() => handleViewChange('chats')} />
        ) : showCalls ? (
          <CallsView />
        ) : (
          <ChatWindow
            activeChatId={roomId}
            onBackClick={handleBackClick}
          />
        )}
      </main>
    </div>
  );
}
