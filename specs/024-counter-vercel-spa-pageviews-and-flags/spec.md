# Spec 024 - counter vercel spa pageviews and flags

## Meta

- ID: `024-counter-vercel-spa-pageviews-and-flags`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Rendre les ecrans logiques de l application visibles dans Vercel Web Analytics `Pages` et faire remonter des `Flags` coherents pour la navigation SPA du compteur de darts.

## Decisions

- l integration conserve `@vercel/analytics/react` au bootstrap pour rester compatible avec le build Vite deploie par Vercel depuis GitHub
- les changements d ecran internes de la SPA emettent des `pageview` manuels avec une route stable et lisible par ecran
- les flags applicatifs restent construits dans la couche domaine et synchronises via le port analytics
- les `pageview` manuels sont emis apres synchronisation des flags pour permettre l attribution des donnees de page aux flags actifs
- les evenements custom conservent la clean architecture existante sans couplage direct a React

## Invariants critiques

- aucune logique Vercel ne remonte dans la couche presentation hors orchestration `App.tsx`
- le mapping ecran -> route est deterministe et ne depend pas du navigateur
- la solution reste valide quand le build est declenche par GitHub puis deploye sur Vercel
- les `Pages` Vercel distinguent les grands ecrans applicatifs meme si l URL du navigateur ne change pas

## Impacted Code

- `App.tsx`
- `src/application/observability/analyticsPort.ts`
- `src/application/observability/analyticsUseCases.ts`
- `src/domain/observability/analyticsDomain.ts`
- `src/infrastructure/observability/vercelAnalyticsAdapter.ts`
- `tests/unit/observability/analyticsApplication.test.ts`

## Canonical Entry Points

- `trackPageView`
- `buildAnalyticsPageView`
- `createVercelAnalyticsPort`

## Key Tests

- `tests/unit/observability/analyticsApplication.test.ts`
- `npm run test:unit -- tests/unit/observability/analyticsApplication.test.ts`
- `npm run typecheck`

## Validation

- un changement d ecran SPA emet un `pageview` manuel avec un `route` et un `path` metiers stables
- la synchronisation de flags precede l emission du `pageview` manuel
- les evenements custom existants continuent a etre delegues sans regression