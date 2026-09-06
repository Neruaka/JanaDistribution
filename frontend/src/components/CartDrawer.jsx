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
import { formatAmount } from '../utils/priceUtils';

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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-[80] w-full max-w-md bg-white shadow-xl flex flex-col font-sans"
      >
        {/* Header sticky + safe-area (T15-01) : le bouton fermer existait deja
            mais etait recouvert par le <header> sticky de Navbar.jsx (meme
            z-50, et Navbar est monte apres CartDrawer dans App.jsx - a
            z-index egal, l'ordre du DOM tranche et Navbar gagnait le
            dessus). Drawer passe a z-[80] (au-dessus de MobileTabBar
            z-[60] et MobileFilterSheet z-[70]) pour rester strictement
            au-dessus de tout le reste, quel que soit l'ordre de montage. */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-4 border-b border-sand-200 bg-white z-10" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2 font-display text-[17px] font-bold text-ink-900">
            <ShoppingCart className="w-5 h-5 text-green-700" />
            Mon panier
            {!isEmpty && (
              <span className="ml-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-success-bg text-success-text rounded-full">
                {summary?.totalQuantity || 0}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Fermer le panier"
            className="p-2.5 text-graphite-300 hover:text-ink-900 hover:bg-sand-50 rounded-6 transition-colors"
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
              <div className="w-24 h-24 bg-sand-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-12 h-12 text-graphite-300" />
              </div>
              <h3 className="font-display text-[17px] font-bold text-ink-900 mb-1">
                Votre panier est vide
              </h3>
              <p className="text-[13.5px] text-graphite-500 text-center mb-6">
                Découvrez nos produits et commencez vos achats !
              </p>
              <Link
                to="/catalogue"
                onClick={closeDrawer}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-6 text-[13.5px] font-semibold hover:bg-green-800 transition-colors"
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
                <div className="p-3 bg-warning-bg border border-warning-border rounded-6">
                  <div className="flex items-center gap-2 text-warning-text mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium text-[13px]">Attention</span>
                  </div>
                  <ul className="text-[12px] text-warning-text space-y-1">
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
          <div className="border-t border-sand-200 p-4 space-y-4">
            {/* Résumé */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px] text-graphite-600">
                <span>Sous-total HT</span>
                <span className="font-mono text-ink-900">{formatAmount(summary?.subtotalHT)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-graphite-600">
                <span>TVA</span>
                <span className="font-mono text-ink-900">{formatAmount(summary?.totalTVA)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#F0EEE7]">
                <span className="font-display text-[15px] font-bold text-ink-900">Total TTC</span>
                <span className="font-mono text-[19px] font-semibold text-ink-900">{formatAmount(summary?.totalTTC)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                to="/panier"
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-700 text-white font-semibold rounded-6 hover:bg-green-800 transition-colors text-[13.5px]"
              >
                Voir le panier
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={clearCart}
                className="flex items-center justify-center gap-2 w-full py-2 text-graphite-400 hover:text-danger-text hover:bg-danger-bg rounded-6 transition-colors text-[12.5px]"
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
