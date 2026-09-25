import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('snapfeed_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate stored token and synchronize current user session
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('snapfeed_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('snapfeed_user', JSON.stringify(response.data.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    if (response.success && response.data?.token) {
      localStorage.setItem('snapfeed_token', response.data.token);
      localStorage.setItem('snapfeed_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (username, email, password) => {
    const response = await authApi.register({ username, email, password });
    if (response.success && response.data?.token) {
      localStorage.setItem('snapfeed_token', response.data.token);
      localStorage.setItem('snapfeed_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('snapfeed_token')) {
        await authApi.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem('snapfeed_token');
      localStorage.removeItem('snapfeed_user');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('snapfeed_user', JSON.stringify(response.data.user));
        return response.data.user;
      }
    } catch (err) {
      console.warn('Could not refresh user profile:', err.message);
    }
    return null;
  };

  const updateUserLocal = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('snapfeed_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    updateUserLocal,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
