/**
 * Bandeau d'information cookies (CNIL)
 * @description Bandeau informatif (sans consentement requis) car Jana Distribution
 * n'utilise que des cookies/stockages techniques strictement nécessaires
 * (authentification, session panier). Aucun cookie de mesure d'audience,
 * de publicité ou de traçage tiers n'est utilisé.
 * @location frontend/src/components/CookieBanner.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'jana_cookie_banner_dismissed';

const CookieBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const alreadyDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      setDismissed(alreadyDismissed);
    } catch {
      // localStorage indisponible (mode privé strict, etc.) : on affiche le bandeau
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignoré : le bandeau réapparaîtra simplement à la prochaine visite
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Information sur l'utilisation des cookies"
      className="fixed bottom-0 inset-x-0 z-50 bg-gray-900 text-gray-200 border-t border-gray-800 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Cookie className="w-6 h-6 text-green-400 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm leading-relaxed flex-1">
          Ce site utilise uniquement des cookies techniques strictement nécessaires à son
          fonctionnement (authentification, maintien de votre session et de votre panier).
          Aucun cookie de suivi, de mesure d'audience ou de publicité n'est utilisé.{' '}
          <Link to="/confidentialite" className="text-green-400 hover:text-green-300 underline font-medium">
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer le bandeau d'information sur les cookies"
          className="self-end sm:self-center flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Fermer
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
