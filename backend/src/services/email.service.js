/**
 * Email Service
 * @description Gestion des emails avec Nodemailer
 * 
 * Fonctionnalités :
 * - Notification changement statut commande
 * - Email mot de passe oublié
 * - Email de bienvenue (optionnel)
 */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialise le transporteur Nodemailer
   */
  init() {
    if (this.initialized) return;

    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Vérifier que les credentials sont configurés
    if (!config.auth.user || !config.auth.pass) {
      logger.warn('⚠️ Configuration SMTP manquante - les emails ne seront pas envoyés');
      return;
    }

    this.transporter = nodemailer.createTransport(config);
    this.initialized = true;

    // Vérifier la connexion
    this.transporter.verify()
      .then(() => logger.info('✅ Service email connecté'))
      .catch(err => logger.error('❌ Erreur connexion SMTP:', err.message));
  }

  /**
   * Envoie un email
   * @param {Object} options - Options de l'email
   */
  async sendMail(options) {
    if (!this.transporter) {
      logger.warn('Email non envoyé - SMTP non configuré:', options.subject);
      return { success: false, reason: 'SMTP non configuré' };
    }

    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Jana Distribution'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email envoyé à ${options.to}: ${options.subject}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('❌ Erreur envoi email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convertit HTML en texte brut (basique)
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
                    🥬 Jana Distribution
                  </h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    Produits alimentaires de qualité
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
                    © ${new Date().getFullYear()} Jana Distribution - Tous droits réservés
                  </p>
                  <p style="margin: 10px 0 0; color: #6c757d; font-size: 12px;">
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
   * Labels des statuts de commande
   */
  getStatusLabel(statut) {
    const labels = {
      'EN_ATTENTE': { label: 'En attente de confirmation', color: '#f59e0b', icon: '⏳' },
      'CONFIRMEE': { label: 'Confirmée', color: '#3b82f6', icon: '✅' },
      'EN_PREPARATION': { label: 'En cours de préparation', color: '#8b5cf6', icon: '📦' },
      'EXPEDIEE': { label: 'Expédiée', color: '#06b6d4', icon: '🚚' },
      'LIVREE': { label: 'Livrée', color: '#22c55e', icon: '🎉' },
      'ANNULEE': { label: 'Annulée', color: '#ef4444', icon: '❌' }
    };
    return labels[statut] || { label: statut, color: '#6b7280', icon: '📋' };
  }

  /**
   * Envoie un email de notification de changement de statut de commande
   * @param {Object} order - La commande
   * @param {string} oldStatus - Ancien statut
   * @param {string} newStatus - Nouveau statut
   * @param {Object} user - L'utilisateur
   */
  async sendOrderStatusEmail(order, oldStatus, newStatus, user) {
    const statusInfo = this.getStatusLabel(newStatus);
    
    // Messages personnalisés selon le statut
    const messages = {
      'CONFIRMEE': 'Bonne nouvelle ! Votre commande a été confirmée et sera bientôt préparée.',
      'EN_PREPARATION': 'Notre équipe prépare actuellement votre commande avec soin.',
      'EXPEDIEE': 'Votre commande est en route ! Elle arrivera bientôt chez vous.',
      'LIVREE': 'Votre commande a été livrée. Nous espérons que vous êtes satisfait !',
      'ANNULEE': 'Votre commande a été annulée. Si vous avez des questions, contactez-nous.'
    };

    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Bonjour ${user.prenom || user.nom} ! ${statusInfo.icon}
      </h2>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        ${messages[newStatus] || 'Le statut de votre commande a été mis à jour.'}
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
          📋 Détails de la commande
        </h3>
        <table width="100%" style="font-size: 14px; color: #4b5563;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>N° de commande</strong>
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
        Une question ? Contactez-nous à <a href="mailto:contact@jana-distribution.fr" style="color: #22c55e;">contact@jana-distribution.fr</a>
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
   * Envoie un email de réinitialisation de mot de passe
   * @param {Object} user - L'utilisateur
   * @param {string} resetToken - Token de réinitialisation
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Réinitialisation de votre mot de passe 🔐
      </h2>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      
      <!-- Warning -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>
      
      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #22c55e; word-break: break-all;">${resetUrl}</a>
      </p>
    `;

    return this.sendMail({
      to: user.email,
      subject: '🔐 Réinitialisation de votre mot de passe - Jana Distribution',
      html: this.getBaseTemplate(content)
    });
  }

  /**
   * Envoie un email de confirmation après changement de mot de passe
   * @param {Object} user - L'utilisateur
   */
  async sendPasswordChangedEmail(user) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Mot de passe modifié ✅
      </h2>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Votre mot de passe a été modifié avec succès le ${new Date().toLocaleDateString('fr-FR', {
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
          🚨 Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement à 
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
      subject: '✅ Votre mot de passe a été modifié - Jana Distribution',
      html: this.getBaseTemplate(content)
    });
  }

  // ==========================================
  // EMAIL DE BIENVENUE (optionnel)
  // ==========================================

  /**
   * Envoie un email de bienvenue après inscription
   * @param {Object} user - L'utilisateur
   */
  async sendWelcomeEmail(user) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">
        Bienvenue chez Jana Distribution ! 🎉
      </h2>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${user.prenom || user.nom},
      </p>
      
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Merci de nous avoir rejoint ! Votre compte a été créé avec succès. Vous pouvez maintenant profiter de tous nos produits alimentaires de qualité.
      </p>
      
      <!-- Features -->
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #166534; font-size: 16px; font-weight: 600;">
          ✨ Ce qui vous attend
        </h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
          <li>Des produits frais et de qualité</li>
          <li>Des prix adaptés aux particuliers et professionnels</li>
          <li>Un suivi de vos commandes en temps réel</li>
          <li>Des promotions exclusives</li>
        </ul>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/catalogue" 
           style="display: inline-block; background-color: #22C55E; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Découvrir nos produits
        </a>
      </div>
    `;

    return this.sendMail({
      to: user.email,
      subject: '🎉 Bienvenue chez Jana Distribution !',
      html: this.getBaseTemplate(content)
    });
  }
}

// Singleton
const emailService = new EmailService();
emailService.init();

module.exports = emailService;
