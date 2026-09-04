/**
 * Layout public avec Navbar et Footer
 * @description Encapsule les pages publiques avec la navigation et le pied de page
 */

import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';

// Écrans "tunnel" (produit, panier, confirmation, détail commande) : une barre
// d'action contextuelle collée en bas remplace la barre d'onglets persistante
// (cf. design_handoff_jana_refonte/README.md, patterns mobiles).
const TASK_FLOW_PATTERNS = [/^\/produit\//, /^\/panier$/, /^\/commande\/confirmation\//, /^\/mes-commandes\/[^/]+$/];

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const isTaskFlow = TASK_FLOW_PATTERNS.some((re) => re.test(location.pathname));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {!isTaskFlow && (
        <>
          <Footer />
          <div className="h-[76px] md:hidden" />
          <MobileTabBar />
        </>
      )}
      {isTaskFlow && <div className="hidden md:block"><Footer /></div>}
    </div>
  );
};

export default PublicLayout;
