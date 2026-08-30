/**
 * Adresse de facturation — repliée dans la carte "Adresse de livraison" du checkout
 * (case "Utiliser cette adresse pour la facturation" + formulaire si différente)
 * @see design_handoff_jana_refonte/README.md ("05 — Checkout")
 */

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Checkbox from '../Checkbox';

const inputClass = (hasError) =>
  `border rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none transition-colors ${
    hasError ? 'border-danger-border bg-danger-bg' : 'border-sand-250 focus:border-ink-900'
  }`;

const AdresseFacturation = ({ formData, errors, onChange, adresseLivraison }) => {
  const [memeAdresse, setMemeAdresse] = useState(true);

  const handleToggle = () => {
    const next = !memeAdresse;
    setMemeAdresse(next);
    if (next && adresseLivraison) {
      onChange('adresseFacturation', adresseLivraison.adresse || '');
      onChange('complementFacturation', adresseLivraison.complement || '');
      onChange('codePostalFacturation', adresseLivraison.codePostal || '');
      onChange('villeFacturation', adresseLivraison.ville || '');
    } else if (!next) {
      onChange('adresseFacturation', '');
      onChange('complementFacturation', '');
      onChange('codePostalFacturation', '');
      onChange('villeFacturation', '');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-sand-200">
      <button type="button" onClick={handleToggle} className="flex items-center gap-2.5 text-left">
        <Checkbox checked={memeAdresse} />
        <span className="text-[13.5px] text-graphite-700">Utiliser cette adresse pour la facturation</span>
      </button>

      {!memeAdresse && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
          <div className={`sm:col-span-2 flex flex-col gap-1.5 ${errors.adresseFacturation ? 'error-field' : ''}`}>
            <span className="text-[12.5px] text-graphite-600">Adresse</span>
            <input
              type="text"
              value={formData.adresseFacturation || ''}
              onChange={(e) => onChange('adresseFacturation', e.target.value)}
              className={inputClass(errors.adresseFacturation)}
              placeholder="15 rue de la Paix"
            />
            {errors.adresseFacturation && (
              <p className="text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.adresseFacturation}</p>
            )}
          </div>
          <div className={`flex flex-col gap-1.5 ${errors.codePostalFacturation ? 'error-field' : ''}`}>
            <span className="text-[12.5px] text-graphite-600">Code postal</span>
            <input
              type="text"
              value={formData.codePostalFacturation || ''}
              onChange={(e) => onChange('codePostalFacturation', e.target.value.replace(/\D/g, '').slice(0, 5))}
              className={inputClass(errors.codePostalFacturation)}
              placeholder="75001"
              maxLength={5}
            />
            {errors.codePostalFacturation && (
              <p className="text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.codePostalFacturation}</p>
            )}
          </div>
          <div className={`flex flex-col gap-1.5 ${errors.villeFacturation ? 'error-field' : ''}`}>
            <span className="text-[12.5px] text-graphite-600">Ville</span>
            <input
              type="text"
              value={formData.villeFacturation || ''}
              onChange={(e) => onChange('villeFacturation', e.target.value)}
              className={inputClass(errors.villeFacturation)}
              placeholder="Paris"
            />
            {errors.villeFacturation && (
              <p className="text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.villeFacturation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdresseFacturation;
