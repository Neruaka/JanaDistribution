/**
 * AdminMobileTabBar — barre d'onglets admin fixe en bas (mobile)
 * @see design_handoff_jana_refonte/README.md (Patterns mobiles — barre d'onglets admin)
 */

import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings } from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Bord', icon: LayoutDashboard, href: '/admin', exact: true },
  { key: 'commandes', label: 'Commandes', icon: ShoppingCart, href: '/admin/commandes' },
  { key: 'produits', label: 'Produits', icon: Package, href: '/admin/produits' },
  { key: 'clients', label: 'Clients', icon: Users, href: '/admin/clients' },
  { key: 'reglages', label: 'Réglages', icon: Settings, href: '/admin/parametres' }
];

const AdminMobileTabBar = () => {
  const location = useLocation();
  const isActive = (tab) => (tab.exact ? location.pathname === tab.href : location.pathname.startsWith(tab.href));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink-900 flex items-stretch px-2 pt-[9px] pb-[14px]">
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <Link key={tab.key} to={tab.href} className="flex-1 flex flex-col items-center gap-1">
            <tab.icon className="w-5 h-5" style={{ color: active ? '#8FD8A9' : '#6B8779' }} />
            <span className="text-[10.5px]" style={{ color: active ? '#8FD8A9' : '#6B8779' }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminMobileTabBar;
