/**
 * Layout Admin
 * @description Sidebar back-office (236px, fond ink-900) + zone de contenu
 * @see design_handoff_jana_refonte/JanaAdminSidebar.dc.html
 *
 * La barre superieure (recherche + actions contextuelles) n'est pas rendue ici :
 * chaque ecran varie ses actions, donc elle est portee par le composant partage
 * AdminTopBar, utilise directement par les pages.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin', exact: true },
  { name: 'Commandes', href: '/admin/commandes', statKey: 'commandes' },
  { name: 'Produits', href: '/admin/produits', statKey: 'produits' },
  { name: 'Catégories', href: '/admin/categories', statKey: 'categories' },
  { name: 'Codes promo', href: '/admin/promo' },
  { name: 'Clients', href: '/admin/clients', statKey: 'clients' },
  { name: 'Paramètres', href: '/admin/parametres' },
];

const SidebarContent = ({ user, counts, isActive, onNavigate, onLogout }) => (
  <div className="w-[236px] h-full min-h-full flex flex-col bg-ink-900 px-3.5 py-[18px] flex-shrink-0">
    <Link
      to="/admin"
      onClick={onNavigate}
      className="flex items-center gap-2.5 pb-5 mb-4 border-b border-ink-600 px-1.5"
    >
      <div className="w-[30px] h-[30px] rounded-6 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[15px] flex-shrink-0">
        J
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display font-extrabold text-[15px] text-white tracking-tight">JANA</span>
        <span className="text-[9px] tracking-[0.2em] text-mist-4 mt-[3px]">BACK-OFFICE</span>
      </div>
    </Link>

    <div className="text-[10.5px] tracking-[0.14em] text-[#4E6B5C] px-2 pb-2">PILOTAGE</div>

    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        const count = item.statKey ? counts[item.statKey] : null;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-between px-3 py-2.5 rounded-6 text-[13.5px] transition-colors ${
              active ? 'bg-green-700 text-white font-semibold' : 'text-mist font-normal hover:bg-white/5'
            }`}
          >
            <span>{item.name}</span>
            {count != null && (
              <span className={`font-mono text-[11px] ${active ? 'text-accent-pill' : 'text-[#5E7A6C]'}`}>
                {count.toLocaleString('fr-FR')}
              </span>
            )}
          </Link>
        );
      })}
    </nav>

    <Link
      to="/admin/profil"
      onClick={onNavigate}
      className="mt-auto pt-4 border-t border-ink-600 flex items-center gap-2.5 group"
    >
      <div className="w-8 h-8 rounded-full bg-ink-600 text-mist flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
        {(user?.prenom?.[0] ?? '')}{(user?.nom?.[0] ?? '')}
      </div>
      <div className="flex-1 min-w-0 leading-tight">
        <div className="text-[13px] text-white font-semibold truncate group-hover:underline">{user?.prenom} {user?.nom}</div>
        <div className="text-[11.5px] text-mist-4">Administrateur</div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLogout(); }}
        title="Déconnexion"
        className="text-mist-4 hover:text-white transition-colors flex-shrink-0"
      >
        <LogOut className="w-[14px] h-[14px]" />
      </button>
    </Link>
  </div>
);

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      adminService.getOrderStats(),
      productService.getAll({ limit: 1 }),
      categoryService.getAll({ includeInactive: true }),
      adminService.getClients({ limit: 1 }),
    ]).then(([ordersRes, productsRes, categoriesRes, clientsRes]) => {
      if (!mounted) return;
      setCounts({
        commandes: ordersRes.status === 'fulfilled' ? ordersRes.value?.parStatut?.enAttente ?? null : null,
        produits: productsRes.status === 'fulfilled' ? productsRes.value?.pagination?.total ?? null : null,
        categories: categoriesRes.status === 'fulfilled' ? categoriesRes.value?.count ?? null : null,
        clients: clientsRes.status === 'fulfilled' ? clientsRes.value?.pagination?.total ?? null : null,
      });
    });
    return () => { mounted = false; };
  }, []);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 flex">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <SidebarContent user={user} counts={counts} isActive={isActive} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-overlay-desktop" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <SidebarContent
              user={user}
              counts={counts}
              isActive={isActive}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 -right-11 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 lg:ml-[236px] flex flex-col">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border-b border-sand-200 text-ink-900 text-[13.5px] font-semibold"
        >
          <Menu className="w-4 h-4" /> Menu
        </button>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
