/**
 * CartItem Component - VERSION CORRIGÉE
 * Affiche une ligne de produit dans le panier
 * 
 * ✅ CORRECTION: Ajout React.forwardRef pour éviter le warning
 * "Function components cannot be given refs"
 */

import React, { useState, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Plus, 
  Minus, 
  AlertTriangle,
  Loader2,
  Tag
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CartItem = forwardRef(function CartItem({ item, compact = false }, ref) {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    id,
    quantity,
    effectivePrice,
    subtotal,
    isOnSale,
    product
  } = item;

  // Vérifier les problèmes de stock
  const hasStockIssue = product.stock < quantity;
  const isOutOfStock = product.stock === 0;
  const isInactive = !product.isActive;

  /**
   * Modifier la quantité
   */
  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > product.stock || isUpdating) return;
    
    setIsUpdating(true);
    await updateQuantity(id, newQuantity);
    setIsUpdating(false);
  };

  /**
   * Supprimer l'item
   */
  const handleRemove = async () => {
    setIsRemoving(true);
    await removeItem(id);
    // Pas besoin de setIsRemoving(false) car le composant sera démonté
  };

  // Version compacte pour le drawer
  if (compact) {
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`flex gap-3 p-3 rounded-lg ${
          hasStockIssue || isInactive 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-gray-50'
        }`}
      >
        {/* Image */}
        <Link 
          to={`/produit/${product.slug}`}
          className="flex-shrink-0"
        >
          <img
            src={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-md"
          />
        </Link>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <Link 
            to={`/produit/${product.slug}`}
            className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Prix */}
          <div className="flex items-center gap-2 mt-1">
            {isOnSale && (
              <span className="text-xs text-gray-400 line-through">
                {product.currentPrice.toFixed(2)}€
              </span>
            )}
            <span className={`text-sm font-semibold ${isOnSale ? 'text-red-600' : 'text-gray-900'}`}>
              {effectivePrice.toFixed(2)}€
            </span>
            <span className="text-xs text-gray-500">/ {product.unit}</span>
          </div>

          {/* Warning stock */}
          {(hasStockIssue || isInactive) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {isInactive ? 'Indisponible' : `Stock: ${product.stock}`}
            </div>
          )}

          {/* Quantité + sous-total */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isUpdating}
                className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <span className="w-8 text-center text-sm font-medium">
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 mx-auto animate-spin" />
                ) : (
                  quantity
                )}
              </span>
              
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock || isUpdating}
                className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <span className="font-semibold text-gray-900">
              {subtotal.toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Bouton supprimer */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </motion.div>
    );
  }

  // Version complète pour la page panier
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-4 p-4 rounded-xl border ${
        hasStockIssue || isInactive 
          ? 'bg-red-50 border-red-200' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Image */}
      <Link 
        to={`/produit/${product.slug}`}
        className="flex-shrink-0"
      >
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
        />
      </Link>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link 
              to={`/produit/${product.slug}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
            >
              {product.name}
            </Link>
            <p className="text-sm text-gray-500 mt-0.5">
              Réf: {product.reference}
            </p>
          </div>

          {/* Badge promo */}
          {isOnSale && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              Promo
            </span>
          )}
        </div>

        {/* Prix */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className={`text-xl font-bold ${isOnSale ? 'text-red-600' : 'text-gray-900'}`}>
            {effectivePrice.toFixed(2)}€
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {product.currentPrice.toFixed(2)}€
            </span>
          )}
          <span className="text-sm text-gray-500">/ {product.unit}</span>
        </div>

        {/* Warning */}
        {(hasStockIssue || isInactive) && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">
              {isInactive 
                ? 'Ce produit n\'est plus disponible' 
                : isOutOfStock
                  ? 'Rupture de stock'
                  : `Stock insuffisant (${product.stock} disponible)`
              }
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          {/* Sélecteur quantité */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quantité:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isUpdating}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="w-12 text-center font-medium">
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                ) : (
                  quantity
                )}
              </span>
              
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock || isUpdating}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {product.stock <= 10 && product.stock > 0 && !hasStockIssue && (
              <span className="text-xs text-amber-600">
                Plus que {product.stock} en stock
              </span>
            )}
          </div>

          {/* Sous-total + supprimer */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Sous-total</p>
              <p className="text-xl font-bold text-gray-900">
                {subtotal.toFixed(2)}€
              </p>
            </div>

            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer du panier"
            >
              {isRemoving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default CartItem;
