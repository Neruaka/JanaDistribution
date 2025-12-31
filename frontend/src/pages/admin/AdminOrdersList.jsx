/**
 * Page Admin Commandes - VERSION REFACTORISÉE
 * @description Gestion des commandes avec composants modulaires
 * @location frontend/src/pages/admin/AdminOrdersList.jsx
 * 
 * ✅ FIX: Bug des stats qui disparaissaient (loadOrders écrasait les stats)
 * ✅ REFACTORING: Composants modulaires + hook personnalisé
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';

// Composants
import OrdersStatsCards from '../../components/admin/OrdersStatsCards';
import OrdersFilters from '../../components/admin/OrdersFilters';
import OrdersTable from '../../components/admin/OrdersTable';
import OrderDetailModal from '../../components/admin/OrderDetailModal';
import OrderContextMenu from '../../components/admin/OrderContextMenu';

// Configuration des statuts
const STATUTS = {
  EN_ATTENTE: { label: 'En attente', next: 'CONFIRMEE' },
  CONFIRMEE: { label: 'Confirmée', next: 'EN_PREPARATION' },
  EN_PREPARATION: { label: 'En préparation', next: 'EXPEDIEE' },
  EXPEDIEE: { label: 'Expédiée', next: 'LIVREE' },
  LIVREE: { label: 'Livrée', next: null },
  ANNULEE: { label: 'Annulée', next: null }
};

const AdminOrdersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ==========================================
  // ÉTATS
  // ==========================================
  
  // Données
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Modal détail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Menu contextuel
  const [openMenuOrderId, setOpenMenuOrderId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Ref pour éviter les appels dupliqués
  const statsLoadedRef = useRef(false);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  // ✅ FIX: Charger les stats SÉPARÉMENT (une seule fois au montage)
  const loadStats = useCallback(async () => {
    try {
      const statsResponse = await adminService.getOrderStats();
      if (statsResponse) {
        setStats(statsResponse);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, []);

  // Charger les commandes (sans toucher aux stats)
  const loadOrders = useCallback(async (page = 1) => {
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
      setPagination(prev => ({
        ...prev,
        page,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
      
      // ✅ FIX: NE PAS écraser les stats ici !
      // Les stats sont chargées séparément par loadStats()
      
      return response.data || [];
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // ✅ Charger stats au montage (une seule fois)
  useEffect(() => {
    if (!statsLoadedRef.current) {
      loadStats();
      statsLoadedRef.current = true;
    }
  }, [loadStats]);

  // Charger commandes quand les filtres changent (sauf search)
  useEffect(() => {
    loadOrders(1);
  }, [filters.statut, filters.dateDebut, filters.dateFin, filters.orderBy, filters.orderDir]);

  // Recherche avec délai (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ✅ Ouvrir modal si orderId dans l'URL
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      handleViewDetailById(orderId);
      // Nettoyer l'URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('orderId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ==========================================
  // HANDLERS FILTRES
  // ==========================================

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusFilter = (statut) => {
    const newStatut = filters.statut === statut ? '' : statut;
    setFilters(prev => ({ ...prev, statut: newStatut }));
    setSearchParams(newStatut ? { statut: newStatut } : {});
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      statut: '',
      dateDebut: '',
      dateFin: '',
      orderBy: 'createdAt',
      orderDir: 'DESC'
    });
    setSearchParams({});
  };

  // ==========================================
  // HANDLERS MODAL DÉTAIL
  // ==========================================

  const handleViewDetailById = async (orderId) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await adminService.getOrderById(orderId);
      setSelectedOrder(detail);
    } catch (error) {
      console.error('Erreur chargement détail:', error);
      toast.error('Erreur lors du chargement de la commande');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = async (order) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      setOpenMenuOrderId(null);
      const detail = await adminService.getOrderById(order.id);
      setSelectedOrder(detail);
    } catch (error) {
      console.error('Erreur chargement détail:', error);
      toast.error('Erreur lors du chargement de la commande');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  // ==========================================
  // HANDLERS MENU CONTEXTUEL
  // ==========================================

  const handleOpenMenu = (e, orderId) => {
    if (openMenuOrderId === orderId) {
      setOpenMenuOrderId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
      setOpenMenuOrderId(orderId);
    }
  };

  const closeMenu = () => {
    setOpenMenuOrderId(null);
  };

  // ==========================================
  // HANDLERS ACTIONS
  // ==========================================

  const handleChangeStatus = async (order, newStatus) => {
    try {
      setUpdatingStatus(order.id);
      await adminService.updateOrderStatus(order.id, newStatus);
      toast.success(`Commande passée en "${STATUTS[newStatus].label}"`);
      
      // Recharger les données
      loadOrders(pagination.page);
      loadStats(); // ✅ Recharger aussi les stats après changement
      
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
      setOpenMenuOrderId(null);
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    
    try {
      setUpdatingStatus(order.id);
      await adminService.updateOrderStatus(order.id, 'ANNULEE');
      toast.success('Commande annulée');
      
      loadOrders(pagination.page);
      loadStats();
      
      if (showDetailModal) {
        closeDetailModal();
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setUpdatingStatus(null);
      setOpenMenuOrderId(null);
    }
  };

  // ==========================================
  // PAGINATION
  // ==========================================

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadOrders(page);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  // Trouver la commande du menu contextuel
  const menuOrder = orders.find(o => o.id === openMenuOrderId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>
          <p className="text-gray-500 mt-1">
            Gérez les commandes clients
            {pagination.total > 0 && (
              <span className="ml-2 text-sm">
                ({pagination.total} commande{pagination.total > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats par statut */}
      <OrdersStatsCards
        stats={stats}
        activeStatut={filters.statut}
        onStatutClick={handleStatusFilter}
      />

      {/* Filtres */}
      <OrdersFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Tableau des commandes */}
      <OrdersTable
        orders={orders}
        loading={loading}
        pagination={pagination}
        updatingStatus={updatingStatus}
        onViewDetail={handleViewDetail}
        onChangeStatus={handleChangeStatus}
        onOpenMenu={handleOpenMenu}
        onPageChange={goToPage}
      />

      {/* Modal Détail */}
      <AnimatePresence>
        {showDetailModal && (
          <OrderDetailModal
            order={selectedOrder}
            loading={loadingDetail}
            updatingStatus={updatingStatus}
            onClose={closeDetailModal}
            onChangeStatus={handleChangeStatus}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      {/* Menu contextuel */}
      <AnimatePresence>
        {openMenuOrderId && menuOrder && (
          <OrderContextMenu
            order={menuOrder}
            position={menuPosition}
            onClose={closeMenu}
            onViewDetail={handleViewDetail}
            onChangeStatus={handleChangeStatus}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrdersList;
