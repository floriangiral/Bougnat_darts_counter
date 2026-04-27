# Spec 009 - counter env contract and validation

## Meta

- ID: `009-counter-env-contract-and-validation`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Definir un contrat d environnement explicite et verifiable par cible (`dev`, `preprod`, `production`) pour reduire les incidents de configuration.

## Decisions

- distinguer variables requises, optionnelles et deprecation
- valider en amont des promotions les variables critiques
- afficher des erreurs actionnables avec contexte cible
- eviter la duplication incoherente des contrats env entre scripts/workflows/docs

## Invariants critiques

- aucune cle privee exposee cote client
- aucune variable obsolete requise par erreur
- fallback explicite sur les options non critiques

## Impacted Code

- `src/lib/env.ts`
- `scripts/deployment-check.mjs`
- `.env.local.example`
- `README.md`

## Canonical Entry Points

- `deployment-check.mjs`
- `readPublic` / `env` mapping

## Key Tests

- `npm run env:check`
- `npm run preprod:check`
- `npm run production:check`

## Validation

- contrat env unique et coherent dans doc + scripts
- aucun warning ambigu sur variables critiques
