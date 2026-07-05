import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateAESKey, encryptRoomKey } from '../lib/crypto';
import { useAuth } from '../context/AuthContext';

export default function NewGroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username')
        .neq('id', user.id)
        .ilike('username', `%${search}%`)
        .limit(10);
      if (data) setResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user.id]);

  function toggleUser(u) {
    if (selectedUsers.find(su => su.id === u.id)) {
      setSelectedUsers(prev => prev.filter(su => su.id !== u.id));
    } else {
      setSelectedUsers(prev => [...prev, u]);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!groupName.trim() || !user) return;
    setLoading(true);
    
    // Create the room
    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert({ type: 'group', created_by: user.id, name: groupName })
      .select()
      .single();
      
    if (newRoom && !roomError) {
      const roomAesKey = await generateAESKey();
      
      const { data: myUser } = await supabase.from('users').select('public_key').eq('id', user.id).single();
      const myEncryptedKey = await encryptRoomKey(roomAesKey, myUser?.public_key);
      
      const participants = [{
        room_id: newRoom.id,
        user_id: user.id,
        is_admin: true,
        encrypted_room_key: myEncryptedKey
      }];

      // Add selected users
      for (const u of selectedUsers) {
        const { data: su } = await supabase.from('users').select('public_key').eq('id', u.id).single();
        if (su?.public_key) {
          const uEncKey = await encryptRoomKey(roomAesKey, su.public_key);
          participants.push({
            room_id: newRoom.id,
            user_id: u.id,
            is_admin: false,
            encrypted_room_key: uEncKey
          });
        }
      }
      
      await supabase.from('room_participants').insert(participants);
      onGroupCreated(newRoom.id);
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
        <h3 className="modal-title" style={{ marginTop: 0, color: 'var(--text-main)' }}>New Group</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ color: 'var(--text-sub)', fontSize: '14px' }}>Group Name</label>
            <input 
              type="text" 
              className="auth-input" 
              autoFocus
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="E.g. Family Chat"
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ color: 'var(--text-sub)', fontSize: '14px' }}>Add Members ({selectedUsers.length})</label>
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users to add..."
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
            />
            {results.length > 0 && (
              <div style={{ marginTop: '5px', background: 'var(--bg-panel)', borderRadius: '8px', overflow: 'hidden' }}>
                {results.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => toggleUser(u)}
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedUsers.find(s => s.id === u.id) ? 'var(--bg-active)' : 'transparent' }}
                  >
                    <span style={{ color: 'var(--text-main)' }}>@{u.username}</span>
                    {selectedUsers.find(s => s.id === u.id) && <i className="fa-solid fa-check" style={{ color: 'var(--accent)' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading || !groupName.trim()} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Create Group</button>
          </div>
        </form>
      </div>
    </div>
  );
}
