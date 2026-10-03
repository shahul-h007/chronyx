import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LockKey } from '@phosphor-icons/react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    if (!adminEmail || email.toLowerCase() !== adminEmail.toLowerCase()) {
      setErrorMsg('Unauthorized: This portal is restricted to the store owner.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // App.jsx auth listener will automatically redirect to dashboard
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      padding: '24px'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LockKey size={48} color="var(--admin-primary)" weight="duotone" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px', color: 'var(--admin-text)' }}>Admin Portal</h2>
          <p style={{ color: 'var(--admin-text-muted)' }}>Sign in to manage your store</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--admin-danger-subtle)', color: 'var(--admin-danger)', border: '1px solid rgba(185, 28, 28, 0.25)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--admin-text)', fontSize: '0.9rem', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              style={{ width: '100%', padding: '12px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text)', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--admin-text)', fontSize: '0.9rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text)', borderRadius: '8px' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: '12px', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
