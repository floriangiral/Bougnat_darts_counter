import { expect, test, type Page } from '@playwright/test';
import { pickDefaultStarterIfNeeded } from './helpers';

// Spec 028 (Révision V2, option B) : le portrait reste recommandé sur téléphone, mais le paysage n'est
// jamais bloqué (WCAG 1.3.4) ; une invite non bloquante s'affiche sur les écrans de jeu seulement.

const games = [
  { name: 'Match X01', id: 'x01' },
  { name: 'Cricket', id: 'cricket' },
  { name: 'Capital', id: 'capital' },
  { name: 'Gotcha', id: 'gotcha' },
  { name: 'Killer', id: 'killer' },
  { name: 'Triathlon', id: 'triathlon' },
] as const;

const PHONE_FLOOR = 43.5; // 44 px, tolérance d'arrondi.

const startGame = async (page: Page, gameId: string) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Lancer une partie/i }).click();
  await page.getByTestId(`game-card-${gameId}`).click();
  const launch = page.getByRole('button', { name: /Lancer La Partie/i });
  await launch.scrollIntoViewIfNeeded();
  await launch.click();

  await pickDefaultStarterIfNeeded(page);
  await expect(page.getByTestId('game-screen').first()).toBeVisible();
};

const getOverflow = async (page: Page) => page.evaluate(() => ({
  horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
}));

const isLandscape = (page: Page) => {
  const viewport = page.viewportSize();
  return !!viewport && viewport.width > viewport.height;
};

test.describe('présentation téléphone', () => {
  test('aucun écran bloquant ni invite hors partie, dans les deux orientations (028 V2-AC-03)', async ({ page }) => {
    await page.goto('/');
    const shell = page.locator('[data-layout]').first();
    await expect(shell).toHaveAttribute('data-layout', 'smartphone');
    await expect(shell).toHaveAttribute('data-recipe', isLandscape(page) ? 'phone-landscape' : 'stack');
    await expect(page.getByTestId('orientation-hint')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  });

  for (const game of games) {
    test(`${game.name} reste jouable (028 V2-AC-02)`, async ({ page }) => {
      await startGame(page, game.id);

      const hint = page.getByTestId('orientation-hint');
      if (isLandscape(page)) {
        await expect(hint).toHaveAttribute('data-hint', 'rotate-to-portrait');
        await page.getByTestId('orientation-hint-dismiss').click();
        await expect(hint).toHaveCount(0);
      } else {
        await expect(hint).toHaveCount(0);
      }

      const overflow = await getOverflow(page);
      expect(overflow.horizontal).toBeLessThanOrEqual(1);
      expect(overflow.vertical).toBeLessThanOrEqual(1);

      const inputButtons = await page.locator('[data-zone="input"] button').all();
      expect(inputButtons.length).toBeGreaterThan(0);
      for (const button of inputButtons) {
        if (!(await button.isVisible())) continue;
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
        const box = await button.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(PHONE_FLOOR);
      }
    });
  }

  test('X01 : une volée saisie change le score affiché, dans les deux orientations', async ({ page }) => {
    await startGame(page, 'x01');
    const dismiss = page.getByTestId('orientation-hint-dismiss');
    if (await dismiss.isVisible().catch(() => false)) await dismiss.click();

    const players = page.locator('[data-zone="players"]');
    await expect(players).toContainText('501');
    await page.getByTestId('x01-keypad-6').click();
    await page.getByTestId('x01-keypad-0').click();
    await page.getByTestId('x01-keypad-ok').click();
    await expect(players).toContainText('441');
  });

  test('« Continuer en paysage » vaut pour la partie en cours seulement (028 V2-AC-03)', async ({ page }) => {
    test.skip(!isLandscape(page), 'Scénario joué depuis un profil paysage.');
    await startGame(page, 'cricket');
    await page.getByTestId('orientation-hint-dismiss').click();
    await expect(page.getByTestId('orientation-hint')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('game-screen').first()).toBeVisible();
    await expect(page.getByTestId('orientation-hint')).toHaveCount(0);
  });
});
