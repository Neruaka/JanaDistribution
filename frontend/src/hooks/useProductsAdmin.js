/**
 * Hook useProductsAdmin
 * @description Logique métier pour la gestion admin des produits
 * @location frontend/src/hooks/useProductsAdmin.js
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import adminService from '../services/adminService';

const useProductsAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // États
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // États d'actions
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filtres
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categorie') || '');
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || '');
  const [statutFilter, setStatutFilter] = useState(searchParams.get('statut') || '');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Compteurs d'en-tete (independants des filtres actifs)
  const [counts, setCounts] = useState({ total: 0, stockFaible: 0, inactifs: 0 });

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAll({ includeInactive: true });
        if (response.success) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    };
    loadCategories();
  }, []);

  // Charger les produits
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: parseInt(searchParams.get('page')) || 1,
        limit: 10,
        search: search || undefined,
        categorieId: selectedCategory || undefined,
        estActif: statutFilter === 'actif' ? true : statutFilter === 'inactif' ? false : 'all',
        orderBy: 'createdAt',
        orderDir: 'DESC'
      };

      if (stockFilter === 'in') {
        params.enStock = true;
      } else if (stockFilter === 'out') {
        params.enStock = false;
      }

      const response = await productService.getAll(params);
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination || {
          page: params.page,
          limit: params.limit,
          total: response.data.length,
          totalPages: 1
        });
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, selectedCategory, stockFilter, statutFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Compteurs d'en-tete : total, sous le seuil (backend), inactifs — independants des filtres
  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      productService.getAll({ limit: 1, estActif: 'all' }),
      productService.getAll({ limit: 1, estActif: false }),
      adminService.getDashboardStats()
    ]).then(([totalRes, inactifsRes, statsRes]) => {
      if (!mounted) return;
      setCounts({
        total: totalRes.status === 'fulfilled' ? totalRes.value?.pagination?.total ?? 0 : 0,
        inactifs: inactifsRes.status === 'fulfilled' ? inactifsRes.value?.pagination?.total ?? 0 : 0,
        stockFaible: statsRes.status === 'fulfilled' ? statsRes.value?.produits?.stockFaible ?? 0 : 0
      });
    });
    return () => { mounted = false; };
  }, [products]);

  // ==========================================
  // HANDLERS FILTRES
  // ==========================================

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('q', search);
    } else {
      params.delete('q');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('categorie', value);
    } else {
      params.delete('categorie');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleStockFilterChange = (value) => {
    setStockFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('stock', value);
    } else {
      params.delete('stock');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleStatutFilterChange = (value) => {
    setStatutFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('statut', value);
    } else {
      params.delete('statut');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStockFilter('');
    setStatutFilter('');
    setSearchParams({});
  };

  // ==========================================
  // HANDLERS SÉLECTION
  // ==========================================

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // ==========================================
  // HANDLERS ACTIONS
  // ==========================================

  // Suppression unitaire
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await productService.delete(id);
      if (response.success) {
        toast.success('Produit supprimé avec succès');
        loadProducts();
      } else {
        toast.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setDeleting(false);
    }
  };

  // Suppression multiple
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Sélectionnez au moins un produit');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) ?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await productService.bulkDelete(selectedProducts);
      if (response.success) {
        toast.success(`${response.data.success.length} produit(s) supprimé(s)`);
        setSelectedProducts([]);
        loadProducts();
        
        if (response.data.errors.length > 0) {
          toast.error(`${response.data.errors.length} erreur(s) lors de la suppression`);
        }
      } else {
        toast.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression multiple:', err);
      toast.error('Erreur lors de la suppression des produits');
    } finally {
      setDeleting(false);
    }
  };

  // Changement de rayon en masse (boucle sur l'endpoint de mise a jour existant,
  // aucun endpoint bulk dedie cote backend)
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const handleBulkChangeCategory = async (categorieId) => {
    if (selectedProducts.length === 0 || !categorieId) return;
    setBulkUpdating(true);
    try {
      const results = await Promise.allSettled(selectedProducts.map((id) => productService.update(id, { categorieId })));
      const failed = results.filter((r) => r.status === 'rejected').length;
      toast.success(`${selectedProducts.length - failed} produit(s) déplacé(s)`);
      if (failed > 0) toast.error(`${failed} erreur(s)`);
      setSelectedProducts([]);
      loadProducts();
    } catch (err) {
      console.error('Erreur changement de rayon:', err);
      toast.error('Erreur lors du changement de rayon');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Desactivation en masse (idem : boucle sur l'update existant)
  const handleBulkDeactivate = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Désactiver ${selectedProducts.length} produit(s) ?`)) return;
    setBulkUpdating(true);
    try {
      const results = await Promise.allSettled(selectedProducts.map((id) => productService.update(id, { estActif: false })));
      const failed = results.filter((r) => r.status === 'rejected').length;
      toast.success(`${selectedProducts.length - failed} produit(s) désactivé(s)`);
      if (failed > 0) toast.error(`${failed} erreur(s)`);
      setSelectedProducts([]);
      loadProducts();
    } catch (err) {
      console.error('Erreur désactivation:', err);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Export Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await productService.exportAll();
      if (response.success) {
        return response.data; // Retourne les données pour le composant
      }
      throw new Error(response.message || 'Erreur export');
    } catch (err) {
      console.error('Erreur export:', err);
      toast.error('Erreur lors de l\'export');
      return null;
    } finally {
      setExporting(false);
    }
  };

  // Import Excel
  const handleImport = async (products, defaultCategoryId) => {
    setImporting(true);
    try {
      const response = await productService.importProducts(products, defaultCategoryId);
      
      if (response.success) {
        toast.success(`${response.data.created.length} produit(s) importé(s)`);
        
        if (response.data.errors.length > 0) {
          console.log('Erreurs import:', response.data.errors);
          toast.error(`${response.data.errors.length} produit(s) en erreur (voir console)`);
        }
        
        loadProducts();
        return response.data;
      }
      throw new Error(response.message || 'Erreur import');
    } catch (err) {
      console.error('Erreur import:', err);
      toast.error('Erreur lors de l\'import');
      return null;
    } finally {
      setImporting(false);
    }
  };

  return {
    // Données
    products,
    categories,
    loading,
    pagination,
    counts,

    // États d'actions
    exporting,
    importing,
    deleting,
    bulkUpdating,

    // Filtres
    search,
    setSearch,
    selectedCategory,
    stockFilter,
    statutFilter,
    selectedProducts,

    // Handlers filtres
    handleSearch,
    handleCategoryChange,
    handleStockFilterChange,
    handleStatutFilterChange,
    handlePageChange,
    clearFilters,

    // Handlers sélection
    handleSelectAll,
    handleSelectProduct,
    clearSelection,

    // Handlers actions
    handleDeleteProduct,
    handleBulkDelete,
    handleBulkChangeCategory,
    handleBulkDeactivate,
    handleExport,
    handleImport,

    // Reload
    loadProducts
  };
};

export default useProductsAdmin;
