import { expect, Page } from '@playwright/test';
import { APP_SESSION_STORAGE_KEY } from '../../utils/appPersistence';

export const gotoGameSelection = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  await page.getByRole('button', { name: /Lancer une partie/i }).click();
  await expect(page.getByRole('heading', { name: /501 Double Out/i })).toBeVisible();
};

export const openSetup = async (page: Page, gameTitle: RegExp | string) => {
  await gotoGameSelection(page);
  await page.getByRole('heading', { name: gameTitle }).click();
  await expect(page.getByRole('button', { name: /Lancer La Partie/i })).toBeVisible();
};

export const startConfiguredGame = async (page: Page) => {
  await page.getByRole('button', { name: /Lancer La Partie/i }).click();
};

export const pickDefaultStarterIfNeeded = async (page: Page) => {
  const starterPrompt = page.getByRole('heading', { name: /Qui commence \?/i });
  const promptVisible = await starterPrompt.isVisible().catch(() => false);
  if (!promptVisible) {
    return;
  }

  await page.getByRole('button', { name: /Joueur 1/i }).first().click();
};

export const seedAppSession = async (page: Page, session: unknown) => {
  await page.addInitScript(
    ({ storageKey, payload }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    { storageKey: APP_SESSION_STORAGE_KEY, payload: session }
  );
};
