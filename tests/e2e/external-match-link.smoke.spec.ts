// Spec: spec:counter/external-match-link
// The smoke build allows https://partner.example as return origin
// (VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS, cf. .github/actions/run-local-smoke).
import { expect, test, type Page } from '@playwright/test';
import { APP_SESSION_STORAGE_KEY } from '../../utils/appPersistence';
import { pickDefaultStarterIfNeeded, seedAppSession } from './helpers';

const PARTNER_RETURN = 'https://partner.example/match/12?ref=abc';

const linkUrl = (params: Record<string, string>) =>
  `/?${new URLSearchParams({ game: 'x01', p1: 'Alice', p2: 'Bob', return: PARTNER_RETURN, ...params }).toString()}`;

const inputValues = (page: Page) =>
  page.locator('input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

const routePartner = (page: Page) =>
  page.route('https://partner.example/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Partner</h1>' }));

const partnerParams = async (page: Page) => {
  await page.waitForURL(/partner\.example/);
  return Object.fromEntries(new URL(page.url()).searchParams);
};

const config = { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', setsToWin: 1, legsToWin: 3, isDoubles: false };
const players = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];
const externalMatch = {
  returnUrl: PARTNER_RETURN,
  playerNames: ['Alice', 'Bob'],
  config: { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 3, isDoubles: false },
};

const leg = (winnerId: string | null) => ({
  scores: { p1: winnerId === 'p1' ? 0 : 140, p2: winnerId === 'p2' ? 0 : 140 },
  history: [],
  winnerId,
  startingPlayerIndex: 0,
});

const baseSession = {
  selectedGameType: 'X01',
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
};

const finishedLinkedMatchSession = {
  ...baseSession,
  screen: 'STATS',
  currentMatch: {
    id: 'e2e-linked-match',
    config,
    players,
    setsWon: { p1: 0, p2: 0 },
    legsWon: { p1: 3, p2: 1 },
    completedLegs: [leg('p1'), leg('p2'), leg('p1')],
    currentLeg: leg('p1'),
    status: 'finished',
    matchWinnerId: 'p1',
    currentPlayerIndex: 0,
    duration: 600,
  },
  matchWinner: 'p1',
  externalMatch,
};

const inProgressMatch = {
  id: 'e2e-local-match',
  config,
  players: [
    { id: 'p1', name: 'Carl', teamId: 'p1' },
    { id: 'p2', name: 'Dan', teamId: 'p2' },
  ],
  setsWon: { p1: 0, p2: 0 },
  legsWon: { p1: 0, p2: 0 },
  completedLegs: [],
  currentLeg: { scores: { p1: 401, p2: 501 }, history: [], winnerId: null, startingPlayerIndex: 0 },
  status: 'playing',
  matchWinnerId: null,
  currentPlayerIndex: 1,
  duration: 0,
};

const inProgressSession = {
  ...baseSession,
  screen: 'MATCH',
  currentMatch: inProgressMatch,
  matchRuntime: { match: inProgressMatch, hasGameStarted: true, elapsedSeconds: 30 },
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('e2e-storage-cleared')) {
      window.localStorage.clear();
      window.sessionStorage.setItem('e2e-storage-cleared', '1');
    }
  });
});

test('a valid link opens the X01 setup pre-filled, locked and cleans the address bar', async ({ page }) => {
  await page.goto(linkUrl({ start: '301', legs: '2' }));

  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
  expect(await inputValues(page)).toEqual(expect.arrayContaining(['Alice', 'Bob']));
  await expect(page.getByText('301').first()).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('');

  await expect(page.getByTestId('setup-external-match-banner')).toContainText('partner.example');
  await expect(page.getByPlaceholder('Joueur 1')).toBeDisabled();
  await expect(page.getByPlaceholder('Joueur 2')).toBeDisabled();
  await expect(page.getByRole('button', { name: '501' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Doublettes' })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: 'Jouer contre un robot' })).toHaveCount(0);

  // The lock survives a reload (context persisted, link params already removed)
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key) ?? '', APP_SESSION_STORAGE_KEY))
    .toContain('partner.example');
  await page.reload();
  await expect(page.getByTestId('setup-external-match-banner')).toBeVisible();
  await expect(page.getByPlaceholder('Joueur 1')).toBeDisabled();
});

test('a link with a non-allowed return URL keeps the usual home screen', async ({ page }) => {
  await page.goto(linkUrl({ return: 'https://evil.example/steal' }));

  await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toHaveCount(0);
});

test('a linked match played to the end sends the result back to the partner', async ({ page }) => {
  await routePartner(page);
  await page.goto(linkUrl({ start: '2', legs: '1' }));

  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
  await pickDefaultStarterIfNeeded(page);
  await page.getByTestId('x01-keypad-2').click();
  await page.getByTestId('x01-keypad-ok').click();
  await page.getByTestId('checkout-darts-1').click();
  await page.getByTestId('winner-view-stats').click();

  await expect(page.getByText('partner.example')).toBeVisible();
  await expect(page.getByTestId('stats-rematch')).toHaveCount(0);
  await page.getByTestId('stats-external-return').click();
  expect(await partnerParams(page)).toEqual({ ref: 'abc', status: 'completed', legs1: '1', legs2: '0', winner: '1' });
});

test('the end screen of a restored linked match sends the result back to the partner', async ({ page }) => {
  await seedAppSession(page, finishedLinkedMatchSession);
  await routePartner(page);

  await page.goto('/');
  await expect(page.getByTestId('stats-external-return')).toBeVisible();
  await expect(page.getByText('partner.example')).toBeVisible();
  await expect(page.getByTestId('stats-rematch')).toHaveCount(0);

  await page.getByTestId('stats-external-return').click();
  expect(await partnerParams(page)).toEqual({ ref: 'abc', status: 'completed', legs1: '3', legs2: '1', winner: '1' });
});

test('leaving the end screen without sending the result asks first', async ({ page }) => {
  await seedAppSession(page, finishedLinkedMatchSession);
  await page.goto('/');

  await page.getByTestId('stats-home').click();
  await expect(page.getByRole('dialog', { name: 'Résultat non envoyé' })).toBeVisible();
  await page.getByTestId('external-leave-cancel').click();
  await expect(page.getByTestId('stats-external-return')).toBeVisible();

  await page.getByTestId('stats-home').click();
  await page.getByTestId('external-leave-confirm').click();
  await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
});

test('leaving the setup of a linked match can tell the partner it is cancelled', async ({ page }) => {
  await routePartner(page);
  await page.goto(linkUrl({}));

  await page.getByRole('button', { name: /^Retour$/i }).click();
  await expect(page.getByRole('dialog', { name: 'Quitter le match du tournoi ?' })).toBeVisible();
  await page.getByTestId('external-leave-notify').click();
  expect(await partnerParams(page)).toEqual({ ref: 'abc', status: 'cancelled' });
});

test('leaving the setup of a linked match silently drops the link', async ({ page }) => {
  await page.goto(linkUrl({}));

  await page.getByRole('button', { name: /^Retour$/i }).click();
  await page.getByTestId('external-leave-cancel').click();
  await expect(page.getByTestId('setup-external-match-banner')).toBeVisible();

  await page.getByRole('button', { name: /^Retour$/i }).click();
  await page.getByTestId('external-leave-confirm').click();
  await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
  await page.getByTestId('game-card-x01').click();
  await expect(page.getByTestId('setup-external-match-banner')).toHaveCount(0);
  await expect(page.getByPlaceholder('Joueur 1')).toBeEnabled();
});

test('exiting a linked match asks whether to tell the partner', async ({ page }) => {
  await page.goto(linkUrl({}));
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
  await pickDefaultStarterIfNeeded(page);

  await page.getByRole('button', { name: 'Quitter' }).click();
  await page.getByRole('button', { name: 'OUI' }).click();
  await expect(page.getByRole('dialog', { name: 'Quitter le match du tournoi ?' })).toBeVisible();
  await page.getByTestId('external-leave-cancel').click();
  await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Quitter le match ?' })).toHaveCount(0);
});

test('a link opened over a match in progress asks first and can keep the match', async ({ page }) => {
  await seedAppSession(page, inProgressSession);
  await page.goto(linkUrl({}));

  await expect(page.getByRole('dialog', { name: 'Une partie est en cours' })).toBeVisible();
  await expect(page.getByText('Nouveau match : Alice vs Bob')).toBeVisible();
  await page.getByTestId('external-conflict-keep').click();

  await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
  await expect(page.getByText('Carl').first()).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('a link opened over a match in progress can replace it once confirmed', async ({ page }) => {
  await seedAppSession(page, inProgressSession);
  await page.goto(linkUrl({}));

  await page.getByTestId('external-conflict-open').click();
  await expect(page.getByTestId('setup-external-match-banner')).toBeVisible();
  expect(await inputValues(page)).toEqual(expect.arrayContaining(['Alice', 'Bob']));
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('a link opened over an unsent linked result warns about it', async ({ page }) => {
  await seedAppSession(page, finishedLinkedMatchSession);
  await page.goto(linkUrl({ p1: 'Carl', p2: 'Dan' }));

  await expect(page.getByRole('dialog', { name: 'Résultat précédent non envoyé' })).toBeVisible();
  await page.getByTestId('external-conflict-keep').click();
  await expect(page.getByTestId('stats-external-return')).toBeVisible();
});
