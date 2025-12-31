/**
 * Upload Middleware
 * @description Configuration Multer pour l'upload de fichiers
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ==========================================
// CONFIGURATION
// ==========================================

// Dossier de destination pour les images produits
const UPLOAD_DIR = path.join(__dirname, '../../uploads/products');


// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Taille max : 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ==========================================
// STORAGE ENGINE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique : product_uuid.extension
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `product_${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// ==========================================
// FILTRES
// ==========================================

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé. Types acceptés: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

// ==========================================
// INSTANCES MULTER
// ==========================================

/**
 * Upload pour images produits
 * - Single file
 * - Max 5MB
 * - Images uniquement
 */
const productImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

/**
 * Upload multiple images (pour galerie produit future)
 * - Max 5 files
 * - Max 5MB chacun
 */
const productGalleryUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

// ==========================================
// HELPERS
// ==========================================

/**
 * Supprime une image du disque
 * @param {string} filename - Nom du fichier
 */
const deleteImage = (filename) => {
  if (!filename) return;
  
  const filepath = path.join(UPLOAD_DIR, filename);
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`Image supprimée: ${filename}`);
  }
};

/**
 * Extrait le nom de fichier d'une URL d'image locale
 * @param {string} imageUrl - URL de l'image
 * @returns {string|null} Nom du fichier ou null
 */
const getFilenameFromUrl = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('/uploads/products/')) {
    return null;
  }
  return imageUrl.split('/uploads/products/').pop();
};

/**
 * Vérifie si une URL est une image locale
 * @param {string} url 
 * @returns {boolean}
 */
const isLocalImage = (url) => {
  return url && url.includes('/uploads/products/');
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  productImageUpload,
  productGalleryUpload,
  deleteImage,
  getFilenameFromUrl,
  isLocalImage,
  UPLOAD_DIR,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
