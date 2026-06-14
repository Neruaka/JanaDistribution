/**
 * Stripe client bootstrap
 * @description Initialise le SDK Stripe côté serveur à partir des variables d'env.
 *
 * Variables requises :
 *  - STRIPE_SECRET_KEY      : clé secrète (sk_test_... en dev, sk_live_... en prod)
 *  - STRIPE_WEBHOOK_SECRET  : secret de vérification de signature webhook (whsec_...)
 *
 * Si STRIPE_SECRET_KEY est absente, `getStripe()` lève une erreur explicite : on refuse
 * de partir en prod avec un paiement silencieusement désactivé.
 */

const Stripe = require('stripe');
const logger = require('./logger');

let stripeInstance = null;

function getStripe() {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY manquant. Configurez la variable d\'env avant d\'initialiser un paiement.'
    );
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2024-06-20',
    typescript: false,
    telemetry: false,
    appInfo: {
      name: 'Jana Distribution',
      version: '1.0.0'
    }
  });

  logger.info('Stripe client initialisé (mode ' + (key.startsWith('sk_live_') ? 'LIVE' : 'TEST') + ')');
  return stripeInstance;
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET manquant. Impossible de vérifier la signature des webhooks.');
  }
  return secret;
}

module.exports = {
  getStripe,
  getWebhookSecret
};
