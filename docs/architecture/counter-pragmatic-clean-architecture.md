# Counter Pragmatic Clean Architecture (archive v1.0.0)

## Objectif

Ce document conserve la trace de la direction v1.0.0. La référence courante de l'architecture est `docs/architecture.md`.

Stabiliser `Bougnat_darts_counter` comme application open source de scoring, sans backend metier obligatoire et sans logique produit proprietaire dans le runtime supporte.

## Principes retenus

- gameplay first : ne jamais casser la saisie, les regles et la fluidite de match
- spec-driven : les responsabilites sont documentees avant les gros deplacements de code
- Clean Architecture pragmatique : domaine, use cases, infrastructure et UI restent lisibles sans multiplier les couches gratuitement
- offline-first : la session locale reste la voie nominale

## Frontieres concretes

- `domain/`
  - regles de scoring pures
  - entites et value objects
- `application/`
  - use cases explicites
  - ports
  - orchestration metier
- `infrastructure/`
  - IndexedDB
  - persistence locale
  - adapters remotes optionnels
- `features/`
  - state and helpers for complex features
  - setup flow and X01 scoring helpers
- `application/scoring/`
  - `matchLifecycle.ts` for match setup and turn progression
  - `matchStats.ts` for stats and checkout analysis
- `views/` et `components/`
  - presentation React
  - interaction scoreur

## Decision v1.0.0

La release `v1.0.0` retire du runtime supporte :

- authentification
- lobby
- social
- profils distants
- historique cloud
- sync de document partage mutable

La separation n est pas seulement produit, elle est aussi structurelle :

- le coeur de scorage ne depend plus de Supabase
- les flux supportes sont jouables sans backend
- les integrations futures devront revenir par contrats explicites

## Migration restante

Les prochaines etapes utiles apres `v1.0.0` sont :

1. continuer l extraction des use cases implicites hors des vues lourdes
2. renforcer la tracabilite spec -> code -> tests
3. brancher les futurs modes connectes uniquement via ports applicatifs
