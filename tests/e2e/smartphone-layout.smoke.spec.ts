import { expect, test, type Page } from '@playwright/test';
import { pickDefaultStarterIfNeeded, seedAppSession } from './helpers';

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

  test('X01 : le partage affiche l’image du résultat à quatre joueurs', async ({ page }) => {
    const players = ['Alice', 'Bruno', 'Chloé', 'Damien'].map((name, index) => ({
      id: `p${index + 1}`, teamId: `p${index + 1}`, name,
    }));
    const match = {
      id: 'e2e-share-four-players',
      config: {
        startingScore: 301, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
        legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
      },
      players,
      setsWon: { p1: 0, p2: 0, p3: 0, p4: 0 },
      completedLegs: [],
      currentPlayerIndex: 0,
      status: 'finished',
      matchWinnerId: 'p1',
      legsWon: { p1: 1, p2: 0, p3: 0, p4: 0 },
      duration: 123,
      currentLeg: {
        startingPlayerIndex: 0,
        winnerId: 'p1',
        scores: { p1: 0, p2: 161, p3: 201, p4: 241 },
        history: [
          { playerId: 'p1', score: 180, remainingAfter: 121, dartsThrown: 3, isBust: false },
          { playerId: 'p2', score: 140, remainingAfter: 161, dartsThrown: 3, isBust: false },
          { playerId: 'p3', score: 100, remainingAfter: 201, dartsThrown: 3, isBust: false },
          { playerId: 'p4', score: 60, remainingAfter: 241, dartsThrown: 3, isBust: false },
          { playerId: 'p1', score: 121, remainingAfter: 0, dartsThrown: 3, isBust: false },
        ],
      },
    };
    await seedAppSession(page, {
      screen: 'STATS', selectedGameType: 'X01', currentMatch: match, matchWinner: 'p1',
      arenaPrefillPlayers: [], cricketResults: null, triathlonData: null, capitalResults: [], matchRuntime: null,
    });
    await page.goto('/');
    await page.getByTestId('stats-share').click();
    const share = page.getByRole('dialog', { name: 'Partager le résultat' });
    const image = share.getByRole('img', { name: /Aperçu de l’image du résultat X01/ });
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(900);
    await expect(share.getByRole('button', { name: 'Enregistrer l’image' })).toBeEnabled();
    await expect(share.getByRole('button', { name: 'Copier le texte' })).toBeEnabled();
    await share.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByTestId('stats-home')).toBeVisible();
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
