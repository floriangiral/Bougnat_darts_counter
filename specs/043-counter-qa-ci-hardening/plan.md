# Plan — 043 Durcissement de la CI

> Plan validé avec la spec le 2026-11-23 et exécuté au commit `7bdb292` (voir « Implémentation » dans la spec).

## 1. Lecture de l'existant

- `.github/workflows/quality-gate.yml:28-147` (jobs `validate`, `global-quality-baseline`, `sonar`).
- `.github/workflows/e2e.yml:6-25`, `.github/workflows/reusable-integration-smoke.yml:12-50`.
- `.github/actions/run-local-smoke/action.yml:22-57`, `.github/actions/setup-ci-app/action.yml:52-55`.
- `scripts/run-playwright.sh:75-95`, `scripts/guard-clean-codebase.sh:59-67`.
- `package.json:15-28` (scripts), `CONTRIBUTING.md:35-48`, `vitest.config.ts:28-33`, `.github/dependabot.yml`.
- `.github/workflows/security-review.yml:80-105` (Snyk).

## 2. Approche retenue (et alternatives écartées)

Retenue : modifications ciblées des workflows existants (noms de jobs conservés), seuils lus depuis la configuration, un seul serveur pour le smoke.
Écartées : réécriture complète des workflows (risque sur la protection de branche) ; services CI tiers (coût, compte) ; exécution de `npm run ci:check` en une seule étape (diagnostic moins lisible, `build` déjà paramétré par variables).

## 3. Étapes

1. `validate` : ajouter les étapes `guard:clean`, `wrangler:check`, `governance:coverage`, `lint:type-aware` (après décision Q1).
2. Script de garde : remplacer `rg` par `git grep` (Q5) ou ajouter `command -v rg || fail`.
3. `e2e.yml` : branches `develop` + `schedule` nocturne (`cron`, ex. 03:17 UTC) + `workflow_dispatch` conservé.
4. `run-local-smoke` : exporter `PLAYWRIGHT_EXTERNAL_SERVER=1`, ajouter `--strictPort`, journal dans `$RUNNER_TEMP`, artefact du journal en cas d'échec (dans `reusable-integration-smoke.yml`).
5. Résumé de couverture : petit script Node lisant les seuils (export depuis `vitest.config.ts` ou constante partagée) ; suppression de la ligne en dur `quality-gate.yml:115`.
6. Rapport « flaky » : reporter JSON Playwright en CI + résumé listant les tests `flaky`.
7. Couverture unique : le job `sonar` télécharge l'artefact `coverage/` produit par la baseline quand elle existe, sinon la calcule.
8. Forks : condition sur la disponibilité du secret (variable d'environnement testée dans une étape) pour Sonar et Snyk.
9. `CONTRIBUTING.md` : aligner « Vérification minimale ».
10. Spec 029 : note de validation CI datée.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `.github/workflows/quality-gate.yml` | Étapes ajoutées, résumé corrigé, couverture partagée, garde fork |
| `.github/workflows/e2e.yml` | Déclencheurs `develop` + nightly |
| `.github/workflows/reusable-integration-smoke.yml` | Artefact du journal serveur |
| `.github/actions/run-local-smoke/action.yml` | Serveur unique, port strict, `$RUNNER_TEMP` |
| `.github/workflows/security-review.yml` | Garde fork pour Snyk |
| `scripts/guard-clean-codebase.sh` | Échec explicite sans `rg` ou `git grep` |
| `playwright.config.ts` | Reporter JSON en CI |
| `package.json` | Éventuellement `--max-warnings 0` sur `lint:type-aware` (Q1) |
| `CONTRIBUTING.md` | Liste des vérifications |
| `specs/029-…/spec.md` | Note de validation CI |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet. Si des noms de jobs changent malgré tout : mettre à jour les règles de protection de `main`, `develop`, `preprod` le même jour.

## 7. Stratégie de test

PR de démonstration pour chaque garde (AC-01, AC-02, AC-05, AC-06) ; observation d'une exécution nocturne (AC-03) ; PR depuis un fork de test (AC-07).

## 8. Non-régression

Aucun contrôle retiré ; `promote-production.yml` continue d'appeler `run-local-smoke` ; seuils inchangés.

## 9. Rollback / désactivation

Revert du commit de workflow ; le `schedule` peut être désactivé seul.

## 10. Documentation à mettre à jour avec l'implémentation

`CONTRIBUTING.md` (vérification minimale), `docs/technical.md` (section CI, ou `docs/dev/ci-cd.md` si 035 est validée), spec 029 (note de validation).

## Révision DevSecOps — plan proposé

Ajouter l'étape « notification des échecs planifiés » (action composite commune, réutilisée par 113) avant l'étape 3 ; conditionner l'étape 3 (déclencheurs E2E) à la décision 113 Q1 ; ne renommer aucun job.
