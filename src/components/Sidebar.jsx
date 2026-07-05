import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateAESKey, encryptRoomKey } from '../lib/crypto';

const Filters = ['all', 'unread', 'groups', 'fav'];

export default function Sidebar({ activeChatId, onSelectChat, onToggleTheme, onViewChange }) {
  const [searchQ,      setSearchQ]   = useState('');
  const [activeFilter, setFilter]    = useState('all');
  const [menuOpen,     setMenuOpen]  = useState(false);
  const [activeNav,    setActiveNav] = useState('chats');
  
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // New Chat Modal State
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);

  const { user, signOut, onlineUsers } = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    if (!user) return;

    async function loadRooms() {
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          room_id,
          rooms (
            id,
            type,
            created_at,
            room_participants (
              user_id,
              users (
                id,
                username,
                avatar_url,
                last_seen
              )
            )
          )
        `)
        .eq('user_id', user.id);
        
      if (data && !error) {
        const formatted = data.map(rp => {
          const room = rp.rooms;
          const others = room.room_participants.filter(p => p.user_id !== user.id).map(p => p.users);
          
          let name = 'Empty Room';
          if (room.type === 'direct') {
            name = others[0]?.username || 'Unknown User';
          } else {
            name = others.map(u => u.username).join(', ') || 'Group Chat';
          }
          
          return {
            id: room.id,
            name,
            type: room.type === 'direct' ? 'all' : 'groups',
            initials: name.substring(0, 2).toUpperCase(),
            time: new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            otherUserIds: others.map(o => o.id)
          };
        });
        
        // Sort rooms by created_at desc for now (latest first)
        formatted.sort((a,b) => new Date(b.time) - new Date(a.time));
        setRooms(formatted);
      }
      setLoadingRooms(false);
    }
    
    loadRooms();

    // Subscribe to new rooms
    const subscription = supabase.channel('room_participants_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_participants', filter: `user_id=eq.${user.id}` }, () => {
        loadRooms(); // reload all rooms if added to a new one
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Search users for new chat
  useEffect(() => {
    if (newChatSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username, mobile_number')
        .neq('id', user.id)
        .or(`username.ilike.%${newChatSearch}%,mobile_number.ilike.%${newChatSearch}%`)
        .limit(10);
      
      if (data) setSearchResults(data);
    }, 400);
    return () => clearTimeout(timer);
  }, [newChatSearch, user]);

  async function handleCreateDirectChat(targetUser) {
    setCreatingChat(true);
    // Check if room already exists
    const existingRoom = rooms.find(r => r.type === 'all' && r.otherUserIds.includes(targetUser.id));
    if (existingRoom) {
      onSelectChat(existingRoom.id);
      setShowNewChat(false);
      setCreatingChat(false);
      return;
    }

    // Create new room
    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert({ type: 'direct', created_by: user.id })
      .select()
      .single();

    if (newRoom && !roomError) {
      const { data: fullTargetUser } = await supabase.from('users').select('public_key').eq('id', targetUser.id).single();
      const { data: myUser } = await supabase.from('users').select('public_key').eq('id', user.id).single();
      
      const roomAesKey = await generateAESKey();
      const myEncryptedKey = await encryptRoomKey(roomAesKey, myUser?.public_key);
      const targetEncryptedKey = await encryptRoomKey(roomAesKey, fullTargetUser?.public_key);

      // Add participants
      await supabase.from('room_participants').insert([
        { room_id: newRoom.id, user_id: user.id, is_admin: true, encrypted_room_key: myEncryptedKey },
        { room_id: newRoom.id, user_id: targetUser.id, is_admin: false, encrypted_room_key: targetEncryptedKey }
      ]);
      
      setShowNewChat(false);
      onSelectChat(newRoom.id);
    }
    setCreatingChat(false);
  }

  const visible = rooms.filter(con => {
    const matchFilter = activeFilter === 'all' || con.type === activeFilter;
    const matchSearch = con.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchFilter && matchSearch;
  });

  function handleNavClick(view) {
    setActiveNav(view);
    onViewChange(view === 'chats' ? 'chats' : view);
  }

  async function handleLogout() {
    setMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar" id="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-text">Pulse</span>
        </div>
        <div className="sidebar-header-icons">
          <button className="icon-btn" title="New Chat" onClick={() => setShowNewChat(true)}>
            <i className="fa-solid fa-plus" />
          </button>
          <button
            className="icon-btn"
            id="sidebarDotsBtn"
            title="Menu"
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
        </div>

        {menuOpen && (
          <div className="dropdown-menu" id="sidebarDropdown">
            <div className="dd-item" onClick={() => { setShowNewChat(true); setMenuOpen(false); }}><i className="fa-solid fa-user-plus" />New Chat</div>
            <div className="dd-item" onClick={() => { setMenuOpen(false); }}><i className="fa-solid fa-star" />My Chat</div>
            <div className="dd-item" onClick={() => { onToggleTheme(); setMenuOpen(false); }}>
              <i className="fa-solid fa-moon" />Theme
            </div>
            <div className="dd-item" onClick={() => { onViewChange('settings'); setMenuOpen(false); }}>
              <i className="fa-solid fa-gear" />Settings
            </div>
            <div className="dd-separator" />
            <div className="dd-item danger" id="sidebar-logout-btn" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" />Log Out
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-main)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
           <div className="sidebar-header">
             <button className="icon-btn" onClick={() => setShowNewChat(false)}>
               <i className="fa-solid fa-arrow-left" />
             </button>
             <div className="sidebar-logo"><span className="logo-text">New Chat</span></div>
           </div>
           <div className="sidebar-search">
             <div className="search-wrap">
               <i className="fa-solid fa-magnifying-glass" />
               <input autoFocus type="text" placeholder="Search username or phone..." value={newChatSearch} onChange={e => setNewChatSearch(e.target.value)} />
             </div>
           </div>
           <ul className="contacts-list">
             {creatingChat ? <li className="no-results"><p>Creating chat...</p></li> : 
              searchResults.map(u => (
                <li key={u.id} className="contact-card" onClick={() => handleCreateDirectChat(u)}>
                  <div className="avatar av1">{u.username.substring(0,2).toUpperCase()}</div>
                  <div className="card-body">
                    <div className="card-row"><span className="card-name">@{u.username}</span></div>
                    <div className="card-row"><span className="card-preview">{u.mobile_number}</span></div>
                  </div>
                </li>
             ))}
             {!creatingChat && searchResults.length === 0 && newChatSearch.length > 1 && (
                <li className="no-results"><p>No users found.</p></li>
             )}
           </ul>
        </div>
      )}

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            id="searchInput"
            placeholder="Search chats.."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <button className="search-clear" onClick={() => setSearchQ('')}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {Filters.map(f => (
          <button
            key={f}
            className={`ftab${activeFilter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Contacts List */}
      <ul className="contacts-list" id="contactsList">
        {loadingRooms ? (
          <li className="no-results"><p>Loading...</p></li>
        ) : visible.length === 0 ? (
          <li className="no-results">
            <i className="fa-solid fa-comment-slash" />
            <p>No chats</p>
          </li>
        ) : visible.map((c, i) => {
          const isOnline = c.otherUserIds.some(id => onlineUsers?.[id]);
          return (
            <li
              key={c.id}
              className={`contact-card${activeChatId === c.id ? ' active-card' : ''}`}
              data-id={c.id}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => { onSelectChat(c.id); setActiveNav('chats'); }}
            >
              <div style={{ position: 'relative' }}>
                <div className="avatar av1">{c.initials}</div>
                {isOnline && <div style={{position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '50%', border: '2px solid var(--bg-main)'}} />}
              </div>
              <div className="card-body">
                <div className="card-row">
                  <span className="card-name">{c.name}</span>
                  <span className="card-time">{c.time}</span>
                </div>
                <div className="card-row">
                  <span className="card-preview">{c.type === 'groups' ? 'Group Chat' : 'Direct Message'}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Bottom Nav */}
      <nav className="sidebar-nav">
        {[
          { view: 'chats',     icon: 'fa-message',      label: 'Chats'     },
          { view: 'calls',     icon: 'fa-phone',        label: 'Calls'     },
          { view: 'community', icon: 'fa-people-group', label: 'Community' },
          { view: 'profile',   icon: 'fa-user',         label: 'Profile'   },
        ].map(item => (
          <button
            key={item.view}
            className={`nav-btn${activeNav === item.view ? ' active' : ''}`}
            title={item.label}
            onClick={() => handleNavClick(item.view)}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}