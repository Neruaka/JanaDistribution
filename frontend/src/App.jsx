/**
 * Application principale
 * @description Point d'entrée de l'application React
 */

import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import CartDrawer from './components/CartDrawer';

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

// Pages Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsList from './pages/admin/AdminProductsList';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategoriesList from './pages/admin/AdminCategoriesList';
import AdminClientsList from './pages/admin/AdminClientsList';
import AdminOrdersList from './pages/admin/AdminOrdersList';

// Page Mon Compte (temporaire)
const MonComptePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">👤 Mon compte</h1>
      <p className="text-gray-600">Page à implémenter...</p>
    </div>
  );
};

// Page Catégories (liste des catégories)
const CategoriesPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">📂 Catégories</h1>
      <p className="text-gray-600">Page catégories à implémenter...</p>
    </div>
  );
};

// Page Promotions
const PromotionsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">🏷️ Promotions</h1>
      <p className="text-gray-600">Page promotions à implémenter...</p>
    </div>
  );
};

// Page Admin Paramètres (temporaire)
const AdminSettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Paramètres</h1>
    <p className="text-gray-500">Paramètres à implémenter...</p>
  </div>
);

// Page 404
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page non trouvée</p>
        <a href="/" className="text-green-600 hover:underline mt-4 inline-block">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
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
          {/* Pages publiques avec Navbar */}
          {/* ==================== */}
          <Route path="/" element={<><Navbar /><HomePage /></>} />
          <Route path="/catalogue" element={<><Navbar /><CataloguePage /></>} />
          <Route path="/produit/:slug" element={<><Navbar /><ProductDetailPage /></>} />
          <Route path="/categories" element={<><Navbar /><CategoriesPage /></>} />
          <Route path="/promotions" element={<><Navbar /><PromotionsPage /></>} />
          <Route path="/panier" element={<><Navbar /><CartPage /></>} />
          
          {/* ==================== */}
          {/* Pages auth (sans Navbar) */}
          {/* ==================== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* ==================== */}
          {/* Checkout (protégé) */}
          {/* ==================== */}
          <Route path="/checkout" element={
            <PrivateRoute>
              <Navbar />
              <CheckoutPage />
            </PrivateRoute>
          } />
          
          {/* Confirmation commande */}
          <Route path="/commande/confirmation/:orderId" element={
            <PrivateRoute>
              <Navbar />
              <OrderConfirmationPage />
            </PrivateRoute>
          } />
        
        {/* ==================== */}
        {/* Pages protégées client */}
        {/* ==================== */}
        <Route path="/mon-compte" element={
          <PrivateRoute>
            <Navbar />
            <MonComptePage />
          </PrivateRoute>
        } />
        <Route path="/mes-commandes" element={
          <PrivateRoute>
            <Navbar />
            <OrderHistoryPage />
          </PrivateRoute>
        } />
        <Route path="/mes-commandes/:orderId" element={
          <PrivateRoute>
            <Navbar />
            <OrderDetailPage />
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
          
          {/* Catégories */}
          <Route path="categories" element={<AdminCategoriesList />} />
          
          {/* Commandes */}
          <Route path="commandes" element={<AdminOrdersList />} />
          
          {/* Clients */}
          <Route path="clients" element={<AdminClientsList />} />
          
          {/* Paramètres */}
          <Route path="parametres" element={<AdminSettingsPage />} />
        </Route>
        
        {/* ==================== */}
        {/* 404 */}
        {/* ==================== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
