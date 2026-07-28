# Guide technique et developpement

Ce document regroupe les informations techniques qui ne doivent pas alourdir le README principal, destine aux joueurs et a la communaute.

## Etat du projet

- Version de reference : `v1.1.0`
- Application Vite / React
- Base frontend alignee sur `React 19`
- Scorage offline-first
- Jeux supportes : `X01`, `501 Double Out`, `Cricket`, `Capital`, `Killer`, `Gotcha`, `Triathlon`
- Assistance vocale `X01` optionnelle
- Mode local jouable sans backend metier
- Evolution M10: inscription / connexion et scorage de matchs tournoi via le backend Bougnat Darts

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
- `VITE_TOURNAMENT_API_BASE_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_JWT_TEMPLATE_NAME`
- `VITE_CF_WEB_ANALYTICS_TOKEN`
- `VITE_ENABLE_VOICE_SCORING`
- `VITE_LOG_LEVEL`

Pour ce projet Cloudflare Pages connecte a Wrangler :

- les variables publiques de routage `VITE_APP_*`, `VITE_TOURNAMENT_API_BASE_URL`, `VITE_CLERK_JWT_TEMPLATE_NAME`, `VITE_ENABLE_VOICE_SCORING`, `VITE_LOG_LEVEL` et `DEEPGRAM_PROJECT_ID` sont declarees dans [wrangler.jsonc](/home/e103350/projects/perso/Bougnat_darts_counter/wrangler.jsonc)
- `VITE_CLERK_PUBLISHABLE_KEY` doit etre injecte par les variables de build Cloudflare Pages
- `VITE_CF_WEB_ANALYTICS_TOKEN` doit etre injecte par les variables de build Cloudflare Pages ou par un secret Cloudflare, pas commit dans le repo
- les blocs `env.production.vars` et `env.preview.vars` doivent etre complets, car Wrangler n herite pas les `vars` top-level vers les environnements
- les secrets serveur restent geres comme secrets Cloudflare et ne doivent pas etre commits

URLs frontend cibles actuellement attendues :

- `preprod`: `https://preprod-play.bougnatdarts.fr`
- `production`: `https://play.bougnatdarts.fr`

URLs backend Bougnat Darts :

- `dev`: `http://localhost:8080`
- `preprod`: `https://bougnat-darts-develop.fly.dev`
- `production`: `https://api.bougnatdarts.fr`

`VITE_TOURNAMENT_API_BASE_URL` est public cote frontend. Il ne doit contenir qu une base URL de routage, jamais un token ou une cle privee. `VITE_BOUGNAT_API_URL` reste tolere comme alias legacy local.

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
- Les secrets de session/authentification doivent venir du backend et du stockage runtime adapte, jamais de variables de build publiques.

## Scripts utiles

```bash
npm run dev
npm run build
npm run deploy:pages
npm run preview
npm run lint
npm run typecheck
npm run test:unit
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

La qualite du projet repose aussi sur :

- une approche spec-driven pour cadrer les evolutions fonctionnelles
- une Clean Architecture pragmatique pour proteger le coeur de scorage
- un principe de decoupe a responsabilite unique : chaque fichier cible une seule responsabilite metier identifiable

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
- [Release v1.1](release/v1.1.md)
- [Coverage map v1.1](release/v1.1-coverage-map.md)
- [Release v1.0.2](release/v1.0.2.md)
- [Release v1.0.1](release/v1.0.1.md)
- [Coverage map v1.0.1](release/v1.0.1-coverage-map.md)

## Frontiere produit

Ce repository porte l'application de scoring, son mode local et les adapters frontend du mode connecte. Il ne porte pas :

- implementation du backend metier
- espace utilisateur riche
- profils distants
- statistiques cloud consolidees
- orchestration organisateur
- persistence backend metier
