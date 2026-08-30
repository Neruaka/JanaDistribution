/**
 * Page Mes commandes
 * @description Écran 08 — Mes commandes
 * @see design_handoff_jana_refonte/README.md
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserOrders, getOrderById, getStatutInfo, STATUTS_COMMANDE } from '../services/orderService';
import { useCart } from '../contexts/CartContext';
import AccountSidebar from '../components/mon-compte/AccountSidebar';
import Pagination from '../components/Pagination';
import { formatAmount } from '../utils/priceUtils';

const PERIODES = [
  { value: '3', label: '3 derniers mois' },
  { value: '6', label: '6 derniers mois' },
  { value: '12', label: '12 derniers mois' },
  { value: '', label: 'Toutes les commandes' }
];

const STATUT_STYLE = {
  EN_ATTENTE: 'bg-warning-bg text-warning-text',
  ANNULEE: 'bg-danger-bg text-danger-text',
  LIVREE: 'bg-success-bg text-success-text'
};

const formatDate = (dateString) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));

const OrderHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 0 });

  const statut = searchParams.get('statut') || '';
  const periode = searchParams.get('periode') || '';
  const page = parseInt(searchParams.get('page')) || 1;

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value); else next.delete(key);
    });
    if (!('page' in updates)) next.delete('page');
    setSearchParams(next);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let dateDebut;
      if (periode) {
        const d = new Date();
        d.setMonth(d.getMonth() - parseInt(periode));
        dateDebut = d.toISOString();
      }
      const result = await getUserOrders({ page, limit: pagination.limit, statut: statut || undefined, dateDebut });
      if (result.success) {
        setOrders(result.data || []);
        setPagination((prev) => ({ ...prev, page, total: result.pagination?.total || 0, totalPages: result.pagination?.totalPages || 0 }));
      } else {
        setError(result.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statut, periode, pagination.limit]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleReorder = async (orderId) => {
    setReorderingId(orderId);
    try {
      const detail = await getOrderById(orderId);
      const lignes = detail?.data?.lignes || [];
      let added = 0;
      for (const ligne of lignes) {
        if (!ligne.produitId) continue;
        // eslint-disable-next-line no-await-in-loop
        const ok = await addItem(ligne.produitId, ligne.quantite, false);
        if (ok) added += 1;
      }
      if (added > 0) {
        const skipped = lignes.length - added;
        toast.success(
          `${added} référence${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} au panier` +
          (skipped > 0 ? ` (${skipped} indisponible${skipped > 1 ? 's' : ''})` : '')
        );
      } else {
        toast.error('Aucune référence n\'a pu être ajoutée au panier');
      }
    } finally {
      setReorderingId(null);
    }
  };

  const hasFilters = !!statut;
  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-sand-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[238px_1fr] gap-[22px] px-4 md:px-10 py-7">
        <AccountSidebar active="commandes" />

        <div className="flex flex-col gap-3.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[27px] font-extrabold tracking-tighter text-ink-900">Mes commandes</h1>
              <div className="text-[13.5px] text-graphite-500 mt-1">
                {pagination.total} commande{pagination.total > 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <select
                value={periode}
                onChange={(e) => updateParams({ periode: e.target.value })}
                className="border border-sand-250 bg-white rounded-6 h-[38px] px-3 text-[13.5px] text-graphite-900 focus:outline-none focus:border-ink-900"
              >
                {PERIODES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select
                value={statut}
                onChange={(e) => updateParams({ statut: e.target.value })}
                className="border border-sand-250 bg-white rounded-6 h-[38px] px-3 text-[13.5px] text-graphite-900 focus:outline-none focus:border-ink-900"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUTS_COMMANDE).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
              </select>
              <button type="button" disabled title="Bientôt disponible" className="bg-ink-900 text-white rounded-6 h-[38px] px-4 text-[13.5px] font-semibold opacity-40 cursor-not-allowed">
                Exporter
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-danger-bg border border-danger-border rounded-8 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger-text flex-shrink-0" />
              <p className="text-[13.5px] text-danger-text">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-sand-200 rounded-8 py-20 flex justify-center">
              <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-sand-200 rounded-8 py-16 text-center">
              <p className="text-[15px] font-semibold text-ink-900 mb-1">
                {hasFilters ? 'Aucune commande trouvée' : 'Aucune commande pour le moment'}
              </p>
              <p className="text-[13px] text-graphite-500 mb-5">
                {hasFilters ? 'Essayez de modifier vos filtres.' : 'Découvrez notre catalogue et passez votre première commande.'}
              </p>
              <Link to="/catalogue" className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-6 text-[13.5px] font-semibold transition-colors">
                <ShoppingBag className="w-4 h-4" /> Voir le catalogue
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-sand-200 rounded-8 overflow-hidden">
              <div
                className="hidden md:grid gap-3.5 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400"
                style={{ gridTemplateColumns: '190px 1fr 110px 90px 120px 250px' }}
              >
                <span>COMMANDE</span><span>CONTENU</span><span>DATE</span><span>ARTICLES</span>
                <span className="text-right">TOTAL TTC</span><span className="text-right">STATUT</span>
              </div>

              {orders.map((order) => {
                const statutInfo = getStatutInfo(order.statut);
                const badgeStyle = STATUT_STYLE[order.statut] || 'bg-neutral-status-bg text-neutral-status-text';
                const nbArticles = order.nbArticles ?? order.lignes?.length ?? 0;
                return (
                  <div
                    key={order.id}
                    className="grid gap-3.5 px-[18px] py-4 border-b border-[#F0EEE7] last:border-b-0 items-center"
                    style={{ gridTemplateColumns: '190px 1fr 110px 90px 120px 250px' }}
                  >
                    <span className="font-mono text-[13px] text-ink-900">{order.numeroCommande}</span>
                    <span className="text-[13.5px] text-graphite-700">{nbArticles} référence{nbArticles > 1 ? 's' : ''}</span>
                    <span className="text-[13px] text-graphite-600">{formatDate(order.dateCommande)}</span>
                    <span className="font-mono text-[13px] text-graphite-600">{nbArticles}</span>
                    <span className="font-mono text-[14px] text-ink-900 text-right">{formatAmount(order.totalTtc)}</span>
                    <div className="flex items-center justify-end gap-2.5 flex-wrap">
                      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-4 ${badgeStyle}`}>{statutInfo.label}</span>
                      <button
                        type="button"
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderingId === order.id}
                        className="text-[12.5px] font-semibold text-success-text bg-success-bg border border-success-border px-2.5 py-1.5 rounded-5 disabled:opacity-50"
                      >
                        {reorderingId === order.id ? '…' : 'Recommander'}
                      </button>
                      <Link to={`/mes-commandes/${order.id}`} className="text-[12.5px] text-graphite-600 border border-sand-250 px-2.5 py-1.5 rounded-5 hover:border-sand-300">
                        Détail
                      </Link>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-[18px] py-3.5">
                <span className="text-[13px] text-graphite-500">
                  Affichage de {rangeStart}–{rangeEnd} sur {pagination.total} commande{pagination.total > 1 ? 's' : ''}
                </span>
                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => updateParams({ page: String(p) })} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
