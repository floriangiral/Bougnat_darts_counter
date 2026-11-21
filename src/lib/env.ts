type PublicEnv = {
  VITE_APP_ENV: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_APP_URL: string;
  VITE_APP_ACCESS_MODE: string;
  VITE_CF_WEB_ANALYTICS_TOKEN: string;
  VITE_ENABLE_VOICE_SCORING: boolean;
  VITE_LOG_LEVEL: string;
  /** Comma-separated origins allowed as external match return URLs (spec 030). Empty = feature off. */
  VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: string;
};

function read(name: string, fallback = ""): string {
  const value: unknown = import.meta.env?.[name];
  return typeof value === 'string' ? value : fallback;
}

function toBoolean(value: string, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return value === "true";
}

function readPublic(name: string): string {
  const value = read(name);
  if (!value) {
    console.warn(
      `[env] Missing public environment variable: ${name}. The app may fall back to limited or offline mode.`,
    );
  }
  return value;
}

/**
 * True only when VITE_APP_ENV is explicitly "local" (no fallback): local-only relaxations
 * (spec 030 http return to a private IPv4) must never apply to a misconfigured build.
 */
export const isExplicitLocalAppEnv = (): boolean => read("VITE_APP_ENV") === "local";

export const env: PublicEnv = {
  VITE_APP_ENV: read("VITE_APP_ENV", "local"),
  VITE_APP_NAME: read("VITE_APP_NAME", "Bougnat Darts Counter"),
  VITE_APP_VERSION: read("VITE_APP_VERSION", "dev"),
  VITE_APP_URL: readPublic("VITE_APP_URL"),
  VITE_APP_ACCESS_MODE: read("VITE_APP_ACCESS_MODE", "local"),
  VITE_CF_WEB_ANALYTICS_TOKEN: read("VITE_CF_WEB_ANALYTICS_TOKEN", ""),
  VITE_ENABLE_VOICE_SCORING: toBoolean(read("VITE_ENABLE_VOICE_SCORING"), false),
  VITE_LOG_LEVEL: read("VITE_LOG_LEVEL", "info"),
  VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS: read("VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS", ""),
};
