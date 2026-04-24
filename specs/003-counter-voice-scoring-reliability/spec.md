# Spec 003 - counter voice scoring reliability

## Meta

- ID: `003-counter-voice-scoring-reliability`
- Statut: `active`
- Milestone cible: `M3: Voice Scoring Reliability`
- Issues GitHub: `#74`

## Objectif

Garantir que l assistance vocale `X01` reste une aide de scorage fiable, optionnelle et bornee au vocabulaire darts, sans jamais court-circuiter la validation manuelle du scoreur.

## Decisions

- la transcription vocale propose un score, elle ne l applique jamais seule
- le fallback manuel reste toujours disponible
- le parsing s appuie sur des seuils et des garde-fous explicites
- la connexion Deepgram reste encapsulee dans une couche dédiée

## Invariants critiques

- aucun score vocal ne doit être validé sans confirmation explicite
- le mode vocal ne doit pas casser la saisie manuelle
- les erreurs réseau ou de transcription doivent dégrader gracieusement vers le manuel

## Impacted Code

- `src/features/x01/voice/dartsSpeechParser.ts`
- `src/features/x01/voice/dartsSpeechParserScoring.ts`
- `src/features/x01/voice/dartsSpeechParserShared.ts`
- `src/features/x01/voice/useDeepgramStreaming.ts`
- `src/features/x01/voice/voiceConfig.ts`

## Canonical Entry Points

- `parseDartsSpeechTranscript`
- `normalizeDartsTranscript`
- `useDeepgramStreaming`
- `buildDeepgramListenConfig`

## Key Tests

- `tests/unit/dartsSpeechParser.test.ts`
- `tests/unit/x01/matchScoring.test.ts`

## Validation

- parsing des annonces de score
- robustesse face aux confidences faibles
- dégradation propre vers la saisie manuelle
