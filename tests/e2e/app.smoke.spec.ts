import { expect, test } from '@playwright/test';

test.describe('Bougnat Darts smoke', () => {
  test('loads home and quick game selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /^BOUGNAT$/ })).toBeVisible();
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
  });

  test('keeps the home entrypoints focused on local scoring', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Choisir un jeu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connexion \/ Inscription/i })).toHaveCount(0);
  });
});
