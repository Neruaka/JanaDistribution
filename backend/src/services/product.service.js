/**
 * Service Produits (Backend) - VERSION CORRIGÉE
 * @description Logique métier pour les produits
 * 
 * ✅ CORRECTION: Ajout des options enPromotion, hasPromo, estMisEnAvant
 */

const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../config/logger');

class ProductService {
  /**
   * Récupère la liste des produits avec filtres et pagination
   * 
   * ✅ CORRECTION: Ajout de enPromotion, hasPromo, estMisEnAvant
   */
  async getProducts(options = {}) {
    return productRepository.findAll({
      page: options.page || 1,
      limit: options.limit || 12,
      categorieId: options.categorieId,
      search: options.search || options.q, // Support des 2 noms
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      enStock: options.enStock,
      estActif: options.estActif,  // null = tous, true = actifs, false = inactifs
      enPromotion: options.enPromotion,     // ✅ NOUVEAU
      hasPromo: options.hasPromo,           // ✅ NOUVEAU (alias)
      estMisEnAvant: options.estMisEnAvant, // ✅ NOUVEAU
      labels: options.labels || [],
      orderBy: options.orderBy || 'createdAt',
      orderDir: options.orderDir || 'DESC'
    });
  }

  /**
   * Récupère un produit par ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);
    return product;
  }

  /**
   * Récupère un produit par slug
   */
  async getProductBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    return product;
  }

  /**
   * Récupère les produits en promotion
   */
  async getPromos(limit = 100) {
    return productRepository.findPromos(limit);
  }

  /**
   * Récupère les nouveaux produits
   */
  async getNewProducts(days = 30, limit = 10) {
    return productRepository.findNew(days, limit);
  }

  /**
   * Récupère les produits mis en avant
   */
  async getFeaturedProducts(limit = 8) {
    // Utiliser findAll avec le filtre estMisEnAvant
    const result = await productRepository.findAll({
      estMisEnAvant: true,
      estActif: true,
      limit
    });
    return result.products;
  }

  /**
   * Récupère les produits en stock faible
   */
  async getLowStockProducts() {
    return productRepository.findLowStock();
  }

  /**
   * Crée un nouveau produit
   */
  async createProduct(data) {
    // Vérifier que la catégorie existe
    if (data.categorieId) {
      const category = await categoryRepository.findById(data.categorieId);
      if (!category) {
        throw new Error('Catégorie non trouvée');
      }
    }

    // Vérifier l'unicité de la référence
    const existingRef = await productRepository.findByReference(data.reference);
    if (existingRef) {
      throw new Error('Cette référence existe déjà');
    }

    // Générer le slug si non fourni
    if (!data.slug) {
      data.slug = this.generateSlug(data.nom);
    }

    // Créer le produit
    const product = await productRepository.create(data);

    logger.info(`Produit créé: ${product.nom} (${product.reference})`);
    return product;
  }

  /**
   * Met à jour un produit
   */
  async updateProduct(id, data) {
    // Vérifier que le produit existe
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      return null;
    }

    // Vérifier la catégorie si fournie
    if (data.categorieId) {
      const category = await categoryRepository.findById(data.categorieId);
      if (!category) {
        throw new Error('Catégorie non trouvée');
      }
    }

    // Vérifier l'unicité de la référence si modifiée
    if (data.reference && data.reference !== existingProduct.reference) {
      const existingRef = await productRepository.referenceExists(data.reference, id);
      if (existingRef) {
        throw new Error('Cette référence existe déjà');
      }
    }

    // Générer le slug si le nom change et pas de nouveau slug fourni
    if (data.nom && !data.slug) {
      data.slug = this.generateSlug(data.nom);
    }

    // Mettre à jour
    const product = await productRepository.update(id, data);

    logger.info(`Produit mis à jour: ${product.nom} (${product.id})`);
    return product;
  }

  /**
   * Soft delete - désactive un produit
   */
  async deleteProduct(id) {
    const product = await productRepository.delete(id);
    if (product) {
      logger.info(`Produit désactivé: ${id}`);
    }
    return product;
  }

  /**
   * Hard delete - supprime définitivement
   */
  async hardDeleteProduct(id) {
    const deleted = await productRepository.hardDelete(id);
    if (deleted) {
      logger.warn(`Produit supprimé définitivement: ${id}`);
    }
    return deleted;
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateStock(id, quantite, operation = 'set') {
    const product = await productRepository.updateStock(id, quantite, operation);
    
    if (product) {
      // Vérifier si stock faible
      if (product.stockQuantite <= product.stockMinAlerte) {
        logger.warn(`Stock faible pour ${product.nom}: ${product.stockQuantite}/${product.stockMinAlerte}`);
      }
    }

    return product;
  }

  /**
   * Génère un slug à partir d'un nom
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Supprime les tirets multiples
      .replace(/^-|-$/g, ''); // Supprime les tirets en début/fin
  }

  /**
   * Compte les produits par catégorie
   */
  async countByCategory() {
    return productRepository.countByCategory();
  }
}

module.exports = new ProductService();
