/**
 * Configuration API Frontend
 * @description Compatible Railway (VITE_API_URL) et développement local
 * 
 * ✅ COMPLET AVEC TOUTES LES FONCTIONS AUTH
 */

import axios from 'axios';

// ==========================================
// URL DE L'API
// ==========================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🌐 API URL:', API_URL);

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
 * Stocke les données d'authentification
 */
export const setAuthData = (token, user) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Supprime les données d'authentification
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Récupère l'utilisateur stocké
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Récupère le token stocké
 */
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
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
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        console.warn('🔒 Session expirée');
        clearAuthData();
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
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
    const backendUrl = API_URL.replace('/api', '');
    return `${backendUrl}${imagePath}`;
  }
  
  return imagePath;
};
