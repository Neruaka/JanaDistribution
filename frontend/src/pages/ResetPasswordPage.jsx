/**
 * Page Réinitialisation de mot de passe
 * @description Formulaire pour définir un nouveau mot de passe avec le token
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="bg-white border border-sand-200 rounded-8 p-8 w-full max-w-[420px] text-center">
          <div className="w-14 h-14 bg-danger-bg rounded-8 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-7 h-7 text-danger-text" />
          </div>

          <h1 className="font-display text-[23px] font-extrabold tracking-tighter text-ink-900">
            Lien invalide ou expiré
          </h1>

          <p className="text-[13.5px] text-graphite-600 mt-3 leading-[1.6]">
            {error}
          </p>

          <div className="flex flex-col gap-2.5 mt-7">
            <Link
              to="/mot-de-passe-oublie"
              className="h-[50px] flex items-center justify-center bg-green-700 hover:bg-green-800 text-white rounded-6 text-[14.5px] font-semibold transition-colors"
            >
              Faire une nouvelle demande
            </Link>

            <Link
              to="/login"
              className="h-[50px] flex items-center justify-center border border-sand-250 text-graphite-700 rounded-6 text-[14.5px] font-semibold hover:border-sand-300 transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Vue succès
  if (success) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="bg-white border border-sand-200 rounded-8 p-8 w-full max-w-[420px] text-center">
          <div className="w-14 h-14 bg-success-bg rounded-8 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-success-text" />
          </div>

          <h1 className="font-display text-[23px] font-extrabold tracking-tighter text-ink-900">
            Mot de passe modifié !
          </h1>

          <p className="text-[13.5px] text-graphite-600 mt-3 leading-[1.6]">
            Votre nouveau mot de passe a été enregistré.
            Vous pouvez maintenant vous connecter.
          </p>

          <Link
            to="/login"
            className="h-[50px] flex items-center justify-center bg-green-700 hover:bg-green-800 text-white rounded-6 text-[14.5px] font-semibold transition-colors mt-7"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // Vue formulaire
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
      <div className="bg-white border border-sand-200 rounded-8 p-8 w-full max-w-[420px]">
        {/* Retour */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[13px] text-graphite-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-success-bg rounded-8 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-success-text" />
          </div>
          <h1 className="font-display text-[23px] font-extrabold tracking-tighter text-ink-900">
            Nouveau mot de passe
          </h1>
          <p className="text-[13.5px] text-graphite-600 mt-1.5">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nouveau mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[12.5px] text-graphite-600">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-graphite-300" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-sand-250 rounded-6 h-[50px] pl-11 pr-11 text-[16px] tracking-[0.18em] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-graphite-300 hover:text-graphite-600"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[12.5px] text-graphite-600">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-graphite-300" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-sand-250 rounded-6 h-[50px] pl-11 pr-11 text-[16px] tracking-[0.18em] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-graphite-300 hover:text-graphite-600"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Validation */}
          <div className="bg-sand-100 border border-sand-200 rounded-6 p-4 flex flex-col gap-2">
            <p className="text-[12.5px] font-semibold text-graphite-700">
              Critères du mot de passe :
            </p>
            <div className={`flex items-center gap-2 text-[13px] ${passwordValidation.length ? 'text-success-text' : 'text-graphite-400'}`}>
              {passwordValidation.length ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-current rounded-full" />
              )}
              Au moins 8 caractères
            </div>
            <div className={`flex items-center gap-2 text-[13px] ${passwordValidation.match ? 'text-success-text' : 'text-graphite-400'}`}>
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
            className="h-[50px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
