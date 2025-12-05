/**
 * Page Confirmation Commande
 * @description Affiche la confirmation après une commande réussie
 * Récapitule les informations et indique les prochaines étapes
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  ArrowRight,
  Home,
  ShoppingBag,
  Copy,
  Check,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrderById, getStatutInfo, MODES_PAIEMENT } from '../services/orderService';
import toast from 'react-hot-toast';

// ==========================================
// CONSTANTES
// ==========================================

const PAIEMENT_ICONS = {
  ESPECES: Banknote,
  CARTE: CreditCard,
  VIREMENT: Building2,
  CHEQUE: Receipt
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Charger la commande si pas dans le state
  useEffect(() => {
    const fetchOrder = async () => {
      if (order) return;

      try {
        setLoading(true);
        const result = await getOrderById(orderId);
        
        if (result.success) {
          setOrder(result.data);
        } else {
          setError(result.message || 'Commande non trouvée');
        }
      } catch (err) {
        console.error('Erreur chargement commande:', err);
        setError(err.message || 'Erreur lors du chargement de la commande');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, order]);

  // Rediriger si non connecté
  useEffect(() => {
    if (!user) {
      navigate('/connexion');
    }
  }, [user, navigate]);

  // ==========================================
  // FORMATAGE
  // ==========================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCopyNumero = () => {
    if (order?.numeroCommande) {
      navigator.clipboard.writeText(order.numeroCommande);
      setCopied(true);
      toast.success('Numéro copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ==========================================
  // RENDER LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER ERROR
  // ==========================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Commande non trouvée</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/mes-commandes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Voir mes commandes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  const modePaiement = MODES_PAIEMENT.find(m => m.id === order?.modePaiement);
  const PaiementIcon = PAIEMENT_ICONS[order?.modePaiement] || CreditCard;
  const statutInfo = getStatutInfo(order?.statut);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header succès */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Commande enregistrée !
          </h1>
          <p className="text-gray-600">
            Merci pour votre commande. Un devis va vous être envoyé par email.
          </p>
        </motion.div>

        {/* Numéro de commande */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {order?.numeroCommande}
              </p>
            </div>
            <button
              onClick={handleCopyNumero}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Copier</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDate(order?.dateCommande)}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${statutInfo.color}-100 text-${statutInfo.color}-700`}>
              <span className={`w-2 h-2 rounded-full bg-${statutInfo.color}-500`}></span>
              <span>{statutInfo.label}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Prochaines étapes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Prochaines étapes
            </h2>

            <div className="space-y-4">
              {/* Étape 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Devis par email</p>
                  <p className="text-sm text-gray-500">
                    Vous allez recevoir un devis détaillé à l'adresse <strong>{user?.email}</strong>
                  </p>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Confirmation téléphonique</p>
                  <p className="text-sm text-gray-500">
                    Notre équipe vous contactera pour confirmer la date et l'heure de livraison
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Truck className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Livraison</p>
                  <p className="text-sm text-gray-500">
                    Votre commande sera livrée à l'adresse indiquée
                  </p>
                </div>
              </div>

              {/* Étape 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <PaiementIcon className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Paiement à la livraison</p>
                  <p className="text-sm text-gray-500">
                    Règlement par <strong>{modePaiement?.label?.toLowerCase() || order?.modePaiement}</strong> lors de la réception
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Récapitulatif livraison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Adresse de livraison
            </h2>

            {order?.adresseLivraison && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-800">
                  {order.adresseLivraison.prenom} {order.adresseLivraison.nom}
                </p>
                {order.adresseLivraison.entreprise && (
                  <p className="text-gray-600">{order.adresseLivraison.entreprise}</p>
                )}
                <p className="text-gray-600">{order.adresseLivraison.adresse}</p>
                {order.adresseLivraison.complement && (
                  <p className="text-gray-600">{order.adresseLivraison.complement}</p>
                )}
                <p className="text-gray-600">
                  {order.adresseLivraison.codePostal} {order.adresseLivraison.ville}
                </p>
                {order.adresseLivraison.telephone && (
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.adresseLivraison.telephone}
                  </p>
                )}
              </div>
            )}

            {order?.instructionsLivraison && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-1">Instructions :</p>
                <p className="text-sm text-gray-600 italic">"{order.instructionsLivraison}"</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Récapitulatif produits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm p-6 mt-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            Détail de la commande ({order?.lignes?.length || 0} article{(order?.lignes?.length || 0) > 1 ? 's' : ''})
          </h2>

          {/* Liste produits */}
          <div className="divide-y divide-gray-100">
            {order?.lignes?.map((ligne, index) => (
              <div key={index} className="flex items-center gap-4 py-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ligne.imageUrl ? (
                    <img src={ligne.imageUrl} alt={ligne.nomProduit} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{ligne.nomProduit}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(ligne.prixUnitaire)} × {ligne.quantite}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatPrice(ligne.totalTTC)}</p>
                  <p className="text-xs text-gray-500">TTC</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total HT</span>
              <span>{formatPrice(order?.totalHT || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA</span>
              <span>{formatPrice(order?.totalTVA || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Livraison
              </span>
              <span>{formatPrice(order?.fraisLivraison || 0)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total TTC</span>
              <span className="text-green-600">{formatPrice(order?.totalTTC || 0)}</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
        >
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <Link
            to="/catalogue"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Continuer mes achats
          </Link>
          <Link
            to="/mes-commandes"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Voir mes commandes
          </Link>
        </motion.div>

        {/* Note contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>
            Une question ? Contactez-nous au{' '}
            <a href="tel:+33123456789" className="text-green-600 hover:underline font-medium">
              01 23 45 67 89
            </a>
            {' '}ou par email à{' '}
            <a href="mailto:contact@jana-distribution.fr" className="text-green-600 hover:underline font-medium">
              contact@jana-distribution.fr
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
