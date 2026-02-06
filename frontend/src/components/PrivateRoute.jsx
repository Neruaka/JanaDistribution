/**
 * Composant PrivateRoute
 * @description ProtÃ¨ge les routes qui nÃ©cessitent une authentification
 * 
 * Utilisation :
 * <Route path="/mon-compte" element={<PrivateRoute><MonComptePage /></PrivateRoute>} />
 * <Route path="/admin" element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
 */

import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Pendant le chargement initial, on affiche un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si non authentifiÃ©, redirige vers login
  if (!isAuthenticated) {
    // On sauvegarde la page demandÃ©e pour y revenir aprÃ¨s connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si route admin et utilisateur non admin
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <span className="text-6xl">ðŸš«</span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            AccÃ¨s refusÃ©
          </h2>
          <p className="mt-2 text-gray-600">
            Cette section est rÃ©servÃ©e aux administrateurs.
          </p>
          <Link to="/" className="mt-6 inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
            Retour Ã  l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Tout est OK, on affiche le contenu
  return children;
};

export default PrivateRoute;


