# Plan — 079 Voix — extension aux autres jeux (Cricket d'abord)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
`views/CricketGameView.tsx:47-63` (état de vue), `components/game/CricketKeypad.tsx:5-11` (entrées), `types.ts:59` (`CricketTarget`), `src/features/x01/voice/dartsSpeechParser*.ts` (lexique), reducer Cricket de la spec 058, contrôleur de la spec 075.

## 2. Approche retenue (et alternatives écartées)
Extraire le lexique, écrire une grammaire Cricket pure, brancher le contrôleur commun. Écartés : copier le pipeline X01 dans la vue Cricket (duplication) ; brancher sur l'état de vue actuel (à refaire après 058).

## 3. Étapes
1. Extraire le lexique FR partagé (sans changement de comportement X01, tests de caractérisation).
2. Grammaire Cricket (intentions) + tests table-driven issus d'un sous-corpus Cricket (spec 074).
3. Conversion intentions → commandes du reducer Cricket (058).
4. Branchement de `useVoiceSession` dans `CricketGameView`, bannière multi-fléchettes, réglage.
5. Indices de vocabulaire spécifiques au jeu.
6. Mesure et campagne terrain.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/shared/voice/lexiconFr.ts` | nouveau (extrait) |
| `src/features/cricket/voice/cricketVoiceGrammar.ts` | nouveau |
| `views/CricketGameView.tsx`, `components/game/CricketKeypad.tsx` | branchement, emplacement du bouton micro |
| `src/features/x01/voice/dartsSpeechParser*.ts` | import du lexique partagé |
| `tests/fixtures/voice/corpus.v1.json` | énoncés Cricket |

## 5. Impacts UI / domaine / application / infrastructure
UI Cricket : bouton micro et bannière. Domaine : aucun (reducer de 058). Application : grammaire. Infrastructure : aucune nouvelle.

## 6. Stratégie de migration
Aucune donnée ; reprise de partie Cricket inchangée (spec 010).

## 7. Stratégie de test
Unitaires (grammaire, parité pavé/voix), E2E simulé, terrain ; couverture selon la spec 029.

## 8. Non-régression
Tests Cricket, voix X01, Triathlon.

## 9. Rollback / désactivation
Réglage masqué par constante ; revert du branchement sans toucher au lexique.

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur voix (spec 037), `docs/specifications.md` (voix multi-jeux).
