---
id: 019-counter-gotcha-game
v2_id: null
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Implémentée (5 tests unitaires)."
traitement_propose: "Conserver ; variantes dans V2-GAMES-13 (spec 053)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 019 - Counter Gotcha Game

> Complément 2.2.0 : à plus de deux joueurs, l'ordre complet est choisi avant la partie ; les joueurs peuvent jouer les places après la victoire ou terminer avec un classement calculé. Voir la [spec 136](../136-counter-multiplayer-rankings/spec.md) ; la recette reste à faire.

## Objectif

Ajouter le jeu Gotcha comme mode local du compteur, avec une interface lisible jusqu'a 6 joueurs et des regles metier testables hors React.

## Perimetre

- 2 a 6 joueurs.
- Aucun robot.
- Pas de doublettes.
- Score cible configurable (301 par defaut, presets 301/501/701, valeur perso).
- Saisie du total de visite, avec 3 flechettes par tour.

## Parcours joueur

### E1 - Configuration

- Gotcha apparait dans la selection des jeux.
- Le setup limite les joueurs a 6.
- Les options robot et doublettes sont absentes.
- Le score cible est affiche et configurable.

### E2 - Tour

- Le joueur courant saisit le total marque sur sa visite.
- Le total est ajoute a son score courant.
- Si le score depasse la cible, le tour est casse et le score reste identique.
- Apres une visite valide ou cassee, le tour passe au joueur suivant.

### E3 - Gotcha

- Si le score obtenu par le joueur courant correspond exactement au score d'un ou plusieurs adversaires encore en jeu, ces adversaires reviennent a zero ; les joueurs déjà classés ne peuvent plus être remis à zéro (spec 136).
- Un score a zero ne peut pas tuer un adversaire.
- Le Gotcha s'applique apres l'ajout du score du tour et avant le passage au joueur suivant.

### E4 - Victoire

- Le premier joueur qui atteint exactement le score cible gagne.
- Aucun double n'est requis pour finir.
- Si le joueur depasse la cible, il ne gagne pas et conserve son score precedent.

## Invariants

1. Le jeu refuse moins de 2 joueurs et plus de 6 joueurs.
2. Le score cible doit etre positif.
3. Une visite doit etre comprise entre 0 et 180 points.
4. Un bust ne modifie aucun score.
5. Un Gotcha remet uniquement les adversaires au meme score que le joueur courant.
6. Une victoire exacte arrête le duel ; à plus de deux joueurs, les places peuvent être jouées avant la fin (spec 136).

## Traceabilite

- Domaine: `src/domain/gotcha/gotcha.ts`
- UI: `views/GotchaGameView.tsx`
- Setup: `src/features/game-setup/setupModel.ts`
- Tests: `tests/unit/gotchaLogic.test.ts`
