/**
 * Routes commandes
 * @description Gestion des commandes
 */

const express = require('express');
const router = express.Router();

// TODO: Jour 11 - Implémenter les routes commandes
// GET /api/orders - Liste des commandes de l'utilisateur
// GET /api/orders/:id - Détail d'une commande
// POST /api/orders - Créer une commande (depuis le panier)
// PUT /api/orders/:id/status - Modifier le statut (admin)
// GET /api/orders/admin - Liste toutes les commandes (admin)

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Routes commandes à implémenter (jour 11)'
  });
});

module.exports = router;
