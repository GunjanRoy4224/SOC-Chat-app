import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show fullscreen loader while Supabase checks the session
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

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated → render the protected page
  return children;
}
