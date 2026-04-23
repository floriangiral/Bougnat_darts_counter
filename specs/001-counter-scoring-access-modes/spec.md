# Spec 001 - counter scoring access modes

## Meta

- ID: `001-counter-scoring-access-modes`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#70`

## Objectif

Rendre explicites les modes applicatifs:

- `social`
- `dedicated_tablet`
- `personal_phone`

Et aligner le payload scoring sur les regles backend.

Dans `v1.0.0`, cette spec couvre uniquement les frontieres de mode et les contrats frontend. Elle ne reintroduit aucune dependance runtime obligatoire a un backend.

## Decisions

- app shell expose une resolution de mode (query param > env > fallback)
- en mode `dedicated_tablet` / `personal_phone`, seules les routes scoring restent accessibles
- le mapper scoring envoie `client_mode` au backend
- `source_device_id` uniquement en `dedicated_tablet`

## Impacted Code

- `src/app/appShell.ts`
- `src/features/scoring-terminal/application/mappers.ts`
- `src/features/scoring-terminal/index.ts`
- `src/lib/env.ts`

## Canonical Entry Points

- `getAppAccessMode`
- `isScreenAllowedForAccessMode`
- `toBackendSubmitScoreRequest`

## Key Tests

- `tests/unit/app/appShell.test.ts`
- `tests/unit/scoringTerminal/mappers.test.ts`

## Validation

- tests unitaires app shell (resolution + garde-fous)
- tests unitaires mapper scoring
