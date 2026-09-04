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
      className="fixed bottom-[76px] md:bottom-0 inset-x-0 z-50 bg-ink-900 text-mist border-t border-ink-600 shadow-modal"
    >
      <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Cookie className="w-5 h-5 text-accent-light flex-shrink-0" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed flex-1">
          Ce site utilise uniquement des cookies techniques strictement nécessaires à son
          fonctionnement (authentification, maintien de votre session et de votre panier).
          Aucun cookie de suivi, de mesure d'audience ou de publicité n'est utilisé.{' '}
          <Link to="/confidentialite" className="text-accent-light hover:text-accent-lighter underline font-medium">
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer le bandeau d'information sur les cookies"
          className="self-end sm:self-center flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-6 hover:bg-green-800 transition-colors text-[13px] font-semibold"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          Fermer
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
