/**
 * CommandeStatutTimeline — journal des transitions de statut d'une commande
 * @see design_handoff_jana_refonte/README.md (A3 — Traitement, bloc "Journal")
 *
 * Purement presentationnel : AdminOrderDetail charge l'historique une seule fois
 * et le partage avec la barre d'avancement (timestamps par etape) et ce journal.
 */

import { Loader2 } from 'lucide-react';
import { getStatutInfo } from '../../services/orderService';

const formatDateTime = (isoDate) => new Date(isoDate).toLocaleDateString('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const CommandeStatutTimeline = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center py-3">
        <Loader2 className="w-4 h-4 text-graphite-300 animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-[13px] text-graphite-400">Aucun événement enregistré.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((entry, idx) => (
        <li key={entry.id || idx} className="flex items-baseline gap-3.5 text-[13px]">
          <span className="font-mono text-[12px] text-graphite-300 w-[110px] flex-shrink-0">{formatDateTime(entry.created_at)}</span>
          <span className="text-graphite-700">
            {entry.ancien_statut ? (
              <>
                <span className="font-medium text-ink-900">{getStatutInfo(entry.ancien_statut).label}</span>
                {' → '}
                <span className="font-medium text-ink-900">{getStatutInfo(entry.nouveau_statut).label}</span>
              </>
            ) : (
              <span className="font-medium text-ink-900">{getStatutInfo(entry.nouveau_statut).label}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default CommandeStatutTimeline;
