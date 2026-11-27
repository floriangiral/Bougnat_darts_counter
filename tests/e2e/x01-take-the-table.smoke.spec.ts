import { expect, test, type Page } from '@playwright/test';
import { APP_SESSION_STORAGE_KEY } from '../../utils/appPersistence';

// Spec 137 « Je prends la gagne » (T014, exécuté en CI uniquement) : duel terminé, file d'attente,
// challenger au lancer sans « Qui commence ? », rechargement, puis Quitter qui vide la file.

const finishedDuel = {
  id: 'e2e-take-the-table',
  config: {
    startingScore: 301, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
    legsToWin: 1, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 0,
  },
  players: [
    { id: 'p1', teamId: 'p1', name: 'Alice' },
    { id: 'p2', teamId: 'p2', name: 'Bob' },
  ],
  setsWon: { p1: 0, p2: 0 },
  legsWon: { p1: 1, p2: 0 },
  completedLegs: [],
  currentPlayerIndex: 0,
  status: 'finished',
  matchWinnerId: 'p1',
  duration: 95,
  currentLeg: {
    startingPlayerIndex: 0,
    winnerId: 'p1',
    scores: { p1: 0, p2: 161 },
    history: [
      { playerId: 'p1', score: 180, remainingAfter: 121, dartsThrown: 3, isBust: false },
      { playerId: 'p2', score: 140, remainingAfter: 161, dartsThrown: 3, isBust: false },
      { playerId: 'p1', score: 121, remainingAfter: 0, dartsThrown: 3, isBust: false },
    ],
  },
};

const readQueue = (page: Page) => page.evaluate((key) => {
  const session = JSON.parse(window.localStorage.getItem(key) ?? 'null') as { x01ChallengerQueue?: string[] } | null;
  return session?.x01ChallengerQueue ?? null;
}, APP_SESSION_STORAGE_KEY);

test.describe('X01 : Je prends la gagne', () => {
  test('duel : le challenger prend la table et lance en premier, la file survit au rechargement', async ({ page }) => {
    // Session semée une seule fois : le rechargement doit relire celle que l'application a écrite.
    await page.addInitScript(({ key, payload }) => {
      if (window.sessionStorage.getItem('e2e-seeded')) return;
      window.localStorage.setItem(key, JSON.stringify(payload));
      window.sessionStorage.setItem('e2e-seeded', '1');
    }, {
      key: APP_SESSION_STORAGE_KEY,
      payload: {
        screen: 'STATS', selectedGameType: 'X01', currentMatch: finishedDuel, matchWinner: 'p1',
        arenaPrefillPlayers: [], cricketResults: null, triathlonData: null, capitalResults: [], matchRuntime: null,
      },
    });
    await page.goto('/');

    const actions = page.getByTestId('stats-actions-row').getByRole('button');
    await expect(actions).toHaveText([/Revanche/i, /Je prends la gagne/i, /Partager/i, /Sortie/i]);
    await page.getByTestId('stats-take-the-table').click();

    const dialog = page.getByRole('dialog', { name: 'Qui prend la gagne ?' });
    await expect(dialog.getByTestId('x01-challenger-winner')).toContainText('Alice');
    await expect(dialog.getByTestId('x01-challenger-leaving')).toHaveText('Bob sort');
    const challenger = dialog.getByRole('textbox', { name: 'Challenger' });
    await expect(challenger).toBeFocused();
    await challenger.fill('Paul');
    await dialog.getByRole('textbox', { name: 'Ajouter à la file' }).fill('Léa');
    await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click();
    await dialog.getByRole('button', { name: 'Ajouter Bob en fin de file' }).click();
    await expect(dialog.getByTestId('x01-challenger-next')).toHaveText('Prochain : Léa, puis Bob');
    await challenger.press('Enter');

    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('starting-player-overlay')).toHaveCount(0);
    const activeCard = page.locator('[data-testid="x01-player-card"][data-state="active"]');
    await expect(activeCard).toContainText('Paul');
    await expect(page.getByTestId('x01-player-score')).toHaveText(['301', '301']);
    await expect.poll(() => readQueue(page)).toEqual(['Léa', 'Bob']);

    await page.reload();
    await expect(page.getByTestId('starting-player-overlay')).toHaveCount(0);
    await expect(activeCard).toContainText('Paul');
    expect(await readQueue(page)).toEqual(['Léa', 'Bob']);

    await page.getByRole('button', { name: /Quitter/ }).click();
    await page.getByRole('button', { name: 'Oui' }).click();
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
    await expect.poll(() => readQueue(page)).toEqual([]);
  });
});
