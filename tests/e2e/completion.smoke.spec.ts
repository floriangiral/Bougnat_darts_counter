import { expect, test } from '@playwright/test';
import { openSetup, pickDefaultStarterIfNeeded, seedAppSession, startConfiguredGame } from './helpers';
import { buildCapitalStatsSession, buildCricketStatsSession, buildTriathlonStatsSession } from './session-fixtures';

test.describe('Bougnat Darts smoke completion', () => {
  test('finishes a very short X01 game and reaches match stats', async ({ page }) => {
    await openSetup(page, 'Match X01');
    await page.locator('section').filter({ hasText: /Score De Depart/i }).getByRole('button', { name: /^Perso$/i }).click();
    const customScoreInput = page.getByTestId('custom-score-input');
    await customScoreInput.fill('2');
    await page.getByTestId('custom-score-confirm').click();
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);

    await page.getByTestId('x01-keypad-2').click();
    await page.getByTestId('x01-keypad-ok').click();
    const checkoutModal = page.getByTestId('checkout-confirm-modal');
    await expect(checkoutModal.getByRole('heading', { name: /Game Shot/i })).toBeVisible();
    await page.getByTestId('checkout-darts-1').click();

    const winnerCta = page.getByTestId('winner-view-stats');
    await expect(winnerCta).toBeVisible({ timeout: 10000 });
    await winnerCta.click();

    const statsHome = page.getByTestId('stats-home');
    await expect(statsHome).toBeVisible();
    await statsHome.click();

    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
  });

  test('restores Cricket final stats from a seeded session', async ({ page }) => {
    await seedAppSession(page, buildCricketStatsSession());
    await page.goto('/');

    await expect(page.getByText(/CRICKET MASTER/i)).toBeVisible();
    await expect(page.getByText(/Vainqueur:/i)).toBeVisible();
    await expect(page.getByTestId('cricket-stats-rematch')).toBeVisible();
  });

  test('restores Capital final stats from a seeded session', async ({ page }) => {
    await seedAppSession(page, buildCapitalStatsSession());
    await page.goto('/');

    await expect(page.getByText(/Statistiques Capital/i).first()).toBeVisible();
    await expect(page.getByText(/Challenges réussis/i)).toBeVisible();
    await expect(page.getByTestId('capital-stats-rematch')).toBeVisible();
  });

  test('restores Triathlon final stats from a seeded session', async ({ page }) => {
    await seedAppSession(page, buildTriathlonStatsSession());
    await page.goto('/');

    await expect(page.getByText(/Triathlon Termine/i)).toBeVisible();
    await expect(page.getByText(/Score final sur 100/i)).toBeVisible();
    await expect(page.getByTestId('triathlon-stats-rematch')).toBeVisible();
  });
});
