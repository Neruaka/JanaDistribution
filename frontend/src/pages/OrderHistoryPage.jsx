/**
 * Page Historique des Commandes
 * @description Liste des commandes de l'utilisateur avec filtres et pagination
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ShoppingBag,
  Calendar,
  ArrowUpDown,
  X,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserOrders, getStatutInfo, STATUTS_COMMANDE } from '../services/orderService';
import { getImageUrl } from '../utils/imageUtils';

// ==========================================
// CONSTANTES
// ==========================================

const STATUT_ICONS = {
  EN_ATTENTE: Clock,
  CONFIRMEE: CheckCircle,
  EN_PREPARATION: Package,
  EXPEDIEE: Truck,
  LIVREE: CheckCircle,
  ANNULEE: XCircle
};

const STATUT_COLORS = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMEE: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_PREPARATION: 'bg-purple-100 text-purple-700 border-purple-200',
  EXPEDIEE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  LIVREE: 'bg-green-100 text-green-700 border-green-200',
  ANNULEE: 'bg-red-100 text-red-700 border-red-200'
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // États
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filtres
  const [filters, setFilters] = useState({
    statut: searchParams.get('statut') || '',
    orderBy: searchParams.get('orderBy') || 'createdAt',
    orderDir: searchParams.get('orderDir') || 'DESC'
  });
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================
  // CHARGEMENT DES COMMANDES
  // ==========================================

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const page = parseInt(searchParams.get('page')) || 1;
        const result = await getUserOrders({
          page,
          limit: pagination.limit,
          statut: filters.statut || undefined,
          orderBy: filters.orderBy,
          orderDir: filters.orderDir
        });

        if (result.success) {
          setOrders(result.data || []);
          setPagination(prev => ({
            ...prev,
            page: result.pagination?.page || page,
            total: result.pagination?.total || 0,
            totalPages: result.pagination?.totalPages || 0
          }));
        } else {
          setError(result.message || 'Erreur lors du chargement');
        }
      } catch (err) {
        console.error('Erreur chargement commandes:', err);
        setError(err.message || 'Erreur lors du chargement des commandes');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams, filters.statut, filters.orderBy, filters.orderDir]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Mettre à jour l'URL
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset à la page 1
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  const clearFilters = () => {
    setFilters({
      statut: '',
      orderBy: 'createdAt',
      orderDir: 'DESC'
    });
    setSearchParams({});
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
  // RENDER LOADING
  // ==========================================

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-600">Chargement de vos commandes...</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  const hasFilters = filters.statut;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-green-600" />
            Mes commandes
          </h1>
          <p className="text-gray-600 mt-2">
            Retrouvez l'historique de toutes vos commandes
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtre par statut */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUTS_COMMANDE).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trier par
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.orderBy}
                  onChange={(e) => handleFilterChange('orderBy', e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                >
                  <option value="createdAt">Date</option>
                  <option value="total">Montant</option>
                  <option value="statut">Statut</option>
                  <option value="numero">Numéro</option>
                </select>
                <button
                  onClick={() => handleFilterChange('orderDir', filters.orderDir === 'DESC' ? 'ASC' : 'DESC')}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  title={filters.orderDir === 'DESC' ? 'Plus récent d\'abord' : 'Plus ancien d\'abord'}
                >
                  <ArrowUpDown className={`w-5 h-5 text-gray-500 ${filters.orderDir === 'ASC' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Liste vide */}
        {!loading && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {hasFilters ? 'Aucune commande trouvée' : 'Aucune commande pour le moment'}
            </h2>
            <p className="text-gray-500 mb-6">
              {hasFilters 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Découvrez notre catalogue et passez votre première commande !'}
            </p>
            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            ) : (
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Voir le catalogue
              </Link>
            )}
          </motion.div>
        )}

        {/* Liste des commandes */}
        {orders.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => {
                const StatusIcon = STATUT_ICONS[order.statut] || Package;
                const statusColor = STATUT_COLORS[order.statut] || 'bg-gray-100 text-gray-700';
                const statutInfo = getStatutInfo(order.statut);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <Link to={`/mes-commandes/${order.id}`} className="block">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          {/* Info principale */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-semibold text-gray-800">
                                {order.numeroCommande}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statutInfo.label}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(order.dateCommande)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {order.nbArticles || order.lignes?.length || 0} article{(order.nbArticles || order.lignes?.length || 0) > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Prix et action */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-800">
                                {formatPrice(order.totalTtc)}
                              </p>
                              <p className="text-xs text-gray-500">TTC</p>
                            </div>
                            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full group-hover:bg-green-100 transition-colors">
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Aperçu produits */}
                        {order.lignes && order.lignes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                              {order.lignes.slice(0, 4).map((ligne, i) => (
                                <div
                                  key={i}
                                  className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
                                  title={ligne.nomProduit}
                                >
                                  {ligne.produit?.imageUrl ? (
                                    <img src={getImageUrl(ligne.produit.imageUrl)} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              ))}
                              {order.lignes.length > 4 && (
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                                  +{order.lignes.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-green-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Info pagination */}
        {pagination.total > 0 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {pagination.total} commande{pagination.total > 1 ? 's' : ''} au total
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
