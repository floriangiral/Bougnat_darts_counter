---
id: 047-counter-cricket-end-of-game
v2_id: V2-GAMES-04
titre: Cricket — écran de victoire, annulation et départage
type: fonctionnel
statut: implementee
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 80
depend_de: []
remplace: []
remplacee_par: []
issue: '#206'
verifie_au_commit: 0c9ab98
derniere_revue: 2026-11-20
---

# 047 — Cricket : écran de victoire, annulation et départage

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #206, branche `feat/v2-audit-specs-et-corrections`). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la validation terrain reste à faire (`validation: en-attente`).

> **Complément 2.2.0 :** en simple à 3 ou 4 joueurs, hors Triathlon, la [spec 136](../136-counter-multiplayer-rankings/spec.md) permet de jouer les places au lieu de terminer dès la première victoire. Le duel, les doublettes et le Cricket du Triathlon conservent le parcours décrit ici.

## 1. Origine et contexte

Rapport `03-games.md` §3.2 et §6.3, compte rendu §C.5 : la fin de partie Cricket enchaîne directement sur les statistiques ; l'écran « VAINQUEUR » et son bouton « Retour » existent mais ne s'affichent jamais. À la limite de tours, une égalité parfaite est départagée par l'ordre alphabétique des noms.

## 2. Problématique

Une fléchette gagnante mal saisie ne peut plus être annulée : le résultat part aussitôt dans l'historique local et, en Triathlon, l'épreuve suivante démarre. Le départage alphabétique est arbitraire et injuste.

## 3. Objectifs

- Afficher l'écran de victoire à chaque fin de Cricket (partie simple et Triathlon) avec annulation possible de la dernière fléchette.
- N'enregistrer le résultat qu'à la validation explicite.
- Remplacer le critère alphabétique par une règle sportive documentée.

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | `finishMatch` appelle `setWinnerId` puis `onFinish` dans le même tick | `views/CricketGameView.tsx:95-104` | [vérifié] |
| C2 | `onFinish` enregistre l'historique local et bascule sur `CRICKET_STATS` : la vue est démontée avant d'afficher l'écran de victoire | `src/app/useGameLifecycle.ts:93-109` | [vérifié] |
| C3 | En Triathlon, `onFinish` déclenche `cricket_finished` et la transition vers le 501 | `views/TriathlonGameView.tsx:162-175` | [vérifié] |
| C4 | L'écran « VAINQUEUR » + « Retour » (undo) + « Voir les Stats » est donc du code mort ; texte « Match remporte » sans accent | `views/CricketGameView.tsx:244-276` (l. 255) | [vérifié] |
| C5 | L'undo restaure correctement `winnerId` depuis l'instantané pris avant la fléchette | `views/CricketGameView.tsx:113-116,200-211` | [vérifié] |
| C6 | Départage à la limite de tours : score, puis numéros fermés, puis marques (plafonnées à 3), puis `localeCompare` du nom | `utils/cricketLogic.ts:123-140` (l. 136) | [vérifié] |
| C7 | Le départage est évalué sur les statistiques agrégées (`aggregateStats`), pas sur l'état de jeu | `views/CricketGameView.tsx:129-135,172-178` | [vérifié] |
| C8 | Une seule manche est jouée (`{ [winner]: 1 }`) bien que le setup pose `legsToWin: 3` | `views/CricketGameView.tsx:106-108`, `src/features/game-setup/setupModel.ts:152-158` | [vérifié] — traité par la spec 051 |
| C9 | Le classement de fin trie par score ; le vainqueur peut ne pas être n° 1 visuellement | `views/CricketStatsView.tsx:14-15,34` | [vérifié] |
| C10 | `CricketMatchSummary.winnerId` accepte déjà `null` | `types.ts:75-84` | [vérifié] |

## 5. Comportement cible

À la fléchette gagnante (ou à la dernière fléchette du dernier tour), la partie se fige et l'écran de fin s'affiche : vainqueur (ou « Égalité »), score final, « Annuler la dernière fléchette », « Voir les statistiques » (partie simple) ou « Épreuve suivante » (Triathlon). Le résultat n'est transmis (`onFinish`) qu'au clic sur l'action de validation. À la limite de tours, l'ordre alphabétique est supprimé.

## 6. Périmètre

### Inclus
`CricketGameView` (partie simple et Triathlon), `cricketLogic` (départage), `CricketStatsView` (ordre du classement), libellés de l'écran de fin.

### Exclu
Persistance de la partie en cours (spec 010, V2-ARCH-06) ; composant commun `GameEndScreen` (spec 049, qui reprendra ce flux) ; variantes et manches multiples (spec 051) ; prénoms en doublettes (spec 049).

## 7. User stories

- En tant que marqueur, je veux annuler une fléchette gagnante saisie par erreur, afin de corriger le score sans relancer la partie.
- En tant que joueur, je veux qu'une égalité parfaite soit traitée sportivement, afin que le résultat ne dépende pas de mon prénom.

## 8. Règles métier

- RM-01 Victoire : tous les numéros fermés et score ≥ celui de chaque adversaire (inchangé, `utils/cricketLogic.ts:90-109` ; source Wikipedia EN « Cricket (darts) »).
- RM-02 Limite de tours atteinte par tous : classement par score, puis numéros fermés, puis marques (règle maison actuelle conservée, Q1).
- RM-03 Égalité persistante après RM-02 : selon Q2 (recommandé : égalité déclarée). Référence : Wikipédia FR « Fléchettes », règles officielles (machine 20 tours) — « En cas d'égalité au 20e tour, il faudra refaire la manche ».
- RM-04 Le résultat n'est définitif qu'après validation de l'écran de fin.

## 9. Parcours utilisateurs

1. Partie simple : fléchette gagnante → écran de fin → « Annuler la dernière fléchette » → retour au tableau, même joueur, même fléchette ; ou « Voir les statistiques » → `CRICKET_STATS`.
2. Triathlon : fléchette gagnante → écran de fin → « Épreuve suivante » → transition vers le 501.
3. Limite de tours, égalité parfaite → écran « Égalité » (Q2).

## 10. Exigences fonctionnelles

- FR-01 La fin de partie positionne l'état « terminé » sans appeler `onFinish`.
- FR-02 L'écran de fin propose l'annulation de la dernière fléchette tant que le résultat n'est pas validé.
- FR-03 `onFinish` est appelé une seule fois, au clic sur l'action de validation, avec le résumé courant.
- FR-04 Le chronomètre s'arrête à l'écran de fin et reprend après annulation.
- FR-05 Le critère alphabétique est supprimé ; RM-03 s'applique (`winnerId: null` si égalité déclarée).
- FR-06 Le classement de fin place le vainqueur en premier ; en cas d'égalité déclarée, rangs ex æquo.
- FR-07 Libellés français corrects (« Match remporté », « Égalité »).

## 11. Exigences non fonctionnelles

- NFR-01 Règle de départage pure dans `utils/cricketLogic.ts` (ou son successeur de domaine), testée sans React.
- NFR-02 Aucun coût récurrent.
- NFR-03 Boutons de l'écran de fin ≥ 48 px de hauteur.

## 12. Cas nominaux et alternatifs

Nominal : victoire par fermeture. Alternatif : victoire aux tours ; égalité ; annulation puis nouvelle fin.

## 13. Cas limites

Victoire sur la 1ʳᵉ fléchette d'un tour ; 3 joueurs dont 2 à égalité derrière le vainqueur (pas d'égalité déclarée) ; doublettes ; égalité en Triathlon (points d'épreuve partagés, spec 048) ; rechargement pendant l'écran de fin (partie perdue tant que la spec 010 n'est pas livrée — à signaler).

## 14. Gestion des erreurs

Double clic sur « Voir les statistiques » : un seul `onFinish` (garde d'état).

## 15. Impacts architecturaux

Aucune nouvelle couche ; le flux reprend le modèle déjà correct de Capital (`views/CapitalGameView.tsx:140-150`), qui servira de base au `GameEndScreen` de la spec 049.

## 16. Impacts sur les données et les interfaces

`CricketMatchSummary.winnerId` peut valoir `null` (déjà typé). Consommateurs à vérifier : `useGameLifecycle.ts:101` (historique), `views/CricketStatsView.tsx:15`, `utils/triathlonScoring.ts:248-310`.

## 17. Compatibilité avec l'existant

Le parcours de base est inchangé, avec un écran de plus en fin de partie (déjà prévu par le code). Historique local : aucune migration.

## 18. Dépendances

Aucune bloquante. Liées : V2-GAMES-06 (spec 049), V2-GAMES-05 (spec 048, classement Cricket du Triathlon), V2-ARCH-06 (spec 010), V2-GAMES-26 (spec 050).

## 19. Critères d'acceptation

- AC-01 Partie simple 2 joueurs : la fléchette gagnante affiche l'écran de fin ; aucune entrée n'est ajoutée à l'historique local tant que « Voir les statistiques » n'est pas cliqué.
- AC-02 « Annuler la dernière fléchette » restaure marques, score, lanceur et fléchette du tour ; le chrono reprend.
- AC-03 Triathlon : l'écran de fin Cricket s'affiche ; « Épreuve suivante » démarre la transition 501.
- AC-04 Limite de tours, deux joueurs « Anne » et « Zoé » strictement égaux (score, fermetures, marques) → aucun vainqueur alphabétique ; comportement Q2.
- AC-05 Le classement de fin affiche le vainqueur en premier.
- AC-06 Texte « Match remporté » accentué.

## 20. Scénarios de tests

Unitaires `tests/unit/cricketLogic.test.ts` (départage, égalité) ; test de composant `CricketGameView` (fin, annulation, validation unique) — premier test de cette vue ; E2E partie Cricket courte jusqu'à la victoire + annulation (`tests/e2e`).

## 21. Exigences de non-régression

Règles de marques et points (`tests/unit/cricketLogic.test.ts`, `cricketGameModel.test.ts`) ; revanche ; Triathlon complet.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Égalité déclarée non gérée par un consommateur (Triathlon, historique) | Moyen | Moyenne | FR-05 + tests des consommateurs (§16) |
| Double `onFinish` | Moyen | Faible | Garde + test |

## 23. Décisions architecturales

Aucune ADR ; décision de règle (Q2) consignée dans la spec 050.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Conserver les critères maison « numéros fermés » puis « marques » avant l'égalité ? | a) oui ; b) score seul | a) — critères sportifs déjà en place, à documenter comme variante maison | — |
| Q2 | Égalité persistante à la limite de tours (arbitrage H.10) | a) égalité déclarée ; b) tour supplémentaire décisif ; c) manche rejouée (règle officielle FR) ; d) MPR | a) en V2 (simple, honnête), b/c en variante (spec 051) | — |
| Q3 | Libellé de l'action de validation en Triathlon | a) « Épreuve suivante » ; b) « Voir les statistiques » | a) | — |

## 25. Traçabilité

Rapport `03-games.md` §3.2, §6.3, §9.4 ; compte rendu §C.5, §H.10 ; specs 010, 048, 049, 050, 051.

## Implémentation (2026-11-20)

- Issue #206 ; vérifiée au commit `0c9ab98` (branche `feat/v2-audit-specs-et-corrections`).
- Décisions appliquées : recommandations de la section « Questions ouvertes ».
- Test de reproduction écrit avant la correction (échec constaté), puis correction ; revue indépendante « OK avec réserves », réserves traitées.
- Vérifications : typecheck, lint, tests unitaires et couverture, gouvernance de couverture, `guard:clean` et build au vert ; `lint:type-aware` ne signale qu'une erreur préexistante (`tests/unit/components/keypads.test.tsx:47`).
- Reste à faire : recette sur appareils réels et tests E2E correspondants (spec 040).

