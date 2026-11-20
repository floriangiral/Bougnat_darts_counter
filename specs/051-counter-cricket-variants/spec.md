---
id: 051-counter-cricket-variants
v2_id: V2-GAMES-12
titre: Cricket — variantes Cut-throat et multi-manches
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: jeux
priorite: P2
difficulte: M
recommandation: optionnel
lot: 5
poids: 15
depend_de: [V2-ARCH-04]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 051 — Cricket : variantes Cut-throat et multi-manches

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Rapport `03-games.md` §2 et §3.2 : le Cricket ne propose qu'une variante (standard, une manche, limite de tours). Les pratiquants attendent le Cut-throat (surtout à 3 joueurs) et des matchs en plusieurs manches ; le setup pose d'ailleurs `legsToWin: 3` pour le Cricket sans l'utiliser. Compte rendu §F.2 (V2-GAMES-12, P2) et arbitrage **H.11** (variantes en V2 ou plus tard).

## 2. Problématique

Les groupes de 3 joueurs jouent en Cut-throat et les clubs jouent au meilleur des 3 ou 5 manches : le compteur les oblige à revenir à la feuille de papier.

## 3. Objectifs

- Proposer au setup Cricket : variante **Standard** / **Cut-throat**, et un format **1, 3 ou 5 manches gagnantes** (« premier à 1/2/3 »).
- Garder le parcours de base inchangé : valeurs par défaut = comportement actuel (Standard, 1 manche).

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | Points attribués au joueur qui marque (standard uniquement) | `utils/cricketLogic.ts:70-77` | [vérifié] |
| C2 | Victoire : tout fermé et score ≥ chaque adversaire | `utils/cricketLogic.ts:90-109` | [vérifié] |
| C3 | Une seule manche jouée : `handleLegWin` transmet `{ [winner]: 1 }` | `views/CricketGameView.tsx:106-108` | [vérifié] |
| C4 | Le setup pose `legsToWin: 3`, `setsToWin: 1` pour le Cricket, sans interface pour les modifier | `src/features/game-setup/setupModel.ts:152-158` ; section de format affichée pour le X01 seulement `views/SetupView.tsx:330-366` | [vérifié] |
| C5 | Le résumé prévoit déjà `legsWon`, `setsWon`, `currentSetLegsWon` | `types.ts:75-84`, `src/features/cricket/cricketGameModel.ts:107-124` | [vérifié] |
| C6 | État de partie dans 10 `useState` de la vue (non sérialisable, non persisté) | `views/CricketGameView.tsx:47-67` | [vérifié] |
| C7 | Le README laisse entendre une variante risquée (« peuvent rapporter gros — ou faire très mal ») | `README.md:34` | [vérifié] |

## 5. Comportement cible

Setup Cricket : choix « Standard / Cut-throat » et « Manches : 1 / 3 / 5 » (premier à 1 / 2 / 3). En Cut-throat, les points marqués sur un numéro ouvert sont **ajoutés à chaque adversaire qui ne l'a pas fermé**, et le vainqueur est le premier à tout fermer avec un score **≤** à chaque adversaire. En multi-manches, l'écran de fin de manche (spec 047/049) affiche le score en manches puis enchaîne la manche suivante ; le lanceur alterne à chaque manche.

## 6. Périmètre

### Inclus
Règles Cut-throat, format en manches, alternance du lanceur, statistiques agrégées sur le match, résumé de manches dans les statistiques, règles affichées.

### Exclu
Cricket « sans points » (Q3) ; Tactics (doubles/triples comme cibles) ; sets ; Cricket dans le Triathlon (reste Standard, 1 manche) ; contrat partenaire (V2-INT-05).

## 7. User stories

- En tant que groupe de 3 amis, je veux jouer en Cut-throat, afin que chacun puisse pénaliser le meneur.
- En tant que club, je veux jouer un Cricket au meilleur des 3 manches, afin de suivre notre format de rencontre.

## 8. Règles métier

- RM-01 Cut-throat : un point marqué sur un numéro fermé par le marqueur est ajouté à chaque adversaire qui n'a pas fermé ce numéro ; le marqueur ne gagne aucun point (sources : Wikipedia EN « Cricket (darts) », Wikipédia FR « Fléchettes » §Cut throat cricket).
- RM-02 Cut-throat : victoire = tout fermé et score ≤ chaque adversaire.
- RM-03 Limite de tours en Cut-throat : classement par score croissant, puis critères de la spec 047.
- RM-04 Multi-manches : premier à N manches ; chaque manche repart de zéro ; le premier lanceur alterne à chaque manche (rotation des joueurs/équipes).
- RM-05 Les statistiques de fin cumulent toutes les manches ; le détail par manche est disponible.

## 9. Parcours utilisateurs

Setup Cricket → (option) variante et manches → prénoms → jouer → fin de manche (score en manches, « Manche suivante ») → … → fin de match (spec 049).

## 10. Exigences fonctionnelles

- FR-01 Choix de variante et de nombre de manches au setup, valeurs par défaut Standard / 1 manche.
- FR-02 Règle de points paramétrée par la variante dans la logique pure (pas dans la vue).
- FR-03 Condition de victoire paramétrée par la variante.
- FR-04 Enchaînement des manches avec alternance du lanceur et écran intermédiaire.
- FR-05 Résumé `legsWon` réel et statistiques cumulées.
- FR-06 Règles affichées générées selon la configuration.
- FR-07 Le `legsToWin: 3` implicite actuel est remplacé par la valeur choisie (1 par défaut).

## 11. Exigences non fonctionnelles

- NFR-01 Logique Cricket pure et sérialisable (prérequis V2-ARCH-04, spec 058).
- NFR-02 Aucun coût récurrent.
- NFR-03 Lisibilité : en Cut-throat, le tableau rappelle « le plus bas score gagne ».

## 12. Cas nominaux et alternatifs

Cut-throat à 3 joueurs ; Standard en 3 manches ; Cut-throat en doublettes (points ajoutés à l'équipe adverse).

## 13. Cas limites

Cut-throat à 2 joueurs (équivalent inversé du standard) ; numéro fermé par tous les adversaires (aucun point distribué) ; annulation d'une fléchette qui a terminé une manche ; rechargement entre deux manches (dépend de la spec 010).

## 14. Gestion des erreurs

Aucun cas d'erreur métier nouveau ; configuration invalide (manches hors {1,3,5}) normalisée à 1.

## 15. Impacts architecturaux

`processCricketHit` et `checkCricketWin` reçoivent la variante ; un état de match Cricket (manches) est ajouté au modèle sérialisable de la spec 058.

## 16. Impacts sur les données et les interfaces

`GameConfig` : `cricketVariant: 'STANDARD' | 'CUT_THROAT'` (optionnel, défaut `STANDARD`) ; `legsToWin` utilisé. Historique : le résumé contient la variante. Lecture tolérante des anciennes entrées (absence = Standard).

## 17. Compatibilité avec l'existant

Défauts identiques au comportement actuel ; Triathlon inchangé.

## 18. Dépendances

- V2-ARCH-04 (spec 058) : état Cricket sérialisable.
- Liées : V2-GAMES-04 (spec 047), V2-GAMES-06 (spec 049), V2-GAMES-26 (spec 050), V2-ARCH-06 (spec 010).

## 19. Critères d'acceptation

- AC-01 Cut-throat, 3 joueurs : A a fermé le 20, B non, C oui ; A touche T20 → B +60, A et C inchangés.
- AC-02 Cut-throat : A ferme tout avec 40 contre 60 et 80 → A gagne ; avec 90 → la partie continue.
- AC-03 Standard 3 manches (premier à 2) : la manche 2 commence par l'autre joueur ; le match se termine à 2 manches gagnées.
- AC-04 Valeurs par défaut : une partie lancée sans toucher aux options se joue exactement comme aujourd'hui (golden tests de la spec 039).
- AC-05 Les statistiques de fin cumulent les manches.

## 20. Scénarios de tests

Unitaires `tests/unit/cricketLogic.test.ts` (variante, victoire), modèle de match (manches) ; composant setup ; E2E Cut-throat 3 joueurs et Standard 3 manches.

## 21. Exigences de non-régression

Cricket Standard 1 manche, Triathlon, statistiques Cricket, revanche.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Confusion des joueurs sur le sens du score | Moyen | Moyenne | Rappel visible (NFR-03) |
| Complexité du setup | Faible | Moyenne | Options repliées, défauts inchangés |

## 23. Décisions architecturales

Aucune ADR propre ; s'appuie sur l'ADR de la spec 058.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Variantes en V2 ou plus tard ? (H.11) | a) lot 5 (après 058) ; b) plus tôt | a) | — |
| Q2 | Formats proposés | a) 1/3/5 manches ; b) + sets | a) | — |
| Q3 | Ajouter la variante « sans points » ? | a) oui (simple) ; b) non | b) en V2 (demande non exprimée) | — |
| Q4 | Cut-throat dans le Triathlon ? | a) non ; b) option | a) — le Triathlon est un format fixe | — |

## 25. Traçabilité

Rapport `03-games.md` §2, §3.2, §9.7 ; compte rendu §C.5, §F.2, §H.11 ; specs 010, 047, 049, 050, 058.
