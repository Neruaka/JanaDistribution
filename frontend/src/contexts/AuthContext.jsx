/**
 * Context d'Authentification
 * @description Gère l'état de l'utilisateur connecté dans toute l'application
 * 
 * Ce context utilise le pattern "Provider" de React :
 * - On enveloppe l'app avec <AuthProvider>
 * - N'importe quel composant peut accéder à l'utilisateur avec useAuth()
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthData, clearAuthData, getStoredUser, isAuthenticated } from '../services/api';

// 1. Création du context (comme une "boîte" qui contient les données)
const AuthContext = createContext(null);

/**
 * Hook personnalisé pour accéder au context
 * Utilisation : const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

/**
 * Provider d'authentification
 * Enveloppe l'application et fournit l'état utilisateur
 */
export const AuthProvider = ({ children }) => {
  // État de l'utilisateur connecté (null = non connecté)
  const [user, setUser] = useState(null);
  
  // État de chargement (true pendant la vérification initiale)
  const [loading, setLoading] = useState(true);
  
  // État d'erreur
  const [error, setError] = useState(null);

  /**
   * Effet au montage : vérifie si l'utilisateur est déjà connecté
   * (token dans localStorage)
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Vérifie si un token existe dans localStorage
        if (isAuthenticated()) {
          // Récupère les infos utilisateur depuis l'API
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        }
      } catch (err) {
        // Token invalide ou expiré : on déconnecte
        console.error('Erreur initialisation auth:', err);
        clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données du formulaire d'inscription
   * @returns {Object} Données utilisateur
   */
  const register = async (userData) => {
    try {
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token } = response.data.data;
      
      // Stocke le token et les infos utilisateur
      setAuthData(token, newUser);
      setUser(newUser);
      
      return newUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Connexion d'un utilisateur
   * @param {string} email - Email
   * @param {string} motDePasse - Mot de passe
   * @returns {Object} Données utilisateur
   */
  const login = async (email, motDePasse) => {
    try {
      setError(null);
      
      const response = await api.post('/auth/login', { email, motDePasse });
      const { user: loggedUser, token } = response.data.data;
      
      // Stocke le token et les infos utilisateur
      setAuthData(token, loggedUser);
      setUser(loggedUser);
      
      return loggedUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Email ou mot de passe incorrect';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      // Appelle l'API (optionnel, le token est géré côté client)
      await api.post('/auth/logout');
    } catch (err) {
      // Même si l'API échoue, on déconnecte localement
      console.error('Erreur logout API:', err);
    } finally {
      clearAuthData();
      setUser(null);
    }
  };

  /**
   * Met à jour le profil utilisateur
   * @param {Object} updates - Champs à mettre à jour
   * @returns {Object} Utilisateur mis à jour
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      const response = await api.put('/auth/profile', updates);
      const updatedUser = response.data.data;
      
      // Met à jour l'état et le localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Change le mot de passe
   * @param {string} ancienMotDePasse - Ancien mot de passe
   * @param {string} nouveauMotDePasse - Nouveau mot de passe
   * @param {string} confirmationMotDePasse - Confirmation
   */
  const changePassword = async (ancienMotDePasse, nouveauMotDePasse, confirmationMotDePasse) => {
    try {
      setError(null);
      
      await api.put('/auth/password', {
        ancienMotDePasse,
        nouveauMotDePasse,
        confirmationMotDePasse
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du changement de mot de passe';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Efface l'erreur
   */
  const clearError = () => setError(null);

  // Valeur fournie au context
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
