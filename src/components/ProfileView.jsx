import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileView() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const email    = user?.email ?? '';
  const initials = email ? email[0].toUpperCase() : 'U';

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="rp-view" id="view-profile">
      <div className="page-header">
        <h2>Profile</h2>
      </div>

      <div className="scrollable-content">

        {/* Avatar + name */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="avatar av-self profile-big-av">{initials}</div>
            <button className="av-cam" title="Change photo">
              <i className="fa-solid fa-camera" />
            </button>
          </div>
          <div>
            <div className="profile-name">{email.split('@')[0]}</div>
            <div className="profile-about">Hey there! I am using Pulse</div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="info-section">
          <div className="section-label">Personal Info</div>

          <div className="info-row">
            <div className="info-icon" style={{ background: '#1a3a5c' }}>
              <i className="fa-solid fa-user" />
            </div>
            <div className="info-body">
              <div className="info-label">Name</div>
              <div className="info-val">{email.split('@')[0]}</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>

          <div className="info-row">
            <div className="info-icon" style={{ background: '#1a3a2c' }}>
              <i className="fa-solid fa-circle-info" />
            </div>
            <div className="info-body">
              <div className="info-label">About</div>
              <div className="info-val">Hey there! I am using Pulse</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>

          <div className="info-row">
            <div className="info-icon" style={{ background: '#1a2c3a' }}>
              <i className="fa-solid fa-envelope" />
            </div>
            <div className="info-body">
              <div className="info-label">Email</div>
              <div className="info-val">{email}</div>
            </div>
          </div>

          <div className="info-row">
            <div className="info-icon" style={{ background: '#2c1a1a' }}>
              <i className="fa-solid fa-phone" />
            </div>
            <div className="info-body">
              <div className="info-label">Phone</div>
              <div className="info-val">Not set</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>
        </div>

        {/* Settings */}
        <div className="settings-section">
          <div className="section-label">Settings</div>

          <div className="settings-row">
            <div className="info-icon" style={{ background: '#1a3a2c' }}>
              <i className="fa-solid fa-gear" />
            </div>
            <div className="info-body">
              <div className="info-val">App Settings</div>
            </div>
            <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="settings-row">
            <div className="info-icon" style={{ background: '#1a2c3a' }}>
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div className="info-body">
              <div className="info-val">Privacy &amp; Security</div>
            </div>
            <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="settings-row">
            <div className="info-icon" style={{ background: '#2c1a1a' }}>
              <i className="fa-solid fa-circle-question" />
            </div>
            <div className="info-body">
              <div className="info-val">Help Center</div>
            </div>
            <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Logout */}
        <button className="logout-btn" id="profile-logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket" />
          Log Out
        </button>

        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          © 2026 Pulse ChatApp
        </div>

      </div>
    </div>
  );
}
