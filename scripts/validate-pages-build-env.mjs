function readValue(key) {
  return (process.env[key] || '').trim();
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

const isCloudflarePages = process.env.CF_PAGES === '1';

if (!isCloudflarePages) {
  process.exit(0);
}

const branch = readValue('CF_PAGES_BRANCH').toLowerCase();
const appEnv = readValue('VITE_APP_ENV').toLowerCase();
const appUrl = readValue('VITE_APP_URL');
const localLikeEnvs = new Set(['', 'local', 'dev', 'development', 'ci', 'test']);
const errors = [];

if (localLikeEnvs.has(appEnv)) {
  errors.push(`VITE_APP_ENV must be set for Cloudflare Pages and cannot be local/dev-like (current: ${appEnv || 'missing'}).`);
}

if (!appUrl) {
  errors.push('VITE_APP_URL must be set for Cloudflare Pages builds.');
} else if (!isHttpsUrl(appUrl)) {
  errors.push(`VITE_APP_URL must be an https URL on Cloudflare Pages (current: ${appUrl}).`);
} else if (/localhost|127\.0\.0\.1/.test(appUrl)) {
  errors.push(`VITE_APP_URL cannot point to localhost on Cloudflare Pages (current: ${appUrl}).`);
}

if (branch === 'production' && appEnv !== 'production') {
  errors.push(`CF_PAGES_BRANCH=production requires VITE_APP_ENV=production (current: ${appEnv || 'missing'}).`);
}

if (branch === 'preprod' && appEnv !== 'preprod') {
  errors.push(`CF_PAGES_BRANCH=preprod requires VITE_APP_ENV=preprod (current: ${appEnv || 'missing'}).`);
}

if (errors.length > 0) {
  console.error('[validate-pages-build-env] Cloudflare Pages build configuration is invalid.');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('- Declare public VITE_* variables in wrangler.jsonc when the project is Wrangler-managed.');
  console.error('- Keep server-only secrets in Cloudflare Pages / Workers secrets.');
  process.exit(1);
}

console.log(`[validate-pages-build-env] Cloudflare Pages variables look coherent for branch ${branch || '(unknown)'}.`);