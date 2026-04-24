# Scoring Terminal Offline-First Foundation (archive v1.0.0)

## But

Ce document conserve la trace de la direction v1.0.0. La base courante de persistence locale est décrite dans `docs/architecture.md`.

Poser une base technique robuste pour un futur mode connecte, sans imposer aujourd hui de backend metier a l application open source.

## Ce qui est deja en place

- persistence locale IndexedDB
- reprise de session locale
- historique local
- debuts de ports et adapters pour une future sync

## Ce qui est volontairement absent de v1.0.0

- backend scoring obligatoire
- attribution distante de cibles
- protocoles reseau finalises
- resolution de conflits complete cote UI

## Regle de conception

L offline-first doit etre pense comme :

- un comportement applicatif explicite
- une persistence locale robuste
- des contrats optionnels vers l exterieur

et non comme :

- une consequence implicite de la vue
- un couplage fort a un transport ou a une plateforme donnee
