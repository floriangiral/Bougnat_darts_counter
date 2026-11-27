import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Lecture directe : Node refuse un import JSON sans attribut de type dans les tests E2E.
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

test.describe('Bougnat Darts smoke', () => {
  test('@critique loads home and game selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /^BOUGNAT$/ })).toBeVisible();
    await expect(page.getByTestId('home-version')).toContainText(`v${version}`);
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
  });

  test('keeps the home entrypoints focused on local scoring', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Partager L'App/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connexion \/ Inscription/i })).toHaveCount(0);
  });
});
