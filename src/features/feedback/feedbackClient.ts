// Message libre envoyé depuis l'accueil (bug, problème, idée, félicitations), sans compte.
// Route temporaire fournie par DartsHub : elle enregistre le message et le transmet par e-mail.

export const FEEDBACK_CATEGORIES = ['bug', 'probleme', 'idee', 'bravo'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  probleme: 'Problème',
  idee: 'Idée',
  bravo: 'Bravo',
};

export const FEEDBACK_MESSAGE_MAX_LENGTH = 5000;
const FEEDBACK_APP_VERSION_MAX_LENGTH = 50;
const FEEDBACK_TIMEOUT_MS = 10_000;

// Mettre à null masque le bouton de l'accueil (route retirée par DartsHub).
export const FEEDBACK_ENDPOINT: string | null = 'https://api.dartshub.fr/bougnat/feedback';

export interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  app_version: string;
}

export type FeedbackSendResult = 'sent' | 'invalid' | 'rate-limited' | 'unavailable' | 'error';

export const normalizeFeedbackMessage = (message: string): string => message.trim();

export const isFeedbackMessageValid = (message: string): boolean => {
  const normalized = normalizeFeedbackMessage(message);
  return normalized.length > 0 && normalized.length <= FEEDBACK_MESSAGE_MAX_LENGTH;
};

/** « 2.2.0 » en production, « 2.2.0+abc1234 » ailleurs quand le build est connu. */
export const formatFeedbackAppVersion = (semver: string, build: string | undefined, production: boolean): string => {
  const shortBuild = build && build !== 'dev' ? build.slice(0, 7) : '';
  const version = production || !shortBuild ? semver : `${semver}+${shortBuild}`;
  return version.slice(0, FEEDBACK_APP_VERSION_MAX_LENGTH);
};

export const buildFeedbackPayload = (
  category: FeedbackCategory,
  message: string,
  appVersion: string,
): FeedbackPayload => ({
  category,
  message: normalizeFeedbackMessage(message),
  app_version: appVersion,
});

interface SendFeedbackOptions {
  endpoint?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function sendFeedback(
  payload: FeedbackPayload,
  { endpoint = FEEDBACK_ENDPOINT, fetchImpl = globalThis.fetch, timeoutMs = FEEDBACK_TIMEOUT_MS }: SendFeedbackOptions = {},
): Promise<FeedbackSendResult> {
  if (!endpoint || typeof fetchImpl !== 'function') return 'unavailable';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Sans cookie ni jeton : la route n'autorise que des appels anonymes (CORS).
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      signal: controller.signal,
    });
    if (response.ok) return 'sent';
    if (response.status === 422) return 'invalid';
    if (response.status === 429) return 'rate-limited';
    return 'error';
  } catch {
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}
