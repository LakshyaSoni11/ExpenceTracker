import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { TOKEN_KEY } from '@/api/axios';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    connectSocket();
  };

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      disconnectSocket();
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setInitializing(false);
      return () => { active = false; };
    }
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (active) {
          setUser(data.user);
          connectSocket();
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data.token, data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    applySession(data.token, data.user);
    return data.user;
  };

  const verifyEmail = async (token) => {
    const { data } = await api.post('/auth/verify-email', { token });
    applySession(data.token, data.user);
    return data.user;
  };

  const resendVerification = async (email) => {
    await api.post('/auth/resend-verification', { email });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, verifyEmail, resendVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);