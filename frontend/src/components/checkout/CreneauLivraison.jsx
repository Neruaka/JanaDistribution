/**
 * Créneau de livraison — étape du checkout
 * Aucune capacité de créneaux n'est gérée côté backend : le choix ici est indicatif,
 * transmis dans les instructions de livraison, et confirmé par téléphone (voir README
 * "05 — Checkout"). Les dates sont calculées réellement (pas de valeurs figées).
 * @see design_handoff_jana_refonte/README.md
 */

import { useMemo } from 'react';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDay = (date) => capitalize(
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
);

const buildSlots = (today, count) => {
  const slots = [];
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // pas de livraison le jour même

  while (slots.length < count) {
    if (cursor.getDay() !== 0) { // pas de livraison le dimanche
      slots.push({ date: new Date(cursor), jour: formatDay(cursor), heure: '6 h – 12 h' });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
};

const CreneauLivraison = ({ today, selectedIndex, onSelect }) => {
  const slots = useMemo(() => buildSlots(today, 4), [today]);

  return (
    <div className="bg-white border border-sand-200 rounded-8 p-5">
      <div className="font-display text-[16px] font-bold text-ink-900 mb-1">Créneau de livraison</div>
      <p className="text-[13px] text-graphite-500 mb-3.5">Confirmé par téléphone après validation du devis.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {slots.map((slot, index) => {
          const selected = selectedIndex === index;
          return (
            <button
              key={slot.jour}
              type="button"
              onClick={() => onSelect(index, slot)}
              className={`text-left rounded-6 p-3 transition-colors ${
                selected ? 'border-[1.5px] border-green-700 bg-selection-bg' : 'border border-sand-200 hover:border-sand-250'
              }`}
            >
              <div className="text-[13.5px] font-semibold text-ink-900">{slot.jour}</div>
              <div className="text-[12.5px] text-graphite-500 mt-0.5">{slot.heure}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CreneauLivraison;
