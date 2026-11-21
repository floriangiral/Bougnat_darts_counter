# Plan — 060 Registre de jeux

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et seulement si le déclencheur (Q1) est atteint.

## 1. Lecture de l'existant
- Aiguillage : `utils/arenaFlow.ts:1-13`, `App.tsx:353-422`, `src/app/useGameLifecycle.ts:60-201`, `src/app/appShell.ts:10-80`.
- Setup : `src/features/game-setup/{setupModel,setupPresentation,setupViewModel}.ts`, `views/SetupView.tsx`, `views/GameSelectionView.tsx`.
- Persistance : `src/shared/session/persistedAppSession.ts`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : descripteur `GameModule` statique + registre typé.
- Écartées : chargement dynamique/plugins (aucun besoin), DSL de règles (sur-ingénierie).

## 3. Étapes
1. Définir `GameModule` et le registre ; enregistrer X01 seul et brancher `App` (preuve de concept).
2. Enregistrer les cinq autres jeux.
3. Brancher la sélection, le setup, `useGameLifecycle` (fin de partie générique) et `appShell` (écrans dérivés).
4. Brancher la persistance (spec 010) et, si validée, la TV (spec 089).
5. Supprimer les `switch` et conditions par jeu devenus inutiles.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/app/gameRegistry.ts` | Création |
| `src/domain/<jeu>/module.ts` (ou `src/features/<jeu>/module.ts`) | Descripteur par jeu |
| `App.tsx`, `src/app/appShell.ts`, `src/app/useGameLifecycle.ts`, `utils/arenaFlow.ts` | Aiguillage via le registre |
| `views/GameSelectionView.tsx`, `views/SetupView.tsx`, `src/features/game-setup/*` | Lecture du registre |

## 5. Impacts UI / domaine / application / infrastructure
UI identique ; application : composition centralisée ; domaine inchangé ; infrastructure : clé `gameType` inchangée.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune : identifiants de jeux conservés.

## 7. Stratégie de test
Jeu factice de test ; typage exhaustif ; E2E existants et spec 040 ; mesure de bundle.

## 8. Non-régression
Parcours des six jeux ; lien partenaire ; restauration.

## 9. Rollback / désactivation
PR par étape ; retour à l'aiguillage explicite par `git revert`.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (ajouter un jeu), `CONTRIBUTING.md`, futur `AGENTS.md` (spec 036).
