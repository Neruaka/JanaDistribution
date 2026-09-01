/**
 * Style des pastilles de statut commande, cote admin
 * @description Reprend la convention etablie par OrderHistoryPage (client) : seuls les
 * statuts qui ont une couleur semantique dediee sont explicites, le reste retombe sur
 * neutral-status. Evite la divergence constatee entre OrdersTable/OrderContextMenu/
 * OrderDetailModal (chacun avait sa propre liste partielle, notamment sans REMBOURSE).
 */

export const ADMIN_STATUT_STYLE = {
  EN_ATTENTE: 'bg-warning-bg text-warning-text',
  LIVREE: 'bg-success-bg text-success-text',
  ANNULEE: 'bg-danger-bg text-danger-text',
  REMBOURSE: 'bg-danger-bg text-danger-text',
  PARTIELLEMENT_REMBOURSE: 'bg-danger-bg text-danger-text'
};

export const getAdminStatutStyle = (statut) => ADMIN_STATUT_STYLE[statut] || 'bg-neutral-status-bg text-neutral-status-text';
