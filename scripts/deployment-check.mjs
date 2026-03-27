const deployTarget = process.env.DEPLOY_TARGET || 'preprod';

function readValue(key) {
  return process.env[key] || '';
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

const values = {
  VITE_APP_ENV: readValue('VITE_APP_ENV'),
  VITE_APP_NAME: readValue('VITE_APP_NAME'),
  VITE_APP_VERSION: readValue('VITE_APP_VERSION'),
  VITE_APP_URL: readValue('VITE_APP_URL'),
  VITE_SUPABASE_URL: readValue('VITE_SUPABASE_URL'),
  VITE_SUPABASE_ANON_KEY: readValue('VITE_SUPABASE_ANON_KEY'),
  VITE_ENABLE_BETA_BADGE: readValue('VITE_ENABLE_BETA_BADGE'),
  SUPABASE_PROJECT_ID: readValue('SUPABASE_PROJECT_ID'),
};

const errors = [];
const warnings = [];
const expectedAppEnv = deployTarget === 'production' ? 'production' : 'preprod';
const targetLabel = deployTarget === 'production' ? 'production' : 'preprod';
const expectedBadgeValue = deployTarget === 'production' ? 'false' : 'true';

if (values.VITE_APP_ENV !== expectedAppEnv) {
  errors.push(`VITE_APP_ENV must be "${expectedAppEnv}" (current: "${values.VITE_APP_ENV || 'missing'}").`);
}

if (!isHttpsUrl(values.VITE_APP_URL)) {
  errors.push(`VITE_APP_URL must be a valid https URL for the deployed ${targetLabel} app.`);
} else if (/localhost|127\.0\.0\.1/.test(values.VITE_APP_URL)) {
  errors.push(`VITE_APP_URL cannot point to localhost for ${targetLabel}.`);
}

if (!isHttpsUrl(values.VITE_SUPABASE_URL)) {
  errors.push('VITE_SUPABASE_URL must be a valid https Supabase URL.');
} else if (!/\.supabase\.co$/i.test(new URL(values.VITE_SUPABASE_URL).hostname)) {
  warnings.push(`VITE_SUPABASE_URL does not end with .supabase.co. Verify this is the hosted ${targetLabel} Supabase project.`);
}

if (looksLikePlaceholder(values.VITE_SUPABASE_ANON_KEY)) {
  errors.push('VITE_SUPABASE_ANON_KEY is missing or still contains a placeholder value.');
}

if (!values.VITE_APP_NAME) {
  warnings.push(`VITE_APP_NAME is empty. The app will still work, but naming will be less explicit in ${targetLabel}.`);
}

if (values.VITE_ENABLE_BETA_BADGE !== expectedBadgeValue) {
  warnings.push(`VITE_ENABLE_BETA_BADGE is not set to ${expectedBadgeValue}. Verify this matches the ${targetLabel} display policy.`);
}

const callbackUrl = values.VITE_APP_URL ? `${values.VITE_APP_URL.replace(/\/$/, '')}/auth/callback` : '';

console.log('');
console.log(`${targetLabel[0].toUpperCase()}${targetLabel.slice(1)} configuration summary`);
console.log('--------------------------------');
console.log(`App name           : ${values.VITE_APP_NAME || '(missing)'}`);
console.log(`App environment    : ${values.VITE_APP_ENV || '(missing)'}`);
console.log(`App URL            : ${values.VITE_APP_URL || '(missing)'}`);
console.log(`App version        : ${values.VITE_APP_VERSION || '(missing / optional)'}`);
console.log(`Supabase URL       : ${values.VITE_SUPABASE_URL || '(missing)'}`);
console.log(`Supabase project   : ${values.SUPABASE_PROJECT_ID || '(optional / not set)'}`);
console.log(`Beta badge         : ${values.VITE_ENABLE_BETA_BADGE || '(missing)'}`);
console.log('');
console.log(`Set these in Supabase Auth (${targetLabel} project)`);
console.log('--------------------------------------------');
console.log(`Site URL           : ${values.VITE_APP_URL || '(missing)'}`);
console.log(`Redirect URL       : ${callbackUrl || '(missing)'}`);
console.log('');
console.log(`Set these in Vercel (${targetLabel} project)`);
console.log('-------------------------------------');
console.log(`Environment target : ${targetLabel}`);
console.log('Environment vars   : VITE_APP_ENV, VITE_APP_NAME, VITE_APP_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
console.log('Source of truth    : GitHub Environment variables and secrets, not committed env files');
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

console.log(`${targetLabel[0].toUpperCase()}${targetLabel.slice(1)} configuration looks coherent.`);
