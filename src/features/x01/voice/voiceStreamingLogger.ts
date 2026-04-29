const VOICE_DEBUG_PREFIX = '[voice-scoring]';

export const logVoiceDebug = (step: string, extra?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.debug(`${VOICE_DEBUG_PREFIX} ${step}`, extra);
};

export const logVoiceError = (step: string, extra?: Record<string, unknown>) => {
  console.error(`${VOICE_DEBUG_PREFIX} ${step}`, extra);
};