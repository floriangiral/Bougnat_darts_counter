# Spec 007 - counter release governance v1.0.x

## Meta

- ID: `007-counter-release-governance-v1-0-x`
- Statut: `active`
- Milestone cible: `M7: Open Source Release v1.0.1`
- Issues GitHub: `#77`

## Objectif

Formaliser une gouvernance de release `v1.0.x` reproductible entre `develop`, `release/*`, `main`, tags et PR, sans ambiguite de flux.

## Decisions

- une release part de `develop` vers `release/x.y.z`
- la PR vers `main` est obligatoire, sans merge automatique
- les checks release sont executes sur la branche release
- `develop` reste realigne apres mise a jour de la release

## Invariants critiques

- aucun commit fourre-tout
- aucun merge direct sur `main`
- traceabilite commit/spec/issue obligatoire

## Impacted Code

- `docs/release/v1.0.1.md`
- `docs/release/v1.0.1-coverage-map.md`
- workflows `promote-*`

## Canonical Entry Points

- `release/1.0.1`
- PR `release/* -> main`

## Key Tests

- `npm run ci:check`
- `npm run test:e2e`
- verification de la coherence des branches et tags

## Validation

- release branch a jour avec develop
- PR ouverte vers main
- tag aligne sur le commit release valide
