# Plan — 089 Interfaces TV des autres jeux

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison, jeu par jeu, de V2-ARCH-04 (058).

## 1. Lecture de l'existant

- `App.tsx:364-422` (vues sans `onStateChange`).
- `views/CricketGameView.tsx:47-69`, `utils/cricketLogic.ts:20`, `components/game/CricketScoreboard.tsx`.
- `views/CapitalGameView.tsx:50`, `src/features/capital/capitalGameModel.ts:147`, `utils/capitalLogic.ts:3`.
- `src/domain/killer/killer.ts:7-23`, `views/KillerGameView.tsx:31-34`.
- `src/domain/gotcha/gotcha.ts:3-26`, `views/GotchaGameView.tsx:69-90`.
- `src/features/triathlon/triathlonFlow.ts:4-11,69`, `views/TriathlonGameView.tsx:31`.

## 2. Approche retenue (et alternatives écartées)

Une projection pure par jeu, branchée sur l'état sérialisable fourni par 058, et un écran TV par `kind` réutilisant le socle 086. Écartés : remonter les `useState` actuels sans 058 (fige la dette, cf. `02-architecture.md` §8.1) ; un modèle d'affichage unique pour tous les jeux (refusé par la mission).

## 3. Étapes

Pour chaque jeu, dans l'ordre de livraison de 058 :
1. Écrire `project<Jeu>SpectatorView` et `derive<Jeu>Highlights` (purs) avec minimisation des noms et « derniers faits » typés.
2. Étendre `src/shared/broadcast/contract.ts` avec le `kind` du jeu (schéma 1).
3. Brancher le jeu dans `useSpectatorBroadcast` via l'état observable de 058.
4. Écrire l'écran `src/tv/<jeu>/` sur les composants communs de 086.
5. Activer « Diffuser » pour ce jeu.
6. Fixtures, captures de référence, E2E local.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/shared/broadcast/contract.ts` | Nouveaux `kind` |
| Modules de jeu (emplacement 058) `…/broadcast/*.ts` | Création (projections, temps forts) |
| `src/app/useSpectatorBroadcast.ts` | Sélection par jeu |
| `src/tv/{cricket,capital,killer,gotcha,triathlon}/*.tsx` | Création |
| Barres de partie des vues de jeu | Commande « Diffuser » |
| `tests/unit/broadcast/*`, `tests/unit/tv/*`, `tests/e2e/tv-*.spec.ts` | Création |

## 5. Impacts UI / domaine / application / infrastructure

UI : écrans TV, commande « Diffuser » dans chaque jeu. Domaine : aucun (lecture des états de 058). Application : projections. Infrastructure : aucune.

## 6. Stratégie de migration

Contrat additif ; un écran ancien affiche « jeu non pris en charge ». Aucune donnée persistée.

## 7. Stratégie de test

Unitaires sur fixtures produites par les reducers de 058 (dont annulation) ; tests de taille à 6 joueurs ; composants ; captures ; E2E local par jeu ; terrain 090 (grille Cricket à 5 m).

## 8. Non-régression

Golden tests de V2-QA-01 (039), tests de règles existants, écrans TV X01.

## 9. Rollback / désactivation

Commande « Diffuser » masquable par jeu (liste des `kind` activés) ; retrait d'un `kind` sans effet sur les autres.

## 10. Documentation à mettre à jour avec l'implémentation

Guide TV (037) par jeu ; `docs/architecture.md` (projections par jeu).
