/**
 * Composant ProductsFilters
 * @description Filtres de recherche pour la liste admin des produits
 * @location frontend/src/components/admin/ProductsFilters.jsx
 */

import { Search, X } from 'lucide-react';

const ProductsFilters = ({
  search,
  setSearch,
  selectedCategory,
  stockFilter,
  categories,
  onSearch,
  onCategoryChange,
  onStockFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = search || selectedCategory || stockFilter;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Recherche */}
        <form onSubmit={onSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Filtre catégorie */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[180px]"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icone} {cat.nom}
            </option>
          ))}
        </select>

        {/* Filtre stock */}
        <select
          value={stockFilter}
          onChange={(e) => onStockFilterChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[150px]"
        >
          <option value="">Tous les stocks</option>
          <option value="low">Stock faible</option>
          <option value="out">Rupture</option>
        </select>
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Filtres actifs:</span>
          
          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
              Recherche: "{search}"
              <button onClick={() => setSearch('')} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
              Catégorie: {categories.find(c => c.id === selectedCategory)?.nom}
              <button onClick={() => onCategoryChange('')} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {stockFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
              Stock: {stockFilter === 'low' ? 'Faible' : 'Rupture'}
              <button onClick={() => onStockFilterChange('')} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 hover:underline ml-2"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsFilters;
