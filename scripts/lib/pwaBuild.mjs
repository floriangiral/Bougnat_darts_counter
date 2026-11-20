// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (Révision V2, V2-FR-02/03, V2-AC-01/07).
//
// Pure helpers shared by scripts/generate-sw-precache.mjs and scripts/validate-pwa-build.mjs.
// The precache list is generated from the build output so it only lists files that are
// actually deployed; the build id is a content hash so every release gets a new cache name.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const BUILD_ID_PLACEHOLDER = '__BOUGNAT_BUILD_ID__';
export const PRECACHE_MARKER = '__BOUGNAT_PRECACHE_URLS__';
export const KILL_SWITCH_MARKER = 'BOUGNAT_SW_KILL_SWITCH';
export const CACHE_PREFIX = 'bougnat-darts-';

const PRECACHE_DECLARATION = /const PRECACHE_URLS = \[[^\]]*\]; \/\/ __BOUGNAT_PRECACHE_URLS__/;
const INJECTED_PRECACHE = /const PRECACHE_URLS = (\[[^\n]*\]);/;
const BUILD_ID_DECLARATION = /const BUILD_ID = '([^']*)';/;
const HTML_REFERENCE = /<(script|link)\b[^>]*>/gi;
const LOCAL_URL_ATTRIBUTE = /\s(?:src|href)="(\/[^"]*)"/i;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Shell resources used by the home screen and not referenced by index.html or the manifest.
export const EXTRA_SHELL_URLS = ['/app-qr.svg'];

/**
 * Legacy (iOS 12) chunks, source maps and Vite metadata are never precached.
 * @param {string} url
 * @returns {boolean}
 */
export function isPrecacheableAsset(url) {
  return !/-legacy[-.]/.test(url) && !url.endsWith('.map') && !url.includes('/.vite/');
}

/**
 * Maps a site URL to its file in the build output ("/" is the SPA shell index.html).
 * @param {string} distDir
 * @param {string} url
 * @returns {string}
 */
export function urlToDistPath(distDir, url) {
  const { pathname } = new URL(url, 'https://bougnat.invalid');
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const resolved = path.resolve(distDir, relative);
  const root = path.resolve(distDir);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`URL escapes the build directory: ${url}`);
  }
  return resolved;
}

/**
 * @param {string | Buffer} content
 * @returns {boolean}
 */
export function looksLikeHtml(content) {
  return /^\s*(<!doctype html|<html[\s>])/i.test(String(content));
}

/**
 * Local URLs loaded by index.html for modern browsers (nomodule legacy scripts excluded).
 * @param {string} html
 * @returns {string[]}
 */
export function extractShellUrlsFromHtml(html) {
  /** @type {string[]} */
  const urls = [];
  for (const [tag] of html.matchAll(HTML_REFERENCE)) {
    if (/\snomodule\b/i.test(tag)) continue;
    const match = LOCAL_URL_ATTRIBUTE.exec(tag);
    if (match && !match[1].startsWith('//')) {
      urls.push(match[1]);
    }
  }
  return urls;
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const listFiles = (dir, prefix) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const url = `${prefix}/${entry.name}`;
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), url) : [url];
  });
};

/**
 * Builds the sorted, de-duplicated precache list from a Vite build output.
 * @param {string} distDir
 * @returns {string[]}
 */
export function collectPrecacheUrls(distDir) {
  const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const manifest = readJson(path.join(distDir, 'manifest.json'));
  const icons = Array.isArray(manifest.icons) ? manifest.icons.map((icon) => icon.src) : [];

  const urls = new Set(['/', '/manifest.json', ...icons, ...EXTRA_SHELL_URLS]);
  for (const url of extractShellUrlsFromHtml(html)) {
    urls.add(new URL(url, 'https://bougnat.invalid').pathname);
  }
  for (const url of listFiles(path.join(distDir, 'assets'), '/assets')) {
    urls.add(url);
  }

  return [...urls].filter(isPrecacheableAsset).sort((a, b) => a.localeCompare(b));
}

/**
 * Short hash of the worker template and precached files: changes with every release, never "dev".
 * @param {string} distDir
 * @param {string[]} urls
 * @param {string} [workerSource]
 * @returns {string}
 */
export function computeBuildId(distDir, urls, workerSource = '') {
  const hash = createHash('sha256');
  hash.update(workerSource);
  for (const url of [...urls].sort((a, b) => a.localeCompare(b))) {
    hash.update(`${url}\n`);
    hash.update(fs.readFileSync(urlToDistPath(distDir, url)));
    hash.update('\n');
  }
  return hash.digest('hex').slice(0, 12);
}

/**
 * Replaces the build placeholders of public/sw.js; throws when a marker is missing.
 * @param {string} source
 * @param {{ buildId: string, urls: string[] }} build
 * @returns {string}
 */
export function injectServiceWorker(source, { buildId, urls }) {
  if (!source.includes(`'${BUILD_ID_PLACEHOLDER}'`)) {
    throw new Error(`sw.js is missing the ${BUILD_ID_PLACEHOLDER} placeholder.`);
  }
  if (!PRECACHE_DECLARATION.test(source)) {
    throw new Error(`sw.js is missing the PRECACHE_URLS declaration marked ${PRECACHE_MARKER}.`);
  }
  return source
    .replace(`'${BUILD_ID_PLACEHOLDER}'`, `'${buildId}'`)
    .replace(PRECACHE_DECLARATION, `const PRECACHE_URLS = ${JSON.stringify(urls)};`);
}

/**
 * @param {string} source
 * @returns {string[] | null}
 */
export function extractPrecacheUrls(source) {
  const match = INJECTED_PRECACHE.exec(source);
  if (!match) return null;
  try {
    const urls = JSON.parse(match[1]);
    return Array.isArray(urls) && urls.every((url) => typeof url === 'string') ? urls : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} source
 * @returns {string | null}
 */
export function extractBuildId(source) {
  return BUILD_ID_DECLARATION.exec(source)?.[1] ?? null;
}

/**
 * Reads width/height from the PNG IHDR chunk, or null when the buffer is not a PNG.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number } | null}
 */
export function readPngSize(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const validateManifest = (distDir, errors) => {
  const manifestPath = path.join(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('dist/manifest.json is missing.');
    return;
  }
  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch {
    errors.push('dist/manifest.json is not valid JSON.');
    return;
  }
  if (typeof manifest.id !== 'string' || !manifest.id) {
    errors.push('dist/manifest.json must declare a stable "id".');
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    errors.push('dist/manifest.json must declare icons.');
    return;
  }
  for (const icon of manifest.icons) {
    validateIcon(distDir, icon, errors);
  }
};

const validateIcon = (distDir, icon, errors) => {
  const src = String(icon?.src ?? '');
  if (!src.startsWith('/')) {
    errors.push(`Manifest icon "${src}" must be an absolute local path.`);
    return;
  }
  const iconPath = urlToDistPath(distDir, src);
  if (!fs.existsSync(iconPath)) {
    errors.push(`Manifest icon ${src} is missing from dist.`);
    return;
  }
  if (icon.type !== 'image/png') {
    errors.push(`Manifest icon ${src} must declare type image/png (current: ${icon.type ?? 'missing'}).`);
    return;
  }
  const size = readPngSize(fs.readFileSync(iconPath));
  if (!size) {
    errors.push(`Manifest icon ${src} is not a PNG file.`);
    return;
  }
  const declared = String(icon.sizes ?? '').split(/\s+/);
  if (!declared.includes(`${size.width}x${size.height}`)) {
    errors.push(`Manifest icon ${src} is ${size.width}x${size.height} but declares sizes "${icon.sizes ?? ''}".`);
  }
};

const validatePrecache = (distDir, source, errors) => {
  const buildId = extractBuildId(source);
  if (!buildId || buildId === 'dev') {
    errors.push(`dist/sw.js must use a release build id (current: ${buildId ?? 'missing'}).`);
  }
  const urls = extractPrecacheUrls(source);
  if (!urls || urls.length === 0) {
    errors.push('dist/sw.js does not declare a generated PRECACHE_URLS list.');
    return;
  }
  if (!urls.includes('/')) {
    errors.push('dist/sw.js must precache the application shell "/".');
  }
  for (const url of urls) {
    if (url === '/index.html') {
      errors.push('dist/sw.js must not precache /index.html (redirected by Cloudflare Pages); use "/".');
      continue;
    }
    if (!fs.existsSync(urlToDistPath(distDir, url))) {
      errors.push(`Precached URL ${url} does not exist in dist.`);
    }
  }
};

const validateServiceWorker = (distDir, errors) => {
  const swPath = path.join(distDir, 'sw.js');
  if (!fs.existsSync(swPath)) {
    errors.push('dist/sw.js is missing.');
    return;
  }
  const source = fs.readFileSync(swPath, 'utf8');
  if (looksLikeHtml(source)) {
    errors.push('dist/sw.js contains HTML instead of JavaScript.');
    return;
  }
  if (source.includes('__BOUGNAT_')) {
    errors.push('dist/sw.js still contains build placeholders: run scripts/generate-sw-precache.mjs.');
    return;
  }
  try {
    new vm.Script(source, { filename: 'dist/sw.js' });
  } catch (error) {
    errors.push(`dist/sw.js is not valid JavaScript: ${error.message}`);
    return;
  }
  if (!source.includes(KILL_SWITCH_MARKER)) {
    validatePrecache(distDir, source, errors);
  }
};

/**
 * Contract of the deployed PWA files; returns the list of violations (empty when valid).
 * @param {string} distDir
 * @returns {string[]}
 */
export function validatePwaBuild(distDir) {
  /** @type {string[]} */
  const errors = [];
  validateManifest(distDir, errors);
  validateServiceWorker(distDir, errors);
  return errors;
}

/**
 * @param {string} distDir
 * @param {string[]} urls
 * @returns {number}
 */
export function totalSize(distDir, urls) {
  return urls.reduce((sum, url) => sum + fs.statSync(urlToDistPath(distDir, url)).size, 0);
}
