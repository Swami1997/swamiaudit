import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'auth_session';
const ROUTE_STATE_KEY = 'last_route_state';
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ROUTE_STATE_KEY);
    setUser(null);
  }, []);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const pathname = location.pathname.toLowerCase();
        
        // Handle login routes
        if (pathname === '/login' || pathname === '/') {
          const session = localStorage.getItem(SESSION_KEY);
          if (session) {
            const { user: sessionUser, expiresAt } = JSON.parse(session);
            if (new Date(expiresAt) > new Date()) {
              setUser(sessionUser);
              navigate('/dashboard', { replace: true });
            } else {
              clearSession();
            }
          }
          setLoading(false);
          return;
        }

        // Handle protected routes
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) {
          clearSession();
          navigate('/login', { replace: true });
          setLoading(false);
          return;
        }

        const { user: sessionUser, expiresAt } = JSON.parse(session);
        if (new Date(expiresAt) > new Date()) {
          setUser(sessionUser);
          
          // Preload data in background for better performance
          if (sessionUser?.email) {
            preloadData(sessionUser.email).catch(console.error);
          }
        } else {
          clearSession();
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        clearSession();
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [navigate, location.pathname, clearSession]);

  // Save route state on navigation
  useEffect(() => {
    if (user && location.pathname !== '/' && !location.pathname.toLowerCase().includes('login')) {
      const routeState = {
        pathname: location.pathname,
        state: location.state,
        search: location.search
      };
      localStorage.setItem(ROUTE_STATE_KEY, JSON.stringify(routeState));
    }
  }, [location, user]);

  const preloadData = useCallback(async (email: string) => {
    try {
      await Promise.all([
        supabase.from('checklist').select('*').limit(100),
        supabase.from('user_accessible_locations').select('*').eq('user_mail', email)
      ]);
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }, []);

  const verifyEmail = async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('user_mail')
      .ilike('user_mail', email)
      .single();

    if (error || !data) return false;
    return true;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('user_mail', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      throw new Error('Invalid credentials');
    }

    const userData = {
      email: data.user_mail,
      firstName: data.user_first_name,
      lastName: data.user_last_name,
    };

    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user: userData,
      expiresAt: expiresAt.toISOString()
    }));

    setUser(userData);

    // Preload data in the background
    preloadData(userData.email);

    // Check for saved route state
    const savedRoute = localStorage.getItem(ROUTE_STATE_KEY);
    if (savedRoute) {
      const { pathname, state } = JSON.parse(savedRoute);
      navigate(pathname, { state, replace: true });
    } else {
      navigate('/dashboard', { state: { fromLogin: true }, replace: true });
    }
  };

  const logout = async () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};