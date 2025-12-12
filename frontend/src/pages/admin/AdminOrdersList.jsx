/**
 * Admin Orders List
 * @description Page de gestion des commandes côté admin
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  MapPin,
  CreditCard,
  ArrowRight,
  FileText
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

// Configuration des statuts
const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: 'yellow', icon: Clock, next: 'CONFIRMEE' },
  CONFIRMEE: { label: 'Confirmée', color: 'blue', icon: CheckCircle, next: 'EN_PREPARATION' },
  EN_PREPARATION: { label: 'En préparation', color: 'purple', icon: Package, next: 'EXPEDIEE' },
  EXPEDIEE: { label: 'Expédiée', color: 'indigo', icon: Truck, next: 'LIVREE' },
  LIVREE: { label: 'Livrée', color: 'green', icon: CheckCircle, next: null },
  ANNULEE: { label: 'Annulée', color: 'red', icon: XCircle, next: null }
};

const AdminOrdersList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0
  });

  // Filtres
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    statut: searchParams.get('statut') || '',
    dateDebut: searchParams.get('dateDebut') || '',
    dateFin: searchParams.get('dateFin') || '',
    orderBy: 'createdAt',
    orderDir: 'DESC'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [openMenu, setOpenMenu] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Chargement des commandes
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getOrders({
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        statut: filters.statut || undefined,
        dateDebut: filters.dateDebut || undefined,
        dateFin: filters.dateFin || undefined,
        orderBy: filters.orderBy,
        orderDir: filters.orderDir
      });

      setOrders(response.data || []);
      setStats(response.stats || null);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  // Charger les stats globales
  const loadStats = async () => {
    try {
      const statsResponse = await adminService.getOrderStats();
      setStats(statsResponse);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  useEffect(() => {
    loadOrders(1);
    loadStats();
  }, [filters.statut, filters.dateDebut, filters.dateFin, filters.orderBy, filters.orderDir]);

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Formatter argent
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Formatter date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Badge statut
  const StatusBadge = ({ statut, size = 'md' }) => {
    const config = STATUTS[statut] || STATUTS.EN_ATTENTE;
    const Icon = config.icon;
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
    
    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      indigo: 'bg-indigo-100 text-indigo-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${colorClasses[config.color]}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Voir détail commande
  const handleViewDetail = async (order) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await adminService.getOrderById(order.id);
      setSelectedOrder(detail);
    } catch (error) {
      console.error('Erreur chargement détail:', error);
      toast.error('Erreur lors du chargement de la commande');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
    setOpenMenu(null);
  };

  // Changer statut
  const handleChangeStatus = async (order, newStatus) => {
    try {
      setUpdatingStatus(order.id);
      await adminService.updateOrderStatus(order.id, newStatus);
      toast.success(`Commande passée en "${STATUTS[newStatus].label}"`);
      loadOrders(pagination.page);
      loadStats();
      
      // Si modal ouverte, recharger le détail
      if (showDetailModal && selectedOrder?.id === order.id) {
        const detail = await adminService.getOrderById(order.id);
        setSelectedOrder(detail);
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(null);
    }
    setOpenMenu(null);
  };

  // Annuler commande
  const handleCancel = async (order) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    
    try {
      setUpdatingStatus(order.id);
      await adminService.updateOrderStatus(order.id, 'ANNULEE');
      toast.success('Commande annulée');
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setUpdatingStatus(null);
    }
    setOpenMenu(null);
  };

  // Filtrer par statut (onglets)
  const handleStatusFilter = (statut) => {
    setFilters(prev => ({ ...prev, statut }));
    setSearchParams(statut ? { statut } : {});
  };

  // Pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadOrders(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>
          <p className="text-gray-500 mt-1">Gérez les commandes clients</p>
        </div>
      </div>

      {/* Stats par statut */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          {Object.entries(STATUTS).map(([key, config]) => {
            const Icon = config.icon;
            const count = stats.parStatut?.[key.toLowerCase()] || stats[`nb${key.charAt(0)}${key.slice(1).toLowerCase()}`] || 0;
            const isActive = filters.statut === key;
            
            return (
              <button
                key={key}
                onClick={() => handleStatusFilter(isActive ? '' : key)}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                  config.color === 'yellow' ? 'bg-yellow-100' :
                  config.color === 'blue' ? 'bg-blue-100' :
                  config.color === 'purple' ? 'bg-purple-100' :
                  config.color === 'indigo' ? 'bg-indigo-100' :
                  config.color === 'green' ? 'bg-green-100' :
                  'bg-red-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    config.color === 'yellow' ? 'text-yellow-600' :
                    config.color === 'blue' ? 'text-blue-600' :
                    config.color === 'purple' ? 'text-purple-600' :
                    config.color === 'indigo' ? 'text-indigo-600' :
                    config.color === 'green' ? 'text-green-600' :
                    'text-red-600'
                  }`} />
                </div>
                <p className="text-lg font-bold text-gray-800">{count}</p>
                <p className="text-xs text-gray-500 truncate">{config.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, client..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Toggle filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
              showFilters ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trier par
                  </label>
                  <select
                    value={filters.orderBy}
                    onChange={(e) => setFilters({ ...filters, orderBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="createdAt">Date</option>
                    <option value="total">Montant</option>
                    <option value="numero">Numéro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre
                  </label>
                  <select
                    value={filters.orderDir}
                    onChange={(e) => setFilters({ ...filters, orderDir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="DESC">Plus récentes</option>
                    <option value="ASC">Plus anciennes</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande trouvée</p>
          </div>
        ) : (
          <>
            {/* Table desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Commande</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Articles</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <p className="font-mono font-medium text-gray-800">{order.numeroCommande}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">
                          {order.client?.prenom} {order.client?.nom}
                        </p>
                        <p className="text-sm text-gray-500">{order.client?.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{formatDate(order.dateCommande)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-gray-800">{order.nbArticles || 0}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-semibold text-gray-800">{formatMoney(order.totalTtc)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge statut={order.statut} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="relative flex items-center justify-end gap-2">
                          {/* Bouton action rapide */}
                          {STATUTS[order.statut]?.next && (
                            <button
                              onClick={() => handleChangeStatus(order, STATUTS[order.statut].next)}
                              disabled={updatingStatus === order.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={`Passer en "${STATUTS[STATUTS[order.statut].next].label}"`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => setOpenMenu(openMenu === order.id ? null : order.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>

                          <AnimatePresence>
                            {openMenu === order.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
                              >
                                <button
                                  onClick={() => handleViewDetail(order)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" /> Voir le détail
                                </button>
                                
                                {/* Changement de statut */}
                                {order.statut !== 'ANNULEE' && order.statut !== 'LIVREE' && (
                                  <>
                                    <hr className="my-1" />
                                    <p className="px-4 py-1 text-xs text-gray-400 uppercase">Changer le statut</p>
                                    {Object.entries(STATUTS).map(([key, config]) => {
                                      if (key === order.statut || key === 'ANNULEE') return null;
                                      const Icon = config.icon;
                                      return (
                                        <button
                                          key={key}
                                          onClick={() => handleChangeStatus(order, key)}
                                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Icon className="w-4 h-4" /> {config.label}
                                        </button>
                                      );
                                    })}
                                  </>
                                )}
                                
                                {/* Annuler */}
                                {order.statut !== 'ANNULEE' && order.statut !== 'LIVREE' && (
                                  <>
                                    <hr className="my-1" />
                                    <button
                                      onClick={() => handleCancel(order)}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" /> Annuler la commande
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Liste mobile */}
            <div className="lg:hidden divide-y divide-gray-100">
              {orders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-medium text-gray-800">{order.numeroCommande}</p>
                      <p className="text-sm text-gray-500">
                        {order.client?.prenom} {order.client?.nom}
                      </p>
                    </div>
                    <StatusBadge statut={order.statut} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {formatDate(order.dateCommande)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{formatMoney(order.totalTtc)}</span>
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} commandes)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détail Commande */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Commande {selectedOrder?.numeroCommande}
                  </h2>
                  {selectedOrder && <StatusBadge statut={selectedOrder.statut} />}
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : selectedOrder ? (
                <div className="p-6 space-y-6">
                  {/* Infos client & livraison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Client</span>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {selectedOrder.client?.prenom} {selectedOrder.client?.nom}
                      </p>
                      <p className="text-sm text-gray-500">{selectedOrder.client?.email}</p>
                      {selectedOrder.client?.telephone && (
                        <p className="text-sm text-gray-500">{selectedOrder.client?.telephone}</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Livraison</span>
                      </div>
                      <p className="font-semibold text-gray-800">{selectedOrder.adresseLivraison?.nom}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.adresseLivraison?.adresse}</p>
                      <p className="text-sm text-gray-500">
                        {selectedOrder.adresseLivraison?.codePostal} {selectedOrder.adresseLivraison?.ville}
                      </p>
                    </div>
                  </div>

                  {/* Paiement */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-medium">Paiement</span>
                    </div>
                    <p className="text-gray-800">
                      Mode: <span className="font-medium">{selectedOrder.modePaiement || 'À la livraison'}</span>
                    </p>
                  </div>

                  {/* Produits */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Produits ({selectedOrder.lignes?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.lignes?.map((ligne, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {ligne.produit?.imageUrl ? (
                              <img 
                                src={ligne.produit.imageUrl} 
                                alt={ligne.produit?.nom} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {ligne.produit?.nom || 'Produit'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatMoney(ligne.prixUnitaireHt)} × {ligne.quantite}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatMoney(ligne.totalTtc)}
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
                        <span className="text-gray-800">{formatMoney(selectedOrder.totalHt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">TVA</span>
                        <span className="text-gray-800">{formatMoney(selectedOrder.totalTva)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Livraison</span>
                        <span className="text-gray-800">{formatMoney(selectedOrder.fraisLivraison || 15)}</span>
                      </div>
                      <hr className="border-green-200" />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-800">Total TTC</span>
                        <span className="text-green-600">{formatMoney(selectedOrder.totalTtc)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedOrder.statut !== 'ANNULEE' && selectedOrder.statut !== 'LIVREE' && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {STATUTS[selectedOrder.statut]?.next && (
                        <button
                          onClick={() => handleChangeStatus(selectedOrder, STATUTS[selectedOrder.statut].next)}
                          disabled={updatingStatus === selectedOrder.id}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Passer en "{STATUTS[STATUTS[selectedOrder.statut].next].label}"
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleCancel(selectedOrder);
                          setShowDetailModal(false);
                        }}
                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside pour fermer les menus */}
      {openMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
};

export default AdminOrdersList;
