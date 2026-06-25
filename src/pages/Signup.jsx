import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import pulseLogo from '../assets/pulse-logo.png';

export default function Signup() {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [alertMsg,        setAlertMsg]        = useState(null);
  const [fieldErrors,     setFieldErrors]     = useState({});

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
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setAlertMsg(null);
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setAlertMsg({ type: 'error', text: error.message });
      return;
    }

    if (data.session) {
      setAlertMsg({ type: 'success', text: 'Account created! Redirecting…' });
      setTimeout(() => navigate('/home', { replace: true }), 800);
    } else {
      setAlertMsg({
        type: 'success',
        text: 'Account created! Please check your email to confirm your account.',
      });
    }
  }

  function FieldError({ name }) {
    if (!fieldErrors[name]) return null;
    return (
      <span className="auth-error-msg" role="alert">
        <i className="fa-solid fa-circle-exclamation" />
        {fieldErrors[name]}
      </span>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-card" role="main">

        <div className="auth-logo-section">
          <div className="auth-logo-wrap">
            <img src={pulseLogo} alt="Pulse logo" className="auth-logo-img" />
          </div>
          <span className="auth-brand-name">Pulse</span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Connect Using Pulse, Secure & Instant</p>

        {alertMsg && (
          <div className={`auth-alert ${alertMsg.type}`} role="alert">
            <i className={alertMsg.type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'} />
            {alertMsg.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup} noValidate>

          <div className="auth-field">
            <label htmlFor="signup-email" className="auth-label">Email Address</label>
            <div className="auth-input-wrap">
              <i className="fa-solid fa-envelope auth-input-icon" aria-hidden="true" />
              <input
                id="signup-email"
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
            <FieldError name="email" />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password" className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <i className="fa-solid fa-lock auth-input-icon" aria-hidden="true" />
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                className={`auth-input has-right-icon${fieldErrors.password ? ' error' : ''}`}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide' : 'Show'}>
                <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
            <FieldError name="password" />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm" className="auth-label">Confirm Password</label>
            <div className="auth-input-wrap">
              <i className="fa-solid fa-shield-halved auth-input-icon" aria-hidden="true" />
              <input
                id="signup-confirm"
                type={showConfirmPass ? 'text' : 'password'}
                className={`auth-input has-right-icon${fieldErrors.confirmPassword ? ' error' : ''}`}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })); }}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPass(v => !v)} aria-label={showConfirmPass ? 'Hide' : 'Show'}>
                <i className={`fa-solid ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
            <FieldError name="confirmPassword" />
          </div>

          <button id="signup-submit-btn" type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <><span className="auth-spinner" aria-hidden="true" />Creating Account…</>
            ) : (
              <>Create Account</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" id="goto-login-link">Log In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}