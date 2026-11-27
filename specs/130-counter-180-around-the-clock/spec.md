---
id: 130-counter-180-around-the-clock
v2_id: V2-GAMES-31
titre: Nouveau jeu « 180 Around the Clock » (1 à 4 joueurs, sans variante)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande du product owner (2026-11-20)
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 23
depend_de: [V2-TAB-03, V2-FR-01]
remplace: []
remplacee_par: []
issue: '#351'
verifie_au_commit: 37bdd5d
derniere_revue: 2026-11-27
---

# 130 — Nouveau jeu « 180 Around the Clock » (1 à 4 joueurs, sans variante)

> **Statut : IMPLÉMENTÉE** le 2026-11-20 sur `feat/v2.0.0`, complétée pour la 2.2.0 au commit `37bdd5d` (ordre complet, suppression de « Passer », progression solo). La recette terrain (téléphone portrait/paysage, tablette portrait/paysage, bureau, Dark et Light) et la validation de l'E2E en CI restent à suivre dans #351 (`validation: en-attente`).

## 1. Origine et contexte
Demande du product owner (2026-11-20) : ajouter le jeu « 180 Around the Clock » (règles de référence : <https://dolfdarts.com/fr/games/180-around-the-clock>), de 1 à 4 joueurs, **sans aucune variante**, intégré dans la même lignée que les autres jeux (sélection, configuration, écran de jeu à zones, reprise de session, écran de fin, revanche).

## 2. Problématique
Aucun jeu d'entraînement « tour de cible » centré sur la précision au triple : X01, Cricket, Capital, Triathlon, Killer et Gotcha ne couvrent pas cet usage.

## 3. Objectifs
- Jouer une partie complète de 20 tours, de 1 à 4 joueurs, avec une saisie fléchette par fléchette en un appui par fléchette.
- Mêmes garanties que les autres jeux : annulation, reprise après rechargement (spec 010), sortie confirmée, Dark/Light, tous les modes d'affichage (specs 070-072).

## 4. État actuel vérifié dans le code
- [vérifié] Avant cette spec, aucun type de jeu `ATC180` dans `utils/arenaFlow.ts`.
- [vérifié] Modèle suivi : domaine pur Killer/Gotcha (`src/domain/killer/killer.ts`, `src/domain/gotcha/gotcha.ts`), écran sur `GameScreenLayout` (`components/layout/GameScreenLayout.tsx`), briques `components/game/controls`, CSS par jeu `src/styles/games/<jeu>.css`, reprise via `src/features/game-session/gameRuntime.ts` et `storedSessionCodec.ts`.

## 5. Comportement cible
Le joueur choisit « 180 Around the Clock » dans la sélection, saisit 1 à 4 prénoms et lance la partie ; à deux, « Qui commence ? » désigne le premier lanceur ; à 3 ou 4, l'ordre complet est choisi (spec 136). Chaque fléchette est saisie avec TRIPLE, DOUBLE, SIMPLE ou MISS ; seule la 3e fléchette termine la volée. Après le 20e tour de chacun, l'écran de fin affiche le classement (ex aequo possibles), le total, le score par tour, le taux de triples et le meilleur tour, et propose Revanche, Annuler la dernière fléchette ou Retour aux jeux.

## 6. Périmètre
### Inclus
- Domaine pur, intégration application (type de jeu, écran, cycle de vie, historique local), configuration, écran de jeu, écran de fin, revanche, reprise de session, identité visuelle `game-atc180-*` (Dark et Light).
### Exclu
- Toute variante (ordre inversé, Bull final, départage, handicap, nombre de tours réglable) : décision du product owner « pas de variante ».
- Doublettes, robot, voix, lien de match partenaire, statistiques cloud.
- La carte de sélection est livrée dans `views/GameSelectionView.tsx` (`game-card-atc180`, `onSelect('ATC180')`, titre « 180 Around the Clock »).

## 7. User stories
- En tant que joueur seul, je veux m'entraîner au triple sur les 20 numéros et connaître mon total et mon niveau (repères 60 / 100 / 140+).
- En tant que groupe de 2 à 4 joueurs, je veux savoir qui a le meilleur total après 20 tours, avec les égalités annoncées ex aequo.

## 8. Règles métier
- RM-01 : 20 tours, un par numéro de 1 à 20 dans l'ordre croissant.
- RM-02 : à chaque tour, chaque joueur lance 3 fléchettes sur le numéro du tour ; tous les joueurs jouent le tour n avant le tour n+1, toujours dans le même ordre à partir du premier lanceur.
- RM-03 : par fléchette dans le numéro cible : triple = 3 points ; simple (grand ou petit) = 1 ; double = 1 ; autre numéro ou hors cible = 0.
- RM-04 : on avance quel que soit le résultat ; pas de bust, pas de pénalité.
- RM-05 : maximum 9 points par tour et 180 par partie ; score de départ 0.
- RM-06 : la partie se termine quand tous les joueurs ont joué leurs 20 tours ; le total le plus élevé gagne.
- RM-07 : égalité au meilleur total → vainqueurs ex aequo, sans départage (décision PO « pas de variante ») ; rang partagé (1, 1, 3).
- RM-08 : 1 joueur = entraînement : la partie se termine sur son total, situé par rapport aux repères débutant ~60, intermédiaire ~100, confirmé 140+ (affichage seulement).
- RM-09 : chaque fléchette est saisie explicitement ; une fléchette hors numéro est enregistrée avec MISS. Le bouton « Passer » est supprimé (demande du product owner du 2026-11-27). Les anciennes sauvegardes contenant des volées écourtées restent lisibles.

## Décision complémentaire du product owner (2026-11-27)

En entraînement solo, remplacer le tableau multi-joueurs par une progression visuelle des 20 tours. Chaque numéro montre son score réalisé, le tour courant se met à jour avec les points provisoires de la volée, et les tours à venir restent distincts. La grille s'adapte à l'orientation et à la largeur ; le tableau des joueurs reste inchangé à plusieurs.

## 9. Parcours utilisateurs
Ouvrir → Lancer une partie → « 180 Around the Clock » → prénoms (1 à 4) → Lancer la partie → premier lanceur à deux ou ordre complet à 3 ou 4 → 20 tours → écran de fin → Revanche ou Retour aux jeux.

## 10. Exigences fonctionnelles
- FR-01 : type de jeu `ATC180`, écran `ATC180_GAME`, plein écran et protection des mises à jour en cours de partie.
- FR-02 : configuration de 1 à 4 joueurs (prénoms, résumé « Tours : 20 (du 1 au 20) », règles du jeu), sans doublettes ni robot. Au-delà de deux joueurs, l'ordre complet est choisi avant de jouer (spec 136) ; à deux, seul le premier lanceur est choisi.
- FR-03 : écran de jeu sur `GameScreenLayout` (`data-game="atc180"`), en-tête `GameHeader` (pastille « 180 · Tour n/20 »), sortie confirmée (`ConfirmExitDialog`), noms ajustés (`FitText`).
- FR-04 : zone joueurs : joueur actif dominant (fond, barre, ▶, nom), total, numéro du tour très visible ; à plusieurs, tableau des joueurs (total, dernier tour, couronne du meneur) ; repères de niveau.
- FR-05 : zone de saisie : volée en cours (3 cases, points), touches TRIPLE (orange), DOUBLE (cyan), SIMPLE (neutre), MISS (danger) exposant `data-tone` / `data-multiplier` / `data-key`, puis Annuler seul sur toute la largeur.
- FR-06 : annulation d'une saisie à la fois, à travers les changements de joueur et de tour, y compris depuis l'écran de fin.
- FR-07 : écran de fin : classement, total sur 180, taux de triples, meilleur tour, score par tour (tableau de 20 colonnes), repère de niveau en entraînement ; Revanche, Annuler la dernière fléchette, Retour aux jeux.
- FR-08 : reprise après rechargement (spec 010) : instantané `{ gameType: 'ATC180', state, hasGameStarted, timing }` validé (structure puis invariants du domaine) ; un état incohérent est écarté et annoncé.
- FR-09 : historique local de la partie terminée (`atc180:<horodatage>`, vainqueur unique ou `null` en cas d'égalité).
- FR-10 : en solo, remplacer le tableau par une grille de progression des 20 numéros. Afficher les points de chaque tour terminé, actualiser la cible en cours avec les points provisoires, distinguer les tours à venir et indiquer les tours terminés ainsi que les repères 60 / 100 / 140+. Adapter le nombre de colonnes à l'orientation et à l'espace disponible ; garder les commandes et la carte du tour courant visibles.

## 11. Exigences non fonctionnelles
- NFR-01 : rôles de tokens uniquement ; identité `--bd-game-atc180-a/-b/-c/-fg` dans les deux thèmes, `-fg` ≥ 4,5:1 sur `surface` (test de contraste).
- NFR-02 : touches ≥ 44 px (téléphone), ≥ 48 px (arène), ≥ 64 px en tablette portrait (≥ 56 px sous 900 px de haut).
- NFR-03 : règles indépendantes de React (domaine pur), textes en français accentué.

## 12. Cas nominaux et alternatifs
- Nominal : 3 fléchettes saisies → volée close, joueur suivant ; dernier joueur du tour → numéro suivant.
- Alternatif : MISS pour une fléchette hors numéro ; « Annuler » à tout moment.

## 13. Cas limites
- 1 joueur : pas de « Qui commence ? », pas de cartes d'adversaires en tablette portrait.
- Tous les joueurs à égalité : tous vainqueurs ex aequo.
- Fin de partie annulée : retour sur le 20e tour ; la fin n'est pas signalée une seconde fois à l'historique.

## 14. Gestion des erreurs
Saisie ignorée après la fin de partie ou avant le choix du premier lanceur ; session relue incohérente écartée (spec 010).

## 15. Impacts architecturaux
Domaine pur `src/domain/atc180/atc180.ts` (aucune dépendance) ; l'état ne garde que les volées terminées et la volée en cours : tour, joueur courant, totaux, classement et annulation en sont dérivés (pas de pile d'annulation). Aucune nouvelle dépendance ni abstraction.

## 16. Impacts sur les données et les interfaces
Nouveau membre `Atc180RuntimeSnapshot` de `GameRuntimeSnapshot` ; `selectedGameType` accepte `ATC180` ; nouvel écran `ATC180_GAME`. Pas de changement de version du schéma (ajout rétrocompatible).

## 17. Compatibilité avec l'existant
Aucune règle d'un jeu existant modifiée ; sessions existantes inchangées.

## 18. Dépendances
Specs 010 (reprise), 066 (convention de la cible), 070-072 (recettes et zones).

## 19. Critères d'acceptation
- AC-01 : la sélection propose « 180 Around the Clock » (`game-card-atc180`) et ouvre la configuration (1 à 4 joueurs).
- AC-02 : golden : T1 + S1 + autre = 4 ; tour 17 T17 + D17 + S3 = 4 (78 → 82) ; 3 triples = 9 ; partie parfaite = 180.
- AC-03 : ordre : tous les joueurs jouent le tour n avant le n+1, à partir du premier lanceur choisi.
- AC-04 : égalité au meilleur total → vainqueurs ex aequo, rang partagé.
- AC-05 : annulation fléchette par fléchette à travers joueurs et tours, y compris depuis l'écran de fin.
- AC-06 : rechargement en cours de partie ou sur l'écran de fin : même état, sans nouveau signalement de fin.
- AC-07 : écran de fin : classement, total, score par tour, taux de triples, meilleur tour, Revanche.
- AC-08 : rendu correct en Dark et Light, téléphone portrait/paysage, tablette portrait (référence) et paysage, bureau (recette terrain).
- AC-09 : en solo, la grille présente une fois chacun les numéros 1 à 20, la cible courante et ses points provisoires évoluent après chaque fléchette, le score final du tour est conservé après la troisième, et la progression des tours terminés avance ; à plusieurs, le tableau et son comportement ne changent pas.

## 20. Scénarios de tests
- Unitaires : `tests/unit/atc180/atc180Domain.test.ts` (golden, ordre, annulation, classement, statistiques, cohérence), `atc180GameView.test.tsx` (zones, progression solo, `data-state`, saisie, annulation, fin, chronomètre, sortie, reprise), `atc180Session.test.ts` (validation, codec, restauration), `atc180Setup.test.ts` ; ajouts dans `tests/unit/app/useGameLifecycle.test.ts`, `tests/unit/arenaFlow.test.ts`, `tests/unit/designSystem/themeContrast.test.ts`.
- E2E : `tests/e2e/atc180.smoke.spec.ts` (2 joueurs, quelques volées, totaux), exécuté dans la CI de la PR.

## 21. Exigences de non-régression
Parcours de base, autres jeux, reprise de session, seuils de couverture (spec 029).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Carte de sélection livrée par un autre chantier | Jeu inaccessible | Faible | Identifiants imposés (`ATC180`, `game-card-atc180`), E2E dédié |
| Mise en page non vérifiée sur appareil | Confort | Moyenne | Recette terrain (AC-08) |

## 23. Décisions architecturales
- Annulation dérivée de l'état (pas de pile) : toute la partie reste annulable après un rechargement.
- Écran de fin dans la vue de jeu (comme Killer et Gotcha) : restaurable sans écran `*_STATS` supplémentaire ; la revanche remonte la vue (`key` = identifiant du match).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Départage en cas d'égalité ? | Aucun / manche supplémentaire / Bull | Aucun | Tranchée (PO, 2026-11-20) : ex aequo, pas de variante |
| Q2 | Nombre de joueurs ? | 1 à 4 / 2 à 6 | 1 à 4 | Tranchée (PO, 2026-11-20) : 1 à 4, 1 = entraînement |

## 25. Traçabilité
Demande du product owner (2026-11-20) ; règles <https://dolfdarts.com/fr/games/180-around-the-clock> ; plan [plan.md](plan.md), tâches [tasks.md](tasks.md).
