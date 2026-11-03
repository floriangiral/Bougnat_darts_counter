import { readFileSync } from 'node:fs';

import { defineConfig } from 'vitest/config';

const sonarProperties = readFileSync(new URL('./sonar-project.properties', import.meta.url), 'utf8');
const coverageExclusions = sonarProperties
  .split(/\r?\n/)
  .find((line) => line.startsWith('sonar.coverage.exclusions='));
if (!coverageExclusions) {
  throw new Error('Missing sonar.coverage.exclusions in sonar-project.properties');
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['App.tsx', '{components,functions,lib,src,utils,views}/**/*.{ts,tsx}'],
      exclude: coverageExclusions.split('=')[1].split(',').map((pattern) => pattern.trim()),
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
