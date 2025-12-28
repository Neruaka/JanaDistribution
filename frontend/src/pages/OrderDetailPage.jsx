/**
 * Page Détail Commande
 * @description Affiche le détail complet d'une commande avec timeline
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  Copy,
  Check,
  Calendar,
  Hash,
  ShoppingBag,
  Mail,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrderById, cancelOrder, getStatutInfo, canCancelOrder, MODES_PAIEMENT } from '../services/orderService';
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

const TIMELINE_STEPS = [
  { statut: 'EN_ATTENTE', label: 'Commande reçue', icon: Clock },
  { statut: 'CONFIRMEE', label: 'Confirmée', icon: CheckCircle },
  { statut: 'EN_PREPARATION', label: 'En préparation', icon: Package },
  { statut: 'EXPEDIEE', label: 'Expédiée', icon: Truck },
  { statut: 'LIVREE', label: 'Livrée', icon: CheckCircle }
];

const STATUT_ORDER = ['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'];

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ==========================================
  // CHARGEMENT
  // ==========================================

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
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
  }, [orderId]);

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

  const handleCancelOrder = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    setCancelling(true);
    try {
      const result = await cancelOrder(orderId);
      
      if (result.success) {
        setOrder(result.data);
        toast.success('Commande annulée avec succès');
      } else {
        toast.error(result.message || 'Erreur lors de l\'annulation');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  // ==========================================
  // FORMATAGE
  // ==========================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.statut === 'ANNULEE') return -1;
    return STATUT_ORDER.indexOf(order.statut);
  };

  const isStepCompleted = (stepIndex) => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex >= stepIndex;
  };

  const isStepCurrent = (stepIndex) => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex === stepIndex;
  };

  // Vérifier si l'adresse de facturation est différente de la livraison
  const isFacturationDifferent = () => {
    if (!order?.adresseFacturation || !order?.adresseLivraison) return false;
    
    const livraison = order.adresseLivraison;
    const facturation = order.adresseFacturation;
    
    return (
      livraison.adresse !== facturation.adresse ||
      livraison.codePostal !== facturation.codePostal ||
      livraison.ville !== facturation.ville
    );
  };

  // ==========================================
  // RENDER LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER ERROR
  // ==========================================

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Commande non trouvée</h1>
          <p className="text-gray-600 mb-6">{error || 'Cette commande n\'existe pas ou vous n\'y avez pas accès.'}</p>
          <Link
            to="/mes-commandes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  const modePaiement = MODES_PAIEMENT.find(m => m.id === order.modePaiement);
  const PaiementIcon = PAIEMENT_ICONS[order.modePaiement] || CreditCard;
  const statutInfo = getStatutInfo(order.statut);
  const canCancel = canCancelOrder(order.statut);
  const showFacturation = isFacturationDifferent();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/mes-commandes"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à mes commandes
          </Link>
        </div>

        {/* Titre et numéro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800 font-mono">
                  {order.numeroCommande}
                </h1>
                <button
                  onClick={handleCopyNumero}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copier le numéro"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Passée le {formatDate(order.dateCommande)}
              </p>
            </div>
            
            {/* Statut */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
              order.statut === 'ANNULEE' 
                ? 'bg-red-100 text-red-700' 
                : order.statut === 'LIVREE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
            }`}>
              {order.statut === 'ANNULEE' ? (
                <XCircle className="w-5 h-5" />
              ) : order.statut === 'LIVREE' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
              {statutInfo.label}
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        {order.statut !== 'ANNULEE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Suivi de commande</h2>
            
            <div className="relative">
              {/* Ligne de progression */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(getCurrentStepIndex() / (TIMELINE_STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* Étapes */}
              <div className="relative flex justify-between">
                {TIMELINE_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const completed = isStepCompleted(index);
                  const current = isStepCurrent(index);

                  return (
                    <div key={step.statut} className="flex flex-col items-center">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      } ${current ? 'ring-4 ring-green-100' : ''}`}>
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`mt-2 text-xs font-medium text-center ${
                        completed ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Commande annulée */}
        {order.statut === 'ANNULEE' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Commande annulée</h3>
                <p className="text-red-600 text-sm">
                  Cette commande a été annulée. Le stock a été restauré.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Adresses - Grid 2 colonnes ou 1 si facturation identique */}
        <div className={`grid grid-cols-1 ${showFacturation ? 'lg:grid-cols-2' : ''} gap-6`}>
          
          {/* Adresse de livraison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              Adresse de livraison
            </h2>

            {order.adresseLivraison && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {order.adresseLivraison.prenom} {order.adresseLivraison.nom}
                </p>
                {order.adresseLivraison.entreprise && (
                  <p className="text-gray-600 mt-1">{order.adresseLivraison.entreprise}</p>
                )}
                <p className="text-gray-600 mt-2">{order.adresseLivraison.adresse}</p>
                {order.adresseLivraison.complement && (
                  <p className="text-gray-600">{order.adresseLivraison.complement}</p>
                )}
                <p className="text-gray-600">
                  {order.adresseLivraison.codePostal} {order.adresseLivraison.ville}
                </p>
                {order.adresseLivraison.telephone && (
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {order.adresseLivraison.telephone}
                  </p>
                )}
              </div>
            )}

            {order.instructionsLivraison && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-1">Instructions :</p>
                <p className="text-sm text-gray-600 italic bg-yellow-50 p-3 rounded-lg">
                  "{order.instructionsLivraison}"
                </p>
              </div>
            )}

            {/* Info si facturation identique */}
            {!showFacturation && order.adresseFacturation && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Adresse de facturation identique
                </p>
              </div>
            )}
          </motion.div>

          {/* Adresse de facturation (si différente) */}
          {showFacturation && order.adresseFacturation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Adresse de facturation
              </h2>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {order.adresseFacturation.prenom || order.adresseLivraison.prenom} {order.adresseFacturation.nom || order.adresseLivraison.nom}
                </p>
                {(order.adresseFacturation.entreprise || order.adresseLivraison.entreprise) && (
                  <p className="text-gray-600 mt-1">
                    {order.adresseFacturation.entreprise || order.adresseLivraison.entreprise}
                  </p>
                )}
                <p className="text-gray-600 mt-2">{order.adresseFacturation.adresse}</p>
                {order.adresseFacturation.complement && (
                  <p className="text-gray-600">{order.adresseFacturation.complement}</p>
                )}
                <p className="text-gray-600">
                  {order.adresseFacturation.codePostal} {order.adresseFacturation.ville}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Informations de paiement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm p-6 mt-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            Informations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mode de paiement */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Mode de paiement</span>
              <span className="font-medium text-gray-800 flex items-center gap-2">
                <PaiementIcon className="w-4 h-4" />
                {modePaiement?.label || order.modePaiement}
              </span>
            </div>

            {/* Email client */}
            {user?.email && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Devis envoyé à</span>
                <span className="font-medium text-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate max-w-32">{user.email}</span>
                </span>
              </div>
            )}

            {/* Date modification */}
            {order.dateModification && order.dateModification !== order.dateCommande && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Dernière MAJ</span>
                <span className="text-gray-800">{formatDateTime(order.dateModification)}</span>
              </div>
            )}
          </div>

          {/* Bouton annulation */}
          {canCancel && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {cancelling ? 'Annulation...' : 'Annuler cette commande'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Vous pouvez annuler tant que la commande n'est pas confirmée
              </p>
            </div>
          )}
        </motion.div>

        {/* Détail des produits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm p-6 mt-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            Détail de la commande ({order.lignes?.length || 0} article{(order.lignes?.length || 0) > 1 ? 's' : ''})
          </h2>

          {/* Liste produits */}
          <div className="divide-y divide-gray-100">
            {order.lignes?.map((ligne, index) => (
              <div key={index} className="flex items-center gap-4 py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ligne.produit?.imageUrl ? (
                    <img src={ligne.produit.imageUrl} alt={ligne.nomProduit} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{ligne.nomProduit}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(ligne.prixUnitaireHt)} × {ligne.quantite}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatPrice(ligne.totalTtc)}</p>
                  <p className="text-xs text-gray-500">TTC</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="border-t-2 border-gray-200 mt-4 pt-4 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total HT</span>
              <span>{formatPrice(order.totalHt)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA</span>
              <span>{formatPrice(order.totalTva)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Frais de livraison
              </span>
              <span>{formatPrice(order.fraisLivraison)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-gray-800 pt-3 border-t border-gray-200">
              <span>Total TTC</span>
              <span className="text-green-600">{formatPrice(order.totalTtc)}</span>
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
            to="/mes-commandes"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux commandes
          </Link>
          <Link
            to="/catalogue"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Continuer mes achats
          </Link>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>
            Une question sur cette commande ? Contactez-nous au{' '}
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

export default OrderDetailPage;