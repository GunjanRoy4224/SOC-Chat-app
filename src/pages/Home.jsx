import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ProfileView from '../components/ProfileView';
import SettingsView from '../components/SettingsView';
import CallsView from '../components/CallsView';
import CommunityView from '../components/CommunityView';

export default function Home() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('chats');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  function handleSelectChat(id) {
    setCurrentView('chats');
    navigate(`/room/${id}`);
  }

  function handleViewChange(view) {
    setCurrentView(view);
    if (view !== 'chats') navigate('/');
  }

  function handleBackClick() {
    navigate('/');
  }

  const showProfile = currentView === 'profile';
  const showSettings = currentView === 'settings';
  const showCalls = currentView === 'calls';
  const showCommunity = currentView === 'community';

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
        style={{ display: window.innerWidth <= 768 && !roomId && !showProfile && !showSettings && !showCalls && !showCommunity ? 'none' : 'flex' }}
      >
        {showProfile ? (
          <ProfileView />
        ) : showSettings ? (
          <SettingsView onBack={() => handleViewChange('chats')} />
        ) : showCalls ? (
          <CallsView />
        ) : showCommunity ? (
          <CommunityView />
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
