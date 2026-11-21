import { afterEach, describe, expect, it, vi } from 'vitest';

import { isExplicitLocalAppEnv } from '../../../src/lib/env';

// Spec ref: spec:counter/external-match-link (local-only relaxations need an explicit env)
describe('isExplicitLocalAppEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is true only for an explicit VITE_APP_ENV=local', () => {
    vi.stubEnv('VITE_APP_ENV', 'local');
    expect(isExplicitLocalAppEnv()).toBe(true);
  });

  it.each(['', 'ci', 'preprod', 'production', 'LOCAL', ' local'])('is false for "%s"', (value) => {
    vi.stubEnv('VITE_APP_ENV', value);
    expect(isExplicitLocalAppEnv()).toBe(false);
  });

  it('does not use the "local" fallback of env.VITE_APP_ENV when the variable is missing', () => {
    vi.stubEnv('VITE_APP_ENV', undefined);
    expect(isExplicitLocalAppEnv()).toBe(false);
  });
});
