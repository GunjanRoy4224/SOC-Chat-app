import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

export default function AuthLayout({ children }) {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="auth-fullscreen-loader">
        <div className="auth-loader-logo">
          <i className="fa-solid fa-bolt" />
        </div>
        <div className="auth-loader-ring" />
        <p className="auth-loader-text">Loading…</p>
      </div>
    );
  }

  // Already authenticated → go straight to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <div className="auth-page">{children}</div>;
}
