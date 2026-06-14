/**
 * Geocoding Service
 *
 * Géocode une adresse française via l'API officielle adresse.data.gouv.fr
 * (gratuite, sans clé, illimitée — basée sur la BAN).
 * Calcule la distance Haversine entre deux points GPS.
 *
 * Cache mémoire pour éviter les appels répétés sur les mêmes adresses.
 */

const logger = require('../config/logger');

const BAN_BASE_URL = 'https://api-adresse.data.gouv.fr/search/';
const EARTH_RADIUS_KM = 6371;

// Cache simple en mémoire — TTL 24h
const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

class GeocodingService {

  /**
   * Géocode une adresse française et retourne ses coordonnées GPS.
   *
   * @param {Object} adresse - { adresse, codePostal, ville }
   * @returns {Promise<{lat:number, lng:number, label:string}|null>}
   */
  async geocode({ adresse, codePostal, ville }) {
    if (!codePostal && !ville && !adresse) return null;

    const query = [adresse, codePostal, ville].filter(Boolean).join(' ').trim();
    if (!query) return null;

    // Cache hit ?
    const cacheKey = query.toLowerCase();
    const cached = geocodeCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
      return cached.value;
    }

    try {
      const url = `${BAN_BASE_URL}?q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

      if (!res.ok) {
        logger.warn('BAN geocoding API responded with non-OK status', {
          status: res.status,
          query
        });
        return null;
      }

      const data = await res.json();
      const feature = data?.features?.[0];
      if (!feature?.geometry?.coordinates) {
        logger.info('Aucun résultat de géocodage', { query });
        return null;
      }

      const [lng, lat] = feature.geometry.coordinates;
      const result = {
        lat: Number(lat),
        lng: Number(lng),
        label: feature.properties?.label || query
      };

      geocodeCache.set(cacheKey, { value: result, ts: Date.now() });
      return result;
    } catch (err) {
      logger.error('Erreur lors du géocodage BAN', {
        error: err.message,
        query
      });
      return null;
    }
  }

  /**
   * Distance Haversine entre deux points GPS, en kilomètres.
   *
   * @param {{lat:number, lng:number}} a
   * @param {{lat:number, lng:number}} b
   * @returns {number} distance en km, arrondie à 0.1 km
   */
  haversineKm(a, b) {
    if (!a || !b) return null;

    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
  }

  /**
   * Vide le cache de géocodage. Utile quand on change l'adresse de départ.
   */
  clearCache() {
    geocodeCache.clear();
  }
}

module.exports = new GeocodingService();
