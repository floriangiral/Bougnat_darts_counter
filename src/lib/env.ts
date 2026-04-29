type PublicEnv = {
  VITE_APP_ENV: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_APP_URL: string;
  VITE_APP_ACCESS_MODE: string;
  VITE_ENABLE_VOICE_SCORING: boolean;
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
  VITE_APP_NAME: read("VITE_APP_NAME", "Bougnat Darts Counter"),
  VITE_APP_VERSION: read("VITE_APP_VERSION", "dev"),
  VITE_APP_URL: readPublic("VITE_APP_URL"),
  VITE_APP_ACCESS_MODE: read("VITE_APP_ACCESS_MODE", "local"),
  VITE_ENABLE_VOICE_SCORING: toBoolean(read("VITE_ENABLE_VOICE_SCORING"), false),
  VITE_LOG_LEVEL: read("VITE_LOG_LEVEL", "info"),
};
