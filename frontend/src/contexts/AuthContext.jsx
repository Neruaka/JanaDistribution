/**
 * Context d'Authentification
 * @description GÃ¨re l'Ã©tat de l'utilisateur connectÃ© dans toute l'application
 * 
 * Ce context utilise le pattern "Provider" de React :
 * - On enveloppe l'app avec <AuthProvider>
 * - N'importe quel composant peut accÃ©der Ã  l'utilisateur avec useAuth()
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthData, clearAuthData, getStoredUser, isAuthenticated } from '../services/api';

// 1. CrÃ©ation du context (comme une "boÃ®te" qui contient les donnÃ©es)
const AuthContext = createContext(null);

/**
 * Hook personnalisÃ© pour accÃ©der au context
 * Utilisation : const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit Ãªtre utilisÃ© dans un AuthProvider');
  }
  return context;
};

/**
 * Provider d'authentification
 * Enveloppe l'application et fournit l'Ã©tat utilisateur
 */
export const AuthProvider = ({ children }) => {
  // Ã‰tat de l'utilisateur connectÃ© (null = non connectÃ©)
  const [user, setUser] = useState(null);
  
  // Ã‰tat de chargement (true pendant la vÃ©rification initiale)
  const [loading, setLoading] = useState(true);
  
  // Ã‰tat d'erreur
  const [error, setError] = useState(null);

  /**
   * Effet au montage : vÃ©rifie si l'utilisateur est dÃ©jÃ  connectÃ©
   * (token dans localStorage)
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // VÃ©rifie si un token existe dans localStorage
        if (isAuthenticated()) {
          // RÃ©cupÃ¨re les infos utilisateur depuis l'API
          const response = await api.get('/auth/me');
          setUser(response.data.data);
        }
      } catch (err) {
        // Token invalide ou expirÃ© : on dÃ©connecte
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
   * @param {Object} userData - DonnÃ©es du formulaire d'inscription
   * @returns {Object} DonnÃ©es utilisateur
   */
  const register = async (userData) => {
    try {
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token, refreshToken } = response.data.data;
      
      // Stocke le token et les infos utilisateur
      setAuthData(token, newUser, refreshToken);
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
   * @returns {Object} DonnÃ©es utilisateur
   */
  const login = async (email, motDePasse) => {
    try {
      setError(null);
      
      const response = await api.post('/auth/login', { email, motDePasse });
      const { user: loggedUser, token, refreshToken } = response.data.data;
      
      // Stocke le token et les infos utilisateur
      setAuthData(token, loggedUser, refreshToken);
      setUser(loggedUser);
      
      return loggedUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Email ou mot de passe incorrect';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * DÃ©connexion
   */
  const logout = async () => {
    try {
      // Appelle l'API (optionnel, le token est gÃ©rÃ© cÃ´tÃ© client)
      await api.post('/auth/logout');
    } catch (err) {
      // MÃªme si l'API Ã©choue, on dÃ©connecte localement
      console.error('Erreur logout API:', err);
    } finally {
      clearAuthData();
      setUser(null);
    }
  };

  /**
   * Met Ã  jour le profil utilisateur
   * @param {Object} updates - Champs Ã  mettre Ã  jour
   * @returns {Object} Utilisateur mis Ã  jour
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      const response = await api.put('/auth/profile', updates);
      const updatedUser = response.data.data;
      
      // Met Ã  jour l'Ã©tat et le localStorage
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.removeItem('user');
      
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la mise Ã  jour';
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

