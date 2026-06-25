import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './pages/Signup';
import Login  from './pages/Login';
import Home   from './pages/Home';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"      element={<Signup />} />
        <Route path="/login" element={<Login />}  />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
