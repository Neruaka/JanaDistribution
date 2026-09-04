/**
 * Composant Navbar — en-tête public 3 bandes
 * @description Barre utilitaire (HT/TTC) + barre principale (logo, recherche, compte, panier) + nav rayons
 * @see design_handoff_jana_refonte/JanaHeader.dc.html
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePriceMode } from '../contexts/PriceModeContext';
import SearchBar from './SearchBar';
import categoryService from '../services/categoryService';
import toast from 'react-hot-toast';
import { ChevronDown, Menu, X, LogOut, User, Package, FileText, Settings } from 'lucide-react';
import { formatAmount } from '../utils/priceUtils';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, openDrawer, subtotalHT, totalTTC } = useCart();
  const { site, telephoneSite } = useSettings();
  const { priceMode, setPriceMode } = usePriceMode();

  const [rayons, setRayons] = useState([]);
  const [isRayonsOpen, setIsRayonsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const rayonsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    categoryService.getAll({ includeProductCount: true }).then((response) => {
      if (mounted && response.success && Array.isArray(response.data)) {
        setRayons(response.data.filter((c) => c.estActif !== false));
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rayonsRef.current && !rayonsRef.current.contains(event.target)) {
        setIsRayonsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie !');
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const cartTotal = priceMode === 'TTC' ? totalTTC : subtotalHT;
  const rayonsVisibles = rayons.slice(0, 7);

  return (
    <header className="sticky top-0 z-50 bg-white font-sans">
      {/* Bande 1 — barre utilitaire */}
      <div className="hidden md:flex items-center justify-between h-[38px] px-10 bg-ink-900 text-[12.5px] text-mist-2">
        <div className="flex items-center gap-7">
          <span>Livraison 24–48 h en Île-de-France</span>
          <span className="text-ink-500">|</span>
          <span>Commande minimum 50 € HT</span>
          <span className="text-ink-500">|</span>
          <span>Créneaux confirmés par téléphone</span>
        </div>
        <div className="flex items-center gap-[22px]">
          {telephoneSite && (
            <a href={`tel:${telephoneSite.replace(/\s/g, '')}`} className="font-mono text-mist-2 hover:text-white">
              {telephoneSite}
            </a>
          )}
          <span className="text-ink-500">|</span>
          <a href={`mailto:${site?.email || ''}`} className="text-mist-2 hover:text-white">
            Aide &amp; contact
          </a>
          <div className="flex bg-ink-700 rounded p-0.5">
            <button
              type="button"
              onClick={() => setPriceMode('HT')}
              className={`px-[9px] py-[3px] rounded-[3px] text-[11.5px] font-semibold transition-colors ${
                priceMode === 'HT' ? 'bg-sand-50 text-ink-900' : 'text-mist-3'
              }`}
            >
              HT
            </button>
            <button
              type="button"
              onClick={() => setPriceMode('TTC')}
              className={`px-[9px] py-[3px] rounded-[3px] text-[11.5px] font-semibold transition-colors ${
                priceMode === 'TTC' ? 'bg-sand-50 text-ink-900' : 'text-mist-3'
              }`}
            >
              TTC
            </button>
          </div>
        </div>
      </div>

      {/* Bande 2 — barre principale (fond sombre sur mobile pour l'accueil, cf. maquette M1) */}
      <div className={`flex items-center gap-8 px-4 md:px-10 py-3 md:py-[18px] border-b ${isHome ? 'bg-ink-900 border-ink-700 md:bg-white md:border-sand-200' : 'border-sand-200'}`}>
        <Link to="/" className="flex items-center gap-[11px] flex-shrink-0">
          <div className="w-[34px] h-[34px] rounded-7 bg-green-700 flex items-center justify-center text-white font-display font-extrabold text-[17px] tracking-tight">
            J
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className={`font-display font-extrabold text-[19px] tracking-tight ${isHome ? 'text-white md:text-ink-900' : 'text-ink-900'}`}>JANA</span>
            <span className="text-[9.5px] tracking-widest text-graphite-500 mt-[3px]">DISTRIBUTION</span>
          </div>
        </Link>

        <div className="hidden md:block flex-1 max-w-[720px]">
          <SearchBar />
        </div>

        <div className="flex items-center gap-[26px] ml-auto">
          {isAuthenticated && (
            <Link to="/mes-commandes" className="hidden lg:flex flex-col leading-[1.25]">
              <span className="text-[11px] text-graphite-500">Mes</span>
              <span className="text-[13.5px] text-ink-900 font-semibold">commandes</span>
            </Link>
          )}

          <div className="relative hidden md:block">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex flex-col leading-[1.25] text-left"
                >
                  <span className="text-[11px] text-graphite-500">Bonjour, {user?.prenom}</span>
                  <span className="text-[13.5px] text-ink-900 font-semibold flex items-center gap-1">
                    Mon compte
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-8 border border-sand-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-sand-200">
                      <p className="text-[13.5px] font-semibold text-ink-900">{user?.prenom} {user?.nom}</p>
                      <p className="text-[12px] text-graphite-500">{user?.email}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium rounded-3 ${
                        isAdmin ? 'bg-pro-bg text-pro-text' : user?.typeClient === 'PROFESSIONNEL'
                          ? 'bg-pro-bg text-pro-text'
                          : 'bg-particulier-bg text-particulier-text'
                      }`}>
                        {isAdmin ? 'Administrateur' : user?.typeClient === 'PROFESSIONNEL' ? 'Pro' : 'Particulier'}
                      </span>
                    </div>
                    <Link to="/mon-compte" className="flex items-center gap-2 px-4 py-2 text-[13.5px] text-graphite-700 hover:bg-sand-50" onClick={() => setIsUserMenuOpen(false)}>
                      <User className="w-4 h-4 text-graphite-400" /> Mon compte
                    </Link>
                    <Link to="/mes-commandes" className="flex items-center gap-2 px-4 py-2 text-[13.5px] text-graphite-700 hover:bg-sand-50" onClick={() => setIsUserMenuOpen(false)}>
                      <Package className="w-4 h-4 text-graphite-400" /> Mes commandes
                    </Link>
                    <Link to="/mes-factures" className="flex items-center gap-2 px-4 py-2 text-[13.5px] text-graphite-700 hover:bg-sand-50" onClick={() => setIsUserMenuOpen(false)}>
                      <FileText className="w-4 h-4 text-graphite-400" /> Mes factures
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-sand-200 my-1" />
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-[13.5px] text-green-700 hover:bg-success-bg" onClick={() => setIsUserMenuOpen(false)}>
                          <Settings className="w-4 h-4" /> Administration
                        </Link>
                      </>
                    )}
                    <div className="border-t border-sand-200 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-[13.5px] text-danger-text hover:bg-danger-bg text-left">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-[13.5px] font-semibold text-ink-900 hover:text-green-800">
                  Connexion
                </Link>
                <Link to="/register" className="bg-green-700 text-white hover:bg-green-800 px-4 py-2 rounded-6 text-[13.5px] font-semibold transition-colors">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {isHome && (
            <div className="md:hidden flex bg-ink-700 rounded p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setPriceMode('HT')}
                className={`px-[9px] py-[3px] rounded-[3px] text-[11.5px] font-semibold transition-colors ${priceMode === 'HT' ? 'bg-sand-50 text-ink-900' : 'text-mist-3'}`}
              >
                HT
              </button>
              <button
                type="button"
                onClick={() => setPriceMode('TTC')}
                className={`px-[9px] py-[3px] rounded-[3px] text-[11.5px] font-semibold transition-colors ${priceMode === 'TTC' ? 'bg-sand-50 text-ink-900' : 'text-mist-3'}`}
              >
                TTC
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={openDrawer}
            className="flex items-center gap-[10px] bg-green-700 hover:bg-green-800 text-white h-11 px-[18px] rounded-6 transition-colors"
            aria-label="Ouvrir le panier"
          >
            <span className="text-[13.5px] font-semibold">Panier</span>
            <span className="bg-white/[18%] rounded-full text-[12px] px-2 py-0.5">{itemCount}</span>
            <span className="hidden sm:inline font-mono text-[13.5px]">
              {formatAmount(cartTotal)} {priceMode}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className={`md:hidden order-first p-2 ${isHome ? 'text-white' : 'text-ink-900'}`}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Bande 3 — nav rayons */}
      <div className="hidden md:flex items-center gap-[30px] px-10 h-[46px] border-b border-sand-200 bg-white text-[13.5px]">
        <div className="relative" ref={rayonsRef}>
          <button
            type="button"
            onClick={() => setIsRayonsOpen((v) => !v)}
            className="flex items-center gap-[9px] bg-ink-900 text-white px-[15px] py-[7px] rounded-5 font-semibold text-[13px]"
          >
            <Menu className="w-3.5 h-3.5" /> Rayons
          </button>
          {isRayonsOpen && rayons.length > 0 && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-8 border border-sand-200 py-2 z-50 max-h-96 overflow-y-auto">
              {rayons.map((rayon) => (
                <Link
                  key={rayon.id}
                  to={`/catalogue?categorie=${rayon.id}`}
                  className="flex items-center justify-between px-4 py-2 text-[13.5px] text-graphite-900 hover:bg-sand-50"
                  onClick={() => setIsRayonsOpen(false)}
                >
                  <span>{rayon.nom}</span>
                  {typeof rayon.productCount === 'number' && (
                    <span className="font-mono text-[11px] text-graphite-400">{rayon.productCount}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {rayonsVisibles.map((rayon) => (
          <Link key={rayon.id} to={`/catalogue?categorie=${rayon.id}`} className="text-graphite-900 hover:text-green-800">
            {rayon.nom}
          </Link>
        ))}

        <Link to="/catalogue?labels=PROMO" className="text-[#A8501A] font-semibold">
          Promotions
        </Link>

        <Link to="/catalogue" className="ml-auto flex items-center gap-2 text-green-700 font-semibold hover:text-green-800">
          Commande express par référence →
        </Link>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-sand-200 bg-white px-4 py-4 space-y-4">
          <SearchBar />

          <div className="flex bg-sand-150 rounded-6 p-0.5 w-fit">
            <button
              type="button"
              onClick={() => setPriceMode('HT')}
              className={`px-3 py-1.5 rounded-5 text-[12px] font-semibold ${priceMode === 'HT' ? 'bg-white text-ink-900' : 'text-graphite-500'}`}
            >
              HT
            </button>
            <button
              type="button"
              onClick={() => setPriceMode('TTC')}
              className={`px-3 py-1.5 rounded-5 text-[12px] font-semibold ${priceMode === 'TTC' ? 'bg-white text-ink-900' : 'text-graphite-500'}`}
            >
              TTC
            </button>
          </div>

          <div className="space-y-1">
            <Link to="/catalogue" className="block px-3 py-2 rounded-6 text-graphite-900 hover:bg-sand-50" onClick={() => setIsMobileMenuOpen(false)}>
              Catalogue
            </Link>
            {rayonsVisibles.map((rayon) => (
              <Link
                key={rayon.id}
                to={`/catalogue?categorie=${rayon.id}`}
                className="block px-3 py-2 rounded-6 text-graphite-900 hover:bg-sand-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {rayon.nom}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="border-t border-sand-200 my-2" />
                <Link to="/mon-compte" className="block px-3 py-2 rounded-6 text-graphite-900 hover:bg-sand-50" onClick={() => setIsMobileMenuOpen(false)}>
                  Mon compte
                </Link>
                <Link to="/mes-commandes" className="block px-3 py-2 rounded-6 text-graphite-900 hover:bg-sand-50" onClick={() => setIsMobileMenuOpen(false)}>
                  Mes commandes
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="block px-3 py-2 rounded-6 text-green-700 hover:bg-success-bg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    Administration
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-6 text-danger-text hover:bg-danger-bg">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-sand-200 my-2" />
                <Link to="/login" className="block px-3 py-2 rounded-6 text-graphite-900 hover:bg-sand-50" onClick={() => setIsMobileMenuOpen(false)}>
                  Connexion
                </Link>
                <Link to="/register" className="block px-3 py-2 rounded-6 text-green-700 font-semibold hover:bg-success-bg" onClick={() => setIsMobileMenuOpen(false)}>
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {(isUserMenuOpen || isRayonsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsRayonsOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Navbar;
