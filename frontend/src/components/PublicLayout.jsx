/**
 * Layout public avec Navbar et Footer
 * @description Encapsule les pages publiques avec la navigation et le pied de page
 */

import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
