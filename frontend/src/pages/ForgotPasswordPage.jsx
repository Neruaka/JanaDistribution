/**
 * Page Mot de passe oublié
 * @description Formulaire de demande de réinitialisation de mot de passe
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
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
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="bg-white border border-sand-200 rounded-8 p-8 w-full max-w-[420px] text-center">
          <div className="w-14 h-14 bg-success-bg rounded-8 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-success-text" />
          </div>

          <h1 className="font-display text-[23px] font-extrabold tracking-tighter text-ink-900">
            Email envoyé !
          </h1>

          <p className="text-[13.5px] text-graphite-600 mt-3 leading-[1.6]">
            Si l'adresse <strong className="text-ink-900">{email}</strong> est associée à un compte,
            vous recevrez un email avec un lien de réinitialisation.
          </p>

          <p className="text-[12.5px] text-graphite-500 mt-3">
            Le lien expire dans <strong>1 heure</strong>.
            Pensez à vérifier vos spams.
          </p>

          <div className="flex flex-col gap-2.5 mt-7">
            <Link
              to="/login"
              className="h-[50px] flex items-center justify-center bg-green-700 hover:bg-green-800 text-white rounded-6 text-[14.5px] font-semibold transition-colors"
            >
              Retour à la connexion
            </Link>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="h-[50px] border border-sand-250 text-graphite-700 rounded-6 text-[14.5px] font-semibold hover:border-sand-300 transition-colors"
            >
              Essayer avec une autre adresse
            </button>
          </div>
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
            <Mail className="w-7 h-7 text-success-text" />
          </div>
          <h1 className="font-display text-[23px] font-extrabold tracking-tighter text-ink-900">
            Mot de passe oublié ?
          </h1>
          <p className="text-[13.5px] text-graphite-600 mt-1.5">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[12.5px] text-graphite-600">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-graphite-300" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full border border-sand-250 rounded-6 h-[50px] pl-11 pr-3.5 text-[14.5px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-[50px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Envoyer le lien
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-[13px] text-graphite-500 mt-6">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link to="/login" className="text-green-700 hover:text-green-800 font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
