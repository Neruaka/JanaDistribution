/**
 * Composant OrderContextMenu
 * @description Menu contextuel pour les actions sur une commande
 * @location frontend/src/components/admin/OrderContextMenu.jsx
 */

import { motion } from 'framer-motion';
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle 
} from 'lucide-react';

// Configuration des statuts
const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: 'yellow', Icon: Clock },
  CONFIRMEE: { label: 'Confirmée', color: 'blue', Icon: CheckCircle },
  EN_PREPARATION: { label: 'En préparation', color: 'purple', Icon: Package },
  EXPEDIEE: { label: 'Expédiée', color: 'indigo', Icon: Truck },
  LIVREE: { label: 'Livrée', color: 'green', Icon: CheckCircle },
  ANNULEE: { label: 'Annulée', color: 'red', Icon: XCircle }
};

const OrderContextMenu = ({
  order,
  position,
  onClose,
  onViewDetail,
  onChangeStatus,
  onCancel
}) => {
  if (!order) return null;

  const canModify = order.statut !== 'ANNULEE' && order.statut !== 'LIVREE';

  return (
    <>
      {/* Overlay pour fermer */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        style={{
          position: 'fixed',
          top: position.top,
          right: position.right,
        }}
        className="w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
      >
        {/* Voir détail */}
        <button
          onClick={() => {
            onViewDetail(order);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" /> 
          Voir le détail
        </button>
        
        {/* Changement de statut */}
        {canModify && (
          <>
            <hr className="my-1" />
            <p className="px-4 py-1 text-xs text-gray-400 uppercase font-medium">
              Changer le statut
            </p>
            
            {Object.entries(STATUTS).map(([key, config]) => {
              // Ne pas afficher le statut actuel ou ANNULEE dans la liste
              if (key === order.statut || key === 'ANNULEE') return null;
              
              const { Icon } = config;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onChangeStatus(order, key);
                    onClose();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" /> 
                  {config.label}
                </button>
              );
            })}
          </>
        )}
        
        {/* Annuler */}
        {canModify && (
          <>
            <hr className="my-1" />
            <button
              onClick={() => {
                onCancel(order);
                onClose();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> 
              Annuler la commande
            </button>
          </>
        )}
      </motion.div>
    </>
  );
};

export default OrderContextMenu;
