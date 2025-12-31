/**
 * Repository Produits - VERSION CORRIGÉE
 * @description Accès aux données produits PostgreSQL
 * 
 * ✅ CORRECTIONS:
 * - Ajout filtre enPromotion/hasPromo dans findAll()
 * - Ajout filtre estMisEnAvant dans findAll()
 */

const { query, getClient } = require('../config/database');
const logger = require('../config/logger');

class ProductRepository {
  /**
   * Récupère tous les produits avec filtres et pagination
   * 
   * ✅ AJOUT: enPromotion, hasPromo, estMisEnAvant
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 12,
      categorieId,
      search,
      minPrice,
      maxPrice,
      enStock = null,
      estActif = true,
      enPromotion = null,     // ✅ NOUVEAU
      hasPromo = null,        // ✅ NOUVEAU (alias)
      estMisEnAvant = null,   // ✅ NOUVEAU
      orderBy = 'createdAt',
      orderDir = 'DESC',
      labels = []
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;

    // Construction de la requête dynamique
    let whereClause = 'WHERE 1=1';
    
    // Filtre estActif
    if (estActif !== null && estActif !== 'all') {
      whereClause += ` AND p.est_actif = $${paramIndex++}`;
      params.push(estActif === true || estActif === 'true');
    }

    // Filtre catégorie
    if (categorieId) {
      whereClause += ` AND p.categorie_id = $${paramIndex++}`;
      params.push(categorieId);
    }

    // Recherche texte
    if (search) {
      whereClause += ` AND (
        p.nom ILIKE $${paramIndex} 
        OR p.description ILIKE $${paramIndex}
        OR p.reference ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtre prix min
    if (minPrice !== undefined && minPrice !== null) {
      whereClause += ` AND p.prix >= $${paramIndex++}`;
      params.push(parseFloat(minPrice));
    }

    // Filtre prix max
    if (maxPrice !== undefined && maxPrice !== null) {
      whereClause += ` AND p.prix <= $${paramIndex++}`;
      params.push(parseFloat(maxPrice));
    }

    // Filtre stock
    if (enStock !== null && enStock !== undefined) {
      const inStock = enStock === true || enStock === 'true';
      if (inStock) {
        whereClause +=  ' AND p.stock_quantite > 0';
      } else {
        whereClause += ' AND p.stock_quantite = 0';
      }
    }

    // ✅ NOUVEAU: Filtre promotions (enPromotion ou hasPromo)
    const promoFilter = enPromotion ?? hasPromo;
    if (promoFilter !== null && promoFilter !== undefined) {
      const hasPromotion = promoFilter === true || promoFilter === 'true';
      if (hasPromotion) {
        whereClause += ' AND p.prix_promo IS NOT NULL AND p.prix_promo < p.prix';
      } else {
        whereClause += ' AND (p.prix_promo IS NULL OR p.prix_promo >= p.prix)';
      }
    }

    // ✅ NOUVEAU: Filtre mis en avant
    if (estMisEnAvant !== null && estMisEnAvant !== undefined) {
      const isFeatured = estMisEnAvant === true || estMisEnAvant === 'true';
      whereClause += ` AND p.est_mis_en_avant = ${isFeatured}`;
    }

    // Filtre labels
    if (labels && labels.length > 0) {
      const labelsArray = Array.isArray(labels) ? labels : labels.split(',');
      whereClause += ` AND p.labels && $${paramIndex++}`;
      params.push(labelsArray);
    }

    // Mapping des colonnes pour l'ORDER BY
    const orderByMap = {
      'createdAt': 'p.date_creation',
      'prix': 'p.prix',
      'prixPromo': 'p.prix_promo',
      'nom': 'p.nom',
      'stock': 'p.stock_quantite'
    };
    const orderColumn = orderByMap[orderBy] || 'p.date_creation';
    const direction = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Requête principale
    const sql = `
      SELECT 
        p.id,
        p.reference,
        p.nom,
        p.slug,
        p.description,
        p.prix,
        p.prix_promo,
        p.taux_tva,
        p.unite_mesure,
        p.stock_quantite,
        p.stock_min_alerte,
        p.image_url,
        p.labels,
        p.origine,
        p.est_actif,
        p.est_mis_en_avant,
        p.date_creation,
        p.date_modification,
        c.id as categorie_id,
        c.nom as categorie_nom,
        c.slug as categorie_slug
      FROM produit p
      LEFT JOIN categorie c ON p.categorie_id = c.id
      ${whereClause}
      ORDER BY ${orderColumn} ${direction}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);

    // Requête de comptage
    const countSql = `
      SELECT COUNT(*) as total
      FROM produit p
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -2)) // Sans limit et offset
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      products: productsResult.rows.map(this.mapProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Récupère un produit par ID
   */
  async findById(id) {
    const sql = `
      SELECT 
        p.*,
        c.id as categorie_id,
        c.nom as categorie_nom,
        c.slug as categorie_slug
      FROM produit p
      LEFT JOIN categorie c ON p.categorie_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  /**
   * Récupère un produit par slug
   */
  async findBySlug(slug) {
    const sql = `
      SELECT 
        p.*,
        c.id as categorie_id,
        c.nom as categorie_nom,
        c.slug as categorie_slug
      FROM produit p
      LEFT JOIN categorie c ON p.categorie_id = c.id
      WHERE p.slug = $1
    `;
    
    const result = await query(sql, [slug]);
    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  /**
   * Récupère un produit par référence
   */
  async findByReference(reference) {
    const sql = 'SELECT * FROM produit WHERE reference = $1';
    const result = await query(sql, [reference]);
    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  /**
   * Crée un nouveau produit
   */
  async create(data) {
    const sql = `
      INSERT INTO produit (
        reference, nom, slug, description, prix, prix_promo,
        taux_tva, unite_mesure, stock_quantite, stock_min_alerte,
        image_url, labels, origine, categorie_id, est_actif, est_mis_en_avant
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const params = [
      data.reference,
      data.nom,
      data.slug,
      data.description || null,
      data.prix,
      data.prixPromo || null,
      data.tauxTva || 20.00,
      data.uniteMesure || 'piece',
      data.stockQuantite || 0,
      data.stockMinAlerte || 10,
      data.imageUrl || null,
      data.labels || [],
      data.origine || null,
      data.categorieId,
      data.estActif !== false,
      data.estMisEnAvant || false
    ];

    const result = await query(sql, params);
    logger.info(`Produit créé: ${result.rows[0].nom} (${result.rows[0].reference})`);
    return this.mapProduct(result.rows[0]);
  }

  /**
   * Met à jour un produit
   */
  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    // Construction dynamique des champs à mettre à jour
    const fieldMapping = {
      reference: 'reference',
      nom: 'nom',
      slug: 'slug',
      description: 'description',
      prix: 'prix',
      prixPromo: 'prix_promo',
      tauxTva: 'taux_tva',
      uniteMesure: 'unite_mesure',
      stockQuantite: 'stock_quantite',
      stockMinAlerte: 'stock_min_alerte',
      imageUrl: 'image_url',
      labels: 'labels',
      origine: 'origine',
      categorieId: 'categorie_id',
      estActif: 'est_actif',
      estMisEnAvant: 'est_mis_en_avant'
    };

    for (const [key, column] of Object.entries(fieldMapping)) {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${paramIndex++}`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('date_modification = NOW()');
    params.push(id);

    const sql = `
      UPDATE produit 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, params);
    logger.info(`Produit mis à jour: ${id}`);
    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  /**
   * Supprime un produit (soft delete)
   */
  async delete(id) {
    const sql = `
      UPDATE produit 
      SET est_actif = false, date_modification = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [id]);
    logger.info(`Produit désactivé: ${id}`);
    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  /**
   * Supprime définitivement un produit (hard delete)
   */
  async hardDelete(id) {
    const sql = 'DELETE FROM produit WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    logger.info(`Produit supprimé définitivement: ${id}`);
    return result.rowCount > 0;
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateStock(id, quantite, operation = 'set') {
    let sql;
    
    if (operation === 'add') {
      sql = `
        UPDATE produit 
        SET stock_quantite = stock_quantite + $2, date_modification = NOW()
        WHERE id = $1
        RETURNING *
      `;
    } else if (operation === 'subtract') {
      sql = `
        UPDATE produit 
        SET stock_quantite = GREATEST(0, stock_quantite - $2), date_modification = NOW()
        WHERE id = $1
        RETURNING *
      `;
    } else {
      sql = `
        UPDATE produit 
        SET stock_quantite = $2, date_modification = NOW()
        WHERE id = $1
        RETURNING *
      `;
    }

    const result = await query(sql, [id, quantite]);
    return result.rows[0] ? this.mapProduct(result.rows[0]) : null;
  }

  /**
   * Récupère les produits avec stock faible
   */
  async findLowStock() {
    const sql = `
      SELECT p.*, c.nom as categorie_nom
      FROM produit p
      LEFT JOIN categorie c ON p.categorie_id = c.id
      WHERE p.est_actif = true 
        AND p.stock_quantite <= p.stock_min_alerte
      ORDER BY p.stock_quantite ASC
    `;
    
    const result = await query(sql);
    return result.rows.map(this.mapProduct);
  }

  /**
   * Récupère les produits en promotion
   */
  async findPromos(limit = 100) {
    const sql = `
      SELECT p.*, c.nom as categorie_nom, c.slug as categorie_slug
      FROM produit p
      LEFT JOIN categorie c ON p.categorie_id = c.id
      WHERE p.est_actif = true 
        AND p.prix_promo IS NOT NULL 
        AND p.prix_promo < p.prix
      ORDER BY (p.prix - p.prix_promo) / p.prix DESC
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    return result.rows.map(this.mapProduct);
  }

  /**
   * Récupère les nouveautés (produits ajoutés récemment)
   */
  async findNew(days = 30, limit = 10) {
    const sql = `
      SELECT p.*, c.nom as categorie_nom
      FROM produit p
      LEFT JOIN categorie c ON p.categorie_id = c.id
      WHERE p.est_actif = true 
        AND p.date_creation >= NOW() - INTERVAL '${days} days'
      ORDER BY p.date_creation DESC
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    return result.rows.map(this.mapProduct);
  }

  /**
   * Vérifie si une référence existe
   */
  async referenceExists(reference, excludeId = null) {
    let sql = 'SELECT id FROM produit WHERE reference = $1';
    const params = [reference];
    
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  /**
   * Vérifie si un slug existe
   */
  async slugExists(slug, excludeId = null) {
    let sql = 'SELECT id FROM produit WHERE slug = $1';
    const params = [slug];
    
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  /**
   * Mappe les noms de colonnes snake_case vers camelCase
   */
  mapProduct(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      reference: row.reference,
      nom: row.nom,
      slug: row.slug,
      description: row.description,
      prix: parseFloat(row.prix),
      prixHt: parseFloat(row.prix), // Alias pour compatibilité frontend
      prixPromo: row.prix_promo ? parseFloat(row.prix_promo) : null,
      tauxTva: parseFloat(row.taux_tva),
      uniteMesure: row.unite_mesure,
      stock: parseInt(row.stock_quantite),  // Alias court
      stockQuantite: parseInt(row.stock_quantite),
      stockMinAlerte: parseInt(row.stock_min_alerte),
      imageUrl: row.image_url,
      labels: row.labels || [],
      origine: row.origine,
      estActif: row.est_actif,
      estMisEnAvant: row.est_mis_en_avant,
      categorieId: row.categorie_id,
      categorie: row.categorie_nom ? {
        id: row.categorie_id,
        nom: row.categorie_nom,
        slug: row.categorie_slug
      } : null,
      createdAt: row.date_creation,
      updatedAt: row.date_modification
    };
  }
}

module.exports = new ProductRepository();
