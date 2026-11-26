import { expect, test, type Page } from '@playwright/test';
import { openSetup, startConfiguredGame } from './helpers';

// Specs 052 et 132 : X01 simple à 4 joueurs, ordre choisi puis respecté.
const PLAYERS = ['Alice', 'Bruno', 'Chloé', 'Damien'];
const TURN_ORDER = [2, 0, 3, 1];

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
    await page.getByTestId('setup-quick-customize').click();

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
    const orderOverlay = page.getByTestId('throw-order-overlay');
    await expect(orderOverlay.locator('[data-testid^="throw-order-option-"]')).toHaveCount(4);
    await expect(page.getByTestId('throw-order-confirm')).toBeDisabled();
    for (const index of TURN_ORDER.slice(0, -1)) {
      await page.getByTestId(`throw-order-option-p${index + 1}`).click();
    }
    await expect(page.getByTestId(`throw-order-option-p${TURN_ORDER[3] + 1}`)).toHaveAttribute('data-order', '4');
    await page.getByTestId('throw-order-confirm').click();
    await expect(orderOverlay).toBeHidden();

    await expect(page.getByTestId('x01-player-card')).toHaveCount(4);
    for (const index of TURN_ORDER) {
      await expect(activeCard(page)).toHaveCount(1);
      await expect(activeCard(page)).toContainText(PLAYERS[index]);
      await enterVisit(page, '60');
    }

    await expect(activeCard(page)).toContainText(PLAYERS[TURN_ORDER[0]]);
    await expect(page.getByTestId('x01-player-score')).toHaveText(['441', '441', '441', '441']);
  });
});
