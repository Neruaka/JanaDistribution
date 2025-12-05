/**
 * Composant Navbar
 * @description Barre de navigation avec état connecté/déconnecté
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();
  
  // État du menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // État du dropdown utilisateur
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  /**
   * Gère la déconnexion
   */
  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie !');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo et navigation principale */}
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🥬</span>
              <span className="font-bold text-xl text-green-600 hidden sm:block">
                Jana Distribution
              </span>
            </Link>

            {/* Navigation desktop */}
            <div className="hidden md:flex ml-10 space-x-8">
              <Link 
                to="/catalogue" 
                className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Catalogue
              </Link>
              <Link 
                to="/categories" 
                className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Catégories
              </Link>
              <Link 
                to="/promotions" 
                className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Promotions
              </Link>
            </div>
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {/* Panier - bouton qui ouvre le drawer */}
            <button 
              onClick={openDrawer}
              className="text-gray-700 hover:text-green-600 p-2 relative transition-colors"
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart className="w-6 h-6" />
              {/* Badge panier dynamique */}
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Authentification */}
            {isAuthenticated ? (
              // Utilisateur connecté
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 focus:outline-none"
                >
                  <span className="text-xl">
                    {isAdmin ? '👤' : '🙂'}
                  </span>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.prenom}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    {/* Infos utilisateur */}
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.prenom} {user?.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.email}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        isAdmin 
                          ? 'bg-purple-100 text-purple-700' 
                          : user?.typeClient === 'PROFESSIONNEL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {isAdmin ? 'Administrateur' : user?.typeClient}
                      </span>
                    </div>

                    {/* Liens */}
                    <Link
                      to="/mon-compte"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      👤 Mon compte
                    </Link>
                    <Link
                      to="/mes-commandes"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      📦 Mes commandes
                    </Link>
                    
                    {/* Admin uniquement */}
                    {isAdmin && (
                      <>
                        <div className="border-t my-1"></div>
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          ⚙️ Administration
                        </Link>
                      </>
                    )}

                    {/* Déconnexion */}
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Utilisateur non connecté
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* Bouton menu mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            <Link 
              to="/catalogue" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📦 Catalogue
            </Link>
            <Link 
              to="/categories" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📂 Catégories
            </Link>
            <Link 
              to="/promotions" 
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏷️ Promotions
            </Link>
          </div>
        )}
      </div>

      {/* Overlay pour fermer les menus */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
