/**
 * Composant OrderDetailModal
 * @description Modal de détail d'une commande
 * @location frontend/src/components/admin/OrderDetailModal.jsx
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  MapPin,
  CreditCard,
  Package,
  ArrowRight,
  XCircle,
  Clock,
  CheckCircle,
  Truck,
  History,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUtils';
import CommandeStatutTimeline from './CommandeStatutTimeline';
import adminService from '../../services/adminService';

const STATUTS = {
  EN_ATTENTE:             { label: 'En attente',              color: 'yellow', Icon: Clock,        next: 'CONFIRMEE' },
  CONFIRMEE:              { label: 'Confirmée',               color: 'blue',   Icon: CheckCircle,  next: 'EN_PREPARATION' },
  EN_PREPARATION:         { label: 'En préparation',          color: 'purple', Icon: Package,      next: 'EXPEDIEE' },
  EXPEDIEE:               { label: 'Expédiée',                color: 'indigo', Icon: Truck,        next: 'LIVREE' },
  LIVREE:                 { label: 'Livrée',                  color: 'green',  Icon: CheckCircle,  next: null },
  ANNULEE:                { label: 'Annulée',                 color: 'red',    Icon: XCircle,      next: null },
  REMBOURSE:              { label: 'Remboursée',              color: 'gray',   Icon: RotateCcw,    next: null },
  PARTIELLEMENT_REMBOURSE:{ label: 'Part. remboursée',        color: 'orange', Icon: RotateCcw,    next: null }
};

const STATUTS_REMBOURSABLES = ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'PARTIELLEMENT_REMBOURSE'];

// Badge statut
const StatusBadge = ({ statut }) => {
  const config = STATUTS[statut] || STATUTS.EN_ATTENTE;
  const { Icon } = config;
  
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    gray:   'bg-gray-100 text-gray-600',
    orange: 'bg-orange-100 text-orange-700'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Helpers
const formatMoney = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const OrderDetailModal = ({
  order,
  loading,
  updatingStatus,
  onClose,
  onChangeStatus,
  onCancel
}) => {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundMontant, setRefundMontant] = useState('');
  const [refundRaison, setRefundRaison] = useState('');
  const [refunding, setRefunding] = useState(false);

  if (!order && !loading) return null;

  const canChangeStatus = order && !['ANNULEE', 'LIVREE', 'REMBOURSE'].includes(order.statut);
  const nextStatus = order ? STATUTS[order.statut]?.next : null;
  const canRefund = order && STATUTS_REMBOURSABLES.includes(order.statut) && order.paiementStatut === 'PAID';

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    const montant = parseFloat(refundMontant);
    if (!montant || montant <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (montant > order.totalTtc) {
      toast.error(`Le montant ne peut pas dépasser ${formatMoney(order.totalTtc)}`);
      return;
    }
    try {
      setRefunding(true);
      await adminService.initiateRefund(order.id, { montant, raison: refundRaison });
      toast.success(`Remboursement de ${formatMoney(montant)} initié`);
      setShowRefundModal(false);
      setRefundMontant('');
      setRefundRaison('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du remboursement');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Commande {order?.numeroCommande || '...'}
              </h2>
              {order && <StatusBadge statut={order.statut} />}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
          </div>
        ) : order ? (
          <div className="p-6 space-y-6">
            {/* Infos client & livraison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Client</span>
                </div>
                <p className="font-semibold text-gray-800">
                  {order.client?.prenom} {order.client?.nom}
                </p>
                <p className="text-sm text-gray-500">{order.client?.email}</p>
                {order.client?.telephone && (
                  <p className="text-sm text-gray-500">{order.client?.telephone}</p>
                )}
              </div>
              
              {/* Livraison */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Livraison</span>
                </div>
                {order.adresseLivraison ? (
                  <>
                    <p className="font-semibold text-gray-800">{order.adresseLivraison.nom}</p>
                    <p className="text-sm text-gray-500">{order.adresseLivraison.adresse}</p>
                    <p className="text-sm text-gray-500">
                      {order.adresseLivraison.codePostal} {order.adresseLivraison.ville}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Adresse non renseignée</p>
                )}
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Paiement</span>
              </div>
              <p className="text-gray-800">
                Mode: <span className="font-medium">{order.modePaiement || 'À la livraison'}</span>
              </p>
            </div>

            {/* Produits */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produits ({order.lignes?.length || 0})
              </h4>
              <div className="space-y-2">
                {order.lignes?.map((ligne, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {ligne.produit?.imageUrl ? (
                        <img 
                          src={getImageUrl(ligne.produit.imageUrl)} 
                          alt={ligne.produit?.nom} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {ligne.produit?.nom || ligne.nomProduit || 'Produit'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatMoney(ligne.prixUnitaireHt)} × {ligne.quantite}
                      </p>
                    </div>
                    
                    {/* Total ligne */}
                    <p className="font-semibold text-gray-800">
                      {formatMoney(ligne.totalTtc || (ligne.prixUnitaireHt * ligne.quantite * 1.055))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totaux */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total HT</span>
                  <span className="text-gray-800">{formatMoney(order.totalHt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA</span>
                  <span className="text-gray-800">{formatMoney(order.totalTva)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="text-gray-800">{formatMoney(order.fraisLivraison || 0)}</span>
                </div>
                <hr className="border-green-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Total TTC</span>
                  <span className="text-green-600">{formatMoney(order.totalTtc)}</span>
                </div>
              </div>
            </div>

            {/* Historique statuts */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique
              </h4>
              <CommandeStatutTimeline commandeId={order.id} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {canChangeStatus && nextStatus && (
                <button
                  onClick={() => onChangeStatus(order, nextStatus)}
                  disabled={updatingStatus === order.id}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingStatus === order.id ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Passer en "{STATUTS[nextStatus]?.label}"
                </button>
              )}

              {canRefund && (
                <button
                  onClick={() => { setRefundMontant(String(order.totalTtc)); setShowRefundModal(true); }}
                  disabled={refunding}
                  className="px-4 py-2.5 bg-orange-50 text-orange-600 rounded-xl font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rembourser
                </button>
              )}

              {canChangeStatus && (
                <button
                  onClick={() => onCancel(order)}
                  disabled={updatingStatus === order.id}
                  className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Modal remboursement */}
      <AnimatePresence>
        {showRefundModal && order && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowRefundModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-orange-500" />
                  Initier un remboursement
                </h3>
                <button onClick={() => setShowRefundModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Commande <span className="font-medium">{order.numeroCommande}</span> — Total : <span className="font-medium">{formatMoney(order.totalTtc)}</span>
              </p>

              <form onSubmit={handleRefundSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant à rembourser (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={order.totalTtc}
                    value={refundMontant}
                    onChange={e => setRefundMontant(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={refundRaison}
                    onChange={e => setRefundRaison(e.target.value)}
                    placeholder="Ex : produit endommagé, erreur de commande…"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={refunding}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {refunding ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Confirmer le remboursement
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderDetailModal;
