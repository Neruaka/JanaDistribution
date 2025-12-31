/**
 * CartDrawer Component
 * Sidebar panier qui slide depuis la droite
 */

import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  ArrowRight,
  ShoppingBag,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import CartItem from './CartItem';

export default function CartDrawer() {
  const { 
    isDrawerOpen, 
    closeDrawer, 
    items, 
    summary, 
    isEmpty, 
    isLoading,
    clearCart,
    warnings 
  } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Mon Panier
            {!isEmpty && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {summary?.totalQuantity || 0}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="mt-2 text-gray-500">Chargement...</p>
            </div>
          ) : isEmpty ? (
            // Panier vide
            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Votre panier est vide
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Découvrez nos produits et commencez vos achats !
              </p>
              <Link
                to="/catalogue"
                onClick={closeDrawer}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir le catalogue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            // Liste des items
            <div className="p-4 space-y-3">
              {/* Warnings globaux */}
              {warnings && warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium text-sm">Attention</span>
                  </div>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Items */}
              <AnimatePresence mode="popLayout">
                {items.map(item => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    compact 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer avec totaux */}
        {!isEmpty && !isLoading && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Résumé */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total HT</span>
                <span>{summary?.subtotalHT?.toFixed(2) || '0.00'}€</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVA (20%)</span>
                <span>{summary?.totalTVA?.toFixed(2) || '0.00'}€</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total TTC</span>
                <span>{summary?.totalTTC?.toFixed(2) || '0.00'}€</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                to="/panier"
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir le panier
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <button
                onClick={clearCart}
                className="flex items-center justify-center gap-2 w-full py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Vider le panier
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
