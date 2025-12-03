/**
 * Service Produits
 * @description Logique métier pour les produits
 */

const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../config/logger');
const { ApiError } = require('../middlewares/errorHandler');

class ProductService {
  /**
   * Récupère la liste des produits avec filtres
   */
  async getProducts(options = {}) {
    return productRepository.findAll(options);
  }

  /**
   * Récupère un produit par ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);
    
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }

    return product;
  }

  /**
   * Récupère un produit par slug
   */
  async getProductBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }

    return product;
  }

  /**
   * Crée un nouveau produit
   */
  async createProduct(data) {
    // Vérifier que la référence est unique
    const referenceExists = await productRepository.referenceExists(data.reference);
    if (referenceExists) {
      throw ApiError.conflict('Cette référence produit existe déjà');
    }

    // Générer le slug si non fourni
    if (!data.slug) {
      data.slug = this.generateSlug(data.nom);
    }

    // Vérifier que le slug est unique
    let slugExists = await productRepository.slugExists(data.slug);
    let slugSuffix = 1;
    while (slugExists) {
      data.slug = `${this.generateSlug(data.nom)}-${slugSuffix}`;
      slugExists = await productRepository.slugExists(data.slug);
      slugSuffix++;
    }

    // Vérifier que la catégorie existe
    if (data.categorieId) {
      const category = await categoryRepository.findById(data.categorieId);
      if (!category) {
        throw ApiError.badRequest('Catégorie non trouvée');
      }
    }

    // Valider le prix
    if (data.prix <= 0) {
      throw ApiError.badRequest('Le prix doit être supérieur à 0');
    }

    // Valider le prix promo
    if (data.prixPromo && data.prixPromo >= data.prix) {
      throw ApiError.badRequest('Le prix promo doit être inférieur au prix normal');
    }

    return productRepository.create(data);
  }

  /**
   * Met à jour un produit
   */
  async updateProduct(id, data) {
    // Vérifier que le produit existe
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      throw ApiError.notFound('Produit non trouvé');
    }

    // Vérifier l'unicité du slug si modifié
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await productRepository.slugExists(data.slug, id);
      if (slugExists) {
        throw ApiError.conflict('Ce slug est déjà utilisé');
      }
    }

    // Vérifier la catégorie si modifiée
    if (data.categorieId && data.categorieId !== existingProduct.categorieId) {
      const category = await categoryRepository.findById(data.categorieId);
      if (!category) {
        throw ApiError.badRequest('Catégorie non trouvée');
      }
    }

    // Valider le prix promo
    const newPrix = data.prix || existingProduct.prix;
    if (data.prixPromo && data.prixPromo >= newPrix) {
      throw ApiError.badRequest('Le prix promo doit être inférieur au prix normal');
    }

    return productRepository.update(id, data);
  }

  /**
   * Supprime un produit (soft delete)
   */
  async deleteProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }

    return productRepository.delete(id);
  }

  /**
   * Supprime définitivement un produit
   */
  async hardDeleteProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }

    return productRepository.hardDelete(id);
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateStock(id, quantite, operation = 'set') {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Produit non trouvé');
    }

    if (quantite < 0 && operation === 'set') {
      throw ApiError.badRequest('La quantité ne peut pas être négative');
    }

    if (operation === 'subtract' && quantite > product.stockQuantite) {
      throw ApiError.badRequest('Stock insuffisant');
    }

    return productRepository.updateStock(id, quantite, operation);
  }

  /**
   * Récupère les produits avec stock faible
   */
  async getLowStockProducts() {
    return productRepository.findLowStock();
  }

  /**
   * Récupère les produits en promotion
   */
  async getPromoProducts() {
    return productRepository.findPromos();
  }

  /**
   * Récupère les nouveautés
   */
  async getNewProducts(days = 30, limit = 10) {
    return productRepository.findNew(days, limit);
  }

  /**
   * Récupère les produits d'une catégorie
   */
  async getProductsByCategory(categorieId, options = {}) {
    const category = await categoryRepository.findById(categorieId);
    if (!category) {
      throw ApiError.notFound('Catégorie non trouvée');
    }

    return productRepository.findAll({ ...options, categorieId });
  }

  /**
   * Recherche de produits
   */
  async searchProducts(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.length < 2) {
      throw ApiError.badRequest('Le terme de recherche doit contenir au moins 2 caractères');
    }

    return productRepository.findAll({ ...options, search: searchTerm });
  }

  /**
   * Génère un slug à partir d'un nom
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]+/g, '-')     // Remplace les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, '')         // Supprime les tirets en début/fin
      .substring(0, 100);              // Limite la longueur
  }
}

module.exports = new ProductService();
