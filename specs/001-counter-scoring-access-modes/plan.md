# Plan

1. Introduire modele de mode d'acces app shell
2. Brancher les garde-fous de navigation
3. Stabiliser la distinction entre surfaces de scorage et surfaces neutres
4. Ajouter tests unitaires cibles

## Révision V2 — plan proposé

> Plan proposé, à exécuter seulement après validation de la Révision V2 de la spec. Le plan historique ci-dessus est conservé.

### Approche
Table unique `MODE_POLICIES` (écrans autorisés, écran d'entrée, capacités) dans `src/shared/` ou `src/app/`, garde appliqué dans la navigation d'`App`, détection du mode `spectator` avant la restauration de session. Aucune dépendance ajoutée.

### Étapes
1. Après la spec 070 : retirer la lecture du mode dans `src/features/tablet/tabletLayout.ts` ; adapter l'E2E tablette (spec 042).
2. Déplacer `AppAccessMode` vers `src/shared/` ; créer la table `MODE_POLICIES` et ses tests.
3. Réécrire `isScreenAllowedForAccessMode` à partir de la table ; l'appeler dans `App.tsx` (navigation, restauration) et `useAppScreenHistory`.
4. Mode `dedicated_tablet` : écran d'entrée, confirmation de sortie, reprise automatique.
5. Mode `spectator` : point d'entrée détecté avant `getRestoredAppSession`, chargement paresseux d'un écran d'attente ; branchement de la projection quand les specs 084/085 sont livrées.
6. `personal_phone` : alias vers `local` (selon Q3).
7. Mettre à jour la documentation.

### Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/app/appShell.ts` | Table des modes, garde réel |
| `src/shared/` (type de mode) | Création / déplacement |
| `App.tsx`, `src/app/useAppScreenHistory.ts` | Application du garde, entrée `spectator` |
| `src/features/tablet/tabletLayout.ts`, `useTabletLayout.ts` | Plus de lecture du mode (après 070) |
| `tests/unit/app/appShell.test.ts`, `tests/e2e/tablet-layout.smoke.spec.ts`, `tests/e2e/navigation.smoke.spec.ts` | Tests mis à jour |
| `.env.local.example`, `docs/technical.md`, `docs/architecture/scoring-access-modes.md` | Documentation des modes |

### Migration
Aucune donnée persistée ; les URL existantes `?mode=dedicated_tablet` et `?mode=personal_phone` restent valides.

### Tests
Unitaires (résolution, table, garde) ; intégration `App` (redirection) ; E2E par mode.

### Rollback
Revert de la PR ; le mode `local` par défaut garantit l'absence d'impact pour l'usage courant.
