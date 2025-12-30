/**
 * Controller Produits - AVEC UPLOAD IMAGE
 * @description Gestion des requêtes HTTP pour les produits
 * 
 * ✅ AJOUT: uploadImage, deleteImage
 */

const productService = require('../services/product.service');
const logger = require('../config/logger');
const { deleteImage, getFilenameFromUrl, isLocalImage } = require('../middlewares/upload.middleware');

class ProductController {
  /**
   * GET /api/products
   * Liste des produits avec filtres et pagination
   */
  async getAll(req, res, next) {
    try {
      const {
        page = 1,
        limit = 12,
        categorieId,
        search,
        minPrice,
        maxPrice,
        enStock,
        estActif,
        enPromotion,
        hasPromo,
        estMisEnAvant,
        orderBy,
        orderDir,
        labels
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        categorieId,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        enStock: enStock === 'true' ? true : enStock === 'false' ? false : null,
        estActif: estActif === 'all' ? null : estActif === 'false' ? false : estActif === 'true' ? true : true,
        enPromotion: enPromotion === 'true' ? true : enPromotion === 'false' ? false : null,
        hasPromo: hasPromo === 'true' ? true : hasPromo === 'false' ? false : null,
        estMisEnAvant: estMisEnAvant === 'true' ? true : estMisEnAvant === 'false' ? false : null,
        orderBy,
        orderDir,
        labels: labels ? labels.split(',') : []
      };

      const result = await productService.getProducts(options);

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Détail d'un produit par ID
   */
  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/slug/:slug
   * Détail d'un produit par slug
   */
  async getBySlug(req, res, next) {
    try {
      const product = await productService.getProductBySlug(req.params.slug);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search
   * Recherche de produits
   */
  async search(req, res, next) {
    try {
      const { q, page = 1, limit = 12 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche doit contenir au moins 2 caractères'
        });
      }

      const result = await productService.getProducts({
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        search: q.trim(),
        estActif: true
      });

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        query: q.trim()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/promos
   * Produits en promotion
   */
  async getPromos(req, res, next) {
    try {
      const products = await productService.getPromos();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/new
   * Nouveaux produits
   */
  async getNew(req, res, next) {
    try {
      const { days = 30, limit = 10 } = req.query;
      const products = await productService.getNewProducts(
        parseInt(days),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/featured
   * Produits mis en avant
   */
  async getFeatured(req, res, next) {
    try {
      const { limit = 8 } = req.query;
      const products = await productService.getFeaturedProducts(parseInt(limit));

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/admin/low-stock
   * Produits en stock faible (admin)
   */
  async getLowStock(req, res, next) {
    try {
      const products = await productService.getLowStockProducts();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ✅ NOUVELLE MÉTHODE: Upload d'image
  // ==========================================

  /**
   * POST /api/products/upload-image
   * Upload d'une image produit
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      // Construire l'URL de l'image
      const imageUrl = `/uploads/products/${req.file.filename}`;

      logger.info(`Image uploadée par ${req.user?.email}: ${req.file.filename}`);

      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        data: {
          imageUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/delete-image/:filename
   * Supprime une image uploadée
   */
  async deleteImage(req, res, next) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Nom de fichier requis'
        });
      }

      // Sécurité : vérifier que le filename ne contient pas de path traversal
      if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({
          success: false,
          message: 'Nom de fichier invalide'
        });
      }

      deleteImage(filename);

      logger.info(`Image supprimée par ${req.user?.email}: ${filename}`);

      res.json({
        success: true,
        message: 'Image supprimée avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products
   * Création d'un produit (admin)
   */
  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);

      logger.info(`Produit créé par ${req.user?.email}: ${product.nom}`);

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: product
      });
    } catch (error) {
      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/products/:id
   * Mise à jour d'un produit (admin)
   * ✅ AJOUT: Suppression de l'ancienne image locale si changement
   */
  async update(req, res, next) {
    try {
      // Récupérer le produit existant pour vérifier l'ancienne image
      const existingProduct = await productService.getProductById(req.params.id);
      
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Si l'image change et que l'ancienne était locale, la supprimer
      if (req.body.imageUrl !== existingProduct.imageUrl && isLocalImage(existingProduct.imageUrl)) {
        const oldFilename = getFilenameFromUrl(existingProduct.imageUrl);
        if (oldFilename) {
          deleteImage(oldFilename);
          logger.info(`Ancienne image supprimée: ${oldFilename}`);
        }
      }

      const product = await productService.updateProduct(req.params.id, req.body);

      logger.info(`Produit mis à jour par ${req.user?.email}: ${product.nom}`);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: product
      });
    } catch (error) {
      if (error.message.includes('existe déjà')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   * Soft delete - désactive un produit (admin)
   */
  async delete(req, res, next) {
    try {
      const product = await productService.deleteProduct(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      logger.info(`Produit désactivé par ${req.user?.email}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Produit désactivé avec succès',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id/hard
   * Hard delete - suppression définitive (admin)
   * ✅ AJOUT: Suppression de l'image locale associée
   */
  async hardDelete(req, res, next) {
    try {
      // Récupérer le produit pour supprimer l'image associée
      const product = await productService.getProductById(req.params.id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Supprimer l'image locale si elle existe
      if (isLocalImage(product.imageUrl)) {
        const filename = getFilenameFromUrl(product.imageUrl);
        if (filename) {
          deleteImage(filename);
        }
      }

      const deleted = await productService.hardDeleteProduct(req.params.id);

      logger.warn(`Produit supprimé définitivement par ${req.user?.email}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Produit supprimé définitivement'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id/stock
   * Mise à jour du stock (admin)
   */
  async updateStock(req, res, next) {
    try {
      const { quantite, operation = 'set' } = req.body;
      const product = await productService.updateStock(
        req.params.id,
        quantite,
        operation
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      logger.info(`Stock mis à jour par ${req.user?.email}: ${product.nom} (${operation} ${quantite})`);

      res.json({
        success: true,
        message: 'Stock mis à jour avec succès',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/bulk
   * Suppression multiple de produits (admin)
   */
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste des IDs requise'
        });
      }

      const results = await productService.deleteMultiple(ids);

      logger.info(`Suppression multiple par ${req.user?.email}: ${results.success.length} produits désactivés`);

      res.json({
        success: true,
        message: `${results.success.length} produit(s) supprimé(s)`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/export
   * Export des produits en JSON
   */
  async exportProducts(req, res, next) {
    try {
      const products = await productService.getAllForExport();

      logger.info(`Export produits par ${req.user?.email}: ${products.length} produits`);

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/import
   * Import de produits depuis JSON
   */
  async importProducts(req, res, next) {
    try {
      const { products, defaultCategoryId } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste des produits requise'
        });
      }

      if (!defaultCategoryId) {
        return res.status(400).json({
          success: false,
          message: 'ID de catégorie par défaut requis (TBD)'
        });
      }

      const results = await productService.importProducts(products, defaultCategoryId);

      logger.info(`Import produits par ${req.user?.email}: ${results.created.length} créés, ${results.errors.length} erreurs`);

      res.json({
        success: true,
        message: `${results.created.length} produit(s) importé(s)`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
