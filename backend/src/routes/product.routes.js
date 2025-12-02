/**
 * Routes produits
 * @description CRUD produits
 */

const express = require('express');
const router = express.Router();

// TODO: Jour 7 - Implémenter les routes produits
// GET /api/products - Liste des produits (avec filtres, pagination)
// GET /api/products/:id - Détail d'un produit
// GET /api/products/slug/:slug - Produit par slug
// POST /api/products - Créer un produit (admin)
// PUT /api/products/:id - Modifier un produit (admin)
// DELETE /api/products/:id - Supprimer un produit (admin)

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Routes produits à implémenter (jour 7)'
  });
});

module.exports = router;
