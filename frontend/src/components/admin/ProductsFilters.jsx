/**
 * Composant ProductsFilters
 * @description 3 filtres dropdown pour la liste admin des produits
 * @see design_handoff_jana_refonte/README.md (A4 — Produits)
 */

const selectClass = 'h-[38px] border border-sand-250 rounded-6 px-3 text-[13.5px] text-graphite-900 bg-white focus:outline-none focus:border-ink-900 flex-1 min-w-0 sm:flex-none';

const ProductsFilters = ({
  selectedCategory,
  stockFilter,
  statutFilter,
  categories,
  onCategoryChange,
  onStockFilterChange,
  onStatutFilterChange
}) => (
  <div className="flex gap-2 sm:gap-2.5 w-full sm:w-auto">
    <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
      <option value="">Tous les rayons</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>{cat.nom}</option>
      ))}
    </select>

    <select value={stockFilter} onChange={(e) => onStockFilterChange(e.target.value)} className={selectClass}>
      <option value="">Tous les stocks</option>
      <option value="in">En stock</option>
      <option value="out">Rupture</option>
    </select>

    <select value={statutFilter} onChange={(e) => onStatutFilterChange(e.target.value)} className={selectClass}>
      <option value="">Tous les statuts</option>
      <option value="actif">Actifs</option>
      <option value="inactif">Inactifs</option>
    </select>
  </div>
);

export default ProductsFilters;
