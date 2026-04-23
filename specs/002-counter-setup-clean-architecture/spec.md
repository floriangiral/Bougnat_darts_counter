# Spec 002 - counter setup clean architecture

## Meta

- ID: `002-counter-setup-clean-architecture`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#70`, `#71`

## Objectif

Rendre explicite la frontiere entre le noyau de scorage open source et les integrations externes afin de garantir une release `v1.0.0` publiable sans dependance metier proprietaire.

## Decisions

- le mode local est la voie nominale pour `v1.0.0`
- les integrations distantes passent uniquement par des ports applicatifs
- le runtime supporte exclut auth metier, profils cloud, social/lobby et orchestration tournoi
- la persistance locale reste obligatoire pour la reprise de session

## Invariants critiques

- aucun flow de gameplay supporte ne doit dependre d'un backend
- la logique de scoring reste testable hors UI
- toute synchronisation distante est optionnelle et encapsulee

## Impacted Code

- `src/features/scoring-terminal/application/operationQueue.ts`
- `src/features/scoring-terminal/infra/sync/tournamentApiAdapter.ts`
- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/app/appShell.ts`

## Canonical Entry Points

- `ScoringTerminalOperationQueue.enqueueScoreVisit`
- `ScoringTerminalOperationQueue.processPending`
- `ScoringTerminalOperationQueue.resync`
- `TournamentApiScoringSyncAdapter.submitScoreVisit`

## Key Tests

- `tests/unit/scoringTerminal/operationQueue.test.ts`
- `tests/unit/application/indexedDbSessionRepository.test.ts`
- `tests/unit/app/appShell.test.ts`

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run build`
