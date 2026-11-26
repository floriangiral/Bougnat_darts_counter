# Plan d'amélioration OpenSSF Scorecard

Ce plan accompagne la [spec 119](../../specs/119-counter-sec-openssf-scorecard/spec.md). Scorecard est informatif : il ne bloque aucune PR et ne doit pas conduire à des changements faits uniquement pour le score.

**Premier résultat publié : 7,6/10**, le 24 novembre 2026 sur `main` au commit
`d8d5c774b813485af078fdceae1b332d985d3394` ([exécution réussie](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45486955356),
[résultat public](https://api.scorecard.dev/projects/github.com/floriangiral/Bougnat_darts_counter)).
L'échec de démarrage initial n'empêche donc plus cette publication ; l'exécution
hebdomadaire reste à observer ([spec 119, §26](../../specs/119-counter-sec-openssf-scorecard/spec.md#26-diagnostic-de-démarrage--2026-11-24)).
Les scores ci-dessous sont un instantané, pas la promesse du prochain résultat.

| Vérification | Score | Décision ou action | Spec porteuse | Statut |
|---|---|---|---|---|
| Branch-Protection | 4/10 | Le ruleset `main` exige une PR et des contrôles, mais aucun approbateur ; une revue CODEOWNERS est demandée sans fichier CODEOWNERS et l'approbation du dernier push est désactivée. Examiner ces choix et la disponibilité d'un autre réviseur dans une PR de gouvernance dédiée, sans ajouter de jeton personnel. | [115](../../specs/115-counter-sec-github-governance/spec.md) | À décider |
| Code-Review | 0/10 | L'analyse relève 0 changement approuvé sur 8. Organiser des approbations GitHub par une autre personne ; une exigence d'approbation sans réviseur disponible bloquerait les PR de leur auteur. | [115](../../specs/115-counter-sec-github-governance/spec.md) | À organiser |
| Fuzzing | 0/10 | Des tests par propriétés `fast-check` renforcent les entrées des liens partenaires : origines de retour et nettoyage des prénoms ([tests](../../tests/unit/externalMatch/externalMatchLink.test.ts)). Vérifier leur détection après fusion sur `main` et la prochaine analyse ; ne pas supposer l'alerte résolue avant publication. | [030](../../specs/030-counter-external-match-link/spec.md) | À vérifier en CI |
| CII-Best-Practices | 0/10 | L'inscription au programme et l'auto-évaluation exigent une intervention du mainteneur ; la décision Q3 les reporte après la spec 128. | [119](../../specs/119-counter-sec-openssf-scorecard/spec.md) | Reporté |
| License | 9/10 | La licence est détectée, mais GitHub indique `NOASSERTION` ; examiner la reconnaissance sans changer les termes de la licence pour le score seul. | [115](../../specs/115-counter-sec-github-governance/spec.md) | À examiner |
| Contributors | 0/10 | Scorecard ne relève aucune organisation contributrice ; ne pas inventer de contributions ou d'organisations pour le score. | [119](../../specs/119-counter-sec-openssf-scorecard/spec.md) | Accepté |
| Packaging | non évalué | L'application est une PWA et ne publie pas de paquet ; aucun pipeline de packaging n'est détecté. | [119](../../specs/119-counter-sec-openssf-scorecard/spec.md) | Accepté |
| Signed-Releases | non évalué | Scorecard ne détecte pas de release dans cette analyse ; vérifier la détection et la pertinence d'une signature avant toute décision. | [119](../../specs/119-counter-sec-openssf-scorecard/spec.md) | À examiner |

Les vérifications Maintained, Security-Policy, Binary-Artifacts, Token-Permissions,
Dangerous-Workflow, Dependency-Update-Tool, Pinned-Dependencies, Vulnerabilities,
SAST et CI-Tests sont à 10/10 dans ce relevé ; les pratiques correspondantes
restent à maintenir.
