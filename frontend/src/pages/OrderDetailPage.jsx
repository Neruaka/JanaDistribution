/**
 * Page Détail Commande - VERSION CORRIGÉE
 * @description Affiche le détail complet d'une commande avec timeline
 * @location frontend/src/pages/OrderDetailPage.jsx
 * 
 * ✅ CORRECTION: Utilise getImageUrl pour les images des produits
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
  ShoppingBag,
  Mail,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrderById, cancelOrder, getStatutInfo, canCancelOrder, MODES_PAIEMENT } from '../services/orderService';
import { getImageUrl } from '../utils/imageUtils'; // ✅ AJOUT
import toast from 'react-hot-toast';

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

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCopyNumero = () => {
    if (order?.numeroCommande) {
      navigator.clipboard.writeText(order.numeroCommande);
      setCopied(true);
      toast.success('Numéro copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
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

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.statut === 'ANNULEE') return -1;
    return STATUT_ORDER.indexOf(order.statut);
  };

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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Commande non trouvée</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/mes-commandes" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">
            <ArrowLeft className="w-4 h-4" />
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const modePaiement = MODES_PAIEMENT.find(m => m.id === order.modePaiement);
  const PaiementIcon = PAIEMENT_ICONS[order.modePaiement] || CreditCard;
  const statutInfo = getStatutInfo(order.statut);
  const canCancel = canCancelOrder(order.statut);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link to="/mes-commandes" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour à mes commandes
          </Link>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800 font-mono">{order.numeroCommande}</h1>
                <button onClick={handleCopyNumero} className="p-2 hover:bg-gray-100 rounded-lg">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <p className="text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Passée le {formatDate(order.dateCommande)}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
              order.statut === 'ANNULEE' ? 'bg-red-100 text-red-700' : order.statut === 'LIVREE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {order.statut === 'ANNULEE' ? <XCircle className="w-5 h-5" /> : order.statut === 'LIVREE' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              {statutInfo.label}
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        {order.statut !== 'ANNULEE' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Suivi de commande</h2>
            <div className="relative">
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(getCurrentStepIndex() / (TIMELINE_STEPS.length - 1)) * 100}%` }} />
              </div>
              <div className="relative flex justify-between">
                {TIMELINE_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const completed = getCurrentStepIndex() >= index;
                  const current = getCurrentStepIndex() === index;
                  return (
                    <div key={step.statut} className="flex flex-col items-center">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} ${current ? 'ring-4 ring-green-100' : ''}`}>
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`mt-2 text-xs font-medium text-center ${completed ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Adresse livraison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-400" />
            Adresse de livraison
          </h2>
          {order.adresseLivraison && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-800">{order.adresseLivraison.prenom} {order.adresseLivraison.nom}</p>
              <p className="text-gray-600 mt-2">{order.adresseLivraison.adresse}</p>
              <p className="text-gray-600">{order.adresseLivraison.codePostal} {order.adresseLivraison.ville}</p>
              {order.adresseLivraison.telephone && <p className="text-gray-600 mt-2 flex items-center gap-2"><Phone className="w-4 h-4" />{order.adresseLivraison.telephone}</p>}
            </div>
          )}
        </motion.div>

        {/* Détail des produits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            Détail de la commande ({order.lignes?.length || 0} article{(order.lignes?.length || 0) > 1 ? 's' : ''})
          </h2>

          <div className="divide-y divide-gray-100">
            {order.lignes?.map((ligne, index) => (
              <div key={index} className="flex items-center gap-4 py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {/* ✅ CORRECTION: Utilise getImageUrl */}
                  {ligne.produit?.imageUrl ? (
                    <img src={getImageUrl(ligne.produit.imageUrl)} alt={ligne.nomProduit} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{ligne.nomProduit}</p>
                  <p className="text-sm text-gray-500">{formatPrice(ligne.prixUnitaireHt)} × {ligne.quantite}</p>
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
            <div className="flex justify-between text-gray-600"><span>Sous-total HT</span><span>{formatPrice(order.totalHt)}</span></div>
            <div className="flex justify-between text-gray-600"><span>TVA</span><span>{formatPrice(order.totalTva)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Livraison</span><span>{formatPrice(order.fraisLivraison)}</span></div>
            <div className="flex justify-between text-2xl font-bold text-gray-800 pt-3 border-t border-gray-200">
              <span>Total TTC</span><span className="text-green-600">{formatPrice(order.totalTtc)}</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link to="/mes-commandes" className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />Retour aux commandes
          </Link>
          <Link to="/catalogue" className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">
            <ShoppingBag className="w-5 h-5" />Continuer mes achats
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
