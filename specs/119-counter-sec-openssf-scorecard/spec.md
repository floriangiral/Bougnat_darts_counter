---
id: 119-counter-sec-openssf-scorecard
v2_id: V2-SEC-04
titre: OpenSSF Scorecard — évaluation hebdomadaire de la sécurité du dépôt
type: fonctionnel
statut: validee
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P2
difficulte: S
recommandation: recommande
lot: 1
poids: 20
depend_de: [V2-SEC-01]
remplace: []
remplacee_par: []
issue: '#309'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-24
---

# 119 — OpenSSF Scorecard : évaluation hebdomadaire de la sécurité du dépôt

> **Statut : VALIDÉE (2026-11-24).** Le product owner retient toutes les recommandations du tableau des décisions ; les dépendances et conditions de déploiement restent applicables.

## 1. Origine et contexte

La demande DevSecOps (§17) impose OpenSSF Scorecard chaque semaine, avec publication dans l'onglet Security et un plan d'amélioration, sans chercher le score pour lui-même. Scorecard sert ici de **contrôle externe** des réglages décidés par 115 et des pratiques de 113/117/118.

## 2. Problématique

Aucun indicateur ne mesure aujourd'hui la posture de sécurité du dépôt dans le temps ; une régression de réglage (épinglage, permissions, protection de branche) passerait inaperçue.

## 3. Objectifs

- O1 : un score hebdomadaire publié (onglet Security, badge, API publique).
- O2 : un plan d'amélioration priorisé, qui distingue les écarts utiles des critères inadaptés à un projet à mainteneur unique.

## 4. État actuel vérifié dans le code

- [vérifié] Aucun workflow Scorecard (`grep scorecard .github/` : aucun résultat).
- [vérifié] Constats qui pèseront sur les vérifications Scorecard [prévision à confirmer par la première exécution] :
  - « Token-Permissions » : écritures au niveau workflow dans `secret-scan.yml:25-27`, `issue-auto-label.yml:10-11`, `promote-preprod.yml:26-27`, `promote-production.yml:26-27`.
  - « Pinned-Dependencies » : actions épinglées par SHA (positif) ; `npm install --global npm@12.2.3` (`.github/actions/setup-ci-app/action.yml:31`, `docker/app.Dockerfile:16`) et images Docker non épinglées par digest (`docker/*.Dockerfile:1`).
  - « Code-Review » : 0 approbation exigée (mainteneur unique, 115 Q1).
  - « Branch-Protection » : ruleset actif ; lecture complète possiblement limitée avec `GITHUB_TOKEN` [à confirmer].
  - « SAST » (CodeQL), « Security-Policy » (`SECURITY.md`), « Dependency-Update-Tool » (Dependabot, puis Renovate), « CI-Tests » : favorables.
  - « License » : licence détectée `NOASSERTION` par GitHub (115 FR-10) [impact à confirmer].
  - « Fuzzing », « Signed-Releases », « Packaging », « CII-Best-Practices » : non applicables ou absents.
- [vérifié, source externe] L'action exige `id-token: write` pour `publish_results: true`, aucune écriture au niveau workflow et `id-token` limité au job Scorecard ; un jeton personnel fin n'est utile que pour lire la protection de branche classique — README `ossf/scorecard-action`, consulté le 2026-11-20.

## 5. Comportement cible

Workflow `scorecard.yml` isolé (contraintes de l'action), hebdomadaire, sur push `main` et sur modification de règle de protection ; résultats SARIF dans l'onglet Security ; `publish_results: true` (API et badge) ; résumé du score par vérification ; plan d'amélioration versionné et revu chaque trimestre.

## 6. Périmètre

### Inclus
- Workflow, publication, badge, plan d'amélioration, suivi dans le rapport hebdomadaire (127).

### Exclu
- Les corrections elles-mêmes (portées par 113, 115, 116, 117, 118).

## 7. User stories

- En tant que mainteneur, je veux voir chaque semaine si une pratique de sécurité régresse, afin de la corriger tôt.
- En tant qu'utilisateur ou partenaire, je veux un indicateur public de sérieux du projet.

## 8. Règles métier

- RM-01 Le score n'est jamais un objectif en soi : une vérification inadaptée est documentée comme « acceptée » avec sa raison.
- RM-02 Aucun jeton personnel n'est créé pour Scorecard sans décision explicite (Q1).

## 9. Parcours utilisateurs

Lundi → Scorecard → SARIF → onglet Security → ligne dans le rapport hebdomadaire → action éventuelle.

## 10. Exigences fonctionnelles

- FR-01 `scorecard.yml` : déclencheurs `schedule` (hebdo), `push` sur `main`, `branch_protection_rule`, `workflow_dispatch` ; `permissions: read-all` ou `{}` au niveau workflow ; job avec `security-events: write`, `id-token: write`.
- FR-02 `publish_results: true` ; envoi SARIF par `github/codeql-action/upload-sarif` (épinglé) ; artefact SARIF 14 jours.
- FR-03 Résumé de job : score global et par vérification, écart avec la semaine précédente.
- FR-04 Plan d'amélioration (`docs/…/scorecard-plan.md`, emplacement 128) : vérification, score, action, spec porteuse, statut (« à corriger », « accepté »).
- FR-05 Badge Scorecard dans le README (128) si Q2 = oui.
- FR-06 Alertes Scorecard de sévérité haute ignorées par la règle CodeQL du ruleset (outil distinct) ; suivies par le rapport, non bloquantes.

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € ; durée ≤ 3 min [à mesurer].
- NFR-02 Confidentialité : résultats publics par nature (dépôt public).

## 12. Cas nominaux et alternatifs

- Nominal : score publié chaque lundi.
- Alternatif : échec d'authentification ou d'API → issue d'échec planifié (113).

## 13. Cas limites

- Ruleset non lisible par `GITHUB_TOKEN` : vérification « Branch-Protection » sous-évaluée, documentée comme limite (Q1).

## 14. Gestion des erreurs

Échec → notification 113 ; aucun blocage de PR.

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Publication sur l'API publique Scorecard (`api.scorecard.dev`).

## 17. Compatibilité avec l'existant

Liste d'actions autorisées (115 FR-05) complétée par `ossf/scorecard-action`.

## 18. Dépendances

- Bloquante : V2-SEC-01 (115).
- Liées : V2-CICD-01 (113), V2-CICD-04 (127), V2-CICD-05 (128).

## 19. Critères d'acceptation

- AC-01 Une exécution planifiée publie un SARIF visible dans l'onglet Security (outil « Scorecard »).
- AC-02 L'API publique renvoie le dernier résultat du dépôt.
- AC-03 Le plan d'amélioration couvre chaque vérification inférieure à 10 avec une décision.
- AC-04 Après correction des permissions (113 FR-04), « Token-Permissions » progresse à l'exécution suivante.

## 20. Scénarios de tests

`workflow_dispatch` initial ; comparaison avant/après correction des permissions.

## 21. Exigences de non-régression

Aucune PR bloquée par Scorecard ; les autres outils de code scanning restent inchangés.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Course au score au détriment de l'usage | Moyen | Faible | RM-01 |
| Score bas jugé négativement | Faible | Moyenne | Plan d'amélioration public et argumenté |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes et décisions

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Jeton personnel fin pour lire la protection de branche | Oui / non | Non (jeton longue durée à gérer ; limite documentée) | Non (jeton longue durée à gérer ; limite documentée) (décision du product owner, 2026-11-24) |
| Q2 | Badge Scorecard dans le README | Oui / non | Oui, une fois le premier plan publié | Oui, une fois le premier plan publié (décision du product owner, 2026-11-24) |
| Q3 | Badge OpenSSF Best Practices (auto-déclaration) | Oui / non / plus tard | Plus tard (après 128) | Plus tard (après 128) (décision du product owner, 2026-11-24) |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §17 ; specs 113, 115, 117, 118, 127, 128.
