/**
 * Page Panier - VERSION CORRIGÉE
 * @description Affichage et gestion du panier d'achat
 * 
 * ✅ CORRECTIONS:
 * - Utilise useSettings pour le seuil franco de port
 * - Affiche les frais de livraison dynamiques
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  Tag,
  AlertCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext'; // ✅ AJOUT
import CartItem from '../components/CartItem';

const CartPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    items,
    summary,
    warnings,
    isLoading,
    isEmpty,
    clearCart,
    validateCart,
    applyFixes,
    fetchCart
  } = useCart();

  // ✅ AJOUT: Récupérer les settings pour frais de livraison dynamiques
  const { 
    getFraisLivraison, 
    seuilFrancoPort, 
    fraisLivraisonStandard,
    livraison,
    loading: settingsLoading 
  } = useSettings();

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);

  // ✅ AJOUT: Calcul des frais de livraison dynamiques
  const totalTTC = summary?.totalTTC || 0;
  const fraisLivraison = getFraisLivraison(totalTTC);
  const francoAtteint = fraisLivraison === 0;
  const resteAvantFranco = francoAtteint ? 0 : seuilFrancoPort - totalTTC;

  // Rediriger si non connecté
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/panier' } });
    }
  }, [isAuthenticated, navigate]);

  // Formater le prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  // Appliquer un code promo (simulation)
  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');

    if (!promoCode.trim()) {
      setPromoError('Veuillez entrer un code');
      return;
    }

    // Simulation - codes valides
    const validCodes = {
      'BIENVENUE10': { type: 'percent', value: 10, label: '10% de réduction' },
      'LIVRAISON': { type: 'shipping', value: 0, label: 'Livraison offerte' }
    };

    const code = validCodes[promoCode.toUpperCase()];
    if (code) {
      setPromoApplied({ code: promoCode.toUpperCase(), ...code });
      setPromoCode('');
    } else {
      setPromoError('Code promo invalide');
    }
  };

  // Valider le panier avant commande
  const handleValidate = async () => {
    setIsValidating(true);
    const result = await validateCart();
    setValidation(result);
    setIsValidating(false);

    if (result.isValid) {
      navigate('/checkout');
    }
  };

  // Appliquer les corrections suggérées
  const handleApplyFixes = async () => {
    setIsApplyingFixes(true);
    await applyFixes();
    setValidation(null);
    setIsApplyingFixes(false);
  };

  // Vider le panier avec confirmation
  const handleClearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      await clearCart();
    }
  };

  // Loading state
  if (isLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  // Panier vide
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Votre panier est vide
            </h1>
            <p className="text-gray-500 mb-8">
              Découvrez nos produits frais et de qualité !
            </p>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              Voir le catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-green-600" />
              Mon panier
            </h1>
            <p className="text-gray-500">
              {summary?.itemCount || 0} article{(summary?.itemCount || 0) > 1 ? 's' : ''} • {summary?.totalQuantity || 0} unité{(summary?.totalQuantity || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <Link
            to="/catalogue"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-4">
            {/* ✅ AJOUT: Bandeau franco de port dynamique */}
            {!francoAtteint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-xl"
              >
                <div className="flex items-center gap-2 text-green-800">
                  <Truck className="w-5 h-5" />
                  <span className="font-medium">
                    Plus que {formatPrice(resteAvantFranco)} pour la livraison gratuite !
                  </span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Livraison offerte à partir de {formatPrice(seuilFrancoPort)} d'achat
                </p>
              </motion.div>
            )}

            {/* Warnings globaux */}
            {warnings && warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Attention</span>
                </div>
                <ul className="text-sm text-amber-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning.message}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Erreurs de validation */}
            {validation && !validation.isValid && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Problèmes détectés</span>
                  </div>
                  <button
                    onClick={handleApplyFixes}
                    disabled={isApplyingFixes}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isApplyingFixes ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Corriger automatiquement
                  </button>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Items */}
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </AnimatePresence>

            {/* Actions secondaires */}
            <div className="flex justify-between items-center pt-4">
              <button
                onClick={handleClearCart}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Vider le panier
              </button>

              <button
                onClick={fetchCart}
                className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Récapitulatif
              </h2>

              {/* Code promo */}
              <form onSubmit={handleApplyPromo} className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">
                  Code promo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Entrer un code"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    OK
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-sm mt-1">{promoError}</p>
                )}
                {promoApplied && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded-lg">
                    <span className="text-green-700 text-sm flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {promoApplied.code}: {promoApplied.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPromoApplied(null)}
                      className="text-green-600 hover:text-green-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </form>

              {/* Détails prix */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total HT</span>
                  <span>{formatPrice(summary?.subtotalHT)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>TVA</span>
                  <span>{formatPrice(summary?.totalTVA)}</span>
                </div>

                {/* Réduction promo */}
                {promoApplied && promoApplied.type === 'percent' && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction ({promoApplied.code})</span>
                    <span>-{formatPrice((summary?.totalTTC || 0) * promoApplied.value / 100)}</span>
                  </div>
                )}

                {/* ✅ CORRECTION: Frais de livraison dynamiques depuis settings */}
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Livraison
                  </span>
                  <span className={francoAtteint || promoApplied?.type === 'shipping' ? 'text-green-600 font-medium' : ''}>
                    {francoAtteint || promoApplied?.type === 'shipping' 
                      ? 'Offerte' 
                      : formatPrice(fraisLivraisonStandard)
                    }
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-semibold text-gray-800">Total TTC</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(
                        (() => {
                          let total = summary?.totalTTC || 0;
                          // Ajouter frais livraison si pas franco et pas promo shipping
                          if (!francoAtteint && promoApplied?.type !== 'shipping') {
                            total += fraisLivraisonStandard;
                          }
                          // Appliquer réduction promo %
                          if (promoApplied?.type === 'percent') {
                            total = total * (1 - promoApplied.value / 100);
                          }
                          return total;
                        })()
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton commander */}
              <button
                onClick={handleValidate}
                disabled={isValidating || isEmpty}
                className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    Passer commande
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Message validation */}
              {validation?.isValid && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Panier validé !
                  </span>
                </motion.div>
              )}

              {/* ✅ CORRECTION: Infos dynamiques depuis settings */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Livraison offerte dès {formatPrice(seuilFrancoPort)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>
                    Livraison sous {livraison?.delaiMin || 2}-{livraison?.delaiMax || 5} jours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
