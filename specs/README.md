# Specs Locales - Bougnat_darts_counter

## Ou ecrire une spec

- nouvelle spec: `specs/NNN-counter-sujet/`
- contrat inter-repos majeur: preferer une spec transverse au workspace puis referencer ici

## Categories locales

- `counter-scoring-*`
- `counter-offline-*`
- `counter-sync-*`
- `counter-app-shell-*`
- `counter-backend-adapter-*`

## Specs actives

- `001-counter-scoring-access-modes`
  - slug: `spec:counter/scoring-access-modes`
  - statut: `active`
  - milestone: `M5: Offline-first UX`
- `002-counter-setup-clean-architecture`
  - slug: `spec:counter/offline-scoring-terminal-foundation`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`

## Structure minimale d'une spec

- `spec.md`
- `plan.md`
- `tasks.md`

## Quand utiliser ce repo plutot qu'une spec transverse

Utiliser une spec locale si le changement reste majoritairement:

- dans l'architecture React/TypeScript;
- dans le moteur de jeu;
- dans les adapters frontend;
- dans les flows de session locale, voice scoring ou integration remote optionnelle.

## Regle de versioning

Tout le contenu de `specs/` et `.specify/` de ce repo doit etre versionne dans ce repo.
