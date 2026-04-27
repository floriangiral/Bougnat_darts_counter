# Spec 017 - Counter Killer Game

## Objectif

Ajouter le jeu Killer comme mode local du compteur, avec une interface guidee pour chaque phase et des regles metier testables hors React.

## Perimetre

- 2 a 6 joueurs.
- Aucun robot.
- Pas de doublettes.
- Attribution manuelle et unique d'un numero de survie par joueur.
- Partie en 3 vies, elimination simple, dernier survivant vainqueur.

## Parcours joueur

### E1 - Configuration

- Le jeu Killer apparait dans la selection des jeux.
- La configuration limite les joueurs a 6.
- Les options robot et doublettes sont absentes.

### E2 - Attribution

- Chaque joueur recoit un numero unique entre 1 et 20, ou Bull.
- L'ecran indique le joueur qui doit lancer avec sa main faible.
- Si le numero est deja pris, il n'est plus selectionnable.
- Quand tous les numeros sont attribues, la partie passe a la phase de jeu.

### E3 - Devenir Killer

- Un joueur non Killer doit toucher son propre double pour devenir Killer.
- Tant qu'il n'est pas Killer, il ne peut pas retirer de vie a un adversaire.
- Un joueur non Killer qui touche son propre double recupere aussi une vie, sans depasser 3.

### E4 - Chasse

- Un Killer retire une vie quand il touche le double d'un adversaire vivant.
- Un Killer qui touche son propre double perd une vie.
- Chaque joueur dispose de 3 flechettes par tour.
- A 0 vie, le joueur est elimine.

### E5 - Fin

- La partie se termine quand un seul joueur reste en vie.
- L'ecran final affiche le vainqueur et permet de revenir au choix des jeux.

## Invariants

1. Le jeu refuse moins de 2 joueurs et plus de 6 joueurs.
2. Les numeros attribues sont uniques.
3. Les vies restent entre 0 et 3.
4. Seul un Killer peut infliger une perte de vie a un adversaire.
5. Un joueur elimine ne joue plus et ne peut plus etre cible utile.

## Traceabilite

- Domaine: `src/domain/killer/killer.ts`
- UI: `views/KillerGameView.tsx`
- Setup: `src/features/game-setup/setupModel.ts`
- Tests: `tests/unit/killerLogic.test.ts`, `tests/unit/gameSetup/setupModel.test.ts`
