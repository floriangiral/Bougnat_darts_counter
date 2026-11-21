import { expect, test, type Page } from '@playwright/test';
import { openSetup, startConfiguredGame } from './helpers';

// Spec 052 (AC-01, AC-02) : X01 simple à 4 joueurs, ordre des visites respecté.
const PLAYERS = ['Alice', 'Bruno', 'Chloé', 'Damien'];

const enterVisit = async (page: Page, digits: string) => {
  for (const digit of digits) {
    await page.getByTestId(`x01-keypad-${digit}`).click();
  }
  await page.getByTestId('x01-keypad-ok').click();
};

const activeCard = (page: Page) => page.locator('[data-testid="x01-player-card"][data-state="active"]');

test.describe('X01 à 4 joueurs en simple', () => {
  test('configure 4 joueurs, refuse un 5ᵉ et le robot, puis joue une volée par joueur dans l’ordre', async ({ page }) => {
    await openSetup(page, 'Match X01');

    const playerCount = page.getByTestId('setup-player-count');
    await expect(playerCount.getByRole('button')).toHaveText(['1', '2', '3', '4']);
    await expect(playerCount.getByRole('button', { name: '5', exact: true })).toHaveCount(0);
    await playerCount.getByRole('button', { name: '4', exact: true }).click();
    await expect(playerCount.getByRole('button', { name: '4', exact: true })).toHaveAttribute('aria-pressed', 'true');

    for (const [index, name] of PLAYERS.entries()) {
      await page.getByPlaceholder(`Joueur ${index + 1}`, { exact: true }).fill(name);
    }
    await expect(page.getByPlaceholder('Joueur 5', { exact: true })).toHaveCount(0);

    await expect(page.getByRole('checkbox', { name: 'Jouer contre un robot' })).toBeDisabled();
    await expect(page.getByTestId('setup-bot-player-count-reason')).toBeVisible();

    await startConfiguredGame(page);
    const starterOverlay = page.getByTestId('starting-player-overlay');
    await expect(starterOverlay.locator('[data-testid^="starter-option-"]')).toHaveCount(4);
    await page.getByTestId('starter-option-0').click();

    await expect(page.getByTestId('x01-player-card')).toHaveCount(4);
    for (const name of PLAYERS) {
      await expect(activeCard(page)).toHaveCount(1);
      await expect(activeCard(page)).toContainText(name);
      await enterVisit(page, '60');
    }

    await expect(activeCard(page)).toContainText(PLAYERS[0]);
    await expect(page.getByTestId('x01-player-score')).toHaveText(['441', '441', '441', '441']);
  });
});
