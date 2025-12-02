/**
 * Routes utilisateurs
 * @description CRUD utilisateurs (admin)
 */

const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes utilisateurs
// GET /api/users - Liste des utilisateurs (admin)
// GET /api/users/:id - Détail d'un utilisateur
// PUT /api/users/:id - Modifier un utilisateur
// DELETE /api/users/:id - Supprimer un utilisateur

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Routes utilisateurs à implémenter'
  });
});

module.exports = router;
