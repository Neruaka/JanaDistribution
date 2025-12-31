/**
 * Page Mot de passe oublié
 * @description Formulaire de demande de réinitialisation de mot de passe
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (error) {
      // On affiche toujours un succès (sécurité)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // Vue après soumission
  if (submitted) {
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
            Email envoyé !
          </h1>
          
          <p className="text-gray-600 mb-6">
            Si l'adresse <strong>{email}</strong> est associée à un compte, 
            vous recevrez un email avec un lien de réinitialisation.
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            Le lien expire dans <strong>1 heure</strong>. 
            Pensez à vérifier vos spams.
          </p>
          
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Retour à la connexion
            </Link>
            
            <button
              onClick={() => setSubmitted(false)}
              className="block w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Essayer avec une autre adresse
            </button>
          </div>
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
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-500 mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien'
            )}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link to="/connexion" className="text-green-600 hover:text-green-700 font-medium">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
