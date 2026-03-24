export const USERNAME_PATTERN = /^[a-z2-9_-]{3,20}$/;
const AMBIGUOUS_PATTERN = /[01oil]/i;
const DEFAULT_COUNTRY_CODE = 'FR';

export const COUNTRY_OPTIONS = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IE', label: 'Ireland' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'DE', label: 'Germany' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
] as const;

type CountryCode = (typeof COUNTRY_OPTIONS)[number]['code'];

export function getDisplayUsername(value: string | undefined | null): string {
  return String(value || '').trim() || 'player';
}

export function canonicalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Username is required.';
  }

  if (/\s/.test(trimmed)) {
    return 'Username cannot contain spaces.';
  }

  if (trimmed.length < 3 || trimmed.length > 20) {
    return 'Username must contain 3 to 20 characters.';
  }

  if (AMBIGUOUS_PATTERN.test(trimmed)) {
    return 'Username cannot contain ambiguous characters like 0, 1, o, i or l.';
  }

  if (!/^[a-z0-9_-]+$/i.test(trimmed)) {
    return 'Use only letters, digits, underscores or dashes.';
  }

  const canonical = canonicalizeUsername(trimmed);

  if (!USERNAME_PATTERN.test(canonical)) {
    return 'Use 3-20 chars: a-z, 2-9, underscore or dash.';
  }

  return null;
}

export function isValidCountryCode(value: string | undefined | null): value is CountryCode {
  return COUNTRY_OPTIONS.some((country) => country.code === value);
}

export function getCountryCode(value: string | undefined | null): CountryCode {
  return isValidCountryCode(value) ? value : DEFAULT_COUNTRY_CODE;
}

export function getCountryLabel(value: string | undefined | null): string {
  const code = getCountryCode(value);
  return COUNTRY_OPTIONS.find((country) => country.code === code)?.label || 'France';
}

export function getCountryFlag(value: string | undefined | null): string {
  return getCountryCode(value)
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
}

export function getCountryFlagUrl(value: string | undefined | null): string {
  return `https://flagcdn.com/w40/${getCountryCode(value).toLowerCase()}.png`;
}

export function getUserProfile(user: any) {
  const rawUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'player';
  const username = getDisplayUsername(rawUsername);
  const seed = user?.user_metadata?.avatar_seed || canonicalizeUsername(username);
  const countryCode = getCountryCode(user?.user_metadata?.country_code);
  const countryFlag = getCountryFlag(countryCode);
  const countryFlagUrl = getCountryFlagUrl(countryCode);
  const countryLabel = getCountryLabel(countryCode);
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`;

  return { username, seed, avatarUrl, countryCode, countryFlag, countryFlagUrl, countryLabel };
}
