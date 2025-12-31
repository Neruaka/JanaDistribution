/**
 * Composant Recapitulatif
 * Sidebar du checkout - Récapitulatif panier, CGV et validation
 */

import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react';

const Recapitulatif = ({ 
  items,
  itemCount,
  subtotalHT,
  totalTVA,
  totalTTC,
  savings,
  fraisLivraison,
  totalCommande,
  formData,
  errors,
  onChange,
  isSubmitting,
  formatPrice
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          Récapitulatif ({itemCount} article{itemCount > 1 ? 's' : ''})
        </h2>

        {/* Liste produits */}
        <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.product?.image ? (
                  <img 
                    src={item.product.image} 
                    alt={item.product?.name || 'Produit'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.product?.name || 'Produit'}
                </p>
                <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {formatPrice(item.subtotal || (item.effectivePrice * item.quantity) || 0)}
              </p>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total HT</span>
            <span>{formatPrice(subtotalHT)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>TVA</span>
            <span>{formatPrice(totalTVA)}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Économies</span>
              <span>-{formatPrice(savings)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Livraison
            </span>
            <span>{formatPrice(fraisLivraison)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t border-gray-200">
            <span>Total TTC</span>
            <span className="text-green-600">{formatPrice(totalCommande)}</span>
          </div>
        </div>

        {/* CGV et bouton (desktop) */}
        <div className="hidden lg:block mt-6 pt-6 border-t border-gray-100">
          {/* CGV */}
          <div className={`mb-4 ${errors.acceptCGV ? 'error-field' : ''}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acceptCGV}
                onChange={(e) => onChange('acceptCGV', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5"
              />
              <span className="text-sm text-gray-600">
                J'accepte les{' '}
                <Link to="/cgv" className="text-green-600 hover:underline" target="_blank">
                  CGV
                </Link>{' '}
                et la{' '}
                <Link to="/confidentialite" className="text-green-600 hover:underline" target="_blank">
                  politique de confidentialité
                </Link>
                . <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.acceptCGV && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.acceptCGV}
              </p>
            )}
          </div>

          {/* Bouton validation */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Valider ma commande
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Un devis vous sera envoyé par email
          </p>
        </div>

        {/* Info sécurité */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Données sécurisées</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Paiement à la livraison</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recapitulatif;
