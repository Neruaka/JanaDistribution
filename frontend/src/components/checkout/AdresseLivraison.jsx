/**
 * Adresse de livraison — étape 2 du checkout
 * @see design_handoff_jana_refonte/README.md ("05 — Checkout")
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import AdresseFacturation from './AdresseFacturation';

const inputClass = (hasError) =>
  `border rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none transition-colors ${
    hasError ? 'border-danger-border bg-danger-bg' : 'border-sand-250 focus:border-ink-900'
  }`;

const AdresseLivraison = ({ formData, errors, onChange, userId }) => {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useNewAddress, setUseNewAddress] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `addresses_${userId}`;
    const storedAddresses = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
    if (!storedAddresses) {
      setUseNewAddress(true);
      return;
    }
    sessionStorage.setItem(storageKey, storedAddresses);
    localStorage.removeItem(storageKey);
    try {
      const addresses = JSON.parse(storedAddresses);
      setSavedAddresses(addresses);
      const defaultIndex = addresses.findIndex((a) => a.estDefaut);
      const initialIndex = defaultIndex !== -1 ? defaultIndex : addresses.length > 0 ? 0 : -1;
      if (initialIndex !== -1) {
        setSelectedIndex(initialIndex);
        applyAddress(addresses[initialIndex]);
      } else {
        setUseNewAddress(true);
      }
    } catch {
      setUseNewAddress(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const applyAddress = (address) => {
    onChange('adresse', address.adresse || '');
    onChange('complement', address.complement || '');
    onChange('codePostal', address.codePostal || '');
    onChange('ville', address.ville || '');
  };

  const handleSelectAddress = (index) => {
    const address = savedAddresses[index];
    if (!address) return;
    setSelectedIndex(index);
    setUseNewAddress(false);
    applyAddress(address);
  };

  const handleUseNewAddress = () => {
    setUseNewAddress(true);
    setSelectedIndex(-1);
    onChange('adresse', '');
    onChange('complement', '');
    onChange('codePostal', '');
    onChange('ville', '');
  };

  const adresseLivraison = {
    adresse: formData.adresse,
    complement: formData.complement,
    codePostal: formData.codePostal,
    ville: formData.ville
  };

  return (
    <div className="bg-white border border-sand-200 rounded-8 p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="font-display text-[16px] font-bold text-ink-900">Adresse de livraison</div>
        {savedAddresses.length > 0 && !useNewAddress && (
          <button type="button" onClick={handleUseNewAddress} className="text-[13px] font-semibold text-green-700 hover:text-green-800">
            + Nouvelle adresse
          </button>
        )}
      </div>

      {savedAddresses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savedAddresses.map((address, index) => {
            const selected = selectedIndex === index && !useNewAddress;
            return (
              <button
                key={`saved-address-${index}`}
                type="button"
                onClick={() => handleSelectAddress(index)}
                className={`text-left rounded-6 p-3.5 transition-colors ${
                  selected ? 'border-[1.5px] border-green-700 bg-selection-bg' : 'border border-sand-200 hover:border-sand-250'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-bold text-ink-900">{address.nom}</span>
                  {selected && <Check className="w-4 h-4 text-green-700" />}
                </div>
                <div className="text-[13px] text-graphite-700 leading-[1.55] mt-1">
                  {address.adresse}{address.complement && `, ${address.complement}`}<br />
                  {address.codePostal} {address.ville}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {(useNewAddress || savedAddresses.length === 0) && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${savedAddresses.length > 0 ? 'mt-3.5 pt-3.5 border-t border-sand-200' : ''}`}>
          <div className={`sm:col-span-2 flex flex-col gap-1.5 ${errors.adresse ? 'error-field' : ''}`}>
            <span className="text-[12.5px] text-graphite-600">Adresse</span>
            <input type="text" value={formData.adresse} onChange={(e) => onChange('adresse', e.target.value)} className={inputClass(errors.adresse)} placeholder="15 rue de la Paix" />
            {errors.adresse && <p className="text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.adresse}</p>}
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <span className="text-[12.5px] text-graphite-600">Complément <span className="text-graphite-300">(optionnel)</span></span>
            <input type="text" value={formData.complement} onChange={(e) => onChange('complement', e.target.value)} className={inputClass(false)} placeholder="Bâtiment A, 2ème étage…" />
          </div>
          <div className={`flex flex-col gap-1.5 ${errors.codePostal ? 'error-field' : ''}`}>
            <span className="text-[12.5px] text-graphite-600">Code postal</span>
            <input type="text" value={formData.codePostal} onChange={(e) => onChange('codePostal', e.target.value.replace(/\D/g, '').slice(0, 5))} className={inputClass(errors.codePostal)} placeholder="75001" maxLength={5} />
            {errors.codePostal && <p className="text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.codePostal}</p>}
          </div>
          <div className={`flex flex-col gap-1.5 ${errors.ville ? 'error-field' : ''}`}>
            <span className="text-[12.5px] text-graphite-600">Ville</span>
            <input type="text" value={formData.ville} onChange={(e) => onChange('ville', e.target.value)} className={inputClass(errors.ville)} placeholder="Paris" />
            {errors.ville && <p className="text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.ville}</p>}
          </div>
        </div>
      )}

      <AdresseFacturation formData={formData} errors={errors} onChange={onChange} adresseLivraison={adresseLivraison} />
    </div>
  );
};

export default AdresseLivraison;
