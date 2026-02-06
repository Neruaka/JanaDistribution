/**
 * Application principale - AVEC SETTINGS
 * @description Point d'entrÃ©e de l'application React
 * @location frontend/src/App.jsx
 * 
 * âœ… MODIF: Suppression des pages Promotions et CatÃ©gories
 * âœ… AJOUT: Recherche intelligente dans la Navbar
 */

import { Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Components
import PrivateRoute from './components/PrivateRoute';
import CartDrawer from './components/CartDrawer';
import PublicLayout from './components/PublicLayout';

// Pages publiques
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CataloguePage from './pages/CataloguePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Pages client
import MonComptePage from './pages/MonComptePage';

// Pages lÃ©gales
import CGVPage from './pages/CGVPage';
import ConfidentialitePage from './pages/ConfidentialitePage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import AccessibilitePage from './pages/AccessibilitePage';

// Pages Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsList from './pages/admin/AdminProductsList';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategoriesList from './pages/admin/AdminCategoriesList';
import AdminClientsList from './pages/admin/AdminClientsList';
import AdminOrdersList from './pages/admin/AdminOrdersList';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Page 404
const NotFoundPage = () => {
  return (
    <div className="flex-grow flex items-center justify-center bg-gray-100 py-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page non trouvÃ©e</p>
        <Link to="/" className="text-green-600 hover:underline mt-4 inline-block">
          Retour Ã  l'accueil
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          {/* Notifications toast */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#4CAF50',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f44336',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          {/* Drawer panier (sidebar) */}
          <AnimatePresence>
            <CartDrawer />
          </AnimatePresence>
          
          {/* Routes */}
          <Routes>
            {/* ==================== */}
            {/* Pages publiques avec Navbar + Footer */}
            {/* ==================== */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/catalogue" element={<PublicLayout><CataloguePage /></PublicLayout>} />
            <Route path="/produit/:slug" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
            <Route path="/panier" element={<PublicLayout><CartPage /></PublicLayout>} />

            {/* ==================== */}
            {/* Pages lÃ©gales */}
            {/* ==================== */}
            <Route path="/cgv" element={<PublicLayout><CGVPage /></PublicLayout>} />
            <Route path="/confidentialite" element={<PublicLayout><ConfidentialitePage /></PublicLayout>} />
            <Route path="/mentions-legales" element={<PublicLayout><MentionsLegalesPage /></PublicLayout>} />
            <Route path="/accessibilite" element={<PublicLayout><AccessibilitePage /></PublicLayout>} />

            {/* ==================== */}
            {/* Pages auth (sans Navbar/Footer) */}
            {/* ==================== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ==================== */}
            {/* Checkout (protÃ©gÃ©) */}
            {/* ==================== */}
            <Route path="/checkout" element={
              <PrivateRoute>
                <PublicLayout>
                  <CheckoutPage />
                </PublicLayout>
              </PrivateRoute>
            } />

            {/* Confirmation commande */}
            <Route path="/commande/confirmation/:orderId" element={
              <PrivateRoute>
                <PublicLayout>
                  <OrderConfirmationPage />
                </PublicLayout>
              </PrivateRoute>
            } />

            {/* ==================== */}
            {/* Pages protÃ©gÃ©es client */}
            {/* ==================== */}
            <Route path="/mon-compte" element={
              <PrivateRoute>
                <PublicLayout>
                  <MonComptePage />
                </PublicLayout>
              </PrivateRoute>
            } />
            <Route path="/mes-commandes" element={
              <PrivateRoute>
                <PublicLayout>
                  <OrderHistoryPage />
                </PublicLayout>
              </PrivateRoute>
            } />
            <Route path="/mes-commandes/:orderId" element={
              <PrivateRoute>
                <PublicLayout>
                  <OrderDetailPage />
                </PublicLayout>
              </PrivateRoute>
            } />
            
            {/* ==================== */}
            {/* Pages Admin avec AdminLayout */}
            {/* ==================== */}
            <Route path="/admin" element={
              <PrivateRoute adminOnly>
                <AdminLayout />
              </PrivateRoute>
            }>
              {/* Dashboard */}
              <Route index element={<AdminDashboard />} />
              
              {/* Produits */}
              <Route path="produits" element={<AdminProductsList />} />
              <Route path="produits/nouveau" element={<AdminProductForm />} />
              <Route path="produits/:id" element={<AdminProductForm />} />
              <Route path="produits/:id/modifier" element={<AdminProductForm />} />
              
              {/* CatÃ©gories */}
              <Route path="categories" element={<AdminCategoriesList />} />
              
              {/* Commandes */}
              <Route path="commandes" element={<AdminOrdersList />} />
              
              {/* Clients */}
              <Route path="clients" element={<AdminClientsList />} />
              
              {/* ParamÃ¨tres */}
              <Route path="parametres" element={<AdminSettingsPage />} />
              
              {/* Profil admin */}
              <Route path="profil" element={<AdminProfilePage />} />
            </Route>
            
            {/* ==================== */}
            {/* 404 */}
            {/* ==================== */}
            <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;

