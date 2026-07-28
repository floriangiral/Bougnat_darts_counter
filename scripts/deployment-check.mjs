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
  VITE_TOURNAMENT_API_BASE_URL: readValue('VITE_TOURNAMENT_API_BASE_URL'),
  VITE_BOUGNAT_API_URL: readValue('VITE_BOUGNAT_API_URL'),
  VITE_CLERK_PUBLISHABLE_KEY: readValue('VITE_CLERK_PUBLISHABLE_KEY'),
  VITE_CLERK_JWT_TEMPLATE_NAME: readValue('VITE_CLERK_JWT_TEMPLATE_NAME'),
  VITE_CF_WEB_ANALYTICS_TOKEN: readValue('VITE_CF_WEB_ANALYTICS_TOKEN'),
  VITE_ENABLE_VOICE_SCORING: readValue('VITE_ENABLE_VOICE_SCORING'),
  DEEPGRAM_PROJECT_ID: readValue('DEEPGRAM_PROJECT_ID'),
  DEEPGRAM_API_KEY: readValue('DEEPGRAM_API_KEY'),
};

const errors = [];
const warnings = [];
const allowedPublicSecretLikeKeys = new Set([
  'VITE_CF_WEB_ANALYTICS_TOKEN',
  'VITE_CLERK_JWT_TEMPLATE_NAME',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_ENABLE_VOICE_SCORING',
]);
const publicSecretLikePattern = /(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|ACCESS_KEY|AUTH|JWT)/i;
const expectedAppEnv = deployTarget === 'production' ? 'production' : 'preprod';
const targetLabel = deployTarget === 'production' ? 'production' : 'preprod';
const expectedTournamentApiBaseUrl = deployTarget === 'production'
  ? 'https://api.bougnatdarts.fr'
  : 'https://bougnat-darts-develop.fly.dev';
const expectedVersionPrefix = deployTarget === 'production' ? '1.1' : '2.0';

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

if (!isHttpsUrl(values.VITE_TOURNAMENT_API_BASE_URL)) {
  errors.push(`VITE_TOURNAMENT_API_BASE_URL must be a valid https URL for the deployed ${targetLabel} backend.`);
} else if (values.VITE_TOURNAMENT_API_BASE_URL !== expectedTournamentApiBaseUrl) {
  errors.push(`VITE_TOURNAMENT_API_BASE_URL must be "${expectedTournamentApiBaseUrl}" for ${targetLabel} (current: "${values.VITE_TOURNAMENT_API_BASE_URL}").`);
}

if (values.VITE_BOUGNAT_API_URL && values.VITE_BOUGNAT_API_URL !== values.VITE_TOURNAMENT_API_BASE_URL) {
  warnings.push('VITE_BOUGNAT_API_URL is legacy and differs from VITE_TOURNAMENT_API_BASE_URL. The counter uses VITE_TOURNAMENT_API_BASE_URL.');
}

if (!values.VITE_CLERK_PUBLISHABLE_KEY || looksLikePlaceholder(values.VITE_CLERK_PUBLISHABLE_KEY)) {
  errors.push(`VITE_CLERK_PUBLISHABLE_KEY is required for ${targetLabel} account login/signup.`);
}

if (values.VITE_CLERK_JWT_TEMPLATE_NAME !== 'bougnat-darts-api') {
  errors.push(`VITE_CLERK_JWT_TEMPLATE_NAME must be "bougnat-darts-api" (current: "${values.VITE_CLERK_JWT_TEMPLATE_NAME || 'missing'}").`);
}

if (!values.VITE_CF_WEB_ANALYTICS_TOKEN || looksLikePlaceholder(values.VITE_CF_WEB_ANALYTICS_TOKEN)) {
  errors.push(`VITE_CF_WEB_ANALYTICS_TOKEN is required for ${targetLabel}.`);
}

if (!values.VITE_APP_NAME) {
  warnings.push(`VITE_APP_NAME is empty. The app will still work, but naming will be less explicit in ${targetLabel}.`);
}

if (!values.VITE_APP_VERSION || !values.VITE_APP_VERSION.startsWith(expectedVersionPrefix)) {
  errors.push(`VITE_APP_VERSION must stay on ${expectedVersionPrefix}.x for ${targetLabel} (current: "${values.VITE_APP_VERSION || 'missing'}").`);
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
console.log(`Tournament API URL : ${values.VITE_TOURNAMENT_API_BASE_URL || '(missing)'}`);
console.log(`Clerk key          : ${values.VITE_CLERK_PUBLISHABLE_KEY ? '(set)' : '(missing)'}`);
console.log(`Clerk JWT template : ${values.VITE_CLERK_JWT_TEMPLATE_NAME || '(missing)'}`);
console.log(`App version        : ${values.VITE_APP_VERSION || '(missing / optional)'}`);
console.log(`Analytics token    : ${values.VITE_CF_WEB_ANALYTICS_TOKEN ? '(set)' : '(missing)'}`);
console.log(`Voice scoring      : ${values.VITE_ENABLE_VOICE_SCORING || '(missing)'}`);
console.log(`Deepgram project   : ${values.DEEPGRAM_PROJECT_ID || '(optional / not set)'}`);
console.log('');
console.log(`Set these in your deployment platform (${targetLabel})`);
console.log('-------------------------------------');
console.log(`Environment target : ${targetLabel}`);
console.log('Environment vars   : VITE_APP_ENV, VITE_APP_NAME, VITE_APP_URL, VITE_TOURNAMENT_API_BASE_URL, VITE_CLERK_PUBLISHABLE_KEY, VITE_CLERK_JWT_TEMPLATE_NAME, VITE_CF_WEB_ANALYTICS_TOKEN, VITE_ENABLE_VOICE_SCORING');
console.log('Server-only secrets: DEEPGRAM_API_KEY, DEEPGRAM_PROJECT_ID');
console.log('Source of truth    : Wrangler-managed routing vars plus deployment-provided analytics and secrets, not committed local env files');
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
