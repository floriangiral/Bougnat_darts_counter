import { expect, Page } from '@playwright/test';
import { APP_SESSION_STORAGE_KEY } from '../../utils/appPersistence';

export const gotoGameSelection = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /^BOUGNAT$/ })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /Lancer une partie/i }).click();
  await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();
};

export const openSetup = async (page: Page, gameTitle: RegExp | string) => {
  await gotoGameSelection(page);
  const gameCardMap: Record<string, string> = {
    '501 Double Out': 'game-card-x01_501_bo5',
    'Match X01': 'game-card-x01',
    Cricket: 'game-card-cricket',
    Capital: 'game-card-capital',
    'Le Triathlon': 'game-card-triathlon',
  };

  const cardTestId = typeof gameTitle === 'string' ? gameCardMap[gameTitle] : null;
  if (cardTestId) {
    await page.getByTestId(cardTestId).click();
  } else {
    await page.getByRole('heading', { name: gameTitle }).click();
  }
  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
};

export const startConfiguredGame = async (page: Page) => {
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
};

export const pickDefaultStarterIfNeeded = async (page: Page) => {
  const starterOverlay = page.getByTestId('starting-player-overlay');
  const promptVisible = await starterOverlay.isVisible().catch(() => false);
  if (!promptVisible) {
    return;
  }

  const preferredStarter = page.getByTestId('starter-option-player1');
  const preferredVisible = await preferredStarter.isVisible().catch(() => false);
  if (preferredVisible) {
    await preferredStarter.click();
    return;
  }

  await starterOverlay.locator('[data-testid^="starter-option-"]').first().click();
};

export const seedAppSession = async (page: Page, session: unknown) => {
  await page.addInitScript(
    ({ storageKey, payload }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    { storageKey: APP_SESSION_STORAGE_KEY, payload: session }
  );
};
