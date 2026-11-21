# Plan

1. Stabiliser le parsing darts / score restant
2. Encapsuler les flux Deepgram dans un adapter UI
3. Renforcer la dégradation vers le manuel
4. Couvrir le flux par des tests unitaires explicites
5. Introduire une session vocale bornee au tour pour invalider les callbacks stale
6. Ajouter une couche d arbitrage metier des propositions vocales avant affichage UI
7. Formaliser les etats de readiness / erreur Deepgram et les mesurer en tests

## Révision V2 — plan proposé

> Plan proposé par l'audit V2 du 2026-11-20 (V2-VOICE-01). Il ne s'exécute qu'après validation de la « Révision V2 » de `spec.md`.

### Lecture de l'existant
`src/features/x01/voice/useDeepgramStreaming.ts` (650 l. : états l.255/304-310, tampon l.37, fenêtre l.534-567, pré-chargement l.83-107), `voiceConfig.ts:19-35`, `dartsSpeechNormalizer.ts:80-94`, `dartsSpeechParserLexicon.ts:84-91`, `dartsSpeechParserShared.ts:126-136`, `voiceProposalModel.ts`, `views/MatchView.tsx:170-223,377-386`, `components/match/MatchInputBar.tsx:35`, `public/pcmCaptureWorklet.js`.

### Approche
Deux incréments : **lot 0** (correctifs rapides sans dépendance) puis **lot 3** (parseur réécrit et pipeline complet, après la spec 057). Écarté : refonte big-bang avec changement de moteur (la spec 078 instruit les moteurs).

### Étapes
1. **Lot 0** — ajouter `utterance_end_ms` (V2-FR-03) ; retirer la vérification « supérieur au reste » du parseur (V2-FR-08), adapter `buildVoiceProposalGuidance` ; ne plus afficher l'erreur de timeout après proposition (V2-FR-04 partiel) ; messages FR et badge (V2-FR-14).
2. Ajouter l'état `connecting` et le pré-roll circulaire ≥ 1,5 s (`voiceStreamingModel.ts`, `useDeepgramStreaming.ts`) ; remplacer `MAX_BUFFERED_PCM_CHUNKS` par une durée.
3. Prolongation de fenêtre sur `SpeechStarted`/intermédiaires avec plafond (constante dans `voiceConfig.ts`).
4. Worklet : agrégation 20-40 ms ; `voicePcm.ts` : compte cumulatif d'échantillons.
5. Détection de capacité et hors ligne : nouveau module pur `voiceCapabilities.ts` consommé par `VoiceScoringControl.tsx`.
6. Pré-chargement au premier appui ; désactivation de la reconnexion SDK (`deepgramConnectionManager.ts`).
7. **Parseur FR v2** (après 057) : lexique des nombres 0-180 en lettres (`dartsSpeechParserLexicon.ts`), ordre de normalisation corrigé (remplacements accentués avant suppression des accents, ou règles désaccentuées), articles, « trois fois », volée nulle ; vérification de possibilité via la règle unique ; suppression des règles mortes et doublons.
8. États `ambiguous` distincts dans `MatchInputBar.tsx` ; pas de pré-remplissage.
9. Mise à jour de « Key Tests » et de la tâche E-01.

### Fichiers impactés
| Fichier | Nature |
|---|---|
| `src/features/x01/voice/voiceConfig.ts` | `utterance_end_ms`, plafonds de fenêtre |
| `src/features/x01/voice/useDeepgramStreaming.ts`, `voiceStreamingModel.ts` | `connecting`, pré-roll, fenêtre |
| `public/pcmCaptureWorklet.js`, `src/features/x01/voice/voicePcm.ts` | trames, dérive |
| `src/features/x01/voice/dartsSpeech*.ts` | parseur v2, retrait du bust |
| `src/features/x01/voice/voiceProposalModel.ts`, `voiceSessionModel.ts` | guidance, messages |
| `src/features/x01/voice/deepgramConnectionManager.ts` | reconnexion désactivée |
| `src/features/x01/voice/VoiceScoringControl.tsx`, `components/match/MatchInputBar.tsx`, `views/MatchView.tsx` | capacité, hors ligne, états |

### Migration
Aucune donnée persistée (le choix voix n'est pas persisté). Pas de changement de contrat externe.

### Tests
Unitaires : pré-roll avec socket retardé, `UtteranceEnd`, fenêtre prolongée, absence d'erreur après proposition, table-driven du parseur (≥ 60 énoncés, issus du corpus texte de la spec 074), parité voix/keypad sur le bust, capacité/hors ligne. Intégration : navigation pendant l'écoute dans `MatchView`. Couverture selon la spec 029.

### Non-régression
Tests existants voix et X01 ; parcours keypad/raccourcis/undo ; voix dans le 501 Triathlon.

### Rollback
Chaque incrément est un commit isolé ; `VITE_ENABLE_VOICE_SCORING=false` désactive la voix au build ; le parseur v1 reste récupérable par revert.

### Documentation
`docs/specifications.md` (§ Voice Architecture : fenêtre, `connecting`, données), `docs/release/react-19-validation-matrix.md:30` à solder, notes de release.
