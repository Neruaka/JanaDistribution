/**
 * Page Fiche produit
 * @description Écran 03 — Fiche produit
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import productService from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePriceMode } from '../contexts/PriceModeContext';
import { getImageUrl } from '../utils/imageUtils';
import { getDisplayPrice, formatAmount } from '../utils/priceUtils';
import ProductCard from '../components/ProductCard';

const LABEL_TEXT = {
  BIO: 'BIO',
  LOCAL: 'LOCAL',
  PROMO: 'PROMO',
  NOUVEAU: 'NOUVEAU',
  AOP: 'AOP',
  AOC: 'AOC',
  LABEL_ROUGE: 'LABEL ROUGE'
};

const UNIT_LABELS = { kg: 'kg', litre: 'L', piece: 'pièce', unite: 'unité' };

const TABS = ['Description', 'Fiche technique', 'Livraison'];

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { fraisLivraisonStandard, seuilFrancoPort } = useSettings();
  const { priceMode } = usePriceMode();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('Description');
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setQuantity(1);
    productService.getBySlug(slug).then((response) => {
      if (!mounted) return;
      if (response.success) setProduct(response.data);
      else setError('Produit non trouvé');
    }).catch((err) => {
      console.error('Erreur chargement produit:', err);
      if (mounted) setError('Impossible de charger le produit');
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    if (!product?.categorieId) { setRelated([]); return; }
    let mounted = true;
    productService.getByCategory(product.categorieId, { limit: 6 }).then((response) => {
      if (mounted && response.success) {
        setRelated(response.data.filter((p) => p.id !== product.id).slice(0, 5));
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [product?.categorieId, product?.id]);

  const stock = product?.stockQuantite ?? product?.stock ?? 0;
  const inStock = stock > 0;

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => (inStock ? Math.min(stock, q + 1) : q));

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      return;
    }
    setAdding(true);
    const ok = await addItem(product.id, quantity);
    setAdding(false);
    if (ok) setQuantity(1);
  };

  if (loading) {
    return (
      <div className="bg-sand-50 min-h-screen px-4 md:px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_430px] gap-9 animate-pulse">
          <div className="h-[450px] bg-sand-100 rounded-8" />
          <div className="space-y-4">
            <div className="h-4 w-1/3 bg-sand-100 rounded" />
            <div className="h-8 w-2/3 bg-sand-100 rounded" />
            <div className="h-40 bg-sand-100 rounded-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-sand-50 min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-danger-text mx-auto mb-4" />
          <h1 className="font-display text-[23px] font-extrabold text-ink-900 mb-2">Produit non trouvé</h1>
          <p className="text-[13.5px] text-graphite-500 mb-6">{error || 'Ce produit n\'existe pas ou a été supprimé.'}</p>
          <button onClick={() => navigate('/catalogue')} className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-6 text-[13.5px] font-semibold transition-colors">
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const fullImageUrl = getImageUrl(product.imageUrl);
  const effectivePrice = product.prixPromo ?? product.prix;
  const { primary, primarySuffix, secondary } = getDisplayPrice(effectivePrice, product.tauxTva, priceMode);
  const totalPrice = getDisplayPrice(effectivePrice * quantity, product.tauxTva, priceMode);
  const unitLabel = UNIT_LABELS[product.uniteMesure] || '';

  const specs = [
    { k: 'Référence', v: product.reference },
    product.origine && { k: 'Origine', v: product.origine },
    { k: 'Conditionnement', v: `Vendu au ${unitLabel || 'détail'}` },
    { k: 'TVA', v: `${product.tauxTva} %` }
  ].filter(Boolean);

  return (
    <div className="bg-sand-50 min-h-screen pb-[86px] md:pb-0">
      <div className="bg-white border-b border-sand-200 px-4 md:px-10 py-3 text-[12.5px] text-graphite-400">
        <Link to="/" className="hover:text-ink-900">Accueil</Link>
        <span className="text-[#C3CBC6] mx-1.5">/</span>
        <Link to="/catalogue" className="hover:text-ink-900">Catalogue</Link>
        {product.categorie && (
          <>
            <span className="text-[#C3CBC6] mx-1.5">/</span>
            <Link to={`/catalogue?categorie=${product.categorie.id}`} className="hover:text-ink-900">{product.categorie.nom}</Link>
          </>
        )}
        <span className="text-[#C3CBC6] mx-1.5">/</span>
        <span className="text-ink-900">{product.nom}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_430px] gap-9 px-4 md:px-10 pt-7 pb-[34px]">
        {/* Colonne galerie + onglets */}
        <div className="flex flex-col gap-[22px]">
          {/* T16-05 : plus de rangée de vignettes — aucun système multi-image
              n'existe (product.imageUrl est un champ chaîne unique partout),
              c'était du scaffolding de maquette jamais raccordé à de vraies
              données. */}
          <div className="hidden md:block max-h-[420px] aspect-square rounded-8 border border-sand-200 placeholder-stripe overflow-hidden">
            {fullImageUrl ? (
              <img src={fullImageUrl} alt={product.nom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-end p-3.5">
                <span className="font-mono text-[11px] text-graphite-300">photo produit — 1200 × 1200, fond neutre</span>
              </div>
            )}
          </div>
          {/* Mobile : image unique 300px, sans bandeau de vignettes (pas de galerie multi-photos reelle) */}
          <div className="md:hidden h-[300px] rounded-8 border border-sand-200 placeholder-stripe flex items-end p-3.5 overflow-hidden">
            {fullImageUrl ? (
              <img src={fullImageUrl} alt={product.nom} className="w-full h-full object-cover" />
            ) : (
              <span className="font-mono text-[11px] text-graphite-300">photo produit — 1200 × 1200, fond neutre</span>
            )}
          </div>

          <div className="bg-white border border-sand-200 rounded-8">
            <div className="flex border-b border-sand-200 px-[18px] gap-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`text-[14px] py-3.5 whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab ? 'font-semibold text-ink-900 border-green-700' : 'text-graphite-500 border-transparent hover:text-ink-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-[18px]">
              {activeTab === 'Description' && (
                <p className="text-[14px] leading-[1.7] text-graphite-700">
                  {product.description || 'Aucune description disponible pour ce produit.'}
                </p>
              )}
              {activeTab === 'Fiche technique' && (
                <div className="flex flex-col max-w-md">
                  {specs.map((s) => (
                    <div key={s.k} className="flex justify-between py-2.5 border-b border-[#F0EEE7] last:border-b-0">
                      <span className="text-[13px] text-graphite-500">{s.k}</span>
                      <span className="text-[13px] text-ink-900 font-medium">{s.v}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'Livraison' && (
                <div className="flex flex-col gap-2 text-[14px] text-graphite-700">
                  <p>Livraison en 24–48 h en Île-de-France, du lundi au samedi.</p>
                  <p>Livraison offerte dès {seuilFrancoPort} € HT de commande, sinon {formatAmount(fraisLivraisonStandard)} de frais.</p>
                  <p>Créneau choisi à la commande, confirmé par téléphone.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne achat */}
        <div className="flex flex-col gap-3.5">
          <div className="flex gap-[7px] flex-wrap">
            {(product.labels || []).filter((l) => l !== 'PROMO').map((label) => (
              <span key={label} className="bg-success-bg border border-success-border text-success-text text-[11.5px] font-semibold px-[9px] py-[5px] rounded-4">
                {LABEL_TEXT[label] || label}
              </span>
            ))}
            {product.origine && (
              <span className="bg-warning-bg-alt border border-warning-border text-warning-text text-[11.5px] font-semibold px-[9px] py-[5px] rounded-4">
                ORIGINE {product.origine.toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display text-[23px] md:text-[31px] font-extrabold leading-[1.1] tracking-tighter text-ink-900">{product.nom}</h1>
            <div className="font-mono text-[12.5px] text-graphite-400 mt-1.5">
              {product.reference}{product.origine ? ` · ${product.origine}` : ''}
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-[28px] md:text-[34px] font-semibold tracking-tight text-ink-900">{primary}</span>
              <span className="text-[14px] text-graphite-500">{primarySuffix}{unitLabel ? ` / ${unitLabel}` : ''}</span>
              {product.prixPromo && (
                <span className="font-mono text-[15px] text-graphite-300 line-through">{formatAmount(product.prix)}</span>
              )}
            </div>
            <div className="text-[13px] text-graphite-300 mt-0.5">{secondary}</div>

            <div className="flex items-center gap-2 mt-4">
              <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${inStock ? 'bg-stock-ok' : 'bg-stock-low'}`} />
              <span className={`text-[13.5px] font-semibold ${inStock ? 'text-green-700' : 'text-danger-text'}`}>
                {inStock ? `En stock — ${stock} ${unitLabel || 'dispo.'}` : 'Rupture de stock'}
              </span>
              {inStock && <span className="text-[13px] text-graphite-500">· expédié demain si commandé avant 18 h</span>}
            </div>

            <div className="hidden md:flex gap-2.5 mt-4">
              <div className="flex items-center border border-sand-250 rounded-6 h-[50px] flex-shrink-0">
                <button type="button" onClick={decrement} disabled={quantity <= 1} className="w-10 text-graphite-600 text-[18px] disabled:opacity-30">–</button>
                <span className="w-11 text-center font-mono text-[16px] text-ink-900">{quantity}</span>
                <button type="button" onClick={increment} disabled={!inStock || quantity >= stock} className="w-10 text-graphite-600 text-[18px] disabled:opacity-30">+</button>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || adding}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-sand-250 disabled:text-graphite-400 text-white h-[50px] rounded-6 text-[15px] font-semibold transition-colors"
              >
                {!inStock ? 'Indisponible' : adding ? 'Ajout…' : `Ajouter au panier — ${totalPrice.primary} ${totalPrice.primarySuffix}`}
              </button>
            </div>
            <div className="flex gap-2.5 mt-2.5">
              <button type="button" disabled title="Bientôt disponible" className="flex-1 border border-sand-250 text-ink-900 h-[42px] rounded-6 text-[13.5px] font-semibold opacity-40 cursor-not-allowed">
                Ajouter à une liste
              </button>
              <button type="button" disabled title="Bientôt disponible" className="flex-1 border border-sand-250 text-ink-900 h-[42px] rounded-6 text-[13.5px] font-semibold opacity-40 cursor-not-allowed">
                Commande récurrente
              </button>
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 px-[18px] py-3.5 flex flex-col gap-2.5">
            <div className="flex gap-2.5 text-[13px] text-graphite-700">
              <span className="text-green-700">✓</span> Livraison 24–48 h en Île-de-France, offerte dès {seuilFrancoPort} € HT
            </div>
            <div className="flex gap-2.5 text-[13px] text-graphite-700">
              <span className="text-green-700">✓</span> Créneau de livraison choisi à la commande, confirmé par téléphone
            </div>
            <div className="flex gap-2.5 text-[13px] text-graphite-700">
              <span className="text-green-700">✓</span> Chaîne du froid garantie, produit non conforme repris
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="px-4 md:px-10 pb-10">
          <h2 className="font-display text-[21px] font-extrabold tracking-tight text-ink-900 mb-3.5">Souvent commandé avec</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[14px]">
            {related.map((p) => <ProductCard key={p.id} product={p} imageHeight={130} />)}
          </div>
        </div>
      )}

      {/* Barre d'achat collee (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 px-4 py-2.5 flex gap-2.5" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center border border-sand-250 rounded-6 h-[50px] flex-shrink-0">
          <button type="button" onClick={decrement} disabled={quantity <= 1} className="w-10 text-graphite-600 text-[18px] disabled:opacity-30">–</button>
          <span className="w-10 text-center font-mono text-[16px] text-ink-900">{quantity}</span>
          <button type="button" onClick={increment} disabled={!inStock || quantity >= stock} className="w-10 text-graphite-600 text-[18px] disabled:opacity-30">+</button>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-sand-250 disabled:text-graphite-400 text-white h-[50px] rounded-6 text-[14px] font-semibold transition-colors truncate px-2"
        >
          {!inStock ? 'Indisponible' : adding ? 'Ajout…' : `Ajouter · ${totalPrice.primary} ${totalPrice.primarySuffix}`}
        </button>
      </div>
    </div>
  );
};

export default ProductDetailPage;
