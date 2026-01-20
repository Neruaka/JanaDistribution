/**
 * Page Confirmation de Commande - VERSION CORRIGÉE
 * @description Affiche la confirmation après validation d'une commande
 * @location frontend/src/pages/OrderConfirmationPage.jsx
 * 
 * ✅ CORRECTION: Utilise getImageUrl pour les images des produits
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ShoppingBag,
  FileText,
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  Receipt
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { getOrderById, MODES_PAIEMENT } from '../services/orderService';
import { getImageUrl } from '../utils/imageUtils'; // ✅ AJOUT
import toast from 'react-hot-toast';

const PAIEMENT_ICONS = {
  ESPECES: Banknote,
  CARTE: CreditCard,
  VIREMENT: Building2,
  CHEQUE: Receipt
};

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const result = await getOrderById(orderId);
        if (result.success) {
          setOrder(result.data);
        } else {
          setError(result.message || 'Commande non trouvée');
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Arrêter les confettis après 5 secondes
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [orderId]);

  const handleCopyNumero = () => {
    if (order?.numeroCommande) {
      navigator.clipboard.writeText(order.numeroCommande);
      setCopied(true);
      toast.success('Numéro copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Commande non trouvée</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const modePaiement = MODES_PAIEMENT.find(m => m.id === order.modePaiement);
  const PaiementIcon = PAIEMENT_ICONS[order.modePaiement] || CreditCard;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b']}
        />
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Merci pour votre commande ! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Votre demande de devis a bien été enregistrée
          </p>
        </motion.div>

        {/* Numéro de commande */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-800 font-mono">
                  {order.numeroCommande}
                </span>
                <button
                  onClick={handleCopyNumero}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copier"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="font-medium text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(order.dateCommande)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notification email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">
                Confirmation envoyée par email
              </h3>
              <p className="text-blue-600 text-sm">
                Un récapitulatif de votre commande avec le devis a été envoyé à votre adresse email.
                Vérifiez également vos spams si vous ne le voyez pas.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Récapitulatif */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            Récapitulatif ({order.lignes?.length || 0} article{(order.lignes?.length || 0) > 1 ? 's' : ''})
          </h2>

          {/* Liste des produits */}
          <div className="divide-y divide-gray-100 mb-4">
            {order.lignes?.slice(0, 5).map((ligne, index) => (
              <div key={index} className="flex items-center gap-4 py-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {/* ✅ CORRECTION: Utilise getImageUrl */}
                  {ligne.produit?.imageUrl ? (
                    <img 
                      src={getImageUrl(ligne.produit.imageUrl)} 
                      alt={ligne.nomProduit} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{ligne.nomProduit}</p>
                  <p className="text-sm text-gray-500">Qté: {ligne.quantite}</p>
                </div>
                <p className="font-semibold text-gray-800">{formatPrice(ligne.totalTtc)}</p>
              </div>
            ))}
            
            {order.lignes?.length > 5 && (
              <div className="py-3 text-center text-gray-500 text-sm">
                + {order.lignes.length - 5} autre(s) article(s)
              </div>
            )}
          </div>

          {/* Totaux */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
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
                Livraison
              </span>
              <span>{formatPrice(order.fraisLivraison)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t border-gray-200">
              <span>Total TTC</span>
              <span className="text-green-600">{formatPrice(order.totalTtc)}</span>
            </div>
          </div>
        </motion.div>

        {/* Informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Adresse */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Adresse de livraison
            </h3>
            {order.adresseLivraison && (
              <div className="text-gray-600 text-sm space-y-1">
                <p className="font-medium text-gray-800">
                  {order.adresseLivraison.prenom} {order.adresseLivraison.nom}
                </p>
                <p>{order.adresseLivraison.adresse}</p>
                <p>{order.adresseLivraison.codePostal} {order.adresseLivraison.ville}</p>
                {order.adresseLivraison.telephone && (
                  <p className="flex items-center gap-1 pt-2">
                    <Phone className="w-4 h-4" />
                    {order.adresseLivraison.telephone}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Paiement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <PaiementIcon className="w-5 h-5 text-gray-400" />
              Mode de paiement
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-800 flex items-center gap-2">
                <PaiementIcon className="w-5 h-5 text-green-600" />
                {modePaiement?.label || order.modePaiement}
              </p>
              {modePaiement?.description && (
                <p className="text-sm text-gray-500 mt-1">{modePaiement.description}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to={`/mes-commandes/${orderId}`}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Voir le détail
          </Link>
          <Link
            to="/catalogue"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Continuer mes achats
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>
            Une question ? Contactez-nous au{' '}
            <a href="tel:+33123456789" className="text-green-600 hover:underline font-medium">
              01 23 45 67 89
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
