import { expect, test, type Locator, type Page } from '@playwright/test';
import { pickDefaultStarterIfNeeded } from './helpers';

// Specs 070 (AC-03, AC-04), 071 (AC-01 à AC-06) et 072 (AC-04, AC-06, AC-07). Aucune invite d'orientation
// sur tablette (décision PO, spec 073 rejetée).
// Profils tactiles réalistes (barres de navigateur comprises), sans forçage ?mode=dedicated_tablet.

const games = [
  { name: 'Match X01', id: 'x01' },
  { name: 'Cricket', id: 'cricket' },
  { name: 'Capital', id: 'capital' },
  { name: 'Gotcha', id: 'gotcha' },
  { name: 'Killer', id: 'killer' },
  { name: 'Triathlon', id: 'triathlon' },
] as const;

const TOUCH_FLOOR = 47.5; // 48 px, tolérance d'arrondi sous-pixel.

const isLandscape = (page: Page) => {
  const viewport = page.viewportSize();
  return !!viewport && viewport.width > viewport.height;
};

const startGame = async (page: Page, gameId: string) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Lancer une partie/i }).click();
  await page.getByTestId(`game-card-${gameId}`).click();
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();

  await pickDefaultStarterIfNeeded(page);
  await expect(page.getByTestId('game-screen').first()).toBeVisible();
};

const dismissOrientationHint = async (page: Page) => {
  const dismiss = page.getByTestId('orientation-hint-dismiss');
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
};

const getOverflow = async (page: Page) => page.evaluate(() => ({
  horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
}));

const visibleButtons = async (scope: Locator) => {
  const buttons = await scope.locator('button:visible').all();
  const boxes = [];
  for (const button of buttons) {
    const box = await button.boundingBox();
    if (box) boxes.push({ button, box, label: (await button.getAttribute('aria-label')) ?? (await button.innerText()) });
  }
  return boxes;
};

test.describe('présentation tablette tactile', () => {
  test('la détection réelle classe le profil en tablette (071 AC-01, 070 AC-03)', async ({ page }) => {
    await page.goto('/');
    const shell = page.locator('[data-layout]').first();
    await expect(shell).toHaveAttribute('data-layout', 'tablet');
    await expect(shell).toHaveAttribute('data-input', 'touch');
    await expect(shell).toHaveAttribute('data-recipe', isLandscape(page) ? 'arena' : /stack/);
    await expect(page.getByTestId('orientation-hint')).toHaveCount(0);
  });

  for (const game of games) {
    test(`${game.name} : informations et actions atteignables, cibles ≥ 48 px (071 AC-02/04/05/06)`, async ({ page }) => {
      await startGame(page, game.id);
      await dismissOrientationHint(page);

      const screen = page.getByTestId('game-screen').first();
      const overflow = await getOverflow(page);
      expect(overflow.horizontal).toBeLessThanOrEqual(1);
      expect(overflow.vertical).toBeLessThanOrEqual(1);

      for (const { label, box } of await visibleButtons(screen.locator('[data-zone="header"]'))) {
        expect(box.height, `en-tête « ${label} »`).toBeGreaterThanOrEqual(TOUCH_FLOOR);
        expect(box.width, `en-tête « ${label} »`).toBeGreaterThanOrEqual(TOUCH_FLOOR);
      }

      const input = screen.locator('[data-zone="input"]');
      const inputButtons = await input.locator('button').all();
      expect(inputButtons.length).toBeGreaterThan(0);
      for (const button of inputButtons) {
        if (!(await button.isVisible())) continue;
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
        const box = await button.boundingBox();
        const label = (await button.getAttribute('aria-label')) ?? (await button.innerText());
        expect(box?.height ?? 0, `touche « ${label} »`).toBeGreaterThanOrEqual(TOUCH_FLOOR);
        expect(box?.width ?? 0, `touche « ${label} »`).toBeGreaterThanOrEqual(TOUCH_FLOOR);
      }
    });
  }

  test('X01 : score lisible, pavé pleine colonne, Annuler à côté de Valider (071 AC-02/03, 072 AC-04)', async ({ page }) => {
    await startGame(page, 'x01');
    await dismissOrientationHint(page);

    const scoreFontSizes = await page.locator('.x01-score-value').evaluateAll((nodes) =>
      nodes.map((node) => ({
        size: Number.parseFloat(getComputedStyle(node).fontSize),
        height: node.getBoundingClientRect().height,
      })));
    expect(scoreFontSizes.length).toBeGreaterThanOrEqual(2);
    for (const { size, height } of scoreFontSizes) {
      expect(size).toBeGreaterThanOrEqual(48);
      expect(height).toBeGreaterThan(0);
    }

    const ok = page.getByTestId('x01-keypad-ok');
    const undo = page.getByTestId('x01-keypad-undo');
    await expect(ok).toBeInViewport();
    await expect(undo).toBeInViewport();
    if (isLandscape(page)) {
      const [okBox, undoBox] = [await ok.boundingBox(), await undo.boundingBox()];
      expect(okBox && undoBox).toBeTruthy();
      // Même rangée : les boîtes se recouvrent verticalement.
      expect(Math.abs((okBox?.y ?? 0) - (undoBox?.y ?? 0))).toBeLessThan((okBox?.height ?? 0) / 2);
      expect(okBox?.height ?? 0).toBeGreaterThanOrEqual(TOUCH_FLOOR);

      // Pas de vide > 48 px sous la dernière rangée du pavé (071 AC-02).
      const inputZone = await page.locator('[data-zone="input"]').boundingBox();
      const lowest = Math.max((okBox?.y ?? 0) + (okBox?.height ?? 0), (undoBox?.y ?? 0) + (undoBox?.height ?? 0));
      expect((inputZone?.y ?? 0) + (inputZone?.height ?? 0) - lowest).toBeLessThanOrEqual(48);
    }
  });

  test('180 Around the Clock en solo : les 20 cases de progression restent lisibles (spec 130)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto('/');
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await page.getByTestId('game-card-atc180').click();
    await page.getByTestId('setup-player-count').getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('button', { name: /Lancer La Partie/i }).click();
    await pickDefaultStarterIfNeeded(page);
    await dismissOrientationHint(page);

    const grid = page.getByTestId('atc180-training-grid');
    await expect(grid).toBeVisible();
    const tiles = await grid.locator('li').evaluateAll((nodes) => nodes.map((node) => ({
      height: node.getBoundingClientRect().height,
      clipped: node.scrollHeight - node.clientHeight,
    })));
    expect(tiles).toHaveLength(20);
    for (const [index, { height, clipped }] of tiles.entries()) {
      expect(height, `case ${index + 1}`).toBeGreaterThanOrEqual(40);
      expect(clipped, `case ${index + 1} rognée`).toBeLessThanOrEqual(1);
    }
    await expect(page.getByTestId('atc180-training-round-20')).toBeInViewport();
  });

  test('rotation en cours de saisie : saisie et scores conservés, jamais d’invite sur tablette (070 AC-04, 072 AC-06)', async ({ page }) => {
    test.skip(isLandscape(page), 'Scénario de rotation joué depuis le profil portrait.');
    await startGame(page, 'x01');

    // Décision PO (spec 073 rejetée) : le portrait est la présentation de référence sur tablette.
    const hint = page.getByTestId('orientation-hint');
    await expect(hint).toHaveCount(0);

    await page.getByTestId('x01-keypad-6').click();
    await page.getByTestId('x01-keypad-0').click();
    const inputZone = page.locator('[data-zone="input"]');
    await expect(inputZone).toContainText('60');

    await page.setViewportSize({ width: 1080, height: 750 });
    await expect(page.locator('[data-recipe="arena"]')).toHaveCount(1);
    await expect(hint).toHaveCount(0);
    await expect(inputZone).toContainText('60');

    await page.setViewportSize({ width: 810, height: 1010 });
    await expect(page.locator('[data-recipe="stack"]')).toHaveCount(1);
    await expect(hint).toHaveCount(0);
    await expect(inputZone).toContainText('60');
  });
});
