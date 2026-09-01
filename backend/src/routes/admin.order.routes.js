/**
 * Admin Orders Routes - VERSION CORRIGÉE
 * @description Routes API pour la gestion des commandes (admin)
 * 
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { query: dbQuery } = require('../config/database');
const orderService = require('../services/order.service');
const orderRepository = require('../repositories/order.repository');
const auditRepository = require('../repositories/audit.repository');
const invoiceService = require('../services/invoice.service');
const logger = require('../config/logger');

// Toutes les routes nécessitent d'être admin
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/admin/orders/stats
 * @desc    Statistiques des commandes
 * @access  Admin
 */
router.get('/stats', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(total_ttc) FILTER (WHERE statut != 'ANNULEE'), 0) as chiffre_affaires,
        COALESCE(AVG(total_ttc) FILTER (WHERE statut != 'ANNULEE'), 0) as panier_moyen,
        COUNT(*) FILTER (WHERE statut = 'EN_ATTENTE') as en_attente,
        COUNT(*) FILTER (WHERE statut = 'CONFIRMEE') as confirmees,
        COUNT(*) FILTER (WHERE statut = 'EN_PREPARATION') as en_preparation,
        COUNT(*) FILTER (WHERE statut = 'EXPEDIEE') as expediees,
        COUNT(*) FILTER (WHERE statut = 'LIVREE') as livrees,
        COUNT(*) FILTER (WHERE statut = 'ANNULEE') as annulees
      FROM commande
    `;

    const result = await dbQuery(sql);
    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        total: parseInt(row.total) || 0,
        chiffreAffaires: parseFloat(row.chiffre_affaires) || 0,
        panierMoyen: parseFloat(row.panier_moyen) || 0,
        parStatut: {
          enAttente: parseInt(row.en_attente) || 0,
          confirmees: parseInt(row.confirmees) || 0,
          enPreparation: parseInt(row.en_preparation) || 0,
          expediees: parseInt(row.expediees) || 0,
          livrees: parseInt(row.livrees) || 0,
          annulees: parseInt(row.annulees) || 0
        }
      }
    });
  } catch (error) {
    logger.error('Erreur stats commandes', { error: error.message });
    next(error);
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Liste de toutes les commandes avec pagination et filtres
 * @access  Admin
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('statut').optional().isIn(['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE']),
    query('dateDebut').optional().isISO8601(),
    query('dateFin').optional().isISO8601(),
    query('orderBy').optional().isIn(['createdAt', 'total', 'statut']),
    query('orderDir').optional().isIn(['ASC', 'DESC'])
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 15,
        search,
        statut,
        dateDebut,
        dateFin,
        orderBy = 'createdAt',
        orderDir = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const params = [];
      let paramIndex = 1;
      let whereConditions = [];

      // Filtre recherche
      if (search) {
        whereConditions.push(`(
          c.numero_commande ILIKE $${paramIndex} OR 
          u.nom ILIKE $${paramIndex} OR 
          u.prenom ILIKE $${paramIndex} OR
          u.email ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Filtre statut
      if (statut) {
        whereConditions.push(`c.statut = $${paramIndex++}`);
        params.push(statut);
      }

      // Filtre date début
      if (dateDebut) {
        whereConditions.push(`c.date_commande >= $${paramIndex++}`);
        params.push(dateDebut);
      }

      // Filtre date fin
      if (dateFin) {
        whereConditions.push(`c.date_commande <= $${paramIndex++}`);
        params.push(dateFin);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Mapping des colonnes pour le tri
      const orderByMapping = {
        createdAt: 'c.date_commande',
        total: 'c.total_ttc',
        statut: 'c.statut'
      };
      const orderColumn = orderByMapping[orderBy] || 'c.date_commande';

      // Requête principale avec infos client
      const sql = `
        SELECT 
          c.id,
          c.numero_commande,
          c.statut,
          c.total_ht,
          c.total_tva,
          c.total_ttc,
          c.frais_livraison,
          c.mode_paiement,
          c.adresse_livraison,
          c.date_commande,
          c.date_modification,
          u.id as client_id,
          u.nom as client_nom,
          u.prenom as client_prenom,
          u.email as client_email,
          u.telephone as client_telephone,
          u.type_client as client_type,
          (SELECT COUNT(*) FROM ligne_commande lc WHERE lc.commande_id = c.id) as nb_articles
        FROM commande c
        LEFT JOIN utilisateur u ON c.utilisateur_id = u.id
        ${whereClause}
        ORDER BY ${orderColumn} ${orderDir}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), offset);

      // Requête count
      const countSql = `
        SELECT COUNT(*) as total
        FROM commande c
        LEFT JOIN utilisateur u ON c.utilisateur_id = u.id
        ${whereClause}
      `;

      const [dataResult, countResult] = await Promise.all([
        dbQuery(sql, params),
        dbQuery(countSql, params.slice(0, paramIndex - 3))
      ]);

      const orders = dataResult.rows.map(row => ({
        id: row.id,
        numero: row.numero_commande,
        numeroCommande: row.numero_commande,
        statut: row.statut,
        totalHt: parseFloat(row.total_ht) || 0,
        totalTva: parseFloat(row.total_tva) || 0,
        totalTtc: parseFloat(row.total_ttc) || 0,
        fraisLivraison: parseFloat(row.frais_livraison) || 0,
        modePaiement: row.mode_paiement,
        nbArticles: parseInt(row.nb_articles) || 0,
        dateCommande: row.date_commande,
        createdAt: row.date_commande,
        // ✅ Client au bon format
        client: row.client_nom ? {
          id: row.client_id,
          nom: row.client_nom,
          prenom: row.client_prenom,
          email: row.client_email,
          telephone: row.client_telephone,
          typeClient: row.client_type
        } : null
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
      logger.error('Erreur liste commandes', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Détail d'une commande avec lignes et infos client
 * @access  Admin
 */
router.get('/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Requête commande avec client
      const orderSql = `
        SELECT 
          c.*,
          u.id as client_id,
          u.nom as client_nom,
          u.prenom as client_prenom,
          u.email as client_email,
          u.telephone as client_telephone,
          u.type_client as client_type
        FROM commande c
        LEFT JOIN utilisateur u ON c.utilisateur_id = u.id
        WHERE c.id = $1
      `;

      // Requête lignes avec produits
      const linesSql = `
        SELECT 
          lc.id,
          lc.produit_id,
          lc.quantite,
          lc.prix_unitaire_ht,
          lc.taux_tva,
          lc.nom_produit,
          p.nom as produit_nom,
          p.reference as produit_reference,
          p.image_url as produit_image,
          p.stock_quantite as produit_stock
        FROM ligne_commande lc
        LEFT JOIN produit p ON lc.produit_id = p.id
        WHERE lc.commande_id = $1
        ORDER BY lc.id
      `;

      const [orderResult, linesResult] = await Promise.all([
        dbQuery(orderSql, [id]),
        dbQuery(linesSql, [id])
      ]);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      const row = orderResult.rows[0];
      
      // Parser l'adresse de livraison
      let adresseLivraison = null;
      if (row.adresse_livraison) {
        try {
          adresseLivraison = typeof row.adresse_livraison === 'string' 
            ? JSON.parse(row.adresse_livraison) 
            : row.adresse_livraison;
        } catch (e) {
          adresseLivraison = { adresse: row.adresse_livraison };
        }
      }

      const order = {
        id: row.id,
        numero: row.numero_commande,
        numeroCommande: row.numero_commande,
        statut: row.statut,
        totalHt: parseFloat(row.total_ht) || 0,
        totalTva: parseFloat(row.total_tva) || 0,
        totalTtc: parseFloat(row.total_ttc) || 0,
        fraisLivraison: parseFloat(row.frais_livraison) || 0,
        modePaiement: row.mode_paiement,
        paiementStatut: row.paiement_statut || 'PENDING',
        adresseLivraison,
        instructionsLivraison: row.instructions_livraison,
        dateCommande: row.date_commande,
        createdAt: row.date_commande,
        updatedAt: row.date_modification,
        // ✅ Client au bon format
        client: row.client_nom ? {
          id: row.client_id,
          nom: row.client_nom,
          prenom: row.client_prenom,
          email: row.client_email,
          telephone: row.client_telephone,
          typeClient: row.client_type
        } : null,
        // ✅ Lignes avec produit.nom
        lignes: linesResult.rows.map(ligne => {
          const prixHt = parseFloat(ligne.prix_unitaire_ht) || 0;
          const quantite = parseInt(ligne.quantite) || 0;
          const tauxTva = parseFloat(ligne.taux_tva) || 20;
          const totalHt = prixHt * quantite;
          const totalTtc = totalHt * (1 + tauxTva / 100);

          return {
            id: ligne.id,
            produitId: ligne.produit_id,
            quantite,
            prixUnitaireHt: prixHt,
            tauxTva,
            totalHt,
            totalTtc,
            // ✅ Produit avec nom
            produit: {
              id: ligne.produit_id,
              nom: ligne.produit_nom || ligne.nom_produit || 'Produit',
              reference: ligne.produit_reference,
              imageUrl: ligne.produit_image,
              stockQuantite: ligne.produit_stock != null ? parseInt(ligne.produit_stock) : null
            }
          };
        })
      };

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Erreur détail commande', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/orders/:id/history
 * @desc    Historique des transitions de statut d'une commande
 * @access  Admin
 */
router.get('/:id/history',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const history = await orderRepository.getHistory(req.params.id);
      res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Erreur historique commande', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Mettre à jour le statut d'une commande
 * @access  Admin
 *
 * ✅ Si statut = ANNULEE, restaure le stock
 */
router.patch('/:id/status',
  [
    param('id').isUUID(),
    body('statut').isIn(['EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE', 'REMBOURSE', 'PARTIELLEMENT_REMBOURSE']),
    body('instructionsLivraison').optional().isString().trim().isLength({ max: 500 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { statut, instructionsLivraison } = req.body;

      const result = await orderService.updateStatus(id, statut, instructionsLivraison);

      // Audit log (non critique — fire and forget)
      auditRepository.log({
        action: 'ORDER_STATUS_UPDATE',
        entiteType: 'commande',
        entiteId: id,
        utilisateurId: req.user.id,
        details: { nouveauStatut: statut, instructionsLivraison: instructionsLivraison || null },
        ipAddress: req.ip
      }).catch(err => logger.warn('Audit log non enregistré:', err.message));

      // Génération automatique de facture (T5-08) — fire and forget
      // VIREMENT/CHEQUE : facturé à la CONFIRMATION (l'admin confirme = paiement reçu/vérifié)
      // ESPECES : facturé à la LIVRAISON (paiement à la livraison)
      const modePaiement = result.order.modePaiement;
      const doitGenererFacture =
        (statut === 'CONFIRMEE' && ['VIREMENT', 'CHEQUE'].includes(modePaiement)) ||
        (statut === 'LIVREE' && modePaiement === 'ESPECES');

      if (doitGenererFacture) {
        invoiceService.generateForOrder(id)
          .then(f => logger.info(`Facture ${f.numero} générée pour commande ${id} (${modePaiement})`))
          .catch(err => logger.error(`Génération facture échouée pour ${id}:`, err.message));
      }

      res.json({
        success: true,
        message: result.message,
        data: {
          id: result.order.id,
          numeroCommande: result.order.numeroCommande,
          statut: result.order.statut
        }
      });
    } catch (error) {
      logger.error('Erreur mise a jour statut commande', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/admin/orders/:id/payment-status
 * @desc    Mettre à jour manuellement le statut de paiement
 * @access  Admin
 *
 * Aucun paiement en ligne (MVP ESPECES / VIREMENT / CHEQUE uniquement) :
 * le statut de paiement est toujours positionné manuellement par un admin.
 */
router.patch('/:id/payment-status',
  [
    param('id').isUUID(),
    body('paiementStatut').isIn(['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED'])
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { paiementStatut } = req.body;

      const order = await orderRepository.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Commande introuvable' });
      }

      let updated;
      if (paiementStatut === 'PAID') {
        updated = await orderRepository.markPaid(id);
      } else {
        updated = await orderRepository.updatePaymentStatus(id, paiementStatut);
      }

      logger.info('Paiement mis à jour manuellement par admin', {
        orderId: id,
        adminId: req.user.id,
        paiementStatut,
        modePaiement: order.modePaiement
      });

      auditRepository.log({
        action: 'PAYMENT_STATUS_UPDATE',
        entiteType: 'commande',
        entiteId: id,
        utilisateurId: req.user.id,
        details: { paiementStatut },
        ipAddress: req.ip
      }).catch(err => logger.warn('Audit log non enregistré:', err.message));

      res.json({
        success: true,
        data: updated,
        message: `Statut paiement mis à jour: ${paiementStatut}`
      });
    } catch (error) {
      logger.error('Erreur mise a jour statut paiement', { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   POST /api/admin/orders/:id/refund
 * @desc    Enregistrer un remboursement manuel (ESPECES / VIREMENT / CHEQUE)
 * @access  Admin
 * @body    { montant: number (EUR), raison?: string }
 *
 * Aucun paiement en ligne : le remboursement est effectué hors système
 * (espèces rendues, virement émis, chèque annulé/réémis) et seulement tracé
 * ici pour la comptabilité et l'audit.
 * Statuts autorisant un remboursement : commande avec paiement_statut=PAID
 * et statut NOT IN (ANNULEE, REMBOURSE, EN_ATTENTE).
 */
router.post('/:id/refund',
  [
    param('id').isUUID(),
    body('montant').isFloat({ min: 0.01 }).withMessage('montant requis (> 0)'),
    body('raison').optional().isString().trim().isLength({ max: 500 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { montant, raison } = req.body;

      const order = await orderRepository.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Commande introuvable' });
      }

      const STATUTS_REMBOURSABLES = ['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'PARTIELLEMENT_REMBOURSE'];
      if (!STATUTS_REMBOURSABLES.includes(order.statut)) {
        return res.status(400).json({
          success: false,
          message: `Remboursement impossible pour une commande en statut "${order.statut}"`
        });
      }

      if (order.paiementStatut !== 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Seules les commandes payées peuvent être remboursées'
        });
      }

      const montantCentsDemande = Math.round(montant * 100);
      const totalTtcCents = Math.round(order.totalTtc * 100);
      if (montantCentsDemande > totalTtcCents) {
        return res.status(400).json({
          success: false,
          message: 'Le montant remboursé ne peut pas dépasser le total de la commande'
        });
      }

      const isTotal = montantCentsDemande >= totalTtcCents;
      const nouveauStatut = isTotal ? 'REMBOURSE' : 'PARTIELLEMENT_REMBOURSE';

      await orderRepository.updateRefund(order.id, {
        montantRembourse: montant,
        nouveauStatut
      });

      if (isTotal) {
        await orderRepository.updatePaymentStatus(order.id, 'REFUNDED');
      }

      auditRepository.log({
        action: 'REFUND_MANUAL',
        entiteType: 'commande',
        entiteId: order.id,
        utilisateurId: req.user.id,
        details: { montant, raison: raison || null, total: isTotal, modePaiement: order.modePaiement },
        ipAddress: req.ip
      }).catch(err => logger.warn('Audit refund non logué:', err.message));

      logger.info('Remboursement manuel admin enregistré', {
        orderId: order.id, montant, adminId: req.user.id, modePaiement: order.modePaiement
      });

      res.json({
        success: true,
        data: {
          montant,
          statutCommande: nouveauStatut
        }
      });
    } catch (error) {
      logger.error('Erreur enregistrement remboursement', { error: error.message });
      next(error);
    }
  }
);

module.exports = router;

