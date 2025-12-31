/**
 * Composant OrdersStatsCards
 * @description Cartes de statistiques par statut de commande
 * @location frontend/src/components/admin/OrdersStatsCards.jsx
 * 
 * ✅ FIX: Mapping correct des clés API (camelCase) vers les statuts (UPPER_CASE)
 */

import { Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';

// Configuration des statuts avec icônes
// La clé correspond au statut en BDD (UPPER_CASE)
// apiKey correspond à ce que retourne l'API (camelCase)
const STATUTS_CONFIG = {
  EN_ATTENTE: { label: 'En attente', color: 'yellow', Icon: Clock, apiKey: 'enAttente' },
  CONFIRMEE: { label: 'Confirmée', color: 'blue', Icon: CheckCircle, apiKey: 'confirmees' },
  EN_PREPARATION: { label: 'En préparation', color: 'purple', Icon: Package, apiKey: 'enPreparation' },
  EXPEDIEE: { label: 'Expédiée', color: 'indigo', Icon: Truck, apiKey: 'expediees' },
  LIVREE: { label: 'Livrée', color: 'green', Icon: CheckCircle, apiKey: 'livrees' },
  ANNULEE: { label: 'Annulée', color: 'red', Icon: XCircle, apiKey: 'annulees' }
};

// Mapping couleurs -> classes Tailwind
const COLOR_CLASSES = {
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' }
};

const OrdersStatsCards = ({ stats, activeStatut, onStatutClick }) => {
  // Skeleton pendant le chargement
  if (!stats) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
        {Object.keys(STATUTS_CONFIG).map((key) => (
          <div
            key={key}
            className="p-3 rounded-xl border border-gray-100 bg-white animate-pulse"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-200 mx-auto mb-2" />
            <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1" />
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  // ✅ FIX: Fonction pour récupérer le count d'un statut
  // L'API retourne: { parStatut: { enAttente: 5, confirmees: 3, ... } }
  const getCount = (statutKey) => {
    const config = STATUTS_CONFIG[statutKey];
    
    // Essayer parStatut avec la clé API (camelCase)
    if (stats.parStatut && config.apiKey) {
      return stats.parStatut[config.apiKey] || 0;
    }
    
    // Fallback: essayer directement sur stats
    if (config.apiKey && stats[config.apiKey] !== undefined) {
      return stats[config.apiKey] || 0;
    }
    
    return 0;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
      {Object.entries(STATUTS_CONFIG).map(([key, config]) => {
        const { Icon } = config;
        const count = getCount(key);
        const isActive = activeStatut === key;
        const colors = COLOR_CLASSES[config.color];
        
        return (
          <button
            key={key}
            onClick={() => onStatutClick(key)}
            className={`p-3 rounded-xl border transition-all ${
              isActive
                ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${colors.bg}`}>
              <Icon className={`w-4 h-4 ${colors.text}`} />
            </div>
            <p className="text-lg font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-500 truncate">{config.label}</p>
          </button>
        );
      })}
    </div>
  );
};

export default OrdersStatsCards;