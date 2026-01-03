/**
 * Configuration API Frontend
 * @description Compatible Railway (VITE_API_URL) et développement local
 * 
 * ✅ MODIFIÉ POUR MISE EN LIGNE RAILWAY
 */

import axios from 'axios';

// ==========================================
// URL DE L'API
// ==========================================
// En production: VITE_API_URL est défini dans les variables Railway
// En développement: fallback sur localhost:3000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🌐 API URL:', API_URL);

// ==========================================
// INSTANCE AXIOS
// ==========================================
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 secondes
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==========================================
// INTERCEPTEUR REQUEST
// ==========================================
api.interceptors.request.use(
  (config) => {
    // Ajouter le token JWT si présent
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
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
  (response) => {
    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Gestion des erreurs
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expiré ou invalide
          console.warn('🔒 Session expirée');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Rediriger vers login sauf si déjà sur login
          if (!window.location.pathname.includes('/connexion')) {
            window.location.href = '/connexion';
          }
          break;
          
        case 403:
          console.warn('🚫 Accès refusé:', data?.message);
          break;
          
        case 404:
          console.warn('❓ Ressource non trouvée');
          break;
          
        case 429:
          console.warn('⏳ Trop de requêtes, réessayez plus tard');
          break;
          
        case 500:
          console.error('💥 Erreur serveur:', data?.message);
          break;
          
        default:
          console.error(`❌ Erreur ${status}:`, data?.message);
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      console.error('🌐 Erreur réseau - Serveur injoignable');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ==========================================
// HELPERS POUR LES IMAGES
// ==========================================

/**
 * Construit l'URL complète d'une image
 * @param {string} imagePath - Chemin de l'image (/uploads/... ou URL complète)
 * @returns {string} URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-product.jpg';
  
  // Si c'est déjà une URL complète (http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si c'est un chemin local (/uploads/...)
  if (imagePath.startsWith('/uploads/')) {
    // En production, utiliser l'URL du backend
    const backendUrl = API_URL.replace('/api', '');
    return `${backendUrl}${imagePath}`;
  }
  
  // Fallback
  return imagePath;
};
