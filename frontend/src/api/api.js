import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Automatically inject valid Authorization header from localStorage or config
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('hublocal_token');
    // If config has a valid Bearer token, prefer it
    const existingAuth = config.headers?.Authorization;
    if (existingAuth && !existingAuth.includes('null') && !existingAuth.includes('undefined')) {
      token = existingAuth.replace('Bearer ', '').trim();
    }

    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-clean stale credentials on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear corrupt or expired tokens
      localStorage.removeItem('hublocal_token');
      localStorage.removeItem('hublocal_user');
    }
    return Promise.reject(error);
  }
);

export default api;
