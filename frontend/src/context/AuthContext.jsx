import { createContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const normalizeUserRole = (role) => {
  if (!role) return 'user';
  if (role === 'admin') return 'admin';
  if (['organizer'].includes(role)) return 'organizer';
  if (['theatreOwner', 'theatre_owner'].includes(role)) return 'theatre_owner';
  if (['hall_owner', 'hallOwner', 'hotelOwner'].includes(role)) return 'hall_owner';
  if (['manager', 'eventManager'].includes(role)) return 'manager';
  return 'user';
};

export const getDashboardPath = (role) => {
  const normRole = normalizeUserRole(role);
  switch (normRole) {
    case 'admin':
      return '/admin/dashboard';
    case 'organizer':
      return '/organizer/dashboard';
    case 'theatre_owner':
      return '/theatre-owner/dashboard';
    case 'hall_owner':
      return '/hall-owner/dashboard';
    case 'manager':
      return '/event-manager/dashboard';
    case 'user':
    default:
      return '/';
  }
};

export const isManagerRole = (role) => ['organizer', 'hall_owner', 'hallOwner', 'hotelOwner', 'theatreOwner', 'theatre_owner', 'manager', 'eventManager', 'admin'].includes(role);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hublocal_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('hublocal_token'));

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('hublocal_user', JSON.stringify(user));
      localStorage.setItem('hublocal_token', token);
    } else {
      localStorage.removeItem('hublocal_user');
      localStorage.removeItem('hublocal_token');
    }
  }, [user, token]);

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    setUser(response.data.user);
    setToken(response.data.token);
    return response;
  };

  const register = async (payload) => {
    const response = await axios.post('/api/auth/register', payload);
    setUser(response.data.user);
    setToken(response.data.token);
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const authHeaders = () => {
    const activeToken = token || localStorage.getItem('hublocal_token');
    if (activeToken && activeToken !== 'null' && activeToken !== 'undefined') {
      return { headers: { Authorization: `Bearer ${activeToken}` } };
    }
    return { headers: {} };
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
