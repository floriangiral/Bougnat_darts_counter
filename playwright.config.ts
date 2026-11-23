import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  // Spec 043 FR-07: the JSON report feeds the CI flaky-test summary (scripts/ci-playwright-flaky-summary.mjs).
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list'], ['json', { outputFile: 'test-results/playwright-results.json' }]]
    : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The production build now ships a working service worker (spec 031): only pwa.smoke opts in.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      // Desktop window (fine pointer): phone and tablet contracts need touch profiles, see below.
      testIgnore: /(smartphone|tablet)-layout\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Spec 071 FR-07 / 070 AC-03: realistic touch tablets, browser bars included, no ?mode forcing.
    ...([
      ['tablet-ipad-safari-landscape', 'iPad (gen 7)', 1080, 750],
      ['tablet-ipad-pro-landscape', 'iPad Pro 11', 1366, 950],
      ['tablet-galaxy-chrome-landscape', 'Galaxy Tab S4', 1280, 696],
      ['tablet-galaxy-fullscreen-landscape', 'Galaxy Tab S4', 1280, 800],
      ['tablet-small-landscape', 'Galaxy Tab S4', 960, 520],
      ['tablet-7in-landscape', 'Galaxy Tab S4', 1024, 600],
      ['tablet-ipad-portrait', 'iPad (gen 7)', 810, 1010],
    ] as const).map(([name, device, width, height]) => ({
      name,
      testMatch: /tablet-layout\.smoke\.spec\.ts/,
      use: { ...devices[device], viewport: { width, height } },
    })),
    {
      name: 'smartphone-small',
      testMatch: /smartphone-layout\.smoke\.spec\.ts/,
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'smartphone-standard',
      testMatch: /smartphone-layout\.smoke\.spec\.ts/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'smartphone-landscape',
      testMatch: /smartphone-layout\.smoke\.spec\.ts/,
      use: { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } },
    },
    {
      name: 'smartphone-large-landscape',
      testMatch: /smartphone-layout\.smoke\.spec\.ts/,
      use: { ...devices['Pixel 7'], viewport: { width: 932, height: 430 } },
    },
  ],
});
