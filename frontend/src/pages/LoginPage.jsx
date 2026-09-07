/**
 * Page de connexion
 * @description Écran 06 — Connexion / Inscription (état "Se connecter")
 * @see design_handoff_jana_refonte/README.md
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ARGS_COMPTE = [
  { titre: 'Mêmes prix pour tous', desc: 'Particuliers et professionnels achètent aux mêmes tarifs, sans carte de grossiste.' },
  { titre: 'Livraison 24–48 h', desc: 'En Île-de-France, du lundi au samedi.' },
  { titre: 'Devis, sans paiement en ligne', desc: 'Réglé à la livraison — aucune carte bancaire requise pour commander.' },
  { titre: 'Compte professionnel', desc: 'Facturation mensuelle et paiement à 30 jours, sur validation du SIRET.' }
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();

  const [formData, setFormData] = useState({ email: '', motDePasse: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.motDePasse);
      toast.success('Connexion réussie !');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans">
      {/* En-tete sombre mobile (M7) : accroche + segment Se connecter / Creer un compte */}
      <div className="lg:hidden bg-ink-900 px-6 pt-8 pb-7">
        <Link to="/" className="flex items-center gap-[11px] mb-6">
          <div className="w-8 h-8 rounded-6 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[16px]">J</div>
          <span className="font-display font-extrabold text-[16px] tracking-tight text-white">JANA DISTRIBUTION</span>
        </Link>
        <h1 className="font-display text-[26px] font-extrabold tracking-tighter text-white leading-[1.15]">
          Particulier ou professionnel,<br />les mêmes prix.
        </h1>
        <div className="flex bg-ink-700 rounded-6 p-1 mt-5 w-fit">
          <span className="bg-white text-ink-900 px-4 py-2 rounded-5 text-[13px] font-semibold">Se connecter</span>
          <Link to="/register" className="text-mist-3 px-4 py-2 rounded-5 text-[13px] font-semibold">Créer un compte</Link>
        </div>
      </div>

      {/* Gauche — formulaire */}
      <div className="bg-white flex flex-col justify-center px-6 sm:px-10 lg:px-[72px] py-8 lg:py-14 gap-[22px]">
        <div className="max-w-[420px] w-full mx-auto lg:mx-0">
          <Link to="/" className="hidden lg:flex items-center gap-[11px] mb-7">
            <div className="w-8 h-8 rounded-6 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[16px]">J</div>
            <span className="font-display font-extrabold text-[18px] tracking-tight text-ink-900">JANA DISTRIBUTION</span>
          </Link>

          <h1 className="font-display text-[23px] lg:text-[32px] font-extrabold tracking-tighter text-ink-900">Se connecter</h1>
          <p className="text-[14.5px] text-graphite-600 mt-1.5 mb-6">Retrouvez vos listes, vos tarifs et l'historique de vos commandes.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[12.5px] text-graphite-600">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@exemple.fr"
                className="border border-sand-250 rounded-6 h-[50px] px-3.5 text-[14.5px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label htmlFor="motDePasse" className="text-[12.5px] text-graphite-600">Mot de passe</label>
                <Link to="/mot-de-passe-oublie" className="text-[12.5px] text-green-700 hover:text-green-800">Oublié ?</Link>
              </div>
              <div className="relative">
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.motDePasse}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-sand-250 rounded-6 h-[50px] pl-3.5 pr-11 text-[16px] tracking-[0.18em] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-graphite-300 hover:text-graphite-600"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger-bg border border-danger-border text-danger-text px-3.5 py-2.5 rounded-6 text-[13px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[52px] lg:h-[50px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Se connecter
            </button>

            <p className="text-center text-[13.5px] text-graphite-600">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold text-green-700 hover:text-green-800">Créer un compte</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Droite — argumentaire compte (desktop) */}
      <div className="hidden lg:flex bg-ink-900 flex-col justify-center px-6 sm:px-10 lg:px-[72px] py-14 gap-[26px]">
        <div>
          <span className="font-mono text-[11.5px] tracking-wider text-accent-light">CRÉER UN COMPTE</span>
          <h2 className="font-display text-[26px] sm:text-[30px] font-extrabold tracking-tighter text-white mt-3 leading-[1.15]">
            Particulier ou professionnel,<br />les mêmes prix.
          </h2>
        </div>

        <div className="flex flex-col gap-px bg-ink-600 border border-ink-600 rounded-8 overflow-hidden">
          {ARGS_COMPTE.map((arg, index) => (
            <div key={arg.titre} className="bg-ink-800 px-[18px] py-4 flex gap-3.5 items-start">
              <span className="font-mono text-[12px] text-accent-light mt-0.5">{index + 1}</span>
              <div>
                <div className="text-[14.5px] font-semibold text-white">{arg.titre}</div>
                <div className="text-[13px] text-mist-2 mt-1 leading-[1.5]">{arg.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <Link to="/register?type=PARTICULIER" className="bg-green-700 hover:bg-green-800 text-white text-[14.5px] font-semibold px-[22px] py-[13px] rounded-6 transition-colors">
            Compte particulier
          </Link>
          <Link to="/register?type=PROFESSIONNEL" className="border border-ink-500 hover:bg-white/5 text-white text-[14.5px] font-semibold px-[22px] py-[13px] rounded-6 transition-colors">
            Compte professionnel
          </Link>
        </div>
        <p className="text-[12.5px] text-mist-4 leading-[1.6]">
          Compte pro : SIRET requis, facturation mensuelle et paiement à 30 jours après validation par notre équipe.
        </p>
      </div>

      {/* Bas de page mobile (M7) : 3 arguments numerotes sur fond clair */}
      <div className="lg:hidden bg-[#EDEAE1] px-6 py-7 flex flex-col gap-4">
        {ARGS_COMPTE.slice(0, 3).map((arg, index) => (
          <div key={arg.titre} className="flex gap-3 items-start">
            <span className="font-mono text-[12px] text-green-700 mt-0.5 flex-shrink-0">{index + 1}</span>
            <div>
              <div className="text-[13.5px] font-semibold text-ink-900">{arg.titre}</div>
              <div className="text-[12.5px] text-graphite-600 mt-0.5 leading-[1.5]">{arg.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoginPage;
