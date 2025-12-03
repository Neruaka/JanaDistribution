/**
 * Controller Produits
 * @description Gestion des requêtes HTTP pour les produits
 */

const productService = require('../services/product.service');
const logger = require('../config/logger');

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

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/promos
   * Liste des produits en promotion
   */
  async getPromos(req, res, next) {
    try {
      const products = await productService.getPromoProducts();

      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/new
   * Liste des nouveaux produits
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
        data: products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/low-stock
   * Liste des produits avec stock faible (admin)
   */
  async getLowStock(req, res, next) {
    try {
      const products = await productService.getLowStockProducts();

      res.json({
        success: true,
        data: products,
        count: products.length
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
      const { q, ...options } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche doit contenir au moins 2 caractères'
        });
      }

      const result = await productService.searchProducts(q, {
        page: parseInt(options.page) || 1,
        limit: parseInt(options.limit) || 12
      });

      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        searchTerm: q
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products
   * Créer un nouveau produit (admin)
   */
  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id
   * Mettre à jour un produit (admin)
   */
  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id/stock
   * Mettre à jour le stock d'un produit (admin)
   */
  async updateStock(req, res, next) {
    try {
      const { quantite, operation = 'set' } = req.body;

      if (quantite === undefined) {
        return res.status(400).json({
          success: false,
          message: 'La quantité est obligatoire'
        });
      }

      const product = await productService.updateStock(
        req.params.id,
        parseInt(quantite),
        operation
      );

      res.json({
        success: true,
        message: 'Stock mis à jour avec succès',
        data: {
          id: product.id,
          nom: product.nom,
          stockQuantite: product.stockQuantite
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   * Supprimer un produit - soft delete (admin)
   */
  async delete(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);

      res.json({
        success: true,
        message: 'Produit désactivé avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id/hard
   * Supprimer définitivement un produit (admin)
   */
  async hardDelete(req, res, next) {
    try {
      await productService.hardDeleteProduct(req.params.id);

      res.json({
        success: true,
        message: 'Produit supprimé définitivement'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
