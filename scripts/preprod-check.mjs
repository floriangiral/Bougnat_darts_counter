import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const envFile = path.join(cwd, '.env.preprod');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    values[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }

  return values;
}

function readValue(key, fileEnv) {
  return process.env[key] || fileEnv[key] || '';
}

function looksLikePlaceholder(value) {
  if (!value) return true;
  return /(replace-with|your-|example|paste-|changeme)/i.test(value);
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

const fileEnv = parseEnvFile(envFile);

const values = {
  VITE_APP_ENV: readValue('VITE_APP_ENV', fileEnv),
  VITE_APP_NAME: readValue('VITE_APP_NAME', fileEnv),
  VITE_APP_VERSION: readValue('VITE_APP_VERSION', fileEnv),
  VITE_APP_URL: readValue('VITE_APP_URL', fileEnv),
  VITE_SUPABASE_URL: readValue('VITE_SUPABASE_URL', fileEnv),
  VITE_SUPABASE_ANON_KEY: readValue('VITE_SUPABASE_ANON_KEY', fileEnv),
  VITE_ENABLE_BETA_BADGE: readValue('VITE_ENABLE_BETA_BADGE', fileEnv),
  SUPABASE_PROJECT_ID: readValue('SUPABASE_PROJECT_ID', fileEnv),
};

const errors = [];
const warnings = [];

if (values.VITE_APP_ENV !== 'preprod') {
  errors.push(`VITE_APP_ENV must be "preprod" (current: "${values.VITE_APP_ENV || 'missing'}").`);
}

if (!isHttpsUrl(values.VITE_APP_URL)) {
  errors.push('VITE_APP_URL must be a valid https URL for the deployed preprod app.');
} else if (/localhost|127\.0\.0\.1/.test(values.VITE_APP_URL)) {
  errors.push('VITE_APP_URL cannot point to localhost for preprod.');
}

if (!isHttpsUrl(values.VITE_SUPABASE_URL)) {
  errors.push('VITE_SUPABASE_URL must be a valid https Supabase URL.');
} else if (!/\.supabase\.co$/i.test(new URL(values.VITE_SUPABASE_URL).hostname)) {
  warnings.push('VITE_SUPABASE_URL does not end with .supabase.co. Verify this is the hosted preprod Supabase project.');
}

if (looksLikePlaceholder(values.VITE_SUPABASE_ANON_KEY)) {
  errors.push('VITE_SUPABASE_ANON_KEY is missing or still contains a placeholder value.');
}

if (!values.VITE_APP_NAME) {
  warnings.push('VITE_APP_NAME is empty. The app will still work, but naming will be less explicit in preprod.');
}

if (values.VITE_ENABLE_BETA_BADGE !== 'true') {
  warnings.push('VITE_ENABLE_BETA_BADGE is not set to true. Keeping the badge enabled in preprod is usually safer.');
}

const callbackUrl = values.VITE_APP_URL ? `${values.VITE_APP_URL.replace(/\/$/, '')}/auth/callback` : '';

console.log('');
console.log('Preprod configuration summary');
console.log('----------------------------');
console.log(`App name           : ${values.VITE_APP_NAME || '(missing)'}`);
console.log(`App environment    : ${values.VITE_APP_ENV || '(missing)'}`);
console.log(`App URL            : ${values.VITE_APP_URL || '(missing)'}`);
console.log(`App version        : ${values.VITE_APP_VERSION || '(missing / optional)'}`);
console.log(`Supabase URL       : ${values.VITE_SUPABASE_URL || '(missing)'}`);
console.log(`Supabase project   : ${values.SUPABASE_PROJECT_ID || '(optional / not set)'}`);
console.log(`Beta badge         : ${values.VITE_ENABLE_BETA_BADGE || '(missing)'}`);
console.log('');
console.log('Set these in Supabase Auth (preprod project)');
console.log('--------------------------------------------');
console.log(`Site URL           : ${values.VITE_APP_URL || '(missing)'}`);
console.log(`Redirect URL       : ${callbackUrl || '(missing)'}`);
console.log('');
console.log('Set these in Vercel (preprod project)');
console.log('-------------------------------------');
console.log('Production branch  : preprod');
console.log('Environment vars   : VITE_APP_ENV, VITE_APP_NAME, VITE_APP_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
console.log('');

if (warnings.length > 0) {
  console.log('Warnings');
  console.log('--------');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.error('Errors');
  console.error('------');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('');
  process.exit(1);
}

console.log('Preprod configuration looks coherent.');
