---
id: 002-counter-setup-clean-architecture
v2_id: null
type: fonctionnel
statut: cloturee
validation: validee
statut_reel: "Clôturée le 2026-11-23 : frontière local-first vérifiée ; reliquat (découpe de SetupView) transféré à V2-ARCH-01."
traitement_propose: "Clôturer après vérification (reliquat vers V2-ARCH-01)."
decision_traitement: validee
issue: null
transfere_a: [V2-ARCH-01]
verifie_au_commit: 863b4bd
derniere_revue: 2026-11-23
---
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

## Clôture (2026-11-23)

Vérifiée au commit `863b4bd` (`origin/develop`) ; décision du product owner du 2026-11-23 (spec 032, Q4, #215).

Critères vérifiés :

- Aucun flux de jeu ne dépend d'un backend : le seul appel réseau applicatif est la voix optionnelle (`src/features/x01/voice/deepgramClient.ts`) ; le port de synchronisation est un emplacement vide (`src/application/scoring/ports.ts:10`, `SyncRepository = Record<string, never>`).
- Logique de score testable hors UI : `createMatch` (`src/application/scoring/matchLifecycle.ts:83`), `submitTurn` (l.265), `undoTurn` (l.305) ; tests `tests/unit/application/matchLifecycle.test.ts`, `matchStats.test.ts`, verts.
- Persistance locale obligatoire : `IndexedDBSessionRepository.saveAppSession` (`src/infrastructure/local/IndexedDBSessionRepository.ts:58`) et `getCurrentMatch` (l.109) ; tests `indexedDbSessionRepository.test.ts` et `tests/unit/app/appShell.test.ts`, verts.

Écart documentaire : le point d'entrée canonique `undoLastThrow` n'existe pas ; l'annulation se fait par `undoTurn`.

Reliquat transféré : la tâche « Continuer la décomposition de `SetupView` par sections métier » → V2-ARCH-01 ([spec 056](../056-counter-arch-layer-boundaries/spec.md)).
