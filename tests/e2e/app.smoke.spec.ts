import { expect, test } from '@playwright/test';

const isAuthEnabled = process.env.E2E_AUTH_ENABLED === 'true';

test.describe('Bougnat Darts smoke', () => {
  test('loads home and quick game selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /^BOUGNAT$/ })).toBeVisible();
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
  });

  test.describe('auth disabled smoke', () => {
    test.skip(isAuthEnabled, 'This fallback smoke only runs when auth is disabled.');

    test('shows auth CTA as disabled when auth smoke is turned off', async ({ page }) => {
      await page.goto('/');
      const authButton = page.getByRole('button', { name: /Connexion \/ Inscription/i });
      await expect(authButton).toBeVisible();
      await expect(authButton).toBeDisabled();
    });
  });

  test.describe('auth enabled smoke', () => {
    test.skip(!isAuthEnabled, 'Auth smoke is disabled for this pipeline run.');

    test('authenticates a seeded user and opens the lobby', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /Connexion \/ Inscription/i }).click();
      await page.getByPlaceholder('player@example.com').fill('captainbull@bougnat.local');
      await page.getByPlaceholder('••••••••').first().fill('Test1234!');
      await page.getByRole('button', { name: /Entrer dans l'arena/i }).click();

      await expect(page.getByText(/Bienvenue/i)).toBeVisible();
      await page.getByRole('button', { name: /Entrer sur le pas de tir/i }).click();
      await expect(page.getByText(/Ma Carte De Joueur/i)).toBeVisible();
      await expect(page.getByText(/Nouvelle Partie/i)).toBeVisible();
    });
  });
});
