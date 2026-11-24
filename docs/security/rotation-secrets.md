# Réponse à une fuite et rotation des secrets

Ce document accompagne la [politique de sécurité](../../SECURITY.md) et la [spec 118](../../specs/118-counter-sec-secrets-detection/spec.md). Il décrit une procédure à adapter à l'incident ; aucun exercice de rotation n'a encore été consigné.

## Réponse immédiate

1. Considérer tout secret exposé comme compromis, même si le commit ou le rapport a été supprimé. Prévenir le mainteneur par le canal privé indiqué dans la politique de sécurité ; ne publier aucune valeur dans une issue, un commentaire, un journal ou un artefact.
2. Identifier le fournisseur, la portée, les environnements et la période d'exposition sans recopier le secret. Vérifier les journaux d'accès et l'usage auprès du fournisseur ; conserver uniquement les éléments nécessaires au suivi privé.
3. Révoquer ou désactiver la clé compromise chez le fournisseur. Une interruption temporaire peut être nécessaire ; ne pas conserver une clé compromise pour éviter une coupure.
4. Créer un remplacement avec les permissions minimales. Le déposer uniquement dans les emplacements prévus ci-dessous, par les interfaces d'administration, sans l'exposer dans une commande ou un journal.
5. Vérifier le service ou le workflow concerné avec une exécution contrôlée, sans afficher les valeurs ni les réponses brutes susceptibles de les contenir. Vérifier que l'ancienne clé ne fonctionne plus lorsque le fournisseur le permet.
6. Documenter en privé la date, le périmètre, les actions, les vérifications et les personnes prévenues. Si des tiers sont concernés, les prévenir par un canal adapté. Ne pas réécrire l'historique comme substitut à la révocation.

## Emplacements et vérifications

| Secret | Révocation et remplacement | Vérification |
|---|---|---|
| `DEEPGRAM_API_KEY` | Révoquer dans le projet Deepgram concerné et créer une clé de remplacement limitée au besoin. Mettre à jour le secret Cloudflare Pages de chaque environnement affecté et le secret GitHub Actions des environnements de promotion concernés. Vérifier séparément chaque emplacement : une modification dans GitHub ne modifie pas Cloudflare. | Vérifier l'émission d'un jeton éphémère et une session vocale sur l'environnement concerné, sans journaliser la clé ni le jeton. Vérifier les promotions lors de leur prochaine exécution autorisée. |
| `SONAR_TOKEN` | Révoquer dans SonarQube Cloud, créer un jeton adapté à l'analyse et remplacer le secret GitHub Actions du dépôt. | Lancer une analyse autorisée et vérifier sa publication et son résultat dans SonarQube Cloud. |
| `SNYK_TOKEN` | Tant que Snyk est utilisé, révoquer le jeton chez Snyk, en créer un nouveau avec l'accès nécessaire et remplacer le secret GitHub Actions du dépôt. | Lancer le contrôle de sécurité autorisé et vérifier l'analyse et la publication attendue. |
| `BRANCH_PROMOTER_APP_PRIVATE_KEY` | Révoquer la clé privée compromise dans les paramètres de la GitHub App de promotion ; générer une nouvelle clé et remplacer le secret des environnements GitHub concernés. `BRANCH_PROMOTER_APP_ID` est un identifiant de l'application, à vérifier lors de la configuration, et non la clé privée. | Contrôler l'authentification de l'application et la promotion dans un environnement adapté lorsque son utilisation par les workflows est en place. Ne pas déclencher de promotion de production pour un simple exercice. |
| Futurs jetons Codecov ou Sentry, si utilisés | Identifier leur propriétaire et leur portée, les révoquer chez le fournisseur, créer un remplacement minimal et mettre à jour les seuls emplacements qui les utilisent. | Exécuter le contrôle ou l'intégration concernée et vérifier le résultat sans exposer le jeton. |

L'inventaire réel et les accès aux consoles doivent être vérifiés au moment de l'incident. Les secrets GitHub Actions et Cloudflare ne sont pas récupérables en clair depuis leur configuration : prévoir la création d'une nouvelle valeur.

## Exercice à blanc

Préparer avec le mainteneur un exercice sur un secret non critique, sans toucher à un secret de production. Consigner la date, le périmètre, les étapes effectivement réalisées, le résultat et les écarts, sans valeur de secret. Un exercice de rotation de `SONAR_TOKEN` reste à réaliser et à consigner ; ne pas le déclarer réussi avant vérification.
