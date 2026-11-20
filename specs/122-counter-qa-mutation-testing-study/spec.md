---
id: 122-counter-qa-mutation-testing-study
v2_id: V2-QA-14
titre: Étude-pilote — tests de mutation StrykerJS sur les moteurs de jeu
type: etude
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P3
difficulte: M
recommandation: etude
lot: 2
poids: 5
depend_de: [V2-QA-01, V2-CICD-01]
issue: '#315'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 122 — Étude : tests de mutation StrykerJS sur les moteurs de jeu

> **Statut : À VALIDER.** Une étude ne crée aucune exigence. Elle produit une recommandation et, si elle est retenue, une ou plusieurs specs fonctionnelles et/ou un ADR.

## 1. Contexte et origine

La demande DevSecOps (§16) impose StrykerJS pour mesurer la capacité réelle des tests à détecter des défauts, en priorité sur les moteurs de scoring, X01, tours, manches, statistiques et conditions de victoire, en exécution hebdomadaire et sans campagne complète à chaque PR. La couverture de lignes élevée (≈ 95 % au 3 novembre, `docs/technical.md`, section « Couverture locale et SonarCloud ») ne prouve pas que les assertions détectent une règle fausse : l'audit V2 a d'ailleurs trouvé des règles X01 incorrectes malgré cette couverture (V2-GAMES-01, spec 045).

Le sujet est traité en **étude-pilote** : coût d'exécution, compatibilité de l'outillage et périmètre utile sont incertains, et la logique X01 est encore en partie dans une vue exclue de la couverture.

## 2. Questions à trancher

- Q1 Périmètre initial des mutations.
- Q2 Budget de temps et fréquence (hebdomadaire, incrémental).
- Q3 Seuils (`high`, `low`, `break`) et trajectoire.
- Q4 Publication des rapports (artefact seul ou tableau de bord Stryker).
- Q5 Compatibilité de `@stryker-mutator/vitest-runner` avec Vitest 5 et les tests `jsdom`.

## 3. État actuel vérifié dans le code

- [vérifié] 80 fichiers de tests unitaires (`tests/unit/**/*.test.*`) ; environnement Vitest `node` par défaut (`vitest.config.ts:15`) avec des fichiers `jsdom` ponctuels.
- [vérifié] Logique métier exécutée : `src/application/scoring/` (`matchLifecycle.ts`, `matchStats.ts`, cas d'usage), `src/features/x01/scoring/` (`matchSubmission.ts`, `checkoutEligibility.ts`, `possibleTurnScores.ts`…), `utils/cricketLogic.ts`, `utils/capitalLogic.ts`, `utils/triathlonScoring.ts`, `src/domain/{killer,gotcha,triathlon,x01Bot}/` ; ≈ 1 800 lignes pour `src/application/scoring` + `utils`.
- [vérifié] Une partie de la logique X01 et l'état de Killer/Gotcha vivent dans des vues exclues de la couverture (`views/MatchView.tsx`, `views/GotchaGameView.tsx`, voir révision V2 de la spec 029) : la mutation n'y est pas pertinente avant l'extraction (V2-ARCH-04, 058).
- [vérifié] `src/domain/scoring/` n'est utilisé que par les tests (`AGENTS.md` §3) : à exclure du pilote.
- [vérifié] Aucune configuration Stryker, aucun rapport de mutation.

## 4. Contraintes

Coût nul (runners standard d'un dépôt public), aucune dépendance d'exécution, durée bornée (≤ 60 min par exécution), pas d'exécution complète par PR, pas de baisse de seuils de couverture, aucune influence sur le parcours joueur.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A — Ne pas adopter | Couverture + golden tests (039) | Aucun coût | Qualité des assertions non mesurée | 0 | Nulle |
| B — Pilote ciblé hebdomadaire | Stryker sur moteurs purs (`utils/*Logic`, `src/application/scoring`, `src/features/x01/scoring`, `src/domain/{killer,gotcha,triathlon}`) | Signal fort sur le code critique, durée maîtrisée | Dépendances de développement (3 paquets) | 0 € ; ≈ 60 min de runner/semaine [à mesurer] | Moyenne |
| C — Campagne complète | Tout le périmètre couvert | Vision globale | Durée élevée, bruit sur l'UI | 0 € ; plusieurs heures [à mesurer] | Élevée |
| D — Mutation incrémentale en PR | Fichiers modifiés seulement | Retour immédiat | Temps de PR accru ; instable sur gros diffs | 0 € | Élevée |

## 6. Critères d'évaluation et analyse

- [confirmé] Le lanceur Vitest de Stryker impose son analyse de couverture « perTest », ne prend en charge ni le mode navigateur de Vitest ni la désactivation des threads — documentation `stryker-js/docs/vitest-runner.md`, consultée le 2026-11-20.
- [à confirmer] Compatibilité avec Vitest 5.x (version du projet) : vérifier la matrice de versions du lanceur au moment du pilote.
- [envisageable] Mode incrémental de Stryker (`--incremental`) pour réduire la durée hebdomadaire après la première exécution.
- [envisageable] Tableau de bord Stryker gratuit pour l'open source (publication du score, badge) [à confirmer : conditions et jeton requis].
- Critères : score de mutation initial par module, durée, nombre de mutants survivants exploitables, effort d'analyse, valeur pour V2-QA-01.

## 7. Recommandation (non validée)

Option B. Première exécution manuelle pour établir la référence, puis hebdomadaire en mode incrémental ; seuils proposés `high: 80`, `low: 60`, `break: null` au départ (aucun blocage), puis `break` fixé 5 points sous le score atteint après deux trimestres. Les mutants survivants sur les règles X01 et Cricket alimentent V2-QA-01 (039). Extension aux vues après extraction des moteurs (058).

## 8. Protocole de vérification (PoC, mesures, terrain)

1. Branche d'étude : installer `@stryker-mutator/core` et le lanceur Vitest, configuration limitée à `utils/cricketLogic.ts` puis au périmètre B.
2. Mesurer durée, mémoire, score et nombre de mutants par module sur un runner standard (`workflow_dispatch`).
3. Introduire volontairement une mutation de règle (ex. bust X01) sur branche jetable et vérifier qu'un test la tue (critère de la demande §26).
4. Analyser 20 mutants survivants : faux positifs (mutants équivalents) vs vrais trous de test.
5. Restituer un rapport chiffré et une proposition de spec fonctionnelle.

## 9. Livrables attendus de l'étude

- Rapport de pilote (durée, scores par module, survivants analysés).
- Proposition de spec fonctionnelle (workflow `mutation.yml`, configuration, seuils) ou recommandation d'abandon.
- Liste de tests à renforcer, transmise à 039.

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Durée excessive | Moyen | Moyenne | Périmètre B, incrémental, délai 90 min |
| Incompatibilité Vitest 5 | Moyen | Faible [à confirmer] | Pilote préalable ; sinon report |
| Mutants équivalents nombreux | Faible | Moyenne | Analyse manuelle, exclusions justifiées |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Périmètre | B / C | B (moteurs purs), extension après 058 | — |
| Q2 | Fréquence | Hebdomadaire / mensuelle | Hebdomadaire incrémentale ; complète mensuelle | — |
| Q3 | Seuils | Bloquant d'emblée / informatif | Informatif deux trimestres, puis `break` | — |
| Q4 | Publication | Artefact / tableau de bord Stryker | Artefact + résumé ; tableau de bord si gratuit sans jeton longue durée | — |
| Q5 | Exécution en PR | Non / incrémentale sur moteurs modifiés | Non (demande §16) | — |

## 12. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §16 ; specs 029, 039, 045, 058, 113, 120, 127.
