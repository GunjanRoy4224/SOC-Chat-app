import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateRSAKeyPair } from '../lib/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setOnlineUsers({});
      return;
    }

    const initEncryption = async () => {
      const storedPrivKey = localStorage.getItem(`pulse_priv_key_${user.id}`);
      if (!storedPrivKey) {
        try {
          console.log("Generating new RSA keys for E2E encryption...");
          const { publicKey, privateKey } = await generateRSAKeyPair();
          localStorage.setItem(`pulse_priv_key_${user.id}`, privateKey);
          await supabase.from('users').update({ public_key: publicKey }).eq('id', user.id);
        } catch(err) {
          console.error("Failed to generate RSA keys", err);
        }
      }
    };
    initEncryption();

    const updateLastSeen = async () => {
      await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    };
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000);

    const channel = supabase.channel('global_presence', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = {};
        for (const [key, presences] of Object.entries(state)) {
          if (presences.length > 0) online[key] = true;
        }
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [user]);

  async function signOut() {
    if (user) await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, onlineUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
