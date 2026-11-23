// Spec 080 (V2-VOICE-09) AC-01 / AC-02 : la fiche « Voix et confidentialité » s'affiche au premier appui
// micro, et un refus ne déclenche aucun appel à la route du jeton ni ouverture du micro. Transport Deepgram
// simulé (aucune clé) ; le build de smoke active la voix (VITE_ENABLE_VOICE_SCORING=true).
import { expect, test, type Page } from '@playwright/test';
import { openSetup, pickDefaultStarterIfNeeded } from './helpers';

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['microphone'],
});

const startX01 = async (page: Page) => {
  await openSetup(page, 'Match X01');
  await page.getByPlaceholder('Joueur 1', { exact: true }).fill('Alice');
  await page.getByPlaceholder('Joueur 2', { exact: true }).fill('Bruno');
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
  await pickDefaultStarterIfNeeded(page);
};

/** Compte les appels à la route du jeton et les connexions au fournisseur, sans jamais les servir. */
const watchVoiceTraffic = async (page: Page) => {
  const traffic = { token: 0, socket: 0 };
  await page.route('**/api/deepgram/token', (route) => {
    traffic.token += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'e2e-token', expiresIn: 600 }) });
  });
  await page.routeWebSocket(/^wss:\/\/api\.deepgram\.com(?:[/?#].*)?$/, () => {
    traffic.socket += 1;
  });
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    (window as unknown as { __microphoneRequests: number }).__microphoneRequests = 0;
    navigator.mediaDevices.getUserMedia = (constraints) => {
      (window as unknown as { __microphoneRequests: number }).__microphoneRequests += 1;
      return original(constraints);
    };
  });
  return traffic;
};

test('refusing the voice notice keeps manual scoring and never asks for a voice token', async ({ page }) => {
  const traffic = await watchVoiceTraffic(page);
  await startX01(page);

  await page.getByRole('button', { name: 'Réglages' }).click();
  await page.getByText('Assistance vocale IA').locator('..').locator('..').locator('[aria-pressed]').click();
  await page.getByRole('button', { name: /Fermer/ }).click();

  const voiceButton = page.getByRole('button', { name: 'Lancer l’écoute vocale' });
  await expect(voiceButton, 'the smoke build must enable voice scoring').toBeEnabled();
  await voiceButton.click();

  const notice = page.getByRole('dialog', { name: 'Voix et confidentialité' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('Ta voix est envoyée à Deepgram');
  await notice.getByRole('button', { name: 'Saisie manuelle' }).click();

  await expect(notice).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Trop de score' })).toBeDisabled();
  await page.getByTestId('x01-keypad-6').click();
  await page.getByTestId('x01-keypad-0').click();
  await page.getByTestId('x01-keypad-ok').click();
  await expect(page.getByText('441').first()).toBeVisible();

  expect(traffic.token).toBe(0);
  expect(traffic.socket).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __microphoneRequests: number }).__microphoneRequests)).toBe(0);
});
