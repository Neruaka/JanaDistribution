/**
 * AccountSidebar — nav de compte commune (Mes commandes, Détail, Mon compte)
 * @see design_handoff_jana_refonte/README.md ("08/09/10")
 */

import { Link, useLocation } from 'react-router-dom';

const ITEMS = [
  { key: 'commandes', label: 'Mes commandes', to: '/mes-commandes' },
  { key: 'listes', label: 'Mes listes récurrentes', to: null },
  { key: 'factures', label: 'Mes factures', to: '/mes-factures' },
  { key: 'adresses', label: 'Mes adresses', to: '/mon-compte?tab=adresses' },
  { key: 'informations', label: 'Mes informations', to: '/mon-compte?tab=profil' },
  { key: 'securite', label: 'Sécurité', to: '/mon-compte?tab=securite' }
];

const AccountSidebar = ({ active }) => (
  <div className="flex flex-col gap-0.5 bg-white border border-sand-200 rounded-8 p-2 h-fit">
    {ITEMS.map((item) =>
      item.to ? (
        <Link
          key={item.key}
          to={item.to}
          className={`px-3.5 py-2.5 rounded-6 text-[13.5px] transition-colors ${
            active === item.key ? 'bg-ink-900 text-white font-semibold' : 'text-graphite-700 hover:bg-sand-50'
          }`}
        >
          {item.label}
        </Link>
      ) : (
        <span key={item.key} className="px-3.5 py-2.5 rounded-6 text-[13.5px] text-graphite-300 cursor-default">
          {item.label}
        </span>
      )
    )}
  </div>
);

export default AccountSidebar;
