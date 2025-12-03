/**
 * Controller Catégories
 * @description Gestion des requêtes HTTP pour les catégories
 */

const categoryService = require('../services/category.service');
const logger = require('../config/logger');

class CategoryController {
  /**
   * GET /api/categories
   * Liste de toutes les catégories
   */
  async getAll(req, res, next) {
    try {
      const { includeProductCount = 'true' } = req.query;

      const categories = await categoryService.getCategories({
        includeProductCount: includeProductCount === 'true'
      });

      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:id
   * Détail d'une catégorie par ID
   */
  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/slug/:slug
   * Détail d'une catégorie par slug
   */
  async getBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories
   * Créer une nouvelle catégorie (admin)
   */
  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/categories/:id
   * Mettre à jour une catégorie (admin)
   */
  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/categories/:id
   * Supprimer une catégorie (admin)
   */
  async delete(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);

      res.json({
        success: true,
        message: 'Catégorie supprimée avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/categories/reorder
   * Réorganiser l'ordre des catégories (admin)
   */
  async reorder(req, res, next) {
    try {
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Un tableau d\'IDs ordonnés est requis'
        });
      }

      await categoryService.reorderCategories(orderedIds);

      res.json({
        success: true,
        message: 'Ordre des catégories mis à jour'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
