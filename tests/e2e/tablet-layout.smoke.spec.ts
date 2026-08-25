import { expect, test, type Page } from '@playwright/test';

const games = [
  { name: 'Match X01', id: 'x01', root: 'tablet-x01-root' },
  { name: 'Cricket', id: 'cricket', root: 'tablet-cricket-root' },
  { name: 'Capital', id: 'capital', root: 'tablet-capital-root' },
  { name: 'Gotcha', id: 'gotcha', root: 'tablet-gotcha-root' },
  { name: 'Killer', id: 'killer', root: 'tablet-killer-root' },
  { name: 'Triathlon', id: 'triathlon', root: 'tablet-triathlon-root' },
] as const;

const startGame = async (page: Page, gameId: string) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/?mode=dedicated_tablet');
  await page.getByRole('button', { name: /Lancer une partie/i }).click();
  await page.getByTestId(`game-card-${gameId}`).click();
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();

  const starterOverlay = page.getByTestId('starting-player-overlay');
  if (await starterOverlay.isVisible().catch(() => false)) {
    await starterOverlay.locator('[data-testid^="starter-option-"]').first().click();
  }
};

const getOverflow = async (page: Page) => page.evaluate(() => ({
  horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
}));

test.describe('tablet presentation contract', () => {
  for (const game of games) {
    test(`${game.name} stays usable on tablet`, async ({ page }) => {
      await startGame(page, game.id);

      const shell = page.locator('[data-layout="tablet"]');
      await expect(shell).toHaveAttribute('data-tablet-orientation', /portrait|landscape/);
      await expect(page.locator(`.${game.root}`).first()).toBeVisible();

      const overflow = await getOverflow(page);
      expect(overflow.horizontal).toBeLessThanOrEqual(1);
      expect(overflow.vertical).toBeLessThanOrEqual(1);
    });
  }
});