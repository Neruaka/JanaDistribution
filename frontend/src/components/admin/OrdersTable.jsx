/**
 * Composant OrdersTable
 * @description Tableau des commandes admin avec actions
 * @location frontend/src/components/admin/OrdersTable.jsx
 */

import { 
  ShoppingCart, 
  Eye, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  ArrowRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Configuration des statuts
const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: 'yellow', Icon: Clock, next: 'CONFIRMEE' },
  CONFIRMEE: { label: 'Confirmée', color: 'blue', Icon: CheckCircle, next: 'EN_PREPARATION' },
  EN_PREPARATION: { label: 'En préparation', color: 'purple', Icon: Package, next: 'EXPEDIEE' },
  EXPEDIEE: { label: 'Expédiée', color: 'indigo', Icon: Truck, next: 'LIVREE' },
  LIVREE: { label: 'Livrée', color: 'green', Icon: CheckCircle, next: null },
  ANNULEE: { label: 'Annulée', color: 'red', Icon: XCircle, next: null }
};

// ==========================================
// SOUS-COMPOSANTS
// ==========================================

const StatusBadge = ({ statut, size = 'md' }) => {
  const config = STATUTS[statut] || STATUTS.EN_ATTENTE;
  const { Icon } = config;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${colorClasses[config.color]}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
    <p className="text-gray-500">Aucune commande trouvée</p>
  </div>
);

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const OrdersTable = ({
  orders,
  loading,
  pagination,
  updatingStatus,
  onViewDetail,
  onChangeStatus,
  onOpenMenu,
  onPageChange
}) => {
  // Helpers
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <LoadingState />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Commande</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Articles</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr 
                key={order.id} 
                className={`hover:bg-gray-50 transition-colors ${updatingStatus === order.id ? 'opacity-50' : ''}`}
              >
                {/* Numéro */}
                <td className="py-3 px-4">
                  <p className="font-mono font-medium text-gray-800">{order.numeroCommande}</p>
                </td>
                
                {/* Client */}
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-800">
                    {order.client?.prenom} {order.client?.nom}
                  </p>
                  <p className="text-sm text-gray-500">{order.client?.email}</p>
                </td>
                
                {/* Date */}
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-600">{formatDate(order.dateCommande)}</p>
                </td>
                
                {/* Articles */}
                <td className="py-3 px-4 text-center">
                  <span className="font-medium text-gray-800">{order.nbArticles || 0}</span>
                </td>
                
                {/* Total */}
                <td className="py-3 px-4 text-right">
                  <p className="font-semibold text-gray-800">{formatMoney(order.totalTtc)}</p>
                </td>
                
                {/* Statut */}
                <td className="py-3 px-4 text-center">
                  <StatusBadge statut={order.statut} />
                </td>
                
                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Action rapide: passer au statut suivant */}
                    {STATUTS[order.statut]?.next && (
                      <button
                        onClick={() => onChangeStatus(order, STATUTS[order.statut].next)}
                        disabled={updatingStatus === order.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title={`Passer en "${STATUTS[STATUTS[order.statut].next].label}"`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Menu contextuel */}
                    <button
                      onClick={(e) => onOpenMenu(e, order.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Liste mobile */}
      <div className="lg:hidden divide-y divide-gray-100">
        {orders.map((order) => (
          <div key={order.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-mono font-medium text-gray-800">{order.numeroCommande}</p>
                <p className="text-sm text-gray-500">
                  {order.client?.prenom} {order.client?.nom}
                </p>
              </div>
              <StatusBadge statut={order.statut} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {formatDate(order.dateCommande)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{formatMoney(order.totalTtc)}</span>
                <button
                  onClick={() => onViewDetail(order)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Eye className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} commandes)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Numéros de page */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let page;
              if (pagination.totalPages <= 5) {
                page = i + 1;
              } else if (pagination.page <= 3) {
                page = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                page = pagination.totalPages - 4 + i;
              } else {
                page = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    page === pagination.page
                      ? 'bg-green-600 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Export du StatusBadge pour réutilisation
export { StatusBadge, STATUTS };
export default OrdersTable;
