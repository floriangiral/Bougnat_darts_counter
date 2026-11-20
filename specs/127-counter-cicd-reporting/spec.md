---
id: 127-counter-cicd-reporting
v2_id: V2-CICD-04
titre: Rapport hebdomadaire DevSecOps et pilotage par indicateurs
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P2
difficulte: M
recommandation: recommande
lot: 2
poids: 10
depend_de: [V2-CICD-01, V2-DEP-01, V2-SEC-02]
remplace: []
remplacee_par: []
issue: '#314'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 127 — Rapport hebdomadaire DevSecOps et pilotage par indicateurs

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§24) exige un reporting lisible (dépendances, PR Renovate, vulnérabilités, couverture, mutation, régressions, Lighthouse, Knip, Scorecard, erreurs de production, durée et consommation CI) avec une synthèse hebdomadaire, par des moyens natifs et gratuits, sans multiplier notifications ni outils. Le projet doit pouvoir être maintenu pendant des périodes sans développement actif : le rapport est l'unique point de contrôle hebdomadaire du mainteneur.

## 2. Problématique

Les informations sont dispersées (résumés de jobs, onglet Security, SonarCloud, futur Dashboard Renovate) et rien ne signale un contrôle planifié en échec : trois échecs hebdomadaires consécutifs sont passés inaperçus en novembre (113 §4).

## 3. Objectifs

- O1 : une page unique, mise à jour chaque lundi, consultable en deux minutes.
- O2 : une seule notification hebdomadaire au plus, et seulement si un indicateur est rouge.
- O3 : historique des tendances sur 12 semaines sans base de données ni service externe.

## 4. État actuel vérifié dans le code

- [vérifié] Résumés existants : couverture (`quality-gate.yml:100-116`, planchers affichés faux, 043), tableau `npm outdated` (`dependency-watch.yml:33-55`), résumés de succès des scans (`security-review.yml:70-78`, `103-112`).
- [vérifié] Aucun rapport consolidé, aucune issue de suivi, aucune notification d'échec planifié.
- [vérifié] `gh run list` du 2026-11-20 est dominé par 30 exécutions `Issue Auto Label` (création des issues V2) : la liste brute des exécutions n'est pas un outil de pilotage.
- [vérifié] Permissions du `GITHUB_TOKEN` disponibles par job : `actions`, `contents`, `issues`, `pull-requests`, `security-events` (lecture des alertes de code scanning). [à confirmer] Les alertes Dependabot et secret scanning ne sont pas lisibles par `GITHUB_TOKEN` ; elles seraient alors comptées manuellement ou remplacées par les résultats OSV.
- [vérifié, source externe] L'API publique Scorecard expose le dernier résultat quand `publish_results` est actif (README `ossf/scorecard-action`, consulté le 2026-11-20).

## 5. Comportement cible

Workflow hebdomadaire (lundi après la vague Renovate et les planifiés) qui collecte les indicateurs, met à jour **une issue épinglée** « Tableau de bord DevSecOps » (corps remplacé, tableau de tendances sur 12 semaines), écrit le même contenu dans le résumé du job et en artefact JSON, et ajoute **un** commentaire mentionnant le mainteneur seulement si un seuil d'alerte est franchi.

| Indicateur | Source | Seuil d'alerte (proposé) |
|---|---|---|
| Dépendances obsolètes | `npm outdated --json` | > 15 ou une majeure de plus de 6 mois |
| PR Renovate ouvertes / fusionnées auto / en échec | API PR (auteur `renovate[bot]`) | PR en échec depuis > 7 jours |
| Vulnérabilités ouvertes par sévérité et outil | API code scanning (CodeQL, OSV, Scorecard) ; Dependabot si accessible | Toute critique ; haute > 14 jours |
| Couverture (globale, composants) | Artefact `coverage-summary.json` du dernier `ci` sur `main` ; Codecov si 120 | Baisse > 1 point |
| Score de mutation | Artefact Stryker (122) | Baisse > 5 points |
| Régressions fonctionnelles | Résultats E2E nocturnes (réussis, échecs, instables) | Un nightly rouge > 24 h |
| Lighthouse | Médianes de la dernière exécution sur `main` (123) | Écart > seuils 123 |
| Dette Knip | Artefact Knip (121) | Hausse sur 2 semaines |
| Score OpenSSF | API Scorecard (119) | Baisse > 0,5 |
| Erreurs de production | Sentry si 125 retenue (lecture manuelle ou jeton en lecture, Q3) | Nouvelle erreur non triée |
| Durée et consommation CI | API Actions (`/runs`, durée par exécution) | Hausse > 30 % sur 4 semaines |
| État des réglages | Script 115 FR-11 | Tout écart critique |
| Planifiés absents | API Actions | Planifié non exécuté depuis > 8 jours |

## 6. Périmètre

### Inclus
- Collecte, mise en forme, issue épinglée, artefact, notification unique, historique de 12 semaines.

### Exclu
- Plateforme de tableau de bord externe ; correction des écarts (specs porteuses).

## 7. User stories

- En tant que mainteneur peu disponible, je veux une seule page le lundi, afin de savoir si le projet est sain sans parcourir cinq outils.
- En tant qu'agent IA, je veux un JSON stable des indicateurs, afin de prioriser les corrections (126).

## 8. Règles métier

- RM-01 Une seule issue de tableau de bord, jamais recréée.
- RM-02 Au plus une notification par semaine, seulement en cas d'alerte.
- RM-03 Un indicateur indisponible est affiché « non mesuré » avec la raison, jamais omis ni inventé.

## 9. Parcours utilisateurs

Lundi 10:00 (Paris) → rapport → l'issue épinglée est à jour → en cas d'alerte, commentaire avec liens vers les éléments à traiter.

## 10. Exigences fonctionnelles

- FR-01 Job `weekly-report` (`weekly-maintenance.yml`, 113) avec `issues: write`, `actions: read`, `pull-requests: read`, `security-events: read` au niveau du job.
- FR-02 Script `scripts/ci/weekly-report.mjs` (Node natif, API GitHub via `fetch` et `GITHUB_TOKEN`) produisant `weekly-report.json` et `weekly-report.md`.
- FR-03 Mise à jour du corps de l'issue épinglée ; tendances 12 semaines conservées dans un bloc JSON caché du corps (aucun commit).
- FR-04 Seuils d'alerte configurables dans un fichier versionné.
- FR-05 Lien vers le Dependency Dashboard Renovate, l'onglet Security, SonarCloud et Codecov.
- FR-06 Tests unitaires du script (réponses d'API simulées, indicateurs manquants).

## 11. Exigences non fonctionnelles

- NFR-01 Durée ≤ 3 min ; coût 0 €.
- NFR-02 Aucune donnée sensible dans l'issue (pas de valeur de secret, pas d'extrait de journal).

## 12. Cas nominaux et alternatifs

- Nominal : tout est vert, aucune notification.
- Alternatif : vulnérabilité critique ouverte → commentaire unique avec lien.

## 13. Cas limites

- Première semaine : pas de tendance, « référence ».
- API limitée (quota) : indicateurs concernés « non mesurés » (RM-03).

## 14. Gestion des erreurs

Échec du rapport → issue d'échec planifié (113) ; le tableau de bord indique la date de dernière mise à jour.

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Format `weekly-report.json` documenté (consommé par les agents, 126).

## 17. Compatibilité avec l'existant

Remplace le tableau de `dependency-watch.yml` (retiré par 113).

## 18. Dépendances

- Bloquantes : V2-CICD-01 (113), V2-DEP-01 (116), V2-SEC-02 (117).
- Enrichissements : V2-SEC-01 (115 FR-11), V2-SEC-04 (119), V2-QA-12 (120), V2-QA-13 (121), V2-QA-14 (122), V2-QA-15 (123), V2-OBS-01 (125).

## 19. Critères d'acceptation

- AC-01 L'issue épinglée est mise à jour chaque lundi avec tous les indicateurs (ou « non mesuré » motivé).
- AC-02 Une alerte simulée (seuil abaissé sur branche jetable via `workflow_dispatch`) produit un seul commentaire.
- AC-03 Un planifié désactivé est signalé « absent » après 8 jours.
- AC-04 Le JSON est valide et documenté.
- AC-05 Les tendances couvrent jusqu'à 12 semaines sans commit dans le dépôt.

## 20. Scénarios de tests

Tests unitaires du script ; `workflow_dispatch` avec seuils de test ; observation de 4 lundis.

## 21. Exigences de non-régression

Aucune notification supplémentaire en régime normal.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Rapport ignoré | Moyen | Moyenne | Une alerte claire seulement si nécessaire |
| Indicateurs inaccessibles au `GITHUB_TOKEN` | Faible | Moyenne | RM-03, alternatives (OSV), saisie manuelle |
| Maintenance du script | Faible | Moyenne | Tests, format simple |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Support du tableau de bord | Issue épinglée / Discussion / Wiki / page GitHub Pages | Issue épinglée (native, notifiable, lisible par les agents) | — |
| Q2 | Heure du rapport | Lundi 10:00 / dimanche soir | Lundi 10:00 Paris (après Renovate et planifiés) | — |
| Q3 | Erreurs Sentry dans le rapport | Lecture manuelle / jeton en lecture | Manuelle tant que 125 n'est pas tranchée | — |
| Q4 | Seuils d'alerte | Tels que §5 / autres | Tels que §5, revus après 4 semaines | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §24 ; specs 113 à 126.
