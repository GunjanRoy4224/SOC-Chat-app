export default function SettingsView({ onBack }) {
  return (
    <div className="rp-view" id="view-settings">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="icon-btn mobile-back" onClick={onBack} style={{ display: 'block' }}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <h2 style={{margin:0}}>Settings</h2>
      </div>
      <div className="scrollable-content">
        <div className="info-section">
          <div className="section-label">Notifications</div>
          <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid var(--border)'}}>
            <div style={{display:'flex', gap: '15px', alignItems: 'center'}}>
              <i className="fa-solid fa-bell" style={{color:'#f59e0b', fontSize: 20}} />
              <div>
                <div className="info-val">Message Notifications</div>
                <div className="info-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Enabled</div>
              </div>
            </div>
            <label className="tgl"><input type="checkbox" defaultChecked /><span className="tgl-s"></span></label>
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Privacy & Security</div>
          <div className="settings-row">
            <div className="info-icon" style={{background:'#1a3a2c'}}><i className="fa-solid fa-lock" /></div>
            <div className="info-body"><div className="info-val">Privacy</div></div>
            <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
          </div>
          <div className="settings-row">
            <div className="info-icon" style={{background:'#1a2c3a'}}><i className="fa-solid fa-shield-halved" /></div>
            <div className="info-body"><div className="info-val">Security</div></div>
            <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
          </div>
        </div>

        <div className="info-section">
          <div className="section-label">Others</div>
          <div className="settings-row">
            <div className="info-icon" style={{background:'#1a3a2c'}}><i className="fa-solid fa-database" /></div>
            <div className="info-body">
              <div className="info-val">Storage</div>
              <div className="info-label">1.2 GB used</div>
            </div>
            <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
          </div>
          <div className="settings-row">
            <div className="info-icon" style={{background:'#2c1a1a'}}><i className="fa-solid fa-circle-question" /></div>
            <div className="info-body"><div className="info-val">Help & Feedback</div></div>
            <i className="fa-solid fa-chevron-right" style={{color:'var(--text-muted)'}} />
          </div>
        </div>

      </div>
    </div>
  );
}
