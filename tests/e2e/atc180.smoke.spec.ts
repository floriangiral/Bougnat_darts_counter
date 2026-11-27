import { expect, test } from '@playwright/test';

import { gotoGameSelection, pickDefaultStarterIfNeeded, startConfiguredGame } from './helpers';

// Spec ref: specs/130-counter-180-around-the-clock (AC-01, AC-03, AC-05).
test('180 Around the Clock — deux joueurs, quelques volées, totaux affichés', async ({ page }) => {
  await gotoGameSelection(page);
  await page.getByTestId('game-card-atc180').click();
  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
  await startConfiguredGame(page);
  await page.getByTestId('starter-option-0').click();
  await pickDefaultStarterIfNeeded(page);

  const screen = page.getByTestId('game-screen');
  await expect(screen).toHaveAttribute('data-game', 'atc180');
  await expect(page.getByTestId('atc180-target')).toHaveText('1');

  const key = (id: 'triple' | 'double' | 'single' | 'miss') => page.locator(`[data-key="${id}"]`);

  // Tour 1 : Joueur 1 fait T1 + S1 + autre = 4, Joueur 2 fait 3 triples = 9.
  await key('triple').click();
  await key('single').click();
  await key('miss').click();
  await expect(page.getByTestId('atc180-player-p1')).toContainText('4');
  await expect(page.getByTestId('atc180-player-p2')).toHaveAttribute('data-state', 'active');

  for (let dart = 0; dart < 3; dart += 1) await key('triple').click();
  await expect(page.getByTestId('atc180-player-p2')).toContainText('9');
  await expect(page.getByTestId('atc180-target')).toHaveText('2');

  // Tour 2 : Joueur 1 fait D2 puis deux Miss (chaque fléchette se saisit ; un Miss vaut 0).
  await key('double').click();
  await key('miss').click();
  await key('miss').click();
  await expect(page.getByTestId('atc180-player-p1')).toContainText('5');
  await expect(page.getByTestId('atc180-player-p2')).toHaveAttribute('data-leader', 'true');

  // Annuler rouvre la volée de Joueur 1 sans sa dernière fléchette.
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByTestId('atc180-player-p1')).toHaveAttribute('data-state', 'active');
  await expect(page.getByTestId('atc180-volley')).toHaveAttribute('data-darts', '2');
});
