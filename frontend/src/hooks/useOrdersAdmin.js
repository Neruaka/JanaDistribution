/**
 * Hook useOrdersAdmin
 * @description Logique métier pour la gestion admin des commandes
 * @location frontend/src/hooks/useOrdersAdmin.js
 * 
 * ✅ FIX: Les stats ne sont plus écrasées par loadOrders
 * ✅ FIX: Ouverture automatique du modal via URL param ?orderId=xxx
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';

// Configuration des statuts
export const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: 'yellow', icon: 'Clock', next: 'CONFIRMEE' },
  CONFIRMEE: { label: 'Confirmée', color: 'blue', icon: 'CheckCircle', next: 'EN_PREPARATION' },
  EN_PREPARATION: { label: 'En préparation', color: 'purple', icon: 'Package', next: 'EXPEDIEE' },
  EXPEDIEE: { label: 'Expédiée', color: 'indigo', icon: 'Truck', next: 'LIVREE' },
  LIVREE: { label: 'Livrée', color: 'green', icon: 'CheckCircle', next: null },
  ANNULEE: { label: 'Annulée', color: 'red', icon: 'XCircle', next: null }
};

const useOrdersAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // États principaux
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

  // États modaux
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  // Charger les stats globales (séparé des commandes)
  const loadStats = useCallback(async () => {
    try {
      const statsResponse = await adminService.getOrderStats();
      if (statsResponse) {
        setStats(statsResponse);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
      // Ne pas écraser les stats existantes en cas d'erreur
    }
  }, []);

  // Charger les commandes
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
      
      // ✅ FIX: Ne pas écraser les stats ici, on utilise loadStats séparément
      // Si l'API retourne des stats, on peut les fusionner
      if (response.stats) {
        setStats(prev => prev ? { ...prev, ...response.stats } : response.stats);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Effet initial : charger stats puis commandes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Effet pour recharger quand les filtres changent (sauf search)
  useEffect(() => {
    loadOrders(1);
  }, [filters.statut, filters.dateDebut, filters.dateFin, filters.orderBy, filters.orderDir]);

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ✅ Ouvrir automatiquement le modal si orderId dans l'URL
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      handleViewDetailById(orderId);
      searchParams.delete('orderId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ==========================================
  // HANDLERS FILTRES
  // ==========================================

  const updateFilter = (key, value) => {
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
  // PAGINATION
  // ==========================================

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadOrders(page);
    }
  };

  // ==========================================
  // HANDLERS COMMANDES
  // ==========================================

  // Voir détail par ID (pour URL)
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
  };

  // Fermer modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  // Changer statut
  const handleChangeStatus = async (order, newStatus) => {
    try {
      setUpdatingStatus(order.id);
      await adminService.updateOrderStatus(order.id, newStatus);
      toast.success(`Commande passée en "${STATUTS[newStatus].label}"`);
      
      // Recharger les données
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
  };

  // Annuler commande
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
    }
  };

  return {
    // Données
    orders,
    stats,
    loading,
    pagination,
    
    // Filtres
    filters,
    updateFilter,
    handleStatusFilter,
    clearFilters,
    
    // Pagination
    goToPage,
    
    // Modal
    selectedOrder,
    showDetailModal,
    loadingDetail,
    updatingStatus,
    
    // Handlers
    handleViewDetail,
    handleViewDetailById,
    closeDetailModal,
    handleChangeStatus,
    handleCancel,
    
    // Reload
    loadOrders,
    loadStats
  };
};

export default useOrdersAdmin;
