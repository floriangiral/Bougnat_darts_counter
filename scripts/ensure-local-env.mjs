import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const localEnvPath = path.join(rootDir, '.env.local');
const exampleEnvPath = path.join(rootDir, '.env.local.example');
const isCloudflarePages = process.env.CF_PAGES === '1';
const isCi = process.env.CI === 'true';

if (fs.existsSync(localEnvPath)) {
  process.exit(0);
}

if (isCloudflarePages || isCi) {
  console.warn('[ensure-local-env] Skipping .env.local restore in CI/Pages. Deployment variables must come from the platform environment.');
  process.exit(0);
}

if (!fs.existsSync(exampleEnvPath)) {
  console.warn('[ensure-local-env] .env.local is missing and no .env.local.example was found.');
  process.exit(0);
}

fs.copyFileSync(exampleEnvPath, localEnvPath);
console.warn('[ensure-local-env] .env.local was missing and has been restored from .env.local.example.');
