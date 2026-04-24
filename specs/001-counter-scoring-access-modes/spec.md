# Spec 001 - counter scoring access modes

## Meta

- ID: `001-counter-scoring-access-modes`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#70`

## Objectif

Rendre explicites les modes applicatifs :

- `social`
- `dedicated_tablet`
- `personal_phone`

Cette spec couvre uniquement les frontieres de mode et les contrats frontend. Elle ne reintroduit aucune dependance runtime obligatoire a un backend et ne modifie pas les regles de scoring.

## Decisions

- l app shell expose une resolution de mode (query param > env > fallback)
- en mode `dedicated_tablet` / `personal_phone`, seules les surfaces de scorage restent accessibles
- la resolution du mode reste locale, explicite et testable
- le mode ne change pas les regles de score, seulement les surfaces visibles

## Impacted Code

- `src/app/appShell.ts`
- `src/lib/env.ts`
- `views/HomeView.tsx`
- `views/MatchView.tsx`

## Canonical Entry Points

- `getAppAccessMode`
- `isScreenAllowedForAccessMode`
- `resolveAppAccessMode`

## Key Tests

- `tests/unit/app/appShell.test.ts`

## Validation

- tests unitaires app shell (resolution + garde-fous)
