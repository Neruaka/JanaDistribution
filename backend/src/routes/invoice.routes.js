const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');
const invoiceRepository = require('../repositories/invoice.repository');
const invoiceService = require('../services/invoice.service');
const { generateInvoicePDF } = require('../services/invoice-pdf.generator');
const { param } = require('express-validator');
const validate = require('../middlewares/validate.middleware');

// Client — liste de ses factures
router.get('/mes-factures', authenticate, async (req, res, next) => {
  try {
    const factures = await invoiceRepository.findByUtilisateur(req.user.id);
    res.json({ success: true, data: factures });
  } catch (e) { next(e); }
});

// Client — téléchargement PDF
router.get('/:id/pdf', authenticate, [param('id').isUUID()], validate, async (req, res, next) => {
  try {
    const facture = await invoiceRepository.findById(req.params.id);
    if (!facture) return res.status(404).json({ error: 'Facture introuvable' });
    if (facture.utilisateur_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const pdf = await generateInvoicePDF(facture);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${facture.numero}.pdf"`);
    res.send(pdf);
  } catch (e) { next(e); }
});

// Admin — toutes les factures (filtre optionnel par commande_id et/ou type)
const VALID_TYPES = ['FACTURE', 'AVOIR', 'DEVIS'];
router.get('/admin', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { commande_id, type } = req.query;
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type doit être l'un de : ${VALID_TYPES.join(', ')}` });
    }
    let factures;
    if (commande_id) {
      factures = await invoiceRepository.findByCommande(commande_id);
      if (type) factures = factures.filter(f => f.type === type);
    } else {
      const page = parseInt(req.query.page) || 1;
      factures = await invoiceRepository.findAll({ page, limit: 20, type: type || null });
    }
    res.json({ success: true, data: factures });
  } catch (e) { next(e); }
});

// Admin — générer manuellement une facture (VIREMENT/CHEQUE)
router.post(
  '/admin/generer/:commandeId',
  authenticate,
  isAdmin,
  [param('commandeId').isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const facture = await invoiceService.generateForOrder(req.params.commandeId);
      res.json({ success: true, data: facture });
    } catch (e) { next(e); }
  }
);

module.exports = router;
