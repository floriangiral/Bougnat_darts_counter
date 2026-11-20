// Spec: spec:counter/external-match-link, Révision V2 (V2-NFR-01, V2-AC-03).
// Voice scoring during a linked match, with a simulated Deepgram transport: the token route and
// the WebSocket are mocked and Chromium provides a fake microphone. The smoke build enables voice
// (VITE_ENABLE_VOICE_SCORING=true) and allows https://partner.example (cf. .github/actions/run-local-smoke).
import { expect, test, type Page } from '@playwright/test';

const PARTNER_RETURN = 'https://partner.example/match/12?ref=abc';

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['microphone'],
});

const linkUrl = (params: Record<string, string>) =>
  `/?${new URLSearchParams({ v: '1', game: 'x01', p1: 'Alice', p2: 'Bob', return: PARTNER_RETURN, ...params }).toString()}`;

const deepgramResult = (transcript: string) => JSON.stringify({
  type: 'Results',
  is_final: true,
  speech_final: true,
  channel: { alternatives: [{ transcript, confidence: 0.98 }] },
});

/** Mocks the voice token and answers the first audio frame with the given transcript. */
const simulateDeepgram = async (page: Page, transcript: string) => {
  await page.route('**/api/deepgram/token', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'e2e-token', expiresIn: 600 }) }));
  await page.routeWebSocket(/api\.deepgram\.com/, (socket) => {
    let answered = false;
    socket.onMessage(() => {
      if (answered) return;
      answered = true;
      socket.send(deepgramResult(transcript));
    });
  });
};

test('voice scoring works during a linked match and keeps the result contract', async ({ page }) => {
  await page.route('https://partner.example/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Partner</h1>' }));
  await simulateDeepgram(page, 'soixante');
  await page.goto(linkUrl({ start: '60', legs: '1' }));

  await expect(page.getByTestId('setup-external-match-banner')).toContainText('partner.example');
  await expect(page.getByPlaceholder('Joueur 1')).toBeDisabled();
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
  const overlay = page.getByTestId('starting-player-overlay');
  if (await overlay.isVisible()) {
    await overlay.locator('[data-testid^="starter-option-"]').first().click();
  }
  await expect(overlay).toHaveCount(0);

  const voiceButton = page.getByRole('button', { name: 'Lancer l’écoute vocale' });
  await expect(voiceButton, 'the smoke build must enable voice scoring').toBeEnabled();
  await voiceButton.click();

  await expect(page.getByText('soixante').first()).toBeVisible();
  await page.getByTestId('x01-keypad-ok').click();
  await page.getByTestId('checkout-darts-3').click();
  await page.getByTestId('winner-view-stats').click();

  await page.getByTestId('stats-external-return').click();
  await page.waitForURL(/partner\.example/);
  expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
    ref: 'abc', v: '1', status: 'completed', legs1: '1', legs2: '0', winner: '1',
  });
});
