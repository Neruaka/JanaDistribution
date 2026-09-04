/**
 * Composant ProductsFilters
 * @description 3 filtres dropdown pour la liste admin des produits
 * @see design_handoff_jana_refonte/README.md (A4 — Produits)
 */

const selectClass = 'h-[38px] border border-sand-250 rounded-6 px-3 text-[13.5px] text-graphite-900 bg-white focus:outline-none focus:border-ink-900 flex-1 min-w-0 sm:flex-none';

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-shrink-0 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
      active ? 'bg-ink-900 border-ink-900 text-white' : 'bg-white border-sand-250 text-graphite-700'
    }`}
  >
    {children}
  </button>
);

const ProductsFilters = ({
  selectedCategory,
  stockFilter,
  statutFilter,
  categories,
  onCategoryChange,
  onStockFilterChange,
  onStatutFilterChange
}) => (
  <>
    {/* Chips de filtre (mobile, AM4) */}
    <div className="sm:hidden flex gap-2 overflow-x-auto w-full pb-1">
      <Chip active={!selectedCategory} onClick={() => onCategoryChange('')}>Tous les rayons</Chip>
      {categories.map((cat) => (
        <Chip key={cat.id} active={selectedCategory === cat.id} onClick={() => onCategoryChange(selectedCategory === cat.id ? '' : cat.id)}>{cat.nom}</Chip>
      ))}
      <Chip active={stockFilter === 'in'} onClick={() => onStockFilterChange(stockFilter === 'in' ? '' : 'in')}>En stock</Chip>
      <Chip active={stockFilter === 'out'} onClick={() => onStockFilterChange(stockFilter === 'out' ? '' : 'out')}>Rupture</Chip>
      <Chip active={statutFilter === 'actif'} onClick={() => onStatutFilterChange(statutFilter === 'actif' ? '' : 'actif')}>Actifs</Chip>
      <Chip active={statutFilter === 'inactif'} onClick={() => onStatutFilterChange(statutFilter === 'inactif' ? '' : 'inactif')}>Inactifs</Chip>
    </div>

    <div className="hidden sm:flex gap-2.5 w-auto">
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
  </>
);

export default ProductsFilters;
