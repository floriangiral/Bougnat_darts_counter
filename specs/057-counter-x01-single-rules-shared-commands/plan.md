# Plan — 057 Règles X01 uniques et commandes partagées

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Moteur : `src/application/scoring/matchLifecycle.ts:215-291` (`finishLeg`, `submitTurn`).
- Validation de saisie : `src/features/x01/scoring/matchSubmission.ts:39-114`.
- Copies de règles : `checkoutEligibility.ts:3-15`, `possibleTurnScores.ts:1-20`, `matchStats.ts:4`, `x01BotTurn.ts:11-34`, `src/domain/scoring/**`.
- Points d'entrée vue : `views/MatchView.tsx:347-375` (soumission), `388-423` (RESTE), `425-478` (raccourci checkout), `489-500` (confirmation), `565-646` (robot) ; voix `187-209`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : module pur `src/domain/x01/` construit à partir du chemin réellement exécuté, puis branchement source par source.
- Écartée : rebrancher `RecordThrow`/`ScoringRules` tels quels (non alignés sur le chemin réel, cf. Q1).
- Écartée : port générique d'entrée de score (ADR-0009, étude 062).

## 3. Étapes
1. Vérifier la présence des golden tests X01 (spec 039) ; ajouter un test d'immutabilité qui échoue aujourd'hui sur `finishLeg`.
2. Corriger `finishLeg` (copies de `legsWon`/`setsWon` avant modification) — PR isolée.
3. Créer `src/domain/x01/rules.ts` (scores possibles, restes non finissables, `canFinishOn`, bust, fléchettes minimales) ; faire pointer les anciennes copies vers ce module (ré-exports transitoires).
4. Créer `src/domain/x01/commands.ts` (`X01Command`, `X01Outcome`, `applyX01Command`) en réutilisant `submitTurn`.
5. Brancher le keypad et les raccourcis (`processScoreSubmission`, `useMatchShortcuts`).
6. Brancher RESTE (supprimer la règle locale de `handleRemainingSubmit`) et le raccourci checkout (corriger la garde l.429).
7. Brancher le robot (score candidat → commande) et supprimer l'import `features/` de `x01BotTurn.ts`.
8. Brancher la voix (proposition validée → commande) en coordination avec la spec 003 (Q2).
9. Supprimer les copies devenues inutiles ; la suppression de `src/domain/scoring` est faite par la spec 056.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/domain/x01/rules.ts`, `src/domain/x01/commands.ts` | Création |
| `src/application/scoring/matchLifecycle.ts` | Immutabilité `finishLeg` ; `submitTurn` interne/déplacé |
| `src/features/x01/scoring/matchSubmission.ts` | Réduit au mapping `outcome → retour` |
| `src/features/x01/scoring/checkoutEligibility.ts`, `possibleTurnScores.ts` | Ré-export transitoire puis suppression |
| `src/application/scoring/matchStats.ts` | Utilise le module de règles |
| `src/application/x01Bot/x01BotTurn.ts` | Score candidat, plus d'import `features/` |
| `src/features/x01/hooks/useMatchShortcuts.ts` | Commande partagée |
| `views/MatchView.tsx` | Handlers → commandes ; garde l.429 |
| `src/features/x01/voice/dartsSpeechParserShared.ts` | Selon Q2, coordonné avec 003 |

## 5. Impacts UI / domaine / application / infrastructure
UI : aucun changement visuel attendu. Domaine : nouveau module X01. Application : bot et stats consomment le domaine. Infrastructure : aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune : `MatchState` inchangé ; sessions persistées et contrat `v=1` compatibles.

## 7. Stratégie de test
Unitaires (table de vérité des règles, commandes par source, gel profond), composants (`MatchView`), E2E existants X01 et partenaire ; couverture conforme à la spec 029.

## 8. Non-régression
Golden tests 039 identiques avant/après chaque étape ; suites `matchLifecycle`, `matchScoring`, `x01BotTurn`, `voiceProposalModel`.

## 9. Rollback / désactivation
Une PR par étape ; chaque PR est réversible par `git revert` sans migration de données. Pas de feature flag nécessaire.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (section moteur X01), ADR-0002 (statut), `docs/technical.md` si les chemins cités changent.
