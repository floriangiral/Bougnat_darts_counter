# Guide technique et developpement

Ce document regroupe les informations techniques qui ne doivent pas alourdir le README principal, destine aux joueurs et a la communaute.

## Etat du projet

- Version de reference : `v1.1.4`
- Application Vite / React
- Base frontend alignee sur `React 19`
- Scorage offline-first
- Jeux supportes : `X01`, `501 Double Out`, `Cricket`, `Capital`, `Killer`, `Gotcha`, `Triathlon`
- Assistance vocale `X01` optionnelle
- Aucune dependance runtime a un backend metier pour le gameplay supporte

## Demarrage local

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Acces local par defaut : `http://localhost:3000`

## Configuration

Variables publiques utiles :

- `VITE_APP_ENV`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_APP_URL`
- `VITE_APP_ACCESS_MODE`
- `VITE_CF_WEB_ANALYTICS_TOKEN`
- `VITE_ENABLE_VOICE_SCORING`
- `VITE_LOG_LEVEL`

Pour ce projet Cloudflare Pages connecte a Wrangler :

- les variables publiques de routage `VITE_APP_*`, `VITE_ENABLE_VOICE_SCORING`, `VITE_LOG_LEVEL` et `DEEPGRAM_PROJECT_ID` sont declarees dans [wrangler.jsonc](/home/e103350/projects/perso/Bougnat_darts_counter/wrangler.jsonc)
- `VITE_CF_WEB_ANALYTICS_TOKEN` doit etre injecte par les variables de build Cloudflare Pages ou par un secret Cloudflare, pas commit dans le repo
- les blocs `env.production.vars` et `env.preview.vars` doivent etre complets, car Wrangler n herite pas les `vars` top-level vers les environnements
- les secrets serveur restent geres comme secrets Cloudflare et ne doivent pas etre commits

URLs cibles actuellement attendues :

- `preprod`: `https://ccdc74ab.bougnat-darts-counter.pages.dev`
- `production`: `https://play.bougnatdarts.fr`

## Observabilite web

Le projet utilise desormais uniquement un beacon web natif configure au bootstrap.

Regles de setup :

- definir `VITE_CF_WEB_ANALYTICS_TOKEN` dans les environnements cibles
- ne pas activer en meme temps une injection automatique du beacon dans le dashboard pour eviter un double snippet
- garder la CSP autorisant `https://static.cloudflareinsights.com`
- ne pas declarer `observability` dans [wrangler.jsonc](/home/e103350/projects/perso/Bougnat_darts_counter/wrangler.jsonc) car Cloudflare Pages rejette ce champ au build

Comportement runtime :

- le beacon est injecte une seule fois au bootstrap frontend
- le suivi SPA est laisse au beacon par defaut
- aucun event metier custom ni couche analytics maison n est conservee dans l application

Observabilite Functions :

- pour ce projet Pages, l observabilite edge ne doit pas etre configuree dans `wrangler.jsonc`
- si des reglages runtime edge sont necessaires, ils doivent etre geres depuis le dashboard Cloudflare compatible Pages

Variables privees utiles pour l'assistance vocale :

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID`

Regles importantes :

- Les variables `VITE_*` sont publiques cote frontend.
- Les cles privees ne doivent jamais etre exposees au navigateur.
- L'assistance vocale reste optionnelle et garde toujours un fallback manuel.

## Scripts utiles

```bash
npm run dev
npm run build
npm run deploy:pages
npm run preview
npm run lint
npm run lint:type-aware
npm run typecheck
npm run test:unit
npm run test:unit:coverage
npm run governance:coverage
npm run test:e2e
npm run ci:check
```

## Deploiement Cloudflare Pages

Le repo est configure pour un projet `Cloudflare Pages`, pas pour un `Workers deploy` classique.

Regles a respecter :

- dans le dashboard Pages, utiliser `npm run build` comme build command
- definir `dist` comme build output directory
- ne pas renseigner `npx wrangler deploy` comme commande de deploiement
- pour un deploiement manuel en CLI, utiliser `npm run deploy:pages` ou `npx wrangler pages deploy dist`
- si le projet affiche que les variables sont gerees par Wrangler, maintenir les variables de routage dans `wrangler.jsonc` et injecter `VITE_CF_WEB_ANALYTICS_TOKEN` depuis les variables de build Pages

Symptome d une mauvaise configuration : si Cloudflare lance `wrangler deploy`, Wrangler detecte un projet Pages puis echoue en reclamant `main` ou `assets.directory`. Dans ce cas, il faut corriger la configuration du projet Pages, pas convertir ce repo en Worker classique.

Autre symptome connu : si Pages lit `wrangler.jsonc` et echoue sur `observability`, il faut retirer ce bloc de la config car il n est pas supporte sur les projets Pages.

Pour les smoke E2E en local :

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# dans un second terminal
npm run test:e2e
```

## Qualite

Le projet embarque :

- lint
- typecheck
- tests unitaires
- tests end-to-end
- controle de securite
- audit de dependances
- analyse SonarCloud du New Code et de la branche `main`
- analyse Snyk des dependances npm

La qualite du projet repose aussi sur :

- une approche spec-driven pour cadrer les evolutions fonctionnelles
- une Clean Architecture pragmatique pour proteger le coeur de scorage
- un principe de decoupe a responsabilite unique : chaque fichier cible une seule responsabilite metier identifiable

### Qualite et securite CI

- `Quality Gate / SonarCloud` analyse le New Code des pull requests et publie les metriques dans le Summary GitHub Actions ;
- `Global Quality Baseline` mesure toute la base applicative pour chaque pull request ciblee vers `main` ;
- SonarCloud analyse aussi `main` apres merge et chaque semaine ;
- `Security Review / Snyk Dependencies` controle les dependances npm avec un seuil bloquant `high` ;
- les secrets CI requis sont `SONAR_TOKEN` et `SNYK_TOKEN`, uniquement dans les Repository secrets GitHub Actions ;
- les checks SonarCloud, Snyk, CodeQL, Gitleaks, tests/build et E2E doivent etre requis par le ruleset de `main`.

### Couverture locale et SonarCloud

Le lint standard et le lint type-aware sont complementaires. Executer
`npm run lint:type-aware` pour verifier les appels et affectations non surs,
les promesses non attendues et les methodes detachees de leur recepteur.
Dans les tests React, attendre les appels `act` asynchrones ; aux frontieres
navigateur ou stockage, verifier les valeurs inconnues plutot que propager
`any`. Une correction ne doit pas desactiver ces regles pour rendre le lint vert.

`npm run test:unit:coverage` mesure tous les fichiers TS/TSX du perimetre source
Sonar, y compris ceux qu aucun test n importe. Les exclusions sont lues
directement dans `sonar-project.properties` et controlees par
`npm run governance:coverage` : aucune liste parallele ni exclusion
supplementaire n est utilisee pour relever artificiellement les resultats.

Planchers globaux Vitest :

| Instructions | Branches | Fonctions | Lignes |
|---:|---:|---:|---:|
| 90 % | 80 % | 90 % | 90 % |

Validation locale du 3 novembre 2026 sur `develop` : **398 tests dans 67
fichiers**, 94,10 % des instructions, 85,71 % des branches, 96,33 % des
fonctions et **95,29 % des lignes** (2954/3100). A perimetre identique, la
couverture des lignes passe de 62,58 % a 95,29 %. Les anciens 85,84 % locaux
ne comptaient que les fichiers importes par les tests et ne sont donc pas
directement comparables.

Apres le suivi securite/lint type-aware du meme jour : **401 tests**,
94,01 % des instructions, 85,51 % des branches, 96,57 % des fonctions et
**95,23 % des lignes (2961/3109)**. Les deux linters, le typecheck et le build
passent ; l audit npm ne remonte aucune vulnerabilite avec les overrides
`minimatch 11.0.1` et `zod 4.6.6`.

Les nouveaux tests couvrent les interactions de saisie/statistiques, le
streaming vocal et ses erreurs, la navigation, le cycle de vie des parties,
la persistance et les transitions/bonus du Triathlon. Les frontieres
audio/SDK/token sont simulees : un essai reel de microphone/Deepgram reste
complementaire.

Rapports generes : `coverage/lcov.info` pour SonarCloud et
`coverage/coverage-summary.json` pour les mesures locales.
Le seuil Sonar du **nouveau code (80 %)** reste une validation distincte :
les resultats locaux ne prouvent pas que le Quality Gate serveur est vert.

Voir la [gouvernance de couverture](../specs/029-counter-sonar-coverage-governance/spec.md)
et la [coverage map v1.1.4](release/v1.1.4-coverage-map.md).

## Flux GitHub Actions

Flux de branches :

- `main` : branche source de promotion preprod
- `preprod` : branche miroir poussee par le workflow de preprod, puis source de promotion production
- `production` : branche miroir poussee par le workflow de promotion

Workflows principaux :

- `Quality Gate` : PR vers `main`, `preprod`, `develop`, `release/**`
- `End-to-End` : PR vers `main`, `preprod`, `release/**`
- `Deploy Preview` : manuel uniquement depuis `main`, puis synchronise la branche `preprod`
- `Promote Production` : manuel uniquement depuis `preprod`, puis synchronise la branche `production`
- `Validate Environments` : manuel, valide seulement le contrat d environnement cible

Regles de securite recommandees dans GitHub :

- environment `preprod` : limiter les lancements manuels a la branche `main`
- environment `production` : limiter les lancements manuels a la branche `preprod`
- environment `production` : exiger au moins un reviewer manuel avant execution
- conserver les secrets uniquement au niveau des environments qui les utilisent
- les workflows `Deploy Preview` et `Promote Production` peuvent pousser les branches miroirs `preprod` et `production` avec le `GITHUB_TOKEN`, sans GitHub App dediee

## Documentation technique

- [Specifications](specifications.md)
- [Architecture](architecture.md)
- [Architecture clean pragmatique](architecture/counter-pragmatic-clean-architecture.md)
- [Scoring access modes](architecture/scoring-access-modes.md)
- [Fondation offline-first](architecture/scoring-terminal-offline-first-foundation.md)
- [Audit securite hebergement et performance](audit-security-hosting-performance-2026-04-24.md)
- [Release v1.1.4](release/v1.1.4.md)
- [Coverage map v1.1.4](release/v1.1.4-coverage-map.md)
- [Release v1.1.3](release/v1.1.3.md)
- [Coverage map v1.1.3](release/v1.1.3-coverage-map.md)
- [Release v1.1.2](release/v1.1.2.md)
- [Coverage map v1.1.2](release/v1.1.2-coverage-map.md)
- [Release v1.1.1](release/v1.1.1.md)
- [Coverage map v1.1.1](release/v1.1.1-coverage-map.md)
- [Release v1.1](release/v1.1.md)
- [Coverage map v1.1](release/v1.1-coverage-map.md)
- [Release v1.0.2](release/v1.0.2.md)
- [Release v1.0.1](release/v1.0.1.md)
- [Coverage map v1.0.1](release/v1.0.1-coverage-map.md)

## Frontiere produit

Ce repository porte l'application de scoring. Il ne porte pas :

- backend metier
- authentification metier
- espace utilisateur riche
- profils distants
- statistiques cloud consolidees
- logique tournoi avancee
- orchestration organisateur
- persistence backend metier
