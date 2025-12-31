/**
 * Composant ProductsBulkActions
 * @description Actions groupées pour les produits sélectionnés
 * @location frontend/src/components/admin/ProductsBulkActions.jsx
 */

import { motion } from 'framer-motion';

const ProductsBulkActions = ({
  selectedCount,
  deleting,
  onClearSelection,
  onBulkDelete
}) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
    >
      <span className="text-blue-700 font-medium">
        {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="flex gap-2">
        <button 
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors"
        >
          Désélectionner
        </button>
        <button 
          onClick={onBulkDelete}
          disabled={deleting}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {deleting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Suppression...
            </>
          ) : (
            'Supprimer'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductsBulkActions;
