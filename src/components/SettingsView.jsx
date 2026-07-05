import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function SettingsView({ onBack }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('main'); // main, privacy, notifications, feedback
  const [feedbackType, setFeedbackType] = useState('Issue');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!feedbackText.trim() || !user) return;
    setFeedbackStatus('Submitting...');
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type: feedbackType,
      description: feedbackText
    });
    if (error) {
      setFeedbackStatus('Failed to submit. Please try again.');
    } else {
      setFeedbackStatus('Feedback submitted successfully!');
      setFeedbackText('');
    }
  }

  return (
    <div className="rp-view" id="view-settings">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="icon-btn" onClick={() => activeTab === 'main' ? onBack() : setActiveTab('main')} style={{ display: 'block' }}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <h2 style={{margin:0}}>
          {activeTab === 'main' ? 'Settings' : activeTab === 'feedback' ? 'Help & Feedback' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
      </div>
      <div className="scrollable-content">
        
        {activeTab === 'main' && (
          <>
            <div className="info-section">
              <div className="section-label">Account & Privacy</div>
              <div className="settings-row" onClick={() => setActiveTab('privacy')} style={{ cursor: 'pointer' }}>
                <div className="info-icon" style={{background:'#1a3a2c'}}><i className="fa-solid fa-lock" /></div>
                <div className="info-body"><div className="info-val">Privacy & Security</div></div>
                <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
              </div>
            </div>

            <div className="info-section">
              <div className="section-label">Preferences</div>
              <div className="settings-row" onClick={() => setActiveTab('notifications')} style={{ cursor: 'pointer' }}>
                <div className="info-icon" style={{background:'#3a2c1a'}}><i className="fa-solid fa-bell" /></div>
                <div className="info-body"><div className="info-val">Notifications</div></div>
                <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
              </div>
            </div>

            <div className="info-section">
              <div className="section-label">Support</div>
              <div className="settings-row" onClick={() => setActiveTab('feedback')} style={{ cursor: 'pointer' }}>
                <div className="info-icon" style={{background:'#1a2c3a'}}><i className="fa-solid fa-circle-question" /></div>
                <div className="info-body"><div className="info-val">Help & Feedback</div></div>
                <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'privacy' && (
          <div className="info-section" style={{ padding: '20px' }}>
            <p style={{ color: 'var(--text-sub)' }}>Privacy & Security settings will go here. All chats are currently end-to-end encrypted using AES-GCM and RSA-OAEP keys.</p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="info-section">
             <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid var(--border)'}}>
              <div style={{display:'flex', gap: '15px', alignItems: 'center'}}>
                <i className="fa-solid fa-bell" style={{color:'#f59e0b', fontSize: 20}} />
                <div>
                  <div className="info-val">Message Notifications</div>
                  <div className="info-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Play sounds and show alerts</div>
                </div>
              </div>
              <label className="tgl"><input type="checkbox" defaultChecked /><span className="tgl-s"></span></label>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="info-section" style={{ padding: '20px', background: 'transparent', border: 'none' }}>
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-sub)', fontSize: '13px' }}>Type of Feedback</label>
                <select 
                  value={feedbackType} 
                  onChange={e => setFeedbackType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-main)', outline: 'none' }}
                >
                  <option>Issue</option>
                  <option>Feature Request</option>
                  <option>Bug Report</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-sub)', fontSize: '13px' }}>Description</label>
                <textarea 
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Describe your issue or idea here..."
                  style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-main)', resize: 'vertical', outline: 'none' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={!feedbackText.trim()}
                style={{ padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: feedbackText.trim() ? 1 : 0.6 }}
              >
                Submit Feedback
              </button>
              {feedbackStatus && (
                <div style={{ textAlign: 'center', fontSize: '14px', color: feedbackStatus.includes('success') ? 'var(--incoming-g)' : 'var(--text-sub)' }}>
                  {feedbackStatus}
                </div>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
