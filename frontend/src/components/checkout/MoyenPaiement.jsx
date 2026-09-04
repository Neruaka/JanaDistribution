/**
 * Règlement à la livraison — étape du checkout
 * Pas de paiement en ligne (Stripe retiré du MVP) : ESPECES / VIREMENT / CHEQUE uniquement.
 * @see design_handoff_jana_refonte/README.md ("05 — Checkout")
 */

import Instructions from './Instructions';

const MoyenPaiement = ({ formData, onChange, modesPaiement }) => (
  <div className="bg-white border border-sand-200 rounded-8 p-5">
    <div className="font-display text-[16px] font-bold text-ink-900 mb-1">Règlement à la livraison</div>
    <p className="text-[13px] text-graphite-500 mb-3.5">Indiquez le mode prévu, aucun débit maintenant.</p>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {modesPaiement.map((mode) => {
        const selected = formData.modePaiement === mode.id;
        return (
          <label
            key={mode.id}
            className={`rounded-6 p-3.5 cursor-pointer transition-colors ${
              selected ? 'border-[1.5px] border-green-700 bg-selection-bg' : 'border border-sand-200 hover:border-sand-250'
            }`}
          >
            <input type="radio" name="modePaiement" value={mode.id} checked={selected} onChange={(e) => onChange('modePaiement', e.target.value)} className="sr-only" />
            <div className="text-[13.5px] font-semibold text-ink-900">{mode.label}</div>
            <div className="text-[12px] text-graphite-600 mt-0.5">{mode.description}</div>
          </label>
        );
      })}
    </div>

    <Instructions formData={formData} onChange={onChange} />
  </div>
);

export default MoyenPaiement;
