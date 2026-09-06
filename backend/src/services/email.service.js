/**
 * Email Service
 * @description Gestion des emails via Gmail SMTP (nodemailer)
 *
 * Fonctionnalites :
 * - Notification changement statut commande
 * - Email mot de passe oublie
 * - Email de bienvenue
 */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.senderEmail = null;
    this.senderName = null;
  }

  /**
   * Initialise le transport SMTP Gmail
   */
  init() {
    this.senderEmail = process.env.GMAIL_SENDER_EMAIL;
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!this.senderEmail || !appPassword) {
      logger.warn('GMAIL_SENDER_EMAIL/GMAIL_APP_PASSWORD manquant(s) - les emails ne seront pas envoyes');
      return;
    }

    this.senderName = process.env.GMAIL_SENDER_NAME || 'Jana Distribution';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.senderEmail,
        pass: appPassword
      }
    });

    logger.info(`Service email Gmail SMTP initialise (from: ${this.senderName} <${this.senderEmail}>)`);
  }

  /**
   * Envoie un email via Gmail SMTP
   * @param {Object} options - Options de l'email
   * @param {Array} [options.attachment] - Pièces jointes : [{ name, content (base64) }]
   */
  async sendMail(options) {
    if (!this.transporter) {
      logger.warn(`Email non envoye - Gmail SMTP non configure: ${options.subject}`);
      return { success: false, reason: 'Gmail SMTP non configure' };
    }

    try {
      const mailOptions = {
        from: `"${this.senderName}" <${this.senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };
      if (options.attachment) {
        mailOptions.attachments = options.attachment.map((a) => ({
          filename: a.name,
          content: a.content,
          encoding: 'base64'
        }));
      }

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email envoye a ${options.to}: ${options.subject} (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Erreur envoi email a ${options.to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // TEMPLATES EMAILS
  // ==========================================

  /**
   * Template de base pour tous les emails
   */
  getBaseTemplate(content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jana Distribution</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #22C55E; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    Jana Distribution
                  </h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    Produits alimentaires de qualite
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #6c757d; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Jana Distribution - Tous droits reserves
                  </p>
                  <p style="margin: 10px 0 0; color: #6c757d; font-size: 12px;">
                    Cet email a ete envoye automatiquement, merci de ne pas y repondre.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  // ==========================================
  // EMAILS COMMANDES
  // ==========================================

  /**
   * Labels des statuts de commande
   */
  getStatusLabel(statut) {
    const labels = {
      'EN_ATTENTE': { label: 'En attente de confirmation', color: '#f59e0b', icon: '⏳' },
      'CONFIRMEE': { label: 'Confirmee', color: '#3b82f6', icon: '✅' },
      'EN_PREPARATION': { label: 'En cours de preparation', color: '#8b5cf6', icon: '📦' },
      'EXPEDIEE': { label: 'Expediee', color: '#06b6d4', icon: '🚚' },
      'LIVREE': { label: 'Livree', color: '#22c55e', icon: '🎉' },
      'ANNULEE': { label: 'Annulee', color: '#ef4444', icon: '❌' }
    };
    return labels[statut] || { label: statut, color: '#6b7280', icon: '📋' };
  }

  /**
   * Envoie un email de notification de changement de statut de commande
   */
  async sendOrderStatusEmail(order, oldStatus, newStatus, user) {
    const statusInfo = this.getStatusLabel(newStatus);

    const messages = {
      'CONFIRMEE': 'Bonne nouvelle ! Votre commande a ete confirmee et sera bientot preparee.',
      'EN_PREPARATION': 'Notre equipe prepare actuellement votre commande avec soin.',
      'EXPEDIEE': 'Votre commande est en route ! Elle arrivera bientot chez vous.',
      'LIVREE': 'Votre commande a ete livree. Nous esperons que vous etes satisfait !',
      'ANNULEE': 'Votre commande a ete annulee. Si vous avez des questions, contactez-nous.'
    };

    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Bonjour ${user.prenom || user.nom} ! ${statusInfo.icon}
      </h2>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${messages[newStatus] || 'Le statut de votre commande a ete mis a jour.'}
      </p>

      <!-- Status Badge -->
      <div style="background-color: ${statusInfo.color}15; border-left: 4px solid ${statusInfo.color}; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: ${statusInfo.color}; font-weight: 600; font-size: 18px;">
          ${statusInfo.icon} ${statusInfo.label}
        </p>
      </div>

      <!-- Order Info -->
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #374151; font-size: 16px; font-weight: 600;">
          Details de la commande
        </h3>
        <table width="100%" style="font-size: 14px; color: #4b5563;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>N de commande</strong>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
              ${order.numeroCommande}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Date</strong>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
    ${new Date(order.createdAt || order.dateCreation).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong>Total</strong>
            </td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #22c55e;">
              ${parseFloat(order.totalTtc).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mes-commandes/${order.id}"
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Voir ma commande
        </a>
      </div>

      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
        Une question ? Contactez-nous a <a href="mailto:contact@jana-distribution.fr" style="color: #22c55e;">contact@jana-distribution.fr</a>
      </p>
    `;

    return this.sendMail({
      to: user.email,
      subject: `${statusInfo.icon} Commande ${order.numeroCommande} - ${statusInfo.label}`,
      html: this.getBaseTemplate(content)
    });
  }

  // ==========================================
  // EMAIL FACTURE
  // ==========================================

  /**
   * Envoie la facture par email avec le PDF en pièce jointe
   * @param {Object} params
   * @param {string} params.destinataireEmail
   * @param {string} params.destinataireNom
   * @param {Object} params.facture - { numero, total_ttc, date_emission }
   * @param {Buffer} params.pdfBuffer
   */
  async sendInvoiceEmail({ destinataireEmail, destinataireNom, facture, pdfBuffer }) {
    const isAvoir = facture.type === 'AVOIR';
    const montantAffiche = Math.abs(parseFloat(facture.total_ttc)).toFixed(2);
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        ${isAvoir ? 'Votre avoir est disponible' : 'Votre facture est disponible'}
      </h2>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${destinataireNom},
      </p>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${isAvoir
    ? `Veuillez trouver ci-joint votre avoir <strong>${facture.numero}</strong>
             d'un montant de <strong>${montantAffiche} €</strong>,
             émis le ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}.`
    : `Veuillez trouver ci-joint votre facture <strong>${facture.numero}</strong>
             d'un montant de <strong>${montantAffiche} €</strong>
             émise le ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}.`}
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mes-factures"
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Voir mes factures
        </a>
      </div>

      <p style="margin: 20px 0 0; color: #6b7280; font-size: 12px; text-align: center;">
        Jana Distribution — SIRET ${process.env.ENTREPRISE_SIRET || '798787784'}<br>
        Conservez ce document 10 ans (obligation légale française).
      </p>
    `;

    return this.sendMail({
      to: destinataireEmail,
      subject: `${isAvoir ? 'Votre avoir' : 'Votre facture'} ${facture.numero} - Jana Distribution`,
      html: this.getBaseTemplate(content),
      attachment: [
        {
          name: `${facture.numero}.pdf`,
          content: pdfBuffer.toString('base64')
        }
      ]
    });
  }

  /**
   * Envoie le devis (estimation non contractuelle) genere a la creation de
   * commande - en plus de l'email de confirmation de commande, pas a sa
   * place (voir order.service.js#createOrder).
   */
  async sendQuoteEmail({ destinataireEmail, destinataireNom, devis, commandeId, pdfBuffer }) {
    const montantAffiche = parseFloat(devis.total_ttc).toFixed(2);
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Votre devis est disponible
      </h2>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${destinataireNom},
      </p>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Veuillez trouver ci-joint votre devis <strong>${devis.numero}</strong>
        d'un montant de <strong>${montantAffiche} €</strong>,
        émis le ${new Date(devis.date_emission).toLocaleDateString('fr-FR')}.
        Ce devis est sans engagement — notre équipe vous recontacte pour confirmer
        la disponibilité et le créneau de livraison.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mes-commandes/${commandeId}"
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Voir ma commande
        </a>
      </div>

      <p style="margin: 20px 0 0; color: #6b7280; font-size: 12px; text-align: center;">
        Jana Distribution — SIRET ${process.env.ENTREPRISE_SIRET || '798787784'}
      </p>
    `;

    return this.sendMail({
      to: destinataireEmail,
      subject: `Votre devis ${devis.numero} - Jana Distribution`,
      html: this.getBaseTemplate(content),
      attachment: [
        {
          name: `${devis.numero}.pdf`,
          content: pdfBuffer.toString('base64')
        }
      ]
    });
  }

  // ==========================================
  // EMAILS MOT DE PASSE
  // ==========================================

  /**
   * Envoie un email de reinitialisation de mot de passe
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Reinitialisation de votre mot de passe
      </h2>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe :
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reinitialiser mon mot de passe
        </a>
      </div>

      <!-- Warning -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demande cette reinitialisation, ignorez cet email.
        </p>
      </div>

      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #22c55e; word-break: break-all;">${resetUrl}</a>
      </p>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Reinitialisation de votre mot de passe - Jana Distribution',
      html: this.getBaseTemplate(content)
    });
  }

  /**
   * Envoie un email de confirmation apres changement de mot de passe
   */
  async sendPasswordChangedEmail(user) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Mot de passe modifie
      </h2>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Votre mot de passe a ete modifie avec succes le ${new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}.
      </p>

      <!-- Warning -->
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;">
          Si vous n'etes pas a l'origine de cette modification, contactez-nous immediatement a
          <a href="mailto:contact@jana-distribution.fr" style="color: #ef4444;">contact@jana-distribution.fr</a>
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Me connecter
        </a>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Votre mot de passe a ete modifie - Jana Distribution',
      html: this.getBaseTemplate(content)
    });
  }

  // ==========================================
  // EMAIL DE BIENVENUE
  // ==========================================

  /**
   * Envoie un email de bienvenue apres inscription
   */
  async sendWelcomeEmail(user) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Bienvenue chez Jana Distribution !
      </h2>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Merci de nous avoir rejoint ! Votre compte a ete cree avec succes. Vous pouvez maintenant profiter de tous nos produits alimentaires de qualite.
      </p>

      <!-- Features -->
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #166534; font-size: 16px; font-weight: 600;">
          Ce qui vous attend
        </h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
          <li>Des produits frais et de qualite</li>
          <li>Des prix adaptes aux particuliers et professionnels</li>
          <li>Un suivi de vos commandes en temps reel</li>
          <li>Des promotions exclusives</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/catalogue"
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Decouvrir nos produits
        </a>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Bienvenue chez Jana Distribution !',
      html: this.getBaseTemplate(content)
    });
  }
}

// Singleton
const emailService = new EmailService();
emailService.init();

module.exports = emailService;
