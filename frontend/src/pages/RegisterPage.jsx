/**
 * Page d'inscription
 * @description Écran 06 — Connexion / Inscription (état "Créer un compte")
 * @see design_handoff_jana_refonte/README.md
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Checkbox from '../components/Checkbox';

const ARGS_COMPTE = [
  { titre: 'Mêmes prix pour tous', desc: 'Particuliers et professionnels achètent aux mêmes tarifs, sans carte de grossiste.' },
  { titre: 'Livraison 24–48 h', desc: 'En Île-de-France, du lundi au samedi.' },
  { titre: 'Devis, sans paiement en ligne', desc: 'Réglé à la livraison — aucune carte bancaire requise pour commander.' },
  { titre: 'Compte professionnel', desc: 'Facturation mensuelle et paiement à 30 jours, sur validation du SIRET.' }
];

const FieldError = ({ error }) => {
  if (!error) return null;
  return (
    <p className="text-[12px] text-danger-text flex items-center gap-1 mt-1">
      <AlertCircle className="w-3.5 h-3.5" /> {error}
    </p>
  );
};

const inputClass = (hasError) =>
  `w-full border rounded-6 h-[50px] px-3.5 text-[14px] text-ink-900 placeholder:text-graphite-200 focus:outline-none transition-colors ${
    hasError ? 'border-danger-border bg-danger-bg' : 'border-sand-250 focus:border-ink-900'
  }`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, error, clearError } = useAuth();

  const initialType = searchParams.get('type') === 'PROFESSIONNEL' ? 'PROFESSIONNEL' : 'PARTICULIER';

  const [formData, setFormData] = useState({
    email: '', motDePasse: '', confirmationMotDePasse: '',
    nom: '', prenom: '', telephone: '',
    typeClient: initialType, siret: '', raisonSociale: '', numeroTva: '',
    accepteCgu: false, accepteNewsletter: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: null }));
    if (error) clearError();
  };

  const setTypeClient = (typeClient) => setFormData((prev) => ({ ...prev, typeClient }));

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.motDePasse) {
      errors.motDePasse = 'Le mot de passe est obligatoire';
    } else if (formData.motDePasse.length < 8) {
      errors.motDePasse = 'Minimum 8 caractères';
    } else if (!/[a-z]/.test(formData.motDePasse)) {
      errors.motDePasse = 'Doit contenir une minuscule';
    } else if (!/[A-Z]/.test(formData.motDePasse)) {
      errors.motDePasse = 'Doit contenir une majuscule';
    } else if (!/[0-9]/.test(formData.motDePasse)) {
      errors.motDePasse = 'Doit contenir un chiffre';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.motDePasse)) {
      errors.motDePasse = 'Doit contenir un caractère spécial';
    }

    if (formData.motDePasse !== formData.confirmationMotDePasse) {
      errors.confirmationMotDePasse = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.nom || formData.nom.length < 2) errors.nom = 'Le nom est obligatoire';
    if (!formData.prenom || formData.prenom.length < 2) errors.prenom = 'Le prénom est obligatoire';

    if (formData.typeClient === 'PROFESSIONNEL') {
      if (!formData.siret || formData.siret.length !== 14) errors.siret = 'Le SIRET doit contenir 14 chiffres';
      if (!formData.raisonSociale) errors.raisonSociale = 'La raison sociale est obligatoire';
    }
    if (!formData.accepteCgu) errors.accepteCgu = 'Vous devez accepter les CGU';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    setIsSubmitting(true);
    try {
      const { confirmationMotDePasse, ...dataToSend } = formData;
      await register(dataToSend);
      toast.success('Inscription réussie ! Bienvenue');
      navigate('/');
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
          <Link to="/login" className="text-mist-3 px-4 py-2 rounded-5 text-[13px] font-semibold">Se connecter</Link>
          <span className="bg-white text-ink-900 px-4 py-2 rounded-5 text-[13px] font-semibold">Créer un compte</span>
        </div>
      </div>

      {/* Gauche — formulaire */}
      <div className="bg-white flex flex-col justify-center px-6 sm:px-10 lg:px-[72px] py-8 lg:py-14">
        <div className="max-w-[460px] w-full mx-auto lg:mx-0">
          <Link to="/" className="hidden lg:flex items-center gap-[11px] mb-6">
            <div className="w-8 h-8 rounded-6 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[16px]">J</div>
            <span className="font-display font-extrabold text-[18px] tracking-tight text-ink-900">JANA DISTRIBUTION</span>
          </Link>

          <h1 className="font-display text-[23px] lg:text-[32px] font-extrabold tracking-tighter text-ink-900">Créer un compte</h1>
          <p className="text-[14.5px] text-graphite-600 mt-1.5 mb-6">
            Déjà inscrit ? <Link to="/login" className="text-green-700 hover:text-green-800 font-semibold">Connectez-vous</Link>
          </p>

          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => setTypeClient('PARTICULIER')}
              className={`flex items-center justify-center gap-2 py-3 rounded-6 text-[13.5px] font-semibold transition-colors ${
                formData.typeClient === 'PARTICULIER' ? 'border-[1.5px] border-green-700 bg-selection-bg text-green-800' : 'border border-sand-250 text-graphite-600 hover:border-sand-300'
              }`}
            >
              <User className="w-4 h-4" /> Particulier
            </button>
            <button
              type="button"
              onClick={() => setTypeClient('PROFESSIONNEL')}
              className={`flex items-center justify-center gap-2 py-3 rounded-6 text-[13.5px] font-semibold transition-colors ${
                formData.typeClient === 'PROFESSIONNEL' ? 'border-[1.5px] border-green-700 bg-selection-bg text-green-800' : 'border border-sand-250 text-graphite-600 hover:border-sand-300'
              }`}
            >
              <Building2 className="w-4 h-4" /> Professionnel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="prenom" className="text-[12.5px] text-graphite-600">Prénom</label>
                <input id="prenom" name="prenom" type="text" value={formData.prenom} onChange={handleChange} placeholder="Jean" className={`${inputClass(validationErrors.prenom)} mt-1.5`} />
                <FieldError error={validationErrors.prenom} />
              </div>
              <div>
                <label htmlFor="nom" className="text-[12.5px] text-graphite-600">Nom</label>
                <input id="nom" name="nom" type="text" value={formData.nom} onChange={handleChange} placeholder="Dupont" className={`${inputClass(validationErrors.nom)} mt-1.5`} />
                <FieldError error={validationErrors.nom} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-[12.5px] text-graphite-600">Adresse email</label>
              <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="vous@exemple.fr" className={`${inputClass(validationErrors.email)} mt-1.5`} />
              <FieldError error={validationErrors.email} />
            </div>

            <div>
              <label htmlFor="telephone" className="text-[12.5px] text-graphite-600">Téléphone <span className="text-graphite-300">(optionnel)</span></label>
              <input id="telephone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} placeholder="06 12 34 56 78" className={`${inputClass(false)} mt-1.5`} />
            </div>

            {formData.typeClient === 'PROFESSIONNEL' && (
              <div className="border border-sand-200 bg-sand-50 rounded-8 p-3.5 flex flex-col gap-3.5">
                <div>
                  <label htmlFor="raisonSociale" className="text-[12.5px] text-graphite-600">Raison sociale</label>
                  <input id="raisonSociale" name="raisonSociale" type="text" value={formData.raisonSociale} onChange={handleChange} placeholder="Ma société SARL" className={`${inputClass(validationErrors.raisonSociale)} mt-1.5 bg-white`} />
                  <FieldError error={validationErrors.raisonSociale} />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="siret" className="text-[12.5px] text-graphite-600">SIRET</label>
                    <input id="siret" name="siret" type="text" value={formData.siret} onChange={handleChange} placeholder="12345678901234" maxLength={14} className={`${inputClass(validationErrors.siret)} mt-1.5 bg-white`} />
                    <FieldError error={validationErrors.siret} />
                  </div>
                  <div>
                    <label htmlFor="numeroTva" className="text-[12.5px] text-graphite-600">N° TVA <span className="text-graphite-300">(optionnel)</span></label>
                    <input id="numeroTva" name="numeroTva" type="text" value={formData.numeroTva} onChange={handleChange} placeholder="FR12345678901" className={`${inputClass(false)} mt-1.5 bg-white`} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="motDePasse" className="text-[12.5px] text-graphite-600">Mot de passe</label>
                <div className="relative mt-1.5">
                  <input id="motDePasse" name="motDePasse" type={showPassword ? 'text' : 'password'} value={formData.motDePasse} onChange={handleChange} placeholder="••••••••" className={`${inputClass(validationErrors.motDePasse)} pr-10`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-graphite-300 hover:text-graphite-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError error={validationErrors.motDePasse} />
              </div>
              <div>
                <label htmlFor="confirmationMotDePasse" className="text-[12.5px] text-graphite-600">Confirmer</label>
                <div className="relative mt-1.5">
                  <input id="confirmationMotDePasse" name="confirmationMotDePasse" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmationMotDePasse} onChange={handleChange} placeholder="••••••••" className={`${inputClass(validationErrors.confirmationMotDePasse)} pr-10`} />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-graphite-300 hover:text-graphite-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError error={validationErrors.confirmationMotDePasse} />
              </div>
            </div>
            <p className="text-[11.5px] text-graphite-400 -mt-2">8 caractères minimum, une majuscule, une minuscule, un chiffre et un caractère spécial.</p>

            <button type="button" onClick={() => handleChange({ target: { name: 'accepteCgu', type: 'checkbox', checked: !formData.accepteCgu } })} className="flex items-start gap-2.5 text-left">
              <Checkbox checked={formData.accepteCgu} className="mt-0.5" />
              <span className="text-[13px] text-graphite-600 leading-[1.5]">
                J'accepte les <Link to="/cgv" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800" onClick={(e) => e.stopPropagation()}>CGU</Link> et la{' '}
                <Link to="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800" onClick={(e) => e.stopPropagation()}>politique de confidentialité</Link>.
              </span>
            </button>
            <FieldError error={validationErrors.accepteCgu} />

            <button type="button" onClick={() => handleChange({ target: { name: 'accepteNewsletter', type: 'checkbox', checked: !formData.accepteNewsletter } })} className="flex items-start gap-2.5 text-left -mt-2">
              <Checkbox checked={formData.accepteNewsletter} className="mt-0.5" />
              <span className="text-[13px] text-graphite-600">Je souhaite recevoir les offres et actualités par email</span>
            </button>

            {error && (
              <div className="bg-danger-bg border border-danger-border text-danger-text px-3.5 py-2.5 rounded-6 text-[13px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[52px] lg:h-[50px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer mon compte
            </button>
          </form>
        </div>
      </div>

      {/* Droite — argumentaire compte (desktop) */}
      <div className="hidden lg:flex bg-ink-900 flex-col justify-center px-6 sm:px-10 lg:px-[72px] py-14 gap-[26px]">
        <div>
          <span className="font-mono text-[11.5px] tracking-wider text-accent-light">POURQUOI JANA</span>
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

        <p className="text-[13.5px] text-mist-2">
          Déjà un compte ? <Link to="/login" className="text-white font-semibold hover:text-mist">Se connecter</Link>
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

export default RegisterPage;
