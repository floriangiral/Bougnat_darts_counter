export const VOICE_SCORING_TIMEOUT_MS = 6500;
export const DEEPGRAM_KEYTERMS = [
  'single',
  'double',
  'triple',
  'simple',
  'bulle',
  'bull',
  'bullseye',
  'outer bull',
  'demie bulle',
  'demi bulle',
  'manque',
  'miss',
  'rate',
  'ratee',
];

// Spec 080 (RM-03) : la configuration d'écoute ne dépend que du jeton. Aucun prénom ni identifiant
// de joueur ne part chez le fournisseur (ni keyterm, ni `tag`, ni `extra`).
export function buildDeepgramListenConfig(authorization: string) {
  return {
    Authorization: authorization,
    diarize: 'false',
    encoding: 'linear16',
    endpointing: 300,
    interim_results: 'true',
    keyterm: DEEPGRAM_KEYTERMS,
    language: 'fr',
    // Spec 080 FR-02 : audio et transcription exclus du programme d'amélioration des modèles de Deepgram.
    mip_opt_out: 'true',
    model: 'nova-3',
    numerals: 'true',
    punctuate: 'false',
    sample_rate: 16000,
    smart_format: 'false',
    vad_events: 'true',
  } as const;
}
