/**
 * Configuration Axios pour les appels API
 * @description Client HTTP avec intercepteurs pour auth et erreurs
 */

import axios from 'axios';

// ==========================================
// CONFIGURATION DE BASE
// ==========================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// INTERCEPTEUR DE REQUÊTE
// ==========================================

api.interceptors.request.use(
  (config) => {
    // Ajouter le token JWT si présent
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// INTERCEPTEUR DE RÉPONSE
// ==========================================

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs globales
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token expiré ou invalide
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Rediriger vers login si pas déjà dessus
          if (window.location.pathname !== '/connexion') {
            window.location.href = '/connexion';
          }
          break;
        case 403:
          console.error('Accès interdit');
          break;
        case 404:
          console.error('Ressource non trouvée');
          break;
        case 500:
          console.error('Erreur serveur');
          break;
      }

      // Retourner le message d'erreur de l'API
      return Promise.reject(data);
    }

    // Erreur réseau ou timeout
    if (error.request) {
      return Promise.reject({
        success: false,
        message: 'Erreur de connexion au serveur',
      });
    }

    return Promise.reject(error);
  }
);

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

/**
 * Stocke le token et les infos utilisateur
 */
export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Supprime les données d'authentification
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Récupère l'utilisateur connecté
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export default api;
