/**
 * MobileFilterSheet — feuille de filtres catalogue (mobile)
 * @see design_handoff_jana_refonte/README.md (M3 — Filtres, feuille)
 *
 * Reutilise l'etat/handlers de filtre du catalogue (memes filtres, meme
 * logique) mais presente les options en chips plutot qu'en cases a cocher,
 * conformement au pattern mobile specifique de la maquette.
 */

import { AVAILABLE_LABELS } from './CatalogFilters';

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3.5 py-2 rounded-[16px] text-[13px] font-medium border transition-colors ${
      active ? 'bg-ink-900 border-ink-900 text-white' : 'border-sand-250 text-graphite-700'
    }`}
  >
    {children}
  </button>
);

const MobileFilterSheet = ({ open, onClose, categories, filters, onFilterChange, onReset, resultCount }) => {
  if (!open) return null;

  const activeLabels = filters.labels ? filters.labels.split(',').filter(Boolean) : [];

  const handleCategoryToggle = (categoryId) => {
    onFilterChange({ ...filters, categorieId: filters.categorieId === categoryId ? undefined : categoryId });
  };

  const handleLabelToggle = (value) => {
    const next = activeLabels.includes(value) ? activeLabels.filter((l) => l !== value) : [...activeLabels, value];
    onFilterChange({ ...filters, labels: next.join(',') || undefined });
  };

  const handleStockToggle = () => {
    onFilterChange({ ...filters, enStock: filters.enStock === 'true' ? undefined : 'true' });
  };

  const handlePriceChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-overlay-mobile" onClick={onClose} />
      <div className="relative bg-white rounded-t-[16px] max-h-[620px] flex flex-col">
        <div className="flex justify-center pt-2.5 pb-1.5 flex-shrink-0">
          <div className="w-[38px] h-1 rounded-full bg-sand-300" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-sand-200 flex-shrink-0">
          <span className="font-display text-[17px] font-bold text-ink-900">Filtrer</span>
          <button type="button" onClick={onReset} className="text-[13px] font-semibold text-green-700 hover:text-green-800">
            Tout effacer
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          <div>
            <div className="text-[13px] font-bold text-ink-900 mb-2.5">Catégorie</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Chip key={cat.id} active={filters.categorieId === cat.id} onClick={() => handleCategoryToggle(cat.id)}>
                  {cat.nom}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-bold text-ink-900 mb-2.5">Labels</div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LABELS.map((l) => (
                <Chip key={l.value} active={activeLabels.includes(l.value)} onClick={() => handleLabelToggle(l.value)}>
                  {l.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-bold text-ink-900 mb-2.5">Disponibilité</div>
            <Chip active={filters.enStock === 'true'} onClick={handleStockToggle}>Uniquement en stock</Chip>
          </div>

          <div>
            <div className="text-[13px] font-bold text-ink-900 mb-2.5">Prix HT (€)</div>
            <div className="flex gap-2">
              <input
                type="number" min="0" step="0.01" placeholder="0"
                value={filters.minPrice || ''} onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                className="flex-1 min-w-0 border border-sand-250 rounded-6 px-3 h-11 font-mono text-[13px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900"
              />
              <input
                type="number" min="0" step="0.01" placeholder="∞"
                value={filters.maxPrice || ''} onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                className="flex-1 min-w-0 border border-sand-250 rounded-6 px-3 h-11 font-mono text-[13px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900"
              />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex gap-2.5 px-4 py-3 border-t border-sand-200" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={onReset} className="flex-1 h-12 border border-sand-250 text-graphite-700 text-[13.5px] font-semibold rounded-6">
            Réinitialiser
          </button>
          <button type="button" onClick={onClose} className="flex-1 h-12 bg-green-700 hover:bg-green-800 text-white text-[13.5px] font-semibold rounded-6 transition-colors">
            Voir les {resultCount} réf.
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterSheet;
