# Spec 022 — Architecture : Découpage Single Responsibility

**Slug** : `spec:counter/arch-single-responsibility-split`
**Statut** : `delivered` (v1.0.2)
**Milestone** : M6 — Architecture & Technical Cleanup

## Contexte

`App.tsx`, `views/MatchView.tsx` et `src/features/game-setup/setupModel.ts` avaient évolué en god objects dépassant 500–900 lignes. Chaque fichier portait plusieurs responsabilités : state management, effets secondaires, présentation, orchestration.

Cette concentration rendait les fichiers difficiles à lire, à tester et à faire évoluer.

## Objectif

Découper chaque fichier central en modules à responsabilité unique, sans modifier le comportement observable de l'application.

## Périmètre

- `App.tsx` → lifecycle handlers extraits dans `src/app/useGameLifecycle.ts`
- `views/MatchView.tsx` → timer extrait dans `src/features/x01/hooks/useMatchTimer.ts`, shortcuts dans `src/features/x01/hooks/useMatchShortcuts.ts`
- `src/features/game-setup/setupModel.ts` → fonctions présentation extraites dans `src/features/game-setup/setupPresentation.ts`
- Analytics singleton extrait dans `src/lib/analyticsInstance.ts`

## Hors périmètre

- Comportements UI
- Logique de scoring
- Règles métier des jeux
- Flux de navigation

## Contraintes

- Aucune régression sur les 120 tests unitaires existants
- CI vert obligatoire après chaque sous-tâche
- Aucune feature exploratoire introduite
