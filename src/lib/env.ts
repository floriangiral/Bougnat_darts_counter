type PublicEnv = {
  VITE_APP_ENV: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_APP_URL: string;
  VITE_APP_ACCESS_MODE: string;
  VITE_TOURNAMENT_API_BASE_URL: string;
  VITE_BOUGNAT_API_URL: string;
  VITE_CLERK_FRONTEND_API_URL: string;
  VITE_CLERK_PUBLISHABLE_KEY: string;
  VITE_CLERK_JWT_TEMPLATE_NAME: string;
  VITE_CF_WEB_ANALYTICS_TOKEN: string;
  VITE_ENABLE_VOICE_SCORING: boolean;
  VITE_LOG_LEVEL: string;
  VITE_TOURNAMENT_BACKEND_ENABLED: boolean;
};

function read(name: string, fallback = ""): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  return env[name] ?? fallback;
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

const normalizedAppEnv = read('VITE_APP_ENV', 'local').trim().toLowerCase();
const normalizedAppVersion = read('VITE_APP_VERSION', 'dev').trim();

export const env: PublicEnv = {
  VITE_APP_ENV: normalizedAppEnv,
  VITE_APP_NAME: read("VITE_APP_NAME", "Bougnat Darts Counter"),
  VITE_APP_VERSION: normalizedAppVersion,
  VITE_APP_URL: readPublic("VITE_APP_URL"),
  VITE_APP_ACCESS_MODE: read("VITE_APP_ACCESS_MODE", "local"),
  VITE_TOURNAMENT_API_BASE_URL: read("VITE_TOURNAMENT_API_BASE_URL", read("VITE_BOUGNAT_API_URL", "http://localhost:8080")),
  VITE_BOUGNAT_API_URL: read("VITE_BOUGNAT_API_URL", "http://localhost:8080"),
  VITE_CLERK_FRONTEND_API_URL: read("VITE_CLERK_FRONTEND_API_URL", ""),
  VITE_CLERK_PUBLISHABLE_KEY: read("VITE_CLERK_PUBLISHABLE_KEY", ""),
  VITE_CLERK_JWT_TEMPLATE_NAME: read("VITE_CLERK_JWT_TEMPLATE_NAME", "bougnat-darts-api"),
  VITE_CF_WEB_ANALYTICS_TOKEN: read("VITE_CF_WEB_ANALYTICS_TOKEN", ""),
  VITE_ENABLE_VOICE_SCORING: toBoolean(read("VITE_ENABLE_VOICE_SCORING"), false),
  VITE_LOG_LEVEL: read("VITE_LOG_LEVEL", "info"),
  VITE_TOURNAMENT_BACKEND_ENABLED:
    normalizedAppEnv !== 'production' && (normalizedAppVersion === 'dev' || normalizedAppVersion.startsWith('2.0')),
};
