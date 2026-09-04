/**
 * AdminTopBar — barre superieure commune aux ecrans admin
 * @see design_handoff_jana_refonte/Jana Admin - Refonte.dc.html (bloc partage en tete de chaque ecran)
 *
 * La maquette varie le champ de recherche par ecran (recherche transverse sur le
 * Dashboard, filtre local "Numero, client, email..." sur Commandes, etc). Par defaut
 * ce composant affiche le declencheur de recherche globale (⌘K, reelle, interroge
 * produits/commandes/clients) ; une page peut le remplacer par son propre filtre local
 * via la prop `search`. Le raccourci ⌘K reste actif dans tous les cas.
 * Les actions contextuelles (a droite) varient par page et sont passees en children.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const AdminTopBar = ({ search, children }) => {
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 bg-white border-b border-sand-200 px-4 lg:px-[26px] py-3 lg:py-3.5">
      {search ?? (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex-1 lg:max-w-[420px] h-[38px] flex items-center gap-2 border border-sand-250 rounded-6 px-3.5 text-[13.5px] text-graphite-200 hover:border-sand-300 transition-colors"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Rechercher une commande, un produit, un client…</span>
          <kbd className="ml-auto text-[10.5px] text-graphite-300 border border-sand-250 rounded-3 px-1.5 py-0.5 hidden sm:inline">⌘K</kbd>
        </button>
      )}

      {children && <div className="flex flex-wrap items-center gap-2 lg:gap-2.5 lg:ml-auto">{children}</div>}

      <AnimatePresence>
        {searchOpen && <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminTopBar;
