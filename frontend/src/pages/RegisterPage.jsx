/**
 * Page d'Inscription - Version modernisée
 * @description Formulaire d'inscription avec support particulier/professionnel
 * Style identique à LoginPage (split screen avec branding)
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone,
  Building2,
  UserPlus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();

  // État du formulaire
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '',
    confirmationMotDePasse: '',
    nom: '',
    prenom: '',
    telephone: '',
    typeClient: 'PARTICULIER',
    siret: '',
    raisonSociale: '',
    numeroTva: '',
    accepteCgu: false,
    accepteNewsletter: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Gère les changements dans les inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
    if (error) clearError();
  };

  // Validation côté client
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

    if (!formData.nom || formData.nom.length < 2) {
      errors.nom = 'Le nom est obligatoire';
    }

    if (!formData.prenom || formData.prenom.length < 2) {
      errors.prenom = 'Le prénom est obligatoire';
    }

    if (formData.typeClient === 'PROFESSIONNEL') {
      if (!formData.siret || formData.siret.length !== 14) {
        errors.siret = 'Le SIRET doit contenir 14 chiffres';
      }
      if (!formData.raisonSociale) {
        errors.raisonSociale = 'La raison sociale est obligatoire';
      }
    }

    if (!formData.accepteCgu) {
      errors.accepteCgu = 'Vous devez accepter les CGU';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumission du formulaire
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
      toast.success('Inscription réussie ! Bienvenue 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Composant pour les erreurs de champ
  const FieldError = ({ error }) => {
    if (!error) return null;
    return (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-500 text-xs mt-1 flex items-center gap-1"
      >
        <AlertCircle className="w-3 h-3" />
        {error}
      </motion.p>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white overflow-y-auto py-8">
        <motion.div 
          className="max-w-lg w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors">
              <span className="text-3xl">🥬</span>
              Jana Distribution
            </Link>
            <motion.h2 
              className="mt-6 text-3xl font-bold text-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Créer votre compte
            </motion.h2>
            <motion.p 
              className="mt-2 text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Connectez-vous
              </Link>
            </motion.p>
          </div>

          {/* Type de compte */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-3">Type de compte</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, typeClient: 'PARTICULIER' }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.typeClient === 'PARTICULIER'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
              >
                <User className={`w-6 h-6 ${formData.typeClient === 'PARTICULIER' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium">Particulier</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, typeClient: 'PROFESSIONNEL' }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.typeClient === 'PROFESSIONNEL'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
              >
                <Building2 className={`w-6 h-6 ${formData.typeClient === 'PROFESSIONNEL' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium">Professionnel</span>
              </button>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Informations personnelles */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Prénom */}
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prénom *
                  </label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Jean"
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 ${
                      validationErrors.prenom ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <FieldError error={validationErrors.prenom} />
                </div>

                {/* Nom */}
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom *
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 ${
                      validationErrors.nom ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <FieldError error={validationErrors.nom} />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vous@exemple.fr"
                    className={`block w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 ${
                      validationErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                <FieldError error={validationErrors.email} />
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="06 12 34 56 78"
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400"
                  />
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            {formData.typeClient === 'PROFESSIONNEL' && (
              <motion.div 
                className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informations professionnelles
                </h3>
                
                {/* Raison sociale */}
                <div className="mb-4">
                  <label htmlFor="raisonSociale" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Raison sociale *
                  </label>
                  <input
                    id="raisonSociale"
                    name="raisonSociale"
                    type="text"
                    value={formData.raisonSociale}
                    onChange={handleChange}
                    placeholder="Ma Société SARL"
                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 bg-white ${
                      validationErrors.raisonSociale ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <FieldError error={validationErrors.raisonSociale} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SIRET */}
                  <div>
                    <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1.5">
                      SIRET *
                    </label>
                    <input
                      id="siret"
                      name="siret"
                      type="text"
                      value={formData.siret}
                      onChange={handleChange}
                      placeholder="12345678901234"
                      maxLength={14}
                      className={`block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 bg-white ${
                        validationErrors.siret ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <FieldError error={validationErrors.siret} />
                  </div>

                  {/* N° TVA */}
                  <div>
                    <label htmlFor="numeroTva" className="block text-sm font-medium text-gray-700 mb-1.5">
                      N° TVA (optionnel)
                    </label>
                    <input
                      id="numeroTva"
                      name="numeroTva"
                      type="text"
                      value={formData.numeroTva}
                      onChange={handleChange}
                      placeholder="FR12345678901"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sécurité */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Sécurité
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Mot de passe */}
                <div>
                  <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="motDePasse"
                      name="motDePasse"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.motDePasse}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 ${
                        validationErrors.motDePasse ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FieldError error={validationErrors.motDePasse} />
                </div>

                {/* Confirmation */}
                <div>
                  <label htmlFor="confirmationMotDePasse" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmationMotDePasse"
                      name="confirmationMotDePasse"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmationMotDePasse}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`block w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 ${
                        validationErrors.confirmationMotDePasse ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FieldError error={validationErrors.confirmationMotDePasse} />
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
              </p>
            </div>

            {/* CGU et Newsletter */}
            <div className="mb-6 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="accepteCgu"
                  checked={formData.accepteCgu}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5 transition-colors"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  J'accepte les{' '}
                  <a href="#" className="text-green-600 hover:underline">conditions générales d'utilisation</a>
                  {' '}et la{' '}
                  <a href="#" className="text-green-600 hover:underline">politique de confidentialité</a> *
                </span>
              </label>
              {validationErrors.accepteCgu && (
                <p className="text-red-500 text-xs ml-8">{validationErrors.accepteCgu}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="accepteNewsletter"
                  checked={formData.accepteNewsletter}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5 transition-colors"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Je souhaite recevoir les offres promotionnelles et actualités par email
                </span>
              </label>
            </div>

            {/* Error message */}
            {error && (
              <motion.div 
                className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`group w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-base font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Créer mon compte
                  <ArrowRight className="h-5 w-5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>

      {/* Right side - Branding (identique à LoginPage) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative flex items-center justify-center w-full p-12">
          <motion.div 
            className="text-center text-white"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur rounded-3xl mb-6">
                <span className="text-6xl">🥬</span>
              </div>
              <h3 className="text-3xl font-bold mb-4">Rejoignez-nous !</h3>
              <p className="text-green-100 text-lg max-w-md mx-auto">
                Créez votre compte et accédez à des milliers de produits frais aux meilleurs prix.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {[
                { icon: '✨', text: 'Inscription gratuite' },
                { icon: '🏷️', text: 'Prix exclusifs' },
                { icon: '🚚', text: 'Livraison rapide' },
                { icon: '💼', text: 'Espace pro dédié' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="bg-white/10 backdrop-blur rounded-xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <span className="text-2xl block mb-1">{item.icon}</span>
                  <span className="text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Trust indicators */}
            <motion.div 
              className="mt-8 pt-8 border-t border-white/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-green-200 text-sm mb-3">Ils nous font confiance</p>
              <div className="flex items-center justify-center gap-4">
                <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                  <span className="text-white font-bold">+1 500</span>
                  <span className="text-green-200 text-xs block">clients</span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                  <span className="text-white font-bold">+500</span>
                  <span className="text-green-200 text-xs block">produits</span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                  <span className="text-white font-bold">4.8/5</span>
                  <span className="text-green-200 text-xs block">avis</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;