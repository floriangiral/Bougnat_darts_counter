# Plan — 077 Caller « Bougnat » — annonces vocales en français

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `src/features/x01/scoring/matchSubmission.ts:38-90` (résultat de soumission, `isBust`, fin de match), `matchFeedback.ts` (libellés).
- `views/MatchView.tsx:268` (`triggerFeedback`), `:365-375` (application d'un résultat).
- `src/features/x01/voice/audioContextManager.ts` (`AudioContext` de capture).
- Commandes et événements à venir : spec 057 (ADR 0002) ; contrôleur vocal : spec 075.

## 2. Approche retenue (et alternatives écartées)
Synthèse du navigateur derrière un port, alimentée par des événements neutres. Écartés : TTS cloud (Deepgram Aura-2 ≈ 0,030 $/1 000 caractères [EXT] — coût récurrent inutile) ; clips enregistrés en V2 (coût, droits — Q3).

## 3. Étapes
1. Événements neutres de partie X01 émis après chaque commande (avec la spec 057 ; adaptateur provisoire depuis `buildScoreSubmissionResult` si 057 tarde).
2. Formateur pur des nombres et gabarits français.
3. `AudioOutputPort` + `WebSpeechSynthesizer` ; service audio unique (file, priorités, interruption, signal de lecture).
4. Migration de la propriété de l'`AudioContext` vers le service audio ; la capture s'y enregistre.
5. Réglages (activé, verbosité, volume) dans les réglages du match + mémorisation locale.
6. Semi-duplex avec le contrôleur vocal (spec 075).
7. Lot B : sons de moments forts.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/application/audio/{AudioOutputPort,AudioService}.ts` | nouveaux |
| `src/application/caller/{x01CallerEvents,frenchAnnouncer}.ts` | nouveaux (purs) |
| `src/infrastructure/audio/WebSpeechSynthesizer.ts` | nouveau |
| `src/features/x01/voice/audioContextManager.ts` | propriété du contexte déléguée |
| `components/match/MatchSettingsModal.tsx`, `views/MatchView.tsx` | réglages, abonnement |
| `src/features/x01/scoring/matchFeedback.ts` | libellés français |

## 5. Impacts UI / domaine / application / infrastructure
UI : réglages. Domaine : aucun. Application : événements, formateur, service audio. Infrastructure : synthèse.

## 6. Stratégie de migration
Préférences locales nouvelles (clé versionnée, valeur par défaut selon Q1). Aucune autre donnée.

## 7. Stratégie de test
Unitaires (formateur table-driven, file), composants (réglages), E2E avec stub de `speechSynthesis`, terrain (intelligibilité à 3 m).

## 8. Non-régression
Retours visuels, saisie, voix en entrée, INP (annonce différée hors chemin d'interaction).

## 9. Rollback / désactivation
Option désactivée par défaut ; constante de configuration pour masquer l'option.

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur (spec 037), site vitrine aligné (spec 034), `docs/specifications.md` ; ne rien annoncer avant livraison.
