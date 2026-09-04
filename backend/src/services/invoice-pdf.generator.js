const PDFDocument = require('pdfkit');

async function generateInvoicePDF(facture) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // En-tête
    const isAvoir = facture.type === 'AVOIR';
    doc.fontSize(20).font('Helvetica-Bold').text(isAvoir ? 'AVOIR' : 'FACTURE', { align: 'right' });
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    doc.text(`N° ${facture.numero}`, { align: 'right' });
    doc.text(`Date : ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}`, { align: 'right' });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text(facture.entreprise_nom);
    doc.fontSize(9).font('Helvetica');
    if (facture.entreprise_adresse) doc.text(facture.entreprise_adresse);
    if (facture.entreprise_siret) doc.text(`SIRET : ${facture.entreprise_siret}`);
    if (facture.entreprise_tva_numero) doc.text(`N° TVA : ${facture.entreprise_tva_numero}`);

    // Client
    const clientBoxY = doc.y + 10;
    doc.moveDown(1);
    doc.rect(300, clientBoxY, 245, 70).stroke();
    doc.fontSize(10).font('Helvetica-Bold').text('Facturer à :', 310, clientBoxY + 5);
    doc.fontSize(9).font('Helvetica');
    doc.text(facture.client_nom, 310, clientBoxY + 20);
    doc.text(facture.client_email, 310);
    if (facture.client_adresse) doc.text(facture.client_adresse, 310);

    doc.moveDown(3);

    // Tableau
    const tableTop = doc.y;
    const col = { produit: 50, qte: 280, prixHt: 330, tva: 390, total: 450 };

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Désignation', col.produit, tableTop);
    doc.text('Qté', col.qte, tableTop);
    doc.text('PU HT', col.prixHt, tableTop);
    doc.text('TVA%', col.tva, tableTop);
    doc.text('Total TTC', col.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(9);

    const lignes = Array.isArray(facture.lignes) ? facture.lignes.filter(Boolean) : [];
    for (const ligne of lignes) {
      doc.text(ligne.produit_nom || '', col.produit, y, { width: 220 });
      doc.text(String(ligne.quantite), col.qte, y);
      doc.text(`${parseFloat(ligne.prix_unitaire_ht).toFixed(2)} €`, col.prixHt, y);
      doc.text(`${ligne.taux_tva}%`, col.tva, y);
      doc.text(`${parseFloat(ligne.montant_ttc).toFixed(2)} €`, col.total, y);
      y += 20;
    }

    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    // Totaux
    doc.font('Helvetica').fontSize(9);
    doc.text(`Total HT : ${parseFloat(facture.total_ht).toFixed(2)} €`, col.tva, y, { align: 'right', width: 145 });
    y += 15;
    doc.text(`TVA : ${parseFloat(facture.total_tva).toFixed(2)} €`, col.tva, y, { align: 'right', width: 145 });
    y += 15;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`TOTAL ${isAvoir ? 'AVOIR' : 'TTC'} : ${parseFloat(facture.total_ttc).toFixed(2)} €`, col.tva, y, { align: 'right', width: 145 });

    // Pied de page légal
    doc.fontSize(7).font('Helvetica');
    doc.text(
      '⚠️ Taux de TVA appliqués conformément au CGI — à valider par un expert-comptable pour chaque référence produit.',
      50, 750, { width: 495, align: 'center' }
    );

    doc.end();
  });
}

module.exports = { generateInvoicePDF };
