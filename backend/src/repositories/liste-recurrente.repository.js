/**
 * Repository Listes récurrentes (T16-13)
 * @description Accès aux données liste_recurrente / liste_recurrente_produit
 */

const { query, getClient } = require('../config/database');

class ListeRecurrenteRepository {
  /**
   * Crée une liste récurrente avec ses produits, en une transaction.
   * @param {string} utilisateurId
   * @param {string} nom
   * @param {Array<{produitId: string, quantite: number}>} items
   */
  async create(utilisateurId, nom, items) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const listeResult = await client.query(
        'INSERT INTO liste_recurrente (utilisateur_id, nom) VALUES ($1, $2) RETURNING id, nom, date_creation',
        [utilisateurId, nom]
      );
      const liste = listeResult.rows[0];

      for (const item of items) {
        await client.query(
          'INSERT INTO liste_recurrente_produit (liste_id, produit_id, quantite) VALUES ($1, $2, $3)',
          [liste.id, item.produitId, item.quantite]
        );
      }

      await client.query('COMMIT');
      return this._formatListe(liste);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAllByUser(utilisateurId) {
    const listesResult = await query(
      'SELECT id, nom, date_creation FROM liste_recurrente WHERE utilisateur_id = $1 ORDER BY date_creation DESC',
      [utilisateurId]
    );

    const listes = listesResult.rows;
    if (listes.length === 0) return [];

    const produitsResult = await query(
      `SELECT lrp.liste_id, lrp.produit_id, lrp.quantite, p.nom AS produit_nom, p.reference, p.image_url
       FROM liste_recurrente_produit lrp
       JOIN produit p ON p.id = lrp.produit_id
       WHERE lrp.liste_id = ANY($1::uuid[])
       ORDER BY p.nom`,
      [listes.map((l) => l.id)]
    );

    const produitsParListe = new Map();
    for (const row of produitsResult.rows) {
      if (!produitsParListe.has(row.liste_id)) produitsParListe.set(row.liste_id, []);
      produitsParListe.get(row.liste_id).push({
        produitId: row.produit_id,
        nom: row.produit_nom,
        reference: row.reference,
        imageUrl: row.image_url,
        quantite: row.quantite
      });
    }

    return listes.map((liste) => ({
      ...this._formatListe(liste),
      produits: produitsParListe.get(liste.id) || []
    }));
  }

  async findById(id) {
    const result = await query('SELECT id, utilisateur_id, nom, date_creation FROM liste_recurrente WHERE id = $1', [id]);
    if (!result.rows[0]) return null;

    const produitsResult = await query(
      'SELECT produit_id, quantite FROM liste_recurrente_produit WHERE liste_id = $1',
      [id]
    );

    return {
      ...this._formatListe(result.rows[0]),
      utilisateurId: result.rows[0].utilisateur_id,
      produits: produitsResult.rows.map((row) => ({ produitId: row.produit_id, quantite: row.quantite }))
    };
  }

  async delete(id, utilisateurId) {
    const result = await query(
      'DELETE FROM liste_recurrente WHERE id = $1 AND utilisateur_id = $2 RETURNING id',
      [id, utilisateurId]
    );
    return result.rows.length > 0;
  }

  _formatListe(row) {
    return {
      id: row.id,
      nom: row.nom,
      dateCreation: row.date_creation
    };
  }
}

module.exports = new ListeRecurrenteRepository();
