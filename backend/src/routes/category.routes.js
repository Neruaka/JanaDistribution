/**
 * Routes catégories
 * @description CRUD catégories de produits
 */

const express = require('express');
const router = express.Router();

// TODO: Jour 7 - Implémenter les routes catégories
// GET /api/categories - Liste des catégories
// GET /api/categories/:id - Détail d'une catégorie
// POST /api/categories - Créer une catégorie (admin)
// PUT /api/categories/:id - Modifier une catégorie (admin)
// DELETE /api/categories/:id - Supprimer une catégorie (admin)

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Routes catégories à implémenter (jour 7)'
  });
});

module.exports = router;
