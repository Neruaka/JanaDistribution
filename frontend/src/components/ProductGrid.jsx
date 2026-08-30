/**
 * Composant ProductGrid
 * @description Grille responsive de produits (ProductCard) avec états loading/vide
 */

import ProductCard from './ProductCard';

const gridColsClass = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
};

const SkeletonCard = ({ imageHeight }) => (
  <div className="bg-white border border-sand-200 rounded-8 overflow-hidden animate-pulse">
    <div className="bg-sand-100" style={{ height: imageHeight }} />
    <div className="px-[13px] py-3 space-y-2">
      <div className="h-2.5 w-1/3 bg-sand-100 rounded" />
      <div className="h-4 w-3/4 bg-sand-100 rounded" />
      <div className="h-5 w-1/2 bg-sand-100 rounded mt-2" />
    </div>
  </div>
);

const ProductGrid = ({
  products = [],
  loading = false,
  emptyMessage = 'Aucun produit trouvé',
  columns = 4,
  imageHeight = 150
}) => {
  if (loading) {
    return (
      <div className={`grid ${gridColsClass[columns]} gap-[14px]`}>
        {Array.from({ length: columns * 2 }).map((_, index) => (
          <SkeletonCard key={index} imageHeight={imageHeight} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-sand-200 rounded-8">
        <p className="text-[15px] font-semibold text-ink-900 mb-1">{emptyMessage}</p>
        <p className="text-[13px] text-graphite-500">Essayez de modifier vos filtres ou votre recherche.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridColsClass[columns]} gap-[14px]`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} imageHeight={imageHeight} />
      ))}
    </div>
  );
};

export default ProductGrid;
