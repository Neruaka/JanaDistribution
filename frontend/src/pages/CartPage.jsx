/**
 * Page Panier
 * @description Écran 04 — Panier
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, RefreshCw, Tag, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import CartItem from '../components/CartItem';
import productService from '../services/productService';
import { validerCodePromo } from '../services/promoService';
import { getImageUrl } from '../utils/imageUtils';
import { formatAmount } from '../utils/priceUtils';

const PROMO_STORAGE_KEY = 'jana_promo_code';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    items,
    summary,
    warnings,
    isLoading,
    isEmpty,
    clearCart,
    validateCart,
    applyFixes,
    fetchCart,
    addItem
  } = useCart();
  const { getFraisLivraison, seuilFrancoPort, fraisLivraisonStandard, loading: settingsLoading } = useSettings();

  const [promoCode, setPromoCode] = useState('');
  const [promoState, setPromoState] = useState(null); // { code, montant_rabais, message } | { error }
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/panier' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    productService.getAll({ estMisEnAvant: true, limit: 8 }).then((response) => {
      if (!response.success) return;
      const inCartIds = new Set(items.map((i) => i.productId));
      setSuggestions(response.data.filter((p) => !inCartIds.has(p.id)).slice(0, 4));
    }).catch(() => {});
  }, [items.length]);

  const subtotalHT = summary?.subtotalHT || 0;
  const totalTVA = summary?.totalTVA || 0;
  const totalTTC = summary?.totalTTC || 0;
  const fraisLivraison = getFraisLivraison(totalTTC);
  const francoAtteint = fraisLivraison === 0;
  const resteAvantFranco = francoAtteint ? 0 : seuilFrancoPort - subtotalHT;
  const francoProgress = Math.min(100, seuilFrancoPort > 0 ? (subtotalHT / seuilFrancoPort) * 100 : 0);

  const remise = promoState?.montant_rabais || 0;
  const totalFinal = Math.max(0, totalTTC + fraisLivraison - remise);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    setPromoState(null);
    try {
      const response = await validerCodePromo(promoCode.trim().toUpperCase(), totalTTC);
      if (response.success) {
        setPromoState(response.data);
        sessionStorage.setItem(PROMO_STORAGE_KEY, response.data.code);
        setPromoCode('');
      } else {
        setPromoState({ error: response.message || 'Code promo invalide' });
      }
    } catch (err) {
      setPromoState({ error: err.response?.data?.message || 'Code promo invalide' });
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoState(null);
    sessionStorage.removeItem(PROMO_STORAGE_KEY);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    const result = await validateCart();
    setValidation(result);
    setIsValidating(false);
    if (result.isValid) navigate('/checkout');
  };

  const handleApplyFixes = async () => {
    setIsApplyingFixes(true);
    await applyFixes();
    setValidation(null);
    setIsApplyingFixes(false);
  };

  const handleClearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      await clearCart();
    }
  };

  if (authLoading || isLoading || settingsLoading) {
    return (
      <div className="bg-sand-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-sand-50 min-h-screen flex items-center justify-center py-16 px-4">
        <div className="bg-white border border-sand-200 rounded-8 p-12 text-center max-w-md">
          <h1 className="font-display text-[23px] font-extrabold text-ink-900 mb-2">Votre panier est vide</h1>
          <p className="text-[13.5px] text-graphite-500 mb-6">Découvrez nos produits frais et de qualité.</p>
          <Link to="/catalogue" className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-6 text-[13.5px] font-semibold transition-colors">
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sand-50 min-h-screen pb-[92px] md:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[22px] px-4 md:px-10 py-7">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-3.5 min-w-0">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="font-display text-[27px] font-extrabold tracking-tighter text-ink-900">
              Mon panier{' '}
              <span className="text-[18px] font-semibold text-graphite-400">
                {summary?.itemCount || 0} référence{(summary?.itemCount || 0) > 1 ? 's' : ''} · {summary?.totalQuantity || 0} unité{(summary?.totalQuantity || 0) > 1 ? 's' : ''}
              </span>
            </h1>
            <Link to="/catalogue" className="text-[13.5px] font-semibold text-ink-900 hover:text-green-800">
              ← Continuer mes achats
            </Link>
          </div>

          {/* Barre de franco */}
          <div className="bg-white border border-sand-200 rounded-8 px-[18px] py-3.5 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-ink-900">
                {francoAtteint ? 'Livraison offerte' : `Plus que ${formatAmount(resteAvantFranco)} HT pour la livraison offerte`}
              </div>
              <div className="h-1.5 rounded-full bg-sand-300 mt-2 overflow-hidden">
                <div className="h-full bg-green-700 transition-all" style={{ width: `${francoProgress}%` }} />
              </div>
            </div>
            <span className="font-mono text-[12.5px] text-graphite-400 flex-shrink-0">
              {formatAmount(subtotalHT)} / {formatAmount(seuilFrancoPort)} HT
            </span>
          </div>

          {warnings && warnings.length > 0 && (
            <div className="bg-warning-bg border border-warning-border rounded-8 p-4">
              <div className="flex items-center gap-2 text-warning-text font-semibold text-[13.5px] mb-1.5">
                <AlertTriangle className="w-4 h-4" /> Attention
              </div>
              <ul className="text-[13px] text-warning-text space-y-1">
                {warnings.map((w, i) => <li key={i}>• {w.message}</li>)}
              </ul>
            </div>
          )}

          {validation && !validation.isValid && (
            <div className="bg-danger-bg border border-danger-border rounded-8 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-danger-text font-semibold text-[13.5px]">
                  <AlertTriangle className="w-4 h-4" /> Problèmes détectés
                </div>
                <button onClick={handleApplyFixes} disabled={isApplyingFixes} className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-text text-white text-[12.5px] font-semibold rounded-5 disabled:opacity-50">
                  {isApplyingFixes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Corriger automatiquement
                </button>
              </div>
              <ul className="text-[13px] text-danger-text space-y-1">
                {validation.errors.map((e, i) => <li key={i}>• {e.message}</li>)}
              </ul>
            </div>
          )}

          {/* Tableau des lignes (desktop) */}
          <div className="hidden md:block bg-white border border-sand-200 rounded-8 overflow-hidden">
            <div
              className="grid gap-3.5 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400"
              style={{ gridTemplateColumns: '64px 1fr 130px 150px 110px 40px' }}
            >
              <span />
              <span>PRODUIT</span>
              <span>PRIX UNITAIRE</span>
              <span>QUANTITÉ</span>
              <span className="text-right">TOTAL HT</span>
              <span />
            </div>

            <AnimatePresence mode="popLayout">
              {items.map((item) => <CartItem key={item.id} item={item} />)}
            </AnimatePresence>
          </div>

          {/* Lignes en cartes (mobile, M5) */}
          <div className="md:hidden flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {items.map((item) => <CartItem key={`m-${item.id}`} item={item} compact />)}
            </AnimatePresence>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 flex justify-between px-[18px] py-3.5">
            <button onClick={handleClearCart} className="text-[13px] text-graphite-200 hover:text-danger-text transition-colors">
              Vider le panier
            </button>
            <button disabled title="Bientôt disponible" className="text-[13px] font-semibold text-graphite-300 cursor-not-allowed">
              Enregistrer comme liste récurrente
            </button>
          </div>

          {/* Complétez votre commande */}
          {suggestions.length > 0 && (
            <div className="bg-white border border-sand-200 rounded-8 px-[18px] py-4">
              <div className="font-display text-[15px] font-bold text-ink-900 mb-3">Complétez votre commande</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p.id, 1)}
                    className="flex gap-2.5 border border-sand-300 rounded-6 p-2.5 text-left hover:border-sand-250 transition-colors"
                  >
                    <div className="w-[52px] h-[52px] rounded-4 flex-shrink-0 overflow-hidden placeholder-stripe">
                      {getImageUrl(p.imageUrl) && <img src={getImageUrl(p.imageUrl)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[12.5px] font-semibold text-ink-900 leading-tight line-clamp-2">{p.nom}</span>
                      <span className="font-mono text-[12.5px] text-graphite-700">{formatAmount(p.prixPromo ?? p.prix)}</span>
                      <span className="text-[11.5px] font-semibold text-green-700">+ Ajouter</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[17px] font-bold text-ink-900 mb-3.5">Récapitulatif</div>

            <div className="flex justify-between py-1.5 text-[13.5px]">
              <span className="text-graphite-600">Sous-total HT</span>
              <span className="font-mono text-ink-900">{formatAmount(subtotalHT)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-[13.5px]">
              <span className="text-graphite-600">TVA</span>
              <span className="font-mono text-ink-900">{formatAmount(totalTVA)}</span>
            </div>
            {remise > 0 && (
              <div className="flex justify-between py-1.5 text-[13.5px]">
                <span className="text-graphite-600">Remise ({promoState.code})</span>
                <span className="font-mono text-green-700">−{formatAmount(remise)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 text-[13.5px] border-b border-[#F0EEE7]">
              <span className="text-graphite-600">Livraison</span>
              <span className={`font-mono ${francoAtteint ? 'text-green-700' : 'text-ink-900'}`}>
                {francoAtteint ? 'Offerte' : formatAmount(fraisLivraison)}
              </span>
            </div>

            <div className="hidden md:flex justify-between items-baseline pt-3.5 pb-1">
              <span className="font-display text-[16px] font-bold text-ink-900">Total TTC</span>
              <span className="font-mono text-[26px] font-semibold text-ink-900">{formatAmount(totalFinal)}</span>
            </div>

            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="hidden md:flex w-full mt-3 h-[50px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[15px] font-semibold transition-colors items-center justify-center gap-2"
            >
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Valider ma commande
            </button>

            <form onSubmit={handleApplyPromo} className="flex gap-2 mt-2.5">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Code promo"
                className="flex-1 min-w-0 border border-sand-250 rounded-5 px-3 py-2.5 text-[13px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900"
              />
              <button type="submit" disabled={checkingPromo} className="border border-sand-250 rounded-5 px-4 py-2.5 text-[13px] font-semibold text-ink-900 hover:border-sand-300 disabled:opacity-50">
                {checkingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'OK'}
              </button>
            </form>
            {promoState?.error && <p className="text-[12.5px] text-danger-text mt-1.5">{promoState.error}</p>}
            {promoState?.code && (
              <div className="flex items-center justify-between mt-1.5 px-3 py-2 bg-success-bg border border-success-border rounded-5">
                <span className="text-[12.5px] text-success-text flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> {promoState.code} — {promoState.message}
                </span>
                <button onClick={handleRemovePromo} className="text-success-text hover:opacity-70">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-sand-200 rounded-8 px-[18px] py-4">
            <div className="text-[12px] tracking-wide text-graphite-400 mb-2.5">LIVRAISON</div>
            <div className={`rounded-6 px-3.5 py-2.5 ${francoAtteint ? 'border-[1.5px] border-green-700 bg-selection-bg' : 'border border-sand-250'}`}>
              <div className="flex justify-between text-[13.5px] font-semibold text-ink-900">
                <span>Livraison Île-de-France</span>
                <span className="font-mono">{francoAtteint ? 'Offerte' : formatAmount(fraisLivraisonStandard)}</span>
              </div>
              <div className="text-[12.5px] text-graphite-600 mt-1">
                Créneau choisi à l'étape suivante · offerte dès {formatAmount(seuilFrancoPort)} HT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre collee (mobile, M5) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 px-4 py-2.5 flex items-center gap-3" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-graphite-500">Total TTC</div>
          <div className="font-mono text-[23px] font-semibold text-ink-900 truncate">{formatAmount(totalFinal)}</div>
        </div>
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="flex-shrink-0 h-[52px] px-6 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[14.5px] font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Valider ma commande
        </button>
      </div>
    </div>
  );
};

export default CartPage;
