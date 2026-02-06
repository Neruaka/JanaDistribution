/**
 * Configuration API Frontend
 * @description Compatible Railway (VITE_API_URL) et developpement local
 */

import axios from 'axios';

// ==========================================
// URL DE L'API
// ==========================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

const readAuthStorage = (key) => {
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue !== null) return sessionValue;

  const legacyValue = localStorage.getItem(key);
  if (legacyValue !== null) {
    sessionStorage.setItem(key, legacyValue);
    localStorage.removeItem(key);
    return legacyValue;
  }

  return null;
};

const writeAuthStorage = (key, value) => {
  sessionStorage.setItem(key, value);
  localStorage.removeItem(key);
};

const removeAuthStorage = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

console.log('API URL:', API_URL);

// ==========================================
// INSTANCE AXIOS
// ==========================================
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==========================================
// FONCTIONS AUTH HELPERS
// ==========================================

/**
 * Stocke les donnees d'authentification
 */
export const setAuthData = (token, user, refreshToken) => {
  if (token) {
    writeAuthStorage('token', token);
  }
  if (user) {
    writeAuthStorage('user', JSON.stringify(user));
  }
  if (refreshToken) {
    writeAuthStorage('refreshToken', refreshToken);
  }
};

/**
 * Supprime les donnees d'authentification
 */
export const clearAuthData = () => {
  removeAuthStorage('token');
  removeAuthStorage('user');
  removeAuthStorage('refreshToken');
};

/**
 * Recupere l'utilisateur stocke
 */
export const getStoredUser = () => {
  try {
    const user = readAuthStorage('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Recupere le token stocke
 */
export const getStoredToken = () => {
  return readAuthStorage('token');
};

/**
 * Recupere le refresh token stocke
 */
export const getStoredRefreshToken = () => {
  return readAuthStorage('refreshToken');
};

/**
 * Verifie si l'utilisateur est authentifie
 */
export const isAuthenticated = () => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
};

const AUTH_PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh'
];

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const isPublicAuthRoute = (url = '') => {
  return AUTH_PUBLIC_ROUTES.some((route) => url.includes(route));
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error('Aucun refresh token disponible');
  }

  const response = await axios.post(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const { token, refreshToken: rotatedRefreshToken } = response.data?.data || {};

  if (!token || !rotatedRefreshToken) {
    throw new Error('Reponse refresh invalide');
  }

  const user = getStoredUser();
  setAuthData(token, user, rotatedRefreshToken);

  return token;
};

// ==========================================
// INTERCEPTEUR REQUEST
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ==========================================
// INTERCEPTEUR RESPONSE
// ==========================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config || {};

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (isPublicAuthRoute(originalRequest.url)) {
      clearAuthData();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthData();
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      console.warn('Session expiree');
      clearAuthData();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default api;

// ==========================================
// HELPER POUR LES IMAGES
// ==========================================
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-product.jpg';

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  if (imagePath.startsWith('/uploads/')) {
    return `${BACKEND_URL}${imagePath}`;
  }

  return imagePath;
};
