/**
 * Page Catalogue
 * @description Écran 02 — Catalogue & filtres
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

// Services
import productService from '../services/productService';
import categoryService from '../services/categoryService';

// Components
import ProductGrid from '../components/ProductGrid';
import CatalogFilters from '../components/CatalogFilters';
import Pagination from '../components/Pagination';
import ProductListRow from '../components/ProductListRow';

const SORT_OPTIONS = [
  { value: 'createdAt-DESC', label: 'Plus récents' },
  { value: 'createdAt-ASC', label: 'Plus anciens' },
  { value: 'prix-ASC', label: 'Prix croissant' },
  { value: 'prix-DESC', label: 'Prix décroissant' },
  { value: 'nom-ASC', label: 'Nom A → Z' },
  { value: 'nom-DESC', label: 'Nom Z → A' }
];

const CataloguePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grille');

  const resolveCategoryId = useCallback((categoryRef, categoryList) => {
    if (!categoryRef) return undefined;
    const byId = categoryList.find((category) => category.id === categoryRef);
    if (byId) return byId.id;
    const bySlug = categoryList.find((category) => category.slug === categoryRef);
    if (bySlug) return bySlug.id;
    return categoryRef;
  }, []);

  const getFiltersFromUrl = useCallback(() => ({
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 24,
    categorieId: searchParams.get('categorie') || undefined,
    search: searchParams.get('q') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    enStock: searchParams.get('enStock') || undefined,
    orderBy: searchParams.get('orderBy') || 'createdAt',
    orderDir: searchParams.get('orderDir') || 'DESC',
    labels: searchParams.get('labels') || undefined
  }), [searchParams]);

  const [filters, setFilters] = useState(getFiltersFromUrl);

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

  useEffect(() => {
    categoryService.getAll({ includeProductCount: true }).then((response) => {
      if (response.success) setCategories(response.data);
    }).catch((err) => console.error('Erreur chargement catégories:', err));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const effectiveCategoryId = resolveCategoryId(filters.categorieId, categories);
      const response = await productService.getAll({ ...filters, categorieId: effectiveCategoryId });
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination || { page: filters.page, limit: filters.limit, total: response.data.length, totalPages: 1 });
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError('Impossible de charger les produits. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [categories, filters, resolveCategoryId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleFilterChange = (newFilters) => {
    const updated = { ...newFilters, page: 1 };
    setFilters(updated);
    updateUrl(updated);
  };

  const handlePageChange = (page) => {
    const updated = { ...filters, page };
    setFilters(updated);
    updateUrl(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    const defaults = { page: 1, limit: 24, orderBy: 'createdAt', orderDir: 'DESC' };
    setFilters(defaults);
    setSearchParams({});
  };

  const handleSortChange = (value) => {
    const [orderBy, orderDir] = value.split('-');
    handleFilterChange({ ...filters, orderBy, orderDir });
  };

  const activeCategory = filters.categorieId
    ? categories.find((c) => c.id === filters.categorieId || c.slug === filters.categorieId)
    : null;

  const pageTitle = filters.search
    ? `Résultats pour « ${filters.search} »`
    : activeCategory?.nom || 'Tous nos produits';

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Barre de titre */}
      <div className="bg-white border-b border-sand-200 px-4 md:px-10 py-4">
        <div className="text-[12.5px] text-graphite-400 mb-2">
          <Link to="/" className="hover:text-ink-900">Accueil</Link>
          <span className="text-[#C3CBC6] mx-1.5">/</span>
          {filters.search || activeCategory ? (
            <>
              <Link to="/catalogue" className="hover:text-ink-900">Catalogue</Link>
              <span className="text-[#C3CBC6] mx-1.5">/</span>
              <span className="text-ink-900">{filters.search ? `Recherche « ${filters.search} »` : activeCategory.nom}</span>
            </>
          ) : (
            <span className="text-ink-900">Catalogue</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[29px] font-extrabold tracking-tight text-ink-900">{pageTitle}</h1>
            <div className="text-[13.5px] text-graphite-500 mt-1">
              <span className="font-mono text-ink-900">{pagination.total}</span> référence{pagination.total > 1 ? 's' : ''} disponible{pagination.total > 1 ? 's' : ''} · prix affichés HT
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <select
                value={`${filters.orderBy}-${filters.orderDir}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none border border-sand-250 rounded-6 h-[38px] pl-3 pr-8 text-[13.5px] text-graphite-900 bg-white focus:outline-none focus:border-ink-900"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>Trier : {opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-graphite-500">▼</span>
            </div>
            <div className="flex border border-sand-250 rounded-6 overflow-hidden h-[38px]">
              <button
                type="button"
                onClick={() => setViewMode('grille')}
                className={`px-[13px] text-[12.5px] transition-colors ${viewMode === 'grille' ? 'bg-ink-900 text-white' : 'text-graphite-600 hover:bg-sand-50'}`}
              >
                Grille
              </button>
              <button
                type="button"
                onClick={() => setViewMode('liste')}
                className={`px-[13px] text-[12.5px] transition-colors ${viewMode === 'liste' ? 'bg-ink-900 text-white' : 'text-graphite-600 hover:bg-sand-50'}`}
              >
                Liste
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Corps : filtres + résultats */}
      <div className="grid grid-cols-1 md:grid-cols-[262px_1fr] gap-[22px] px-4 md:px-10 py-[22px] pb-10">
        <CatalogFilters
          categories={categories}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <div className="flex flex-col gap-3.5 min-w-0">
          {error && (
            <div className="bg-danger-bg border border-danger-border rounded-8 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger-text flex-shrink-0" />
              <p className="text-[13.5px] text-danger-text">{error}</p>
              <button onClick={loadProducts} className="ml-auto text-[13px] font-semibold text-danger-text hover:underline">
                Réessayer
              </button>
            </div>
          )}

          {viewMode === 'grille' ? (
            <ProductGrid
              products={products}
              loading={loading}
              imageHeight={168}
              columns={4}
              emptyMessage={filters.search ? `Aucun produit ne correspond à « ${filters.search} »` : 'Aucun produit dans cette sélection'}
            />
          ) : loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[88px] bg-white border border-sand-200 rounded-8 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-sand-200 rounded-8">
              <p className="text-[15px] font-semibold text-ink-900 mb-1">
                {filters.search ? `Aucun produit ne correspond à « ${filters.search} »` : 'Aucun produit dans cette sélection'}
              </p>
              <p className="text-[13px] text-graphite-500">Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {products.map((product) => <ProductListRow key={product.id} product={product} />)}
            </div>
          )}

          {!loading && pagination.total > 0 && (
            <div className="flex items-center justify-between bg-white border border-sand-200 rounded-8 px-[18px] py-[13px]">
              <span className="text-[13px] text-graphite-500">
                Affichage de {rangeStart}–{rangeEnd} sur {pagination.total} référence{pagination.total > 1 ? 's' : ''}
              </span>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CataloguePage;
