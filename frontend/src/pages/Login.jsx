import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cross, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      // Expect { token, user }
      localStorage.setItem('sh_token', data.token);
      localStorage.setItem('sh_user', JSON.stringify(data.user));
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      if (msg) {
        setError(msg);
      } else if (err?.response?.status === 401) {
        setError('Invalid username or password.');
      } else if (err?.code === 'ECONNREFUSED' || err?.code === 'ERR_NETWORK') {
        // Backend offline — accept demo credentials and issue a fake token
        if (username === 'admin' && password === 'smarthealth123') {
          const fakeToken = btoa(JSON.stringify({ sub: 1, username: 'admin', role: 'admin', exp: Date.now() + 86400000 }));
          localStorage.setItem('sh_token', fakeToken);
          localStorage.setItem('sh_user', JSON.stringify({ id: 1, username: 'admin', name: 'Admin User', role: 'admin' }));
          navigate('/', { replace: true });
        } else {
          setError('Backend offline. Use demo credentials: admin / smarthealth123');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '20%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 16px',
          background: 'rgba(13, 17, 27, 0.85)',
          border: '1px solid rgba(0,212,170,0.18)',
          borderRadius: 24,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,212,170,0.08)',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--accent-teal), #00a8ff)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(0,212,170,0.35)',
          }}>
            <Cross size={26} color="#020d0a" strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em',
            color: 'var(--text-primary)', marginBottom: 6,
          }}>
            SmartHealth
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            PHC/CHC AI Management System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)',
              display: 'block', marginBottom: 8, letterSpacing: '0.03em',
            }}>
              USERNAME
            </label>
            <input
              id="sh-username"
              className="input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              autoFocus
              autoComplete="username"
              style={{ fontSize: '0.9rem', padding: '10px 14px' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)',
              display: 'block', marginBottom: 8, letterSpacing: '0.03em',
            }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="sh-password"
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                style={{ fontSize: '0.9rem', padding: '10px 40px 10px 14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-teal)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: '0.8rem',
                color: 'var(--accent-red)',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            id="sh-login-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', fontWeight: 600 }}
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,212,170,0.3)' }}
            whileTap={{ scale: 0.98 }}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : <><LogIn size={17} /> Sign In</>
            }
          </motion.button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 24,
          background: 'rgba(0,212,170,0.05)',
          border: '1px solid rgba(0,212,170,0.15)',
          borderRadius: 12,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <ShieldCheck size={14} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-teal)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Demo Credentials
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Username</div>
              <button
                type="button"
                onClick={() => setUsername('admin')}
                style={{
                  fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700,
                  color: 'var(--text-primary)', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                  padding: '3px 10px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                title="Click to autofill"
              >
                admin
              </button>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Password</div>
              <button
                type="button"
                onClick={() => setPassword('smarthealth123')}
                style={{
                  fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700,
                  color: 'var(--text-primary)', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                  padding: '3px 10px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                title="Click to autofill"
              >
                smarthealth123
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 10 }}>
            Click the values above to auto-fill. Works offline with mock data.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
