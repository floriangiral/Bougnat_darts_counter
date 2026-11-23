import { expect, test, type Page } from '@playwright/test';
import { openSetup, startConfiguredGame } from './helpers';

// Cricket simple à 4 joueurs (décision PO du 2026-11-23, comme le X01 de la spec 052).
const PLAYERS = ['Alice', 'Bruno', 'Chloé', 'Damien'];

const activeHead = (page: Page) => page.locator('.cricket-player-head[data-state="active"]');

test.describe('Cricket à 4 joueurs en simple', () => {
  test('configure 4 joueurs, refuse un 5ᵉ, puis joue une volée par joueur dans l’ordre', async ({ page }) => {
    await openSetup(page, 'Cricket');

    const playerCount = page.getByTestId('setup-player-count');
    await expect(playerCount.getByRole('button')).toHaveText(['2', '3', '4']);
    await expect(playerCount.getByRole('button', { name: '5', exact: true })).toHaveCount(0);
    await playerCount.getByRole('button', { name: '4', exact: true }).click();
    await expect(playerCount.getByRole('button', { name: '4', exact: true })).toHaveAttribute('aria-pressed', 'true');

    for (const [index, name] of PLAYERS.entries()) {
      await page.getByPlaceholder(`Joueur ${index + 1}`, { exact: true }).fill(name);
    }
    await expect(page.getByPlaceholder('Joueur 5', { exact: true })).toHaveCount(0);

    await startConfiguredGame(page);
    const starterOverlay = page.getByTestId('starting-player-overlay');
    await expect(starterOverlay.locator('[data-testid^="starter-option-"]')).toHaveCount(4);
    await page.getByTestId('starter-option-0').click();

    const board = page.getByTestId('cricket-scoreboard');
    await expect(board).toHaveAttribute('data-player-count', '4');
    for (const name of PLAYERS) {
      await expect(activeHead(page)).toHaveCount(1);
      await expect(activeHead(page)).toContainText(name);
      await page.getByRole('button', { name: /3 MISS/i }).click();
    }

    await expect(activeHead(page)).toContainText(PLAYERS[0]);
  });
});
