/**
 * Composant ProfilHeader
 * Carte profil rapide affichée en haut de la page Mon Compte
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building, Package, ChevronRight } from 'lucide-react';

const ProfilHeader = ({ user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </div>

        {/* Infos */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">
            {user?.prenom} {user?.nom}
          </h2>
          <p className="text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              user?.typeClient === 'PROFESSIONNEL'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {user?.typeClient === 'PROFESSIONNEL' ? (
                <><Building className="w-3 h-3" /> Professionnel</>
              ) : (
                <><User className="w-3 h-3" /> Particulier</>
              )}
            </span>
          </div>
        </div>

        {/* Lien commandes */}
        <Link
          to="/mes-commandes"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
        >
          <Package className="w-4 h-4" />
          Mes commandes
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ProfilHeader;
