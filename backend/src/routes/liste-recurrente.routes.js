/**
 * Liste Récurrente Routes (T16-13)
 * @description Enregistrer le panier courant comme liste réutilisable et
 * ré-ajouter les produits d'une liste au panier en un clic.
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const listeRecurrenteService = require('../services/liste-recurrente.service');

router.use(authenticate);

/**
 * @route   GET /api/listes-recurrentes
 * @desc    Listes récurrentes de l'utilisateur connecté
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const listes = await listeRecurrenteService.getMesListes(req.user.id);
    res.json({ success: true, data: listes });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/listes-recurrentes
 * @desc    Enregistre le panier actuel comme nouvelle liste récurrente
 * @access  Private
 */
router.post(
  '/',
  [body('nom').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Le nom de la liste est requis (1-100 caractères)')],
  validate,
  async (req, res, next) => {
    try {
      const liste = await listeRecurrenteService.createFromCart(req.user.id, req.body.nom);
      res.status(201).json({ success: true, data: liste, message: 'Liste récurrente enregistrée' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/listes-recurrentes/:id/ajouter-au-panier
 * @desc    Ré-ajoute tous les produits d'une liste au panier
 * @access  Private
 */
router.post(
  '/:id/ajouter-au-panier',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const result = await listeRecurrenteService.ajouterAuPanier(req.params.id, req.user.id);
      res.json({
        success: true,
        data: result,
        message: result.skipped > 0
          ? `${result.added} référence(s) ajoutée(s), ${result.skipped} indisponible(s)`
          : `${result.added} référence(s) ajoutée(s) au panier`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/listes-recurrentes/:id
 * @desc    Supprime une liste récurrente
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      await listeRecurrenteService.deleteListe(req.params.id, req.user.id);
      res.json({ success: true, message: 'Liste récurrente supprimée' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
