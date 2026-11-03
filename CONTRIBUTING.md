# Contributing

## Principes

- ne pas casser le gameplay existant
- preferer des changements incrementaux
- garder le domaine separable de l UI et de l infrastructure
- documenter les changements structurants dans les specs et les docs d architecture
- ne pas reintroduire de dependance runtime a un backend metier dans le perimetre supporte

## Frontiere open source `v1.1`

Les contributions attendues doivent renforcer ou clarifier :

- scoring
- jeux supportes
- voice scoring optionnel
- persistance locale
- reprise locale
- experience offline-first
- traçabilite spec → code → tests → issues

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
npm run test:unit
npm run test:unit:coverage
npm run governance:coverage
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

Le scan Snyk des dependances utilise le secret repository `SNYK_TOKEN`. Il doit
etre configure dans GitHub Actions avant de rendre le check `Snyk Dependencies`
obligatoire dans la protection de `main`.

Le Dockerfile est egalement analyse par le check `Snyk Container`. La CI
construit `docker/app.Dockerfile` puis scanne l image avec un seuil bloquant
`high`. Ce check doit etre rendu obligatoire si Docker fait partie des
environnements distribues ou executes.

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

Les contributions attendues pour `v1.1+` concernent en priorite :

- scoring
- jeux
- assistance vocale
- persistance locale
- experience offline-first
