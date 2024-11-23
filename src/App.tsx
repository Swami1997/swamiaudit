import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import LocationDetailPage from './pages/LocationDetailPage';
import ScoreboardPage from './pages/ScoreboardPage';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';

function AppRoutes() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/Login"
        element={<Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/location/:id"
        element={
          <ProtectedRoute>
            <LocationDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scoreboard/:id"
        element={
          <ProtectedRoute>
            <ScoreboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;