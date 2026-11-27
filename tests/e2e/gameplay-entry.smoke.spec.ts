import { expect, test } from '@playwright/test';
import { openSetup, pickDefaultStarterIfNeeded, startConfiguredGame } from './helpers';

test.describe('Bougnat Darts smoke gameplay entry', () => {
  test('@critique starts a minimal X01 game and shows scoreboard plus keypad', async ({ page }) => {
    await openSetup(page, /Match X01/i);
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);

    await expect(page.getByText('501').first()).toBeVisible();
    await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
    await expect(page.getByTestId('x01-keypad-remaining')).toBeVisible();
  });

  test('starts a minimal Cricket game and shows grid plus keypad', async ({ page }) => {
    await openSetup(page, 'Cricket');
    // Spec 135: each screen mirrors the game and the step in the path read by Web Analytics.
    await expect(page).toHaveURL(/\/cricket\/preparation$/);
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);
    await expect(page).toHaveURL(/\/cricket\/partie$/);

    await expect(page.getByRole('button', { name: /^20$/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^MISS$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Annuler$/i })).toBeVisible();
  });

  test('starts a minimal Capital game and shows the current objective', async ({ page }) => {
    await openSetup(page, 'Capital');
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);

    await expect(page.getByText(/Objectif Actuel/i)).toBeVisible();
    await expect(page.getByTestId('capital-objective')).toContainText('Capital');
  });

  test('starts a minimal Triathlon game and shows the bull draw', async ({ page }) => {
    await openSetup(page, 'Triathlon');
    await startConfiguredGame(page);

    await expect(page.getByTestId('starting-player-overlay')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Qui commence \?/i })).toBeVisible();

    await pickDefaultStarterIfNeeded(page);

    await expect(page.getByText(/Objectif Actuel/i)).toBeVisible();
  });
});
