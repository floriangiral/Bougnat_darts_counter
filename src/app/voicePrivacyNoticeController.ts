import { readVoicePrivacyNoticeAccepted, writeVoicePrivacyNoticeAccepted } from '../infrastructure/local/voicePrivacyNoticeStore';

// Spec 080 RM-01 : unique source de l'acceptation de la fiche voix. La lecture est synchrone pour que
// la garde de l'écoute (useDeepgramStreaming) voie l'acceptation dans le même geste que le clic.
// Si le stockage est indisponible, l'acceptation vaut pour la session en cours (mémoire).
let accepted: boolean | null = null;

export const hasAcceptedVoicePrivacyNotice = (): boolean => {
  accepted ??= readVoicePrivacyNoticeAccepted();
  return accepted;
};

export const acceptVoicePrivacyNotice = (): void => {
  accepted = true;
  writeVoicePrivacyNoticeAccepted();
};

// Réservé aux tests : relit le stockage au prochain accès.
export const resetVoicePrivacyNoticeForTests = (): void => {
  accepted = null;
};
