---
id: 132-counter-x01-order-and-placements
v2_id: V2-GAMES-33
titre: X01 à 3 ou 4 joueurs — ordre de passage et places jouées
type: fonctionnel
statut: cloturee
validation: validee
origine: Demande explicite du product owner (2026-11-24)
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [052-counter-x01-three-four-players, 030-counter-external-match-link]
issue: https://github.com/floriangiral/Bougnat_darts_counter/issues/342
verifie_au_commit: 7d90e54
derniere_revue: 2026-11-27
---

# 132 — X01 à 3 ou 4 joueurs : ordre de passage et places jouées

> **Validation en attente :** le défaut du lien partenaire à quatre joueurs simples, interprété en doublettes dans le tag `v2.1.0`, est corrigé et intégré dans `main` par la PR #349. Les places fixes sont prévues pour la 2.2.0 (`5df8ef0`). La recette terrain et les E2E restent à vérifier (#342).

## Contexte

En X01 à 3 ou 4 joueurs en simple (spec 052), on ne choisit que le joueur qui commence ; l'ordre suivant est celui de la saisie des prénoms et n'est affiché nulle part. En fin de match, seul le vainqueur est joué : les places suivantes sont calculées (RM-03 de la spec 052). Le product owner veut savoir qui joue 1ᵉʳ, 2ᵉ, 3ᵉ, 4ᵉ et pouvoir, sans obligation, jouer les places d'honneur.

## Décisions du product owner (2026-11-24)

| # | Question | Décision |
|---|---|---|
| Q1 | Ordre de passage à 3 ou 4 joueurs | Défini avant la première fléchette, **obligatoirement**. |
| Q2 | Départ des manches | L'ordre est respecté : manche 1 → n° 1, manche 2 → n° 2, et ainsi de suite, y compris aux changements de set. |
| Q3 | Volées jouées pour une place | Comptent dans les moyennes. |
| Q4 | 2 contre 2 (et duel) | Rien ne change. |
| Q5 | Robot | Joue les places comme les autres joueurs. |
| Q6 | Lien partenaire | Doit embarquer ces informations (podium, classement final). |

Décisions complémentaires du 2026-11-24, après une première livraison :

| # | Question | Décision |
|---|---|---|
| Q7 | Où se joue une place | **Dans la manche en cours**, en poursuivant l'ordre de passage à partir des restes de chacun (pas de nouvelle manche). |
| Q8 | Limite de volées pendant une place | **Elle s'applique** : quand chaque camp non classé a joué ses volées, départage au bull entre eux et saisie du gagnant, qui prend la place. |
| Q9 | Égalité au classement calculé | Les camps à égalité partagent le même rang. |

Décision complémentaire du 2026-11-27 (affichage à 3 ou 4 joueurs) :

| # | Question | Décision |
|---|---|---|
| Q10 | Disposition des cartes à 3 ou 4 joueurs | Sur téléphone, tablette et ordinateur : **places fixes** dans l'ordre de passage (n° 1 en haut à gauche, n° 2 en haut à droite, n° 3 en bas à gauche, n° 4 en bas à droite) ; quatre cartes de même taille, seul le cadre du joueur actif se déplace. Le joueur qui a commencé la partie est signalé. Duel et 2 contre 2 inchangés. |

## Règles

- RM-01 À 3 ou 4 camps en simple, l'écran « Ordre de passage » remplace « Qui commence ? » : on touche les joueurs dans l'ordre de passage, le dernier est placé automatiquement, puis « Valider ». « Recommencer » efface la sélection, « Quitter » sort du match. Impossible de jouer sans valider l'ordre.
- RM-02 L'ordre validé devient l'ordre de `players` ; le n° 1 ouvre le match. Il n'est plus modifiable après la première volée.
- RM-03 Chaque carte de joueur affiche son numéro d'ordre (1 à 4) ; le joueur qui a commencé porte aussi la pastille « D » (RM-11).
- RM-04 Manche suivante : ouverte par le joueur suivant celui qui a ouvert la manche terminée (n° 1, n° 2, n° 3…) ; à 3 ou 4 camps, cette règle s'applique aussi aux changements de set (pas de retour à l'ouvreur du match).
- RM-05 Quand un camp gagne le match et qu'il reste au moins deux camps non classés, une fenêtre propose « Jouer la 2ᵉ place » ou « Terminer le match ». Le même choix revient après chaque place jouée tant qu'il reste au moins deux camps non classés ; quand il n'en reste qu'un, il est classé dernier automatiquement.
- RM-06 Pendant une place, les camps déjà classés ne lancent plus ; les autres poursuivent la manche en cours dans l'ordre de passage. Un trop, une ouverture, la saisie vocale, l'annulation et le robot fonctionnent comme d'habitude. La limite de volées par manche s'applique aux camps non classés : quand chacun a joué ses volées dans la manche, la fenêtre « Départage au bull » ne propose qu'eux et le camp désigné prend la place en jeu.
- RM-07 Une place jouée n'ajoute ni manche ni set gagné. Ses volées comptent dans les moyennes, les scores et les statistiques de checkout (tentatives, réussites, meilleur finish).
- RM-08 Classement de fin : les places jouées d'abord, dans l'ordre où elles ont été obtenues, puis les camps restants selon RM-03 de la spec 052 (manches, reste). L'écran de fin distingue les places jouées du classement calculé ; le texte partagé contient le classement.
- RM-09 Lien partenaire (spec 030, contrat `v=1` inchangé et rétrocompatible) : le lien accepte en option `p3` et `p4` (simple uniquement, `p4` exige `p3`). Le retour ajoute pour chaque camp `legsN`, `setsN` (mode sets), `avgN`, `n180_N`, `hcoN` (avec `stats=1`) et `winner=N`. À 3 ou 4 camps seulement, il ajoute `rankN` (rang final de chaque camp) et `places` (nombre de rangs obtenus en jouant, vainqueur compris). Un lien à 2 joueurs produit exactement le même retour qu'avant.
- RM-10 Une partie sauvegardée reprend avec son ordre, ses places et la fenêtre de choix si elle était affichée ; l'état de partie validé accepte le champ optionnel `placement`.
- RM-11 Sur tous les écrans, à 3 ou 4 camps en simple, les cartes occupent une grille 2 × 2 dans l'ordre de passage, sans rotation : n° 1 en haut à gauche, n° 2 en haut à droite, n° 3 en bas à gauche, n° 4 en bas à droite ; à 3 joueurs, la case en bas à droite reste vide. Les quatre cartes ont la même taille ; le joueur actif est signalé par un cadre contrasté, un fond accentué et le repère ▶, sans déplacement de carte ni agrandissement. L'emplacement du finish conseillé est réservé sur chaque carte. Une pastille « D » (« A commencé la partie ») à gauche du nom signale le joueur qui a ouvert le match. Les camps déjà classés gardent leur place.

## Critères d'acceptation

- CA-01 À 3 ou 4 joueurs, la partie ne commence qu'après validation de l'ordre ; l'ordre choisi pilote la rotation et les numéros affichés (tests moteur et composant).
- CA-02 Les départs de manche suivent n° 1, n° 2, n° 3… y compris après un set (test moteur).
- CA-03 Après la victoire, « Terminer le match » conduit à l'écran de fin habituel ; « Jouer la 2ᵉ place » reprend la manche sans les camps classés ; à 4 joueurs, la 4ᵉ place est attribuée automatiquement après la 3ᵉ (tests moteur et vue).
- CA-03b Avec une limite de volées, une place non fermée se départage au bull entre les seuls camps non classés ; le gagnant saisi prend la place (tests moteur et vue).
- CA-04 Le duel et le 2 contre 2 sont inchangés (tests existants verts).
- CA-05 Les moyennes intègrent les volées de place ; le meilleur finish du vainqueur reste juste (test statistiques).
- CA-06 Le classement, l'écran de fin et le texte partagé reflètent les places jouées (tests classement et présentation).
- CA-07 Un lien `p1`…`p4` ouvre un match verrouillé à 4 joueurs ; le retour contient les paramètres par camp, `rankN` et `places` ; les URL dorées à 2 joueurs sont inchangées (tests contrat).
- CA-08 La reprise de session accepte et vérifie `placement` (test validateur).
- CA-09 Sur téléphone, tablette (portrait et paysage) et ordinateur, l'ordre des cartes ne change pas quand le tour passe ni après une nouvelle manche ou une place jouée ; seul le joueur actif change ; à 3 joueurs, la 4ᵉ case est vide ; les quatre cartes sont de même taille ; la pastille « D » n'apparaît que sur le joueur qui a ouvert le match. Le duel et les doublettes restent inchangés (tests `tests/unit/components/matchPresentation.test.tsx` et `tests/unit/x01/matchViewOrderAndPlacements.test.tsx`, « places fixes … sur tous les écrans » ; les tests couvrent téléphone portrait/paysage, tablette portrait/paysage et ordinateur).

## Hors périmètre

Doubles à plus de deux équipes ; tirage au sort de l'ordre ; modification de l'ordre en cours de match. Les places pour les autres jeux relèvent de la spec 136.

## Références

- Spec 052 (RM-01, RM-03) : rotation et classement calculé, complétés ici.
- Spec 030 : contrat du lien partenaire `v=1`.
- `docs/specifications.md`, section « Rotation des joueurs X01 (simple et doubles) ».


## Clôture (2026-11-27)

- Périmètre livré en production `2.2.0`, vérifié dans l'arbre du commit `7d90e54` : [`views/MatchView.tsx`](../../views/MatchView.tsx) et [`tests/e2e/x01-four-players.smoke.spec.ts`](../../tests/e2e/x01-four-players.smoke.spec.ts).
- Recette validée par le product owner le 27/11/2026 : « toutes les recettes sont faites depuis la mise en prod » et « Tout a été testé ». Cette confirmation globale ne reconstitue ni une liste d'appareils ni des mesures non consignées.
- Preuves de CI et de production : [bilan de recette 2.2.0](../../docs/release/v2.2.0.md#recette-validée-le-27112026). Aucun E2E ni smoke exécuté localement.
- Aucun reliquat de recette dans ce périmètre ; les propositions V2 distinctes ne sont pas validées par cette clôture.
