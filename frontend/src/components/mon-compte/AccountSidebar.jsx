/**
 * AccountSidebar — nav de compte commune (Mes commandes, Détail, Mon compte)
 * @see design_handoff_jana_refonte/README.md ("08/09/10")
 */

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ITEMS = [
  { key: 'commandes', label: 'Mes commandes', desc: 'Historique, suivi et factures', to: '/mes-commandes' },
  { key: 'listes', label: 'Mes listes récurrentes', desc: 'Bientôt disponible', to: null },
  { key: 'factures', label: 'Mes factures', desc: 'Devis et factures générés', to: '/mes-factures' },
  { key: 'adresses', label: 'Mes adresses', desc: 'Jusqu\'à 3 adresses de livraison', to: '/mon-compte?tab=adresses' },
  { key: 'informations', label: 'Mes informations', desc: 'Identité, contact, préférences', to: '/mon-compte?tab=profil' },
  { key: 'securite', label: 'Sécurité', desc: 'Mot de passe, RGPD, suppression', to: '/mon-compte?tab=securite' }
];

const AccountSidebar = ({ active }) => (
  <>
    {/* Menu de compte en liste, avec description (mobile, M11) */}
    <div className="md:hidden flex flex-col bg-white border border-sand-200 rounded-8 overflow-hidden">
      {ITEMS.map((item) =>
        item.to ? (
          <Link
            key={item.key}
            to={item.to}
            className={`flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[#F0EEE7] last:border-b-0 transition-colors ${active === item.key ? 'bg-sand-50' : ''}`}
          >
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-ink-900">{item.label}</div>
              <div className="text-[12px] text-graphite-500 mt-0.5">{item.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-graphite-300 flex-shrink-0" />
          </Link>
        ) : (
          <div key={item.key} className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[#F0EEE7] last:border-b-0 cursor-default">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-graphite-300">{item.label}</div>
              <div className="text-[12px] text-graphite-300 mt-0.5">{item.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-graphite-200 flex-shrink-0" />
          </div>
        )
      )}
    </div>

    {/* Sidebar desktop */}
    <div className="hidden md:flex flex-col gap-0.5 bg-white border border-sand-200 rounded-8 p-2 h-fit">
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
  </>
);

export default AccountSidebar;
