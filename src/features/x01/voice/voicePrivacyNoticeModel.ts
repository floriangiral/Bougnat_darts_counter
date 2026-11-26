// Spec 080 : fiche d'information « Voix et confidentialité ». Fonctions pures, sans accès au stockage.
// RM-04 : toute nouvelle finalité, nouveau sous-traitant ou changement de région (bascule UE, T006)
// impose d'incrémenter VOICE_PRIVACY_NOTICE_VERSION pour réafficher la fiche.

export const VOICE_PRIVACY_NOTICE_VERSION = 1;
export const VOICE_PRIVACY_NOTICE_STORAGE_KEY = 'bougnat-voice-privacy-notice';

export interface StoredVoicePrivacyNotice {
  v: number;
  accepted: true;
}

export const VOICE_PRIVACY_NOTICE_COPY = {
  title: 'Voix et confidentialité',
  paragraphs: [
    'Ta voix est envoyée à Deepgram pour être transcrite, uniquement pendant l’écoute. Bougnat Darts ne l’enregistre pas.',
    'La transcription a lieu aux États-Unis. Ta voix est exclue de l’entraînement des modèles de Deepgram et aucun prénom n’est transmis.',
    'Tu peux couper la voix à tout moment dans les options de la partie.',
  ],
  accept: 'Activer le micro',
  decline: 'Saisie manuelle',
  close: 'Fermer',
} as const;

export const isVoicePrivacyNoticeAccepted = (
  raw: string | null | undefined,
  version: number = VOICE_PRIVACY_NOTICE_VERSION,
): boolean => {
  if (!raw) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null
      && typeof parsed === 'object'
      && (parsed as { v?: unknown }).v === version
      && (parsed as { accepted?: unknown }).accepted === true;
  } catch {
    return false;
  }
};

export const serializeVoicePrivacyNoticeAcceptance = (version: number = VOICE_PRIVACY_NOTICE_VERSION): string =>
  JSON.stringify({ v: version, accepted: true } satisfies StoredVoicePrivacyNotice);
