# Spec 025 - counter react 19 migration

## Meta

- ID: `025-counter-react-19-migration`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Faire migrer `Bougnat_darts_counter` de React 18.2 vers une cible React 19 de maniere progressive, spec-driven et compatible avec la clean architecture existante.

## Decisions

- la migration se fait en 3 phases distinctes: preparation en React 18.3, migration framework vers React 19, validation produit/runtime
- la phase 1 sert a absorber les warnings de transition React sans ouvrir un chantier fonctionnel annexe
- les adaptations de code restent limitees aux frontieres framework, types JSX et effets runtime sensibles
- les couches domain, application et infrastructure ne doivent pas etre refactorees sans besoin directement prouve par la migration React
- toute correction d effet non idempotent doit rester locale au composant, hook ou adapter qui controle reellement le lifecycle concerne
- la migration doit etre compatible avec le build GitHub puis le deploiement connecte deja en place

## Invariants critiques

- aucune regression fonctionnelle sur les parcours de jeux X01, Cricket, Capital, Killer, Gotcha et Triathlon
- aucune regression sur le scoring vocal, les websockets Deepgram, les timers, le PWA/service worker et la restauration de session
- aucune dependance React ne doit contourner les ports et adapters existants juste pour satisfaire la migration
- les tests existants restent verts avant et apres chaque phase
- la compatibilite legacy iOS/Safari reste un critere explicite de validation finale

## Impacted Code

- `package.json`
- `tsconfig.json`
- `index.tsx`
- `App.tsx`
- `src/app/**`
- `src/infrastructure/audio/**`
- `src/infrastructure/voice/**`
- `src/lib/**`
- `tests/**`

## Canonical Entry Points

- `index.tsx`
- `App.tsx`
- `src/hooks/useDeepgramStreaming.ts`
- `npm run ci:check`

## Key Tests

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`

## Validation

- React 18.3 ne remonte plus de warning de transition bloquant
- React 19 compile avec `@types/react@19` et `@types/react-dom@19`
- les hooks sensibles au lifecycle restent idempotents en dev sous `StrictMode`
- les parcours critiques sont verifies manuellement avant merge
