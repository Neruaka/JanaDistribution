/**
 * Page Admin Produits
 * @description Ecran A4 — Produits
 * @see design_handoff_jana_refonte/README.md (A4 — Produits)
 */

import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';

import useProductsAdmin from '../../hooks/useProductsAdmin';
import { AdminTopBar } from '../../components/admin';
import ProductsFilters from '../../components/admin/ProductsFilters';
import ProductsTable from '../../components/admin/ProductsTable';
import ProductsBulkActions from '../../components/admin/ProductsBulkActions';
import ProductsExportImport, { ImportInfoBox } from '../../components/admin/ProductsExportImport';

const AdminProductsList = () => {
  const {
    products, categories, loading, pagination, counts,
    exporting, importing, deleting, bulkUpdating,
    search, setSearch, selectedCategory, stockFilter, statutFilter, selectedProducts,
    handleSearch, handleCategoryChange, handleStockFilterChange, handleStatutFilterChange, handlePageChange,
    handleSelectAll, handleSelectProduct, clearSelection,
    handleDeleteProduct, handleBulkDelete, handleBulkChangeCategory, handleBulkDeactivate,
    handleExport, handleImport
  } = useProductsAdmin();

  return (
    <>
      <AdminTopBar
        search={
          <form onSubmit={handleSearch} className="flex-1 max-w-[420px] h-[38px] flex items-center gap-2 border border-sand-250 rounded-6 px-3.5">
            <Search className="w-3.5 h-3.5 text-graphite-300 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit, une référence…"
              className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-ink-900 placeholder-graphite-200"
            />
          </form>
        }
      >
        <ProductsExportImport categories={categories} exporting={exporting} importing={importing} onExport={handleExport} onImport={handleImport} />
        <Link to="/admin/produits/nouveau" className="h-[38px] flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white rounded-6 px-4 text-[13.5px] font-semibold transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nouveau produit
        </Link>
      </AdminTopBar>

      <div className="p-[26px] flex flex-col gap-3.5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Produits</h2>
            <p className="text-[13.5px] text-graphite-500 mt-[3px]">
              {counts.total} réf.{counts.stockFaible > 0 && ` · ${counts.stockFaible} sous le seuil`}{counts.inactifs > 0 && ` · ${counts.inactifs} inactives`}
            </p>
          </div>
          <ProductsFilters
            selectedCategory={selectedCategory}
            stockFilter={stockFilter}
            statutFilter={statutFilter}
            categories={categories}
            onCategoryChange={handleCategoryChange}
            onStockFilterChange={handleStockFilterChange}
            onStatutFilterChange={handleStatutFilterChange}
          />
        </div>

        <ProductsBulkActions
          selectedCount={selectedProducts.length}
          categories={categories}
          deleting={deleting}
          bulkUpdating={bulkUpdating}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkChangeCategory={handleBulkChangeCategory}
          onBulkDeactivate={handleBulkDeactivate}
        />

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

        <ImportInfoBox />
      </div>
    </>
  );
};

export default AdminProductsList;
