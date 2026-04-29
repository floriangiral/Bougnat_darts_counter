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
  VITE_ENABLE_VOICE_SCORING: readValue('VITE_ENABLE_VOICE_SCORING'),
  DEEPGRAM_PROJECT_ID: readValue('DEEPGRAM_PROJECT_ID'),
  DEEPGRAM_API_KEY: readValue('DEEPGRAM_API_KEY'),
};

const errors = [];
const warnings = [];
const allowedPublicSecretLikeKeys = new Set([
  'VITE_ENABLE_VOICE_SCORING',
]);
const publicSecretLikePattern = /(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|ACCESS_KEY|AUTH|JWT)/i;
const expectedAppEnv = deployTarget === 'production' ? 'production' : 'preprod';
const targetLabel = deployTarget === 'production' ? 'production' : 'preprod';

for (const key of Object.keys(process.env).filter((name) => name.startsWith('VITE_')).sort()) {
  if (allowedPublicSecretLikeKeys.has(key)) {
    continue;
  }

  if (publicSecretLikePattern.test(key)) {
    errors.push(`${key} looks sensitive but is public because it starts with VITE_. Move secrets to server-only variables.`);
  }
}

if (values.VITE_APP_ENV !== expectedAppEnv) {
  errors.push(`VITE_APP_ENV must be "${expectedAppEnv}" (current: "${values.VITE_APP_ENV || 'missing'}").`);
}

if (!isHttpsUrl(values.VITE_APP_URL)) {
  errors.push(`VITE_APP_URL must be a valid https URL for the deployed ${targetLabel} app.`);
} else if (/localhost|127\.0\.0\.1/.test(values.VITE_APP_URL)) {
  errors.push(`VITE_APP_URL cannot point to localhost for ${targetLabel}.`);
}

if (!values.VITE_APP_NAME) {
  warnings.push(`VITE_APP_NAME is empty. The app will still work, but naming will be less explicit in ${targetLabel}.`);
}

if (values.VITE_ENABLE_VOICE_SCORING && !['true', 'false'].includes(values.VITE_ENABLE_VOICE_SCORING)) {
  warnings.push('VITE_ENABLE_VOICE_SCORING should be set explicitly to true or false.');
}

if (values.VITE_ENABLE_VOICE_SCORING === 'true') {
  if (!values.DEEPGRAM_API_KEY || looksLikePlaceholder(values.DEEPGRAM_API_KEY)) {
    errors.push('DEEPGRAM_API_KEY is required when VITE_ENABLE_VOICE_SCORING=true.');
  }

  if (!values.DEEPGRAM_PROJECT_ID || looksLikePlaceholder(values.DEEPGRAM_PROJECT_ID)) {
    warnings.push('DEEPGRAM_PROJECT_ID is missing while voice scoring is enabled. This is acceptable at runtime if unused, but dashboard/project traceability will be weaker.');
  }
}

console.log('');
console.log(`${targetLabel[0].toUpperCase()}${targetLabel.slice(1)} configuration summary`);
console.log('--------------------------------');
console.log(`App name           : ${values.VITE_APP_NAME || '(missing)'}`);
console.log(`App environment    : ${values.VITE_APP_ENV || '(missing)'}`);
console.log(`App URL            : ${values.VITE_APP_URL || '(missing)'}`);
console.log(`App version        : ${values.VITE_APP_VERSION || '(missing / optional)'}`);
console.log(`Voice scoring      : ${values.VITE_ENABLE_VOICE_SCORING || '(missing)'}`);
console.log(`Deepgram project   : ${values.DEEPGRAM_PROJECT_ID || '(optional / not set)'}`);
console.log('');
console.log(`Set these in your deployment platform (${targetLabel})`);
console.log('-------------------------------------');
console.log(`Environment target : ${targetLabel}`);
console.log('Environment vars   : VITE_APP_ENV, VITE_APP_NAME, VITE_APP_URL, VITE_ENABLE_VOICE_SCORING');
console.log('Server-only secrets: DEEPGRAM_API_KEY, DEEPGRAM_PROJECT_ID');
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
