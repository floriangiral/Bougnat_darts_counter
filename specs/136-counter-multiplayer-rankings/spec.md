---
id: 136-counter-multiplayer-rankings
v2_id: V2-GAMES-35
titre: Classement complet à plusieurs et places jouées hors X01
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande explicite du product owner (2026-11-27)
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [132-counter-x01-order-and-placements, 047-counter-cricket-end-of-game, 017-counter-killer-game, 019-counter-gotcha-game, 130-counter-180-around-the-clock]
issue: '#360'
verifie_au_commit: 37bdd5d
derniere_revue: 2026-11-27
---

# 136 — Classement complet à plusieurs et places jouées hors X01

> **Implémentée pour la 2.2.0, validation terrain en attente :** le product owner a demandé d'étendre le « vrai classement à plusieurs » du X01 à tous les jeux sauf le Triathlon, puis a délégué le choix des règles (« choisis l'option pragmatique la plus alignée avec le contexte »). Les classements sont implémentés dans `916f91d`, l'ordre complet du 180 dans `37bdd5d` ; les règles restent à confirmer en recette (#360).

## Contexte

En X01 à 3 ou 4 joueurs, la spec 132 permet de jouer les places d'honneur et affiche le classement complet. Les autres jeux s'arrêtent au vainqueur (Cricket, Gotcha), au dernier survivant (Killer) ou n'affichent que le vainqueur (Capital). Le 180 Around the Clock affiche déjà un classement complet (spec 130). La spec 132 excluait « les places pour les autres jeux » : cette spec les traite.

## Décisions (2026-11-27, choix délégué par le product owner)

Exigences validées par la demande d'implémentation, puis implémentées. `validation: en-attente` désigne la recette terrain, pas la validation des exigences.

| # | Question | Décision |
|---|---|---|
| Q1 | Jeux concernés | Cricket, Gotcha, Killer, Capital et 180 Around the Clock ; X01 inchangé (spec 132) ; Triathlon exclu. |
| Q2 | Jeux où l'on peut jouer les places | Ceux qui s'arrêtent au premier vainqueur : Cricket (simple, 3 ou 4 joueurs) et Gotcha (3 à 6 joueurs), sur le modèle du X01. |
| Q3 | Killer | Classement par ordre inverse des éliminations, sans prolongation. |
| Q4 | Capital et 180 Around the Clock | Tous les joueurs vont déjà au bout : classement complet au score, ex æquo à score égal. |
| Q5 | Seuil d'affichage | Le classement complet n'est affiché qu'au-delà de deux joueurs ; le duel ne change pas. |
| Q6 | Ordre de passage avant de jouer | Précision explicite du product owner : au-delà de deux joueurs, définir **tout l'ordre**, pas seulement le premier lanceur, comme en X01. Cricket simple, Gotcha, Killer, Capital et 180 Around the Clock ; Triathlon exclu. |

## Règles

- RM-01 Au-delà de deux joueurs, l'écran de fin de Cricket, Gotcha, Killer et Capital affiche le classement complet (rang, prénom, score ou statut) ; le 180 Around the Clock garde le sien. À deux joueurs, l'écran de fin ne change pas.
- RM-02 Cricket en simple à 3 ou 4 joueurs, hors Triathlon : quand un joueur gagne et qu'il reste au moins deux joueurs non classés, une fenêtre propose « Jouer la 2ᵉ place » ou « Terminer la partie ». Scores et marques sont conservés ; les joueurs classés ne lancent plus. Le premier non classé qui a tout fermé avec un score au moins égal au meilleur score des non classés prend la place suivante. La limite de tours s'applique aux non classés.
- RM-03 Gotcha à 3 joueurs ou plus : même fenêtre après chaque joueur qui atteint exactement la cible. Les classés ne jouent plus et ne peuvent plus être remis à zéro ; le premier non classé qui atteint exactement la cible prend la place suivante.
- RM-04 Le choix revient après chaque place tant qu'il reste au moins deux joueurs non classés ; le dernier est classé automatiquement.
- RM-05 « Terminer la partie » (ou la limite de tours au Cricket) classe les joueurs restants : Cricket par score, numéros fermés puis marques ; Gotcha par score décroissant. Les égalités parfaites partagent le même rang (1, 2, 2, 4).
- RM-06 Killer : le survivant est 1ᵉʳ, puis les éliminés du dernier au premier éliminé. Une partie sauvegardée avant cette spec, sans ordre d'élimination, classe ses éliminés ex æquo derrière le survivant.
- RM-07 Capital : classement au score décroissant, ex æquo à score égal.
- RM-08 Le vainqueur enregistré reste le premier à gagner (résumés et statistiques inchangés). Le Cricket en doublettes, le Cricket et le Capital du Triathlon, et le X01 ne changent pas.
- RM-09 Annuler depuis la fenêtre de choix revient avant le coup gagnant. Une partie sauvegardée reprend avec ses places et la fenêtre de choix ; les nouveaux champs d'état sont optionnels et validés (`playPlacements`, `placedIds`, `awaitingPlacementChoice` au Cricket ; `placedIds`, `status` au Gotcha ; `eliminatedIds` au Killer).
- RM-10 Au-delà de deux joueurs en simple, chaque jeu concerné ouvre « Ordre de passage » avant toute saisie : on touche les joueurs dans l'ordre souhaité, le dernier est placé automatiquement, puis « Valider ». Aucune fléchette ni durée de jeu n'est enregistrée avant validation. La liste validée pilote toute la rotation et persiste dans les sauvegardes. Une partie déjà démarrée dans une ancienne sauvegarde conserve son ordre sans nouvelle demande. Solo, duel, doublettes et Triathlon sont inchangés.

## Critères d'acceptation

- CA-01 Cricket à 3 joueurs : fenêtre après la victoire, place jouée sans le classé, « Terminer » donne un classement calculé avec ex æquo, 4ᵉ automatique après la 3ᵉ à 4 joueurs ; duel et doublettes inchangés (tests `tests/unit/cricketGameModel.test.ts` et vue Cricket).
- CA-02 Gotcha à 3 joueurs : fenêtre, rotation sans le classé, classé jamais remis à zéro, classement au score avec ex æquo ; duel inchangé ; ancienne sauvegarde terminée reconnue (tests `tests/unit/gotchaLogic.test.ts` et vue Gotcha).
- CA-03 Killer : survivant puis éliminés en ordre inverse ; ancienne sauvegarde ex æquo (tests `tests/unit/killerLogic.test.ts`, `tests/unit/components/killerGameView.test.tsx`).
- CA-04 Capital à 4 joueurs : classement complet avec ex æquo (test `tests/unit/components/capitalKeypad.test.tsx`).
- CA-05 Les validateurs de session acceptent les nouveaux champs et refusent les valeurs incohérentes ; les anciennes sauvegardes restent acceptées (`tests/unit/session/gameRuntimeValidation.test.ts`).
- CA-06 Dans les cinq jeux concernés, un ordre non trivial choisi à trois ou quatre joueurs pilote les tours et se retrouve après rechargement ; la saisie et le chronomètre sont bloqués tant que l'ordre n'est pas validé (tests de vues Cricket, Gotcha, Killer, Capital et `tests/unit/atc180/atc180GameView.test.tsx`).

## Mise en œuvre

- Classement commun : `src/features/rankings/finalRanking.ts` (`rankWithPlayedPlaces`) et `components/game/FinalRankingList.tsx`.
- Fenêtre de choix : `components/match/PlacementPromptDialog.tsx`, partagée avec le X01 (texte et bouton de fin paramétrables).
- Killer : `eliminatedIds` dans `src/domain/killer/killer.ts`, façade `src/features/killer/killerRanking.ts`.
- Capital : `getCapitalFinalRanking` dans `src/features/capital/capitalGameModel.ts`.
- Cricket : `src/features/cricket/cricketGameModel.ts`, `utils/cricketLogic.ts`, `views/CricketGameView.tsx` (prop `playPlacements`, activée par `App.tsx` hors Triathlon).
- Gotcha : `src/domain/gotcha/gotcha.ts`, façade `src/features/gotcha/gotchaPlacement.ts`, `views/GotchaGameView.tsx`.
- Validation de session : `src/features/game-session/gameRuntime.ts`.
- Ordre complet : composant existant `components/game/ThrowOrderOverlay.tsx`, permutation validée par `src/features/game-setup/throwOrder.ts`. `hasGameStarted` existant en Cricket, Capital et 180 Around the Clock ; champ optionnel rétrocompatible pour Killer ; confirmation de l'ordre optionnelle dans l'état Gotcha.

## Hors périmètre

- Triathlon (classement par barème, spec 048) et X01 (spec 132).
- Places jouées au Killer, au Capital et au 180 Around the Clock.
- Statistiques ou historique enrichis du classement.
