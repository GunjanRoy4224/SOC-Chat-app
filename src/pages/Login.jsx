import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import pulseLogo from '../assets/pulse-logo.png';

export default function Login() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [alertMsg,    setAlertMsg]    = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  function validate() {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAlertMsg(null);
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setAlertMsg({ type: 'error', text: error.message });
      return;
    }

    navigate('/', { replace: true });
  }

  const renderError = (name) => {
    if (!fieldErrors[name]) return null;
    return (
      <span className="auth-error-msg" role="alert">
        <i className="fa-solid fa-circle-exclamation" />
        {fieldErrors[name]}
      </span>
    );
  };

  return (
    <AuthLayout>
      <div className="auth-card" role="main">

        <div className="auth-logo-section">
          <div className="auth-logo-wrap">
            <img src={pulseLogo} alt="Pulse logo" className="auth-logo-img" />
          </div>
          <span className="auth-brand-name">Pulse</span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Pulse — Secure & Instant Chat</p>

        {alertMsg && (
          <div className={`auth-alert ${alertMsg.type}`} role="alert">
            <i className={alertMsg.type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'} />
            {alertMsg.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin} noValidate>

          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">Email Address</label>
            <div className="auth-input-wrap">
              <i className="fa-solid fa-envelope auth-input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className={`auth-input${fieldErrors.email ? ' error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                autoComplete="email"
                autoFocus
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {renderError('email')}
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <i className="fa-solid fa-lock auth-input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className={`auth-input has-right-icon${fieldErrors.password ? ' error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                autoComplete="current-password"
                aria-invalid={!!fieldErrors.password}
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide' : 'Show'}>
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
            {renderError('password')}
          </div>

          <div className="auth-forgot-row">
            <span />
            <a
              href="#forgot"
              id="forgot-password-link"
              className="auth-forgot-link"
              onClick={e => { e.preventDefault(); setAlertMsg({ type: 'success', text: 'Password reset coming soon!' }); }}
            >
              Forgot Password?
            </a>
          </div>

          <button id="login-submit-btn" type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <><span className="auth-spinner" aria-hidden="true" />Signing In…</>
            ) : (
              <>Log In</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Create account{' '}
          <Link to="/signup" id="goto-signup-link">Sign Up</Link>
        </p>
      </div>
    </AuthLayout>
  );
}