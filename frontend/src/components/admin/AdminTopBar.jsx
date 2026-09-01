/**
 * AdminTopBar — barre superieure commune aux ecrans admin
 * @see design_handoff_jana_refonte/Jana Admin - Refonte.dc.html (bloc partage en tete de chaque ecran)
 *
 * Recherche transverse (produits/commandes/clients) commune a tous les ecrans ;
 * les actions contextuelles (a droite) varient par page et sont passees en children.
 */

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const AdminTopBar = ({ children }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 bg-white border-b border-sand-200 px-[26px] py-3.5">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex-1 max-w-[420px] h-[38px] flex items-center gap-2 border border-sand-250 rounded-6 px-3.5 text-[13.5px] text-graphite-200 hover:border-sand-300 transition-colors"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">Rechercher une commande, un produit, un client…</span>
        <kbd className="ml-auto text-[10.5px] text-graphite-300 border border-sand-250 rounded-3 px-1.5 py-0.5">⌘K</kbd>
      </button>

      {children && <div className="ml-auto flex items-center gap-2.5">{children}</div>}

      <AnimatePresence>
        {searchOpen && <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminTopBar;
