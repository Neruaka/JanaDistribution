/**
 * ProfilHeader — carte d'identité en haut de "Mon compte"
 * @see design_handoff_jana_refonte/README.md ("10 — Mon compte")
 */

import { useState, useEffect } from 'react';
import { getUserOrders } from '../../services/orderService';

const formatMemberSince = (dateStr) => {
  if (!dateStr) return null;
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(dateStr));
};

const ProfilHeader = ({ user }) => {
  const [orderCount, setOrderCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    getUserOrders({ limit: 1 }).then((res) => {
      if (mounted && res.success) setOrderCount(res.pagination?.total ?? 0);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const memberSince = formatMemberSince(user?.dateCreation);

  return (
    <div className="bg-white border border-sand-200 rounded-8 p-5 flex items-center gap-[18px] flex-wrap">
      <div className="w-14 h-14 rounded-full bg-success-bg border border-success-border flex items-center justify-center font-display font-bold text-[19px] text-success-text flex-shrink-0">
        {user?.prenom?.[0]}{user?.nom?.[0]}
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
  );
};

export default ProfilHeader;
