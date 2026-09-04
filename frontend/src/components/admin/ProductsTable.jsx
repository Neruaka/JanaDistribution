/**
 * Composant ProductsTable
 * @description Ecran A4 — tableau des produits admin
 * @see design_handoff_jana_refonte/README.md (A4 — Produits)
 */

import { Link } from 'react-router-dom';
import { Package, Loader2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import Pagination from '../Pagination';

const GRID = '30px 60px 1fr 150px 120px 150px 110px 90px';

const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0);

const StockGauge = ({ quantity, threshold }) => {
  const color = quantity <= 0 ? 'bg-stock-low' : quantity <= threshold ? 'bg-stock-mid' : 'bg-stock-ok';
  const textColor = quantity <= 0 ? 'text-stock-low' : quantity <= threshold ? 'text-stock-mid' : 'text-stock-ok';
  const pct = Math.min(100, Math.round((quantity / Math.max(1, threshold * 4)) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-[5px] rounded-3 bg-sand-300 overflow-hidden flex-shrink-0">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[12.5px] font-semibold ${textColor}`}>{quantity}</span>
    </div>
  );
};

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
  const allSelected = selectedProducts.length === products.length && products.length > 0;

  return (
    <div className="bg-white border border-sand-200 rounded-8 overflow-hidden">
      <div className="hidden lg:grid gap-3 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400 items-center" style={{ gridTemplateColumns: GRID }}>
        <input type="checkbox" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} className="w-[15px] h-[15px] accent-green-700" />
        <span />
        <span>PRODUIT</span>
        <span>RAYON</span>
        <span>PRIX</span>
        <span>STOCK</span>
        <span>STATUT</span>
        <span className="text-right">ACTIONS</span>
      </div>
      {!loading && products.length > 0 && (
        <div className="lg:hidden flex items-center gap-2 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200">
          <input type="checkbox" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} className="w-[15px] h-[15px] accent-green-700" />
          <span className="text-[11.5px] tracking-wide text-graphite-400">TOUT SÉLECTIONNER</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-green-700 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-8 h-8 text-graphite-200 mx-auto mb-3" />
          <p className="text-[13.5px] text-graphite-400">Aucun produit trouvé</p>
          <Link to="/admin/produits/nouveau" className="text-[13px] font-semibold text-green-700 hover:text-green-800 mt-2 inline-block">Créer un produit →</Link>
        </div>
      ) : (
        products.map((product) => (
          <div
            key={product.id}
            className={`hidden lg:grid gap-3 items-center px-[18px] py-3 border-b border-sand-150 last:border-b-0 hover:bg-sand-50 transition-colors ${!product.estActif ? 'opacity-60' : ''}`}
            style={{ gridTemplateColumns: GRID }}
          >
            <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => onSelectProduct(product.id)} className="w-[15px] h-[15px] accent-green-700" />
            <div className="w-11 h-11 rounded-5 overflow-hidden placeholder-stripe flex-shrink-0">
              {product.imageUrl && <img src={getImageUrl(product.imageUrl)} alt={product.nom} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <Link to={`/admin/produits/${product.id}/modifier`} className="text-[13.5px] font-medium text-ink-900 hover:text-green-700 truncate block">{product.nom}</Link>
              <div className="font-mono text-[11px] text-graphite-300">{product.reference}</div>
            </div>
            <span className="text-[13px] text-graphite-600 truncate">{product.categorie?.nom || '—'}</span>
            <div>
              {product.prixPromo ? (
                <div>
                  <span className="font-mono text-[13.5px] font-semibold text-danger-text">{formatPrice(product.prixPromo)}</span>
                  <span className="font-mono text-[11.5px] text-graphite-300 line-through ml-1.5">{formatPrice(product.prix)}</span>
                </div>
              ) : (
                <span className="font-mono text-[13.5px] font-semibold text-ink-900">{formatPrice(product.prix)}</span>
              )}
            </div>
            <StockGauge quantity={product.stockQuantite ?? 0} threshold={product.stockMinAlerte ?? 5} />
            <span className={`w-fit text-[12px] font-semibold px-2 py-[3px] rounded-4 ${product.estActif ? 'bg-success-bg text-success-text' : 'bg-neutral-status-bg text-neutral-status-text'}`}>
              {product.estActif ? 'Actif' : 'Inactif'}
            </span>
            <div className="flex items-center justify-end gap-2.5">
              <Link to={`/produit/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-graphite-500 hover:text-ink-900 transition-colors">Voir</Link>
              <span className="text-graphite-200">·</span>
              <Link to={`/admin/produits/${product.id}/modifier`} className="text-[12.5px] font-semibold text-green-700 hover:text-green-800 transition-colors">Éditer</Link>
              <button
                type="button"
                onClick={() => onDeleteProduct(product.id)}
                disabled={deleting}
                title="Supprimer"
                className="text-[12.5px] text-danger-text hover:opacity-70 disabled:opacity-50 transition-opacity"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}

      {!loading && products.length > 0 && (
        <div className="lg:hidden flex flex-col">
          {products.map((product) => (
            <div key={`m-${product.id}`} className={`flex items-start gap-3 px-[18px] py-3 border-b border-sand-150 last:border-b-0 ${!product.estActif ? 'opacity-60' : ''}`}>
              <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => onSelectProduct(product.id)} className="w-[15px] h-[15px] accent-green-700 mt-3 flex-shrink-0" />
              <div className="w-[58px] h-[58px] rounded-5 overflow-hidden placeholder-stripe flex-shrink-0">
                {product.imageUrl && <img src={getImageUrl(product.imageUrl)} alt={product.nom} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/admin/produits/${product.id}/modifier`} className="text-[13.5px] font-medium text-ink-900 truncate">{product.nom}</Link>
                  <span className={`flex-shrink-0 text-[11px] font-semibold px-1.5 py-[2px] rounded-4 ${product.estActif ? 'bg-success-bg text-success-text' : 'bg-neutral-status-bg text-neutral-status-text'}`}>
                    {product.estActif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-graphite-300">{product.reference} · {product.categorie?.nom || '—'}</div>
                <div className="flex items-center justify-between gap-2">
                  {product.prixPromo ? (
                    <div>
                      <span className="font-mono text-[13px] font-semibold text-danger-text">{formatPrice(product.prixPromo)}</span>
                      <span className="font-mono text-[11px] text-graphite-300 line-through ml-1">{formatPrice(product.prix)}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[13px] font-semibold text-ink-900">{formatPrice(product.prix)}</span>
                  )}
                  <StockGauge quantity={product.stockQuantite ?? 0} threshold={product.stockMinAlerte ?? 5} />
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <Link to={`/produit/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-graphite-500">Voir</Link>
                  <span className="text-graphite-200">·</span>
                  <Link to={`/admin/produits/${product.id}/modifier`} className="text-[12px] font-semibold text-green-700">Éditer</Link>
                  <button type="button" onClick={() => onDeleteProduct(product.id)} disabled={deleting} className="text-[12px] text-danger-text ml-auto">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-[18px] py-3.5 border-t border-sand-200">
          <p className="text-[12.5px] text-graphite-500">
            Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} références
          </p>
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
