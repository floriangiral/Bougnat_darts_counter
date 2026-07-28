# Spec 015 - counter x01 simple two player limit

## Meta

- ID: `015-counter-x01-simple-two-player-limit`
- Statut: `active`
- Milestone cible: `M2: Game Modes Stability`
- Issues GitHub: `#to-create`

## Objectif

Limiter le mode X01 en format SIMPLE a un maximum de 2 joueurs.

## Decisions

- appliquer la limite dans la logique de domaine setup (source of truth)
- aligner l UI setup pour proposer uniquement `1` et `2`
- normaliser aussi les donnees pre-remplies pour eviter les etats invalides

## Invariants critiques

- X01 SIMPLE ne depasse jamais 2 joueurs
- X01 DOUBLES reste a 4 joueurs (2v2)
- CRICKET et TRIATHLON conservent leurs regles existantes

## Impacted Code

- `src/features/game-setup/setupModel.ts`
- `views/SetupView.tsx`
- `tests/unit/gameSetup/setupModel.test.ts`

## Key Tests

- `tests/unit/gameSetup/setupModel.test.ts`
- `npm run typecheck`

## Validation

- impossible de selectionner plus de 2 joueurs en X01 SIMPLE
- un prefill X01 SIMPLE > 2 joueurs est automatiquement ramene a 2
- typage TypeScript valide
