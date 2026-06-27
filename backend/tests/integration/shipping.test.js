// Tests unitaires — calcul livraison DISTANCE (Haversine)
// Ces tests sont unitaires, pas besoin de DB

describe('Shipping calculation — unit', () => {
  // Coordonnées de référence
  const DEPOT_LAT = 48.8566; // Paris
  const DEPOT_LNG = 2.3522;

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function calcShipping(distanceKm, totalTtc) {
    const FRAIS_BASE = 5.0;
    const TARIF_KM = 0.8;
    const FRANCO_SEUIL = 80.0;
    const RAYON_MAX = 80;

    if (distanceKm > RAYON_MAX) return null; // Refus
    if (totalTtc >= FRANCO_SEUIL) return 0;  // Gratuit
    return parseFloat((FRAIS_BASE + distanceKm * TARIF_KM).toFixed(2));
  }

  test('Paris intramuros (~0 km) : frais = 5.00€', () => {
    const dist = haversine(DEPOT_LAT, DEPOT_LNG, 48.86, 2.35);
    expect(calcShipping(dist, 30)).toBeCloseTo(5.0, 0);
  });

  test('franco de port : commande > 80€ → frais = 0', () => {
    expect(calcShipping(20, 85)).toBe(0);
  });

  test('rayon dépassé : distance > 80km → refus (null)', () => {
    expect(calcShipping(100, 30)).toBeNull();
  });

  test('calcul standard : 20km × 0.80€ + 5.00€ base = 21.00€', () => {
    expect(calcShipping(20, 30)).toBe(21.0);
  });
});
