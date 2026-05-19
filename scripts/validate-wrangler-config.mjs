import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join(process.cwd(), 'wrangler.jsonc');
const raw = fs.readFileSync(configPath, 'utf8');

// The project intentionally keeps wrangler.jsonc comment-free so JSON.parse is enough here.
const config = JSON.parse(raw);
const requiredPagesVars = [
  'DEEPGRAM_PROJECT_ID',
  'VITE_APP_ACCESS_MODE',
  'VITE_APP_ENV',
  'VITE_APP_NAME',
  'VITE_APP_URL',
  'VITE_CF_WEB_ANALYTICS_TOKEN',
  'VITE_ENABLE_VOICE_SCORING',
  'VITE_LOG_LEVEL',
];

if (config.pages_build_output_dir !== './dist') {
  throw new Error(`wrangler.jsonc must keep pages_build_output_dir="./dist" (current: ${config.pages_build_output_dir ?? 'missing'})`);
}

if (config.observability !== undefined) {
  throw new Error('wrangler.jsonc must not declare observability for a Cloudflare Pages project.');
}

if (config.vars !== undefined) {
  throw new Error('wrangler.jsonc must not rely on top-level vars for Pages environments because Wrangler does not inherit them into env.production/env.preview.');
}

for (const environmentName of ['production', 'preview']) {
  const vars = config.env?.[environmentName]?.vars;
  if (!vars) {
    throw new Error(`wrangler.jsonc must define env.${environmentName}.vars for the Cloudflare Pages project.`);
  }

  const missingVars = requiredPagesVars.filter((key) => !(key in vars));
  if (missingVars.length > 0) {
    throw new Error(`wrangler.jsonc env.${environmentName}.vars is missing required keys: ${missingVars.join(', ')}`);
  }
}

console.log('Wrangler config validation passed');
