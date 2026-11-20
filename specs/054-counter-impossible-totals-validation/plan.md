# Plan — 054 Refus des totaux impossibles (Gotcha, Capital)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Règle : `src/domain/scoring/valueObjects/ScoreInput.ts:49-51` ; doublon `src/features/x01/scoring/possibleTurnScores.ts`.
- Gotcha : `src/domain/gotcha/gotcha.ts:60-68`, `views/GotchaGameView.tsx:29-133`.
- Capital : `components/game/CapitalKeypad.tsx:66-90,255-430`, `views/CapitalGameView.tsx:95-99`.
- Référence couleurs : `components/game/CricketKeypad.tsx:54-93`.

## 2. Approche retenue (et alternatives écartées)

Brancher Gotcha et Capital sur la fonction de domaine existante ; aligner les classes du keypad Capital sur celles du Cricket via de petites constantes partagées (`components/game/multiplierStyles.ts`), remplacées plus tard par les tokens de la spec 066. Écartée : nouvelle fonction de validation dans `features/` (ajoute un doublon).

## 3. Étapes

1. Tests paramétrés (9 totaux irréalisables, 0, 180).
2. `recordGotchaTurn` : refus via `isPossibleThreeDartTurnScore`.
3. Aperçu Gotcha : état « Score impossible » et bouton inactif (Q1).
4. Keypad Capital : refus pour l'objectif Capital + message ; garde dans `CapitalGameView.tsx:97`.
5. Constantes de style des multiplicateurs ; application aux 5 modes du keypad Capital.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/domain/gotcha/gotcha.ts` | Validation |
| `views/GotchaGameView.tsx` | Aperçu, bouton |
| `components/game/CapitalKeypad.tsx`, `views/CapitalGameView.tsx` | Validation, couleurs |
| `components/game/multiplierStyles.ts` (nouveau, provisoire) | Convention de couleurs |
| `tests/unit/gotchaLogic.test.ts`, `capitalGameModel.test.ts`, `tests/unit/components/*`, `tests/e2e/*` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

Domaine Gotcha ; UI Capital/Gotcha ; aucun impact infrastructure.

## 6. Stratégie de migration

Aucune donnée persistée concernée.

## 7. Stratégie de test

Unitaires paramétrés, composants (refus, couleurs), E2E Gotcha.

## 8. Non-régression

Gotcha/Capital/X01 avec saisies valables ; objectif « Couleur ».

## 9. Rollback / désactivation

Revert du commit.

## 10. Documentation à mettre à jour avec l'implémentation

Référence des règles (spec 050 : CAP-R04 devient conforme, GOT-R… de la spec 053), notes de version.
