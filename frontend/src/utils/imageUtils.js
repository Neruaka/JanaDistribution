/**
 * Utilities for image URL handling.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

/**
 * Build full image URL from absolute or relative path.
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/uploads')) {
    return `${BACKEND_URL}${imageUrl}`;
  }

  return imageUrl;
};

export const isLocalImage = (imageUrl) => {
  return Boolean(imageUrl && imageUrl.includes('/uploads/products/'));
};

export const getFilenameFromUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return imageUrl.split('/').pop();
};

export const DEFAULT_PRODUCT_IMAGE = '/placeholder-product.jpg';

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
  API_URL,
  BACKEND_URL
};
