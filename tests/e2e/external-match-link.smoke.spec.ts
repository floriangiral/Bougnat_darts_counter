// Spec: spec:counter/external-match-link
// The smoke build allows https://partner.example as return origin
// (VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS, cf. .github/actions/run-local-smoke).
import { expect, test } from '@playwright/test';
import { seedAppSession } from './helpers';

const PARTNER_RETURN = 'https://partner.example/match/12?ref=abc';

const linkUrl = (params: Record<string, string>) =>
  `/?${new URLSearchParams({ game: 'x01', p1: 'Alice', p2: 'Bob', return: PARTNER_RETURN, ...params }).toString()}`;

const inputValues = (page: import('@playwright/test').Page) =>
  page.locator('input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('e2e-storage-cleared')) {
      window.localStorage.clear();
      window.sessionStorage.setItem('e2e-storage-cleared', '1');
    }
  });
});

test('a valid link opens the X01 setup pre-filled and cleans the address bar', async ({ page }) => {
  await page.goto(linkUrl({ start: '301', legs: '2' }));

  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
  expect(await inputValues(page)).toEqual(expect.arrayContaining(['Alice', 'Bob']));
  await expect(page.getByText('301').first()).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('a link with a non-allowed return URL keeps the usual home screen', async ({ page }) => {
  await page.goto(linkUrl({ return: 'https://evil.example/steal' }));

  await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toHaveCount(0);
});

test('the end screen of a linked match sends the result back to the partner', async ({ page }) => {
  const leg = (winnerId: string) => ({
    scores: { p1: winnerId === 'p1' ? 0 : 140, p2: winnerId === 'p2' ? 0 : 140 },
    history: [],
    winnerId,
    startingPlayerIndex: 0,
  });
  await seedAppSession(page, {
    screen: 'STATS',
    selectedGameType: 'X01',
    currentMatch: {
      id: 'e2e-linked-match',
      config: { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', setsToWin: 1, legsToWin: 3, isDoubles: false },
      players: [
        { id: 'p1', name: 'Alice', teamId: 'p1' },
        { id: 'p2', name: 'Bob', teamId: 'p2' },
      ],
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
    arenaPrefillPlayers: [],
    cricketResults: null,
    triathlonData: null,
    capitalResults: [],
    matchRuntime: null,
    externalMatch: { returnUrl: PARTNER_RETURN },
  });
  await page.route('https://partner.example/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Partner</h1>' }));

  await page.goto('/');
  await expect(page.getByTestId('stats-external-return')).toBeVisible();
  await expect(page.getByText('partner.example')).toBeVisible();
  await expect(page.getByTestId('stats-rematch')).toHaveCount(0);

  await page.getByTestId('stats-external-return').click();
  await page.waitForURL(/partner\.example/);
  const url = new URL(page.url());
  expect(Object.fromEntries(url.searchParams)).toEqual({ ref: 'abc', legs1: '3', legs2: '1', winner: '1' });
});
