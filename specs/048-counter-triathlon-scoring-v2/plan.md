# Plan — 048 Triathlon : barème v2 versionné

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et arbitrage du barème (Q1, Q2).

## 1. Lecture de l'existant

- Barème : `src/domain/triathlon/triathlonScoringRules.ts:13-84` ; types `src/domain/triathlon/triathlonTypes.ts`.
- Calcul : `utils/triathlonScoring.ts:57-121` (bonus, rangs), `:150-246` (501), `:248-310` (Cricket), `:312-411` (Capital), `:413-452` (assemblage).
- Flux : `src/features/triathlon/triathlonFlow.ts:144-166` ; `views/TriathlonGameView.tsx:128-208`.
- Persistance du résultat : `src/app/useGameLifecycle.ts:111-128` ; type `types.ts:136` (`TriathlonResults`).
- Affichage : `views/TriathlonStatsView.tsx:26-35`, `components/triathlon/*` ; règles `src/features/game-setup/setupPresentation.ts:68-78`.

## 2. Approche retenue (et alternatives écartées)

Caractériser la v1 (golden tests), puis introduire la v2 comme **nouvelle table de règles** (`TRIATHLON_SCORING_RULES_V2`, `version: 2`) et des fonctions de critères pures ; la v1 reste dans le code le temps de garder ses tests de caractérisation, puis est supprimée (les résultats v1 sont stockés, pas recalculés). Écartée : modification en place sans version (perte de traçabilité).

## 3. Étapes

1. Golden tests v1 (caractérisation, y compris C1 à C7).
2. Golden tests v2 validés métier (cas §19 de la spec).
3. Fonctions de critères v2 (position de sortie via spec 045, First-9 via `matchStats`, visites ≥ 100, fermeture complète, meilleure progression Capital).
4. Rang Cricket sur `winnerId` (+ égalité).
5. `awardBonus` / `awardLowestBonus` : RM-02.
6. `scoringVersion` dans `TriathlonResults`, `finalizeTriathlonResults`, historique.
7. Affichage de la version et du barème (statistiques, règles).
8. Déplacement éventuel vers `src/domain/triathlon/` (selon spec 056).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/domain/triathlon/triathlonScoringRules.ts`, `triathlonTypes.ts` | Barème v2, version |
| `utils/triathlonScoring.ts` | Critères v2, RM-02, rang Cricket |
| `src/features/triathlon/triathlonFlow.ts`, `types.ts` | `scoringVersion` |
| `src/app/useGameLifecycle.ts` | Version dans l'historique |
| `views/TriathlonStatsView.tsx`, `components/triathlon/*` | Affichage version et libellés |
| `src/features/game-setup/setupPresentation.ts` | Règles (barème) |
| `tests/unit/triathlonScoring.test.ts`, `triathlonFlow.test.ts` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

Domaine : barème et critères. Application : version du résultat. UI : affichage. Infrastructure : aucun changement de stockage (champ additionnel dans `payload`).

## 6. Stratégie de migration

Lecture tolérante : `scoringVersion` absent = v1 ; aucune réécriture des entrées existantes.

## 7. Stratégie de test

Golden tests v1 puis v2, test de somme maximale, tests de symétrie (ordre de jeu), test d'affichage de la version.

## 8. Non-régression

Enchaînement Capital → Cricket → 501 → tie-break ; statistiques ; revanche.

## 9. Rollback / désactivation

Constante `TRIATHLON_SCORING_VERSION` permettant de revenir à la v1 le temps d'une release si un défaut est découvert (les deux tables coexistent jusqu'à validation terrain).

## 10. Documentation à mettre à jour avec l'implémentation

Règles affichées, référence des règles (spec 050), `docs/specifications.md`, notes de version (mention du changement de barème).
