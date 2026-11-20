---
id: 048-counter-triathlon-scoring-v2
v2_id: V2-GAMES-05
titre: Triathlon — barème v2 versionné
type: fonctionnel
statut: implementee
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 23
depend_de: [V2-QA-01]
remplace: []
remplacee_par: []
issue: '#246'
verifie_au_commit: 0c9ab98
derniere_revue: 2026-11-20
---

# 048 — Triathlon : barème v2 versionné

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #246, branche `feat/v2-audit-specs-et-corrections`). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la validation terrain reste à faire (`validation: en-attente`).

## 1. Origine et contexte

Le Triathlon (Capital → Cricket → 501 Double-Out, score sur 100) est un jeu propre à Bougnat Darts : sa « règle » est son barème. Le rapport `03-games.md` §3.4 a rejoué le calcul et montré qu'il favorise le perdant du 501 et ignore le vainqueur du Cricket (compte rendu §C.5, arbitrage **H.10**).

## 2. Problématique

Certains critères sont toujours vrais, d'autres dépendent de l'ordre de jeu, d'autres récompensent deux fois le même fait : le classement final ne reflète pas la performance.

## 3. Objectifs

- Un barème v2 dont chaque critère est atteignable par chacun des compétiteurs et indépendant de l'ordre de jeu.
- Aucun critère comptant deux fois le même fait.
- Barème identifié par une version, enregistrée avec chaque résultat, et affiché dans les règles.
- Total maximal inchangé : 100 points (34 / 33 / 33).

## 4. État actuel vérifié dans le code

Barème v1 : `src/domain/triathlon/triathlonScoringRules.ts:13-84` ; calcul : `utils/triathlonScoring.ts`.

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | 501 : « défaite serrée » si écart de fléchettes ≤ 3 **ou** écart de moyenne ≤ 6 ; dans une manche unique, l'écart de fléchettes est toujours ≤ 3 → le perdant reçoit toujours 14 (jamais 10) | `utils/triathlonScoring.ts:182-199` ; seuils `triathlonScoringRules.ts:18-21` | [vérifié] ; exemple rejoué : perdant à 461 contre un 9 fléchettes → 14 pts (rapport 03) |
| C2 | 501 : bonus « Moins de fléchettes » (5) — le perdant a lancé moins de fléchettes quand le vainqueur a commencé ; il reçoit donc le bonus | `triathlonScoring.ts:223-235`, `awardLowestBonus` `:89-104` | [vérifié code, déduction ; à confirmer par golden test] |
| C3 | 501 : bonus « Checkout élevé » (4) — sur une manche unique seul le vainqueur a un checkout : double comptage de la victoire | `triathlonScoring.ts:205-213` | [vérifié] |
| C4 | Cricket : points de rang calculés sur le score seul ; `summary.winnerId` ignoré ; 0-0 → 20 pts chacun | `triathlonScoring.ts:269-274` ; rangs denses `:106-121` | [vérifié] ; rejoué (rapport 03) |
| C5 | Cricket : bonus « Différence de score » (4) calculé sur le score maximal (libellé faux, même critère que le rang) | `triathlonScoringRules.ts:50-54`, `triathlonScoring.ts:285-293` | [vérifié] |
| C6 | Capital : rang sur le score + bonus « Score cumulé » (5) sur le même score | `triathlonScoring.ts:370-385` | [vérifié] |
| C7 | Bonus attribués à tous les ex æquo ; aucun bonus si la meilleure valeur est ≤ 0 ; « Peu de pénalités » à 0 pour tous → tous le reçoivent | `triathlonScoring.ts:57-75,89-104` | [vérifié] |
| C8 | 501 : métriques du vainqueur par défaut = premier compétiteur si `matchWinnerId` absent | `triathlonScoring.ts:188` | [vérifié] |
| C9 | Aucun identifiant de version du barème ; les `scorecards` calculés sont stockés et réaffichés tels quels | `src/features/triathlon/triathlonFlow.ts:144-166`, `src/app/useGameLifecycle.ts:111-128`, `views/TriathlonStatsView.tsx:26-31` | [vérifié] |
| C10 | Règles affichées : le barème n'est pas détaillé | `src/features/game-setup/setupPresentation.ts:68-78` | [vérifié] |

## 5. Comportement cible

Le Triathlon calcule les points avec le barème v2 (§8), enregistre `scoringVersion: 2` dans le résultat et l'historique, affiche le barème dans les règles et indique la version sur l'écran de statistiques. Les résultats v1 déjà enregistrés restent affichés tels quels.

## 6. Périmètre

### Inclus
`triathlonScoringRules.ts`, `triathlonScoring.ts`, résultat et historique, règles affichées, statistiques Triathlon.

### Exclu
Ordre des épreuves, tir à la bulle, persistance multi-phase (spec 010), départage Cricket interne (spec 047), barème paramétrable par l'utilisateur.

## 7. User stories

- En tant que compétiteur, je veux que la défaite serrée récompense une vraie lutte, afin que le score sur 100 soit crédible.
- En tant qu'organisateur, je veux savoir avec quel barème un Triathlon a été compté, afin de comparer des résultats.

## 8. Règles métier — proposition de barème v2 (valeurs à arbitrer)

Principes : P1 le rang récompense le résultat ; P2 un bonus récompense une performance accessible au perdant ; P3 aucun critère ne dépend de l'ordre de jeu ; P4 égalité = mêmes points.

| Épreuve | Critère v1 | Proposition v2 | Points v2 |
|---|---|---|---|
| 501 | Victoire 20 / défaite serrée 14 / défaite 10 | Défaite serrée = le perdant était **en position de sortie** (reste finissable en Double-Out, fonction de la spec 045) à la fin de la manche | 20 / 14 / 10 |
| 501 | Checkout élevé 4 | Meilleure moyenne des 9 premières fléchettes | 4 |
| 501 | Meilleure moyenne 5 | Inchangé | 5 |
| 501 | Moins de fléchettes 5 | Plus grand nombre de visites ≥ 100 | 5 |
| Cricket | Rang sur le score 20/14 | Vainqueur réel 20, perdant 14, égalité déclarée 17/17 | 20 / 14 |
| Cricket | Meilleur MPR 5 | Inchangé | 5 |
| Cricket | « Différence de score » 4 | Remplacé : 7 cibles fermées (fermeture complète) | 4 |
| Cricket | Numéros fermés 4 | Inchangé | 4 |
| Capital | Rang sur le score 20/16 | Inchangé | 20 / 16 |
| Capital | Score cumulé 5 | Remplacé : meilleure progression sur un challenge (points marqués max) | 5 |
| Capital | Régularité 4 / Peu de pénalités 4 | Inchangés ; « Peu de pénalités » non attribué si tous à égalité | 4 / 4 |

- RM-01 Maximum par épreuve : 34 / 33 / 33 ; total 100.
- RM-02 Un bonus n'est attribué que si la meilleure valeur est strictement meilleure que celle d'au moins un autre compétiteur (pas de bonus « pour tous »).
- RM-03 Égalité au total : 501 de départage (inchangé, `triathlonFlow.ts:144-166`).
- RM-04 Chaque résultat porte la version du barème ; v1 = absence de version.

## 9. Parcours utilisateurs

Inchangé ; l'écran de statistiques affiche « Barème v2 » et le détail des points par critère ; les règles du setup présentent le tableau §8.

## 10. Exigences fonctionnelles

- FR-01 Le calcul applique le barème validé (§8 après arbitrage), défini dans `triathlonScoringRules.ts` (source unique).
- FR-02 Le rang Cricket utilise `summary.winnerId` ; `winnerId: null` → points d'égalité.
- FR-03 La défaite serrée 501 utilise la fonction de finissabilité de la spec 045.
- FR-04 Aucun bonus n'est attribué à tous les compétiteurs à la fois (RM-02).
- FR-05 Le résultat final, l'historique local et l'écran de statistiques portent `scoringVersion`.
- FR-06 Les libellés des bonus décrivent exactement le calcul.
- FR-07 Les règles affichées détaillent le barème v2.

## 11. Exigences non fonctionnelles

- NFR-01 Calcul pur, testable sans React (`utils/triathlonScoring.ts` ou son successeur `src/domain/triathlon`).
- NFR-02 Aucun coût récurrent.

## 12. Cas nominaux et alternatifs

Nominal : 2 compétiteurs. Alternatifs : égalité Cricket, égalité totale (tie-break), doublettes (Capital additionné par équipe, `triathlonScoring.ts:336-350`).

## 13. Cas limites

Perdant à 2 (finissable) vs à 1 (impossible, ne peut arriver en Double-Out) ; perdant à un bogey (159) = défaite standard ; aucune visite ≥ 100 → bonus non attribué ; reprise d'un Triathlon v1 en cours après mise à jour (Q3).

## 14. Gestion des erreurs

Résumé d'épreuve manquant → points d'épreuve 0 et journalisation de développement (pas d'exception visible).

## 15. Impacts architecturaux

Déplacement recommandé du calcul vers `src/domain/triathlon/` (règles pures) ; aucune dépendance UI.

## 16. Impacts sur les données et les interfaces

Ajout de `scoringVersion` au résultat Triathlon (`TriathlonResults`) et au `payload` d'historique. Lecture tolérante : absence = v1.

## 17. Compatibilité avec l'existant

Les résultats v1 ne sont pas recalculés. Les scores v2 ne sont pas comparables aux v1 : l'écran l'indique.

## 18. Dépendances

- V2-QA-01 (spec 039) : golden tests du barème v1 (caractérisation) puis v2.
- V2-GAMES-01 (spec 045) pour la finissabilité ; V2-GAMES-04 (spec 047) pour `winnerId` Cricket ; V2-GAMES-26 (spec 050) pour la documentation.

## 19. Critères d'acceptation

- AC-01 501 : vainqueur en 9 fléchettes, perdant à 461 → perdant 10 pts de base ; perdant à 40 → 14.
- AC-02 501 : le bonus de remplacement de « Moins de fléchettes » est identique que le vainqueur ait commencé ou non (test symétrique).
- AC-03 Cricket : vainqueur par fermeture à 0-0 → 20 / 14 ; égalité déclarée → 17 / 17.
- AC-04 Aucun bonus attribué simultanément à tous les compétiteurs (test sur valeurs égales).
- AC-05 Somme maximale théorique = 100 (test sur le barème).
- AC-06 `scoringVersion: 2` présent dans le résultat et l'historique ; une entrée sans version s'affiche « Barème v1 ».

## 20. Scénarios de tests

`tests/unit/triathlonScoring.test.ts` (7 cas actuels) étendu en golden tests par critère ; `tests/unit/triathlonFlow.test.ts` (version) ; composant statistiques (affichage de la version).

## 21. Exigences de non-régression

Enchaînement des épreuves, tie-break, statistiques Triathlon, historique local.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Barème v2 jugé moins lisible | Moyen | Moyenne | Tableau dans les règles, arbitrage PO |
| Comparaison v1/v2 trompeuse | Faible | Moyenne | Version affichée |
| Seuils arbitraires | Moyen | Moyenne | Golden tests validés métier (spec 039) |

## 23. Décisions architecturales

Pas d'ADR ; le barème validé est consigné dans la spec 050 (référence des règles).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Critère de défaite serrée 501 | a) perdant en position de sortie ; b) reste ≤ seuil fixe (ex. 100) ; c) écart de moyenne seul | a) — notion de fléchettes connue, sans seuil arbitraire | — |
| Q2 | Remplacement des bonus redondants (§8) | a) proposition §8 ; b) supprimer les bonus redondants et augmenter les rangs ; c) autre | a) — garde 3 bonus par épreuve accessibles au perdant | — |
| Q3 | Triathlon v1 en cours lors de la mise à jour | a) terminer en v1 ; b) basculer en v2 | a) — sans objet tant que la spec 010 ne persiste pas le Triathlon | — |
| Q4 | Accepter que les résultats changent par rapport à la v1 (H.10) | oui / non | oui, avec version affichée | — |

## 25. Traçabilité

Rapport `03-games.md` §3.4, §9.3 ; compte rendu §C.5, §H.10 ; specs 039, 045, 047, 050.

## Implémentation (2026-11-20)

- Issue #246 ; vérifiée au commit `0c9ab98` (branche `feat/v2-audit-specs-et-corrections`).
- Décisions appliquées : recommandations de la section « Questions ouvertes ».
- Test de reproduction écrit avant la correction (échec constaté), puis correction ; revue indépendante « OK avec réserves », réserves traitées.
- Vérifications : typecheck, lint, tests unitaires et couverture, gouvernance de couverture, `guard:clean` et build au vert ; `lint:type-aware` ne signale qu'une erreur préexistante (`tests/unit/components/keypads.test.tsx:47`).
- Reste à faire : recette sur appareils réels et tests E2E correspondants (spec 040).

