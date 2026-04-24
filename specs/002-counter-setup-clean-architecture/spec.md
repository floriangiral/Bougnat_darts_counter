# Spec 002 - counter setup clean architecture

## Meta

- ID: `002-counter-setup-clean-architecture`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#71`

## Objectif

Rendre explicite la frontière entre le noyau de scorage open source, la persistence locale et les integrations externes afin de garantir une release `v1.0.1` publiable sans dependance metier proprietaire.

## Decisions

- le mode local est la voie nominale pour `v1.0.1`
- les integrations distantes passent uniquement par des ports applicatifs
- le runtime supporte exclut auth metier, profils cloud, social/lobby et orchestration tournoi
- la persistance locale reste obligatoire pour la reprise de session

## Invariants critiques

- aucun flow de gameplay supporte ne doit dependre d'un backend
- la logique de scoring reste testable hors UI
- toute synchronisation distante est optionnelle et encapsulee

## Impacted Code

- `src/application/scoring/matchLifecycle.ts`
- `src/application/scoring/matchStats.ts`
- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/app/appShell.ts`
- `views/MatchView.tsx`

## Canonical Entry Points

- `createMatch`
- `submitTurn`
- `undoLastThrow`
- `IndexedDBSessionRepository.saveAppSession`
- `IndexedDBSessionRepository.getCurrentMatch`

## Key Tests

- `tests/unit/application/matchLifecycle.test.ts`
- `tests/unit/application/matchStats.test.ts`
- `tests/unit/application/indexedDbSessionRepository.test.ts`
- `tests/unit/app/appShell.test.ts`

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
