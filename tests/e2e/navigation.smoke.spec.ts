import { expect, test } from '@playwright/test';

test.describe('Bougnat Darts smoke navigation', () => {
  test('parcours smoke simplifie: home, jeux, accueil, chaque jeu, retour', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();

    // Acces a la page des jeux.
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
    // Spec 135: the path mirrors the screen.
    await expect(page).toHaveURL(/\/jeux$/);

    // Bouton accueil depuis la page des jeux.
    await page.getByRole('button', { name: /Accueil/i }).click();
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
    await expect(page).toHaveURL((url) => url.pathname === '/');

    // Retour sur la page des jeux pour tester l'acces a chaque jeu.
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();

    const games = [
      ['game-card-x01', 'x01'],
      ['game-card-cricket', 'cricket'],
      ['game-card-capital', 'capital'],
      ['game-card-gotcha', 'gotcha'],
      ['game-card-killer', 'killer'],
      ['game-card-triathlon', 'triathlon'],
    ] as const;

    for (const [gameCardTestID, slug] of games) {
      await page.getByTestId(gameCardTestID).click();
      await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${slug}/preparation$`));
      await page.getByRole('button', { name: /^Retour$/i }).click();
      await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
    }
  });
});
