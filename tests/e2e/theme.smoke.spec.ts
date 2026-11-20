import { expect, test, type Page } from '@playwright/test';

// Specs 069 (AC-01 à AC-06) et 068 : préférence Auto / Sombre / Clair appliquée sans flash.

const THEME_KEY = 'bougnat-theme-v1';

const themeAtFirstParse = async (page: Page) => {
  // Le script inline s'exécute avant le premier rendu : on lit l'attribut dès le DOMContentLoaded,
  // avant toute hydratation React.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => document.documentElement.getAttribute('data-theme'));
};

test.describe('préférence de thème', () => {
  test('suit le thème clair du système dès le premier rendu (AC-01, AC-04)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await themeAtFirstParse(page)).toBe('light');
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#f5f3ef');
  });

  test('un choix Sombre enregistré l’emporte sur le système clair (AC-02)', async ({ page }) => {
    await page.addInitScript((key) => window.localStorage.setItem(key, JSON.stringify({ v: 1, mode: 'dark' })), THEME_KEY);
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await themeAtFirstParse(page)).toBe('dark');
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#06080d');
  });

  test('en mode Auto, un changement du système s’applique sans rechargement (AC-03)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('le sélecteur de la page Réglages applique et mémorise le choix (FR-03, Q1 révisée, spec 129)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.getByTestId('home-settings').click();
    const selector = page.getByTestId('theme-selector');
    await selector.scrollIntoViewIfNeeded();
    await selector.getByText('Clair').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate((key) => window.localStorage.getItem(key), THEME_KEY)).toBe(JSON.stringify({ v: 1, mode: 'light' }));
  });

  test('une valeur corrompue démarre en Auto sans erreur console (AC-06)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript((key) => window.localStorage.setItem(key, '{corrompu'), THEME_KEY);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors.filter((text) => /theme|thème/i.test(text))).toEqual([]);
  });

  test('le parcours de base fonctionne en clair (068 FR-04)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.getByRole('button', { name: /Lancer une partie/i }).click();
    await page.getByTestId('game-card-x01').click();
    await page.getByRole('button', { name: /Lancer La Partie/i }).click();
    const starterOverlay = page.getByTestId('starting-player-overlay');
    if (await starterOverlay.isVisible().catch(() => false)) {
      await starterOverlay.locator('[data-testid^="starter-option-"]').first().click();
    }
    await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
    const background = await page.getByTestId('game-screen').evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).toBe('rgb(245, 243, 239)');
  });
});
