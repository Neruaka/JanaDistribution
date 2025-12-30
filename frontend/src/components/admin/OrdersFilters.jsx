/**
 * Composant OrdersFilters
 * @description Filtres de recherche pour les commandes admin
 * @location frontend/src/components/admin/OrdersFilters.jsx
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';

const OrdersFilters = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = filters.search || filters.dateDebut || filters.dateFin;

  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {filters.search && (
            <button
              onClick={() => handleChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle filtres avancés */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
            showAdvanced 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Filtres avancés */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-100">
              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleChange('dateDebut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => handleChange('dateFin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Trier par */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trier par
                </label>
                <select
                  value={filters.orderBy}
                  onChange={(e) => handleChange('orderBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="createdAt">Date</option>
                  <option value="total">Montant</option>
                  <option value="statut">Statut</option>
                </select>
              </div>

              {/* Ordre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordre
                </label>
                <select
                  value={filters.orderDir}
                  onChange={(e) => handleChange('orderDir', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="DESC">Plus récentes</option>
                  <option value="ASC">Plus anciennes</option>
                </select>
              </div>
            </div>

            {/* Bouton reset */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClearFilters}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Effacer les filtres
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersFilters;