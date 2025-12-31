/**
 * Page Checkout - Version B2B Devis
 * @description Processus de commande simplifié en une page
 * 
 * ✅ CORRECTION: Utilise useSettings pour les frais de livraison dynamiques
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext'; // ✅ AJOUT
import { createOrder, MODES_PAIEMENT } from '../services/orderService';
import toast from 'react-hot-toast';

// Composants checkout
import {
  InfosContact,
  AdresseLivraison,
  AdresseFacturation,
  MoyenPaiement,
  Instructions,
  Recapitulatif
} from '../components/checkout';

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

  // ✅ AJOUT: Récupérer les settings pour les frais de livraison
  const { getFraisLivraison, seuilFrancoPort, loading: settingsLoading } = useSettings();

  // ✅ Frais de livraison dynamiques depuis settings (avec calcul franco de port)
  const fraisLivraison = getFraisLivraison(totalTTC);

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
    
    // Adresse facturation
    adresseFacturation: '',
    complementFacturation: '',
    codePostalFacturation: '',
    villeFacturation: '',
    
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
  // CALCULS - ✅ Utilise fraisLivraison dynamiques
  // ==========================================

  const totalCommande = totalTTC + fraisLivraison;

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

    // Adresse livraison
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
  // SOUMISSION - ✅ Passe fraisLivraison à createOrder
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      const firstError = document.querySelector('.error-field');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Passer les frais de livraison dynamiques à createOrder
      const result = await createOrder(formData, fraisLivraison);

      if (result.success) {
        resetCartLocal();
        
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
  // RENDER - Attendre les settings
  // ==========================================

  if (!user || isEmpty) {
    return null;
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Adresse livraison pour le composant facturation
  const adresseLivraison = {
    adresse: formData.adresse,
    complement: formData.complement,
    codePostal: formData.codePostal,
    ville: formData.ville
  };

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
              
              {/* 1. Infos Contact */}
              <InfosContact
                formData={formData}
                errors={errors}
                onChange={handleChange}
                stepNumber={1}
              />

              {/* 2. Adresse Livraison */}
              <AdresseLivraison
                formData={formData}
                errors={errors}
                onChange={handleChange}
                userId={user?.id}
                stepNumber={2}
              />

              {/* 3. Adresse Facturation */}
              <AdresseFacturation
                formData={formData}
                errors={errors}
                onChange={handleChange}
                adresseLivraison={adresseLivraison}
                stepNumber={3}
              />

              {/* 4. Mode de Paiement */}
              <MoyenPaiement
                formData={formData}
                onChange={handleChange}
                modesPaiement={MODES_PAIEMENT}
                stepNumber={4}
              />

              {/* 5. Instructions */}
              <Instructions
                formData={formData}
                onChange={handleChange}
                stepNumber={5}
              />

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
            <Recapitulatif
              items={items}
              itemCount={itemCount}
              subtotalHT={subtotalHT}
              totalTVA={totalTVA}
              totalTTC={totalTTC}
              savings={savings}
              fraisLivraison={fraisLivraison}
              totalCommande={totalCommande}
              formData={formData}
              errors={errors}
              onChange={handleChange}
              isSubmitting={isSubmitting}
              formatPrice={formatPrice}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;