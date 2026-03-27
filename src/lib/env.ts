type PublicEnv = {
  VITE_APP_ENV: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_APP_URL: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_ENABLE_ANALYTICS: boolean;
  VITE_ENABLE_BETA_BADGE: boolean;
  VITE_LOG_LEVEL: string;
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

export const env: PublicEnv = {
  VITE_APP_ENV: read("VITE_APP_ENV", "local"),
  VITE_APP_NAME: read("VITE_APP_NAME", "Bougnat Darts"),
  VITE_APP_VERSION: read("VITE_APP_VERSION", "dev"),
  VITE_APP_URL: readPublic("VITE_APP_URL"),
  VITE_SUPABASE_URL: readPublic("VITE_SUPABASE_URL"),
  VITE_SUPABASE_ANON_KEY: readPublic("VITE_SUPABASE_ANON_KEY"),
  VITE_ENABLE_ANALYTICS: toBoolean(read("VITE_ENABLE_ANALYTICS"), false),
  VITE_ENABLE_BETA_BADGE: toBoolean(read("VITE_ENABLE_BETA_BADGE"), false),
  VITE_LOG_LEVEL: read("VITE_LOG_LEVEL", "info"),
};

export function getAuthCallbackUrl(): string {
  const appUrl = env.VITE_APP_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}/auth/callback` : `${window.location.origin}/auth/callback`;
}
