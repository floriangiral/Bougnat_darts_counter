# Guide technique et developpement

Ce document regroupe les informations techniques qui ne doivent pas alourdir le README principal, destine aux joueurs et a la communaute.

## Etat du projet

- Version de reference : `v1.1.0`
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

URLs cibles actuellement attendues :

- `preprod`: `https://preprod-play.bougnatdarts.fr`
- `production`: `https://play.bougnatdarts.fr`

## Observabilite web

Le projet utilise desormais uniquement un beacon web natif configure au bootstrap.

Regles de setup :

- definir `VITE_CF_WEB_ANALYTICS_TOKEN` dans les environnements cibles
- ne pas activer en meme temps une injection automatique du beacon dans le dashboard pour eviter un double snippet
- garder la CSP autorisant `https://static.cloudflareinsights.com`
- conserver [wrangler.jsonc](/home/e103350/projects/perso/Bougnat_darts_counter/wrangler.jsonc) comme source de verite pour l observabilite runtime edge

Comportement runtime :

- le beacon est injecte une seule fois au bootstrap frontend
- le suivi SPA est laisse au beacon par defaut
- aucun event metier custom ni couche analytics maison n est conservee dans l application

Observabilite Functions :

- `observability.enabled=true`
- logs persistants actifs
- traces persistantes actives
- sampling fixe a `1` tant que le volume reste raisonnable

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
npm run preview
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run ci:check
```

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

- `preprod` : branche de preview, deploiement manuel via `Deploy Preview`
- `main` : branche source de promotion production
- `production` : branche miroir poussee par le workflow de promotion

Workflows principaux :

- `Quality Gate` : PR vers `main`, `preprod`, `develop`, `release/**`
- `End-to-End` : PR vers `main`, `preprod`, `release/**`
- `Deploy Preview` : manuel uniquement depuis `preprod`
- `Promote Production` : manuel uniquement depuis `main`
- `Validate Environments` : manuel, valide seulement le contrat d environnement cible

Regles de securite recommandees dans GitHub :

- environment `preprod` : limiter les deploiements a la branche `preprod`
- environment `production` : limiter les deploiements a la branche `main`
- environment `production` : exiger au moins un reviewer manuel avant execution
- conserver les secrets uniquement au niveau des environments qui les utilisent
- le workflow `Promote Production` peut pousser la branche miroir `production` avec le `GITHUB_TOKEN`, sans GitHub App dediee

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

Ce repository porte l'application de scoring. Il ne porte pas :

- backend metier
- authentification metier
- espace utilisateur riche
- profils distants
- statistiques cloud consolidees
- logique tournoi avancee
- orchestration organisateur
- persistence backend metier
