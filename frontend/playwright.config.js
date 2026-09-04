/**
 * Config Playwright — T7-07
 * @description Nécessite la stack dev démarrée (docker compose up), comme
 * npm run test:integration côté backend : frontend sur :5173, backend sur
 * :3000, avec de vrais produits en base (backend/scripts/seed.js).
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
