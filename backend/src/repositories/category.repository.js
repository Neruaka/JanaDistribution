/**
 * Repository Catégories
 * @description Accès aux données catégories PostgreSQL
 */

const { query } = require('../config/database');
const logger = require('../config/logger');

class CategoryRepository {
  /**
   * Récupère toutes les catégories
   */
  async findAll(options = {}) {
    const { estActif = true, includeProductCount = false } = options;

    let sql;
    const params = [];

    if (includeProductCount) {
      sql = `
        SELECT 
          c.*,
          COUNT(p.id) FILTER (WHERE p.est_actif = true) as product_count
        FROM categorie c
        LEFT JOIN produit p ON p.categorie_id = c.id
        ${estActif !== null ? 'WHERE c.est_actif = $1' : ''}
        GROUP BY c.id
        ORDER BY c.ordre ASC, c.nom ASC
      `;
      if (estActif !== null) params.push(estActif);
    } else {
      sql = `
        SELECT * FROM categorie
        ${estActif !== null ? 'WHERE est_actif = $1' : ''}
        ORDER BY ordre ASC, nom ASC
      `;
      if (estActif !== null) params.push(estActif);
    }

    const result = await query(sql, params);
    return result.rows.map(this.mapCategory);
  }

  /**
   * Récupère une catégorie par ID
   */
  async findById(id) {
    const sql = `
      SELECT c.*, COUNT(p.id) FILTER (WHERE p.est_actif = true) as product_count
      FROM categorie c
      LEFT JOIN produit p ON p.categorie_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0] ? this.mapCategory(result.rows[0]) : null;
  }

  /**
   * Récupère une catégorie par slug
   */
  async findBySlug(slug) {
    const sql = `
      SELECT c.*, COUNT(p.id) FILTER (WHERE p.est_actif = true) as product_count
      FROM categorie c
      LEFT JOIN produit p ON p.categorie_id = c.id
      WHERE c.slug = $1
      GROUP BY c.id
    `;
    
    const result = await query(sql, [slug]);
    return result.rows[0] ? this.mapCategory(result.rows[0]) : null;
  }

  /**
   * Crée une nouvelle catégorie
   */
  async create(data) {
    // Récupérer le prochain ordre
    const orderResult = await query('SELECT COALESCE(MAX(ordre), 0) + 1 as next_order FROM categorie');
    const nextOrder = orderResult.rows[0].next_order;

    const sql = `
      INSERT INTO categorie (nom, slug, description, couleur, icone, ordre, est_actif)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      data.nom,
      data.slug,
      data.description || null,
      data.couleur || '#22C55E',
      data.icone || null,
      data.ordre || nextOrder,
      data.estActif !== false
    ];

    const result = await query(sql, params);
    logger.info(`Catégorie créée: ${result.rows[0].nom}`);
    return this.mapCategory(result.rows[0]);
  }

  /**
   * Met à jour une catégorie
   */
  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    const fieldMapping = {
      nom: 'nom',
      slug: 'slug',
      description: 'description',
      couleur: 'couleur',
      icone: 'icone',
      ordre: 'ordre',
      estActif: 'est_actif'
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

    params.push(id);

    const sql = `
      UPDATE categorie 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, params);
    logger.info(`Catégorie mise à jour: ${id}`);
    return result.rows[0] ? this.mapCategory(result.rows[0]) : null;
  }

  /**
   * Supprime une catégorie (soft delete)
   */
  async delete(id) {
    const sql = `
      UPDATE categorie 
      SET est_actif = false
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [id]);
    logger.info(`Catégorie désactivée: ${id}`);
    return result.rows[0] ? this.mapCategory(result.rows[0]) : null;
  }

  /**
   * Vérifie si une catégorie a des produits
   */
  async hasProducts(id) {
    const sql = `SELECT COUNT(*) as count FROM produit WHERE categorie_id = $1 AND est_actif = true`;
    const result = await query(sql, [id]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Vérifie si un slug existe
   */
  async slugExists(slug, excludeId = null) {
    let sql = `SELECT id FROM categorie WHERE slug = $1`;
    const params = [slug];
    
    if (excludeId) {
      sql += ` AND id != $2`;
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result.rowCount > 0;
  }

  /**
   * Réorganise l'ordre des catégories
   */
  async reorder(orderedIds) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          'UPDATE categorie SET ordre = $1 WHERE id = $2',
          [i + 1, orderedIds[i]]
        );
      }
      
      await client.query('COMMIT');
      logger.info('Ordre des catégories mis à jour');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mappe les noms de colonnes snake_case vers camelCase
   */
  mapCategory(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      nom: row.nom,
      slug: row.slug,
      description: row.description,
      couleur: row.couleur,
      icone: row.icone,
      ordre: row.ordre,
      estActif: row.est_actif,
      productCount: row.product_count ? parseInt(row.product_count) : undefined,
      createdAt: row.date_creation
    };
  }
}

module.exports = new CategoryRepository();
