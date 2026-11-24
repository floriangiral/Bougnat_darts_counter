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
  page.context().route('https://partner.example/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Partner</h1>' }));

/** Launches the locked setup and picks the first player if the starter prompt shows up. */
const startLinkedMatch = async (page: Page) => {
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
  const overlay = page.getByTestId('starting-player-overlay');
  await pickDefaultStarterIfNeeded(page);
  await expect(overlay).toHaveCount(0);
  await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
};

const exitMatchButton = (page: Page) => page.locator('button[aria-label="Quitter"]');

/** Seeds the session for the first load only (seedAppSession re-applies it on every load). */
const seedAppSessionOnce = (page: Page, session: unknown) =>
  page.addInitScript(
    ({ storageKey, payload }) => {
      if (window.sessionStorage.getItem('e2e-session-seeded')) return;
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      window.sessionStorage.setItem('e2e-session-seeded', '1');
    },
    { storageKey: APP_SESSION_STORAGE_KEY, payload: session },
  );

const partnerParams = async (page: Page) => {
  await page.waitForURL(/partner\.example/);
  return Object.fromEntries(new URL(page.url()).searchParams);
};

const resultAtPartner = async (page: Page, action: () => Promise<void>) => {
  const partnerPagePromise = page.context().waitForEvent('page');
  await action();
  const partnerPage = await partnerPagePromise;
  await partnerPage.waitForURL(/partner\.example/);
  await expect(page.getByTestId('stats-share')).toBeVisible();
  return Object.fromEntries(new URL(partnerPage.url()).searchParams);
};

const retryPartnerResult = (page: Page) =>
  resultAtPartner(page, () => page.getByTestId('partner-send-retry').click());

const config = { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', setsToWin: 1, legsToWin: 3, isDoubles: false };
const players = [
  { id: 'p1', name: 'Alice', teamId: 'p1' },
  { id: 'p2', name: 'Bob', teamId: 'p2' },
];
const externalMatch = {
  returnUrl: PARTNER_RETURN,
  createdAt: Date.now(),
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
  status: 'active',
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

test('@critique a valid link opens the X01 setup pre-filled, locked and cleans the address bar', async ({ page }) => {
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

test('a link with a non-allowed return URL explains why and keeps the usual home screen', async ({ page }) => {
  await page.goto(linkUrl({ return: 'https://evil.example/steal' }));

  await expect(page.getByRole('dialog', { name: 'Lien de match invalide' })).toBeVisible();
  await expect(page.getByText("L'adresse de retour evil.example n'est pas autorisée sur ce compteur.")).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe('');
  await page.getByTestId('external-link-issue-close').click();

  await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toHaveCount(0);
});

test('a link with an invalid option explains why', async ({ page }) => {
  await page.goto(linkUrl({ legs: '0' }));

  await expect(page.getByText('Nombre de manches invalide (de 1 à 15).')).toBeVisible();
});

test('@critique a linked match played to the end sends the result back to the partner', async ({ page }) => {
  await routePartner(page);
  await page.goto(linkUrl({ start: '2', legs: '1' }));

  await startLinkedMatch(page);
  await page.getByTestId('x01-keypad-2').click();
  await page.getByTestId('x01-keypad-ok').click();
  const params = await resultAtPartner(page, () => page.getByTestId('checkout-darts-1').click());

  await expect(page.getByText('partner.example')).toBeVisible();
  await expect(page.getByTestId('partner-send-failed')).toHaveCount(0);
  expect(params).toEqual({ ref: 'abc', v: '1', status: 'completed', legs1: '1', legs2: '0', winner: '1' });
});

test('a restored linked result opens stats and can be retried', async ({ page }) => {
  await seedAppSession(page, finishedLinkedMatchSession);
  await routePartner(page);

  await page.goto('/');
  await expect(page.getByTestId('partner-send-failed')).toBeVisible();
  await expect(page.getByText('partner.example')).toBeVisible();
  await expect(page.getByTestId('stats-share')).toBeVisible();
  await expect(page.getByTestId('stats-home')).toBeVisible();

  expect(await retryPartnerResult(page)).toEqual({ ref: 'abc', v: '1', status: 'completed', legs1: '3', legs2: '1', winner: '1' });
});

test('leaving the setup of a linked match can tell the partner it is cancelled', async ({ page }) => {
  await routePartner(page);
  await page.goto(linkUrl({}));

  await page.getByRole('button', { name: /^Retour$/i }).click();
  await expect(page.getByRole('dialog', { name: 'Quitter le match lié ?' })).toBeVisible();
  await page.getByTestId('external-leave-notify').click();
  expect(await partnerParams(page)).toEqual({ ref: 'abc', v: '1', status: 'cancelled' });
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
  await startLinkedMatch(page);

  await exitMatchButton(page).click();
  await page.getByRole('button', { name: 'Oui', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Quitter le match lié ?' })).toBeVisible();
  await page.getByTestId('external-leave-cancel').click();
  await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Quitter la partie ?' })).toHaveCount(0);
});

test('quitting from the starting player prompt of a linked match shows the leave dialog', async ({ page }) => {
  await page.goto(linkUrl({}));
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
  const overlay = page.getByTestId('starting-player-overlay');
  await expect(overlay).toBeVisible();

  await page.getByTestId('starter-cancel').click();
  const leaveDialog = page.getByRole('dialog', { name: 'Quitter le match lié ?' });
  await expect(leaveDialog).toBeVisible();
  // The dialog is on top of the full-screen starter prompt, so its buttons are clickable
  await page.getByTestId('external-leave-cancel').click();
  await expect(leaveDialog).toHaveCount(0);
  await expect(overlay).toBeVisible();
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
  await expect(page.getByTestId('partner-send-retry')).toBeVisible();
});

test.describe('more external match link journeys', () => {
  const readSession = (page: Page) =>
    page.evaluate((key) => window.localStorage.getItem(key) ?? '', APP_SESSION_STORAGE_KEY);

  test('a doubles link locks the four names but keeps the pair starters', async ({ page }) => {
    await page.goto(linkUrl({ t1p1: 'Alice', t1p2: 'Carl', t2p1: 'Bob', t2p2: 'Dan' }));

    await expect(page.getByTestId('setup-external-match-banner')).toContainText('qui commence dans chaque duo');
    expect(await inputValues(page)).toEqual(expect.arrayContaining(['Alice', 'Carl', 'Bob', 'Dan']));
    for (const placeholder of ['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4']) {
      await expect(page.getByPlaceholder(placeholder)).toBeDisabled();
    }
    await expect(page.getByRole('button', { name: 'Carl' }).first()).toBeEnabled();
  });

  test('a stats=1 linked match sends the statistics with the result', async ({ page }) => {
    await routePartner(page);
    await page.goto(linkUrl({ start: '2', legs: '1', stats: '1' }));

    await startLinkedMatch(page);
    await page.getByTestId('x01-keypad-2').click();
    await page.getByTestId('x01-keypad-ok').click();
    const params = await resultAtPartner(page, () => page.getByTestId('checkout-darts-1').click());
    expect(params).toMatchObject({ v: '1', status: 'completed', legs1: '1', legs2: '0', winner: '1', hco1: '2', hco2: '0', n180_1: '0', avg2: '0.00' });
    expect(params.avg1).toMatch(/^\d+\.\d{2}$/);
    expect(params.duration).toMatch(/^\d+$/);
  });

  test('unrelated query params survive the address bar cleanup', async ({ page }) => {
    await page.goto(`${linkUrl({})}&mode=local`);
    await expect(page.getByTestId('setup-external-match-banner')).toBeVisible();
    await expect.poll(() => new URL(page.url()).search).toBe('?mode=local');
  });

  test.describe('invalid links explain why', () => {
    for (const [label, params, message] of [
      ['unknown version', { v: '2' }, 'Ce lien utilise une version non prise en charge par ce compteur.'],
      ['another game', { game: 'cricket' }, 'Seuls les matchs X01 peuvent être ouverts par un lien.'],
      ['missing players', { p2: '' }, 'Le lien doit contenir 2 joueurs (p1, p2) ou 4 joueurs (t1p1 à t2p2).'],
      ['invalid stats flag', { stats: 'yes' }, 'Paramètre stats invalide (1 ou 0).'],
    ] as const) {
      test(label, async ({ page }) => {
        await page.goto(linkUrl(params));
        await expect(page.getByRole('dialog', { name: 'Lien de match invalide' })).toBeVisible();
        await expect(page.getByText(message)).toBeVisible();
        await expect.poll(() => new URL(page.url()).search).toBe('');
      });
    }
  });

  test('an expired linked context is dropped and the local winner actions return', async ({ page }) => {
    await seedAppSession(page, {
      ...finishedLinkedMatchSession,
      externalMatch: { ...externalMatch, createdAt: Date.now() - 13 * 60 * 60 * 1000 },
    });
    await page.goto('/');

    await expect(page.getByTestId('stats-rematch')).toBeVisible();
    await expect(page.getByTestId('stats-share')).toBeVisible();
    await expect(page.getByTestId('partner-send-failed')).toHaveCount(0);
  });

  test('a context of the former shape is dropped', async ({ page }) => {
    await seedAppSession(page, { ...finishedLinkedMatchSession, externalMatch: { returnUrl: PARTNER_RETURN } });
    await page.goto('/');

    await expect(page.getByTestId('stats-rematch')).toBeVisible();
    await expect(page.getByTestId('stats-share')).toBeVisible();
    await expect(page.getByTestId('partner-send-failed')).toHaveCount(0);
  });

  test('a pending link survives a reload until the players decide', async ({ page }) => {
    await seedAppSession(page, inProgressSession);
    await page.goto(linkUrl({}));
    await expect(page.getByRole('dialog', { name: 'Une partie est en cours' })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('game')).toBe('x01');

    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Une partie est en cours' })).toBeVisible();
  });

  test('exiting a linked match can tell the partner it is cancelled', async ({ page }) => {
    await routePartner(page);
    await page.goto(linkUrl({}));
    await startLinkedMatch(page);

    await exitMatchButton(page).click();
    await page.getByRole('button', { name: 'Oui', exact: true }).click();
    await page.getByTestId('external-leave-notify').click();
    expect(await partnerParams(page)).toEqual({ ref: 'abc', v: '1', status: 'cancelled' });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Match X01/i })).toBeVisible();
  });

  test('the session left behind after sending the result no longer carries the link', async ({ page }) => {
    await seedAppSessionOnce(page, finishedLinkedMatchSession);
    await routePartner(page);
    await page.goto('/');

    await retryPartnerResult(page);

    await page.goto('/');
    await expect(page.getByTestId('stats-share')).toBeVisible();
    await expect(page.getByTestId('stats-rematch')).toHaveCount(0);
    await expect(page.getByTestId('partner-send-failed')).toHaveCount(0);
    expect(await readSession(page)).not.toContain('partner.example');
  });

  test('keeping an unsent result still allows sending it', async ({ page }) => {
    await seedAppSession(page, finishedLinkedMatchSession);
    await routePartner(page);
    await page.goto(linkUrl({ p1: 'Carl', p2: 'Dan' }));

    await page.getByTestId('external-conflict-keep').click();
    expect(await retryPartnerResult(page)).toMatchObject({ status: 'completed', legs1: '3', legs2: '1' });
  });

  test('a link opened over a finished local match applies directly', async ({ page }) => {
    await seedAppSession(page, { ...finishedLinkedMatchSession, externalMatch: null });
    await page.goto(linkUrl({ p1: 'Carl', p2: 'Dan' }));

    await expect(page.getByRole('dialog', { name: /Une partie est en cours|Résultat précédent/ })).toHaveCount(0);
    await expect(page.getByTestId('setup-external-match-banner')).toBeVisible();
    expect(await inputValues(page)).toEqual(expect.arrayContaining(['Carl', 'Dan']));
  });

  test('a link opened from the setup screen applies directly', async ({ page }) => {
    await seedAppSession(page, { ...baseSession, screen: 'SETUP', currentMatch: null });
    await page.goto(linkUrl({}));

    await expect(page.getByRole('dialog', { name: 'Une partie est en cours' })).toHaveCount(0);
    await expect(page.getByTestId('setup-external-match-banner')).toBeVisible();
  });
});
