/**
 * Récapitulatif — colonne droite du checkout ("Votre commande")
 * Le code promo est appliqué sur la page panier ; ici on ne fait que refléter le
 * rabais déjà validé (pas de second champ de saisie, absent de la maquette).
 * @see design_handoff_jana_refonte/README.md ("05 — Checkout")
 */

import { AlertCircle, Loader2, FileText } from 'lucide-react';
import Checkbox from '../Checkbox';
import { getImageUrl } from '../../utils/imageUtils';
import { formatAmount } from '../../utils/priceUtils';

const Recapitulatif = ({
  items,
  subtotalHT,
  totalTVA,
  fraisLivraison,
  shippingInfo,
  shippingLoading,
  totalCommande,
  formData,
  errors,
  onChange,
  isSubmitting,
  codePromoValide
}) => {
  const totalFinal = codePromoValide ? codePromoValide.total_apres_rabais : totalCommande;

  return (
    <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
      <div className="font-display text-[16px] font-bold text-ink-900 mb-3.5">Votre commande</div>

      <div className="max-h-64 overflow-y-auto -mx-1 px-1">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2.5 py-2.5 border-b border-[#F0EEE7] last:border-b-0 items-center">
            <div className="w-11 h-11 rounded-4 flex-shrink-0 overflow-hidden placeholder-stripe">
              {getImageUrl(item.product?.image) && (
                <img src={getImageUrl(item.product.image)} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink-900 leading-[1.3] truncate">{item.product?.name}</div>
              <div className="font-mono text-[11.5px] text-graphite-300">{item.product?.reference} · ×{item.quantity}</div>
            </div>
            <span className="font-mono text-[13px] text-ink-900 flex-shrink-0">{formatAmount(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2.5 text-[13.5px]">
        <span className="text-graphite-600">Sous-total HT</span>
        <span className="font-mono text-ink-900">{formatAmount(subtotalHT)}</span>
      </div>
      <div className="flex justify-between py-1.5 text-[13.5px]">
        <span className="text-graphite-600">TVA</span>
        <span className="font-mono text-ink-900">{formatAmount(totalTVA)}</span>
      </div>
      {codePromoValide && (
        <div className="flex justify-between py-1.5 text-[13.5px]">
          <span className="text-graphite-600">Remise ({codePromoValide.code})</span>
          <span className="font-mono text-green-700">−{formatAmount(codePromoValide.montant_rabais)}</span>
        </div>
      )}
      <div className="flex justify-between py-1.5 text-[13.5px] border-b border-[#F0EEE7]">
        <span className="text-graphite-600 flex items-center gap-1">
          Livraison
          {shippingInfo?.distanceKm != null && !shippingInfo?.horsZone && (
            <span className="text-[11px] text-graphite-300">({shippingInfo.distanceKm} km)</span>
          )}
        </span>
        <span className="font-mono text-ink-900">
          {shippingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : shippingInfo?.francoAtteint ? <span className="text-green-700">Offerte</span> : formatAmount(fraisLivraison)}
        </span>
      </div>

      {shippingInfo?.horsZone && (
        <div className="flex items-start gap-2 mt-2 p-2.5 bg-danger-bg border border-danger-border rounded-5 text-[12px] text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Adresse hors zone de livraison (max {shippingInfo.distanceMaxKm} km).</span>
        </div>
      )}
      {shippingInfo?.geocodageEchoue && (
        <p className="text-[11.5px] text-warning-text mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Adresse non géolocalisée — tarif standard appliqué.
        </p>
      )}

      <div className="flex justify-between items-baseline pt-3.5">
        <span className="font-display text-[16px] font-bold text-ink-900">Total à régler</span>
        <span className="font-mono text-[25px] font-semibold text-ink-900">{formatAmount(totalFinal)}</span>
      </div>

      <button
        type="button"
        aria-label="Accepter les CGV et la politique de confidentialité"
        aria-pressed={formData.acceptCGV}
        onClick={() => onChange('acceptCGV', !formData.acceptCGV)}
        className={`flex items-start gap-2.5 mt-3.5 text-left ${errors.acceptCGV ? 'error-field' : ''}`}
      >
        <Checkbox checked={formData.acceptCGV} className="mt-0.5" />
        <span className="text-[12.5px] text-graphite-600 leading-[1.5]">
          J'accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800" onClick={(e) => e.stopPropagation()}>CGV</a> et la{' '}
          <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800" onClick={(e) => e.stopPropagation()}>politique de confidentialité</a>.
        </span>
      </button>
      {errors.acceptCGV && (
        <p className="text-[12px] text-danger-text flex items-center gap-1 mt-1.5"><AlertCircle className="w-3.5 h-3.5" /> {errors.acceptCGV}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-3 h-[50px] bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Recevoir mon devis
      </button>
      <p className="text-[12px] text-graphite-300 text-center mt-2">Sans engagement — vous confirmez après réception du devis</p>
    </div>
  );
};

export default Recapitulatif;
