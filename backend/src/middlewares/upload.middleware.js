const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

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

// Extension de stockage dérivée du mimetype validé — jamais de file.originalname
// (attaquant-contrôlé), pour empêcher qu'un fichier arbitraire soit stocké sous une
// extension trompeuse (ex. .html) qui serait ensuite servie avec le mauvais Content-Type.
const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

// Signatures binaires (magic bytes) des formats autorisés, pour vérifier que le
// contenu réel du fichier correspond au mimetype déclaré (falsifiable côté client).
const FILE_SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }
  // WEBP : RIFF....WEBP — vérifié séparément (signature non contiguë)
];

const matchesFileSignature = (buffer) => {
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return true;
  }
  return FILE_SIGNATURES.some(({ bytes }) => bytes.every((byte, i) => buffer[i] === byte));
};

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
    // Générer un nom unique : product_uuid.extension — extension dérivée du
    // mimetype validé (whitelist), jamais de file.originalname (attaquant-contrôlé).
    const ext = MIME_TO_EXTENSION[file.mimetype] || '.jpg';
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

  // Défense en profondeur contre le path traversal : on ne retient que le nom de
  // fichier (aucun séparateur de répertoire) et on vérifie que le chemin résolu
  // reste bien sous UPLOAD_DIR, même si l'appelant n'a pas validé filename en amont.
  const safeName = path.basename(filename);
  const filepath = path.join(UPLOAD_DIR, safeName);
  if (path.dirname(filepath) !== UPLOAD_DIR) return;

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`Image supprimée: ${safeName}`);
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
// VÉRIFICATION DU CONTENU RÉEL (magic bytes)
// ==========================================

/**
 * Middleware à chaîner juste après productImageUpload.single('image')/.array(...).
 * Multer a déjà écrit le fichier sur disque à ce stade (storage: diskStorage) ; on lit
 * ses premiers octets pour vérifier que le contenu réel correspond bien à une image,
 * indépendamment du Content-Type déclaré par le client (falsifiable). Rejette et
 * supprime le fichier si la signature ne correspond à aucun format autorisé.
 */
const verifyImageSignature = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) return next();

  for (const file of files) {
    let handle;
    try {
      handle = fs.openSync(file.path, 'r');
      const buffer = Buffer.alloc(12);
      fs.readSync(handle, buffer, 0, 12, 0);
      fs.closeSync(handle);

      if (!matchesFileSignature(buffer)) {
        fs.unlink(file.path, () => {});
        return res.status(400).json({ success: false, message: 'Le contenu du fichier ne correspond pas à une image valide.' });
      }
    } catch (error) {
      if (handle !== undefined) { try { fs.closeSync(handle); } catch (_) { /* déjà fermé */ } }
      fs.unlink(file.path, () => {});
      return next(new Error(`Vérification du fichier échouée: ${error.message}`));
    }
  }

  next();
};

// ==========================================
// MIDDLEWARE R2 (optionnel — activé si R2_ACCOUNT_ID est défini)
// ==========================================

/**
 * Middleware à chaîner après productImageUpload.single('image').
 * Si R2 est configuré : upload le fichier vers Cloudflare R2, supprime le fichier local,
 * et expose req.file.r2Url. Sinon : no-op (le fichier reste sur disque local).
 */
const uploadToR2 = async (req, res, next) => {
  if (!req.file) return next();
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
    return next(); // Mode dev sans R2 : garder le fichier local
  }

  try {
    const { r2Client, bucketName } = require('../config/r2');
    const { Upload } = require('@aws-sdk/lib-storage');

    const ext = path.extname(req.file.originalname).toLowerCase();
    const key = `products/${crypto.randomUUID()}${ext}`;
    const fileBuffer = fs.readFileSync(req.file.path);

    const uploadInstance = new Upload({
      client: r2Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: req.file.mimetype,
      },
    });

    await uploadInstance.done();

    // Nettoyage du fichier local après upload R2 réussi
    fs.unlink(req.file.path, () => {});

    req.file.r2Key = key;
    req.file.r2Url = `${process.env.R2_PUBLIC_URL}/${key}`;

    next();
  } catch (error) {
    next(new Error(`Upload R2 échoué: ${error.message}`));
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  productImageUpload,
  productGalleryUpload,
  uploadToR2,
  verifyImageSignature,
  deleteImage,
  getFilenameFromUrl,
  isLocalImage,
  UPLOAD_DIR,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
