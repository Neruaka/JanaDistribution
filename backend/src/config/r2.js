const { S3Client } = require('@aws-sdk/client-s3');

// ⚠️ Cloudflare R2 — API compatible S3
// Variables d'env requises : R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

module.exports = {
  r2Client,
  bucketName: process.env.R2_BUCKET_NAME || 'jana-products'
};
