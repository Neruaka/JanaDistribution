/**
 * Controller Produits - CORRIGÃ‰
 * @description Gestion des requÃªtes HTTP pour les produits
 * 
 * âœ… CORRECTIONS:
 * - Ajout paramÃ¨tre estActif dans getAll (all = tous, true = actifs, false = inactifs)
 */

const productService = require('../services/product.service');
const logger = require('../config/logger');

class ProductController {
  /**
   * GET /api/products
   * Liste des produits avec filtres et pagination
   * âœ… CORRIGÃ‰ : Ajout paramÃ¨tre estActif
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
        estActif,  // âœ… AJOUTÃ‰ : 'all' = tous, 'true' = actifs, 'false' = inactifs
        orderBy,
        orderDir,
        labels
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50), // Max 50 par page
        categorieId,
        search,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        enStock: enStock === 'true' ? true : enStock === 'false' ? false : null,
        // âœ… AJOUTÃ‰ : gestion du filtre actif/inactif
        // 'all' ou non dÃ©fini cÃ´tÃ© admin = null (tous)
        // 'true' = seulement actifs (dÃ©faut pour clients)
        // 'false' = seulement inactifs
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
   * DÃ©tail d'un produit par ID
   */
  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvÃ©'
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
   * DÃ©tail d'un produit par slug
   */
  async getBySlug(req, res, next) {
    try {
      const product = await productService.getProductBySlug(req.params.slug);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvÃ©'
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
          message: 'Le terme de recherche doit contenir au moins 2 caractÃ¨res'
        });
      }

      const result = await productService.getProducts({
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        search: q.trim(),
        estActif: true  // Recherche publique = que les actifs
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
   * POST /api/products
   * CrÃ©ation d'un produit (admin)
   */
  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);

      logger.info(`Produit crÃ©Ã© par ${req.user?.email}: ${product.nom}`);

      res.status(201).json({
        success: true,
        message: 'Produit crÃ©Ã© avec succÃ¨s',
        data: product
      });
    } catch (error) {
      if (error.message.includes('existe dÃ©jÃ ')) {
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
   * Mise Ã  jour d'un produit (admin)
   */
  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvÃ©'
        });
      }

      logger.info(`Produit mis Ã  jour par ${req.user?.email}: ${product.nom}`);

      res.json({
        success: true,
        message: 'Produit mis Ã  jour avec succÃ¨s',
        data: product
      });
    } catch (error) {
      if (error.message.includes('existe dÃ©jÃ ')) {
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
   * Soft delete - dÃ©sactive un produit (admin)
   */
  async delete(req, res, next) {
    try {
      const product = await productService.deleteProduct(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvÃ©'
        });
      }

      logger.info(`Produit dÃ©sactivÃ© par ${req.user?.email}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Produit dÃ©sactivÃ© avec succÃ¨s',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id/hard
   * Hard delete - suppression dÃ©finitive (admin)
   */
  async hardDelete(req, res, next) {
    try {
      const deleted = await productService.hardDeleteProduct(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvÃ©'
        });
      }

      logger.warn(`Produit supprimÃ© dÃ©finitivement par ${req.user?.email}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Produit supprimÃ© dÃ©finitivement'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id/stock
   * Mise Ã  jour du stock (admin)
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
          message: 'Produit non trouvÃ©'
        });
      }

      logger.info(`Stock mis Ã  jour par ${req.user?.email}: ${product.nom} (${operation} ${quantite})`);

      res.json({
        success: true,
        message: 'Stock mis Ã  jour avec succÃ¨s',
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
   * Export des produits en JSON (pour conversion Excel côté client)
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
