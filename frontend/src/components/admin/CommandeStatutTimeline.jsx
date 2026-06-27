/**
 * Composant CommandeStatutTimeline
 * @description Affiche l'historique des transitions de statut d'une commande (timeline verticale).
 */

import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const STATUT_COLORS = {
  EN_ATTENTE:             'bg-yellow-400',
  CONFIRMEE:              'bg-blue-500',
  EN_PREPARATION:         'bg-purple-500',
  EXPEDIEE:               'bg-indigo-500',
  LIVREE:                 'bg-green-500',
  ANNULEE:                'bg-red-500',
  REMBOURSE:              'bg-gray-400',
  PARTIELLEMENT_REMBOURSE:'bg-orange-400'
};

const STATUT_LABELS = {
  EN_ATTENTE:             'En attente',
  CONFIRMEE:              'Confirmée',
  EN_PREPARATION:         'En préparation',
  EXPEDIEE:               'Expédiée',
  LIVREE:                 'Livrée',
  ANNULEE:                'Annulée',
  REMBOURSE:              'Remboursée',
  PARTIELLEMENT_REMBOURSE:'Partiellement remboursée'
};

const formatRelative = (isoDate) => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
};

const CommandeStatutTimeline = ({ commandeId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!commandeId) return;
    setLoading(true);
    adminService.getOrderHistory(commandeId)
      .then(data => setHistory(data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [commandeId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">Aucun historique disponible.</p>
    );
  }

  return (
    <ol className="relative border-l-2 border-gray-200 ml-1.5 space-y-4">
      {history.map((entry, idx) => {
        const dotColor = STATUT_COLORS[entry.nouveau_statut] || 'bg-gray-400';
        return (
          <li key={entry.id || idx} className="pl-5 relative">
            <span className={`absolute -left-[9px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor}`} />
            <p className="text-sm text-gray-700 leading-tight">
              {entry.ancien_statut ? (
                <>
                  <span className="font-medium">{STATUT_LABELS[entry.ancien_statut] || entry.ancien_statut}</span>
                  {' → '}
                  <span className="font-medium">{STATUT_LABELS[entry.nouveau_statut] || entry.nouveau_statut}</span>
                </>
              ) : (
                <span className="font-medium">{STATUT_LABELS[entry.nouveau_statut] || entry.nouveau_statut}</span>
              )}
              <span className="ml-2 text-xs text-gray-400">{formatRelative(entry.created_at)}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
};

export default CommandeStatutTimeline;
