/**
 * Page Réinitialisation de mot de passe
 * @description Formulaire pour définir un nouveau mot de passe avec le token
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Vérifier qu'il y a un token
  useEffect(() => {
    if (!token) {
      setError('Lien invalide. Veuillez refaire une demande de réinitialisation.');
    }
  }, [token]);

  // Validation du mot de passe
  const passwordValidation = {
    length: password.length >= 8,
    match: password === confirmPassword && password.length > 0
  };

  const isValid = passwordValidation.length && passwordValidation.match;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        nouveauMotDePasse: password
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Mot de passe réinitialisé avec succès !');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Vue erreur (pas de token ou token invalide)
  if (error && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Lien invalide ou expiré
          </h1>
          
          <p className="text-gray-600 mb-8">
            {error}
          </p>
          
          <div className="space-y-3">
            <Link
              to="/mot-de-passe-oublie"
              className="block w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Faire une nouvelle demande
            </Link>
            
            <Link
              to="/login"
              className="block w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Vue succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Mot de passe modifié !
          </h1>
          
          <p className="text-gray-600 mb-8">
            Votre nouveau mot de passe a été enregistré. 
            Vous pouvez maintenant vous connecter.
          </p>
          
          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Se connecter
          </Link>
        </motion.div>
      </div>
    );
  }

  // Vue formulaire
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Retour */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-500 mt-2">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nouveau mot de passe */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Validation */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Critères du mot de passe :
            </p>
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
              {passwordValidation.length ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-current rounded-full" />
              )}
              Au moins 8 caractères
            </div>
            <div className={`flex items-center gap-2 text-sm ${passwordValidation.match ? 'text-green-600' : 'text-gray-400'}`}>
              {passwordValidation.match ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-current rounded-full" />
              )}
              Les mots de passe correspondent
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Modification en cours...
              </>
            ) : (
              'Modifier le mot de passe'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
