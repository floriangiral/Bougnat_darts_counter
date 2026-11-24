# Plan d'amélioration OpenSSF Scorecard

Ce plan accompagne la [spec 119](../../specs/119-counter-sec-openssf-scorecard/spec.md). Scorecard est informatif : il ne bloque aucune PR et ne doit pas conduire à des changements faits uniquement pour le score.

**Aucun score n'a encore été relevé.** L'analyse publiée ne s'exécute que sur `main` (push, hebdomadaire, `workflow_dispatch` ou modification d'une règle de protection) ; la colonne « Score » est à renseigner depuis le résumé du workflow « OpenSSF Scorecard Summary » après la première exécution.

| Vérification | Score | Action | Spec porteuse | Statut |
|---|---|---|---|---|
| Token-Permissions | à relever | Permissions `{}` ou lecture seule au niveau workflow, écriture par job | [113](../../specs/113-counter-cicd-workflow-architecture/spec.md), [115](../../specs/115-counter-sec-github-governance/spec.md) | à corriger |
| Pinned-Dependencies | à relever | Actions épinglées par SHA, maintenues par Renovate (`helpers:pinGitHubActionDigests`) | [116](../../specs/116-counter-dep-renovate-dependabot/spec.md) | à corriger |
| Dependency-Update-Tool | à relever | Renovate (Dependabot conservé pour les alertes) | [116](../../specs/116-counter-dep-renovate-dependabot/spec.md) | à corriger |
| SAST | à relever | CodeQL `javascript-typescript` et `actions` sur chaque PR | [117](../../specs/117-counter-sec-vulnerability-scanning/spec.md) | à corriger |
| Vulnerabilities | à relever | OSV-Scanner et politique de sévérité de `SECURITY.md` | [117](../../specs/117-counter-sec-vulnerability-scanning/spec.md) | à corriger |
| Dangerous-Workflow | à relever | Entrées transmises par l'environnement, jamais interpolées dans `run` | [115](../../specs/115-counter-sec-github-governance/spec.md) | à corriger |
| Branch-Protection | à relever | Rulesets ; lecture partielle sans jeton personnel (Q1 : aucun jeton) | [115](../../specs/115-counter-sec-github-governance/spec.md) | accepté (limite documentée) |
| Code-Review | à relever | Revue du mainteneur sur toute PR | [115](../../specs/115-counter-sec-github-governance/spec.md) | à corriger |
| Security-Policy | à relever | `SECURITY.md` | [118](../../specs/118-counter-sec-secrets-detection/spec.md) | à corriger |
| Signed-Releases, Packaging, Fuzzing, CII-Best-Practices | à relever | Hors périmètre d'une PWA sans paquet publié ; badge Best Practices reporté (Q3) | [119](../../specs/119-counter-sec-openssf-scorecard/spec.md) | accepté |

Le badge Scorecard du README sera ajouté une fois ce plan renseigné avec les premiers scores (Q2).
