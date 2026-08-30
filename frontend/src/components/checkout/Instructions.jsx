/**
 * Instructions de livraison — repliées dans la carte "Règlement à la livraison" du checkout
 * @see design_handoff_jana_refonte/README.md ("05 — Checkout")
 */

const Instructions = ({ formData, onChange }) => (
  <div className="mt-3.5 flex flex-col gap-1.5">
    <span className="text-[12.5px] text-graphite-600">Instructions de livraison <span className="text-graphite-300">(optionnel)</span></span>
    <textarea
      value={formData.instructions}
      onChange={(e) => onChange('instructions', e.target.value)}
      rows={3}
      maxLength={500}
      className="border border-sand-250 rounded-6 px-3.5 py-2.5 text-[13.5px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900 resize-none transition-colors"
      placeholder="Quai de déchargement, code portail, horaires préférés…"
    />
    <p className="text-[11px] text-graphite-300 text-right">{formData.instructions?.length || 0}/500 caractères</p>
  </div>
);

export default Instructions;
