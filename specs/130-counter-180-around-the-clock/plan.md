# Plan — 130 Nouveau jeu « 180 Around the Clock »

> Plan exécuté le 2026-11-20 à la demande directe du product owner (spec au statut `implementee`).

## 1. Lecture de l'existant
- Domaines purs Killer et Gotcha (`src/domain/killer/killer.ts`, `src/domain/gotcha/gotcha.ts`) : état sérialisable, fonctions pures.
- Écrans `views/KillerGameView.tsx` et `views/GotchaGameView.tsx` : `GameScreenLayout`, `GameHeader`, `KeypadGrid`/`KeypadKey`/`KeypadActionRow`, `ConfirmExitDialog`, écran de fin dans la vue.
- « Qui commence ? » : `components/game/StartingPlayerOverlay.tsx` (comme Capital et Cricket).
- Reprise : `src/features/game-session/gameRuntime.ts`, `storedSessionCodec.ts`, `src/app/sessionRecovery.ts`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : état = volées terminées + volée en cours ; tour, joueur courant, classement et annulation dérivés. Écran de fin dans la vue (restaurable), revanche par `handleRematch` et remontage de la vue (`key`).
- Écartée : pile d'annulation dans la vue (inutile, l'état suffit) ; écran `ATC180_STATS` séparé (une donnée de résultat de plus dans la session, sans gain).

## 3. Étapes
1. Domaine `src/domain/atc180/atc180.ts` et tests golden.
2. Type de jeu et écran (`utils/arenaFlow.ts`, `src/app/appScreens.ts`, `src/app/appShell.ts`, `externalMatchStartup.ts`, `sessionRecovery.ts`).
3. Configuration (`setupModel.ts`, `setupPresentation.ts`, `setupViewModel.ts`).
4. Session : `Atc180RuntimeSnapshot`, validation, codec.
5. Vue `views/Atc180GameView.tsx`, CSS `src/styles/games/atc180.css`, câblage `App.tsx` et `useGameLifecycle.ts`.
6. Tokens d'identité (`themes.css`, `bridge.css`), test de contraste.
7. Tests unitaires, E2E écrit, documentation.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/domain/atc180/atc180.ts` | Nouveau (pur) |
| `views/Atc180GameView.tsx`, `src/styles/games/atc180.css` | Nouveaux |
| `utils/arenaFlow.ts`, `src/app/appScreens.ts`, `src/app/appShell.ts`, `src/app/sessionRecovery.ts`, `src/features/external-match/externalMatchStartup.ts` | Type `ATC180`, écran `ATC180_GAME` |
| `src/app/useGameLifecycle.ts`, `App.tsx`, `types.ts` | Fin de partie, revanche, rendu de l'écran |
| `src/shared/session/persistedAppSession.ts`, `src/features/game-session/gameRuntime.ts`, `storedSessionCodec.ts` | Instantané et validation |
| `src/features/game-setup/setupModel.ts`, `setupPresentation.ts`, `setupViewModel.ts` | 1 à 4 joueurs, règles, résumé |
| `components/layout/GameScreenLayout.tsx` | `GameScreenId` += `atc180` |
| `src/styles/tokens/themes.css`, `bridge.css`, `src/styles/tailwind.css` | Identité `game-atc180-*`, import CSS |
| `views/GameSelectionView.tsx` | Carte ajoutée par le chantier de refonte de la sélection (hors de ce plan) |

## 5. Impacts UI / domaine / application / infrastructure
UI : nouvel écran de jeu et de fin. Domaine : nouveau module pur. Application : cycle de vie et historique local. Infrastructure : aucune nouvelle clé.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Ajout rétrocompatible : aucune session existante ne contient `ATC180`. Pas de changement de `APP_SESSION_SCHEMA_VERSION`.

## 7. Stratégie de test
Unitaires (domaine golden, vue, session, configuration, cycle de vie, contraste) ; E2E `tests/e2e/atc180.smoke.spec.ts` exécuté en CI ; seuils de couverture de la spec 029.

## 8. Non-régression
Parcours de base, autres jeux, reprise de session, contraste des identités.

## 9. Rollback
Retirer `ATC180` de `GameType` et des listes d'écrans ; une session restaurée avec `ATC180` serait alors écartée et annoncée (spec 010).
