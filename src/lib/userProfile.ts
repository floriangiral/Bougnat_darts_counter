export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{1,15}$/;
const DEFAULT_COUNTRY_CODE = 'FR';
const DEFAULT_AVATAR_ID = 'toon-head-001';

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

export const AVATAR_OPTIONS = Array.from({ length: 120 }, (_, index) => {
  const id = `toon-head-${String(index + 1).padStart(3, '0')}`;

  return {
    id,
    label: `Avatar ${index + 1}`,
    url: `https://api.dicebear.com/9.x/toon-head/svg?seed=${encodeURIComponent(id)}&backgroundColor=b6e3f4`,
  };
});

type CountryCode = (typeof COUNTRY_OPTIONS)[number]['code'];

const COUNTRY_FLAG_URLS: Record<CountryCode, string> = {
  FR: 'https://flagcdn.com/w40/fr.png',
  BE: 'https://flagcdn.com/w40/be.png',
  CH: 'https://flagcdn.com/w40/ch.png',
  GB: 'https://flagcdn.com/w40/gb.png',
  IE: 'https://flagcdn.com/w40/ie.png',
  NL: 'https://flagcdn.com/w40/nl.png',
  DE: 'https://flagcdn.com/w40/de.png',
  ES: 'https://flagcdn.com/w40/es.png',
  IT: 'https://flagcdn.com/w40/it.png',
  US: 'https://flagcdn.com/w40/us.png',
  CA: 'https://flagcdn.com/w40/ca.png',
  AU: 'https://flagcdn.com/w40/au.png',
};

export function getDisplayUsername(value: string | undefined | null): string {
  return String(value || '').trim() || 'player';
}

export function getAvatarId(value: string | undefined | null): string {
  const normalized = String(value || '').trim();
  return AVATAR_OPTIONS.some((avatar) => avatar.id === normalized) ? normalized : DEFAULT_AVATAR_ID;
}

export function getAvatarUrl(value: string | undefined | null): string {
  const avatarId = getAvatarId(value);
  return AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId)?.url || AVATAR_OPTIONS[0].url;
}

export function canonicalizeUsername(value: string): string {
  return value.trim();
}

export function buildUsernameBase(firstName: string, lastName: string): string {
  const normalized = `${firstName}${lastName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();

  return normalized.slice(0, 15) || 'player';
}

export function buildGeneratedUsername(base: string, suffix = 0): string {
  const safeBase = buildUsernameBase(base, '');

  if (suffix <= 0) {
    return safeBase;
  }

  const suffixText = String(suffix);
  const trimmedBase = safeBase.slice(0, Math.max(1, 15 - suffixText.length));
  return `${trimmedBase}${suffixText}`;
}

export function validateUsername(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Username is required.';
  }

  if (/\s/.test(trimmed)) {
    return 'Username cannot contain spaces.';
  }

  if (trimmed.length > 15) {
    return 'Username must contain 15 characters or fewer.';
  }

  if (!/^[a-z0-9_-]+$/i.test(trimmed)) {
    return 'Use only letters, digits, underscores or dashes.';
  }

  const canonical = canonicalizeUsername(trimmed);

  if (!USERNAME_PATTERN.test(canonical)) {
    return 'Use up to 15 chars: letters, digits, underscore or dash.';
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
  return COUNTRY_FLAG_URLS[getCountryCode(value)];
}

export function getUserProfile(user: any) {
  const rawUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'player';
  const username = getDisplayUsername(rawUsername);
  const seed = getAvatarId(user?.user_metadata?.avatar_seed);
  const countryCode = getCountryCode(user?.user_metadata?.country_code);
  const countryFlag = getCountryFlag(countryCode);
  const countryFlagUrl = getCountryFlagUrl(countryCode);
  const countryLabel = getCountryLabel(countryCode);
  const avatarUrl = getAvatarUrl(seed);

  return { username, seed, avatarUrl, countryCode, countryFlag, countryFlagUrl, countryLabel };
}
