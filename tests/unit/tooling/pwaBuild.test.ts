import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import {
  collectPrecacheUrls,
  computeBuildId,
  extractBuildId,
  extractPrecacheUrls,
  extractShellUrlsFromHtml,
  injectServiceWorker,
  looksLikeHtml,
  readPngSize,
  totalSize,
  urlToDistPath,
  validatePwaBuild,
} from '../../../scripts/lib/pwaBuild.mjs';

// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-FR-02, V2-AC-01, V2-AC-07)
const ROOT = path.resolve(__dirname, '../../..');
const FIXTURES_ROOT = path.join(ROOT, '.cache', 'vitest-pwa');
const tempDirs: string[] = [];

afterEach(() => {
  tempDirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

afterAll(() => {
  rmSync(FIXTURES_ROOT, { recursive: true, force: true });
});

const png = (width: number, height: number) => {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
};

const INDEX_HTML = `<!DOCTYPE html>
<html lang="fr"><head>
<script type="module" crossorigin src="/assets/polyfills-abc.js"></script>
<link rel="manifest" href="/manifest.json" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="preconnect" href="//cdn.example" />
<script type="module" crossorigin src="/assets/index-abc.js?v=1"></script>
<link rel="stylesheet" crossorigin href="/assets/index-abc.css">
</head><body>
<script nomodule crossorigin id="vite-legacy-polyfill" src="/assets/polyfills-legacy-abc.js"></script>
<script nomodule crossorigin id="vite-legacy-entry" data-src="/assets/index-legacy-abc.js">System.import()</script>
</body></html>`;

/** Minimal Vite-like build output using the committed manifest, worker template and icons. */
const createDist = () => {
  mkdirSync(FIXTURES_ROOT, { recursive: true });
  const dist = mkdtempSync(path.join(FIXTURES_ROOT, 'dist-'));
  tempDirs.push(dist);
  mkdirSync(path.join(dist, 'assets', '.vite'), { recursive: true });
  writeFileSync(path.join(dist, 'index.html'), INDEX_HTML);
  for (const file of ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png', '_headers', '_routes.json']) {
    copyFileSync(path.join(ROOT, 'public', file), path.join(dist, file));
  }
  writeFileSync(path.join(dist, 'app-qr.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  writeFileSync(path.join(dist, 'preview.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  writeFileSync(path.join(dist, 'Affiche_Bougnat_Darts_scorer.png'), png(10, 10));
  for (const asset of ['index-abc.js', 'index-abc.css', 'polyfills-abc.js', 'views-abc.js', 'index-legacy-abc.js', 'polyfills-legacy-abc.js', 'views-legacy-abc.js', 'views-abc.js.map']) {
    writeFileSync(path.join(dist, 'assets', asset), `/* ${asset} */`);
  }
  writeFileSync(path.join(dist, 'assets', '.vite', 'manifest.json'), '{}');
  return dist;
};

const EXPECTED_URLS = [
  '/',
  '/app-qr.svg',
  '/apple-touch-icon.png',
  '/assets/index-abc.css',
  '/assets/index-abc.js',
  '/assets/polyfills-abc.js',
  '/assets/views-abc.js',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/manifest.json',
];

const generate = (dist: string) => {
  const swPath = path.join(dist, 'sw.js');
  const template = readFileSync(swPath, 'utf8');
  const urls = collectPrecacheUrls(dist);
  writeFileSync(swPath, injectServiceWorker(template, { buildId: computeBuildId(dist, urls, template), urls }));
};

const setPrecache = (dist: string, urls: string[]) => {
  const swPath = path.join(dist, 'sw.js');
  const source = readFileSync(swPath, 'utf8');
  writeFileSync(swPath, source.replace(/const PRECACHE_URLS = \[[^\n]*\];/, `const PRECACHE_URLS = ${JSON.stringify(urls)};`));
};

const writeManifest = (dist: string, mutate: (manifest: Record<string, unknown> & { icons: Record<string, unknown>[] }) => void) => {
  const manifestPath = path.join(dist, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown> & { icons: Record<string, unknown>[] };
  mutate(manifest);
  writeFileSync(manifestPath, JSON.stringify(manifest));
};

const runScript = (script: string, args: string[], env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', ...env },
  });

describe('precache generation', () => {
  it('lists the modern shell, manifest, icons and lazy chunks only', () => {
    expect(collectPrecacheUrls(createDist())).toEqual(EXPECTED_URLS);
  });

  it('ignores legacy, protocol-relative and nomodule references of index.html', () => {
    expect(extractShellUrlsFromHtml(INDEX_HTML)).toEqual([
      '/assets/polyfills-abc.js',
      '/manifest.json',
      '/favicon-32.png',
      '/apple-touch-icon.png',
      '/assets/index-abc.js?v=1',
      '/assets/index-abc.css',
    ]);
  });

  it('derives a release build id from the worker and file contents, never "dev"', () => {
    const dist = createDist();
    const urls = collectPrecacheUrls(dist);
    const first = computeBuildId(dist, urls, 'worker');
    expect(first).toMatch(/^[0-9a-f]{12}$/);
    expect(computeBuildId(dist, [...urls].reverse(), 'worker')).toBe(first);
    expect(computeBuildId(dist, urls, 'worker v2')).not.toBe(first);
    writeFileSync(path.join(dist, 'assets', 'views-abc.js'), '/* new release */');
    expect(computeBuildId(dist, urls, 'worker')).not.toBe(first);
  });

  it('injects the build id and the list into the committed worker template', () => {
    const template = readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8');
    const output = injectServiceWorker(template, { buildId: 'abc123', urls: ['/', '/manifest.json'] });
    expect(output).not.toContain('__BOUGNAT_');
    expect(extractBuildId(output)).toBe('abc123');
    expect(extractPrecacheUrls(output)).toEqual(['/', '/manifest.json']);
  });

  it('refuses a template without placeholders', () => {
    expect(() => injectServiceWorker("const PRECACHE_URLS = ['/']; // __BOUGNAT_PRECACHE_URLS__", { buildId: 'x', urls: [] }))
      .toThrow('__BOUGNAT_BUILD_ID__');
    expect(() => injectServiceWorker("const BUILD_ID = '__BOUGNAT_BUILD_ID__';", { buildId: 'x', urls: [] }))
      .toThrow('PRECACHE_URLS');
  });

  it('parses only a well-formed injected list', () => {
    expect(extractPrecacheUrls('nothing')).toBeNull();
    expect(extractPrecacheUrls('const PRECACHE_URLS = [1];')).toBeNull();
    expect(extractPrecacheUrls("const PRECACHE_URLS = ['/'];")).toBeNull();
    expect(extractBuildId('nothing')).toBeNull();
  });

  it('maps URLs to build files and rejects path traversal', () => {
    expect(urlToDistPath('/dist', '/')).toBe(path.resolve('/dist/index.html'));
    expect(urlToDistPath('/dist', '/app-qr.svg?appUrl=x')).toBe(path.resolve('/dist/app-qr.svg'));
    expect(() => urlToDistPath('/dist', '/..%2fsecret')).toThrow('escapes the build directory');
  });

  it('reads PNG dimensions and detects HTML', () => {
    expect(readPngSize(png(192, 180))).toEqual({ width: 192, height: 180 });
    expect(readPngSize(Buffer.from('<!doctype html><html></html>'))).toBeNull();
    expect(looksLikeHtml('  <!DOCTYPE html><html>')).toBe(true);
    expect(looksLikeHtml('<html lang="fr">')).toBe(true);
    expect(looksLikeHtml('const a = "<html>";')).toBe(false);
  });

  it('sums the precache size', () => {
    const dist = createDist();
    expect(totalSize(dist, ['/manifest.json'])).toBe(readFileSync(path.join(dist, 'manifest.json')).length);
  });
});

describe('validatePwaBuild', () => {
  it('accepts a generated build with the committed manifest and icons', () => {
    const dist = createDist();
    generate(dist);
    expect(validatePwaBuild(dist)).toEqual([]);
  });

  it('fails when /logo.svg is reintroduced in the precache (V2-AC-01)', () => {
    const dist = createDist();
    generate(dist);
    setPrecache(dist, [...EXPECTED_URLS, '/logo.svg']);
    expect(validatePwaBuild(dist)).toEqual(['Precached URL /logo.svg does not exist in dist.']);
  });

  it('rejects /index.html, a missing shell and an empty list', () => {
    const dist = createDist();
    generate(dist);
    setPrecache(dist, ['/index.html']);
    expect(validatePwaBuild(dist)).toEqual([
      'dist/sw.js must precache the application shell "/".',
      'dist/sw.js must not precache /index.html (redirected by Cloudflare Pages); use "/".',
    ]);
    setPrecache(dist, []);
    expect(validatePwaBuild(dist)).toEqual(['dist/sw.js does not declare a generated PRECACHE_URLS list.']);
  });

  it('rejects a "dev" build id', () => {
    const dist = createDist();
    generate(dist);
    const swPath = path.join(dist, 'sw.js');
    writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/const BUILD_ID = '[^']*';/, "const BUILD_ID = 'dev';"));
    expect(validatePwaBuild(dist)).toEqual(['dist/sw.js must use a release build id (current: dev).']);
  });

  it.each([
    ['missing', (dist: string) => rmSync(path.join(dist, 'sw.js')), 'dist/sw.js is missing.'],
    ['the SPA fallback', (dist: string) => writeFileSync(path.join(dist, 'sw.js'), INDEX_HTML), 'dist/sw.js contains HTML instead of JavaScript.'],
    ['not injected', () => undefined, 'dist/sw.js still contains build placeholders'],
    ['invalid JavaScript', (dist: string) => writeFileSync(path.join(dist, 'sw.js'), 'const = ;'), 'dist/sw.js is not valid JavaScript'],
  ])('rejects a worker that is %s', (_label, mutate, message) => {
    const dist = createDist();
    mutate(dist);
    const errors = validatePwaBuild(dist);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(message);
  });

  it.each([
    ['missing', (dist: string) => rmSync(path.join(dist, 'manifest.json')), 'dist/manifest.json is missing.'],
    ['invalid JSON', (dist: string) => writeFileSync(path.join(dist, 'manifest.json'), INDEX_HTML), 'dist/manifest.json is not valid JSON.'],
    ['without id', (dist: string) => writeManifest(dist, (manifest) => { delete manifest.id; }), 'dist/manifest.json must declare a stable "id".'],
    ['without icons', (dist: string) => writeManifest(dist, (manifest) => { manifest.icons = []; }), 'dist/manifest.json must declare icons.'],
    ['with a relative icon', (dist: string) => writeManifest(dist, (manifest) => { manifest.icons[0].src = 'icon-192.png'; }), 'Manifest icon "icon-192.png" must be an absolute local path.'],
    ['with a missing icon', (dist: string) => rmSync(path.join(dist, 'icon-512.png')), 'Manifest icon /icon-512.png is missing from dist.'],
    ['with a non-PNG type', (dist: string) => writeManifest(dist, (manifest) => { manifest.icons[0].type = 'image/svg+xml'; }), 'Manifest icon /icon-192.png must declare type image/png (current: image/svg+xml).'],
    ['with an HTML icon', (dist: string) => writeFileSync(path.join(dist, 'icon-192.png'), INDEX_HTML), 'Manifest icon /icon-192.png is not a PNG file.'],
    ['with wrong icon sizes', (dist: string) => writeFileSync(path.join(dist, 'icon-192.png'), png(180, 180)), 'Manifest icon /icon-192.png is 180x180 but declares sizes "192x192".'],
  ])('rejects a manifest %s', (_label, mutate, message) => {
    const dist = createDist();
    generate(dist);
    mutate(dist);
    expect(validatePwaBuild(dist)).toContain(message);
  });

  it('accepts the kill switch worker without a precache list', () => {
    const dist = createDist();
    copyFileSync(path.join(ROOT, 'scripts', 'pwa', 'sw-kill-switch.js'), path.join(dist, 'sw.js'));
    expect(validatePwaBuild(dist)).toEqual([]);
  });
});

describe('PWA build scripts', () => {
  it('generates then validates a build output', () => {
    const dist = createDist();
    const generated = runScript('generate-sw-precache.mjs', [dist]);
    expect(generated.status).toBe(0);
    expect(generated.stdout).toMatch(/cache bougnat-darts-[0-9a-f]{12}, 12 URL\(s\), [\d.]+ KiB/);
    expect(generated.stdout).not.toContain('bougnat-darts-dev');

    const validated = runScript('validate-pwa-build.mjs', [dist]);
    expect(validated.status).toBe(0);
    expect(validated.stdout).toContain('PWA build validation passed');
  });

  it('fails the validation with an explicit message', () => {
    const dist = createDist();
    expect(runScript('generate-sw-precache.mjs', [dist]).status).toBe(0);
    setPrecache(dist, [...EXPECTED_URLS, '/logo.svg']);
    const result = runScript('validate-pwa-build.mjs', [dist]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('PWA build validation failed:');
    expect(result.stderr).toContain('- Precached URL /logo.svg does not exist in dist.');
  });

  it('fails the generation when the worker was already injected', () => {
    const dist = createDist();
    expect(runScript('generate-sw-precache.mjs', [dist]).status).toBe(0);
    const result = runScript('generate-sw-precache.mjs', [dist]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Service worker precache generation failed');
  });

  it('ships the kill switch when BOUGNAT_PWA_KILL_SWITCH=true', () => {
    const dist = createDist();
    const result = runScript('generate-sw-precache.mjs', [dist], { BOUGNAT_PWA_KILL_SWITCH: 'true' });
    expect(result.status).toBe(0);
    expect(readFileSync(path.join(dist, 'sw.js'), 'utf8')).toContain('BOUGNAT_SW_KILL_SWITCH');
    expect(runScript('validate-pwa-build.mjs', [dist]).status).toBe(0);
  });
});
