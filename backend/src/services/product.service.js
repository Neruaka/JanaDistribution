/**
 * Service Produits (Backend)
 * @description Logique mÃ©tier pour les produits
 */

const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const logger = require('../config/logger');

class ProductService {
  /**
   * RÃ©cupÃ¨re la liste des produits avec filtres et pagination
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
      estActif: options.estActif,  // null = tous, true = actifs, false = inactifs
      labels: options.labels || [],
      orderBy: options.orderBy || 'createdAt',
      orderDir: options.orderDir || 'DESC'
    });
  }

  /**
   * RÃ©cupÃ¨re un produit par ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);
    return product;
  }

  /**
   * RÃ©cupÃ¨re un produit par slug
   */
  async getProductBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    return product;
  }

  /**
   * RÃ©cupÃ¨re les produits en promotion
   */
  async getPromos() {
    return productRepository.findPromos();
  }

  /**
   * RÃ©cupÃ¨re les nouveaux produits
   */
  async getNewProducts(days = 30, limit = 10) {
    return productRepository.findNew(days, limit);
  }

  /**
   * RÃ©cupÃ¨re les produits mis en avant
   */
  async getFeaturedProducts(limit = 8) {
    return productRepository.findFeatured(limit);
  }

  /**
   * RÃ©cupÃ¨re les produits en stock faible
   */
  async getLowStockProducts() {
    return productRepository.findLowStock();
  }

  /**
   * CrÃ©e un nouveau produit
   */
  async createProduct(data) {
    // VÃ©rifier que la catÃ©gorie existe
    if (data.categorieId) {
      const category = await categoryRepository.findById(data.categorieId);
      if (!category) {
        throw new Error('CatÃ©gorie non trouvÃ©e');
      }
    }

    // VÃ©rifier l'unicitÃ© de la rÃ©fÃ©rence
    const existingRef = await productRepository.findByReference(data.reference);
    if (existingRef) {
      throw new Error('Cette rÃ©fÃ©rence existe dÃ©jÃ ');
    }

    // GÃ©nÃ©rer le slug si non fourni
    if (!data.slug) {
      data.slug = this.generateSlug(data.nom);
    }

    // CrÃ©er le produit
    const product = await productRepository.create(data);

    logger.info(`Produit crÃ©Ã©: ${product.nom} (${product.reference})`);
    return product;
  }

  /**
   * Met Ã  jour un produit
   */
  async updateProduct(id, data) {
    // VÃ©rifier que le produit existe
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      return null;
    }

    // VÃ©rifier la catÃ©gorie si fournie
    if (data.categorieId) {
      const category = await categoryRepository.findById(data.categorieId);
      if (!category) {
        throw new Error('CatÃ©gorie non trouvÃ©e');
      }
    }

    // VÃ©rifier l'unicitÃ© de la rÃ©fÃ©rence si modifiÃ©e
    if (data.reference && data.reference !== existingProduct.reference) {
      const existingRef = await productRepository.referenceExists(data.reference, id);
      if (existingRef) {
        throw new Error('Cette rÃ©fÃ©rence existe dÃ©jÃ ');
      }
    }

    // GÃ©nÃ©rer le slug si le nom change et pas de nouveau slug fourni
    if (data.nom && !data.slug) {
      data.slug = this.generateSlug(data.nom);
    }

    // Mettre Ã  jour
    const product = await productRepository.update(id, data);

    logger.info(`Produit mis Ã  jour: ${product.nom} (${product.id})`);
    return product;
  }

  /**
   * Soft delete - dÃ©sactive un produit
   */
  async deleteProduct(id) {
    const product = await productRepository.delete(id);
    if (product) {
      logger.info(`Produit dÃ©sactivÃ©: ${id}`);
    }
    return product;
  }

  /**
   * Hard delete - supprime dÃ©finitivement
   */
  async hardDeleteProduct(id) {
    const deleted = await productRepository.hardDelete(id);
    if (deleted) {
      logger.warn(`Produit supprimÃ© dÃ©finitivement: ${id}`);
    }
    return deleted;
  }

  /**
   * Met Ã  jour le stock d'un produit
   */
  async updateStock(id, quantite, operation = 'set') {
    const product = await productRepository.updateStock(id, quantite, operation);
    
    if (product) {
      // VÃ©rifier si stock faible
      if (product.stockQuantite <= product.stockMinAlerte) {
        logger.warn(`Stock faible pour ${product.nom}: ${product.stockQuantite}/${product.stockMinAlerte}`);
      }
    }

    return product;
  }

  /**
   * GÃ©nÃ¨re un slug Ã  partir d'un nom
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractÃ¨res spÃ©ciaux
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Supprime les tirets multiples
      .replace(/^-|-$/g, ''); // Supprime les tirets en dÃ©but/fin
  }

  /**
   * Compte les produits par catÃ©gorie
   */
  async countByCategory() {
    return productRepository.countByCategory();
  }

  /**
   * Suppression multiple de produits (soft delete)
   * @param {Array} ids - Liste des UUIDs à supprimer
   */
  async deleteMultiple(ids) {
    const results = {
      success: [],
      errors: []
    };

    for (const id of ids) {
      try {
        const product = await productRepository.delete(id);
        if (product) {
          results.success.push(id);
          logger.info(`Produit désactivé: ${id}`);
        } else {
          results.errors.push({ id, reason: 'Non trouvé' });
        }
      } catch (error) {
        results.errors.push({ id, reason: error.message });
      }
    }

    return results;
  }

  /**
   * Récupère tous les produits pour export (sans pagination)
   */
  async getAllForExport() {
    return productRepository.findAllForExport();
  }

  /**
   * Import de produits depuis des données
   * @param {Array} products - Liste des produits à importer
   * @param {string} defaultCategoryId - ID de la catégorie par défaut (TBD)
   */
  async importProducts(products, defaultCategoryId) {
    const results = {
      created: [],
      errors: []
    };

    for (const productData of products) {
      try {
        // Chercher la catégorie par nom
        let categoryId = defaultCategoryId;
        if (productData.categorie) {
          const category = await categoryRepository.findByName(productData.categorie);
          if (category) {
            categoryId = category.id;
          }
        }

        // Préparer les données du produit
        const data = {
          reference: productData.reference,
          nom: productData.nom,
          slug: this.generateSlug(productData.nom),
          description: productData.description || '',
          prix: parseFloat(productData.prix) || 0,
          uniteMesure: productData.uniteMesure || 'kg',
          origine: productData.origine || '',
          categorieId: categoryId,
          stockQuantite: 0,
          stockMinAlerte: 10,
          tauxTva: 5.50,
          estActif: true,
          estMisEnAvant: false,
          labels: []
        };

        // Vérifier si la référence existe déjà
        const existing = await productRepository.findByReference(data.reference);
        if (existing) {
          results.errors.push({ 
            reference: data.reference, 
            nom: data.nom,
            reason: 'Référence déjà existante' 
          });
          continue;
        }

        // Créer le produit
        const product = await productRepository.create(data);
        results.created.push({
          id: product.id,
          reference: product.reference,
          nom: product.nom
        });

        logger.info(`Produit importé: ${product.nom} (${product.reference})`);
      } catch (error) {
        results.errors.push({
          reference: productData.reference,
          nom: productData.nom,
          reason: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new ProductService();