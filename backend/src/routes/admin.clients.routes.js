/**
 * Admin Clients Routes - VERSION CORRIGÉE
 * @description Routes API pour la gestion des clients (admin)
 * 
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { query: dbQuery, getClient } = require('../config/database');
const logger = require('../config/logger');

// Toutes les routes nécessitent d'être admin
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/admin/clients/stats
 * @desc    Statistiques globales des clients
 * @access  Admin
 */
router.get('/stats', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type_client = 'PARTICULIER') as particuliers,
        COUNT(*) FILTER (WHERE type_client = 'PROFESSIONNEL') as professionnels,
        COUNT(*) FILTER (WHERE est_actif = true) as actifs,
        COUNT(*) FILTER (WHERE est_actif = false) as inactifs
      FROM utilisateur
      WHERE role = 'CLIENT'
    `;

    const result = await dbQuery(sql);
    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        total: parseInt(row.total) || 0,
        particuliers: parseInt(row.particuliers) || 0,
        professionnels: parseInt(row.professionnels) || 0,
        actifs: parseInt(row.actifs) || 0,
        inactifs: parseInt(row.inactifs) || 0
      }
    });
  } catch (error) {
    logger.error('Erreur stats clients', { error: error.message });
    next(error);
  }
});

/**
 * @route   GET /api/admin/clients
 * @desc    Liste de tous les clients avec pagination et filtres
 * @access  Admin
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('typeClient').optional().isIn(['PARTICULIER', 'PROFESSIONNEL']),
    query('estActif').optional().isBoolean(),
    query('orderBy').optional().isIn(['dateCreation', 'nom', 'email', 'caTotal']),
    query('orderDir').optional().isIn(['ASC', 'DESC'])
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 15,
        search,
        typeClient,
        estActif,
        orderBy = 'dateCreation',
        orderDir = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const params = [];
      let paramIndex = 1;
      let whereConditions = ["role = 'CLIENT'"];

      // Filtre recherche
      if (search) {
        whereConditions.push(`(
          LOWER(nom) LIKE LOWER($${paramIndex}) OR 
          LOWER(prenom) LIKE LOWER($${paramIndex}) OR 
          LOWER(email) LIKE LOWER($${paramIndex}) OR
          LOWER(raison_sociale) LIKE LOWER($${paramIndex})
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filtre type client
      if (typeClient) {
        whereConditions.push(`type_client = $${paramIndex++}`);
        params.push(typeClient);
      }

      // Filtre actif
      if (estActif !== undefined) {
        whereConditions.push(`est_actif = $${paramIndex++}`);
        params.push(estActif === 'true');
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Mapping des colonnes pour le tri
      const orderByMapping = {
        dateCreation: 'u.date_creation',
        nom: 'u.nom',
        email: 'u.email',
        caTotal: 'ca_total'
      };
      const orderColumn = orderByMapping[orderBy] || 'u.date_creation';

      // Requête principale avec stats
      const sql = `
        SELECT 
          u.id,
          u.email,
          u.nom,
          u.prenom,
          u.telephone,
          u.type_client,
          u.raison_sociale,
          u.siret,
          u.numero_tva,
          u.est_actif,
          u.date_creation,
          u.derniere_connexion,
          COUNT(c.id) as nb_commandes,
          COALESCE(SUM(c.total_ttc), 0) as ca_total
        FROM utilisateur u
        LEFT JOIN commande c ON c.utilisateur_id = u.id AND c.statut != 'ANNULEE'
        ${whereClause}
        GROUP BY u.id
        ORDER BY ${orderColumn} ${orderDir}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), offset);

      // Requête count
      const countSql = `
        SELECT COUNT(*) as total
        FROM utilisateur u
        ${whereClause}
      `;

      // Stats globales
      const statsSql = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE type_client = 'PARTICULIER') as particuliers,
          COUNT(*) FILTER (WHERE type_client = 'PROFESSIONNEL') as professionnels,
          COUNT(*) FILTER (WHERE est_actif = true) as actifs
        FROM utilisateur
        WHERE role = 'CLIENT'
      `;

      const [dataResult, countResult, statsResult] = await Promise.all([
        dbQuery(sql, params),
        dbQuery(countSql, params.slice(0, paramIndex - 3)),
        dbQuery(statsSql)
      ]);

      const clients = dataResult.rows.map(row => ({
        id: row.id,
        email: row.email,
        nom: row.nom,
        prenom: row.prenom,
        telephone: row.telephone,
        typeClient: row.type_client,
        raisonSociale: row.raison_sociale,
        siret: row.siret,
        numeroTva: row.numero_tva,
        estActif: row.est_actif,
        dateCreation: row.date_creation,
        derniereConnexion: row.derniere_connexion,
        nbCommandes: parseInt(row.nb_commandes) || 0,
        caTotal: parseFloat(row.ca_total) || 0
      }));

      const total = parseInt(countResult.rows[0].total);
      const statsRow = statsResult.rows[0];

      res.json({
        success: true,
        data: clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total: parseInt(statsRow.total) || 0,
          particuliers: parseInt(statsRow.particuliers) || 0,
          professionnels: parseInt(statsRow.professionnels) || 0,
          actifs: parseInt(statsRow.actifs) || 0
        }
      });
    } catch (error) {
      logger.error('Erreur liste clients', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/clients/:id
 * @desc    Détail d'un client
 * @access  Admin
 */
router.get('/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const sql = `
        SELECT 
          u.*,
          COUNT(c.id) as nb_commandes,
          COALESCE(SUM(c.total_ttc), 0) as ca_total,
          COALESCE(AVG(c.total_ttc), 0) as panier_moyen,
          MAX(c.date_commande) as derniere_commande
        FROM utilisateur u
        LEFT JOIN commande c ON c.utilisateur_id = u.id AND c.statut != 'ANNULEE'
        WHERE u.id = $1 AND u.role = 'CLIENT'
        GROUP BY u.id
      `;

      const result = await dbQuery(sql, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const row = result.rows[0];
      const client = {
        id: row.id,
        email: row.email,
        nom: row.nom,
        prenom: row.prenom,
        telephone: row.telephone,
        typeClient: row.type_client,
        raisonSociale: row.raison_sociale,
        siret: row.siret,
        numeroTva: row.numero_tva,
        estActif: row.est_actif,
        dateCreation: row.date_creation,
        derniereConnexion: row.derniere_connexion,
        nbCommandes: parseInt(row.nb_commandes) || 0,
        caTotal: parseFloat(row.ca_total) || 0,
        panierMoyen: parseFloat(row.panier_moyen) || 0,
        derniereCommande: row.derniere_commande
      };

      // Récupérer les dernières commandes
      const ordersSql = `
        SELECT id, numero_commande, statut, total_ttc, date_commande
        FROM commande
        WHERE utilisateur_id = $1
        ORDER BY date_commande DESC
        LIMIT 5
      `;
      const ordersResult = await dbQuery(ordersSql, [id]);
      
      client.dernieresCommandes = ordersResult.rows.map(o => ({
        id: o.id,
        numeroCommande: o.numero_commande,
        statut: o.statut,
        totalTtc: parseFloat(o.total_ttc),
        dateCommande: o.date_commande
      }));

      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      logger.error('Erreur détail client', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/admin/clients/:id
 * @desc    Modifier un client
 * @access  Admin
 */
router.patch('/:id',
  [
    param('id').isUUID(),
    body('nom').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('prenom').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('telephone').optional().isString().trim(),
    body('typeClient').optional().isIn(['PARTICULIER', 'PROFESSIONNEL']),
    body('raisonSociale').optional().isString().trim(),
    body('siret').optional().isString().trim(),
    body('numeroTva').optional().isString().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const fields = [];
      const values = [];
      let paramIndex = 1;

      const fieldMapping = {
        nom: 'nom',
        prenom: 'prenom',
        telephone: 'telephone',
        typeClient: 'type_client',
        raisonSociale: 'raison_sociale',
        siret: 'siret',
        numeroTva: 'numero_tva'
      };

      for (const [key, column] of Object.entries(fieldMapping)) {
        if (updates[key] !== undefined) {
          fields.push(`${column} = $${paramIndex++}`);
          values.push(updates[key]);
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée à modifier'
        });
      }

      // Ajouter date_modification
      fields.push(`date_modification = NOW()`);
      values.push(id);

      const sql = `
        UPDATE utilisateur
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex} AND role = 'CLIENT'
        RETURNING *
      `;

      const result = await dbQuery(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Client modifié avec succès',
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Erreur modification client', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/admin/clients/:id/toggle-status
 * @desc    Activer/désactiver un client
 * @access  Admin
 */
router.patch('/:id/toggle-status',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const sql = `
        UPDATE utilisateur
        SET est_actif = NOT est_actif, date_modification = NOW()
        WHERE id = $1 AND role = 'CLIENT'
        RETURNING id, nom, prenom, email, est_actif
      `;

      const result = await dbQuery(sql, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      const client = result.rows[0];
      const action = client.est_actif ? 'activé' : 'bloqué';

      logger.info(`Client ${action}`, { clientId: id });

      res.json({
        success: true,
        message: `Client ${action} avec succès`,
        data: {
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          email: client.email,
          estActif: client.est_actif
        }
      });
    } catch (error) {
      logger.error('Erreur toggle status client', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/admin/clients/:id
 * @desc    Supprimer un client (anonymisation RGPD)
 * @access  Admin
 * 
 * ✅ CORRIGÉ: mot_de_passe_hash au lieu de mot_de_passe
 */
router.delete('/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    const client = await getClient();
    
    try {
      const { id } = req.params;

      await client.query('BEGIN');

      // Vérifier que le client existe
      const checkResult = await client.query(
        `SELECT id, email FROM utilisateur WHERE id = $1 AND role = 'CLIENT'`,
        [id]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }

      // Supprimer les paniers
      await client.query(
        'DELETE FROM panier WHERE utilisateur_id = $1',
        [id]
      );

      // Supprimer les adresses
      await client.query(
        'DELETE FROM adresse WHERE utilisateur_id = $1',
        [id]
      );

      // Anonymisation RGPD (ne pas supprimer pour garder l'historique des commandes)
      const anonymizedEmail = `supprime_${id.substring(0, 8)}@deleted.local`;
      
      const sql = `
        UPDATE utilisateur
        SET 
          email = $1,
          nom = 'Compte supprimé',
          prenom = '',
          telephone = NULL,
          raison_sociale = NULL,
          siret = NULL,
          numero_tva = NULL,
          mot_de_passe_hash = 'DELETED',
          est_actif = false,
          date_modification = NOW()
        WHERE id = $2
        RETURNING id
      `;

      await client.query(sql, [anonymizedEmail, id]);
      await client.query('COMMIT');

      logger.info('Client anonymisé (RGPD)', { clientId: id });

      res.json({
        success: true,
        message: 'Client supprimé et données anonymisées (RGPD)'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur suppression client', { error: error.message });
      next(error);
    } finally {
      client.release();
    }
  }
);

/**
 * @route   GET /api/admin/clients/:id/orders
 * @desc    Commandes d'un client
 * @access  Admin
 */
router.get('/:id/orders',
  [
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const sql = `
        SELECT 
          id, numero_commande, statut, total_ht, total_tva, total_ttc,
          frais_livraison, date_commande
        FROM commande
        WHERE utilisateur_id = $1
        ORDER BY date_commande DESC
        LIMIT $2 OFFSET $3
      `;

      const countSql = `SELECT COUNT(*) as total FROM commande WHERE utilisateur_id = $1`;

      const [dataResult, countResult] = await Promise.all([
        dbQuery(sql, [id, parseInt(limit), offset]),
        dbQuery(countSql, [id])
      ]);

      const orders = dataResult.rows.map(row => ({
        id: row.id,
        numeroCommande: row.numero_commande,
        statut: row.statut,
        totalHt: parseFloat(row.total_ht) || 0,
        totalTva: parseFloat(row.total_tva) || 0,
        totalTtc: parseFloat(row.total_ttc) || 0,
        fraisLivraison: parseFloat(row.frais_livraison) || 0,
        dateCommande: row.date_commande
      }));

      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Erreur commandes client', { error: error.message });
      next(error);
    }
  }
);

module.exports = router;
