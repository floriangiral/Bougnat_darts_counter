# Spec 013 - counter stats french clean architecture

## Meta

- ID: `013-counter-stats-french-clean-architecture`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Traduire les ecrans de statistiques en francais en respectant une approche spec-driven et clean architecture.

## Decisions

- `matchStats` retourne uniquement des structures numeriques et factuelles
- aucun texte de presentation dans la couche application
- les libelles FR sont centralises dans un module unique de presentation
- le formatage (pourcentages, resumes checkout, details) est realise dans un presenter FR cote UI

## Invariants critiques

- la logique metier de calcul stats reste identique
- aucun label stats en dur dans les composants stats
- les ecrans stats affichent du francais coherent
- sorties `matchStats` testables sans dependance UI

## Impacted Code

- `src/application/scoring/matchStats.ts`
- `components/stats/StatsModal.tsx`
- `views/StatsView.tsx`
- `views/CricketStatsView.tsx`
- `views/CapitalStatsView.tsx`
- `views/TriathlonStatsView.tsx`
- `components/triathlon/TriathlonStatsModal.tsx`
- `src/presentation/stats/statsLabels.fr.ts`
- `src/presentation/stats/statsPresenter.fr.ts`

## Canonical Entry Points

- `calculateDetailedStats*`
- `presentX01DetailedStats`
- `STATS_LABELS_FR`

## Key Tests

- `tests/unit/application/matchStats.test.ts`
- `tests/unit/presentation/stats/statsPresenter.fr.test.ts`
- `tests/unit/presentation/stats/statsLabels.fr.test.ts`
- `npm run typecheck`
- `npm run lint`

## Validation

- `matchStats` ne contient plus de chaines localisees
- labels centralises et reutilises sur les ecrans stats
- presenter FR convertit correctement les structures numeriques en texte UI
