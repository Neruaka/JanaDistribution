/**
 * Cart Repository
 * @description Gestion des opérations BDD pour le panier et ses items
 * 
 * IMPORTANT: Utilise les tables:
 * - panier (id, utilisateur_id, session_id, date_creation, date_modification)
 * - ligne_panier (id, panier_id, produit_id, quantite, prix_unitaire, date_ajout)
 */

const { pool } = require('../config/database');
const logger = require('../config/logger');

class CartRepository {
  
  /**
   * Récupérer ou créer le panier d'un utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Object} Le panier avec ses items
   */
  async getOrCreateCart(userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Sérialiser l'accès au panier utilisateur pour éviter les créations concurrentes
      await client.query(
        `SELECT id
         FROM utilisateur
         WHERE id = $1
         FOR UPDATE`,
        [userId]
      );

      const cartsResult = await client.query(
        `SELECT id, utilisateur_id, date_creation, date_modification
         FROM panier
         WHERE utilisateur_id = $1
         ORDER BY date_creation ASC`,
        [userId]
      );

      let cartRow = cartsResult.rows[0];

      if (!cartRow) {
        const insertResult = await client.query(
          `INSERT INTO panier (utilisateur_id)
           VALUES ($1)
           RETURNING id, utilisateur_id, date_creation, date_modification`,
          [userId]
        );
        cartRow = insertResult.rows[0];
      } else if (cartsResult.rows.length > 1) {
        const duplicateCartIds = cartsResult.rows.slice(1).map(row => row.id);

        await client.query(
          `INSERT INTO ligne_panier (panier_id, produit_id, quantite, prix_unitaire, date_ajout)
           SELECT $1, lp.produit_id, lp.quantite, lp.prix_unitaire, lp.date_ajout
           FROM ligne_panier lp
           WHERE lp.panier_id = ANY($2::uuid[])
           ON CONFLICT (panier_id, produit_id) DO UPDATE
           SET quantite = ligne_panier.quantite + EXCLUDED.quantite,
               prix_unitaire = EXCLUDED.prix_unitaire,
               date_ajout = GREATEST(ligne_panier.date_ajout, EXCLUDED.date_ajout)`,
          [cartRow.id, duplicateCartIds]
        );

        await client.query(
          `DELETE FROM panier
           WHERE id = ANY($1::uuid[])`,
          [duplicateCartIds]
        );

        await client.query(
          `UPDATE panier
           SET date_modification = NOW()
           WHERE id = $1`,
          [cartRow.id]
        );

        logger.warn('Duplicate carts were consolidated for user', {
          userId,
          keptCartId: cartRow.id,
          duplicateCartIds
        });
      }

      const cart = this._mapCart(cartRow);
      
      // récupérer les items du panier avec les infos produit
      // ATTENTION: table = ligne_panier, colonnes produit = prix, taux_tva
      const itemsResult = await client.query(
        `SELECT 
           lp.id,
           lp.panier_id,
           lp.produit_id,
           lp.quantite,
           lp.prix_unitaire,
           lp.date_ajout,
           p.nom as produit_nom,
           p.slug as produit_slug,
           p.reference as produit_reference,
           p.prix as produit_prix_actuel,
           p.prix_promo as produit_prix_promo,
           p.image_url as produit_image,
           p.stock_quantite as produit_stock,
           p.unite_mesure as produit_unite,
           p.taux_tva as produit_tva,
           p.est_actif as produit_actif
         FROM ligne_panier lp
         JOIN produit p ON lp.produit_id = p.id
         WHERE lp.panier_id = $1
         ORDER BY lp.date_ajout DESC`,
        [cart.id]
      );
      
      cart.items = itemsResult.rows.map(row => this._mapCartItem(row));
      cart.summary = this._calculateSummary(cart.items);
      
      await client.query('COMMIT');
      
      return cart;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Ajouter un produit au panier
   * @param {string} cartId - UUID du panier
   * @param {string} productId - UUID du produit
   * @param {number} quantity - Quantité à ajouter
   * @param {number} unitPrice - Prix unitaire au moment de l'ajout
   * @returns {Object} L'item créé ou mis à jour
   */
  async addItem(cartId, productId, quantity, unitPrice) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // vérifier si le produit est déjà dans le panier
      const existingItem = await client.query(
        `SELECT id, quantite FROM ligne_panier
         WHERE panier_id = $1 AND produit_id = $2`,
        [cartId, productId]
      );
      
      let result;
      
      if (existingItem.rows.length > 0) {
        // produit existe → on cumule les quantités
        const newQuantity = existingItem.rows[0].quantite + quantity;
        
        result = await client.query(
          `UPDATE ligne_panier
           SET quantite = $1, prix_unitaire = $2
           WHERE id = $3
           RETURNING id, panier_id, produit_id, quantite, prix_unitaire, date_ajout`,
          [newQuantity, unitPrice, existingItem.rows[0].id]
        );
      } else {
        // nouveau produit dans le panier
        result = await client.query(
          `INSERT INTO ligne_panier (panier_id, produit_id, quantite, prix_unitaire)
           VALUES ($1, $2, $3, $4)
           RETURNING id, panier_id, produit_id, quantite, prix_unitaire, date_ajout`,
          [cartId, productId, quantity, unitPrice]
        );
      }
      
      // mettre à jour la date de modification du panier
      await client.query(
        'UPDATE panier SET date_modification = NOW() WHERE id = $1',
        [cartId]
      );
      
      await client.query('COMMIT');
      
      // récupérer l'item complet avec les infos produit
      return this.getItemById(result.rows[0].id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Récupérer un item par son ID
   * @param {string} itemId - UUID de l'item
   * @returns {Object|null} L'item ou null
   */
  async getItemById(itemId) {
    const result = await pool.query(
      `SELECT 
         lp.id,
         lp.panier_id,
         lp.produit_id,
         lp.quantite,
         lp.prix_unitaire,
         lp.date_ajout,
         p.nom as produit_nom,
         p.slug as produit_slug,
         p.reference as produit_reference,
         p.prix as produit_prix_actuel,
         p.prix_promo as produit_prix_promo,
         p.image_url as produit_image,
         p.stock_quantite as produit_stock,
         p.unite_mesure as produit_unite,
         p.taux_tva as produit_tva,
         p.est_actif as produit_actif
       FROM ligne_panier lp
       JOIN produit p ON lp.produit_id = p.id
       WHERE lp.id = $1`,
      [itemId]
    );
    
    if (result.rows.length === 0) return null;
    
    return this._mapCartItem(result.rows[0]);
  }
  
  /**
   * Mettre à jour la quantité d'un item
   * @param {string} itemId - UUID de l'item
   * @param {number} quantity - Nouvelle quantité
   * @returns {Object|null} L'item mis à jour ou null
   */
  async updateItemQuantity(itemId, quantity) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // récupérer l'item pour avoir le panier_id
      const itemResult = await client.query(
        'SELECT panier_id FROM ligne_panier WHERE id = $1',
        [itemId]
      );
      
      if (itemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      // mettre à jour la quantité
      await client.query(
        'UPDATE ligne_panier SET quantite = $1 WHERE id = $2',
        [quantity, itemId]
      );
      
      // mettre à jour la date de modification du panier
      await client.query(
        'UPDATE panier SET date_modification = NOW() WHERE id = $1',
        [itemResult.rows[0].panier_id]
      );
      
      await client.query('COMMIT');
      
      return this.getItemById(itemId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Supprimer un item du panier
   * @param {string} itemId - UUID de l'item
   * @returns {boolean} True si supprimé
   */
  async removeItem(itemId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // récupérer le panier_id avant suppression
      const itemResult = await client.query(
        'SELECT panier_id FROM ligne_panier WHERE id = $1',
        [itemId]
      );
      
      if (itemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      // supprimer l'item
      await client.query(
        'DELETE FROM ligne_panier WHERE id = $1',
        [itemId]
      );
      
      // mettre à jour la date de modification du panier
      await client.query(
        'UPDATE panier SET date_modification = NOW() WHERE id = $1',
        [itemResult.rows[0].panier_id]
      );
      
      await client.query('COMMIT');
      
      return true;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Vider le panier (supprimer tous les items)
   * @param {string} cartId - UUID du panier
   * @returns {boolean} True si vidé
   */
  async clearCart(cartId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // supprimer tous les items
      await client.query(
        'DELETE FROM ligne_panier WHERE panier_id = $1',
        [cartId]
      );
      
      // mettre à jour la date de modification
      await client.query(
        'UPDATE panier SET date_modification = NOW() WHERE id = $1',
        [cartId]
      );
      
      await client.query('COMMIT');
      
      return true;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Compter le nombre d'items dans le panier
   * @param {string} userId - UUID de l'utilisateur
   * @returns {number} Nombre d'items
   */
  async getItemCount(userId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(lp.quantite), 0) as count
       FROM panier p
       LEFT JOIN ligne_panier lp ON p.id = lp.panier_id
       WHERE p.utilisateur_id = $1`,
      [userId]
    );
    
    return parseInt(result.rows[0].count) || 0;
  }
  
  /**
   * Vérifier si un item appartient à l'utilisateur
   * @param {string} itemId - UUID de l'item
   * @param {string} userId - UUID de l'utilisateur
   * @returns {boolean} True si l'item appartient à l'utilisateur
   */
  async isItemOwnedByUser(itemId, userId) {
    const result = await pool.query(
      `SELECT 1 FROM ligne_panier lp
       JOIN panier p ON lp.panier_id = p.id
       WHERE lp.id = $1 AND p.utilisateur_id = $2`,
      [itemId, userId]
    );
    
    return result.rows.length > 0;
  }
  
  /**
   * Mapper les données brutes du panier
   */
  _mapCart(row) {
    return {
      id: row.id,
      userId: row.utilisateur_id,
      createdAt: row.date_creation,
      updatedAt: row.date_modification,
      items: [],
      summary: null
    };
  }
  
  /**
   * Mapper les données brutes d'un item
   */
  _mapCartItem(row) {
    const priceToUse = row.produit_prix_promo || row.prix_unitaire;
    const quantity = row.quantite;
    const subtotal = priceToUse * quantity;
    const tvaRate = parseFloat(row.produit_tva) || 20;
    const tvaAmount = subtotal * (tvaRate / 100);
    
    return {
      id: row.id,
      cartId: row.panier_id,
      productId: row.produit_id,
      quantity: quantity,
      unitPrice: parseFloat(row.prix_unitaire),
      createdAt: row.date_ajout,
      product: {
        id: row.produit_id,
        name: row.produit_nom,
        slug: row.produit_slug,
        reference: row.produit_reference,
        currentPrice: parseFloat(row.produit_prix_actuel),
        promoPrice: row.produit_prix_promo ? parseFloat(row.produit_prix_promo) : null,
        image: row.produit_image,
        stock: row.produit_stock,
        unit: row.produit_unite,
        tvaRate: tvaRate,
        isActive: row.produit_actif
      },
      // prix effectif (promo si dispo, sinon normal)
      effectivePrice: parseFloat(priceToUse),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tvaAmount: parseFloat(tvaAmount.toFixed(2)),
      isOnSale: !!row.produit_prix_promo
    };
  }
  
  /**
   * Calculer le résumé du panier (totaux)
   */
  _calculateSummary(items) {
    if (!items || items.length === 0) {
      return {
        itemCount: 0,
        totalQuantity: 0,
        subtotalHT: 0,
        totalTVA: 0,
        totalTTC: 0
      };
    }
    
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalHT = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTVA = items.reduce((sum, item) => sum + item.tvaAmount, 0);
    const totalTTC = subtotalHT + totalTVA;
    
    return {
      itemCount: items.length,
      totalQuantity: totalQuantity,
      subtotalHT: parseFloat(subtotalHT.toFixed(2)),
      totalTVA: parseFloat(totalTVA.toFixed(2)),
      totalTTC: parseFloat(totalTTC.toFixed(2))
    };
  }
}

module.exports = new CartRepository();

