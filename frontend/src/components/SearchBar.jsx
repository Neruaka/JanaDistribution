/**
 * Composant SearchBar
 * @description Barre de recherche avec autocomplete produits et catégories
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, FolderOpen, X, Loader2 } from 'lucide-react';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { getImageUrl } from '../utils/imageUtils';

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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    products: [],
    categories: []
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce la recherche
  const debouncedQuery = useDebounce(query, 300);

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
        productService.getAll({ search: searchQuery, limit: 5 }),
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
  }, []);

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
      navigate(`/catalogue?q=${encodeURIComponent(query)}`);
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
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
          placeholder="Rechercher produits, catégories..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
        />
        
        {/* Loading / Clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown résultats */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {/* Catégories */}
          {results.categories.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Catégories
                </span>
              </div>
              {results.categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedIndex === getItemIndex('category', index) ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{category.nom}</p>
                    <p className="text-xs text-gray-500">
                      {category.productCount || 0} produit{(category.productCount || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Catégorie
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Produits */}
          {results.products.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Produits
                </span>
              </div>
              {results.products.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedIndex === getItemIndex('product', index) ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={getImageUrl(product.imageUrl)} 
                        alt={product.nom} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{product.nom}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {product.categorie?.nom || 'Sans catégorie'}
                    </p>
                  </div>
                  <div className="text-right">
                    {product.prixPromo ? (
                      <>
                        <p className="font-semibold text-green-600">{product.prixPromo.toFixed(2)} €</p>
                        <p className="text-xs text-gray-400 line-through">{product.prix.toFixed(2)} €</p>
                      </>
                    ) : (
                      <p className="font-semibold text-gray-800">{product.prix?.toFixed(2)} €</p>
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
              className="w-full px-4 py-3 text-center text-sm text-green-600 hover:bg-green-50 border-t border-gray-100 font-medium transition-colors"
            >
              Voir tous les résultats pour "{query}"
            </button>
          )}

          {/* Aucun résultat */}
          {!loading && query.length >= 2 && results.products.length === 0 && results.categories.length === 0 && (
            <div className="px-4 py-6 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucun résultat pour "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Essayez avec d'autres termes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
