---
id: 053-counter-killer-gotcha-variants
v2_id: V2-GAMES-13
titre: Killer et Gotcha — variantes et règles de référence
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P3
difficulte: S
recommandation: optionnel
lot: 5
poids: 10
depend_de: [V2-GAMES-06]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 053 — Killer et Gotcha : variantes et règles de référence

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Specs 017 (Killer) et 019 (Gotcha) implémentées. Le rapport `03-games.md` §3.5-3.6 constate que le Killer est une variante « doubles uniquement, 3 vies » différente des deux règles de référence publiques, que l'ordre de jeu n'est pas choisi, et qu'aucune source n'a pu être vérifiée pour le Gotcha. Compte rendu §C.5 (« variante 5 vies (P3) », « rétro-spec des règles ») et arbitrage **H.10** (règles maison vs référence). Cette spec complète 017 et 019 sans les modifier ; le cadre commun (sortie confirmée, fin, revanche) relève de la spec 049.

## 2. Problématique

Les joueurs habitués au Killer « 5 vies » ou « 3 marques pour devenir Killer » ne retrouvent pas leur règle ; le premier joueur est imposé ; les règles du Gotcha ne sont adossées à aucune source.

## 3. Objectifs

- Documenter les règles implémentées de Killer et Gotcha au format de la spec 050 (identifiants, statut C / M / E).
- Ajouter au Killer l'option **5 vies** et le **choix du premier joueur avec ordre conservé**.
- Rendre visible le journal de partie (déjà produit par le domaine).
- Statuer sur une source ou sur le caractère « maison » du Gotcha.

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | Killer : 3 vies fixes (constante), bornes de vies 0-3 | `src/domain/killer/killer.ts:30,189` | [vérifié] |
| C2 | Un seul double sur son numéro → Killer ; un non-Killer qui touche son double regagne aussi une vie (sans dépasser 3) | `killer.ts:94-103` | [vérifié] — la règle de la spec 017 E3 **a un effet** quand le joueur a déjà été touché ; le rapport 03 la disait « morte » : correction |
| C3 | Un Killer qui touche son propre double perd une vie ; le statut Killer n'est jamais perdu ; triples ignorés | `killer.ts:94-98,105-107` | [vérifié] |
| C4 | Bull accepté comme numéro (double bull à viser) | `killer.ts:3,31,35` | [vérifié] |
| C5 | Après l'attribution des numéros, le joueur 1 commence toujours | `killer.ts:71-72` | [vérifié] |
| C6 | Journal (`log`) produit par les deux domaines, jamais affiché | `killer.ts:22,57,80`, `src/domain/gotcha/gotcha.ts:25,56,66` ; aucun rendu de `state.log` dans les vues | [vérifié] |
| C7 | Cœurs affichés sur une base fixe de 3 | `views/KillerGameView.tsx:257` | [vérifié] |
| C8 | Gotcha : course de 0 vers la cible exacte ; dépassement = visite annulée ; atteindre exactement le score d'un adversaire le renvoie à 0 (tous les adversaires concernés, score > 0) | `src/domain/gotcha/gotcha.ts:60-131` | [vérifié] |
| C9 | Gotcha : totaux impossibles acceptés (0-180) | `gotcha.ts:63` | [vérifié] — traité par la spec 054 |
| C10 | Gotcha : premier joueur = joueur 1 (pas de choix) | `views/GotchaGameView.tsx:67-71` | [vérifié] |
| C11 | Libellés « Numero », « Rate » sans accents | `views/KillerGameView.tsx:221,241` | [vérifié] — traités par la spec 013 |

## 5. Comportement cible

- Killer : setup « Vies : 3 / 5 » (défaut 3) ; choix du premier joueur (overlay commun, spec 049) **après** l'attribution des numéros, ordre conservé ; journal des 5 dernières actions visible ; cœurs selon le nombre de vies choisi.
- Gotcha : choix du premier joueur ; journal visible ; règles documentées comme **maison** tant qu'aucune source n'est validée.
- Référence des règles Killer/Gotcha publiée avec celle de la spec 050.

## 6. Périmètre

### Inclus
Option vies, ordre de jeu, journal, référence des règles, règles affichées.

### Exclu
Mode « N marques S/D/T pour devenir Killer » et perte du statut (Q2, plus tard) ; Gotcha fléchette par fléchette ; statistiques détaillées (Q4) ; confirmation de sortie, fin, revanche (spec 049) ; totaux impossibles (spec 054).

## 7. User stories

- En tant que groupe habitué au Killer à 5 vies, je veux régler le nombre de vies, afin de jouer des parties plus longues.
- En tant que joueur, je veux voir « Paul touche Marie », afin de comprendre ce qui vient de se passer.

## 8. Règles métier

Killer (implémenté, sources : Wikipedia EN « Darts » §Killer ; Wikipédia FR « Fléchettes » §Killer) :
- KIL-R01 Numéro unique par joueur (1-20 ou Bull), attribué au départ — C (attribution manuelle au lieu d'un tir de la mauvaise main : M).
- KIL-R02 Devenir Killer : un double sur son numéro — M (référence : 5 touches S/D/T [EN] ou 3 points, variante « doubles seulement » [FR]).
- KIL-R03 Vies décroissantes (3) au lieu de points croissants puis décroissants — M.
- KIL-R04 Un Killer retire 1 vie par double adverse ; touche son propre double → −1 vie — M.
- KIL-R05 Non-Killer touchant son double : devient Killer et regagne 1 vie (≤ max) — M.
- KIL-R06 Statut Killer jamais perdu — M (référence FR : perdu au premier point perdu).
- KIL-R07 Dernier survivant gagne — C.
- KIL-R08 (proposé) Vies initiales = 3 ou 5 ; bornes = valeur choisie.
- KIL-R09 (proposé) Ordre de jeu choisi après attribution et conservé.
Gotcha (implémenté, **aucune source publique vérifiée**) :
- GOT-R01 Score de 0 vers une cible exacte (301/501/701/perso) — M.
- GOT-R02 Visite qui dépasse la cible : annulée, score inchangé — M.
- GOT-R03 Atteindre exactement le score (> 0) d'un ou plusieurs adversaires les renvoie à 0 — M.
- GOT-R04 Aucune contrainte de double pour finir — M.

## 9. Parcours utilisateurs

Killer : setup (vies) → prénoms → attribution des numéros → choix du premier joueur → partie (journal visible) → fin (spec 049).

## 10. Exigences fonctionnelles

- FR-01 Option « Vies : 3 / 5 » au setup Killer, défaut 3 ; transmise au domaine (`createKillerState`).
- FR-02 Bornes de vies et affichage des cœurs selon l'option.
- FR-03 Choix du premier joueur après attribution (Killer) et au départ (Gotcha) ; ordre conservé.
- FR-04 Journal visible (5 dernières entrées) dans les deux jeux, en français.
- FR-05 Règles affichées générées selon la configuration.
- FR-06 Référence des règles Killer/Gotcha (format spec 050) publiée.

## 11. Exigences non fonctionnelles

- NFR-01 Règles dans `src/domain/killer` et `src/domain/gotcha`, sans React.
- NFR-02 Aucun coût récurrent.

## 12. Cas nominaux et alternatifs

Killer 5 vies à 4 joueurs ; Killer 3 vies (inchangé) ; Gotcha avec premier joueur choisi.

## 13. Cas limites

Joueur éliminé au tour où il était premier ; 2 joueurs restants ; Bull comme numéro (Q3) ; annulation de l'attribution du dernier numéro.

## 14. Gestion des erreurs

Configuration restaurée sans option de vies → 3.

## 15. Impacts architecturaux

Paramètre `startingLives` dans `createKillerState` ; `startingPlayerIndex` appliqué après attribution. Aucune nouvelle couche.

## 16. Impacts sur les données et les interfaces

`GameConfig` : `killerLives?: 3 | 5` (optionnel). Résumé de fin : nombre de vies.

## 17. Compatibilité avec l'existant

Défauts identiques à l'existant (3 vies) hormis l'ordre de jeu choisi.

## 18. Dépendances

- V2-GAMES-06 (spec 049) : overlay du premier joueur, fin de partie, revanche.
- Liées : specs 017, 019 (à mettre à jour à la clôture), V2-GAMES-26 (spec 050), V2-GAMES-30 (spec 054), V2-GAMES-10 (spec 013).

## 19. Critères d'acceptation

- AC-01 Killer 5 vies : chaque joueur démarre à 5 ; un non-Killer touché puis devenant Killer remonte au plus à 5.
- AC-02 Killer : après attribution, le premier joueur est celui choisi ; l'ordre est conservé sur 3 tours.
- AC-03 Journal visible : après un double sur un adversaire, l'entrée « X touche Y » s'affiche.
- AC-04 Gotcha : premier joueur choisi respecté.
- AC-05 Référence Killer/Gotcha publiée avec statuts C/M/E et sources (ou mention « aucune source »).

## 20. Scénarios de tests

Unitaires `tests/unit/killerLogic.test.ts` (vies 5, ordre), `gotchaLogic.test.ts` (premier joueur) ; composant journal ; E2E Killer 5 vies.

## 21. Exigences de non-régression

Killer 3 vies, Gotcha, statistiques et historique local.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Règle Gotcha contestée | Faible | Moyenne | Statut M explicite, Q1 |
| Multiplication des options | Faible | Faible | Deux options seulement en V2 |

## 23. Décisions architecturales

Aucune ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Gotcha : source de référence | a) règle maison Bougnat documentée ; b) source fournie par le PO/club | a) | — |
| Q2 | Killer : mode « marques S/D/T » et perte du statut | a) plus tard ; b) V2 | a) — demande la saisie par secteur | — |
| Q3 | Bull comme numéro de Killer | a) garder ; b) exclure ; c) option | a) avec mention dans les règles | — |
| Q4 | Statistiques Killer/Gotcha (vies retirées, gotchas infligés…) | a) ici ; b) spec dédiée plus tard | b) | — |
| Q5 | Règle par défaut : maison ou référence ? (H.10) | a) maison par défaut ; b) référence par défaut | a) | — |

## 25. Traçabilité

Rapport `03-games.md` §3.5, §3.6, §9.2 ; compte rendu §C.5, §H.10 ; specs 013, 017, 019, 049, 050, 054.
