// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-FR-02, V2-FR-03).
// Injects the build id and the generated precache list into dist/sw.js after `vite build`.
// BOUGNAT_PWA_KILL_SWITCH=true ships the rollback worker (scripts/pwa/sw-kill-switch.js) instead.
import fs from 'node:fs';
import path from 'node:path';

import { collectPrecacheUrls, computeBuildId, injectServiceWorker, totalSize } from './lib/pwaBuild.mjs';

const distDir = path.resolve(process.argv[2] ?? 'dist');
const swPath = path.join(distDir, 'sw.js');

try {
  if (process.env.BOUGNAT_PWA_KILL_SWITCH === 'true') {
    const killSwitchPath = path.join(import.meta.dirname, 'pwa', 'sw-kill-switch.js');
    fs.copyFileSync(killSwitchPath, swPath);
    console.warn('PWA kill switch enabled: dist/sw.js purges Bougnat Darts caches and unregisters itself.');
  } else {
    const template = fs.readFileSync(swPath, 'utf8');
    const urls = collectPrecacheUrls(distDir);
    const buildId = computeBuildId(distDir, urls, template);
    fs.writeFileSync(swPath, injectServiceWorker(template, { buildId, urls }));
    const kib = (totalSize(distDir, urls) / 1024).toFixed(1);
    console.log(`Service worker precache generated: cache bougnat-darts-${buildId}, ${urls.length} URL(s), ${kib} KiB.`);
  }
} catch (error) {
  console.error(`Service worker precache generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
