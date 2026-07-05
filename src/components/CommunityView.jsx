import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CommunityView() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedComm, setSelectedComm] = useState(null);

  // Form states
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');

  useEffect(() => {
    async function loadCommunities() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          communities (
            id, name, description, avatar_url, created_at,
            community_groups ( id, room_id ),
            community_members ( id )
          )
        `)
        .eq('user_id', user.id);
        
      if (data && !error) {
        const formatted = data.map(m => m.communities).filter(Boolean);
        setCommunities(formatted);
      }
      setLoading(false);
    }
    loadCommunities();
  }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!cName.trim() || !user) return;
    setLoading(true);

    const { data: newComm, error } = await supabase
      .from('communities')
      .insert({ name: cName, description: cDesc, created_by: user.id })
      .select()
      .single();

    if (newComm && !error) {
      // Add creator as admin
      await supabase.from('community_members').insert({
        community_id: newComm.id,
        user_id: user.id,
        role: 'admin'
      });
      setCommunities(prev => [...prev, { ...newComm, community_groups: [], community_members: [{id: user.id}] }]);
      setShowCreate(false);
      setCName('');
      setCDesc('');
    }
    setLoading(false);
  }

  if (selectedComm) {
    return (
      <div className="rp-view" id="view-community">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="icon-btn" onClick={() => setSelectedComm(null)}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <h2 style={{margin:0}}>{selectedComm.name}</h2>
        </div>
        <div className="scrollable-content" style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '40px', margin: '0 auto 15px' }}>
              {selectedComm.name.substring(0,2).toUpperCase()}
            </div>
            <h3 style={{ color: 'var(--text-main)', margin: '0 0 10px' }}>{selectedComm.name}</h3>
            <p style={{ color: 'var(--text-sub)' }}>{selectedComm.description || 'No description provided.'}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {selectedComm.community_members?.length || 1} members · {selectedComm.community_groups?.length || 0} groups
            </p>
          </div>
          
          <div className="info-section">
            <div className="section-label">Groups in this Community</div>
            {(selectedComm.community_groups?.length || 0) === 0 ? (
              <div style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '14px' }}>No groups yet.</div>
            ) : (
              <div style={{ padding: '15px', color: 'var(--text-muted)' }}>Groups will appear here.</div>
            )}
            <div className="settings-row" style={{ justifyContent: 'center', color: 'var(--accent)', cursor: 'pointer' }}>
              <i className="fa-solid fa-plus" /> Add Group
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-view" id="view-community">
      <div className="page-header"><h2>Community</h2></div>
      <div className="scrollable-content">
        <div className="community-hero" style={{ padding: '30px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <i className="fa-solid fa-people-group" style={{ fontSize: '40px', color: 'var(--accent)', marginBottom: '15px' }}></i>
          <h3 style={{ margin: '0 0 15px', color: 'var(--text-main)' }}>Stay connected with a community</h3>
          <button onClick={() => setShowCreate(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
            <i className="fa-solid fa-plus"></i> Start a Community
          </button>
        </div>
        
        <div className="community-list" style={{ padding: '10px 0' }}>
          {loading ? (
             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sub)' }}>Loading...</div>
          ) : communities.length === 0 ? (
             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sub)' }}>You haven't joined any communities.</div>
          ) : (
             communities.map(c => (
               <div 
                 key={c.id} 
                 className="contact-card" 
                 onClick={() => setSelectedComm(c)}
                 style={{ padding: '15px 20px', cursor: 'pointer' }}
               >
                 <div className="avatar">{c.name.substring(0, 2).toUpperCase()}</div>
                 <div className="card-body">
                   <div className="card-row"><span className="card-name">{c.name}</span></div>
                   <div className="card-row"><span className="card-preview">{c.community_groups?.length || 0} groups · {c.community_members?.length || 1} members</span></div>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 className="modal-title" style={{ marginTop: 0, color: 'var(--text-main)' }}>New Community</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-sub)', fontSize: '14px' }}>Community Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  placeholder="e.g. My Neighborhood"
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ color: 'var(--text-sub)', fontSize: '14px' }}>Description</label>
                <textarea 
                  value={cDesc}
                  onChange={e => setCDesc(e.target.value)}
                  placeholder="What is this community for?"
                  style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', resize: 'vertical' }}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreate(false)} disabled={loading} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading || !cName.trim()} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
