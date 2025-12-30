/**
 * Service Produits (Backend) - VERSION COMPLÈTE
 * @description Logique métier pour les produits
 * @location backend/src/services/product.service.js
 * 
 * ✅ AJOUTS:
 * - getAllForExport : Export de tous les produits
 * - importProducts : Import depuis Excel
 * - bulkDelete : Suppression multiple
 */

const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../config/logger');

class ProductService {
  /**
   * Récupère la liste des produits avec filtres et pagination
   */
  async getProducts(options = {}) {
    return productRepository.findAll({
      page: options.page || 1,
      limit: options.limit || 12,
      categorieId: options.categorieId,
      search: options.search,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      enStock: options.enStock,
      estActif: options.estActif,
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
  async getPromos() {
    return productRepository.findPromos();
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
    return productRepository.findFeatured(limit);
  }

  /**
   * Récupère les produits en stock faible
   */
  async getLowStockProducts() {
    return productRepository.findLowStock();
  }

  /**
   * ✅ NOUVEAU: Récupère TOUS les produits pour export Excel
   * Sans pagination, avec catégorie
   */
  async getAllForExport() {
    const result = await productRepository.findAll({
      page: 1,
      limit: 10000, // Grosse limite pour tout récupérer
      estActif: null // Tous les produits (actifs et inactifs)
    });

    // Transformer les données pour l'export
    return result.products.map(p => ({
      reference: p.reference,
      nom: p.nom,
      categorie: p.categorie?.nom || '',
      origine: p.origine || '',
      prix: p.prix,
      prixPromo: p.prixPromo || '',
      description: p.description || '',
      uniteMesure: p.uniteMesure || 'kg',
      stockQuantite: p.stockQuantite,
      estActif: p.estActif ? 'Oui' : 'Non'
    }));
  }

  /**
   * ✅ NOUVEAU: Import de produits depuis Excel
   * @param {Array} products - Liste des produits à importer
   * @param {string} defaultCategoryId - ID de la catégorie par défaut
   */
  async importProducts(products, defaultCategoryId) {
    const results = {
      created: [],
      updated: [],
      errors: []
    };

    // Charger toutes les catégories une fois
    const categoriesResult = await categoryRepository.findAll({ includeInactive: true });
    const categories = categoriesResult || [];
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.nom.toLowerCase(), cat.id);
    });

    for (const product of products) {
      try {
        // Déterminer la catégorie
        let categorieId = defaultCategoryId;
        if (product.categorie) {
          const foundCatId = categoryMap.get(product.categorie.toLowerCase());
          if (foundCatId) {
            categorieId = foundCatId;
          }
        }

        // Vérifier si le produit existe déjà (par référence)
        const existing = await productRepository.findByReference(product.reference);

        const productData = {
          reference: product.reference,
          nom: product.nom,
          description: product.description || '',
          prix: parseFloat(product.prix) || 0,
          categorieId,
          origine: product.origine || '',
          uniteMesure: product.uniteMesure || 'kg',
          stockQuantite: parseInt(product.stockQuantite) || 100,
          stockMinAlerte: 10,
          estActif: true,
          slug: this.generateSlug(product.nom)
        };

        if (existing) {
          // Mettre à jour
          const updated = await productRepository.update(existing.id, productData);
          results.updated.push(updated);
        } else {
          // Créer
          const created = await productRepository.create(productData);
          results.created.push(created);
        }
      } catch (error) {
        logger.error(`Erreur import produit ${product.reference}: ${error.message}`);
        results.errors.push({
          reference: product.reference,
          nom: product.nom,
          error: error.message
        });
      }
    }

    logger.info(`Import terminé: ${results.created.length} créés, ${results.updated.length} mis à jour, ${results.errors.length} erreurs`);
    return results;
  }

  /**
   * ✅ NOUVEAU: Suppression multiple de produits
   * @param {Array} ids - Liste des IDs à supprimer
   */
  async bulkDelete(ids) {
    const results = {
      success: [],
      errors: []
    };

    for (const id of ids) {
      try {
        const product = await productRepository.delete(id);
        if (product) {
          results.success.push({ id, nom: product.nom });
        } else {
          results.errors.push({ id, error: 'Produit non trouvé' });
        }
      } catch (error) {
        logger.error(`Erreur suppression produit ${id}: ${error.message}`);
        results.errors.push({ id, error: error.message });
      }
    }

    logger.info(`Suppression en masse: ${results.success.length} supprimés, ${results.errors.length} erreurs`);
    return results;
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
