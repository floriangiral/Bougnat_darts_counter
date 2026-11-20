# Plan — 075 Voix — port de reconnaissance et commandes vocales

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `src/features/x01/voice/useDeepgramStreaming.ts` (orchestration complète), `audioContextManager.ts`, `deepgramConnectionManager.ts`, `deepgramClient.ts`, `voiceSessionModel.ts`, `voiceStreamingModel.ts`, `voiceProposalModel.ts`, `dartsSpeech*.ts`.
- `views/MatchView.tsx:170-223` (session, utterance), `:309-345` (undo), `:377-386` (soumission), `:509-526` (bouton).
- Tests : `tests/unit/x01/useDeepgramStreaming.test.tsx`, `voiceBrowserFakes.ts`, `voiceProposalModel.test.ts`, `voiceSessionModel.test.ts`.

## 2. Approche retenue (et alternatives écartées)
Extraction incrémentale « strangler » : d'abord le port et le contrôleur alimentés par l'implémentation actuelle, puis bascule de `MatchView`, puis commandes. Écartés : réécriture complète (risque), bibliothèque de machine d'états (dépendance non justifiée pour ~8 états).

## 3. Étapes
1. Tests de caractérisation du comportement vocal actuel dans `MatchView` (avec la spec 039).
2. Définir `SpeechRecognizerPort`, `VoiceIntent`, `VoiceSessionState` dans `src/application/voice/`.
3. Écrire `VoiceSessionController` (transitions pures) et ses tests.
4. Déplacer le pipeline dans `src/infrastructure/voice/DeepgramRecognizer.ts` (réutilise managers existants) ; `FakeSpeechRecognizer` pour les tests.
5. `useVoiceSession` + bascule de `MatchView` ; suppression de `useDeepgramStreaming` une fois la parité prouvée.
6. Grammaire X01 v2 : intentions de commande (s'appuie sur le parseur FR v2 de la spec 003).
7. Branchement sur les commandes de la spec 057 (soumission, annulation) ; aperçu fourni par le moteur.
8. Indices de vocabulaire (nombres, commandes), sans prénoms.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/application/voice/{ports,VoiceSessionController,VoiceIntent}.ts` | nouveaux |
| `src/infrastructure/voice/{DeepgramRecognizer,FakeSpeechRecognizer}.ts` | nouveaux (code déplacé) |
| `src/presentation/voice/useVoiceSession.ts` | nouveau |
| `src/features/x01/voice/x01VoiceGrammar.ts` | nouveau (au-dessus du parseur) |
| `src/features/x01/voice/useDeepgramStreaming.ts` | supprimé en fin de migration |
| `views/MatchView.tsx`, `components/match/MatchInputBar.tsx` | branchement, bannière |
| `src/features/x01/voice/voiceConfig.ts` | indices de vocabulaire |

## 5. Impacts UI / domaine / application / infrastructure
UI : bannière de proposition et indices de commandes. Domaine : aucun. Application : nouveau module voix. Infrastructure : adaptateur Deepgram.

## 6. Stratégie de migration
Aucune donnée persistée. Migration de code en 3 PR (port + contrôleur ; bascule MatchView ; commandes) derrière la même option de build `VITE_ENABLE_VOICE_SCORING`.

## 7. Stratégie de test
Unitaires (contrôleur, grammaire depuis le corpus 074, adaptateur avec faux WebSocket), composants, E2E simulé (faux adaptateur), terrain (20 volées). Couverture ≥ 90 % sur `src/application/voice/`.

## 8. Non-régression
Caractérisation verte avant/après ; tests voix migrés ; keypad, robot, partie partagée, Triathlon 501.

## 9. Rollback / désactivation
Chaque PR est réversible ; drapeau d'exécution temporaire `voiceControllerV2` (constante) pendant la bascule ; `VITE_ENABLE_VOICE_SCORING=false` en dernier recours.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (couches voix), `docs/specifications.md` (§ Voice Architecture, commandes), ADR 0008 passée à « acceptée », guide utilisateur (spec 037).
