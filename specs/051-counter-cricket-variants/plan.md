# Plan — 051 Cricket : variantes Cut-throat et multi-manches

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison du reducer Cricket (spec 058).

## 1. Lecture de l'existant

- Logique : `utils/cricketLogic.ts:25-140`.
- Modèle : `src/features/cricket/cricketGameModel.ts:62,107-140`.
- Vue : `views/CricketGameView.tsx:47-211`.
- Setup : `src/features/game-setup/setupModel.ts:152-158`, `views/SetupView.tsx:330-366`, `components/game-setup/*`.
- Types : `types.ts:75-84` (`CricketMatchSummary`), `GameConfig`.

## 2. Approche retenue (et alternatives écartées)

Paramétrer la logique pure par une variante (`STANDARD` / `CUT_THROAT`) et ajouter une couche « match » (manches) au reducer Cricket de la spec 058. Écartées : vue dédiée Cut-throat (duplication) ; implémentation avant la spec 058 (aggrave l'état éclaté de la vue).

## 3. Étapes

1. Golden tests Cut-throat (sources citées dans la spec) et multi-manches.
2. `processCricketHit(…, variant)` et `checkCricketWin(…, variant)` ; classement aux tours selon la variante.
3. Reducer de match Cricket : manches, alternance, résumé.
4. Setup : options variante et manches (repliées), normalisation.
5. Écran de fin de manche (via le cadre de la spec 049).
6. Statistiques cumulées et détail par manche.
7. Règles affichées.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `utils/cricketLogic.ts` (ou `src/domain/cricket/`) | Variante |
| `src/features/cricket/cricketGameModel.ts` | Match en manches |
| `views/CricketGameView.tsx` | Fin de manche |
| `src/features/game-setup/setupModel.ts`, `views/SetupView.tsx`, `components/game-setup/*` | Options |
| `types.ts` | `cricketVariant` |
| `views/CricketStatsView.tsx`, `components/stats/CricketStatsModal.tsx` | Statistiques |
| `src/features/game-setup/setupPresentation.ts` | Règles |
| `tests/unit/cricketLogic.test.ts`, `cricketGameModel.test.ts`, `tests/e2e/*` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

Domaine : variante. Application : match en manches. UI : setup, fin de manche, statistiques. Infrastructure : aucun.

## 6. Stratégie de migration

Champ optionnel `cricketVariant` (absent = Standard) ; `legsToWin` existant ramené à 1 pour les configurations Cricket héritées sans choix explicite.

## 7. Stratégie de test

Golden tests, tests de reducer, E2E deux scénarios ; défauts comparés aux golden tests actuels (AC-04).

## 8. Non-régression

Cricket Standard 1 manche, Triathlon, revanche, statistiques.

## 9. Rollback / désactivation

Options masquées par une constante de build si un défaut est découvert ; les données restent lisibles.

## 10. Documentation à mettre à jour avec l'implémentation

Référence des règles (spec 050), règles affichées, README (formulation Cricket), notes de version.
