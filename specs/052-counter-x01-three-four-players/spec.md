---
id: 052-counter-x01-three-four-players
v2_id: V2-GAMES-16
titre: X01 — 3 à 4 joueurs en simple
type: fonctionnel
statut: implementee
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P2
difficulte: M
recommandation: optionnel
lot: 5
poids: 15
depend_de: [V2-TAB-03]
remplace: [015-counter-x01-simple-two-player-limit]
remplacee_par: []
issue: '#280'
verifie_au_commit: à renseigner
derniere_revue: 2026-11-20
---

# 052 — X01 : 3 à 4 joueurs en simple

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #280, branche `feat/v2.0.0`). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la validation terrain reste à faire (`validation: en-attente`).

## 1. Origine et contexte

La spec 015 limite volontairement le X01 en simple à 2 joueurs (invariant « X01 SIMPLE ne dépasse jamais 2 joueurs »). Le rapport `03-games.md` §2 et §8 (V2-GAMES-16) relève que l'écran de match ne sait afficher que 2 colonnes, ce qui est la vraie cause de la limite, et que les usages bar/famille demandent 3-4 joueurs. Arbitrage **H.11** du compte rendu.

## 2. Problématique

Un groupe de 3 ou 4 personnes ne peut pas jouer un 501 chacun pour soi, alors que Cricket (3), Capital (4), Killer et Gotcha (6) le permettent.

## 3. Objectifs

- Permettre 3 ou 4 joueurs en X01 simple, sans régression à 1-2 joueurs ni en doublettes.
- Lisibilité de tous les scores sur tablette paysage et téléphone portrait.
- Statistiques de fin pour N joueurs.

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | Bornes X01 simple : 1 à 2 joueurs | `src/features/game-setup/setupModel.ts:59-66` (l. 64) | [vérifié] |
| C2 | Le moteur gère N joueurs : tour suivant et lanceur de manche suivante modulo `players.length` | `src/application/scoring/matchLifecycle.ts:244-256,287-288` | [vérifié] |
| C3 | L'écran de match n'affiche que `teams[0]` et `teams[1]` (scores, manches, sets) | `views/MatchView.tsx:168,691-703` | [vérifié] |
| C4 | Les statistiques en partie se limitent à 2 colonnes (`slice(0, 2)`) | `components/stats/StatsModal.tsx:19,33,40-41` | [vérifié] |
| C5 | Le robot force 2 joueurs | `src/features/game-setup/setupModel.ts:98-104` | [vérifié] |
| C6 | Le lien `v=1` ne connaît que `p1`/`p2` ou `t1p1…t2p2` | `src/features/external-match/externalMatchLink.ts:169-171,358-360` | [vérifié] |
| C7 | La spec 015 est `implementee` avec l'invariant contraire | `specs/015-counter-x01-simple-two-player-limit/spec.md` | [vérifié] |

## 5. Comportement cible

Le setup X01 en simple propose 1 à 4 joueurs. À 3-4 joueurs, l'écran de match affiche un bloc par joueur (disposition fournie par la spec 072 « arène »), le joueur actif mis en évidence ; les statistiques affichent une colonne par joueur (défilement horizontal sur téléphone). Le robot et le lien partenaire restent limités à 2 joueurs.

## 6. Périmètre

### Inclus
Setup, écran de match, barre de score (manches/sets), écran de victoire, statistiques en partie et de fin, revanche, voix (inchangée), persistance (inchangée).

### Exclu
Robot à 3-4 joueurs (Q2) ; doublettes à 3 équipes ; lien `v=1` (contrat inchangé) ; Triathlon ; mode TV (spec 086 pour X01, à adapter ensuite).

## 7. User stories

- En tant que groupe de 4 amis au bar, je veux lancer un 501 chacun pour soi, afin de ne pas devoir former des équipes.

## 8. Règles métier

- RM-01 Ordre de jeu fixe choisi au départ ; à chaque manche, le premier lanceur avance d'un rang (rotation circulaire) — comportement actuel du moteur.
- RM-02 Victoire de manche et de match inchangées (spec 045 pour les sorties).
- RM-03 Classement de fin : vainqueur du match, puis manches gagnées (sets puis manches en mode sets), puis reste de la dernière manche, le plus bas d'abord (Q3) ; des camps égaux sur tous les critères partagent le même rang.

## 9. Parcours utilisateurs

Setup X01 → Simple → « + joueur » jusqu'à 4 → prénoms → choix du premier lanceur → match.

## 10. Exigences fonctionnelles

- FR-01 Bornes X01 simple 1-4 ; robot uniquement à 2 joueurs (désactivé au-delà).
- FR-02 Écran de match à N blocs (2 à 4) sans perte d'information (reste, manches, sets, moyenne, dernière visite).
- FR-03 Statistiques en partie et de fin à N colonnes.
- FR-04 Écran de victoire et classement N joueurs (RM-03).
- FR-05 Un match à plus de 2 joueurs n'est jamais proposé pour un lien `v=1` (le setup verrouillé par lien reste à 2).

## 11. Exigences non fonctionnelles

- NFR-01 Lisibilité : score lisible à 2,5 m sur tablette 10" paysage [à confirmer en test terrain] ; aucun texte tronqué à 4 prénoms de 12 caractères.
- NFR-02 Pas de dégradation INP mesurable (spec 020 / V2-PERF-01).
- NFR-03 Aucun coût récurrent.

## 12. Cas nominaux et alternatifs

3 joueurs, 501, 3 manches ; 4 joueurs, sets ; retour à 2 joueurs (affichage actuel conservé).

## 13. Cas limites

Joueur éliminé ? (non : X01 continue jusqu'au vainqueur de manche) ; prénoms longs ; téléphone portrait étroit ; reprise de session d'un match à 4.

## 14. Gestion des erreurs

Configuration restaurée incohérente (robot + 4 joueurs) normalisée à 2 joueurs par le setup existant.

## 15. Impacts architecturaux

Composant d'affichage des joueurs générique (N blocs) issu de la disposition « arène » (spec 072) ; aucun changement de domaine.

## 16. Impacts sur les données et les interfaces

`MatchState` inchangé (déjà N joueurs). Contrat `v=1` inchangé.

## 17. Compatibilité avec l'existant

1-2 joueurs et doublettes : rendu identique (captures de référence, V2-QA-05/06). La spec 015 serait révisée (invariant remplacé) — décision PO.

## 18. Dépendances

- V2-TAB-03 (spec 072) : disposition à zones capable d'afficher N joueurs.
- Liées : spec 015 (à réviser), spec 016 (robot), V2-GAMES-01 (spec 045), V2-QA-05/06 (spec 041), mode TV X01 (spec 086).

## 19. Critères d'acceptation

- AC-01 Setup X01 simple : 4 joueurs possibles ; 5ᵉ refusé ; robot indisponible à 3-4.
- AC-02 Partie à 3 joueurs : l'ordre des visites est respecté sur 2 manches avec rotation du premier lanceur.
- AC-03 Les 4 scores et le joueur actif sont visibles sans défilement sur tablette 1280×800 paysage et téléphone 390×844 portrait (captures).
- AC-04 Statistiques de fin : une colonne par joueur.
- AC-05 Rendu 2 joueurs identique aux captures de référence.

## 20. Scénarios de tests

Unitaires setup (bornes, robot) ; moteur (rotation à 3 et 4) ; composant affichage N blocs ; E2E 4 joueurs ; régression visuelle 2 joueurs.

## 21. Exigences de non-régression

X01 1-2 joueurs, doublettes, robot, voix, lien externe, reprise de session.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Écran surchargé sur téléphone | Élevé | Moyenne | Dépendance spec 072, tests terrain |
| Régression visuelle 2 joueurs | Moyen | Moyenne | Captures de référence |
| Conflit avec la spec 015 | Faible | Certaine | Révision explicite de 015 |

## 23. Décisions architecturales

Décision produit : lever ou non l'invariant de la spec 015.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Lever la limite de la spec 015 en V2 ? (H.11) | a) oui, lot 5 après 072 ; b) reporter | a) | a) X01 simple de 1 à 4 joueurs ; spec 015 révisée (PO, 2026-11-20) |
| Q2 | Robot à 3-4 joueurs | a) non ; b) plusieurs robots | a) | a) robot uniquement à 2 joueurs, désactivé avec explication à 3-4 (PO, 2026-11-20) |
| Q3 | Classement de fin (RM-03) | a) manches puis reste ; b) vainqueur seul | a) | a) vainqueur, puis sets et manches gagnés, puis reste le plus bas (PO, 2026-11-20) |

## 25. Traçabilité

Rapport `03-games.md` §2, §3.1, §8, §9.5 ; compte rendu §F.2, §H.11 ; specs 015, 016, 045, 072, 086.

## Implémentation (2026-11-20)

- Issue #280 ; commit de vérification à renseigner par le coordinateur (branche `feat/v2.0.0`).
- Décisions appliquées : recommandations de la section « Questions ouvertes » (Q1 a, Q2 a, Q3 a). Lien partenaire `v=1` inchangé : il n'impose que 2 joueurs (`p1`/`p2`) ou des doublettes, et le setup verrouillé par lien reste à 2 (FR-05). Doublettes inchangées (2 contre 2).
- Setup (`src/features/game-setup/setupModel.ts`) : bornes X01 simple 1 à `X01_SIMPLE_MAX_PLAYERS` (4, constante de repli) ; un 5ᵉ joueur est refusé (sélecteur limité à 1-4, réducteur borné). Robot réservé aux parties à 2 (`X01_BOT_MATCH_PLAYERS`) : passer à 3-4 joueurs désactive le robot, l'activer à 3-4 est refusé, et une configuration incohérente (robot + 3-4 joueurs) est ramenée à 2 joueurs. Dans `SetupPlayersSection`, la case « Jouer contre un robot » est désactivée avec l'explication « Robot disponible uniquement à 2 joueurs ».
- Moteur : inchangé ; la rotation du premier lanceur à 3 et 4 joueurs sur 2 manches est couverte par `tests/unit/application/matchLifecycle.test.ts` (AC-02).
- Statistiques (`components/stats/StatsModal.tsx`) : une colonne par joueur ou par équipe (plus de limite à 2) ; au-delà de 2 colonnes, largeur minimale par colonne, prénoms renvoyés à la ligne au lieu d'être tronqués et défilement horizontal sur téléphone ; meilleures valeurs signalées par `data-state="best"`. Rendu à 2 colonnes conservé.
- Classement de fin : fonction pure `rankX01Competitors` (`src/application/scoring/x01Ranking.ts`), présentée en français par `src/presentation/stats/x01RankingPresenter.fr.ts` et affichée sur l'écran de fin (`views/StatsView.tsx`) uniquement au-delà de 2 camps (rang, nom, sets, manches, reste ; vainqueur marqué d'un trophée et de `data-state="winner"`).
- Couleurs : fichiers du périmètre migrés vers les rôles de tokens (aucune classe de palette brute ; `game-win` pour le vainqueur).
- Écran de match à N blocs (FR-02, AC-03) : livré par le chantier X01 de l'écran de match (`views/MatchView.tsx`, `components/match/*`), hors de ce lot de fichiers.
- Tests : unitaires setup (bornes, robot, normalisation), vues (`setupPlayers`, `statsViews`, `x01StatsModal`), classement (`x01Ranking`), rotation 3 et 4 joueurs ; E2E `tests/e2e/x01-four-players.smoke.spec.ts` écrit, exécuté par la CI de la PR.
- Reste à faire : captures tablette 1280×800 et téléphone 390×844 (AC-03), régression visuelle 2 joueurs (AC-05, spec 041), recette terrain (NFR-01), mode TV X01 (spec 086).

