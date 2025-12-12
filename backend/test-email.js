// test-email.js
require('dotenv').config();

const nodemailer = require('nodemailer');

console.log('🔧 Configuration SMTP:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  User:', process.env.SMTP_USER);
console.log('  Pass:', process.env.SMTP_PASS ? '✅ Défini' : '❌ Manquant');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function test() {
  try {
    // Test connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP OK !');

    // Envoyer un email de test
    const result = await transporter.sendMail({
      from: `"Jana Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // s'envoyer à soi-même
      subject: '🧪 Test Nodemailer Jana',
      html: '<h1>Test réussi !</h1><p>Les emails fonctionnent.</p>'
    });

    console.log('📧 Email envoyé !', result.messageId);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   Code:', error.code);
  }
}

test();