/**
 * Promo Routes
 * @description Routes API pour les codes promo (client + admin)
 *
 * Contrat JSON exposé (snake_case) — utilisé par le front admin/checkout :
 * code, description, type_rabais, valeur_rabais, montant_minimum,
 * max_utilisations_global, max_utilisations_par_client, date_debut, date_fin,
 * actif, montant_rabais, total_apres_rabais, nb_utilisations, nb_clients, ca_genere.
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { ApiError } = require('../middlewares/errorHandler');
const promoService = require('../services/promo.service');
const promoRepository = require('../repositories/promo.repository');
const auditRepository = require('../repositories/audit.repository');
const logger = require('../config/logger');

const CODE_PATTERN = /^[A-Z0-9_-]+$/i;

/**
 * Sérialise un code promo (objet interne camelCase) vers le contrat JSON
 * snake_case exposé par l'API.
 */
function serializePromo(promo) {
  if (!promo) return null;
  const base = {
    id: promo.id,
    code: promo.code,
    description: promo.description,
    type_rabais: promo.typeRabais,
    valeur_rabais: promo.valeurRabais,
    montant_minimum: promo.montantMinimum,
    max_utilisations_global: promo.maxUtilisationsGlobal,
    max_utilisations_par_client: promo.maxUtilisationsParClient,
    date_debut: promo.dateDebut,
    date_fin: promo.dateFin,
    actif: promo.actif,
    created_at: promo.createdAt,
    updated_at: promo.updatedAt
  };

  if (promo.nbUtilisations !== undefined) {
    base.nb_utilisations = promo.nbUtilisations;
    base.nb_clients = promo.nbClients;
    base.ca_genere = promo.caGenere;
  }
  if (promo.totalRabaisAccorde !== undefined) {
    base.total_rabais_accorde = promo.totalRabaisAccorde;
  }

  return base;
}

// ==========================================
// ROUTE CLIENT (authentification requise)
// ==========================================

/**
 * @route   POST /api/promo/valider
 * @desc    Valider un code promo pour un total de commande donné
 * @access  Private (Client)
 */
router.post(
  '/valider',
  authenticate,
  [
    body('code').isString().trim().notEmpty().withMessage('Le code promo est obligatoire'),
    body('total_commande').isFloat({ min: 0.01 }).withMessage('total_commande requis (> 0)')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { code, total_commande: totalCommande } = req.body;
      const result = await promoService.validerCode(code, req.user.id, Number(totalCommande));

      res.json({
        success: true,
        data: {
          code: result.codePromo.code,
          type_rabais: result.codePromo.typeRabais,
          valeur_rabais: result.codePromo.valeurRabais,
          montant_minimum: result.codePromo.montantMinimum,
          montant_rabais: result.montantRabais,
          total_apres_rabais: result.totalApresRabais
        },
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ROUTES ADMIN
// ==========================================

/**
 * @route   GET /api/promo/admin
 * @desc    Liste paginée des codes promo avec stats d'utilisation
 * @access  Admin
 */
router.get(
  '/admin',
  authenticate,
  isAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('actif').optional().isBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, actif } = req.query;
      const result = await promoRepository.findAll({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        actif: actif === undefined ? undefined : actif === 'true'
      });

      res.json({
        success: true,
        data: result.codesPromo.map(serializePromo),
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/promo/admin/:id
 * @desc    Détail d'un code promo avec stats complètes
 * @access  Admin
 */
router.get(
  '/admin/:id',
  authenticate,
  isAdmin,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const promo = await promoRepository.findById(req.params.id);
      if (!promo) {
        throw ApiError.notFound('Code promo non trouvé');
      }
      res.json({ success: true, data: serializePromo(promo) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/promo/admin
 * @desc    Créer un code promo
 * @access  Admin
 */
router.post(
  '/admin',
  authenticate,
  isAdmin,
  [
    body('code')
      .isString().trim().isLength({ min: 3, max: 50 })
      .matches(CODE_PATTERN).withMessage('Le code ne peut contenir que des lettres, chiffres, "-" et "_"'),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('type_rabais').isIn(['POURCENTAGE', 'MONTANT_FIXE']),
    body('valeur_rabais').isFloat({ gt: 0 }).withMessage('valeur_rabais doit être > 0'),
    body('montant_minimum').optional().isFloat({ min: 0 }),
    body('max_utilisations_global').optional({ nullable: true }).isInt({ min: 1 }),
    body('max_utilisations_par_client').optional({ nullable: true }).isInt({ min: 1 }),
    body('date_debut').optional({ nullable: true }).isISO8601(),
    body('date_fin').optional({ nullable: true }).isISO8601(),
    body('actif').optional().isBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        code, description, type_rabais: typeRabais, valeur_rabais: valeurRabais,
        montant_minimum: montantMinimum, max_utilisations_global: maxUtilisationsGlobal,
        max_utilisations_par_client: maxUtilisationsParClient,
        date_debut: dateDebut, date_fin: dateFin, actif
      } = req.body;

      if (typeRabais === 'POURCENTAGE' && Number(valeurRabais) > 100) {
        throw ApiError.badRequest('Un rabais de type POURCENTAGE ne peut pas dépasser 100');
      }
      if (dateDebut && dateFin && new Date(dateFin) < new Date(dateDebut)) {
        throw ApiError.badRequest('date_fin doit être postérieure à date_debut');
      }

      const existing = await promoRepository.findByCode(code);
      if (existing) {
        throw ApiError.conflict('Ce code promo existe déjà');
      }

      const promo = await promoRepository.create({
        code,
        description,
        typeRabais,
        valeurRabais,
        montantMinimum,
        maxUtilisationsGlobal,
        maxUtilisationsParClient,
        dateDebut,
        dateFin,
        actif,
        createdBy: req.user.id
      });

      auditRepository.log({
        action: 'PROMO_CREATED',
        entiteType: 'code_promo',
        entiteId: promo.id,
        utilisateurId: req.user.id,
        details: { code: promo.code, typeRabais: promo.typeRabais, valeurRabais: promo.valeurRabais },
        ipAddress: req.ip
      }).catch((err) => logger.warn('Audit log non enregistré (promo create):', err.message));

      res.status(201).json({ success: true, data: serializePromo(promo) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/promo/admin/:id
 * @desc    Modifier un code promo (whitelist de champs)
 * @access  Admin
 */
router.patch(
  '/admin/:id',
  authenticate,
  isAdmin,
  [
    param('id').isUUID(),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('type_rabais').optional().isIn(['POURCENTAGE', 'MONTANT_FIXE']),
    body('valeur_rabais').optional().isFloat({ gt: 0 }),
    body('montant_minimum').optional().isFloat({ min: 0 }),
    body('max_utilisations_global').optional({ nullable: true }).isInt({ min: 1 }),
    body('max_utilisations_par_client').optional({ nullable: true }).isInt({ min: 1 }),
    body('date_debut').optional({ nullable: true }).isISO8601(),
    body('date_fin').optional({ nullable: true }).isISO8601(),
    body('actif').optional().isBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const existing = await promoRepository.findByIdRaw(req.params.id);
      if (!existing) {
        throw ApiError.notFound('Code promo non trouvé');
      }

      const {
        description, type_rabais: typeRabais, valeur_rabais: valeurRabais,
        montant_minimum: montantMinimum, max_utilisations_global: maxUtilisationsGlobal,
        max_utilisations_par_client: maxUtilisationsParClient,
        date_debut: dateDebut, date_fin: dateFin, actif
      } = req.body;

      const effectiveType = typeRabais || existing.typeRabais;
      const effectiveValeur = valeurRabais !== undefined ? valeurRabais : existing.valeurRabais;
      if (effectiveType === 'POURCENTAGE' && Number(effectiveValeur) > 100) {
        throw ApiError.badRequest('Un rabais de type POURCENTAGE ne peut pas dépasser 100');
      }

      const updated = await promoRepository.update(req.params.id, {
        description,
        typeRabais,
        valeurRabais,
        montantMinimum,
        maxUtilisationsGlobal,
        maxUtilisationsParClient,
        dateDebut,
        dateFin,
        actif
      });

      auditRepository.log({
        action: 'PROMO_UPDATED',
        entiteType: 'code_promo',
        entiteId: req.params.id,
        utilisateurId: req.user.id,
        details: req.body,
        ipAddress: req.ip
      }).catch((err) => logger.warn('Audit log non enregistré (promo update):', err.message));

      res.json({ success: true, data: serializePromo(updated) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/promo/admin/:id/toggle
 * @desc    Activer / désactiver un code promo
 * @access  Admin
 */
router.patch(
  '/admin/:id/toggle',
  authenticate,
  isAdmin,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const existing = await promoRepository.findByIdRaw(req.params.id);
      if (!existing) {
        throw ApiError.notFound('Code promo non trouvé');
      }

      const updated = await promoRepository.toggleActif(req.params.id);

      auditRepository.log({
        action: 'PROMO_TOGGLED',
        entiteType: 'code_promo',
        entiteId: req.params.id,
        utilisateurId: req.user.id,
        details: { actif: updated.actif },
        ipAddress: req.ip
      }).catch((err) => logger.warn('Audit log non enregistré (promo toggle):', err.message));

      res.json({ success: true, data: serializePromo(updated) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/promo/admin/:id
 * @desc    Supprimer un code promo (seulement si aucune utilisation)
 * @access  Admin
 */
router.delete(
  '/admin/:id',
  authenticate,
  isAdmin,
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const existing = await promoRepository.findByIdRaw(req.params.id);
      if (!existing) {
        throw ApiError.notFound('Code promo non trouvé');
      }

      const nbUtilisations = await promoRepository.countUtilisationsGlobal(req.params.id);
      if (nbUtilisations > 0) {
        throw ApiError.conflict(
          'Ce code promo a déjà été utilisé et ne peut pas être supprimé. Désactivez-le à la place.',
          { nbUtilisations, suggestion: 'PATCH /api/promo/admin/:id/toggle' }
        );
      }

      await promoRepository.remove(req.params.id);

      auditRepository.log({
        action: 'PROMO_DELETED',
        entiteType: 'code_promo',
        entiteId: req.params.id,
        utilisateurId: req.user.id,
        details: { code: existing.code },
        ipAddress: req.ip
      }).catch((err) => logger.warn('Audit log non enregistré (promo delete):', err.message));

      res.json({ success: true, message: 'Code promo supprimé' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
