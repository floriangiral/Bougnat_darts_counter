import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join(process.cwd(), 'wrangler.jsonc');
const raw = fs.readFileSync(configPath, 'utf8');

// The project intentionally keeps wrangler.jsonc comment-free so JSON.parse is enough here.
const config = JSON.parse(raw);

if (config.pages_build_output_dir !== './dist') {
  throw new Error(`wrangler.jsonc must keep pages_build_output_dir="./dist" (current: ${config.pages_build_output_dir ?? 'missing'})`);
}

if (!config.observability?.enabled) {
  throw new Error('wrangler.jsonc must enable observability.');
}

if (!config.observability?.logs?.enabled || !config.observability?.logs?.persist) {
  throw new Error('wrangler.jsonc must enable persistent logs.');
}

if (!config.observability?.traces?.enabled || !config.observability?.traces?.persist) {
  throw new Error('wrangler.jsonc must enable persistent traces.');
}

console.log('Wrangler config validation passed');
