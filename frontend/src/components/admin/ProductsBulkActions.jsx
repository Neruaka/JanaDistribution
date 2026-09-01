/**
 * Composant ProductsBulkActions
 * @description Barre d'actions groupees, affichee quand une selection existe
 * @see design_handoff_jana_refonte/README.md (A4 — Produits)
 *
 * La maquette prevoit "Changer de rayon / Appliquer une remise / Desactiver".
 * "Appliquer une remise" n'a pas d'equivalent reel (pas de notion de remise en
 * masse cote backend) et n'a pas ete ajoutee pour ne pas fabriquer une action
 * qui ne ferait rien. "Changer de rayon" et "Desactiver" reutilisent l'endpoint
 * de mise a jour produit existant. "Supprimer" (deja reel avant la refonte) est
 * conservee au-dela de la maquette plutot que retiree.
 */

const ProductsBulkActions = ({
  selectedCount,
  categories,
  deleting,
  bulkUpdating,
  onClearSelection,
  onBulkDelete,
  onBulkChangeCategory,
  onBulkDeactivate
}) => {
  if (selectedCount === 0) return null;
  const busy = deleting || bulkUpdating;

  return (
    <div className="bg-success-bg border border-success-border rounded-8 px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-[13.5px] font-semibold text-success-text">
        {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => { if (e.target.value) { onBulkChangeCategory(e.target.value); e.target.value = ''; } }}
          className="h-[34px] border border-success-border rounded-6 px-2.5 text-[12.5px] text-success-text bg-white disabled:opacity-50"
        >
          <option value="">Changer de rayon…</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nom}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onBulkDeactivate}
          disabled={busy}
          className="h-[34px] px-3 text-[12.5px] font-semibold text-success-text border border-success-border rounded-6 bg-white hover:bg-success-bg disabled:opacity-50 transition-colors"
        >
          Désactiver
        </button>
        <button
          type="button"
          onClick={onBulkDelete}
          disabled={busy}
          className="h-[34px] px-3 text-[12.5px] font-semibold text-white bg-danger-text rounded-6 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {deleting ? 'Suppression…' : 'Supprimer'}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={busy}
          className="h-[34px] px-3 text-[12.5px] font-semibold text-success-text hover:underline disabled:opacity-50"
        >
          Désélectionner
        </button>
      </div>
    </div>
  );
};

export default ProductsBulkActions;
