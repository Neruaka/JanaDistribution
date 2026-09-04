/**
 * E2E tunnel de commande (T7-07) — connexion -> ajout panier -> checkout -> confirmation.
 * @description Nécessite la stack dev démarrée (docker compose up) avec les
 * produits seedés (backend/scripts/seed.js) : le test navigue directement
 * vers le slug `pommes-gala-bio` plutôt que de dépendre de l'UI catalogue.
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:3000/api';
// Comté AOP 18 mois (28 EUR) plutot qu'un produit moins cher : la commande
// doit depasser le montant minimum (15 EUR TTC, cf. configuration
// commande_montant_min) sans quoi le panier bloque la validation.
const PRODUCT_SLUG = 'comte-aop-18-mois';

const uniqueUser = () => {
  const stamp = Date.now();
  return {
    email: `e2e.checkout.${stamp}@example.com`,
    motDePasse: 'TestPass123!',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0612345678',
    typeClient: 'PARTICULIER',
    accepteCgu: true
  };
};

test.describe('Tunnel de commande', () => {
  let user;

  test.beforeAll(async ({ request }) => {
    // Compte de test cree via l'API (setup rapide et deterministe) ; le
    // parcours teste lui-meme (connexion -> panier -> checkout -> confirmation)
    // reste pilote via la vraie UI.
    user = uniqueUser();
    const res = await request.post(`${BACKEND_URL}/auth/register`, { data: user });
    expect(res.ok()).toBeTruthy();
  });

  test('connexion, ajout au panier, checkout et confirmation de commande', async ({ page }) => {
    // --- Connexion ---
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[type="password"]').first().fill(user.motDePasse);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL('/');

    // Ferme le bandeau cookies (position fixe en bas d'ecran, peut chevaucher
    // des elements interactifs plus bas sur les pages suivantes).
    const cookieClose = page.getByRole('button', { name: 'Fermer' });
    if (await cookieClose.isVisible().catch(() => false)) {
      await cookieClose.click();
    }

    // --- Ajout au panier ---
    // networkidle : chaque page.goto() est un rechargement complet qui
    // remonte AuthProvider (loading=true le temps d'un GET /auth/me
    // asynchrone) - cliquer avant resolution declenche le toast "Connectez-
    // vous" (isAuthenticated encore false) au lieu d'ajouter au panier.
    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Ajouter au panier/ }).click();
    await expect(page.getByText(/ajouté|ajoutée/i)).toBeVisible({ timeout: 5000 });

    // --- Panier -> checkout ---
    await page.goto('/panier');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Valider ma commande' }).click();
    await expect(page).toHaveURL('/checkout', { timeout: 10000 });

    // --- Formulaire checkout (prenom/nom/telephone deja pre-remplis depuis le profil) ---
    await page.getByPlaceholder('15 rue de la Paix').fill('15 rue de la Paix');
    await page.getByPlaceholder('75001').fill('75001');
    await page.getByPlaceholder('Paris').fill('Paris');
    // Clique sur la case visuelle elle-meme, pas sur le bouton entier : son
    // libelle contient deux liens CGV/confidentialite qui stopPropagation()
    // (comportement voulu, pour ouvrir le lien plutot que togger la case) -
    // un clic au centre du bouton entier peut tomber dessus selon le
    // retour a la ligne du texte.
    await page.locator('button[aria-label="Accepter les CGV et la politique de confidentialité"] > span').first().click();

    // Laisse le debounce d'estimation de frais de livraison se resoudre
    // avant soumission (evite un submit sur un etat de frais transitoire).
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: 'Recevoir mon devis' }).click();

    // --- Confirmation ---
    await expect(page).toHaveURL(/\/commande\/confirmation\//, { timeout: 15000 });
    await expect(page.getByText(/CMD-\d{8}-\d+/)).toBeVisible();
  });
});
