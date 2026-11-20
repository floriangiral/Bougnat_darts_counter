# Plan — 070 Résolveur unique classes de taille et orientation

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

> **Réalisation (2026-11-20)** : étapes 1 à 6 réalisées (module `src/features/layout/`, hook unique, attributs racine, `MatchView` sans détection locale, `dedicated_tablet` = forçage tactile) ; étape 7 réalisée par suppression directe de `src/features/tablet/`. Restent le retrait de `data-layout`, les captures V2-QA-05 et la recette terrain. Détail : section « Implémentation (2026-11-20) » de la spec.

## 1. Lecture de l'existant
- `src/features/tablet/tabletLayout.ts:22-62`, `useTabletLayout.ts:5-37`.
- `App.tsx:213-220` (`layoutMode`, `usePortraitLock`), `App.tsx:322-327` (attributs racine, overlay).
- `views/MatchView.tsx:104`, `:246-266`, `:691`, `:694`, `:715` (`isCompactBrowserMobile`).
- `components/game/PlayerScore.tsx:124` (variable de taille du score selon `compactMobileBrowser`).
- `tests/unit/tabletLayout.test.ts`, `tests/e2e/tablet-layout.smoke.spec.ts:17`, `playwright.config.ts:24-51`.

## 2. Approche retenue (et alternatives écartées)
Classes de taille + orientation + modalité (ADR 0007). Écartées : ajuster les seuils actuels (reste binaire et fragile) ; user-agent (non fiable, iPadOS « bureau »).

## 3. Étapes
1. Écrire la table de vérité en test (rouge) à partir des profils du rapport 06.
2. Implémenter `resolveViewportClass` (pur) dans `src/features/layout/viewportClass.ts`.
3. Hook `useViewportClass` (resize, orientationchange, `any-pointer`) ; stabilisation clavier virtuel.
4. `App.tsx` : poser les nouveaux attributs ; dériver `data-layout` pour la CSS existante.
5. Remplacer `isCompactBrowserMobile` de `MatchView` par la densité/la recette passée en props.
6. Redéfinir `dedicated_tablet` (Q1) en coordination avec V2-ARCH-12.
7. Retirer `TABLET_BREAKPOINTS` ; marquer `tabletLayout.ts` comme déprécié puis le supprimer quand la CSS n'utilise plus `data-layout`.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/layout/viewportClass.ts`, `useViewportClass.ts` | Création |
| `src/features/tablet/tabletLayout.ts`, `useTabletLayout.ts` | Dépréciation puis suppression |
| `App.tsx` | Attributs racine, source unique |
| `views/MatchView.tsx`, `components/game/MatchPlayerArea.tsx`, `PlayerScore.tsx` | Suppression de la détection parallèle |
| `tests/unit/layout/viewportClass.test.ts` | Table de vérité |
| `tests/unit/tabletLayout.test.ts` | Remplacé |

## 5. Impacts UI / domaine / application / infrastructure
Présentation et `features/layout` (pur). Domaine et application inchangés.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Contrat CSS : `data-layout` dérivé pendant la transition, puis retrait coordonné avec V2-TAB-03.

## 7. Stratégie de test
Unitaires (table de vérité, 100 %), E2E réalistes (V2-QA-09), captures téléphone/bureau inchangées (V2-QA-05), terrain.

## 8. Non-régression
Tests smoke téléphone, tablette, bureau ; reprise X01 ; spec 021.

## 9. Rollback / désactivation
Le dérivé `data-layout` permet de revenir à l'ancienne fonction de classification par un seul changement d'import (commit isolé).

## 10. Documentation à mettre à jour avec l'implémentation
ADR 0007, `docs/architecture` (module layout), notes de release (tablettes mieux reconnues).
