# Plan — 053 Killer et Gotcha : variantes et règles de référence

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison du cadre commun (spec 049) pour ces deux jeux.

## 1. Lecture de l'existant

- Killer : `src/domain/killer/killer.ts:29-189`, `views/KillerGameView.tsx:29-260`.
- Gotcha : `src/domain/gotcha/gotcha.ts:28-131`, `views/GotchaGameView.tsx:66-180`.
- Setup : `src/features/game-setup/setupModel.ts:174-195`, `setupPresentation.ts:79-94`.
- Tests : `tests/unit/killerLogic.test.ts`, `tests/unit/gotchaLogic.test.ts`.

## 2. Approche retenue (et alternatives écartées)

Paramétrer le domaine Killer (`startingLives`, ordre après attribution), afficher le journal existant, réutiliser l'overlay commun. Écartée : refonte de la saisie Killer pour le mode « marques » (Q2, reportée).

## 3. Étapes

1. Golden tests Killer/Gotcha (référence §8).
2. `createKillerState(players, startingPlayerIndex, startingLives)` ; `clampLives` borné par l'option.
3. Ordre conservé après attribution (`killer.ts:71-72`).
4. Option « Vies » au setup ; règles affichées dynamiques.
5. Composant journal partagé (Killer, Gotcha).
6. Overlay du premier joueur (spec 049) dans les deux vues.
7. Publication de la référence Killer/Gotcha.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/domain/killer/killer.ts` | Vies paramétrées, ordre |
| `views/KillerGameView.tsx`, `views/GotchaGameView.tsx` | Journal, cœurs, overlay |
| `src/features/game-setup/setupModel.ts`, `setupPresentation.ts`, `views/SetupView.tsx` | Option et règles |
| `types.ts` | `killerLives` |
| `docs/regles/` (spec 050) | Référence Killer/Gotcha |
| `tests/unit/killerLogic.test.ts`, `gotchaLogic.test.ts`, `tests/e2e/*` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

Domaine Killer ; UI (setup, journal) ; aucun impact infrastructure.

## 6. Stratégie de migration

Option absente = 3 vies.

## 7. Stratégie de test

Unitaires domaine, composant journal, E2E Killer 5 vies.

## 8. Non-régression

Killer 3 vies, Gotcha, historique local.

## 9. Rollback / désactivation

Masquer l'option « Vies » (défaut 3) ; revert de l'ordre si besoin.

## 10. Documentation à mettre à jour avec l'implémentation

Référence des règles, specs 017 et 019 (révision V2), règles affichées, notes de version.
