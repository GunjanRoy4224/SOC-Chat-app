import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const contacts = [
  { id: 'preetam',  name: 'Preetam Chemistry', initials: 'PC', av: 'av2', time: '4:44 PM',   preview: "I'd love to give you some feedback", badge: 2,    type: 'all' },
  { id: 'rohan',    name: 'Rohan Roomie',       initials: 'RR', av: 'av1', time: '6:05 PM',   preview: 'Leaving in 10 mins!',                badge: null, type: 'all' },
  { id: 'moksh',    name: 'Moksh Desai',        initials: 'MD', av: 'av3', time: '3:02 AM',   preview: "Hey! What's up?",                    badge: 1,    type: 'unread' },
  { id: 'uday',     name: 'Uday Sanp',          initials: 'US', av: 'av6', time: '8:05 PM',   preview: 'All good! You?',                     badge: null, type: 'all' },
  { id: 'devteam',  name: 'Dev Team',           initials: 'DT', av: 'av7', time: '9:25 AM',   preview: 'Done! Pushed to main branch ✅',      badge: 3,    type: 'groups' },
  { id: 'mom',      name: 'Maa ❤️',            initials: 'Ma', av: 'av8', time: 'Yesterday', preview: 'Did you eat? Call me!',               badge: null, type: 'fav', star: true },
];

const Filters = ['all', 'unread', 'groups', 'fav'];

export default function Sidebar({ activeChatId, onSelectChat, onToggleTheme, onViewChange }) {
  const [searchQ,      setSearchQ]   = useState('');
  const [activeFilter, setFilter]    = useState('all');
  const [menuOpen,     setMenuOpen]  = useState(false);
  const [activeNav,    setActiveNav] = useState('chats');

  const { signOut } = useAuth();
  const navigate    = useNavigate();

  const visible = contacts.filter(con => {
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
          <button className="icon-btn" title="New Group">
            <i className="fa-solid fa-users" />
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
            <div className="dd-item"><i className="fa-solid fa-user-plus" />New Chat</div>
            <div className="dd-item"><i className="fa-solid fa-star" />My Chat</div>
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

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            id="searchInput"
            placeholder="Search new chat.."
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
        {visible.length === 0 && (
          <li className="no-results">
            <i className="fa-solid fa-comment-slash" />
            <p>No chats</p>
          </li>
        )}
        {visible.map((c, i) => (
          <li
            key={c.id}
            className={`contact-card${activeChatId === c.id ? ' active-card' : ''}`}
            data-id={c.id}
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => { onSelectChat(c.id); setActiveNav('chats'); }}
          >
            <div className={`avatar ${c.av}`}>{c.initials}</div>
            <div className="card-body">
              <div className="card-row">
                <span className="card-name">{c.name}</span>
                <span className="card-time">{c.time}</span>
              </div>
              <div className="card-row">
                <span className="card-preview">{c.preview}</span>
                {c.badge && <span className="badge">{c.badge}</span>}
                {c.star && <span style={{ fontSize: '12px' }}>⭐</span>}
              </div>
            </div>
          </li>
        ))}
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