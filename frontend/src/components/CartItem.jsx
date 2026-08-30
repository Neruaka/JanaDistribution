/**
 * CartItem — ligne de panier
 * @description Version tableau (page panier) et version compacte (drawer)
 * @location frontend/src/components/CartItem.jsx
 * @see design_handoff_jana_refonte/README.md ("04 — Panier")
 */

import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { getImageUrl } from '../utils/imageUtils';
import { formatAmount } from '../utils/priceUtils';

const UNIT_LABELS = { kg: '/kg', litre: '/L', piece: '/pièce', unite: '/unité' };

const CartItem = forwardRef(function CartItem({ item, compact = false }, ref) {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { id, quantity, effectivePrice, subtotal, isOnSale, product } = item;
  const fullImageUrl = getImageUrl(product.image);
  const hasStockIssue = product.stock < quantity;
  const isOutOfStock = product.stock === 0;
  const isInactive = !product.isActive;
  const hasIssue = hasStockIssue || isInactive;
  const unitLabel = UNIT_LABELS[product.unit] || '';

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > product.stock || isUpdating) return;
    setIsUpdating(true);
    await updateQuantity(id, newQuantity);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeItem(id);
  };

  if (compact) {
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`flex gap-3 p-3 rounded-6 ${hasIssue ? 'bg-danger-bg border border-danger-border' : 'bg-sand-50'}`}
      >
        <Link to={`/produit/${product.slug}`} className="flex-shrink-0 w-16 h-16 rounded-5 overflow-hidden placeholder-stripe">
          {fullImageUrl && <img src={fullImageUrl} alt={product.name} className="w-full h-full object-cover" />}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/produit/${product.slug}`} className="text-[13.5px] font-semibold text-ink-900 hover:text-green-800 line-clamp-1">
            {product.name}
          </Link>

          <div className="flex items-center gap-1.5 mt-0.5">
            {isOnSale && <span className="font-mono text-[11px] text-graphite-300 line-through">{formatAmount(product.currentPrice)}</span>}
            <span className="font-mono text-[13px] font-semibold text-ink-900">{formatAmount(effectivePrice)}</span>
            <span className="text-[11px] text-graphite-500">{unitLabel}</span>
          </div>

          {hasIssue && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-danger-text">
              <AlertTriangle className="w-3 h-3" />
              {isInactive ? 'Indisponible' : `Stock : ${product.stock}`}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border border-sand-250 rounded-5 h-7">
              <button onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1 || isUpdating} className="w-6 text-graphite-500 text-[13px] disabled:opacity-30">–</button>
              <span className="w-7 text-center font-mono text-[12px] text-ink-900">
                {isUpdating ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : quantity}
              </span>
              <button onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= product.stock || isUpdating} className="w-6 text-graphite-500 text-[13px] disabled:opacity-30">+</button>
            </div>
            <span className="font-mono text-[13px] font-semibold text-ink-900">{formatAmount(subtotal)}</span>
          </div>
        </div>

        <button onClick={handleRemove} disabled={isRemoving} className="flex-shrink-0 text-graphite-300 hover:text-danger-text transition-colors" aria-label="Retirer">
          {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`grid items-center gap-3.5 px-[18px] py-4 border-b border-[#F0EEE7] last:border-b-0 ${hasIssue ? 'bg-danger-bg' : ''}`}
      style={{ gridTemplateColumns: '64px 1fr 130px 150px 110px 40px' }}
    >
      <Link to={`/produit/${product.slug}`} className="w-16 h-16 rounded-5 overflow-hidden placeholder-stripe flex-shrink-0">
        {fullImageUrl && <img src={fullImageUrl} alt={product.name} className="w-full h-full object-cover" />}
      </Link>

      <div className="flex flex-col gap-0.5 min-w-0">
        {product.reference && <span className="font-mono text-[10.5px] text-graphite-300">{product.reference}</span>}
        <Link to={`/produit/${product.slug}`} className="text-[14px] font-semibold text-ink-900 hover:text-green-800 truncate">
          {product.name}
        </Link>
        {hasIssue && (
          <span className="flex items-center gap-1 text-[11.5px] text-danger-text">
            <AlertTriangle className="w-3 h-3" />
            {isInactive ? 'Ce produit n\'est plus disponible' : isOutOfStock ? 'Rupture de stock' : `Stock insuffisant (${product.stock} dispo.)`}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <span className="font-mono text-[14px] text-ink-900">{formatAmount(effectivePrice)}</span>
        <span className="text-[11.5px] text-graphite-300">
          {isOnSale && <span className="line-through mr-1">{formatAmount(product.currentPrice)}</span>}
          {unitLabel}
        </span>
      </div>

      <div className="flex items-center border border-sand-250 rounded-5 h-[38px] w-[118px]">
        <button onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1 || isUpdating} className="w-9 text-center text-graphite-500 text-[16px] disabled:opacity-30">–</button>
        <span className="flex-1 text-center font-mono text-[14px] text-ink-900">
          {isUpdating ? <Loader2 className="w-3.5 h-3.5 mx-auto animate-spin" /> : quantity}
        </span>
        <button onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= product.stock || isUpdating} className="w-9 text-center text-graphite-500 text-[16px] disabled:opacity-30">+</button>
      </div>

      <span className="font-mono text-[15px] text-ink-900 text-right">{formatAmount(subtotal)}</span>

      <button onClick={handleRemove} disabled={isRemoving} className="text-[#B0B8B3] hover:text-danger-text text-center transition-colors" aria-label="Retirer du panier">
        {isRemoving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <X className="w-4 h-4 mx-auto" />}
      </button>
    </motion.div>
  );
});

export default CartItem;
