import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfileView() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ 
    username: '', 
    name: '',
    email: '', 
    mobile_number: '', 
    about: 'Hey there! I am using Pulse',
    birthday: 'Feb 1, 2006'
  });
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(prev => ({
          ...prev,
          username: data.username || '',
          name: data.username || '',
          email: data.email || user.email || '',
          mobile_number: data.mobile_number || ''
        }));
      } else {
        // Fallback if public.users row is missing
        setProfile(prev => ({
          ...prev,
          username: user.user_metadata?.username || 'Unknown',
          name: user.user_metadata?.username || 'Unknown',
          email: user.email || '',
          mobile_number: user.user_metadata?.mobile_number || 'Not Set',
        }));
      }
    }
    loadProfile();
  }, [user]);

  const initials = profile.username ? profile.username.substring(0, 2).toUpperCase() : 'U';

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  async function handleSaveEdit() {
    if (!editingField || !user) return;
    
    // Only attempt to save to Supabase if it's a real column, otherwise just update local state
    if (['username', 'mobile_number'].includes(editingField)) {
      const { error } = await supabase.from('users').update({ [editingField]: editValue }).eq('id', user.id);
      if (error) {
        alert("Failed to update profile. Username/Phone might already be taken.");
        setEditingField(null);
        return;
      }
    }
    
    setProfile(prev => ({ ...prev, [editingField]: editValue }));
    setEditingField(null);
  }

  return (
    <div className="rp-view" id="view-profile">
      <div className="page-header">
        <h2>Profile</h2>
      </div>

      <div className="scrollable-content">
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="avatar av-self profile-big-av">{initials}</div>
            <button className="av-cam" title="Change photo">
              <i className="fa-solid fa-camera" />
            </button>
          </div>
          <div>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-phone">{profile.mobile_number}</div>
            <div className="profile-about">{profile.about}</div>
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Personal Info</div>

          <div className="info-row" onClick={() => { setEditingField('name'); setEditValue(profile.name); }}>
            <div className="info-icon" style={{ background: '#1a3a5c' }}><i className="fa-solid fa-user" /></div>
            <div className="info-body">
              <div className="info-label">Name</div>
              <div className="info-val">{profile.name}</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>

          <div className="info-row" onClick={() => { setEditingField('username'); setEditValue(profile.username); }}>
            <div className="info-icon" style={{ background: '#1a3a5c' }}><i className="fa-solid fa-at" /></div>
            <div className="info-body">
              <div className="info-label">Username</div>
              <div className="info-val">@{profile.username}</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>

          <div className="info-row" onClick={() => { setEditingField('about'); setEditValue(profile.about); }}>
            <div className="info-icon" style={{ background: '#1a3a2c' }}><i className="fa-solid fa-circle-info" /></div>
            <div className="info-body">
              <div className="info-label">About</div>
              <div className="info-val">{profile.about}</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>

          <div className="info-row" onClick={() => { setEditingField('mobile_number'); setEditValue(profile.mobile_number); }}>
            <div className="info-icon" style={{ background: '#2c1a1a' }}><i className="fa-solid fa-phone" /></div>
            <div className="info-body">
              <div className="info-label">Phone</div>
              <div className="info-val">{profile.mobile_number}</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>

          <div className="info-row">
            <div className="info-icon" style={{ background: '#1a2c3a' }}><i className="fa-solid fa-envelope" /></div>
            <div className="info-body">
              <div className="info-label">Email</div>
              <div className="info-val">{profile.email}</div>
            </div>
          </div>

          <div className="info-row" onClick={() => { setEditingField('birthday'); setEditValue(profile.birthday); }}>
            <div className="info-icon" style={{ background: '#1a2c3a' }}><i className="fa-solid fa-cake-candles" /></div>
            <div className="info-body">
              <div className="info-label">Birthday</div>
              <div className="info-val">{profile.birthday}</div>
            </div>
            <i className="fa-solid fa-pen info-edit" />
          </div>
        </div>

        {/* Logout */}
        <button className="logout-btn" id="profile-logout-btn" onClick={handleLogout} style={{marginTop: '20px'}}>
          <i className="fa-solid fa-right-from-bracket" />
          Log Out
        </button>

        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          © 2026 Pulse ChatApp
        </div>
      </div>

      {editingField && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-main)', padding: 20, borderRadius: 12, width: '80%', maxWidth: 400 }}>
            <h3 style={{ marginTop: 0 }}>Edit {editingField}</h3>
            <input 
              autoFocus 
              value={editValue} 
              onChange={e => setEditValue(e.target.value)} 
              style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-light)' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setEditingField(null)} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
