/**
 * Composant ProductListRow — variante liste du catalogue (bascule Grille/Liste)
 * @see design_handoff_jana_refonte/README.md ("02 — Catalogue & filtres")
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePriceMode } from '../contexts/PriceModeContext';
import { getImageUrl } from '../utils/imageUtils';
import { getDisplayPrice } from '../utils/priceUtils';
import toast from 'react-hot-toast';

const ProductListRow = ({ product }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { priceMode } = usePriceMode();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const { slug, nom, reference, prix, prixPromo, tauxTva, origine } = product;
  const stock = product.stockQuantite ?? product.stock ?? 0;
  const inStock = stock > 0;
  const fullImageUrl = getImageUrl(product.imageUrl);
  const effectivePrice = prixPromo ?? prix;
  const { primary, primarySuffix } = getDisplayPrice(effectivePrice, tauxTva, priceMode);

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
    if (ok) setQuantity(1);
  };

  return (
    <div className="flex items-center gap-4 bg-white border border-sand-200 hover:border-sand-250 rounded-8 px-4 py-3 transition-colors">
      <Link to={`/produit/${slug}`} className="w-16 h-16 rounded-6 flex-shrink-0 overflow-hidden placeholder-stripe">
        {fullImageUrl && <img src={fullImageUrl} alt={nom} className="w-full h-full object-cover" />}
      </Link>

      <div className="flex-1 min-w-0">
        {reference && <div className="font-mono text-[10.5px] text-graphite-300">{reference}</div>}
        <Link to={`/produit/${slug}`} className="block text-[14px] font-semibold text-ink-900 hover:text-green-800 truncate">
          {nom}
        </Link>
        {origine && <div className="text-[12px] text-graphite-500">Origine {origine}</div>}
      </div>

      <div className="flex items-baseline gap-1.5 flex-shrink-0 w-[130px]">
        <span className="font-mono text-[16px] font-semibold text-ink-900">{primary}</span>
        <span className="text-[11.5px] text-graphite-500">{primarySuffix}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 w-[90px]">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inStock ? 'bg-stock-ok' : 'bg-stock-low'}`} />
        <span className="text-[11.5px] text-[#3F5A4C]">{inStock ? 'En stock' : 'Rupture'}</span>
      </div>

      <div className="flex items-center gap-[7px] flex-shrink-0">
        <div className="flex items-center border border-sand-250 rounded-5 h-9">
          <button type="button" onClick={decrement} disabled={quantity <= 1} className="w-[26px] text-graphite-500 text-[15px] disabled:opacity-30">–</button>
          <span className="w-[26px] text-center font-mono text-[13px] text-ink-900">{quantity}</span>
          <button type="button" onClick={increment} disabled={!inStock || quantity >= stock} className="w-[26px] text-graphite-500 text-[15px] disabled:opacity-30">+</button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock || adding}
          className="h-9 px-4 rounded-5 text-[13px] font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-sand-250 disabled:text-graphite-400 transition-colors whitespace-nowrap"
        >
          {!inStock ? 'Indisponible' : adding ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>
    </div>
  );
};

export default ProductListRow;
