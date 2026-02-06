/**
 * Page Catalogue
 * @description Liste des produits avec filtres, recherche et pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Services
import productService from '../services/productService';
import categoryService from '../services/categoryService';

// Context
import { useCart } from '../contexts/CartContext';

// Components
import ProductGrid from '../components/ProductGrid';
import CatalogFilters from '../components/CatalogFilters';
import Pagination from '../components/Pagination';

const CataloguePage = () => {
  // URL params pour les filtres
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Cart context
  const { addItem } = useCart();

  // États
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolveCategoryId = useCallback((categoryRef, categoryList) => {
    if (!categoryRef) return undefined;

    const byId = categoryList.find((category) => category.id === categoryRef);
    if (byId) return byId.id;

    const bySlug = categoryList.find((category) => category.slug === categoryRef);
    if (bySlug) return bySlug.id;

    return categoryRef;
  }, []);

  // Filtres initiaux depuis l'URL
  const getFiltersFromUrl = useCallback(() => {
    return {
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 12,
      categorieId: searchParams.get('categorie') || undefined,
      search: searchParams.get('q') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      enStock: searchParams.get('enStock') || undefined,
      orderBy: searchParams.get('orderBy') || 'createdAt',
      orderDir: searchParams.get('orderDir') || 'DESC',
      labels: searchParams.get('labels') || undefined
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(getFiltersFromUrl);

  // Synchroniser les filtres avec l'URL
  const updateUrl = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page);
    if (newFilters.categorieId) params.set('categorie', newFilters.categorieId);
    if (newFilters.search) params.set('q', newFilters.search);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.enStock) params.set('enStock', newFilters.enStock);
    if (newFilters.orderBy && newFilters.orderBy !== 'createdAt') params.set('orderBy', newFilters.orderBy);
    if (newFilters.orderDir && newFilters.orderDir !== 'DESC') params.set('orderDir', newFilters.orderDir);
    if (newFilters.labels) params.set('labels', newFilters.labels);
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAll({ includeProductCount: true });
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
    setError(null);

    try {
      const effectiveCategoryId = resolveCategoryId(filters.categorieId, categories);
      const requestFilters = {
        ...filters,
        categorieId: effectiveCategoryId
      };

      const response = await productService.getAll(requestFilters);
      
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination || {
          page: filters.page,
          limit: filters.limit,
          total: response.data.length,
          totalPages: 1
        });
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError('Impossible de charger les produits. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [categories, filters, resolveCategoryId]);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Gestionnaires
  const handleFilterChange = (newFilters) => {
    // Reset page à 1 quand on change les filtres (sauf si on change juste la page)
    const updatedFilters = { ...newFilters, page: 1 };
    setFilters(updatedFilters);
    updateUrl(updatedFilters);
  };

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    updateUrl(updatedFilters);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      page: 1,
      limit: 12,
      orderBy: 'createdAt',
      orderDir: 'DESC'
    };
    setFilters(defaultFilters);
    setSearchParams({});
  };

  const handleAddToCart = async (product) => {
    const success = await addItem(product.id, 1);
    if (success) {
      // Le toast est déjà géré dans le CartContext
    }
  };

  // Titre dynamique selon les filtres
  const getPageTitle = () => {
    if (filters.search) {
      return `Résultats pour "${filters.search}"`;
    }
    if (filters.categorieId) {
      const category = categories.find((c) => (
        c.id === filters.categorieId || c.slug === filters.categorieId
      ));
      return category ? category.nom : 'Catalogue';
    }
    return 'Tous nos produits';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8" />
              <h1 className="text-3xl md:text-4xl font-bold">
                {getPageTitle()}
              </h1>
            </div>
            <p className="text-green-100 text-lg">
              Découvrez notre sélection de produits frais et de qualité
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <CatalogFilters
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                loading={loading}
                productCount={pagination.total}
              />
            </div>
          </aside>

          {/* Products */}
          <main className="lg:col-span-3">
            {/* Mobile Filters */}
            <div className="lg:hidden mb-6">
              <CatalogFilters
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                loading={loading}
                productCount={pagination.total}
              />
            </div>

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
                <button
                  onClick={loadProducts}
                  className="ml-auto text-red-600 hover:text-red-800 font-medium"
                >
                  Réessayer
                </button>
              </motion.div>
            )}

            {/* Results Info */}
            {!loading && !error && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-800">{pagination.total}</span>{' '}
                  produit{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
                </p>
                
                {/* View options - future feature */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-gray-500">Affichage :</span>
                  <button className="p-2 rounded-lg bg-green-100 text-green-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              onAddToCart={handleAddToCart}
              emptyMessage={
                filters.search
                  ? `Aucun produit ne correspond à "${filters.search}"`
                  : "Aucun produit dans cette catégorie"
              }
              columns={3}
            />

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CataloguePage;
