/**
 * Controller Produits - VERSION COMPLÈTE
 * @description Gestion des requêtes HTTP pour les produits
 * @location backend/src/controllers/product.controller.js
 * 
 * ✅ AJOUTS:
 * - exportAll : Export de tous les produits
 * - importProducts : Import depuis Excel
 * - bulkDelete : Suppression multiple
 */

const productService = require('../services/product.service');
const logger = require('../config/logger');
const { deleteImage } = require('../middlewares/upload.middleware');

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
        orderBy,
        orderDir,
        labels
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        categorieId,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        enStock: enStock === 'true' ? true : enStock === 'false' ? false : null,
        estActif: estActif === 'all' ? null : estActif === 'false' ? false : estActif === 'true' ? true : true,
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

  /**
   * GET /api/products/admin/export
   * ✅ NOUVEAU: Export de tous les produits pour Excel
   */
  async exportAll(req, res, next) {
    try {
      const products = await productService.getAllForExport();

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/admin/import
   * ✅ NOUVEAU: Import de produits depuis Excel
   */
  async importProducts(req, res, next) {
    try {
      const { products, defaultCategoryId } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucun produit à importer'
        });
      }

      if (!defaultCategoryId) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie par défaut requise'
        });
      }

      const result = await productService.importProducts(products, defaultCategoryId);

      logger.info(`Import de ${result.created.length} produits par ${req.user?.email}`);

      res.json({
        success: true,
        message: `${result.created.length} produit(s) importé(s)`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/admin/bulk-delete
   * ✅ NOUVEAU: Suppression multiple de produits
   */
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucun produit à supprimer'
        });
      }

      const result = await productService.bulkDelete(ids);

      logger.info(`Suppression en masse de ${result.success.length} produits par ${req.user?.email}`);

      res.json({
        success: true,
        message: `${result.success.length} produit(s) supprimé(s)`,
        data: result
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
   */
  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

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
   */
  async hardDelete(req, res, next) {
    try {
      const deleted = await productService.hardDeleteProduct(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

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
   * POST /api/products/upload-image
   * Upload d'une image produit (admin)
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier uploadé'
        });
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;

      logger.info(`Image uploadée par ${req.user?.email}: ${req.file.filename}`);

      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        data: {
          imageUrl,
          filename: req.file.filename
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/image/:filename
   * Supprime une image produit (admin)
   */
  async deleteProductImage(req, res, next) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Nom de fichier requis'
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
}

module.exports = new ProductController();
