// Spec: spec:counter/external-match-link
//
// Validation of VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS, shared by the Wrangler config check,
// the deployment checks and the Cloudflare Pages build. The app silently ignores invalid
// entries at runtime; the build tooling must reject them instead, so a typo never ships as
// a partner that cannot receive any result.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export const EXTERNAL_RETURN_ORIGINS_KEY = 'VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS';

/**
 * @param {string | undefined | null} raw comma-separated list of origins
 * @param {{ allowLocalhost?: boolean }} [options] localhost (http or https) is only allowed for local/CI builds
 * @returns {{ origins: string[], errors: string[] }}
 */
export function validateExternalReturnOrigins(raw, options = {}) {
  const allowLocalhost = options.allowLocalhost === true;
  const entries = String(raw ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  /** @type {string[]} */
  const origins = [];
  /** @type {string[]} */
  const errors = [];

  for (const entry of entries) {
    let url;
    try {
      url = new URL(entry);
    } catch {
      errors.push(`"${entry}" is not a valid URL.`);
      continue;
    }

    const isLocal = LOCAL_HOSTS.has(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
      errors.push(`"${entry}" must use https (http is only accepted for localhost).`);
      continue;
    }
    if (isLocal && !allowLocalhost) {
      errors.push(`"${entry}" points to localhost, which is not allowed for a deployed environment.`);
      continue;
    }
    if (url.username || url.password) {
      errors.push(`"${entry}" must not contain credentials.`);
      continue;
    }
    if (entry.replace(/\/$/, '') !== url.origin) {
      errors.push(`"${entry}" must be an origin only (scheme, host and optional port): use "${url.origin}".`);
      continue;
    }
    if (origins.includes(url.origin)) {
      errors.push(`"${entry}" is listed twice.`);
      continue;
    }
    origins.push(url.origin);
  }

  return { origins, errors };
}
