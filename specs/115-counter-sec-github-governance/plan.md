# Plan — 115 Gouvernance du dépôt GitHub

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Configuration lue le 2026-11-20 : `gh api repos/floriangiral/Bougnat_darts_counter`, `/rulesets/14279738`, `/rulesets/14406598`, `/actions/permissions`, `/actions/permissions/workflow`, `/environments`, `/actions/secrets` (noms), `/automated-security-fixes`, `/private-vulnerability-reporting`.
- `.github/workflows/promote-preprod.yml:26-116`, `promote-production.yml:26-129`.
- `docs/technical.md:362-382`.

## 2. Approche retenue (et alternatives écartées)

Retenue : réglages appliqués manuellement par le product owner dans l'ordre des tâches de cette spec, chacun vérifié par `gh api` ; correctifs de workflows par PR.
Écartées : gestion de la configuration « as code » par une application tierce (permissions administrateur à une application, dépendance externe) ; script d'écriture automatique (jeton administrateur à longue durée de vie).

## 3. Étapes

1. Exporter les rulesets (JSON) et l'état des paramètres.
2. PR « durcissement promotions » : `inputs.reason` via `env:`, suppression de l'affichage de la réponse API, permissions au niveau job, jeton d'application si Q2 = finaliser.
3. Opérations manuelles sans risque : suppression des branches fusionnées, mise à jour de branche, squash seul, auto-merge autorisé, approbateur `Production`.
4. Inventaire `uses:` → liste d'actions autorisées → `allowed_actions: selected`, `sha_pinning_required: true` → workflow de test.
5. Ruleset `main` : résolution des conversations, squash, `require_code_owner_review` selon Q3 ; migration des checks avec 113/114.
6. Rulesets `release/**` (et `develop`) ; le ruleset `release` est maintenant actif et interdit suppression/force-push, mais PR et checks restent à configurer pour satisfaire FR-03. Puis ruleset `preprod`/`production` selon Q2.
7. Après 116 : désactivation des mises à jour de sécurité Dependabot.
8. Script `scripts/ci/check-github-settings.mjs` (lecture seule) + tests sur fixtures JSON.
9. Nettoyage des branches obsolètes validées.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `.github/workflows/promote-preprod.yml`, `promote-production.yml` | Injection, affichage, permissions, jeton |
| `scripts/ci/check-github-settings.mjs` (nouveau) | Vérification de l'état cible |
| `tests/unit/tooling/checkGithubSettings.test.ts` (nouveau) | Tests |
| `docs/technical.md` | État réel de la gouvernance |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Ordre imposé par RM-04 : jamais de check requis avant que le workflow qui le publie soit fusionné sur `main`.

## 7. Stratégie de test

Lecture `gh api` avant/après chaque réglage ; workflow de test pour les actions non autorisées ; promotion `preprod` à blanc.

## 8. Non-régression

Promotions, Sonar, CodeQL et smoke inchangés ; aucune PR existante bloquée (vérifier les PR ouvertes avant chaque bascule).

## 9. Rollback / désactivation

Réimport des exports JSON de rulesets ; réglages inverses dans l'interface (tous réversibles).

## 10. Documentation à mettre à jour avec l'implémentation

Documentation technique de la gouvernance ; `CONTRIBUTING.md` (compromis de revue) ; `docs/technical.md` ; `SECURITY.md` (contrôles réellement actifs).
