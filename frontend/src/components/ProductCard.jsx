/**
 * Composant ProductCard — motif réutilisé partout (accueil, catalogue, fiche, panier)
 * @location frontend/src/components/ProductCard.jsx
 * @see design_handoff_jana_refonte/README.md ("Carte produit")
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePriceMode } from '../contexts/PriceModeContext';
import { getImageUrl } from '../utils/imageUtils';
import { getDisplayPrice, formatAmount } from '../utils/priceUtils';
import toast from 'react-hot-toast';

const UNIT_LABELS = {
  kg: '/kg',
  litre: '/L',
  piece: '/pièce',
  unite: '/unité'
};

const UNIT_DESCRIPTIONS = {
  kg: 'Vendu au kilo',
  litre: 'Vendu au litre',
  piece: 'Vendu à la pièce',
  unite: 'Vendu à l\'unité'
};

const LABEL_TEXT = {
  BIO: 'BIO',
  LOCAL: 'LOCAL',
  NOUVEAU: 'NOUVEAU',
  AOP: 'AOP',
  AOC: 'AOC',
  LABEL_ROUGE: 'LABEL ROUGE'
};

const getBadge = (product) => {
  if (product.prixPromo) return 'PROMO';
  const label = (product.labels || []).find((l) => l !== 'PROMO');
  return label ? (LABEL_TEXT[label] || label) : null;
};

const getSubtitle = (product) => {
  const parts = [];
  if (product.origine) parts.push(`Origine ${product.origine}`);
  else parts.push(UNIT_DESCRIPTIONS[product.uniteMesure] || null);
  return parts.filter(Boolean).join(' · ');
};

const ProductCard = ({ product, imageHeight = 150, onAdded }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { priceMode } = usePriceMode();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const {
    slug,
    nom,
    reference,
    prix,
    prixPromo,
    tauxTva,
    uniteMesure,
    imageUrl
  } = product;

  const stock = product.stockQuantite ?? product.stock ?? 0;
  const stockMinAlerte = product.stockMinAlerte ?? 5;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= stockMinAlerte;

  const fullImageUrl = getImageUrl(imageUrl);
  const effectivePrice = prixPromo ?? prix;
  const { primary, primarySuffix, secondary } = getDisplayPrice(effectivePrice, tauxTva, priceMode);
  const unitLabel = UNIT_LABELS[uniteMesure] || '';
  const badge = getBadge(product);
  const subtitle = getSubtitle(product);

  const stockDotClass = !inStock ? 'bg-stock-low' : lowStock ? 'bg-stock-mid' : 'bg-stock-ok';
  const stockLabel = !inStock ? 'Rupture de stock' : lowStock ? `Stock bas · ${stock} dispo.` : 'En stock';

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => (inStock ? Math.min(stock, q + 1) : q));

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      return;
    }
    setAdding(true);
    const ok = await addItem(product.id, quantity);
    setAdding(false);
    if (ok) {
      setQuantity(1);
      onAdded?.(product, quantity);
    }
  };

  return (
    <div className="group bg-white border border-sand-200 hover:border-sand-250 rounded-8 flex flex-col overflow-hidden transition-colors">
      {/* Image */}
      <Link to={`/produit/${slug}`} className="relative block flex-shrink-0" style={{ height: imageHeight }}>
        {fullImageUrl ? (
          <img src={fullImageUrl} alt={nom} className="w-full h-full object-cover" />
        ) : (
          <div className="placeholder-stripe w-full h-full flex items-end p-2">
            <span className="font-mono text-[9.5px] text-graphite-300">1200×1200</span>
          </div>
        )}
        {badge && (
          <span className="absolute top-2 left-2 bg-ink-900 text-white text-[10px] tracking-wide px-[7px] py-[3px] rounded-3">
            {badge}
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-ink-900/50 flex items-center justify-center">
            <span className="bg-white text-ink-900 text-[12px] font-semibold px-3 py-1.5 rounded-6">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      {/* Corps */}
      <div className="px-[13px] py-3 flex flex-col gap-[5px] flex-1">
        {reference && (
          <span className="font-mono text-[10.5px] text-graphite-300">{reference}</span>
        )}

        <Link to={`/produit/${slug}`}>
          <h3 className="text-[14px] font-semibold text-ink-900 leading-[1.3] line-clamp-2 hover:text-green-800">
            {nom}
          </h3>
        </Link>

        {subtitle && <span className="text-[12px] text-graphite-500">{subtitle}</span>}

        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="font-mono text-[19px] font-semibold text-ink-900">{primary}</span>
          <span className="text-[12px] text-graphite-500">{primarySuffix}{unitLabel ? ` / ${unitLabel.replace(/^\//, '')}` : ''}</span>
        </div>
        {prixPromo && (
          <span className="font-mono text-[11px] text-graphite-300 line-through -mt-1">
            {formatAmount(prix)}
          </span>
        )}
        <span className="text-[11.5px] text-graphite-300">{secondary}</span>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stockDotClass}`} />
          <span className="text-[11.5px] text-[#3F5A4C]">{stockLabel}</span>
        </div>

        <div className="flex gap-[7px] mt-2.5">
          <div className="flex items-center border border-sand-250 rounded-5 h-9 flex-shrink-0">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= 1}
              className="w-[26px] text-graphite-500 text-[15px] disabled:opacity-30"
              aria-label="Diminuer la quantité"
            >
              –
            </button>
            <span className="w-[26px] text-center font-mono text-[13px] text-ink-900">{quantity}</span>
            <button
              type="button"
              onClick={increment}
              disabled={!inStock || quantity >= stock}
              className="w-[26px] text-graphite-500 text-[15px] disabled:opacity-30"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock || adding}
            className="flex-1 h-9 rounded-5 text-[13px] font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-sand-250 disabled:text-graphite-400 transition-colors"
          >
            {!inStock ? 'Indisponible' : adding ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
