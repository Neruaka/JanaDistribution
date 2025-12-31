/**
 * Tests Unitaires - ProductService
 * @description Tests du service de gestion des produits
 */

// Mock des dépendances AVANT d'importer le service
jest.mock('../../src/repositories/product.repository');
jest.mock('../../src/repositories/category.repository');

// Import après les mocks
const productService = require('../../src/services/product.service');
const productRepository = require('../../src/repositories/product.repository');
const categoryRepository = require('../../src/repositories/category.repository');

describe('ProductService', () => {
  // =============================================
  // SETUP & TEARDOWN
  // =============================================
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // DONNÉES DE TEST
  // =============================================
  const validProduct = {
    id: '323e4567-e89b-12d3-a456-426614174000',
    categorieId: '223e4567-e89b-12d3-a456-426614174000',
    reference: 'FRL-0001',
    nom: 'Pommes Gala Bio',
    slug: 'pommes-gala-bio',
    description: 'Pommes biologiques',
    prix: 3.50,
    prixPromo: null,
    tauxTva: 5.50,
    uniteMesure: 'kg',
    stockQuantite: 100,
    stockMinAlerte: 10,
    estActif: true,
    estMisEnAvant: true
  };

  const validCategory = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    nom: 'Fruits & Légumes',
    slug: 'fruits-legumes',
    estActif: true
  };

  // =============================================
  // TESTS: LISTE DES PRODUITS (getProducts)
  // =============================================
  describe('getProducts()', () => {
    it('devrait retourner la liste des produits avec pagination', async () => {
      // Arrange
      const mockResult = {
        data: [validProduct],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1
        }
      };
      productRepository.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await productService.getProducts({ page: 1, limit: 12 });

      // Assert
      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 12
        })
      );
      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
    });

    it('devrait utiliser les valeurs par défaut si non spécifiées', async () => {
      // Arrange
      productRepository.findAll.mockResolvedValue({ data: [], pagination: {} });

      // Act
      await productService.getProducts();

      // Assert
      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 12,
          orderBy: 'createdAt',
          orderDir: 'DESC'
        })
      );
    });

    it('devrait filtrer par catégorie', async () => {
      // Arrange
      productRepository.findAll.mockResolvedValue({ data: [], pagination: {} });
      const categorieId = '223e4567-e89b-12d3-a456-426614174000';

      // Act
      await productService.getProducts({ categorieId });

      // Assert
      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          categorieId
        })
      );
    });

    it('devrait filtrer par prix min/max', async () => {
      // Arrange
      productRepository.findAll.mockResolvedValue({ data: [], pagination: {} });

      // Act
      await productService.getProducts({ minPrice: 5, maxPrice: 20 });

      // Assert
      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: 5,
          maxPrice: 20
        })
      );
    });

    it('devrait filtrer par recherche textuelle', async () => {
      // Arrange
      productRepository.findAll.mockResolvedValue({ data: [], pagination: {} });

      // Act
      await productService.getProducts({ search: 'pommes' });

      // Assert
      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'pommes'
        })
      );
    });

    it('devrait filtrer par disponibilité en stock', async () => {
      // Arrange
      productRepository.findAll.mockResolvedValue({ data: [], pagination: {} });

      // Act
      await productService.getProducts({ enStock: true });

      // Assert
      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          enStock: true
        })
      );
    });
  });

  // =============================================
  // TESTS: PRODUIT PAR ID (getProductById)
  // =============================================
  describe('getProductById()', () => {
    it('devrait retourner un produit par son ID', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(validProduct);

      // Act
      const result = await productService.getProductById(validProduct.id);

      // Assert
      expect(productRepository.findById).toHaveBeenCalledWith(validProduct.id);
      expect(result.id).toBe(validProduct.id);
      expect(result.nom).toBe(validProduct.nom);
    });

    it('devrait retourner null si le produit n\'existe pas', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(null);

      // Act
      const result = await productService.getProductById('uuid-inexistant');

      // Assert
      expect(result).toBeNull();
    });
  });

  // =============================================
  // TESTS: PRODUIT PAR SLUG (getProductBySlug)
  // =============================================
  describe('getProductBySlug()', () => {
    it('devrait retourner un produit par son slug', async () => {
      // Arrange
      productRepository.findBySlug.mockResolvedValue(validProduct);

      // Act
      const result = await productService.getProductBySlug('pommes-gala-bio');

      // Assert
      expect(productRepository.findBySlug).toHaveBeenCalledWith('pommes-gala-bio');
      expect(result.slug).toBe('pommes-gala-bio');
    });

    it('devrait retourner null si le slug n\'existe pas', async () => {
      // Arrange
      productRepository.findBySlug.mockResolvedValue(null);

      // Act
      const result = await productService.getProductBySlug('slug-inexistant');

      // Assert
      expect(result).toBeNull();
    });
  });

  // =============================================
  // TESTS: PRODUITS EN PROMOTION (getPromos)
  // =============================================
  describe('getPromos()', () => {
    it('devrait retourner les produits en promotion', async () => {
      // Arrange
      const promoProducts = [{ ...validProduct, prixPromo: 2.99 }];
      productRepository.findPromos.mockResolvedValue(promoProducts);

      // Act
      const result = await productService.getPromos();

      // Assert
      expect(productRepository.findPromos).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].prixPromo).toBe(2.99);
    });
  });

  // =============================================
  // TESTS: NOUVEAUX PRODUITS (getNewProducts)
  // =============================================
  describe('getNewProducts()', () => {
    it('devrait retourner les nouveaux produits', async () => {
      // Arrange
      productRepository.findNew.mockResolvedValue([validProduct]);

      // Act
      const result = await productService.getNewProducts(30, 10);

      // Assert
      expect(productRepository.findNew).toHaveBeenCalledWith(30, 10);
      expect(result).toHaveLength(1);
    });

    it('devrait utiliser les valeurs par défaut', async () => {
      // Arrange
      productRepository.findNew.mockResolvedValue([]);

      // Act
      await productService.getNewProducts();

      // Assert
      expect(productRepository.findNew).toHaveBeenCalledWith(30, 10);
    });
  });

  // =============================================
  // TESTS: CRÉATION DE PRODUIT (createProduct)
  // =============================================
  describe('createProduct()', () => {
    const newProductData = {
      categorieId: '223e4567-e89b-12d3-a456-426614174000',
      reference: 'FRL-0002',
      nom: 'Oranges Bio',
      prix: 4.50,
      stockQuantite: 50
    };

    it('devrait créer un produit avec succès', async () => {
      // Arrange
      categoryRepository.findById.mockResolvedValue(validCategory);
      productRepository.findByReference.mockResolvedValue(null);
      productRepository.create.mockResolvedValue({
        id: 'new-uuid',
        ...newProductData,
        slug: 'oranges-bio'
      });

      // Act
      const result = await productService.createProduct(newProductData);

      // Assert
      expect(categoryRepository.findById).toHaveBeenCalledWith(newProductData.categorieId);
      expect(productRepository.findByReference).toHaveBeenCalledWith(newProductData.reference);
      expect(productRepository.create).toHaveBeenCalled();
      expect(result.nom).toBe(newProductData.nom);
    });

    it('devrait rejeter si la catégorie n\'existe pas', async () => {
      // Arrange
      categoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.createProduct(newProductData))
        .rejects
        .toThrow('Catégorie non trouvée');
    });

    it('devrait rejeter si la référence existe déjà', async () => {
      // Arrange
      categoryRepository.findById.mockResolvedValue(validCategory);
      productRepository.findByReference.mockResolvedValue(validProduct);

      // Act & Assert
      await expect(productService.createProduct(newProductData))
        .rejects
        .toThrow('Cette référence existe déjà');
    });

    it('devrait générer automatiquement le slug si non fourni', async () => {
      // Arrange
      categoryRepository.findById.mockResolvedValue(validCategory);
      productRepository.findByReference.mockResolvedValue(null);
      productRepository.create.mockImplementation((data) => ({
        id: 'new-uuid',
        ...data
      }));

      // Act
      await productService.createProduct(newProductData);

      // Assert
      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'oranges-bio'
        })
      );
    });
  });

  // =============================================
  // TESTS: MISE À JOUR PRODUIT (updateProduct)
  // =============================================
  describe('updateProduct()', () => {
    const updateData = {
      nom: 'Pommes Gala Bio Premium',
      prix: 4.00
    };

    it('devrait mettre à jour un produit avec succès', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(validProduct);
      productRepository.update.mockResolvedValue({
        ...validProduct,
        ...updateData
      });

      // Act
      const result = await productService.updateProduct(validProduct.id, updateData);

      // Assert
      expect(productRepository.findById).toHaveBeenCalledWith(validProduct.id);
      expect(productRepository.update).toHaveBeenCalledWith(validProduct.id, expect.any(Object));
      expect(result.nom).toBe(updateData.nom);
      expect(result.prix).toBe(updateData.prix);
    });

    it('devrait retourner null si le produit n\'existe pas', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(null);

      // Act
      const result = await productService.updateProduct('uuid-inexistant', updateData);

      // Assert
      expect(result).toBeNull();
      expect(productRepository.update).not.toHaveBeenCalled();
    });

    it('devrait vérifier la catégorie si elle est modifiée', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(validProduct);
      categoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.updateProduct(validProduct.id, {
        categorieId: 'new-category-id'
      })).rejects.toThrow('Catégorie non trouvée');
    });

    it('devrait vérifier l\'unicité de la référence si modifiée', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(validProduct);
      productRepository.referenceExists.mockResolvedValue(true);

      // Act & Assert
      await expect(productService.updateProduct(validProduct.id, {
        reference: 'EXISTING-REF'
      })).rejects.toThrow('Cette référence existe déjà');
    });

    it('devrait régénérer le slug si le nom change', async () => {
      // Arrange
      productRepository.findById.mockResolvedValue(validProduct);
      productRepository.update.mockImplementation((id, data) => ({
        ...validProduct,
        ...data
      }));

      // Act
      await productService.updateProduct(validProduct.id, {
        nom: 'Nouveau Nom Produit'
      });

      // Assert
      expect(productRepository.update).toHaveBeenCalledWith(
        validProduct.id,
        expect.objectContaining({
          slug: 'nouveau-nom-produit'
        })
      );
    });
  });

  // =============================================
  // TESTS: SUPPRESSION PRODUIT (deleteProduct)
  // =============================================
  describe('deleteProduct()', () => {
    it('devrait désactiver (soft delete) un produit', async () => {
      // Arrange
      productRepository.delete.mockResolvedValue({ ...validProduct, estActif: false });

      // Act
      const result = await productService.deleteProduct(validProduct.id);

      // Assert
      expect(productRepository.delete).toHaveBeenCalledWith(validProduct.id);
      expect(result.estActif).toBe(false);
    });

    it('devrait retourner null si le produit n\'existe pas', async () => {
      // Arrange
      productRepository.delete.mockResolvedValue(null);

      // Act
      const result = await productService.deleteProduct('uuid-inexistant');

      // Assert
      expect(result).toBeNull();
    });
  });

  // =============================================
  // TESTS: MISE À JOUR STOCK (updateStock)
  // =============================================
  describe('updateStock()', () => {
    it('devrait mettre à jour le stock avec l\'opération set', async () => {
      // Arrange
      productRepository.updateStock.mockResolvedValue({
        ...validProduct,
        stockQuantite: 50
      });

      // Act
      const result = await productService.updateStock(validProduct.id, 50, 'set');

      // Assert
      expect(productRepository.updateStock).toHaveBeenCalledWith(validProduct.id, 50, 'set');
      expect(result.stockQuantite).toBe(50);
    });

    it('devrait détecter un stock faible', async () => {
      // Arrange
      const lowStockProduct = {
        ...validProduct,
        stockQuantite: 5,
        stockMinAlerte: 10
      };
      productRepository.updateStock.mockResolvedValue(lowStockProduct);

      // Act
      const result = await productService.updateStock(validProduct.id, 5, 'set');

      // Assert
      expect(result.stockQuantite).toBeLessThanOrEqual(result.stockMinAlerte);
    });
  });

  // =============================================
  // TESTS: GÉNÉRATION SLUG (generateSlug)
  // =============================================
  describe('generateSlug()', () => {
    it('devrait convertir en minuscules', () => {
      expect(productService.generateSlug('POMMES GALA')).toBe('pommes-gala');
    });

    it('devrait remplacer les espaces par des tirets', () => {
      expect(productService.generateSlug('pommes gala bio')).toBe('pommes-gala-bio');
    });

    it('devrait supprimer les accents', () => {
      expect(productService.generateSlug('Légumes frais été')).toBe('legumes-frais-ete');
    });

    it('devrait supprimer les caractères spéciaux', () => {
      expect(productService.generateSlug('Produit @#$% spécial!')).toBe('produit-special');
    });

    it('devrait supprimer les tirets multiples', () => {
      expect(productService.generateSlug('produit---test')).toBe('produit-test');
    });

    it('devrait supprimer les tirets en début et fin', () => {
      expect(productService.generateSlug('-produit-test-')).toBe('produit-test');
    });
  });
});
