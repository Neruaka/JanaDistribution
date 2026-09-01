/**
 * Dashboard Admin
 * @description Ecran A1 — Vue d'ensemble de l'activite
 * @see design_handoff_jana_refonte/README.md (A1 — Dashboard)
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import adminService from '../../services/adminService';
import { getStatutInfo } from '../../services/orderService';
import { getAdminStatutStyle } from '../../utils/adminStatut';
import { getImageUrl } from '../../utils/imageUtils';
import { AdminTopBar } from '../../components/admin';
import toast from 'react-hot-toast';

const PERIODS = [
  { label: '7 derniers jours', days: 7 },
  { label: '30 derniers jours', days: 30 },
  { label: '3 derniers mois', days: 90 },
  { label: 'Cette année', days: 365 }
];

const CHART_COLORS = ['#1E7A46', '#4E9E6E', '#88BFA0', '#B9D9C6', '#DCEAE1'];

const formatMoney = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

const formatDateLong = (date, withYear) =>
  date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: withYear ? 'numeric' : undefined });

const formatDateShort = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR');

const KPICard = ({ label, value, delta }) => (
  <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
    <div className="text-[12.5px] text-graphite-500">{label}</div>
    <div className="font-mono text-[29px] font-semibold text-ink-900 mt-2 tracking-tight">{value}</div>
    {delta != null && (
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`text-[12px] font-semibold px-2 py-[3px] rounded-4 ${delta >= 0 ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
          {delta >= 0 ? '+' : ''}{delta}%
        </span>
        <span className="text-[12px] text-graphite-300">vs période précédente</span>
      </div>
    )}
  </div>
);

const AdminDashboard = () => {
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const { dateDebut, dateFin, dateDebutObj, dateFinObj } = useMemo(() => {
    const fin = new Date();
    const debut = new Date(fin.getTime() - periodDays * 24 * 60 * 60 * 1000);
    return { dateDebut: debut.toISOString(), dateFin: fin.toISOString(), dateDebutObj: debut, dateFinObj: fin };
  }, [periodDays]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const groupBy = periodDays <= 30 ? 'day' : 'week';
    Promise.all([
      adminService.getDashboardStats(dateDebut, dateFin),
      adminService.getComparison(dateDebut, dateFin),
      adminService.getEvolution(dateDebut, dateFin, groupBy),
      adminService.getTopCategories(dateDebut, dateFin, 5),
      adminService.getRecentOrders(6),
      adminService.getLowStockProducts(7)
    ])
      .then(([s, c, evo, cats, orders, lowStock]) => {
        if (!mounted) return;
        setStats(s);
        setComparison(c);
        setEvolution(evo?.evolution || []);
        setTopCategories(cats || []);
        setRecentOrders(orders || []);
        setLowStockProducts(lowStock || []);
      })
      .catch((error) => {
        console.error('Erreur chargement dashboard:', error);
        toast.error('Erreur lors du chargement des statistiques');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [dateDebut, dateFin, periodDays]);

  // Zero-fill jour par jour pour la période courte (vue mockup = 30 barres)
  const bars = useMemo(() => {
    if (periodDays > 30) return evolution.map((e) => ({ date: e.periode, ca: e.chiffreAffaires }));
    const byDate = new Map(evolution.map((e) => [e.periode, e.chiffreAffaires]));
    const days = [];
    for (let d = new Date(dateDebutObj); d <= dateFinObj; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, ca: byDate.get(key) || 0 });
    }
    return days;
  }, [evolution, periodDays, dateDebutObj, dateFinObj]);

  const maxBar = Math.max(1, ...bars.map((b) => b.ca));
  const totalPeriode = bars.reduce((sum, b) => sum + b.ca, 0);
  const axisIndexes = bars.length > 1
    ? [0, Math.floor((bars.length - 1) / 3), Math.floor((2 * (bars.length - 1)) / 3), bars.length - 1]
    : [0];

  const banniere = stats ? [
    { label: 'À confirmer', value: stats.commandes?.parStatut?.enAttente ?? 0, warn: true },
    { label: 'À préparer', value: stats.commandes?.parStatut?.confirmees ?? 0 },
    { label: 'À expédier', value: stats.commandes?.parStatut?.enPreparation ?? 0 },
    { label: 'Stock bas', value: stats.produits?.stockFaible ?? 0, warn: true }
  ] : [];

  return (
    <>
      <AdminTopBar>
        <div className="relative">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="appearance-none h-[38px] border border-sand-250 rounded-6 pl-3.5 pr-8 text-[13.5px] text-graphite-900 bg-white cursor-pointer focus:outline-none focus:border-ink-900"
          >
            {PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-graphite-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <a
          href="/" target="_blank" rel="noopener noreferrer"
          className="h-[38px] flex items-center gap-1.5 border border-sand-250 rounded-6 px-3.5 text-[13.5px] text-graphite-900 hover:border-sand-300 transition-colors"
        >
          Voir le site <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <Link
          to="/admin/produits/nouveau"
          className="h-[38px] flex items-center bg-green-700 hover:bg-green-800 text-white rounded-6 px-4 text-[13.5px] font-semibold transition-colors"
        >
          + Nouveau produit
        </Link>
      </AdminTopBar>

      <div className="p-[26px] flex flex-col gap-4">
        <div>
          <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900">Vue d'ensemble</h2>
          <p className="text-[13.5px] text-graphite-500 mt-[3px]">
            Du {formatDateLong(dateDebutObj)} au {formatDateLong(dateFinObj, true)} · comparé aux {periodDays} jours précédents
          </p>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
          </div>
        ) : (
        <>
        <div className="grid grid-cols-4 gap-3.5">
          <KPICard label="Chiffre d'affaires HT" value={formatMoney(stats?.chiffreAffaires?.total)} delta={comparison?.variation?.chiffreAffaires} />
          <KPICard label="Commandes" value={stats?.commandes?.total ?? 0} delta={comparison?.variation?.commandes} />
          <KPICard label="Panier moyen HT" value={formatMoney(stats?.panierMoyen?.total)} delta={comparison?.variation?.panierMoyen} />
          <KPICard label="Clients" value={stats?.clients?.total ?? 0} delta={comparison?.variation?.clients} />
        </div>

        <div className="bg-white border border-sand-200 rounded-8 px-[18px] py-4 flex items-center gap-[26px]">
          <div className="font-display text-[15px] font-bold text-ink-900 flex-shrink-0">À traiter aujourd'hui</div>
          {banniere.map((it, i) => (
            <div key={it.label} className={i > 0 ? 'border-l border-sand-300 pl-5' : ''}>
              <div className={`font-mono text-[20px] font-semibold ${it.warn && it.value > 0 ? 'text-warning-text' : 'text-ink-900'}`}>{it.value}</div>
              <div className="text-[13px] text-graphite-700">{it.label}</div>
            </div>
          ))}
          <Link
            to="/admin/commandes?statut=EN_ATTENTE"
            className="ml-auto flex-shrink-0 bg-ink-900 hover:bg-ink-800 text-white text-[13px] font-semibold h-[38px] px-4 rounded-6 flex items-center transition-colors"
          >
            Ouvrir la file de traitement
          </Link>
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 p-[18px] flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-[16px] font-bold text-ink-900">Évolution du chiffre d'affaires</h3>
                <p className="text-[12.5px] text-graphite-500">CA HT par jour sur la période</p>
              </div>
              <div className="font-mono text-[22px] font-semibold text-ink-900">{formatMoney(totalPeriode)}</div>
            </div>
            <div className="flex items-end gap-1.5 h-[210px]">
              {bars.map((b, i) => (
                <div
                  key={b.date}
                  title={`${b.date} · ${formatMoney(b.ca)}`}
                  className={`flex-1 rounded-t-[2px] ${i === bars.length - 1 ? 'bg-bar-current' : 'bg-bar-default'}`}
                  style={{ height: `${Math.max(2, (b.ca / maxBar) * 100)}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 font-mono text-[11px] text-graphite-400">
              {axisIndexes.map((idx) => (
                <span key={idx}>{bars[idx] ? new Date(bars[idx].date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <h3 className="font-display text-[16px] font-bold text-ink-900">Top catégories</h3>
            <p className="text-[12.5px] text-graphite-500 mb-4">Répartition du CA</p>
            {topCategories.length > 0 ? (
              <>
                <div className="h-3 rounded-6 overflow-hidden flex mb-4">
                  {topCategories.map((cat, i) => (
                    <div key={cat.id} style={{ width: `${cat.pourcentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  ))}
                </div>
                <div className="flex flex-col">
                  {topCategories.map((cat, i) => (
                    <div key={cat.id} className="flex items-center justify-between py-2 border-b border-sand-150 last:border-b-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[13.5px] text-ink-900 truncate">{cat.nom}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono text-[13px] text-ink-900">{formatMoney(cat.chiffreAffaires)}</span>
                        <span className="font-mono text-[12px] text-graphite-300 w-9 text-right">{cat.pourcentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-[13px] text-graphite-400">Aucune vente sur cette période</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1.55fr_1fr] gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 flex flex-col">
            <div className="flex items-center justify-between px-[18px] pt-[18px] pb-3.5">
              <h3 className="font-display text-[16px] font-bold text-ink-900">Dernières commandes</h3>
              <Link to="/admin/commandes" className="text-[13px] text-green-700 hover:text-green-800 font-medium">Tout voir →</Link>
            </div>
            <div className="flex flex-col">
              {recentOrders.length > 0 ? recentOrders.map((o) => {
                const statutInfo = getStatutInfo(o.statut);
                return (
                  <Link
                    key={o.id}
                    to={`/admin/commandes/${o.id}`}
                    className="grid items-center gap-3 px-[18px] py-2.5 border-t border-sand-150 hover:bg-sand-50 transition-colors"
                    style={{ gridTemplateColumns: '170px minmax(0,1fr) 62px 92px 104px' }}
                  >
                    <span className="font-mono text-[12.5px] text-ink-900">{o.numeroCommande}</span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-ink-900 truncate">{o.client?.prenom} {o.client?.nom}</div>
                      <div className="text-[12px] text-graphite-300 truncate">{o.client?.email}</div>
                    </div>
                    <span className="text-[12.5px] text-graphite-600">{formatDateShort(o.dateCommande)}</span>
                    <span className="font-mono text-[13.5px] text-ink-900 text-right">{formatMoney(o.totalTtc)}</span>
                    <span className={`justify-self-end text-[12px] font-semibold px-2 py-[3px] rounded-4 ${getAdminStatutStyle(o.statut)}`}>{statutInfo.label}</span>
                  </Link>
                );
              }) : (
                <div className="p-8 text-center text-[13px] text-graphite-400">Aucune commande récente</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 flex flex-col">
            <div className="flex items-center justify-between px-[18px] pt-[18px] pb-3.5">
              <h3 className="font-display text-[16px] font-bold text-ink-900">Stock sous le seuil</h3>
              {lowStockProducts.length > 0 && (
                <span className="bg-warning-bg text-warning-text text-[12px] font-semibold px-2 py-[3px] rounded-4">{lowStockProducts.length}</span>
              )}
            </div>
            <div className="flex flex-col">
              {lowStockProducts.length > 0 ? lowStockProducts.map((p) => {
                const img = getImageUrl(p.imageUrl);
                return (
                  <Link
                    key={p.id}
                    to={`/admin/produits/${p.id}/modifier`}
                    className="flex items-center gap-3 px-[18px] py-2.5 border-t border-sand-150 hover:bg-sand-50 transition-colors"
                  >
                    {p.imageUrl ? (
                      <img src={img} alt={p.nom} className="w-[34px] h-[34px] rounded-5 object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-[34px] h-[34px] rounded-5 placeholder-stripe flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium text-ink-900 truncate">{p.nom}</div>
                      <div className="font-mono text-[11.5px] text-graphite-300">{p.reference}</div>
                    </div>
                    <span className={`font-mono text-[13px] font-semibold ${p.enRupture ? 'text-danger-text' : 'text-warning-text'}`}>
                      {p.stock}/{p.seuilAlerte}
                    </span>
                  </Link>
                );
              }) : (
                <div className="p-8 text-center text-[13px] text-graphite-400">Tous les stocks sont au-dessus du seuil</div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
