/**
 * Coordonnées — étape 1 du checkout
 * @see design_handoff_jana_refonte/README.md ("05 — Checkout")
 */

import { AlertCircle } from 'lucide-react';
import { formatPhoneInput } from '../../utils/phoneUtils';

const Field = ({ label, optional, error, children }) => (
  <div className={`flex flex-col gap-1.5 ${error ? 'error-field' : ''}`}>
    <span className="text-[12.5px] text-graphite-600">
      {label}{optional && <span className="text-graphite-300"> (optionnel)</span>}
    </span>
    {children}
    {error && (
      <p className="text-[12px] text-danger-text flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" /> {error}
      </p>
    )}
  </div>
);

const inputClass = (hasError) =>
  `border rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none transition-colors ${
    hasError ? 'border-danger-border bg-danger-bg' : 'border-sand-250 focus:border-ink-900'
  }`;

const InfosContact = ({ formData, errors, onChange, typeClient }) => (
  <div className="bg-white border border-sand-200 rounded-8 p-5">
    <div className="font-display text-[16px] font-bold text-ink-900 mb-4">Coordonnées</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <Field label="Prénom" error={errors.prenom}>
        <input type="text" value={formData.prenom} onChange={(e) => onChange('prenom', e.target.value)} className={inputClass(errors.prenom)} placeholder="Jean" />
      </Field>
      <Field label="Nom" error={errors.nom}>
        <input type="text" value={formData.nom} onChange={(e) => onChange('nom', e.target.value)} className={inputClass(errors.nom)} placeholder="Dupont" />
      </Field>
      <Field label="Téléphone" error={errors.telephone}>
        <input type="tel" value={formData.telephone} onChange={(e) => onChange('telephone', formatPhoneInput(e.target.value))} className={inputClass(errors.telephone)} placeholder="06 12 34 56 78" />
      </Field>
      {typeClient === 'PROFESSIONNEL' && (
        <Field label="Raison sociale" optional>
          <input type="text" value={formData.entreprise} onChange={(e) => onChange('entreprise', e.target.value)} className={inputClass(false)} placeholder="Ma société SARL" />
        </Field>
      )}
    </div>
  </div>
);

export default InfosContact;
