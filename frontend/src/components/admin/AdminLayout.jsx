/**
 * Layout Admin - LIGHT MODE ONLY
 * @description Structure commune pour toutes les pages admin
 * @location frontend/src/layouts/AdminLayout.jsx
 * 
 * ✅ Sidebar dark avec coins arrondis
 * ✅ Contenu toujours en light mode
 * ✅ Recherche globale fonctionnelle (⌘K)
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ExternalLink,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// ==========================================
// COMPOSANT RECHERCHE GLOBALE
// ==========================================

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], orders: [], clients: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults({ products: [], orders: [], clients: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ products: [], orders: [], clients: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { default: api } = await import('../../services/api');
        
        const [productsRes, ordersRes, clientsRes] = await Promise.allSettled([
          api.get(`/products?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/admin/orders?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/admin/clients?search=${encodeURIComponent(query)}&limit=5`)
        ]);

        setResults({
          products: productsRes.status === 'fulfilled' ? productsRes.value.data.data || [] : [],
          orders: ordersRes.status === 'fulfilled' ? ordersRes.value.data.data || [] : [],
          clients: clientsRes.status === 'fulfilled' ? clientsRes.value.data.data || [] : []
        });
      } catch (error) {
        console.error('Erreur recherche:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (type, item) => {
    onClose();
    switch (type) {
      case 'product':
        navigate(`/admin/produits/${item.id}/modifier`);
        break;
      case 'order':
        navigate(`/admin/commandes?orderId=${item.id}`);
        break;
      case 'client':
        navigate(`/admin/clients?clientId=${item.id}`);
        break;
    }
  };

  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.clients.length > 0;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4"
      >
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher produits, commandes, clients..."
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          )}
          <kbd className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Tapez au moins 2 caractères pour rechercher</p>
            </div>
          ) : !hasResults && !loading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="p-2">
              {results.products.length > 0 && (
                <div className="mb-4">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Produits</p>
                  {results.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect('product', product)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{product.nom}</p>
                        <p className="text-sm text-gray-500">{product.reference}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.orders.length > 0 && (
                <div className="mb-4">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Commandes</p>
                  {results.orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleSelect('order', order)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                    >
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{order.numeroCommande}</p>
                        <p className="text-sm text-gray-500">{order.client?.prenom} {order.client?.nom}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.clients.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Clients</p>
                  {results.clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelect('client', client)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                    >
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{client.prenom} {client.nom}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ✅ Nettoyer le localStorage au montage (pour débloquer)
  useEffect(() => {
    localStorage.removeItem('adminDarkMode');
    document.documentElement.classList.remove('dark');
  }, []);

  // Raccourci clavier ⌘K pour la recherche
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Produits', href: '/admin/produits', icon: Package },
    { name: 'Catégories', href: '/admin/categories', icon: FolderTree },
    { name: 'Commandes', href: '/admin/commandes', icon: ShoppingCart },
    { name: 'Clients', href: '/admin/clients', icon: Users },
    { name: 'Paramètres', href: '/admin/parametres', icon: Settings }
  ];

  const isActive = (href, exact = false) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
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
    <div className="min-h-screen bg-gray-100">
      
      {/* ==========================================
          SIDEBAR DESKTOP - TOUJOURS DARK
      ========================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-900 transition-all duration-300 hidden lg:flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
        style={{
          borderTopRightRadius: '24px',
          borderBottomRightRadius: '24px'
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 bg-gray-900 border-b border-r border-gray-800 ">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🥬</span>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-white text-lg"
              >
                Jana Admin
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-green-400' : ''}`} />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-green-400 rounded-r-full"
                  />
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ==========================================
          SIDEBAR MOBILE - TOUJOURS DARK
      ========================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-gray-900 z-50 lg:hidden flex flex-col"
              style={{
                borderTopRightRadius: '24px',
                borderBottomRightRadius: '24px'
              }}
            >
              <div className="h-16 flex items-center justify-between px-4">
                <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🥬</span>
                  </div>
                  <span className="font-bold text-white text-lg">Jana Admin</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative ${
                        active
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {active && <div className="absolute left-0 w-1 h-6 bg-green-400 rounded-r-full" />}
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.prenom?.[0]}{user?.nom?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.prenom} {user?.nom}
                    </p>
                    <p className="text-xs text-gray-500">Administrateur</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          MAIN CONTENT - TOUJOURS LIGHT
      ========================================== */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Topbar */}
        <header className="h-16 border-b bg-gray-900 border-gray-900 sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100 lg:hidden transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2 min-w-[200px] sm:min-w-[300px] hover:bg-gray-200 transition-colors"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Rechercher...</span>
                <kbd className="hidden sm:inline-block ml-auto px-2 py-0.5 text-xs bg-white rounded text-gray-500 shadow-sm">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 relative transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Voir le site */}
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-green-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Voir le site
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.prenom?.[0]}{user?.nom?.[0]}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.prenom} {user?.nom}
                    </p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 hidden md:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-gray-800">
                            {user?.prenom} {user?.nom}
                          </p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        
                        <Link
                          to="/admin/profil"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Mon profil
                        </Link>
                        <Link
                          to="/admin/parametres"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Paramètres
                        </Link>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Modal recherche */}
      <AnimatePresence>
        {searchOpen && (
          <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;
