import { expect, test } from '@playwright/test';
import { seedAppSession } from './helpers';
import { buildCapitalStatsSession, buildCricketStatsSession, buildTriathlonStatsSession } from './session-fixtures';

test.describe('Bougnat Darts smoke completion', () => {
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
