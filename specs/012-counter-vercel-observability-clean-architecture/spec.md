# Spec 012 - counter vercel observability clean architecture

## Meta

- ID: `012-counter-vercel-observability-clean-architecture`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Reprendre et stabiliser l observabilite Vercel (Web Analytics + flags) avec une architecture propre, testable et explicite.

## Decisions

- centraliser la convention events/flags dans une couche domain pure
- passer par un port applicatif `AnalyticsPort` pour decoupler App des details Vercel
- encapsuler l integration Vercel dans un adapter infrastructure
- garder les points de tracking applicatifs existants (`game_selected`, `game_started`, `game_finished`)
- conserver l emission DOM `data-flag-values` pour enrichir les events avec les feature flags

## Invariants critiques

- aucune regression sur les events existants
- aucun appel direct a `@vercel/analytics` depuis `App.tsx`
- la synchronisation des flags DOM reste active a chaque variation de contexte de jeu
- payloads compatibles avec les types acceptes par Vercel

## Impacted Code

- `App.tsx`
- `src/domain/observability/*`
- `src/application/observability/*`
- `src/infrastructure/observability/*`
- `docs/technical.md`

## Canonical Entry Points

- `buildGameFeatureFlags`
- `syncFeatureFlags`
- `trackGameEvent`
- `createVercelAnalyticsPort`

## Key Tests

- `tests/unit/observability/analyticsDomain.test.ts`
- `tests/unit/observability/analyticsApplication.test.ts`
- `npm run typecheck`
- `npm run lint`

## Validation

- conventions analytics lisibles et centralisees
- App consomme un use-case applicatif, pas un SDK
- tests unitaires couvrent mapping flags/events + orchestration
