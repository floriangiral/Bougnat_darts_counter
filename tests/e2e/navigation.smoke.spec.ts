import { expect, test } from '@playwright/test';

test.describe('Bougnat Darts smoke navigation', () => {
  test('parcours smoke simplifie: home, jeux, accueil, chaque jeu, retour', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();

    // Acces a la page des jeux.
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();

    // Bouton accueil depuis la page des jeux.
    await page.getByRole('button', { name: /Accueil/i }).click();
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();

    // Retour sur la page des jeux pour tester l'acces a chaque jeu.
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();

    const games = [
      'game-card-x01_501_bo5',
      'game-card-x01',
      'game-card-cricket',
      'game-card-capital',
      'game-card-gotcha',
      'game-card-killer',
      'game-card-triathlon',
    ];

    for (const gameCardTestID of games) {
      await page.getByTestId(gameCardTestID).click();
      await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
      await page.getByRole('button', { name: /^Retour$/i }).click();
      await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();
    }
  });
});
