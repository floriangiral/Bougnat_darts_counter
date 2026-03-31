import { expect, test } from '@playwright/test';
import { openSetup, pickDefaultStarterIfNeeded, startConfiguredGame } from './helpers';

test.describe('Bougnat Darts smoke gameplay entry', () => {
  test('starts a minimal X01 game and shows scoreboard plus keypad', async ({ page }) => {
    await openSetup(page, /Match X01/i);
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);

    await expect(page.getByText('501').first()).toBeVisible();
    await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();
    await expect(page.getByTestId('x01-keypad-remaining')).toBeVisible();
  });

  test('starts a minimal Cricket game and shows grid plus keypad', async ({ page }) => {
    await openSetup(page, 'Cricket');
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);

    await expect(page.getByRole('button', { name: /^20$/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^MISS$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^C$/i })).toBeVisible();
  });

  test('starts a minimal Capital game and shows the current objective', async ({ page }) => {
    await openSetup(page, 'Capital');
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);

    await expect(page.getByText(/Objectif Actuel/i)).toBeVisible();
    await expect(page.getByText(/Capital|Le 20|La Suite|3 a cotes|Bulle ou D-Bull|Moins de 21/i)).toBeVisible();
  });

  test('starts a minimal Triathlon game and shows the bull draw', async ({ page }) => {
    await openSetup(page, 'Le Triathlon');
    await startConfiguredGame(page);

    await expect(page.getByRole('heading', { name: /Tir a la bulle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /D-Bull/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Bull$/i }).first()).toBeVisible();
  });
});
