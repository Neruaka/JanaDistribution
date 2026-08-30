/**
 * Utilities for HT / TTC price formatting.
 * Le mono (IBM Plex Mono) porte tous les prix — voir design_handoff_jana_refonte/README.md.
 */

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Formate un montant en "12,34 €" (sans mention HT/TTC).
 */
export const formatAmount = (amount) => `${numberFormatter.format(Number(amount) || 0)} €`;

/**
 * Formate un prix HT avec suffixe.
 */
export const formatPriceHT = (prixHT) => `${formatAmount(prixHT)} HT`;

/**
 * Calcule et formate le prix TTC à partir d'un prix HT et d'un taux de TVA (en %).
 */
export const computeTTC = (prixHT, tauxTva = 5.5) => (Number(prixHT) || 0) * (1 + (Number(tauxTva) || 0) / 100);

export const formatPriceTTC = (prixHT, tauxTva = 5.5) => `${formatAmount(computeTTC(prixHT, tauxTva))} TTC`;

/**
 * Retourne { primary, secondary } selon le mode d'affichage courant :
 * - HT  -> primaire = HT, secondaire = TTC
 * - TTC -> primaire = TTC, secondaire = HT
 */
export const getDisplayPrice = (prixHT, tauxTva = 5.5, priceMode = 'HT') => {
  if (priceMode === 'TTC') {
    return {
      primary: formatAmount(computeTTC(prixHT, tauxTva)),
      primarySuffix: 'TTC',
      secondary: formatPriceHT(prixHT)
    };
  }

  return {
    primary: formatAmount(prixHT),
    primarySuffix: 'HT',
    secondary: formatPriceTTC(prixHT, tauxTva)
  };
};

export default {
  formatAmount,
  formatPriceHT,
  formatPriceTTC,
  computeTTC,
  getDisplayPrice
};
