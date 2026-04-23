import { expect, test } from '@playwright/test';
import { gotoGameSelection, openSetup } from './helpers';

test.describe('Bougnat Darts smoke navigation', () => {
  test('opens and closes the QR modal from home', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Partager L'App/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Scanne ce QR code/i)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('navigates from home to game selection and back', async ({ page }) => {
    await gotoGameSelection(page);
    await page.getByRole('button', { name: /Accueil/i }).click();
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  });

  test('opens each main setup screen, shows rules, and returns to selection', async ({ page }) => {
    const setups = [
      {
        selection: /Match X01/i,
        rulesTitle: /Regles Du X01/i,
      },
      {
        selection: /^Cricket$/i,
        rulesTitle: /Regles Du Cricket/i,
      },
      {
        selection: /^Capital$/i,
        rulesTitle: /Regles Du Capital/i,
      },
      {
        selection: /Le Triathlon/i,
        rulesTitle: /Regles Du Triathlon/i,
      },
    ];

    for (const setup of setups) {
      await openSetup(page, setup.selection);
      await page.getByRole('button', { name: /Voir Les Regles/i }).click();
      await expect(page.getByRole('heading', { name: setup.rulesTitle })).toBeVisible();
      await page.getByRole('button', { name: /^Fermer$/i }).click();
      await page.getByRole('button', { name: /^Retour$/i }).click();
      await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();
    }
  });
});
