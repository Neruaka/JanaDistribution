/**
 * Page Checkout - Version B2B Devis
 * @description Processus de commande simplifié en une page
 * Le client passe commande et reçoit un devis par email
 * Paiement effectué en physique (pas de paiement en ligne)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Truck,
  FileText,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  Info,
  Loader2
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder, MODES_PAIEMENT, getFraisLivraison } from '../services/orderService';
import toast from 'react-hot-toast';

// ==========================================
// CONSTANTES
// ==========================================

const FRAIS_LIVRAISON = getFraisLivraison();

// Icônes pour les modes de paiement
const PAIEMENT_ICONS = {
  ESPECES: Banknote,
  CARTE: CreditCard,
  VIREMENT: Building2,
  CHEQUE: Receipt
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    itemCount,
    subtotalHT,
    totalTVA,
    totalTTC,
    savings,
    isEmpty,
    resetCartLocal
  } = useCart();

  // États
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Formulaire
  const [formData, setFormData] = useState({
    // Infos contact
    prenom: '',
    nom: '',
    entreprise: '',
    telephone: '',
    
    // Adresse livraison
    adresse: '',
    complement: '',
    codePostal: '',
    ville: '',
    
    // Options
    modePaiement: 'CARTE',
    instructions: '',
    
    // CGV
    acceptCGV: false
  });

  // Pré-remplir avec les infos utilisateur
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        prenom: user.prenom || '',
        nom: user.nom || '',
        entreprise: user.entreprise || '',
        telephone: user.telephone || ''
      }));
    }
  }, [user]);

  // Rediriger si panier vide
  useEffect(() => {
    if (isEmpty) {
      navigate('/panier');
    }
  }, [isEmpty, navigate]);

  // Rediriger si non connecté
  useEffect(() => {
    if (!user) {
      toast.error('Veuillez vous connecter pour passer commande');
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  // ==========================================
  // CALCULS
  // ==========================================

  const totalCommande = totalTTC + FRAIS_LIVRAISON;

  // ==========================================
  // FORMATAGE
  // ==========================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    const newErrors = {};

    // Infos contact
    if (!formData.prenom.trim()) newErrors.prenom = 'Prénom requis';
    if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Téléphone requis';
    } else if (!/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    // Adresse
    if (!formData.adresse.trim()) newErrors.adresse = 'Adresse requise';
    if (!formData.codePostal.trim()) {
      newErrors.codePostal = 'Code postal requis';
    } else if (!/^\d{5}$/.test(formData.codePostal)) {
      newErrors.codePostal = 'Code postal invalide (5 chiffres)';
    }
    if (!formData.ville.trim()) newErrors.ville = 'Ville requise';

    // CGV
    if (!formData.acceptCGV) {
      newErrors.acceptCGV = 'Vous devez accepter les conditions générales de vente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================
  // SOUMISSION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      // Scroll vers la première erreur
      const firstError = document.querySelector('.error-field');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOrder(formData);

      if (result.success) {
        // Réinitialiser le panier local (le backend l'a déjà vidé)
        resetCartLocal();
        
        // Rediriger vers la page de confirmation
        navigate(`/commande/confirmation/${result.data.id}`, {
          state: {
            order: result.data,
            fromCheckout: true
          }
        });
        
        toast.success('Commande enregistrée avec succès !');
      } else {
        toast.error(result.message || 'Erreur lors de la commande');
      }
    } catch (error) {
      console.error('Erreur commande:', error);
      toast.error(error.message || 'Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (!user || isEmpty) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/panier"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au panier
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-800">
            Finaliser ma commande
          </h1>
          <p className="text-gray-600 mt-2">
            Remplissez les informations ci-dessous pour recevoir votre devis par email
          </p>
        </div>

        {/* Bandeau info B2B */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-800 font-medium">Comment ça marche ?</p>
            <p className="text-blue-700 text-sm mt-1">
              Après validation, vous recevrez un <strong>devis par email</strong> récapitulant votre commande. 
              Notre équipe vous contactera pour confirmer la livraison. 
              Le paiement s'effectue <strong>à la livraison</strong> selon le mode choisi.
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne principale - Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">1</span>
                  </div>
                  Informations de contact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prénom */}
                  <div className={errors.prenom ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => handleChange('prenom', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.prenom
                          ? 'border-red-300 focus:ring-red-200 bg-red-50'
                          : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                      }`}
                      placeholder="Jean"
                    />
                    {errors.prenom && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.prenom}
                      </p>
                    )}
                  </div>

                  {/* Nom */}
                  <div className={errors.nom ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => handleChange('nom', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.nom
                          ? 'border-red-300 focus:ring-red-200 bg-red-50'
                          : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                      }`}
                      placeholder="Dupont"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.nom}
                      </p>
                    )}
                  </div>

                  {/* Entreprise */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entreprise <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.entreprise}
                      onChange={(e) => handleChange('entreprise', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
                      placeholder="Ma Société SARL"
                    />
                  </div>

                  {/* Téléphone */}
                  <div className={errors.telephone ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleChange('telephone', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.telephone
                          ? 'border-red-300 focus:ring-red-200 bg-red-50'
                          : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                      }`}
                      placeholder="06 12 34 56 78"
                    />
                    {errors.telephone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.telephone}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Section Adresse */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <MapPin className="w-5 h-5 text-gray-400" />
                  Adresse de livraison
                </h2>

                <div className="space-y-4">
                  {/* Adresse */}
                  <div className={errors.adresse ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => handleChange('adresse', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.adresse
                          ? 'border-red-300 focus:ring-red-200 bg-red-50'
                          : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                      }`}
                      placeholder="15 rue de la Paix"
                    />
                    {errors.adresse && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.adresse}
                      </p>
                    )}
                  </div>

                  {/* Complément */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complément d'adresse <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(e) => handleChange('complement', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors"
                      placeholder="Bâtiment A, 2ème étage..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Code postal */}
                    <div className={errors.codePostal ? 'error-field' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.codePostal}
                        onChange={(e) => handleChange('codePostal', e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          errors.codePostal
                            ? 'border-red-300 focus:ring-red-200 bg-red-50'
                            : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                        }`}
                        placeholder="75001"
                        maxLength={5}
                      />
                      {errors.codePostal && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.codePostal}
                        </p>
                      )}
                    </div>

                    {/* Ville */}
                    <div className={`sm:col-span-2 ${errors.ville ? 'error-field' : ''}`}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.ville}
                        onChange={(e) => handleChange('ville', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          errors.ville
                            ? 'border-red-300 focus:ring-red-200 bg-red-50'
                            : 'border-gray-200 focus:ring-green-200 focus:border-green-400'
                        }`}
                        placeholder="Paris"
                      />
                      {errors.ville && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.ville}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section Mode de paiement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <Banknote className="w-5 h-5 text-gray-400" />
                  Mode de paiement prévu
                </h2>
                <p className="text-sm text-gray-500 mb-4 ml-10">
                  Indiquez comment vous souhaitez régler à la livraison
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MODES_PAIEMENT.map((mode) => {
                    const Icon = PAIEMENT_ICONS[mode.id] || CreditCard;
                    const isSelected = formData.modePaiement === mode.id;
                    
                    return (
                      <label
                        key={mode.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="modePaiement"
                          value={mode.id}
                          checked={isSelected}
                          onChange={(e) => handleChange('modePaiement', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                            {mode.label}
                          </p>
                          <p className="text-xs text-gray-500">{mode.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </motion.div>

              {/* Section Instructions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">4</span>
                  </div>
                  <FileText className="w-5 h-5 text-gray-400" />
                  Instructions de livraison
                </h2>
                <p className="text-sm text-gray-500 mb-4 ml-10">
                  Horaires préférés, code d'accès, informations utiles...
                </p>

                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-colors resize-none"
                  rows={3}
                  maxLength={500}
                  placeholder="Ex: Livraison le matin de préférence, code portail 1234..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.instructions.length}/500 caractères
                </p>
              </motion.div>

              {/* CGV et bouton validation (mobile) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm p-6 lg:hidden"
              >
                {/* CGV */}
                <div className={`mb-6 ${errors.acceptCGV ? 'error-field' : ''}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.acceptCGV}
                      onChange={(e) => handleChange('acceptCGV', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-600">
                      J'accepte les{' '}
                      <Link to="/cgv" className="text-green-600 hover:underline" target="_blank">
                        conditions générales de vente
                      </Link>{' '}
                      et la{' '}
                      <Link to="/confidentialite" className="text-green-600 hover:underline" target="_blank">
                        politique de confidentialité
                      </Link>
                      . <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.acceptCGV && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-8">
                      <AlertCircle className="w-4 h-4" />
                      {errors.acceptCGV}
                    </p>
                  )}
                </div>

                {/* Bouton validation */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Valider et recevoir mon devis
                    </>
                  )}
                </button>
              </motion.div>
            </div>

            {/* Colonne latérale - Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                  Récapitulatif ({itemCount} article{itemCount > 1 ? 's' : ''})
                </h2>

                {/* Liste produits */}
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product?.image ? (
                          <img src={item.product.image} alt={item.product?.name || 'Produit'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.product?.name || 'Produit'}</p>
                        <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatPrice(item.subtotal || (item.effectivePrice * item.quantity) || 0)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total HT</span>
                    <span>{formatPrice(subtotalHT)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TVA</span>
                    <span>{formatPrice(totalTVA)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Économies</span>
                      <span>-{formatPrice(savings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Livraison
                    </span>
                    <span>{formatPrice(FRAIS_LIVRAISON)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t border-gray-200">
                    <span>Total TTC</span>
                    <span className="text-green-600">{formatPrice(totalCommande)}</span>
                  </div>
                </div>

                {/* CGV et bouton (desktop) */}
                <div className="hidden lg:block mt-6 pt-6 border-t border-gray-100">
                  {/* CGV */}
                  <div className={`mb-4 ${errors.acceptCGV ? 'error-field' : ''}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptCGV}
                        onChange={(e) => handleChange('acceptCGV', e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5"
                      />
                      <span className="text-sm text-gray-600">
                        J'accepte les{' '}
                        <Link to="/cgv" className="text-green-600 hover:underline" target="_blank">
                          CGV
                        </Link>{' '}
                        et la{' '}
                        <Link to="/confidentialite" className="text-green-600 hover:underline" target="_blank">
                          politique de confidentialité
                        </Link>
                        . <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {errors.acceptCGV && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.acceptCGV}
                      </p>
                    )}
                  </div>

                  {/* Bouton validation */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Valider ma commande
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    Un devis vous sera envoyé par email
                  </p>
                </div>

                {/* Info sécurité */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Données sécurisées</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Paiement à la livraison</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
