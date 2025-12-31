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
  const [selectedProducts, setSelectedProducts] = useState([]);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAll(true);
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
        estActif: 'all',
        orderBy: 'createdAt',
        orderDir: 'DESC'
      };

      if (stockFilter === 'low') {
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
  }, [searchParams, search, selectedCategory, stockFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStockFilter('');
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
    
    // États d'actions
    exporting,
    importing,
    deleting,
    
    // Filtres
    search,
    setSearch,
    selectedCategory,
    stockFilter,
    selectedProducts,
    
    // Handlers filtres
    handleSearch,
    handleCategoryChange,
    handleStockFilterChange,
    handlePageChange,
    clearFilters,
    
    // Handlers sélection
    handleSelectAll,
    handleSelectProduct,
    clearSelection,
    
    // Handlers actions
    handleDeleteProduct,
    handleBulkDelete,
    handleExport,
    handleImport,
    
    // Reload
    loadProducts
  };
};

export default useProductsAdmin;
