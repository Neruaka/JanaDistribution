/**
 * Composant ProductsTable
 * @description Tableau des produits admin avec sélection et actions
 * @location frontend/src/components/admin/ProductsTable.jsx
 */

import { Link } from 'react-router-dom';
import { Package, Eye, Edit, Trash2, Check, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

// ==========================================
// SOUS-COMPOSANTS
// ==========================================

const StockBadge = ({ quantity, threshold }) => {
  if (quantity === 0) {
    return (
      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
        <X className="w-3 h-3" />
        Rupture
      </span>
    );
  }
  if (quantity <= threshold) {
    return (
      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
        <AlertTriangle className="w-3 h-3" />
        {quantity}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
      <Check className="w-3 h-3" />
      {quantity}
    </span>
  );
};

const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div>
              <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-20 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        </td>
        <td className="px-4 py-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
        <td className="px-4 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
        <td className="px-4 py-4"><div className="w-16 h-6 bg-gray-200 rounded-full" /></td>
        <td className="px-4 py-4"><div className="w-16 h-6 bg-gray-200 rounded-full" /></td>
        <td className="px-4 py-4"><div className="w-8 h-8 bg-gray-200 rounded-lg ml-auto" /></td>
      </tr>
    ))}
  </>
);

const EmptyState = () => (
  <tr>
    <td colSpan="7" className="px-4 py-12 text-center">
      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">Aucun produit trouvé</p>
      <Link
        to="/admin/produits/nouveau"
        className="text-green-600 hover:text-green-700 mt-2 inline-block"
      >
        Créer un produit →
      </Link>
    </td>
  </tr>
);

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const ProductsTable = ({
  products,
  loading,
  pagination,
  selectedProducts,
  deleting,
  onSelectAll,
  onSelectProduct,
  onDeleteProduct,
  onPageChange
}) => {
  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const allSelected = selectedProducts.length === products.length && products.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton />
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 transition-colors ${!product.estActif ? 'bg-gray-50/50 opacity-75' : ''}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => onSelectProduct(product.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                  </td>
                  
                  {/* Produit */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={getImageUrl(product.imageUrl)} 
                            alt={product.nom} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/admin/produits/${product.id}`}
                          className="font-medium text-gray-800 hover:text-green-600"
                        >
                          {product.nom}
                        </Link>
                        <p className="text-sm text-gray-500">{product.reference}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Catégorie */}
                  <td className="px-4 py-4">
                    <span className="text-gray-600">
                      {product.categorie?.icone} {product.categorie?.nom || '-'}
                    </span>
                  </td>
                  
                  {/* Prix */}
                  <td className="px-4 py-4">
                    <div>
                      {product.prixPromo ? (
                        <>
                          <span className="font-semibold text-red-600">{formatPrice(product.prixPromo)}</span>
                          <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(product.prix)}</span>
                        </>
                      ) : (
                        <span className="font-semibold text-gray-800">{formatPrice(product.prix)}</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Stock */}
                  <td className="px-4 py-4">
                    <StockBadge quantity={product.stockQuantite} threshold={product.stockMinAlerte} />
                  </td>
                  
                  {/* Statut */}
                  <td className="px-4 py-4">
                    {product.estActif ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <Check className="w-3 h-3" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <X className="w-3 h-3" />
                        Inactif
                      </span>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/produit/${product.slug}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Voir sur le site"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/produits/${product.id}/modifier`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => onDeleteProduct(product.id)}
                        disabled={deleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} produits
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let page;
              if (pagination.totalPages <= 5) {
                page = i + 1;
              } else if (pagination.page <= 3) {
                page = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                page = pagination.totalPages - 4 + i;
              } else {
                page = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1.5 rounded-lg font-medium ${
                    page === pagination.page
                      ? 'bg-green-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
