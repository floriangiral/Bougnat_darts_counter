# Plan — 114 Quality gate agrégé et politique d'auto-merge vérifiable

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Ruleset `main` (id 14279738) : checks requis, règles `code_scanning`, `code_quality`, `pull_request` [lu le 2026-11-20].
- `.github/workflows/quality-gate.yml:79-116` (job conditionnel `Global Quality Baseline`), `e2e.yml`, `security-review.yml`.
- Paramètres du dépôt : `allow_auto_merge: false`, `allow_update_branch: false`.

## 2. Approche retenue (et alternatives écartées)

Retenue : agrégateur par workflow + script d'éligibilité versionné ; auto-merge natif activé par Renovate (`platformAutomerge`).
Écartées : merge queue (indisponible pour un compte personnel) ; auto-merge piloté par Renovate seul sans vérification CI (politique non vérifiable dans le dépôt) ; application tierce d'auto-merge (permissions larges) ; application `renovate-approve` (inutile tant qu'aucune approbation n'est exigée).

## 3. Étapes

1. Écrire `scripts/ci/expected-jobs.mjs` et ses tests (fixtures `needs` : success, failure, skipped, cancelled).
2. Ajouter le job `requis` à chaque workflow applicatif (113).
3. Écrire `scripts/ci/automerge-eligibility.mjs` et ses tests (identité, liste blanche, classification semver sans dépendance).
4. Job `eligibilite` dans `e2e.yml` : calcule l'éligibilité, déclenche `e2e-complet`, désactive l'auto-merge si nécessaire.
5. Opérations manuelles (128) : `allow_auto_merge: true`, squash seul, `allow_update_branch: true`, ruleset mis à jour (agrégateurs requis).
6. Activer l'auto-merge dans Renovate (116) seulement après 2 semaines d'agrégateurs stables.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `scripts/ci/expected-jobs.mjs` (nouveau) | Vérification des jobs attendus |
| `scripts/ci/automerge-eligibility.mjs` (nouveau) | Éligibilité infalsifiable |
| `tests/unit/tooling/expectedJobs.test.ts`, `automergeEligibility.test.ts` (nouveaux) | Tests |
| `.github/workflows/*.yml` | Jobs `requis` et `eligibilite` |
| `eslint.config.js` | Inclusion de `scripts/ci/` si nécessaire |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Cohabitation anciens checks + agrégateurs pendant 2 semaines, puis bascule du ruleset (plan 113 §6).

## 7. Stratégie de test

Unitaires des scripts (couverture 029 : `scripts/` hors périmètre Sonar actuel, tests exigés malgré tout) ; PR jetables pour les cas négatifs ; observation de la première vague Renovate.

## 8. Non-régression

Les PR humaines gardent le même parcours ; la règle CodeQL du ruleset est conservée.

## 9. Rollback / désactivation

Désactiver l'auto-merge dans la configuration Renovate (`automerge: false`) et/ou `allow_auto_merge: false` ; restaurer l'export du ruleset.

## 10. Documentation à mettre à jour avec l'implémentation

Documentation CI (128) : politique d'auto-merge, noms des agrégateurs, procédure en cas d'échec ; `CONTRIBUTING.md` ; `AGENTS.md` (RM-04).
