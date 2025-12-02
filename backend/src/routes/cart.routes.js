/**
 * Routes panier
 * @description Gestion du panier d'achat
 */

const express = require('express');
const router = express.Router();

// TODO: Jour 10 - Implémenter les routes panier
// GET /api/cart - Récupérer le panier de l'utilisateur
// POST /api/cart/items - Ajouter un produit au panier
// PUT /api/cart/items/:id - Modifier la quantité
// DELETE /api/cart/items/:id - Supprimer un produit du panier
// DELETE /api/cart - Vider le panier

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Routes panier à implémenter (jour 10)'
  });
});

module.exports = router;
