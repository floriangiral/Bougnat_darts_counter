import { expect, test } from '@playwright/test';

import { openSetup, pickDefaultStarterIfNeeded, startConfiguredGame } from './helpers';

// Spec ref: specs/054-counter-impossible-totals-validation (AC-01, décision Q1 b).
test('Gotcha — un total impossible bloque « Valider » jusqu’à sa correction', async ({ page }) => {
  await openSetup(page, 'Gotcha');
  await startConfiguredGame(page);
  await pickDefaultStarterIfNeeded(page);

  const submit = page.getByRole('button', { name: 'Valider' });
  for (const digit of ['1', '7', '9']) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await expect(page.getByText('Score impossible : ce total ne se fait pas en 3 fléchettes.')).toBeVisible();
  await expect(submit).toBeDisabled();

  await page.getByRole('button', { name: 'C', exact: true }).click();
  for (const digit of ['1', '8', '0']) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText('Tour 2')).toBeVisible();
});
