/**
 * Utilitaires pour les images
 * @description Helper pour construire les URLs d'images produits
 * @location frontend/src/utils/imageUtils.js
 * 
 * Problème résolu:
 * - Les images uploadées sont stockées avec une URL relative: /uploads/products/xxx.jpg
 * - Le frontend (localhost:5173) et le backend (localhost:3000) ont des ports différents
 * - Sans ce helper, le navigateur cherche l'image sur le mauvais serveur
 */

// URL de base de l'API backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Construit l'URL complète d'une image
 * 
 * @param {string} imageUrl - URL de l'image (peut être relative ou absolue)
 * @returns {string|null} URL complète ou null si pas d'image
 * 
 * @example
 * getImageUrl('/uploads/products/xxx.jpg')  → 'http://localhost:3000/uploads/products/xxx.jpg'
 * getImageUrl('https://example.com/img.jpg') → 'https://example.com/img.jpg'
 * getImageUrl(null)                          → null
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // Si c'est déjà une URL absolue (http/https), la retourner telle quelle
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Si c'est une URL relative vers les uploads, préfixer avec l'URL de l'API
  if (imageUrl.startsWith('/uploads')) {
    return `${API_URL}${imageUrl}`;
  }
  
  // Sinon retourner tel quel (cas rare)
  return imageUrl;
};

/**
 * Vérifie si une URL est une image locale (uploadée sur notre serveur)
 * 
 * @param {string} imageUrl 
 * @returns {boolean}
 */
export const isLocalImage = (imageUrl) => {
  return imageUrl && imageUrl.includes('/uploads/products/');
};

/**
 * Extrait le nom de fichier d'une URL d'image
 * 
 * @param {string} imageUrl 
 * @returns {string|null}
 */
export const getFilenameFromUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return imageUrl.split('/').pop();
};

/**
 * Image par défaut si aucune image n'est fournie
 */
export const DEFAULT_PRODUCT_IMAGE = '/placeholder-product.jpg';

/**
 * Retourne l'URL de l'image ou une image par défaut
 * 
 * @param {string} imageUrl 
 * @returns {string}
 */
export const getImageUrlOrDefault = (imageUrl) => {
  const url = getImageUrl(imageUrl);
  return url || DEFAULT_PRODUCT_IMAGE;
};

export default {
  getImageUrl,
  isLocalImage,
  getFilenameFromUrl,
  getImageUrlOrDefault,
  DEFAULT_PRODUCT_IMAGE,
  API_URL
};
