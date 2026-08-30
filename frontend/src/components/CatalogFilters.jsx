/**
 * Composant CatalogFilters — colonne filtres du catalogue
 * @see design_handoff_jana_refonte/README.md ("02 — Catalogue & filtres")
 */

import { useState } from 'react';
import Checkbox from './Checkbox';

const AVAILABLE_LABELS = [
  { value: 'BIO', label: 'Bio' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'PROMO', label: 'Promo' },
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'AOP', label: 'AOP' },
  { value: 'AOC', label: 'AOC' },
  { value: 'LABEL_ROUGE', label: 'Label Rouge' }
];

const FilterGroup = ({ title, expanded, onToggle, children }) => (
  <div className="px-4 py-3.5 border-b border-[#F0EEE7] last:border-b-0">
    <button type="button" onClick={onToggle} className="flex items-center justify-between w-full mb-2.5">
      <span className="text-[13.5px] font-bold text-ink-900">{title}</span>
      <span className="text-[10px] text-graphite-300">{expanded ? '▲' : '▼'}</span>
    </button>
    {expanded && children}
  </div>
);

const CatalogFilters = ({
  categories = [],
  filters,
  onFilterChange,
  onReset
}) => {
  const [expanded, setExpanded] = useState({ categorie: true, labels: true, prix: true, dispo: true });
  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeLabels = filters.labels ? filters.labels.split(',').filter(Boolean) : [];

  const handleCategoryToggle = (categoryId) => {
    onFilterChange({ ...filters, categorieId: filters.categorieId === categoryId ? undefined : categoryId });
  };

  const handleLabelToggle = (value) => {
    const next = activeLabels.includes(value)
      ? activeLabels.filter((l) => l !== value)
      : [...activeLabels, value];
    onFilterChange({ ...filters, labels: next.join(',') || undefined });
  };

  const handleStockToggle = () => {
    onFilterChange({ ...filters, enStock: filters.enStock === 'true' ? undefined : 'true' });
  };

  const handlePriceChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  // Pastilles "Filtres actifs"
  const activePills = [];
  if (filters.categorieId) {
    const cat = categories.find((c) => c.id === filters.categorieId);
    activePills.push({
      key: 'categorieId',
      label: cat?.nom || 'Catégorie',
      onRemove: () => onFilterChange({ ...filters, categorieId: undefined })
    });
  }
  activeLabels.forEach((value) => {
    activePills.push({
      key: `label-${value}`,
      label: AVAILABLE_LABELS.find((l) => l.value === value)?.label || value,
      onRemove: () => handleLabelToggle(value)
    });
  });
  if (filters.enStock === 'true') {
    activePills.push({ key: 'enStock', label: 'En stock', onRemove: handleStockToggle });
  }
  if (filters.minPrice || filters.maxPrice) {
    activePills.push({
      key: 'price',
      label: `${filters.minPrice || 0} – ${filters.maxPrice || '∞'} € HT`,
      onRemove: () => onFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined })
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Filtres actifs */}
      <div className="bg-white border border-sand-200 rounded-8 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[15px] font-bold text-ink-900">Filtres actifs</span>
          {activePills.length > 0 && (
            <button type="button" onClick={onReset} className="text-[12.5px] text-green-700 hover:text-green-800">
              Tout effacer
            </button>
          )}
        </div>
        {activePills.length === 0 ? (
          <p className="text-[12.5px] text-graphite-400">Aucun filtre appliqué</p>
        ) : (
          <div className="flex flex-wrap gap-[7px]">
            {activePills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={pill.onRemove}
                className="bg-success-bg border border-success-border text-success-text text-[12px] px-[9px] py-[5px] rounded-4 hover:bg-[#DFF0E4] transition-colors"
              >
                {pill.label} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Groupes de filtres */}
      <div className="bg-white border border-sand-200 rounded-8">
        <FilterGroup title="Catégorie" expanded={expanded.categorie} onToggle={() => toggle('categorie')}>
          <div className="flex flex-col gap-[5px]">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryToggle(category.id)}
                className="flex items-center gap-[9px] py-[5px] text-left"
              >
                <Checkbox checked={filters.categorieId === category.id} />
                <span className="text-[13px] text-graphite-700 flex-1">{category.nom}</span>
                {typeof category.productCount === 'number' && (
                  <span className="font-mono text-[11.5px] text-graphite-200">{category.productCount}</span>
                )}
              </button>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Labels" expanded={expanded.labels} onToggle={() => toggle('labels')}>
          <div className="flex flex-col gap-[5px]">
            {AVAILABLE_LABELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => handleLabelToggle(l.value)}
                className="flex items-center gap-[9px] py-[5px] text-left"
              >
                <Checkbox checked={activeLabels.includes(l.value)} />
                <span className="text-[13px] text-graphite-700 flex-1">{l.label}</span>
              </button>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Disponibilité" expanded={expanded.dispo} onToggle={() => toggle('dispo')}>
          <button type="button" onClick={handleStockToggle} className="flex items-center gap-[9px] py-[5px] text-left">
            <Checkbox checked={filters.enStock === 'true'} />
            <span className="text-[13px] text-graphite-700 flex-1">Uniquement en stock</span>
          </button>
        </FilterGroup>

        <div className="px-4 py-3.5">
          <div className="text-[13.5px] font-bold text-ink-900 mb-2.5">Prix HT (€)</div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              className="flex-1 min-w-0 border border-sand-250 rounded-5 px-2.5 py-2 font-mono text-[12.5px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="∞"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              className="flex-1 min-w-0 border border-sand-250 rounded-5 px-2.5 py-2 font-mono text-[12.5px] text-ink-900 placeholder:text-graphite-200 focus:outline-none focus:border-ink-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogFilters;
