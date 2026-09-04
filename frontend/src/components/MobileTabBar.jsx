/**
 * MobileTabBar — barre d'onglets client fixe en bas (mobile)
 * @see design_handoff_jana_refonte/README.md (Patterns mobiles)
 *
 * La maquette utilise des carres 20px en guise d'icones, explicitement a
 * remplacer par des icones reelles (lucide-react) — pas une deviation.
 * "Recherche" ouvre une superposition plein ecran reutilisant SearchBar
 * (reel), "Panier" ouvre le tiroir panier deja existant plutot que de
 * dupliquer une page panier mobile separee.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Search, ShoppingCart, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import SearchBar from './SearchBar';

const MobileTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (prefix, exact = false) => (exact ? location.pathname === prefix : location.pathname.startsWith(prefix));

  const TABS = [
    { key: 'accueil', label: 'Accueil', icon: Home, active: isActive('/', true), onClick: () => navigate('/') },
    { key: 'rayons', label: 'Rayons', icon: LayoutGrid, active: isActive('/catalogue'), onClick: () => navigate('/catalogue') },
    { key: 'recherche', label: 'Recherche', icon: Search, active: searchOpen, onClick: () => setSearchOpen(true) },
    { key: 'panier', label: 'Panier', icon: ShoppingCart, active: false, onClick: openDrawer, badge: itemCount > 0 ? itemCount : null },
    {
      key: 'compte', label: 'Compte', icon: User,
      active: isActive('/mon-compte') || isActive('/login') || isActive('/register'),
      onClick: () => navigate(isAuthenticated ? '/mon-compte' : '/login')
    }
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand-200 flex items-stretch px-2 pt-[9px] pb-[14px]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={tab.onClick}
            className="flex-1 flex flex-col items-center gap-1 relative"
          >
            <span className="relative">
              <tab.icon className={`w-5 h-5 ${tab.active ? 'text-green-700' : 'text-graphite-200'}`} />
              {tab.badge != null && (
                <span className="absolute -top-1.5 -right-2 bg-green-700 text-white text-[9px] font-semibold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </span>
            <span className={`text-[10.5px] ${tab.active ? 'text-green-700 font-semibold' : 'text-graphite-200'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {searchOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-sand-200">
            <div className="flex-1">
              <SearchBar />
            </div>
            <button type="button" onClick={() => setSearchOpen(false)} className="p-2 text-ink-900 flex-shrink-0" aria-label="Fermer la recherche">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileTabBar;
