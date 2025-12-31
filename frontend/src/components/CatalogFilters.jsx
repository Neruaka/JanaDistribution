/**
 * Composant CatalogFilters
 * @description Panneau de filtres pour le catalogue produits
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Filter
} from 'lucide-react';

const CatalogFilters = ({ 
  categories = [], 
  filters, 
  onFilterChange,
  onReset,
  loading = false,
  productCount = 0
}) => {
  // État local pour les filtres temporaires
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    labels: false,
    stock: false
  });

  // Synchroniser avec les filtres parents
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Labels disponibles
  const availableLabels = [
    { value: 'BIO', label: 'Bio', icon: '🌱', color: 'green' },
    { value: 'LOCAL', label: 'Local', icon: '📍', color: 'blue' },
    { value: 'PROMO', label: 'Promo', icon: '🏷️', color: 'red' },
    { value: 'NOUVEAU', label: 'Nouveau', icon: '✨', color: 'purple' },
    { value: 'AOP', label: 'AOP', icon: '🏅', color: 'amber' },
    { value: 'AOC', label: 'AOC', icon: '🏅', color: 'amber' },
    { value: 'LABEL_ROUGE', label: 'Label Rouge', icon: '🔴', color: 'red' }
  ];

  // Options de tri
  const sortOptions = [
    { value: 'createdAt-DESC', label: 'Plus récents' },
    { value: 'createdAt-ASC', label: 'Plus anciens' },
    { value: 'prix-ASC', label: 'Prix croissant' },
    { value: 'prix-DESC', label: 'Prix décroissant' },
    { value: 'nom-ASC', label: 'Nom A-Z' },
    { value: 'nom-DESC', label: 'Nom Z-A' }
  ];

  // Gestion du changement de filtre
  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Gestion de la recherche avec debounce
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (value) => {
    setLocalFilters(prev => ({ ...prev, search: value }));
    
    // Debounce de 500ms
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      onFilterChange({ ...localFilters, search: value });
    }, 500));
  };

  // Gestion des labels (toggle)
  const handleLabelToggle = (label) => {
    const currentLabels = localFilters.labels ? localFilters.labels.split(',') : [];
    let newLabels;
    
    if (currentLabels.includes(label)) {
      newLabels = currentLabels.filter(l => l !== label);
    } else {
      newLabels = [...currentLabels, label];
    }
    
    handleChange('labels', newLabels.join(',') || undefined);
  };

  // Gestion du tri
  const handleSortChange = (value) => {
    const [orderBy, orderDir] = value.split('-');
    onFilterChange({ ...localFilters, orderBy, orderDir });
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Compter les filtres actifs
  const activeFiltersCount = [
    filters.categorieId,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.labels,
    filters.enStock
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Barre de recherche et tri - toujours visible */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          {localFilters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tri */}
        <select
          value={`${filters.orderBy || 'createdAt'}-${filters.orderDir || 'DESC'}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Bouton filtres (mobile) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Panneau de filtres */}
      <div className={`lg:block ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-800">Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Catégories */}
          <div>
            <button
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="font-medium text-gray-700">Catégories</span>
              {expandedSections.categories ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.categories && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 pt-2">
                    {/* Toutes les catégories */}
                    <button
                      onClick={() => handleChange('categorieId', undefined)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !filters.categorieId
                          ? 'bg-green-100 text-green-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Toutes les catégories
                    </button>
                    
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleChange('categorieId', category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          filters.categorieId === category.id
                            ? 'bg-green-100 text-green-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {category.icone && <span>{category.icone}</span>}
                          {category.nom}
                        </span>
                        {category.productCount !== undefined && (
                          <span className="text-xs text-gray-400">
                            ({category.productCount})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prix */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="font-medium text-gray-700">Prix</span>
              {expandedSections.price ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.price && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 pt-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Min (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={localFilters.minPrice || ''}
                        onChange={(e) => handleChange('minPrice', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Max (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="∞"
                        value={localFilters.maxPrice || ''}
                        onChange={(e) => handleChange('maxPrice', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Labels */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => toggleSection('labels')}
              className="flex items-center justify-between w-full py-2 text-left"
            >
              <span className="font-medium text-gray-700">Labels & Certifications</span>
              {expandedSections.labels ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.labels && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableLabels.map(({ value, label, icon, color }) => {
                      const isActive = localFilters.labels?.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={() => handleLabelToggle(value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                            isActive
                              ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-300`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{icon}</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stock */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.enStock === 'true'}
                onChange={(e) => handleChange('enStock', e.target.checked ? 'true' : undefined)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              <span className="text-gray-700">Uniquement en stock</span>
            </label>
          </div>

          {/* Résultats */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 text-center">
              <span className="font-semibold text-gray-700">{productCount}</span> produit{productCount > 1 ? 's' : ''} trouvé{productCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogFilters;
