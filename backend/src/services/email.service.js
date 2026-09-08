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
   * Template de base pour tous les emails (T16-08)
   *
   * Reprend l'identite du site (design_handoff_jana_refonte) plutot que la
   * palette generique #22C55E/gray-* d'origine : en-tete ink-900 avec la
   * meme marque "J" que le header du site, corps sand-50/graphite-700,
   * CTA green-700. Polices de marque (Archivo/Instrument Sans) non fiables
   * dans un client email : fallback sur une pile web-safe au caractere
   * proche (grotesque humaniste), pas de @font-face/import externe qui
   * echoue silencieusement sur la plupart des clients.
   */
  getBaseTemplate(content) {
    const bodyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jana Distribution</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: ${bodyFont}; background-color: #F6F4EE;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F4EE; padding: 24px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #E6E3DA;">
              <!-- Header -->
              <tr>
                <td style="background-color: #10231A; padding: 28px 30px; text-align: center;">
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #1E7A46; width: 32px; height: 32px; border-radius: 6px; text-align: center; vertical-align: middle;">
                        <span style="color: #ffffff; font-size: 16px; font-weight: 800; font-family: ${bodyFont};">J</span>
                      </td>
                      <td style="padding-left: 11px; vertical-align: middle;">
                        <span style="color: #ffffff; font-size: 16px; font-weight: 800; letter-spacing: -0.02em; font-family: ${bodyFont};">JANA DISTRIBUTION</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 14px 0 0; color: #B9CCC1; font-size: 13px;">
                    Produits alimentaires de qualité
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 36px 30px; font-family: ${bodyFont};">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF9F5; padding: 20px 30px; text-align: center; border-top: 1px solid #E6E3DA;">
                  <p style="margin: 0; color: #6B7A72; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Jana Distribution — Tous droits réservés
                  </p>
                  <p style="margin: 8px 0 0; color: #6B7A72; font-size: 12px;">
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
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
   * Labels des statuts de commande — mêmes tokens de couleur que
   * STATUT_BADGE côté frontend (OrderDetailPage.jsx) pour rester cohérent
   * avec ce que le client voit déjà sur le site.
   */
  getStatusLabel(statut) {
    const labels = {
      'EN_ATTENTE': { label: 'En attente de confirmation', bg: '#FBF4E4', color: '#8A5A16', icon: '⏳' },
      'CONFIRMEE': { label: 'Confirmee', bg: '#F2F1EC', color: '#3D4A43', icon: '✅' },
      'EN_PREPARATION': { label: 'En cours de preparation', bg: '#F2F1EC', color: '#3D4A43', icon: '📦' },
      'EXPEDIEE': { label: 'Expediee', bg: '#F2F1EC', color: '#3D4A43', icon: '🚚' },
      'LIVREE': { label: 'Livree', bg: '#EAF3EC', color: '#155C34', icon: '🎉' },
      'ANNULEE': { label: 'Annulee', bg: '#FBEDE9', color: '#9A3A2E', icon: '❌' }
    };
    return labels[statut] || { label: statut, bg: '#F2F1EC', color: '#3D4A43', icon: '📋' };
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
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        Bonjour ${user.prenom || user.nom} ! ${statusInfo.icon}
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        ${messages[newStatus] || 'Le statut de votre commande a ete mis a jour.'}
      </p>

      <!-- Status Badge -->
      <div style="background-color: ${statusInfo.bg}; padding: 14px 20px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; color: ${statusInfo.color}; font-weight: 700; font-size: 16px;">
          ${statusInfo.icon} ${statusInfo.label}
        </p>
      </div>

      <!-- Order Info -->
      <div style="background-color: #F6F4EE; border: 1px solid #E6E3DA; border-radius: 6px; padding: 18px 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px; color: #3D4A43; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
          Détails de la commande
        </h3>
        <table width="100%" style="font-size: 14px; color: #3D4A43;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #E6E3DA;">
              <strong>N° de commande</strong>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #E6E3DA; text-align: right;">
              ${order.numeroCommande}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #E6E3DA;">
              <strong>Date</strong>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #E6E3DA; text-align: right;">
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
            <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1E7A46;">
              ${parseFloat(order.totalTtc).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mes-commandes/${order.id}"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Voir ma commande
        </a>
      </div>

      <p style="margin: 20px 0 0; color: #6B7A72; font-size: 13px; text-align: center;">
        Une question ? Contactez-nous à <a href="mailto:contact@jana-distribution.fr" style="color: #1E7A46;">contact@jana-distribution.fr</a>
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
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        ${isAvoir ? 'Votre avoir est disponible' : 'Votre facture est disponible'}
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonjour ${destinataireNom},
      </p>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        ${isAvoir
    ? `Veuillez trouver ci-joint votre avoir <strong>${facture.numero}</strong>
             d'un montant de <strong>${montantAffiche} €</strong>,
             émis le ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}.`
    : `Veuillez trouver ci-joint votre facture <strong>${facture.numero}</strong>
             d'un montant de <strong>${montantAffiche} €</strong>
             émise le ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}.`}
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mes-commandes"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Voir mes commandes
        </a>
      </div>

      <p style="margin: 20px 0 0; color: #6B7A72; font-size: 12px; text-align: center;">
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
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        Votre devis est disponible
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonjour ${destinataireNom},
      </p>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Veuillez trouver ci-joint votre devis <strong>${devis.numero}</strong>
        d'un montant de <strong>${montantAffiche} €</strong>,
        émis le ${new Date(devis.date_emission).toLocaleDateString('fr-FR')}.
        Ce devis est sans engagement — notre équipe vous recontacte pour confirmer
        la disponibilité et le créneau de livraison.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mes-commandes/${commandeId}"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Voir ma commande
        </a>
      </div>

      <p style="margin: 20px 0 0; color: #6B7A72; font-size: 12px; text-align: center;">
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
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        Réinitialisation de votre mot de passe
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <!-- Warning -->
      <div style="background-color: #FBF4E4; border: 1px solid #EBD8BC; padding: 14px 20px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; color: #8A5A16; font-size: 13px;">
          Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>

      <p style="margin: 20px 0 0; color: #6B7A72; font-size: 13px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #1E7A46; word-break: break-all;">${resetUrl}</a>
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
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        Mot de passe modifié
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Votre mot de passe a été modifié avec succès le ${new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}.
      </p>

      <!-- Warning -->
      <div style="background-color: #FBEDE9; border: 1px solid #E7CFCF; padding: 14px 20px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; color: #9A3A2E; font-size: 13px;">
          Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement à
          <a href="mailto:contact@jana-distribution.fr" style="color: #9A3A2E;">contact@jana-distribution.fr</a>
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
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
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        Bienvenue chez Jana Distribution !
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Merci de nous avoir rejoint ! Votre compte a été créé avec succès. Vous pouvez maintenant profiter de tous nos produits alimentaires de qualité.
      </p>

      <!-- Features -->
      <div style="background-color: #EAF3EC; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px; color: #155C34; font-size: 14px; font-weight: 700;">
          Ce qui vous attend
        </h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #3D4A43; font-size: 14px; line-height: 1.8;">
          <li>Des produits frais et de qualité</li>
          <li>Des prix adaptés aux particuliers et professionnels</li>
          <li>Un suivi de vos commandes en temps réel</li>
          <li>Des promotions exclusives</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/catalogue"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Découvrir nos produits
        </a>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Bienvenue chez Jana Distribution !',
      html: this.getBaseTemplate(content)
    });
  }

  /**
   * Email de notification - compte professionnel validé (T16-09)
   */
  async sendProAccountValidatedEmail(user) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #10231A; font-size: 22px; font-weight: 800;">
        Votre compte professionnel est validé !
      </h2>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>

      <p style="margin: 0 0 20px; color: #3D4A43; font-size: 15px; line-height: 1.6;">
        Bonne nouvelle : votre compte professionnel vient d'être vérifié et validé par notre équipe. Vous pouvez désormais passer commande normalement.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/catalogue"
           style="display: inline-block; background-color: #1E7A46; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Passer commande
        </a>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: 'Votre compte professionnel Jana Distribution est validé',
      html: this.getBaseTemplate(content)
    });
  }
}

// Singleton
const emailService = new EmailService();
emailService.init();

module.exports = emailService;
