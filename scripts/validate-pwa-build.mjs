// Spec ref: specs/031-counter-pwa-static-delivery/spec.md (V2-FR-02, V2-AC-01).
// Fails the build when the deployed manifest, service worker, icons or precached files are invalid.
import path from 'node:path';

import { validatePwaBuild } from './lib/pwaBuild.mjs';

const distDir = path.resolve(process.argv[2] ?? 'dist');
const errors = validatePwaBuild(distDir);

if (errors.length > 0) {
  console.error('PWA build validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('PWA build validation passed: manifest, icons and service worker precache are consistent.');
