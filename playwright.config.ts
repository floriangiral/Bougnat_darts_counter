import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tablet-portrait',
      testMatch: /tablet-layout\.smoke\.spec\.ts/,
      use: { ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'tablet-landscape',
      testMatch: /tablet-layout\.smoke\.spec\.ts/,
      use: { ...devices['iPad (gen 7)'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'tablet-compact-landscape',
      testMatch: /tablet-layout\.smoke\.spec\.ts/,
      use: { ...devices['iPad (gen 7)'], viewport: { width: 1024, height: 600 } },
    },
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
  ],
});
