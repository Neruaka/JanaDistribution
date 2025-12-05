/**
 * Cart Context
 * Gestion de l'état global du panier
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  
  // État du panier
  const [cart, setCart] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger le panier depuis l'API
   */
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setItemCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
      setItemCount(cartData.summary?.totalQuantity || 0);
      
      // Afficher les warnings si présents
      if (cartData.warnings && cartData.warnings.length > 0) {
        cartData.warnings.forEach(warning => {
          toast.error(warning.message, { duration: 5000 });
        });
      }
    } catch (err) {
      console.error('Erreur chargement panier:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du panier');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Charger uniquement le compteur (plus léger)
   */
  const fetchItemCount = useCallback(async () => {
    if (!isAuthenticated) {
      setItemCount(0);
      return;
    }

    try {
      const data = await cartService.getItemCount();
      setItemCount(data.count);
    } catch (err) {
      console.error('Erreur chargement compteur:', err);
    }
  }, [isAuthenticated]);

  /**
   * Ajouter un produit au panier
   */
  const addItem = async (productId, quantity = 1, showToast = true) => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      return false;
    }

    try {
      const result = await cartService.addItem(productId, quantity);
      setCart(result.data.cart);
      setItemCount(result.data.cart.summary?.totalQuantity || 0);
      
      if (showToast) {
        toast.success(result.message);
      }
      
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'ajout au panier';
      toast.error(message);
      return false;
    }
  };

  /**
   * Modifier la quantité d'un item
   */
  const updateQuantity = async (itemId, quantity) => {
    try {
      const result = await cartService.updateItemQuantity(itemId, quantity);
      setCart(result.data.cart);
      setItemCount(result.data.cart.summary?.totalQuantity || 0);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la modification';
      toast.error(message);
      return false;
    }
  };

  /**
   * Supprimer un item du panier
   */
  const removeItem = async (itemId) => {
    try {
      const result = await cartService.removeItem(itemId);
      setCart(result.data.cart);
      setItemCount(result.data.cart.summary?.totalQuantity || 0);
      toast.success(result.message);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(message);
      return false;
    }
  };

  /**
   * Vider le panier
   */
  const clearCart = async () => {
    try {
      const result = await cartService.clearCart();
      setCart(result.data.cart);
      setItemCount(0);
      toast.success(result.message);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors du vidage du panier';
      toast.error(message);
      return false;
    }
  };

  /**
   * Valider le panier avant commande
   */
  const validateCart = async () => {
    try {
      const validation = await cartService.validateCart();
      return validation;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la validation';
      toast.error(message);
      return { isValid: false, errors: [{ message }] };
    }
  };

  /**
   * Appliquer les corrections suggérées
   */
  const applyFixes = async () => {
    try {
      const result = await cartService.applyFixes();
      setCart(result.data.cart);
      setItemCount(result.data.cart.summary?.totalQuantity || 0);
      
      if (result.data.changes && result.data.changes.length > 0) {
        toast.success(result.message);
      }
      
      return result.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la correction';
      toast.error(message);
      return null;
    }
  };

  /**
   * Ouvrir/fermer le drawer
   */
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);

  // Charger le panier quand l'utilisateur se connecte
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
      setItemCount(0);
    }
  }, [isAuthenticated, fetchCart]);

  // Valeurs exposées
  const value = {
    // État
    cart,
    itemCount,
    isLoading,
    error,
    isDrawerOpen,
    
    // Computed
    items: cart?.items || [],
    summary: cart?.summary || null,
    warnings: cart?.warnings || null,
    isEmpty: !cart?.items || cart.items.length === 0,
    
    // Actions
    fetchCart,
    fetchItemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    validateCart,
    applyFixes,
    
    // Drawer
    openDrawer,
    closeDrawer,
    toggleDrawer
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte du panier
 */
export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  
  return context;
}

export default CartContext;
