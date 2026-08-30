/**
 * Composant SearchBar
 * @description Barre de recherche scopée avec autocomplete produits et catégories
 * @see design_handoff_jana_refonte/JanaHeader.dc.html
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FolderOpen, X, Loader2 } from 'lucide-react';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { getImageUrl } from '../utils/imageUtils';
import { formatAmount } from '../utils/priceUtils';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // États
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('');
  const [categories, setCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    products: [],
    categories: []
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce la recherche
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    let mounted = true;
    categoryService.getAll().then((response) => {
      if (mounted && response.success && Array.isArray(response.data)) {
        setCategories(response.data.filter((c) => c.estActif !== false));
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Recherche
  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ products: [], categories: [] });
      return;
    }

    setLoading(true);

    try {
      // Recherche parallèle produits et catégories
      const [productsResponse, categoriesResponse] = await Promise.all([
        productService.getAll({ search: searchQuery, limit: 5, categorieId: scope || undefined }),
        categoryService.getAll({ includeProductCount: true })
      ]);

      // Filtrer les catégories côté client (car pas d'endpoint de recherche)
      const filteredCategories = categoriesResponse.success
        ? categoriesResponse.data
            .filter(cat =>
              cat.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .slice(0, 3)
        : [];

      setResults({
        products: productsResponse.success ? productsResponse.data.slice(0, 5) : [],
        categories: filteredCategories
      });
    } catch (error) {
      console.error('Erreur recherche:', error);
      setResults({ products: [], categories: [] });
    } finally {
      setLoading(false);
    }
  }, [scope]);

  // Effectuer la recherche quand le query change
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  // Ouvrir le dropdown quand on a des résultats
  useEffect(() => {
    const hasResults = results.products.length > 0 || results.categories.length > 0;
    setIsOpen(hasResults && query.length >= 2);
    setSelectedIndex(-1);
  }, [results, query]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation clavier
  const handleKeyDown = (e) => {
    const totalItems = results.categories.length + results.products.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          // Sélectionner l'item actif
          if (selectedIndex < results.categories.length) {
            handleSelectCategory(results.categories[selectedIndex]);
          } else {
            handleSelectProduct(results.products[selectedIndex - results.categories.length]);
          }
        } else if (query.length >= 2) {
          // Recherche globale
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Handlers de sélection
  const handleSelectCategory = (category) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/catalogue?categorie=${category.id}`);
  };

  const handleSelectProduct = (product) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/produit/${product.slug}`);
  };

  const handleSearchSubmit = () => {
    if (query.length >= 2) {
      setIsOpen(false);
      const params = new URLSearchParams({ q: query });
      if (scope) params.set('categorie', scope);
      navigate(`/catalogue?${params.toString()}`);
      setQuery('');
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ products: [], categories: [] });
    inputRef.current?.focus();
  };

  // Calculer l'index pour le highlight
  const getItemIndex = (type, index) => {
    if (type === 'category') return index;
    return results.categories.length + index;
  };

  return (
    <div className={`relative font-sans ${className}`}>
      {/* Chrome de la barre : scope + input + bouton */}
      <div className="flex h-11 border-[1.5px] border-ink-900 rounded-6 overflow-hidden bg-white">
        <div className="hidden sm:flex items-center border-r border-sand-200 bg-sand-50 relative">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="appearance-none bg-transparent pl-[14px] pr-7 h-full text-[13.5px] text-graphite-700 focus:outline-none cursor-pointer max-w-[180px]"
          >
            <option value="">Tout le catalogue</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 text-[9px] text-graphite-500">▼</span>
        </div>

        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.products.length > 0 || results.categories.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder="Référence, produit, marque…"
            className="w-full h-full pl-[14px] pr-9 text-[14px] text-ink-900 placeholder:text-graphite-100 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="absolute right-3 w-4 h-4 text-graphite-400 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClear}
              className="absolute right-3 p-0.5 hover:bg-sand-100 rounded-full transition-colors"
              aria-label="Effacer"
            >
              <X className="w-4 h-4 text-graphite-400" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSearchSubmit}
          className="hidden sm:block bg-ink-900 text-white px-[22px] text-[13.5px] font-semibold hover:bg-ink-800 transition-colors"
        >
          Rechercher
        </button>
      </div>

      {/* Dropdown résultats */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-8 border border-sand-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {/* Catégories */}
          {results.categories.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-sand-100 border-b border-sand-200">
                <span className="text-[11px] font-semibold text-graphite-500 uppercase tracking-wide">
                  Catégories
                </span>
              </div>
              {results.categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sand-50 transition-colors ${
                    selectedIndex === getItemIndex('category', index) ? 'bg-success-bg' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-success-bg rounded-6 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-ink-900 truncate">{category.nom}</p>
                    <p className="text-[11.5px] text-graphite-500">
                      {category.productCount || 0} produit{(category.productCount || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-[11px] text-green-700 bg-success-bg px-2 py-1 rounded-full">
                    Catégorie
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Produits */}
          {results.products.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-sand-100 border-b border-sand-200">
                <span className="text-[11px] font-semibold text-graphite-500 uppercase tracking-wide">
                  Produits
                </span>
              </div>
              {results.products.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sand-50 transition-colors ${
                    selectedIndex === getItemIndex('product', index) ? 'bg-success-bg' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-sand-100 rounded-6 flex items-center justify-center flex-shrink-0 overflow-hidden placeholder-stripe">
                    {product.imageUrl ? (
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-graphite-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-ink-900 truncate">{product.nom}</p>
                    <p className="text-[11.5px] text-graphite-500 truncate">
                      {product.categorie?.nom || 'Sans catégorie'}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    {product.prixPromo ? (
                      <>
                        <p className="text-[13.5px] font-semibold text-green-700">{formatAmount(product.prixPromo)}</p>
                        <p className="text-[11px] text-graphite-300 line-through">{formatAmount(product.prix)}</p>
                      </>
                    ) : (
                      <p className="text-[13.5px] font-semibold text-ink-900">{formatAmount(product.prix)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Voir tous les résultats */}
          {(results.products.length > 0 || results.categories.length > 0) && (
            <button
              onClick={handleSearchSubmit}
              className="w-full px-4 py-3 text-center text-[13.5px] text-green-700 hover:bg-success-bg border-t border-sand-200 font-semibold transition-colors"
            >
              Voir tous les résultats pour "{query}"
            </button>
          )}

          {/* Aucun résultat */}
          {!loading && query.length >= 2 && results.products.length === 0 && results.categories.length === 0 && (
            <div className="px-4 py-6 text-center">
              <Package className="w-10 h-10 text-graphite-200 mx-auto mb-2" />
              <p className="text-graphite-500">Aucun résultat pour "{query}"</p>
              <p className="text-[12px] text-graphite-400 mt-1">Essayez avec d'autres termes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
