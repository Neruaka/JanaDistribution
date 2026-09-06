/**
 * Composant GuestOnlyRoute
 * @description Inverse de PrivateRoute : reserve une route aux visiteurs NON
 * connectes (ex. /register) - un utilisateur deja authentifie est redirige
 * vers l'accueil plutot que de revoir le formulaire d'inscription.
 *
 * Utilisation :
 * <Route path="/register" element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestOnlyRoute;
