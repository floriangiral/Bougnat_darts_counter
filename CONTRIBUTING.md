# Contributing

## Principes

- ne pas casser le gameplay existant
- preferer des changements incrementaux
- garder le domaine separable de l UI et de l infrastructure
- documenter les changements structurants dans les specs et les docs d architecture
- ne pas reintroduire de dependance runtime a un backend metier dans le perimetre supporte
- couleurs uniquement via les rôles de tokens (`bg-surface`, `text-fg`, `game-*`…, voir [docs/design-system.md](docs/design-system.md)) : aucune classe de palette Tailwind brute ni valeur colorée arbitraire ; `npm run guard:clean` échoue au-delà de la référence (0)
- textes d'interface et documentation en français accentué

## Frontiere open source `v2.x`

Les contributions attendues doivent renforcer ou clarifier :

- scoring
- jeux supportes
- voice scoring optionnel
- persistance locale
- reprise locale
- experience offline-first
- lien de match externe optionnel (contrat d URL versionne, [spec 030](specs/030-counter-external-match-link/spec.md))
- traçabilite spec → code → tests → issues

Toute evolution du contrat du lien de match externe (parametres d entree, parametres de retour reserves, version `v`) doit etre decrite dans la spec 030 et le [guide partenaire](docs/integration/external-match-link.md). Un changement incompatible impose une nouvelle version de contrat.

Les contributions ne doivent pas reintroduire dans ce repo :

- backend metier
- authentification metier avancee
- profils distants persistants
- statistiques cloud consolidees
- logique tournoi proprietaire
- dependance runtime obligatoire a `Bougnat_Darts_Tournaments`

## Verification minimale

Avant une pull request :

```bash
npm run typecheck
npm run lint
npm run lint:type-aware
npm run test:unit
npm run test:unit:coverage
npm run governance:coverage
npm run wrangler:check
npm run build
```

L analyse SonarCloud est executee par la CI sur les pull requests. Le depot doit
disposer d un secret `SONAR_TOKEN` configure dans les secrets GitHub Actions.
Le rapport local de couverture peut etre genere avec :

```bash
npm run test:unit:coverage
```

Toute pull request ciblee vers `main` execute aussi le check `Global Quality
Baseline`. Ce check mesure toute la base applicative, applique les seuils de
couverture Vitest et publie les metriques dans le Summary GitHub Actions. Il
doit etre configure comme check obligatoire dans la protection de `main`, avec
`Quality Gate / SonarCloud`.

Pour publier le statut externe `SonarCloud Code Analysis`, l application GitHub
SonarQube Cloud doit aussi avoir acces explicite a ce depot dans
`Settings > Applications > Installed GitHub Apps > SonarQubeCloud`. L acces en
lecture implicite aux depots publics ne permet pas de publier les checks.
Verifier que le projet SonarCloud est lie a ce depot et conserver ce statut
externe obligatoire dans le ruleset de `main`, en plus du job Actions
`SonarCloud`. Apres une modification des acces, relancer une analyse de PR et
verifier que les deux checks sont publies et passent.

Le check `Snyk Dependencies` analyse `package-lock.json` avec le secret
repository `SNYK_TOKEN` et échoue à partir du niveau `high`. Les résultats sont
publiés dans l'onglet Security (catégorie `snyk-dependencies`) et chaque fusion
sur `main` enregistre un instantané (`snyk monitor`) pour être alerté des
nouvelles vulnérabilités. Sur une PR de fork ou de Dependabot, le secret n'est
pas exposé : le job est ignoré avec une notice (NPM Audit et Dependency Review
restent actifs) ; partout ailleurs, un secret absent ou expiré (`SNYK-0005`) fait
échouer le check. Il pourra être rendu obligatoire dans le ruleset de `main` une
fois le jeton renouvelé et stable.

Aucune image Docker n'est distribuée ni exécutée en production (Cloudflare
Pages) : l'image n'est donc pas analysée par Snyk. Les fichiers `docker/` ne
servent qu'à l'environnement de développement local.

## Gouvernance de couverture Sonar

Toute contribution qui ajoute ou modifie du code doit declarer dans sa spec la
couche concernee et sa strategie de test, conformement a
`specs/029-counter-sonar-coverage-governance/spec.md`.

Regles obligatoires :

- le domaine, l application, les modeles de presentation et les adaptateurs
	restent inclus dans la couverture Vitest et SonarCloud ;
- les fichiers source TS/TSX jamais importes par les tests comptent aussi dans
	la couverture ; Vitest reprend les exclusions Sonar deja approuvees ;
- les planchers globaux sont de 90 % pour les instructions, fonctions et
	lignes, et de 80 % pour les branches ;
- une exclusion Sonar ne peut viser que de la composition UI couverte par un
	test Playwright ou composant correspondant ;
- les exclusions doivent rester precises, justifiees dans la spec et ne jamais
	servir a masquer du comportement metier non teste ;
- une exception temporaire doit avoir un responsable, une issue de suivi et un
	critere de sortie explicite ;
- la couverture Sonar du nouveau code doit rester a 80 % ou plus, en plus des
	seuils globaux Vitest.

Avant la pull request, executer `npm run test:unit:coverage` et reporter dans la
description de la PR la strategie de test ainsi que les eventuelles exclusions.
Le lint type-aware doit aussi passer sans desactivation de regles : typer les
frontieres externes, traiter les rejets de promesses des callbacks et attendre
les appels React `act` dans les tests.
Ne pas comparer directement la couverture globale locale avec la couverture
Sonar du nouveau code, ni annoncer un Quality Gate vert sans resultat serveur.
Les chemins d erreurs, les etats desactives et le nettoyage des ressources
doivent etre testes avec les parcours nominaux ; les tests qui simulent les
frontieres navigateur ou reseau ne remplacent pas une validation d integration
reelle.

Verification recommandee pour les changements de flux utilisateur :

```bash
npm run preview -- --host 127.0.0.1 --port 4173
npm run test:e2e
```

## Orientation produit

Les contributions attendues pour `v2.x` concernent en priorite :

- scoring
- jeux
- assistance vocale
- persistance locale
- experience offline-first
