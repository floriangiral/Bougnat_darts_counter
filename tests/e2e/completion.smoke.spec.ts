// Spec: spec:counter/smoke-e2e-per-game-navigation
// Tests smoke simplifies : accueil → sélection du jeu → configuration → retour.
// Un test par jeu, pas de session seedée, pas d'assertion sur les labels internes.
import { expect, test } from '@playwright/test';

const GAMES = [
  { label: 'X01',        testId: 'game-card-x01' },
  { label: 'Cricket',    testId: 'game-card-cricket' },
  { label: 'Capital',    testId: 'game-card-capital' },
  { label: 'Gotcha',     testId: 'game-card-gotcha' },
  { label: 'Killer',     testId: 'game-card-killer' },
  { label: 'Triathlon',  testId: 'game-card-triathlon' },
];

test.describe('Bougnat Darts smoke — entrée/sortie par jeu', () => {
  for (const { label, testId } of GAMES) {
    test(`${label} — accueil → lancer → configuration → retour`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();

      await page.getByRole('button', { name: /Lancer une partie/i }).click();
      await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();

      await page.getByTestId(testId).click();
      await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();

      await page.getByRole('button', { name: /^Retour$/i }).click();
      await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
    });
  }
});
