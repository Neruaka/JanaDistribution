/**
 * Email Service
 * @description Gestion des emails avec Brevo (ex-Sendinblue) via API REST
 *
 * Fonctionnalites :
 * - Notification changement statut commande
 * - Email mot de passe oublie
 * - Email de bienvenue
 */

const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.apiKey = null;
    this.senderEmail = null;
    this.senderName = null;
  }

  /**
   * Initialise la config Brevo
   */
  init() {
    this.apiKey = process.env.BREVO_API_KEY;

    if (!this.apiKey) {
      logger.warn('BREVO_API_KEY manquante - les emails ne seront pas envoyes');
      return;
    }

    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@jana-distribution.fr';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Jana Distribution';

    logger.info(`Service email Brevo initialise (from: ${this.senderName} <${this.senderEmail}>)`);
  }

  /**
   * Envoie un email via l'API REST Brevo
   * @param {Object} options - Options de l'email
   */
  async sendMail(options) {
    if (!this.apiKey) {
      logger.warn(`Email non envoye - Brevo non configure: ${options.subject}`);
      return { success: false, reason: 'Brevo non configure' };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html
        })
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`Erreur envoi email a ${options.to}: ${data.message || JSON.stringify(data)}`);
        return { success: false, error: data.message || 'Erreur Brevo' };
      }

      logger.info(`Email envoye a ${options.to}: ${options.subject} (messageId: ${data.messageId})`);
      return { success: true, messageId: data.messageId };
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
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/connexion"
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
