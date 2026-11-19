import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { validateExternalReturnOrigins } from '../../../scripts/lib/externalReturnOrigins.mjs';

// Spec ref: spec:counter/external-match-link (partner origins validated by the tooling)
const ROOT = path.resolve(__dirname, '../../..');
const tempDirs: string[] = [];

afterEach(() => {
  tempDirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

const withWrangler = (mutate: (config: { env: Record<string, { vars: Record<string, string> }> }) => void) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'bougnat-wrangler-'));
  tempDirs.push(dir);
  const config = JSON.parse(readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8')) as {
    env: Record<string, { vars: Record<string, string> }>;
  };
  mutate(config);
  writeFileSync(path.join(dir, 'wrangler.jsonc'), JSON.stringify(config));
  return dir;
};

const runScript = (script: string, cwd: string, env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', script)], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', ...env },
  });

describe('validateExternalReturnOrigins', () => {
  it('accepts an empty value (feature off) and a list of https origins', () => {
    expect(validateExternalReturnOrigins('')).toEqual({ origins: [], errors: [] });
    expect(validateExternalReturnOrigins(undefined)).toEqual({ origins: [], errors: [] });
    expect(validateExternalReturnOrigins(' https://badarts.fr , https://club.example:8443/ ,')).toEqual({
      origins: ['https://badarts.fr', 'https://club.example:8443'],
      errors: [],
    });
  });

  it('accepts https localhost only when explicitly allowed', () => {
    expect(validateExternalReturnOrigins('https://localhost:8443', { allowLocalhost: true }).origins).toEqual(['https://localhost:8443']);
  });

  it('reports every invalid entry and keeps the valid ones', () => {
    expect(validateExternalReturnOrigins('https://a.example,http://b.example,https://c.example/x,https://d.example')).toEqual({
      origins: ['https://a.example', 'https://d.example'],
      errors: [
        '"http://b.example" must use https (http is only accepted for localhost).',
        '"https://c.example/x" must be an origin only (scheme, host and optional port): use "https://c.example".',
      ],
    });
  });

  it('accepts localhost only when explicitly allowed (local and CI builds)', () => {
    expect(validateExternalReturnOrigins('http://localhost:7020', { allowLocalhost: true }).errors).toEqual([]);
    expect(validateExternalReturnOrigins('http://localhost:7020').errors[0]).toContain('localhost');
    expect(validateExternalReturnOrigins('https://127.0.0.1').errors[0]).toContain('localhost');
  });

  it.each([
    ['not a URL', 'badarts.fr', 'is not a valid URL'],
    ['plain http', 'http://badarts.fr', 'must use https'],
    ['another scheme', 'ftp://badarts.fr', 'must use https'],
    ['credentials', 'https://user:pass@badarts.fr', 'must not contain credentials'],
    ['a path', 'https://badarts.fr/match', 'use "https://badarts.fr"'],
    ['a query', 'https://badarts.fr?x=1', 'origin only'],
    ['an uppercase host', 'https://BadArts.fr', 'use "https://badarts.fr"'],
    ['a duplicate', 'https://badarts.fr,https://badarts.fr/', 'listed twice'],
  ])('rejects %s', (_label, raw, message) => {
    const { errors } = validateExternalReturnOrigins(raw);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(message);
  });
});

describe('validate-wrangler-config.mjs', () => {
  it('passes with the committed configuration', () => {
    const result = runScript('validate-wrangler-config.mjs', ROOT);
    expect(result.status).toBe(0);
  });

  it('requires the partner origins key in every Pages environment', () => {
    const cwd = withWrangler((config) => {
      delete config.env.preview.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS;
    });
    const result = runScript('validate-wrangler-config.mjs', cwd);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('env.preview.vars is missing required keys: VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS');
  });

  it('rejects localhost in a Pages environment', () => {
    const cwd = withWrangler((config) => {
      config.env.preview.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS = 'http://localhost:7020';
    });
    const result = runScript('validate-wrangler-config.mjs', cwd);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('env.preview.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS is invalid');
  });

  it('accepts a list of partner origins', () => {
    const cwd = withWrangler((config) => {
      config.env.production.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS = 'https://badarts.fr,https://club.example';
    });
    expect(runScript('validate-wrangler-config.mjs', cwd).status).toBe(0);
  });

  it('rejects an invalid partner origin', () => {
    const cwd = withWrangler((config) => {
      config.env.production.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS = 'https://badarts.fr/match';
    });
    const result = runScript('validate-wrangler-config.mjs', cwd);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('env.production.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS is invalid');
  });
});

describe('deployment-check.mjs', () => {
  const deployEnv = {
    DEPLOY_TARGET: 'production',
    VITE_APP_ENV: 'production',
    VITE_APP_NAME: 'Bougnat Darts Counter',
    VITE_APP_URL: 'https://play.bougnatdarts.fr',
    VITE_CF_WEB_ANALYTICS_TOKEN: 'token-value',
    VITE_ENABLE_VOICE_SCORING: 'false',
  };

  it('fails on an invalid partner origin', () => {
    const result = runScript('deployment-check.mjs', ROOT, { ...deployEnv, VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'http://badarts.fr' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: "http://badarts.fr" must use https');
  });

  it('warns when the GitHub value differs from the wrangler.jsonc source of truth', () => {
    const cwd = withWrangler((config) => {
      config.env.production.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS = 'https://badarts.fr';
    });
    const result = runScript('deployment-check.mjs', cwd, deployEnv);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('differs from wrangler.jsonc (https://badarts.fr)');
    expect(result.stdout).toContain('Partner origins    : (none, external match link disabled)');
  });

  it('is silent when both values match and lists the partner origins', () => {
    const cwd = withWrangler((config) => {
      config.env.preview.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS = 'https://badarts.fr';
    });
    const result = runScript('deployment-check.mjs', cwd, {
      ...deployEnv,
      DEPLOY_TARGET: 'preprod',
      VITE_APP_ENV: 'preprod',
      VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'https://badarts.fr',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('differs from wrangler.jsonc');
    expect(result.stdout).toContain('Partner origins    : https://badarts.fr');
  });

  it('ignores the order of the origins when comparing with wrangler.jsonc', () => {
    const cwd = withWrangler((config) => {
      config.env.production.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS = 'https://b.example,https://a.example';
    });
    const result = runScript('deployment-check.mjs', cwd, {
      ...deployEnv,
      VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'https://a.example, https://b.example/',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('differs from wrangler.jsonc');
  });

  it('warns when wrangler.jsonc cannot be read', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bougnat-wrangler-'));
    tempDirs.push(dir);
    writeFileSync(path.join(dir, 'wrangler.jsonc'), '{ not json');
    const result = runScript('deployment-check.mjs', dir, deployEnv);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('is not declared in wrangler.jsonc for production');
  });

  it('rejects localhost for a deployed target', () => {
    const result = runScript('deployment-check.mjs', ROOT, { ...deployEnv, VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'http://localhost:7020' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('points to localhost');
  });

  it('warns when wrangler.jsonc does not declare the partner origins', () => {
    const cwd = withWrangler((config) => {
      delete config.env.production.vars.VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS;
    });
    const result = runScript('deployment-check.mjs', cwd, deployEnv);
    expect(result.stdout).toContain('is not declared in wrangler.jsonc for production');
  });
});

describe('validate-pages-build-env.mjs', () => {
  const pagesEnv = {
    CF_PAGES: '1',
    CF_PAGES_BRANCH: 'production',
    VITE_APP_ENV: 'production',
    VITE_APP_URL: 'https://play.bougnatdarts.fr',
    VITE_CF_WEB_ANALYTICS_TOKEN: 'token-value',
  };

  it('fails the Cloudflare Pages build on an invalid partner origin', () => {
    const result = runScript('validate-pages-build-env.mjs', ROOT, { ...pagesEnv, VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'https://badarts.fr/x' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: "https://badarts.fr/x" must be an origin only');
  });

  it('lists every invalid entry', () => {
    const result = runScript('validate-pages-build-env.mjs', ROOT, { ...pagesEnv, VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'http://a.fr,https://b.fr/x' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"http://a.fr" must use https');
    expect(result.stderr).toContain('"https://b.fr/x" must be an origin only');
  });

  it('accepts an empty value (feature off)', () => {
    const result = runScript('validate-pages-build-env.mjs', ROOT, pagesEnv);
    expect(result.status).toBe(0);
  });

  it('does not validate outside Cloudflare Pages', () => {
    const result = runScript('validate-pages-build-env.mjs', ROOT, { VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'http://a.fr' });
    expect(result.status).toBe(0);
  });

  it('accepts valid partner origins', () => {
    const result = runScript('validate-pages-build-env.mjs', ROOT, { ...pagesEnv, VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: 'https://badarts.fr' });
    expect(result.status).toBe(0);
  });
});
