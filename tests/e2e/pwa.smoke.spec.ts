import { expect, test, type Page } from '@playwright/test';
import { openSetup, pickDefaultStarterIfNeeded, startConfiguredGame } from './helpers';

// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-AC-01, V2-AC-03, V2-AC-05, V2-AC-07)
test.use({ serviceWorkers: 'allow' });

const SW_RELATED = /service ?worker|sw\.js|manifest|MIME/i;

const enterScore = async (page: Page, digits: string) => {
  for (const digit of digits) {
    await page.getByTestId(`x01-keypad-${digit}`).click();
  }
  await page.getByTestId('x01-keypad-ok').click();
};

test.describe('PWA static delivery', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Service worker and offline emulation are validated on Chromium.');

  test('serves the manifest and the service worker as static files', async ({ request }) => {
    const manifest = await request.get('/manifest.json');
    expect(manifest.ok()).toBe(true);
    expect(manifest.headers()['content-type']).toMatch(/json/);
    const manifestBody = (await manifest.json()) as { id?: string; lang?: string };
    expect(manifestBody.id).toBe('/');
    expect(manifestBody.lang).toBe('fr');

    const worker = await request.get('/sw.js');
    expect(worker.ok()).toBe(true);
    expect(worker.headers()['content-type']).toMatch(/javascript/);
    const workerBody = await worker.text();
    expect(workerBody).not.toMatch(/<html/i);
    expect(workerBody).toMatch(/const BUILD_ID = '[0-9a-f]{12}';/);
  });

  test('registers the worker, precaches the shell and plays X01 offline', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    const appCaches = await page.evaluate(async () => (await caches.keys()).filter((name) => name.startsWith('bougnat-darts-')));
    expect(appCaches).toHaveLength(1);
    expect(appCaches[0]).toMatch(/^bougnat-darts-[0-9a-f]{12}$/);
    expect(appCaches[0]).not.toBe('bougnat-darts-dev');
    expect(errors.filter((error) => SW_RELATED.test(error))).toEqual([]);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: /Lancer une partie/i })).toBeVisible();
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);

    await openSetup(page, /Match X01/i);
    await startConfiguredGame(page);
    await pickDefaultStarterIfNeeded(page);
    await expect(page.getByTestId('x01-keypad-ok')).toBeVisible();

    await enterScore(page, '60');
    await enterScore(page, '45');
    await enterScore(page, '100');
    await expect(page.getByText('341').first()).toBeVisible();
    await expect(page.getByText('456').first()).toBeVisible();

    await context.setOffline(false);
  });
});
