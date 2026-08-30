/**
 * Price Mode Context
 * @description Bascule d'affichage des prix HT / TTC, persistée par utilisateur (localStorage)
 */

import { createContext, useContext, useState, useCallback } from 'react';

const PriceModeContext = createContext(null);

const STORAGE_KEY = 'jana_price_mode';

const getInitialMode = () => {
  if (typeof window === 'undefined') return 'HT';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'TTC' ? 'TTC' : 'HT';
};

export function PriceModeProvider({ children }) {
  const [priceMode, setPriceModeState] = useState(getInitialMode);

  const setPriceMode = useCallback((mode) => {
    const next = mode === 'TTC' ? 'TTC' : 'HT';
    setPriceModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // stockage indisponible (navigation privée…) — on garde l'état en mémoire
    }
  }, []);

  const togglePriceMode = useCallback(() => {
    setPriceMode(priceMode === 'HT' ? 'TTC' : 'HT');
  }, [priceMode, setPriceMode]);

  const value = {
    priceMode,
    isHT: priceMode === 'HT',
    isTTC: priceMode === 'TTC',
    setPriceMode,
    togglePriceMode
  };

  return (
    <PriceModeContext.Provider value={value}>
      {children}
    </PriceModeContext.Provider>
  );
}

export function usePriceMode() {
  const context = useContext(PriceModeContext);

  if (!context) {
    throw new Error('usePriceMode doit être utilisé dans un PriceModeProvider');
  }

  return context;
}

export default PriceModeContext;
