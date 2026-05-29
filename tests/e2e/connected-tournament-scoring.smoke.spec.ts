import { expect, test } from '@playwright/test';
import { pickDefaultStarterIfNeeded } from './helpers';

test.describe('Bougnat Darts connected tournament smoke', () => {
  test('mock connected player loads a tournament match, scores it and submits the result', async ({ page }) => {
    await page.goto('/?auth=mock');

    await page.getByRole('button', { name: /Ouvrir l'espace joueur/i }).click();
    await expect(page.getByText(/Joueur connecte mock/i)).toBeVisible();
    await expect(page.getByText(/Open Bougnat mock/i)).toBeVisible();

    await page.getByRole('button', { name: /Lancer le match/i }).click();
    await pickDefaultStarterIfNeeded(page);

    await page.getByTestId('x01-keypad-1').click();
    await page.getByTestId('x01-keypad-0').click();
    await page.getByTestId('x01-keypad-1').click();
    await page.getByTestId('x01-keypad-ok').click();
    await page.getByTestId('checkout-darts-3').click();

    await expect(page.getByText(/VAINQUEUR/i)).toBeVisible();
    await page.getByTestId('winner-view-stats').click();

    await expect(page.getByTestId('tournament-submission-status')).toContainText(/envoye/i);
  });
});
