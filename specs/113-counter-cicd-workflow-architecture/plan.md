# Plan — 113 Architecture des workflows GitHub Actions et fréquences des contrôles

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `.github/workflows/quality-gate.yml:28-147`, `security-review.yml:29-169`, `secret-scan.yml:29-54`, `e2e.yml`, `reusable-integration-smoke.yml`, `dependency-watch.yml`.
- `.github/actions/setup-ci-app/action.yml:16-55`, `.github/actions/run-local-smoke/action.yml:22-57`.
- `playwright.config.ts:16-53`, `vitest.config.ts:22-34`.
- Ruleset `main` (checks requis : `NPM Audit`, `Dependency Review`, `Gitleaks`, `Lint, Typecheck, Unit Tests, Build`, `smoke / Local Integration Smoke`, `SonarCloud`, `SonarCloud Code Analysis`, `Global Quality Baseline`) [lu via `gh api …/rulesets/14279738`, 2026-11-20].

## 2. Approche retenue (et alternatives écartées)

Retenue : évolution progressive des fichiers existants vers le catalogue cible, avec un job agrégateur par workflow (spec 114) qui devient le seul check requis ; anciens noms retirés du ruleset seulement après deux semaines de cohabitation.
Écartées : workflow monolithique (diagnostic et relances difficiles) ; un workflow par outil (doublons d'installation, 15 fichiers ou plus) ; workflows réutilisables externes (dépendance tierce).

## 3. Étapes

1. Prérequis : 043 livrée (serveur unique, garde, seuils lus à la source).
2. `ci.yml` : job `validate` (installation, lint ×2, types, Vitest + couverture, build) → artefacts `coverage/` et `dist/` ; jobs `sonar`, `codecov` (120), `bundle-budget` (044) consommant les artefacts ; job agrégateur (114).
3. `e2e.yml` : job `e2e-critique` (PR, push) et job `e2e-complet` (planifié, `workflow_dispatch`, PR éligibles selon 114) ; `retention-days`.
4. `security.yml` : fusion Gitleaks + CodeQL + OSV + Dependency Review (117, 118) ; permissions par job.
5. `performance.yml`, `weekly-maintenance.yml`, `mutation.yml`, `scorecard.yml` créés par leurs specs respectives, sur le gabarit commun (concurrence, délais, résumé, notification).
6. Action composite `notify-scheduled-failure` (ou étape `actions/github-script` épinglée) : crée, met à jour ou ferme l'issue `ci:echec-planifie`.
7. Marquage `@critique` dans `tests/e2e/*.spec.ts` (parcours de base, lien externe) et sélection par `--grep`.
8. Migration des checks requis (115) : ajout des agrégateurs au ruleset → deux semaines → retrait des anciens noms.
9. Retrait de `dependency-watch.yml` après activation du Dependency Dashboard (116).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `.github/workflows/quality-gate.yml` → `ci.yml` | Restructuration, artefacts partagés, agrégateur |
| `.github/workflows/security-review.yml`, `secret-scan.yml` → `security.yml` | Fusion, permissions par job |
| `.github/workflows/e2e.yml`, `reusable-integration-smoke.yml` | Deux niveaux, nightly, rétention |
| `.github/workflows/dependency-watch.yml` | Suppression (après 116) |
| `.github/workflows/issue-auto-label.yml` | Permission au niveau job |
| `.github/actions/setup-ci-app/action.yml` | Vérification de version npm |
| `.github/actions/notify-scheduled-failure/action.yml` (nouveau) | Issue d'échec planifié |
| `playwright.config.ts`, `tests/e2e/*.spec.ts` | Marquage `@critique` |
| `vitest.config.ts` | Reporter `junit` |
| `README.md` | Badges (128) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Checks requis : (1) ajouter les nouveaux jobs sans toucher au ruleset ; (2) ajouter les agrégateurs au ruleset ; (3) observer 10 PR ou 2 semaines ; (4) retirer les anciens noms. Chaque étape est une opération manuelle listée dans 128.

## 7. Stratégie de test

PR jetables (succès, échec unitaire, échec E2E critique) ; `workflow_dispatch` d'un planifié en échec forcé (entrée `simulate_failure` acceptée uniquement en `workflow_dispatch`) ; fork de test.

## 8. Non-régression

Les contrôles actuels restent exécutés jusqu'au retrait validé ; `promote-production.yml` inchangé ; note de validation CI ajoutée à la spec 029.

## 9. Rollback / désactivation

Revert des commits de workflow ; restauration de la liste de checks requis du ruleset (export JSON conservé avant modification).

## 10. Documentation à mettre à jour avec l'implémentation

Documentation CI (128) : catalogue, matrice, noms de checks, horaires ; `docs/technical.md` section « Flux GitHub Actions » ; `CONTRIBUTING.md` ; spec 029 (note de validation).
