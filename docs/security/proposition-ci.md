# Proposition de mise en place des outils de sécurité CI

Cette proposition accompagne les specs validées [113](../../specs/113-counter-cicd-workflow-architecture/spec.md), [114](../../specs/114-counter-cicd-quality-gate-automerge/spec.md), [115](../../specs/115-counter-sec-github-governance/spec.md), [116](../../specs/116-counter-dep-renovate-dependabot/spec.md), [117](../../specs/117-counter-sec-vulnerability-scanning/spec.md), [118](../../specs/118-counter-sec-secrets-detection/spec.md) et [119](../../specs/119-counter-sec-openssf-scorecard/spec.md). Elle prépare la revue du mainteneur requise avant les modifications des workflows et des politiques de sécurité. Aucun outil proposé ci-dessous n'est déclaré livré par ce document.

## Justification et ordre

1. **Secrets et promotions** : préserver le check Gitleaks, masquer ses sorties et supprimer les commentaires et artefacts susceptibles de republier des secrets ; corriger l'interpolation des entrées et la sortie des réponses API dans les workflows de promotion. Vérifier les exceptions et documenter un scan historique sans exposer les valeurs. La procédure de rotation préparée est dans [rotation-secrets.md](rotation-secrets.md).
2. **Architecture et contrôles requis** : appliquer progressivement la spec 113, puis la spec 114, en conservant les contrôles requis existants jusqu'à la publication et la vérification des nouveaux agrégateurs. Épingler les actions et limiter les permissions par job. Le changement des rulesets et des réglages du dépôt est une opération du product owner, après export et vérification.
3. **Scans de vulnérabilités** : conserver Dependency Review ; étendre CodeQL aux workflows après correction de l'injection ; ajouter OSV-Scanner sur PR et en analyse complète planifiée. Maintenir Snyk et `npm audit` pendant quatre semaines de comparaison ; ne les retirer que lorsque les conditions de la spec 117 sont satisfaites. La validation et l'expiration des exceptions doivent être contrôlées.
4. **Renovate** : installation manuelle de l'application Mend sur ce seul dépôt, puis configuration et validation, d'abord sans auto-merge. Conserver les alertes Dependabot et ne désactiver ses mises à jour de sécurité qu'après une première PR de sécurité Renovate réussie. L'auto-merge attend la spec 114.
5. **Scorecard** : après application des prérequis de gouvernance 115, ajouter le workflow isolé, la publication SARIF et le plan d'amélioration. Le badge attend le premier plan publié. Aucun jeton personnel n'est prévu.

## Revue, recette et limites

- Chaque modification de workflow ou de politique nécessite une PR dédiée, une justification écrite et une revue du mainteneur selon `AGENTS.md`. Cette proposition prépare cette revue ; elle ne remplace pas la revue des changements effectifs.
- Vérifier les déclencheurs, permissions et noms de checks ; conserver un retour arrière et ne pas supprimer un contrôle requis avant que son remplaçant soit publié et vérifié. Les tests négatifs et les exécutions GitHub ne doivent exposer aucune valeur de secret.
- Les réglages GitHub, l'installation Renovate, les exercices de rotation et les vérifications de déploiement relèvent des opérations manuelles prévues par les specs. L'archivage de `develop` reste conditionné à l'accord et au séquencement prévus par la spec 113.
- Les quatre semaines de comparaison et les exécutions planifiées nécessitent du temps réel ; aucune clôture ne doit les présenter comme réalisées par anticipation.
