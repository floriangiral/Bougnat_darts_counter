import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const localEnvPath = path.join(rootDir, '.env.local');
const exampleEnvPath = path.join(rootDir, '.env.local.example');

if (fs.existsSync(localEnvPath)) {
  process.exit(0);
}

if (!fs.existsSync(exampleEnvPath)) {
  console.warn('[ensure-local-env] .env.local is missing and no .env.local.example was found.');
  process.exit(0);
}

fs.copyFileSync(exampleEnvPath, localEnvPath);
console.warn('[ensure-local-env] .env.local was missing and has been restored from .env.local.example.');
