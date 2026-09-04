/**
 * ProfilHeader — carte d'identité en haut de "Mon compte"
 * @see design_handoff_jana_refonte/README.md ("10 — Mon compte")
 */

import { useState, useEffect } from 'react';
import { getUserOrders } from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';

const formatMemberSince = (dateStr) => {
  if (!dateStr) return null;
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(dateStr));
};

const ProfilHeader = ({ user }) => {
  const [orderCount, setOrderCount] = useState(null);
  const [totalDepense, setTotalDepense] = useState(null);
  const [nbAdresses, setNbAdresses] = useState(0);

  useEffect(() => {
    let mounted = true;
    getUserOrders({ limit: 50 }).then((res) => {
      if (!mounted || !res.success) return;
      setOrderCount(res.pagination?.total ?? 0);
      const sum = (res.data || []).reduce((acc, o) => acc + (o.statut !== 'ANNULEE' ? Number(o.totalTtc) || 0 : 0), 0);
      setTotalDepense(sum);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const saved = sessionStorage.getItem(`addresses_${user.id}`);
    setNbAdresses(saved ? JSON.parse(saved).length : 0);
  }, [user?.id]);

  const memberSince = formatMemberSince(user?.dateCreation);
  const initiales = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`;

  return (
    <>
      {/* En-tête sombre + statistiques (mobile, M11) */}
      <div className="md:hidden bg-ink-900 rounded-8 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-full bg-green-700 flex items-center justify-center font-display font-bold text-[19px] text-white flex-shrink-0">
            {initiales}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[18px] font-bold tracking-tight text-white truncate">{user?.prenom} {user?.nom}</h1>
            <p className="text-[12.5px] text-mist-3 mt-0.5 truncate">
              {user?.email}{memberSince ? ` · depuis ${memberSince}` : ''}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-6 p-3" style={{ backgroundColor: '#152A20' }}>
            <div className="font-mono text-[18px] text-white">{orderCount ?? '—'}</div>
            <div className="text-[11px] text-mist-3 mt-0.5">Commande{orderCount > 1 ? 's' : ''}</div>
          </div>
          <div className="rounded-6 p-3" style={{ backgroundColor: '#152A20' }}>
            <div className="font-mono text-[18px] text-white truncate">{totalDepense !== null ? formatAmount(totalDepense) : '—'}</div>
            <div className="text-[11px] text-mist-3 mt-0.5">Dépensé</div>
          </div>
          <div className="rounded-6 p-3" style={{ backgroundColor: '#152A20' }}>
            <div className="font-mono text-[18px] text-white">{nbAdresses}</div>
            <div className="text-[11px] text-mist-3 mt-0.5">Adresse{nbAdresses > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* En-tête claire (desktop) */}
      <div className="hidden md:flex bg-white border border-sand-200 rounded-8 p-5 items-center gap-[18px] flex-wrap">
        <div className="w-14 h-14 rounded-full bg-success-bg border border-success-border flex items-center justify-center font-display font-bold text-[19px] text-success-text flex-shrink-0">
          {initiales}
        </div>
        <div className="flex-1 min-w-[180px]">
          <h1 className="font-display text-[20px] font-bold tracking-tight text-ink-900">{user?.prenom} {user?.nom}</h1>
          <p className="text-[13.5px] text-graphite-500 mt-0.5">
            {user?.email}{memberSince ? ` · client depuis ${memberSince}` : ''}
          </p>
        </div>
        {orderCount !== null && (
          <div className="flex gap-[22px] pl-[22px] border-l border-sand-300">
            <div>
              <div className="font-mono text-[20px] text-ink-900">{orderCount}</div>
              <div className="text-[12px] text-graphite-400">commande{orderCount > 1 ? 's' : ''}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilHeader;
