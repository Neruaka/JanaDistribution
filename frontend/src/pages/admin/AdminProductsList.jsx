/**
 * Page Admin Produits - VERSION REFACTORISÉE
 * @description Gestion des produits avec composants modulaires
 * @location frontend/src/pages/admin/AdminProductsList.jsx
 * 
 * ✅ REFACTORING:
 * - Hook useProductsAdmin pour la logique
 * - ProductsFilters pour les filtres
 * - ProductsTable pour le tableau
 * - ProductsBulkActions pour les actions groupées
 * - ProductsExportImport pour l'export/import Excel
 */

import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Hook personnalisé
import useProductsAdmin from '../../hooks/useProductsAdmin';

// Composants
import ProductsFilters from '../../components/admin/ProductsFilters';
import ProductsTable from '../../components/admin/ProductsTable';
import ProductsBulkActions from '../../components/admin/ProductsBulkActions';
import ProductsExportImport, { ImportInfoBox } from '../../components/admin/ProductsExportImport';

const AdminProductsList = () => {
  const {
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
    handleImport
  } = useProductsAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
          <p className="text-gray-500">
            Gérez votre catalogue de produits
            {pagination.total > 0 && (
              <span className="ml-2 text-sm">
                ({pagination.total} produit{pagination.total > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Export / Import */}
          <ProductsExportImport
            categories={categories}
            exporting={exporting}
            importing={importing}
            onExport={handleExport}
            onImport={handleImport}
          />
          
          {/* Nouveau produit */}
          <Link
            to="/admin/produits/nouveau"
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <ProductsFilters
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        stockFilter={stockFilter}
        categories={categories}
        onSearch={handleSearch}
        onCategoryChange={handleCategoryChange}
        onStockFilterChange={handleStockFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Actions groupées */}
      <AnimatePresence>
        <ProductsBulkActions
          selectedCount={selectedProducts.length}
          deleting={deleting}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
        />
      </AnimatePresence>

      {/* Tableau des produits */}
      <ProductsTable
        products={products}
        loading={loading}
        pagination={pagination}
        selectedProducts={selectedProducts}
        deleting={deleting}
        onSelectAll={handleSelectAll}
        onSelectProduct={handleSelectProduct}
        onDeleteProduct={handleDeleteProduct}
        onPageChange={handlePageChange}
      />

      {/* Info import */}
      <ImportInfoBox />
    </div>
  );
};

export default AdminProductsList;
