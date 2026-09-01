/**
 * Page Admin Commandes
 * @description Ecran A2 — liste des commandes
 * @see design_handoff_jana_refonte/README.md (A2 — Commandes)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import { getStatutInfo } from '../../services/orderService';
import { getAdminStatutStyle } from '../../utils/adminStatut';
import { AdminTopBar } from '../../components/admin';
import Pagination from '../../components/Pagination';

const STATUT_RAIL = [
  { key: 'EN_ATTENTE', label: 'En attente', countKey: 'enAttente', color: 'text-warning-text' },
  { key: 'CONFIRMEE', label: 'Confirmées', countKey: 'confirmees', color: 'text-ink-900' },
  { key: 'EN_PREPARATION', label: 'En préparation', countKey: 'enPreparation', color: 'text-ink-900' },
  { key: 'EXPEDIEE', label: 'Expédiées', countKey: 'expediees', color: 'text-ink-900' },
  { key: 'LIVREE', label: 'Livrées', countKey: 'livrees', color: 'text-success-text' },
  { key: 'ANNULEE', label: 'Annulées', countKey: 'annulees', color: 'text-danger-text' }
];

const NEXT_STATUT = {
  EN_ATTENTE: 'CONFIRMEE',
  CONFIRMEE: 'EN_PREPARATION',
  EN_PREPARATION: 'EXPEDIEE',
  EXPEDIEE: 'LIVREE'
};

const NEXT_ACTION_LABEL = {
  EN_ATTENTE: 'Confirmer',
  CONFIRMEE: 'Préparer',
  EN_PREPARATION: 'Expédier',
  EXPEDIEE: 'Marquer livrée'
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const AdminOrdersList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statut, setStatut] = useState(searchParams.get('statut') || '');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const statsLoadedRef = useRef(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getOrderStats();
      if (response) setStats(response);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, []);

  const loadOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getOrders({
        page,
        limit: pagination.limit,
        search: search || undefined,
        statut: statut || undefined,
        orderBy: 'createdAt',
        orderDir: 'DESC'
      });
      setOrders(response.data || []);
      setPagination((prev) => ({
        ...prev,
        page,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statut, pagination.limit]);

  useEffect(() => {
    if (!statsLoadedRef.current) {
      loadStats();
      statsLoadedRef.current = true;
    }
  }, [loadStats]);

  useEffect(() => { loadOrders(1); }, [statut]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => loadOrders(1), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) navigate(`/admin/commandes/${orderId}`, { replace: true });
  }, [searchParams, navigate]);

  const handleStatutClick = (key) => {
    const next = statut === key ? '' : key;
    setStatut(next);
    setSearchParams(next ? { statut: next } : {});
  };

  const handleAdvance = async (order) => {
    const next = NEXT_STATUT[order.statut];
    if (!next) return;
    try {
      setUpdatingStatus(order.id);
      await adminService.updateOrderStatus(order.id, next);
      toast.success(`Commande passée en "${getStatutInfo(next).label}"`);
      loadOrders(pagination.page);
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const response = await adminService.getOrders({ limit: 9999, page: 1, search: search || undefined, statut: statut || undefined, orderBy: 'createdAt', orderDir: 'DESC' });
      const rows = response.data || [];
      const headers = ['N° commande', 'Date', 'Client nom', 'Client email', 'Statut', 'Total TTC', 'Mode paiement', 'Nb articles'];
      const escape = (v) => {
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [
        headers.join(','),
        ...rows.map((o) => [
          escape(o.numeroCommande),
          escape(o.dateCommande ? new Date(o.dateCommande).toLocaleDateString('fr-FR') : ''),
          escape(o.client ? `${o.client.prenom || ''} ${o.client.nom || ''}`.trim() : ''),
          escape(o.client?.email || ''),
          escape(o.statut || ''),
          escape(o.totalTtc != null ? Number(o.totalTtc).toFixed(2) : ''),
          escape(o.modePaiement || ''),
          escape(o.nbArticles || '')
        ].join(','))
      ];
      const csv = '﻿' + lines.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} commande(s) exportée(s)`);
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <>
      <AdminTopBar
        search={
          <div className="flex-1 max-w-[420px] h-[38px] flex items-center gap-2 border border-sand-250 rounded-6 px-3.5">
            <Search className="w-3.5 h-3.5 text-graphite-300 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Numéro, client, email, référence…"
              className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-ink-900 placeholder-graphite-200"
            />
          </div>
        }
      >
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exportLoading || loading}
          className="h-[38px] flex items-center gap-1.5 border border-sand-250 rounded-6 px-3.5 text-[13.5px] text-graphite-900 hover:border-sand-300 transition-colors disabled:opacity-50"
        >
          {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Exporter CSV
        </button>
      </AdminTopBar>

      <div className="p-[26px] flex flex-col gap-3.5">
        <div>
          <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Commandes</h2>
          <p className="text-[13.5px] text-graphite-500 mt-[3px]">
            Gérez les commandes clients
            {pagination.total > 0 && ` · ${pagination.total} commande${pagination.total > 1 ? 's' : ''}`}
            {stats?.parStatut?.enAttente > 0 && ` · ${stats.parStatut.enAttente} en attente de confirmation`}
          </p>
        </div>

        <div className="bg-white border border-sand-200 rounded-8 flex overflow-hidden">
          {STATUT_RAIL.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => handleStatutClick(s.key)}
              className={`flex-1 text-left px-[18px] py-3.5 ${i > 0 ? 'border-l border-sand-150' : ''} ${statut === s.key ? 'bg-[#FDFBF5]' : 'hover:bg-sand-50'} transition-colors`}
            >
              <div className="text-[12.5px] text-graphite-500">{s.label}</div>
              <div className={`font-mono text-[22px] font-semibold mt-0.5 ${s.color}`}>{stats?.parStatut?.[s.countKey] ?? 0}</div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-sand-200 rounded-8 overflow-hidden">
          <div
            className="grid gap-3 px-[18px] py-2.5 bg-sand-100 border-b border-sand-200 text-[11.5px] tracking-wide text-graphite-400"
            style={{ gridTemplateColumns: '180px 1fr 130px 80px 120px 140px 90px' }}
          >
            <span>COMMANDE</span>
            <span>CLIENT</span>
            <span>DATE</span>
            <span className="text-center">ART.</span>
            <span className="text-right">TOTAL TTC</span>
            <span className="text-center">STATUT</span>
            <span className="text-right">ACTION</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-green-700 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-[13.5px] text-graphite-400">Aucune commande trouvée</div>
          ) : (
            orders.map((order) => {
              const statutInfo = getStatutInfo(order.statut);
              const next = NEXT_STATUT[order.statut];
              return (
                <div
                  key={order.id}
                  className={`grid gap-3 items-center px-[18px] py-3.5 border-b border-sand-150 last:border-b-0 hover:bg-sand-50 transition-colors cursor-pointer ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                  style={{ gridTemplateColumns: '180px 1fr 130px 80px 120px 140px 90px' }}
                  onClick={() => navigate(`/admin/commandes/${order.id}`)}
                >
                  <span className="font-mono text-[12.5px] text-ink-900">{order.numeroCommande}</span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-ink-900 truncate">{order.client?.prenom} {order.client?.nom}</div>
                    <div className="text-[12px] text-graphite-300 truncate">{order.client?.email}</div>
                  </div>
                  <span className="text-[12.5px] text-graphite-600">{formatDate(order.dateCommande)}</span>
                  <span className="font-mono text-[13px] text-graphite-600 text-center">{order.nbArticles || 0}</span>
                  <span className="font-mono text-[13.5px] text-ink-900 text-right">{formatMoney(order.totalTtc)}</span>
                  <span className="flex justify-center">
                    <span className={`text-[12px] font-semibold px-2 py-[3px] rounded-4 ${getAdminStatutStyle(order.statut)}`}>{statutInfo.label}</span>
                  </span>
                  <span className="text-right">
                    {next && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAdvance(order); }}
                        disabled={updatingStatus === order.id}
                        className="text-[12.5px] font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
                      >
                        {NEXT_ACTION_LABEL[order.statut]}
                      </button>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => loadOrders(p)} />
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrdersList;
