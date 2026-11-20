import { expect, test, type Page } from '@playwright/test';

const games = [
  { name: 'Match X01', id: 'x01', primary: '[data-testid="x01-keypad-ok"]' },
  { name: 'Cricket', id: 'cricket', primary: 'button:has-text("MISS")' },
  { name: 'Capital', id: 'capital', primary: 'text=Objectif Actuel' },
  { name: 'Gotcha', id: 'gotcha', primary: 'button:has-text("Valider")' },
  { name: 'Killer', id: 'killer', primary: 'main button' },
  { name: 'Triathlon', id: 'triathlon', primary: '[data-testid="starting-player-overlay"]' },
] as const;

const startGame = async (page: Page, gameId: string) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Lancer une partie/i }).click();
  await page.getByTestId(`game-card-${gameId}`).click();
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
};

const getOverflow = async (page: Page) => page.evaluate(() => ({
  horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
}));

const isLandscape = (page: Page) => {
  const viewport = page.viewportSize();
  return !!viewport && viewport.width > viewport.height;
};

test.describe('smartphone presentation contract', () => {
  test('phones are portrait-only: landscape shows the rotate screen until turned back', async ({ page }) => {
    await page.goto('/');
    const overlay = page.getByTestId('rotate-to-portrait-overlay');
    if (!isLandscape(page)) {
      await expect(overlay).toHaveCount(0);
      return;
    }
    await expect(overlay).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(overlay).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  });

  for (const game of games) {
    test(`${game.name} stays usable on smartphone`, async ({ page }) => {
      test.skip(isLandscape(page), 'Phones are portrait-only: in landscape the rotate screen covers the app.');
      await startGame(page, game.id);

      await expect(page.locator('[data-layout="smartphone"]')).toHaveAttribute('data-tablet-orientation', /portrait|landscape/);
      await expect(page.locator(game.primary).first()).toBeVisible();

      const overflow = await getOverflow(page);
      expect(overflow.horizontal).toBeLessThanOrEqual(1);
      expect(overflow.vertical).toBeLessThanOrEqual(1);
    });
  }
});
