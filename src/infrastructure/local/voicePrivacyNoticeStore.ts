import {
  isVoicePrivacyNoticeAccepted,
  serializeVoicePrivacyNoticeAcceptance,
  VOICE_PRIVACY_NOTICE_STORAGE_KEY,
} from '../../features/x01/voice/voicePrivacyNotice';

// Spec 080 FR-01 : acceptation de la fiche mémorisée sur l'appareil, versionnée ; un stockage
// indisponible n'est jamais bloquant (la fiche est alors réaffichée à chaque session).
export const readVoicePrivacyNoticeAccepted = (
  storage: Pick<Storage, 'getItem'> | null = getLocalStorage(),
): boolean => {
  try {
    return isVoicePrivacyNoticeAccepted(storage?.getItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY) ?? null);
  } catch {
    return false;
  }
};

export const writeVoicePrivacyNoticeAccepted = (
  storage: Pick<Storage, 'setItem'> | null = getLocalStorage(),
): void => {
  try {
    storage?.setItem(VOICE_PRIVACY_NOTICE_STORAGE_KEY, serializeVoicePrivacyNoticeAcceptance());
  } catch {
    // Navigation privée stricte ou quota atteint : l'acceptation vaut pour la session en cours seulement.
  }
};

function getLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
