/**
 * Repository Codes Promo
 * @description Accès aux données codes promo PostgreSQL (validation, stats admin)
 *
 * Convention colonnes SQL -> objet JS : voir _mapPromo() / _mapPromoStats().
 */

const { query, pool } = require('../config/database');
const logger = require('../config/logger');

// Champs modifiables via update() — whitelist stricte (jamais 'code' après création
// pour éviter de casser des liens déjà partagés, ni 'id'/'created_at'/'created_by').
const UPDATABLE_FIELDS = {
  description: 'description',
  typeRabais: 'type_rabais',
  valeurRabais: 'valeur_rabais',
  montantMinimum: 'montant_minimum',
  maxUtilisationsGlobal: 'max_utilisations_global',
  maxUtilisationsParClient: 'max_utilisations_par_client',
  dateDebut: 'date_debut',
  dateFin: 'date_fin',
  actif: 'actif'
};

// T-BUGS-2026-09 : le formulaire admin envoie une date-only "YYYY-MM-DD"
// (<input type="date">) pour date_fin. Insérée telle quelle dans une colonne
// timestamptz, elle vaut minuit (00:00:00) ce jour-là - un code dont la date
// de fin est "aujourd'hui" est donc deja "expiré" des 00:00:00, invalidant le
// code quasiment toute sa journée de création. On la pousse a la fin de la
// journée choisie ; date_debut reste a 00:00:00 (deja le comportement voulu).
const toEndOfDay = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T23:59:59`;
  }
  return value;
};

class PromoRepository {
  /**
   * Récupère un code promo par son code (insensible à la casse)
   */
  async findByCode(code) {
    const sql = 'SELECT * FROM code_promo WHERE UPPER(code) = UPPER($1)';
    const result = await query(sql, [code]);
    return result.rows[0] ? this._mapPromo(result.rows[0]) : null;
  }

  /**
   * Récupère un code promo par ID (sans stats)
   */
  async findByIdRaw(id) {
    const result = await query('SELECT * FROM code_promo WHERE id = $1', [id]);
    return result.rows[0] ? this._mapPromo(result.rows[0]) : null;
  }

  /**
   * Nombre d'utilisations globales d'un code promo (toutes commandes confondues)
   */
  async countUtilisationsGlobal(codePromoId) {
    const result = await query(
      'SELECT COUNT(*) as total FROM code_promo_utilisation WHERE code_promo_id = $1',
      [codePromoId]
    );
    return parseInt(result.rows[0].total, 10) || 0;
  }

  /**
   * Nombre d'utilisations d'un code promo par un client donné
   */
  async countUtilisationsByUser(codePromoId, utilisateurId) {
    const result = await query(
      'SELECT COUNT(*) as total FROM code_promo_utilisation WHERE code_promo_id = $1 AND utilisateur_id = $2',
      [codePromoId, utilisateurId]
    );
    return parseInt(result.rows[0].total, 10) || 0;
  }

  /**
   * Enregistre l'utilisation d'un code promo pour une commande.
   * Doit être appelé DANS la transaction de création de commande pour garantir
   * la cohérence (rollback commun en cas d'échec).
   * @param {Object} data
   * @param {import('pg').PoolClient} [client] - client de transaction (sinon pool global)
   */
  async enregistrerUtilisation(
    { codePromoId, commandeId, utilisateurId, montantRabaisApplique, totalAvantRabais },
    client = null
  ) {
    const db = client || pool;
    const sql = `
      INSERT INTO code_promo_utilisation (
        code_promo_id, commande_id, utilisateur_id, montant_rabais_applique, total_avant_rabais
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(sql, [
      codePromoId,
      commandeId,
      utilisateurId,
      montantRabaisApplique,
      totalAvantRabais
    ]);
    return result.rows[0];
  }

  /**
   * Liste paginée des codes promo (admin) avec stats agrégées d'utilisation
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, actif } = options;
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (actif !== undefined && actif !== null) {
      whereClause += ` AND cp.actif = $${paramIndex++}`;
      params.push(actif);
    }

    const sql = `
      SELECT
        cp.*,
        COUNT(cpu.id) as nb_utilisations,
        COUNT(DISTINCT cpu.utilisateur_id) as nb_clients,
        COALESCE(SUM(cpu.total_avant_rabais), 0) as ca_genere
      FROM code_promo cp
      LEFT JOIN code_promo_utilisation cpu ON cpu.code_promo_id = cp.id
      ${whereClause}
      GROUP BY cp.id
      ORDER BY cp.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const countSql = `SELECT COUNT(*) as total FROM code_promo cp ${whereClause}`;

    const [listResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total, 10) || 0;
    const totalPages = Math.ceil(total / limit) || 0;

    return {
      codesPromo: listResult.rows.map((row) => this._mapPromoStats(row)),
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
   * Détail d'un code promo (admin) avec stats complètes
   */
  async findById(id) {
    const sql = `
      SELECT
        cp.*,
        COUNT(cpu.id) as nb_utilisations,
        COUNT(DISTINCT cpu.utilisateur_id) as nb_clients,
        COALESCE(SUM(cpu.total_avant_rabais), 0) as ca_genere,
        COALESCE(SUM(cpu.montant_rabais_applique), 0) as total_rabais_accorde
      FROM code_promo cp
      LEFT JOIN code_promo_utilisation cpu ON cpu.code_promo_id = cp.id
      WHERE cp.id = $1
      GROUP BY cp.id
    `;
    const result = await query(sql, [id]);
    return result.rows[0] ? this._mapPromoStats(result.rows[0]) : null;
  }

  /**
   * Crée un nouveau code promo
   */
  async create(data) {
    const sql = `
      INSERT INTO code_promo (
        code, description, type_rabais, valeur_rabais, montant_minimum,
        max_utilisations_global, max_utilisations_par_client,
        date_debut, date_fin, actif, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      data.code.toUpperCase().trim(),
      data.description || null,
      data.typeRabais,
      data.valeurRabais,
      data.montantMinimum || 0,
      data.maxUtilisationsGlobal ?? null,
      data.maxUtilisationsParClient ?? 1,
      data.dateDebut || null,
      toEndOfDay(data.dateFin) || null,
      data.actif === undefined ? true : data.actif,
      data.createdBy || null
    ];
    const result = await query(sql, params);
    logger.info(`Code promo créé: ${result.rows[0].code}`, { createdBy: data.createdBy });
    return this._mapPromo(result.rows[0]);
  }

  /**
   * Met à jour un code promo (whitelist de champs)
   */
  async update(id, data) {
    const sets = [];
    const params = [];
    let paramIndex = 1;

    for (const [jsField, column] of Object.entries(UPDATABLE_FIELDS)) {
      if (Object.prototype.hasOwnProperty.call(data, jsField)) {
        sets.push(`${column} = $${paramIndex++}`);
        params.push(jsField === 'dateFin' ? toEndOfDay(data[jsField]) : data[jsField]);
      }
    }

    if (sets.length === 0) {
      return this.findByIdRaw(id);
    }

    sets.push('updated_at = NOW()');
    params.push(id);

    const sql = `
      UPDATE code_promo
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const result = await query(sql, params);
    return result.rows[0] ? this._mapPromo(result.rows[0]) : null;
  }

  /**
   * Active / désactive un code promo
   */
  async toggleActif(id) {
    const sql = `
      UPDATE code_promo
      SET actif = NOT actif, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0] ? this._mapPromo(result.rows[0]) : null;
  }

  /**
   * Supprime un code promo (seulement si aucune utilisation n'existe —
   * garanti aussi par la FK ON DELETE RESTRICT sur code_promo_utilisation).
   */
  async remove(id) {
    const result = await query('DELETE FROM code_promo WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  /**
   * Mappe une ligne code_promo (SQL -> objet JS), contrat API camelCase
   */
  _mapPromo(row) {
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      typeRabais: row.type_rabais,
      valeurRabais: parseFloat(row.valeur_rabais),
      montantMinimum: parseFloat(row.montant_minimum) || 0,
      maxUtilisationsGlobal: row.max_utilisations_global,
      maxUtilisationsParClient: row.max_utilisations_par_client,
      dateDebut: row.date_debut,
      dateFin: row.date_fin,
      actif: row.actif,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Mappe une ligne code_promo enrichie de stats d'utilisation (admin)
   */
  _mapPromoStats(row) {
    const base = this._mapPromo(row);
    return {
      ...base,
      nbUtilisations: parseInt(row.nb_utilisations, 10) || 0,
      nbClients: parseInt(row.nb_clients, 10) || 0,
      caGenere: parseFloat(row.ca_genere) || 0,
      ...(row.total_rabais_accorde !== undefined
        ? { totalRabaisAccorde: parseFloat(row.total_rabais_accorde) || 0 }
        : {})
    };
  }
}

module.exports = new PromoRepository();
