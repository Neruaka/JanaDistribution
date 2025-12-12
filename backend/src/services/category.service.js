/**
 * Service Catégories
 * @description Logique métier pour les catégories
 */

const categoryRepository = require('../repositories/category.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class CategoryService {
  /**
   * Récupère toutes les catégories
   */
  async getCategories(options = {}) {
    return categoryRepository.findAll({
      includeProductCount: options.includeProductCount,
      estActif: options.estActif !== undefined ? options.estActif : true
    });
  }

  /**
   * Récupère une catégorie par ID
   */
  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    
    if (!category) {
      throw ApiError.notFound('Catégorie non trouvée');
    }

    return category;
  }

  /**
   * Récupère une catégorie par slug
   */
  async getCategoryBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);
    
    if (!category) {
      throw ApiError.notFound('Catégorie non trouvée');
    }

    return category;
  }

  /**
   * Crée une nouvelle catégorie
   */
  async createCategory(data) {
    // Générer le slug si non fourni
    if (!data.slug) {
      data.slug = this.generateSlug(data.nom);
    }

    // Vérifier que le slug est unique
    let slugExists = await categoryRepository.slugExists(data.slug);
    let slugSuffix = 1;
    while (slugExists) {
      data.slug = `${this.generateSlug(data.nom)}-${slugSuffix}`;
      slugExists = await categoryRepository.slugExists(data.slug);
      slugSuffix++;
    }

    return categoryRepository.create(data);
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(id, data) {
    // Vérifier que la catégorie existe
    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      throw ApiError.notFound('Catégorie non trouvée');
    }

    // Vérifier l'unicité du slug si modifié
    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await categoryRepository.slugExists(data.slug, id);
      if (slugExists) {
        throw ApiError.conflict('Ce slug est déjà utilisé');
      }
    }

    return categoryRepository.update(id, data);
  }

  /**
   * Supprime une catégorie (soft delete)
   */
  async deleteCategory(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound('Catégorie non trouvée');
    }

    // Vérifier si la catégorie a des produits actifs
    const hasProducts = await categoryRepository.hasProducts(id);
    if (hasProducts) {
      throw ApiError.badRequest(
        'Impossible de supprimer cette catégorie car elle contient des produits actifs. ' +
        'Déplacez ou supprimez d\'abord les produits.'
      );
    }

    return categoryRepository.delete(id);
  }

  /**
   * Réorganise l'ordre des catégories
   */
  async reorderCategories(orderedIds) {
    // Vérifier que tous les IDs existent
    const categories = await categoryRepository.findAll({ estActif: null });
    const existingIds = categories.map(c => c.id);
    
    for (const id of orderedIds) {
      if (!existingIds.includes(id)) {
        throw ApiError.badRequest(`Catégorie ${id} non trouvée`);
      }
    }

    return categoryRepository.reorder(orderedIds);
  }

  /**
   * Active/désactive une catégorie
   */
  async toggleActive(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound('Catégorie non trouvée');
    }

    return categoryRepository.toggleActive(id);
  }

  /**
   * Génère un slug à partir d'un nom
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}

module.exports = new CategoryService();
