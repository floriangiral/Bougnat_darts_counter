# Bougnat Darts

[![Quality Gate](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/quality-gate.yml)
[![Security Review](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/security-review.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/security-review.yml)
[![Database Gate](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/database-gate.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/database-gate.yml)
[![End-to-End](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/e2e.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/e2e.yml)
[![Secret Scan](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/secret-scan.yml)

[![Release](https://img.shields.io/github/v/tag/floriangiral/Bougnat_darts_counter?sort=semver&label=release)](https://github.com/floriangiral/Bougnat_darts_counter/tags)
[![Last Commit](https://img.shields.io/github/last-commit/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/commits)
[![Commit Activity](https://img.shields.io/github/commit-activity/y/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/graphs/contributors)
[![Open Issues](https://img.shields.io/github/issues/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/pulls)
[![Stars](https://img.shields.io/github/stars/floriangiral/Bougnat_darts_counter?style=social)](https://github.com/floriangiral/Bougnat_darts_counter/stargazers)
[![Forks](https://img.shields.io/github/forks/floriangiral/Bougnat_darts_counter?style=social)](https://github.com/floriangiral/Bougnat_darts_counter/network/members)

Application web React + Vite + TypeScript pour le scoring de flechettes traditionnelles, avec authentification Supabase, profil joueur, historique de matchs, statistiques, premiers flux lobby, et maintenant une premiere assistance vocale IA pour `X01`.

## Etat actuel

- Version de reference : `v1.0.0-beta.4`
- Jeux actifs :
  - `501 Double Out`
  - `Match X01`
  - `Cricket`
  - `Capital`
  - `Triathlon`
- Socle multijoueur en place autour du lobby, des amis, des invitations et des sessions partagees
- Assistance vocale IA disponible sur `X01` via Deepgram en streaming, avec confirmation utilisateur avant validation

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS 4 integre au build via PostCSS
- Supabase Auth / Database / Realtime
- Deepgram streaming speech-to-text pour le scoring vocal `X01`
- Docker + Supabase CLI pour le dev local
- GitHub Actions pour la CI
- Vercel pour l'hebergement

## Nouveautes recentes

### X01 - AI Scoring

Le mode `X01` propose une premiere version de scoring vocal assiste :

- activation via une option de match dediee
- bouton `Annonce ton score` sur le keypad
- ecoute micro live avec Deepgram
- transcription streaming avec proposition de score
- validation finale via le bouton `OK` existant
- fallback manuel intact si la transcription echoue

Le moteur vocal est volontairement borne a `X01` pour cette V1 :

- annonces de score du tour
- annonces de flechettes
- annonces de score restant
- prise en compte du contexte du tour dans le parser

### Barre de scoring X01

La barre au-dessus du keypad a ete refondue :

- score saisi / detecte centre visuellement sur tous les ecrans
- version mobile fortement simplifiee
- retour `Undo` renomme en `Retour`
- etat `AI Scoring` integre directement dans la barre

### Frontend et build

- Tailwind n'est plus charge via CDN
- le CSS passe par le build Vite/PostCSS
- le service worker local est neutralise en dev pour eviter les assets stale

## Modele de branches

- `develop`
  - integration continue
- `release/*`
  - stabilisation de la version en cours
  - exemple : `release/1.0.0-beta.4`
- `main`
  - derniere release stable validee
- `preprod`
  - branche miroir d'environnement
- `production`
  - branche miroir d'environnement

Flux retenu :

- `develop -> release/*`
- `release/* -> main`
- le tag est porte par la branche `release/*` en cours
- les promotions vers `preprod` et `production` partent uniquement de `main`
- `preprod` et `production` sont des branches miroir synchronisees par workflow manuel

## CI / CD

Checks automatiques sur `develop`, `release/*` et `main` :

- `Quality Gate`
- `Security Review`
- `Database Gate`
- `End-to-End`
- `Secret Scan`
- `Dependency Watch` en planifie

Promotions manuelles :

- `Promote Preprod`
  - a lancer uniquement depuis `main`
  - relance lint, typecheck, unit, tests DB/RLS et smoke Playwright
  - synchronise la branche `preprod`
  - deploie ensuite le projet Vercel preprod
- `Promote Production`
  - a lancer uniquement depuis `main`
  - relance les memes verifications
  - synchronise la branche `production`
  - deploie ensuite le projet Vercel production

Point important :

- si `preprod` et `production` sont protegees, il faut autoriser le workflow GitHub Actions a les mettre a jour
- ces branches etant des miroirs d'environnement, leur synchronisation peut se faire en `force push` par le workflow

## Environnements

### Local

- source de verite : `.env.local`
- modele d'exemple : `.env.local.example`
- Supabase local via `npm run supabase:start`

### Preprod

- source de verite des variables publiques : GitHub Environment `preprod`
- source de verite des secrets CI : GitHub Environment secrets `preprod`
- projet Supabase dedie
- projet Vercel dedie
- deploiement uniquement via `Promote Preprod`

### Production

- source de verite des variables publiques : GitHub Environment `production` et/ou Vercel selon ton organisation
- source de verite des secrets CI : GitHub Environment secrets `production`
- projet Supabase dedie
- projet Vercel dedie
- deploiement uniquement via `Promote Production`

## Demarrage rapide

```bash
npm ci
cp .env.local.example .env.local
npm run supabase:start
npm run supabase:status
npm run dev
```

Acces locaux utiles :

- front : `http://localhost:3000`
- Supabase API : `http://127.0.0.1:54321`
- Supabase Studio : `http://127.0.0.1:54323`

### Setup local pour AI Scoring

Pour activer le scoring vocal `X01` en local :

1. renseigner la `Publishable` key Supabase locale dans `.env.local`
2. ajouter une cle Deepgram serveur valide
3. activer le feature flag public

Exemple minimal :

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=ta_publishable_key_locale
DEEPGRAM_API_KEY=ta_cle_deepgram
DEEPGRAM_PROJECT_ID=4ded2ce3-a84b-40fb-bfcc-473504fa041e
VITE_ENABLE_VOICE_SCORING=true
```

Important :

- `DEEPGRAM_API_KEY` ne doit jamais etre prefixee par `VITE_`
- l'application utilise un endpoint backend local pour obtenir un token temporaire Deepgram
- la cle Deepgram doit permettre la transcription streaming et le token-based auth

## Variables d'environnement

### Variables publiques

Les variables `VITE_*` sont embarquees dans le bundle frontend. Elles sont donc a considerer comme publiques.

Variables principales :

- `VITE_APP_ENV`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_APP_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_ANALYTICS`
- `VITE_ENABLE_BETA_BADGE`
- `VITE_ENABLE_VOICE_SCORING`
- `VITE_LOG_LEVEL`

Regles :

- local : fichier `.env.local`
- preprod : GitHub Environment `preprod`
- production : GitHub Environment `production` et/ou Vercel
- aucune variable preprod ou prod ne doit dependre d'un fichier `.env` committe

### Variables privees

Ne jamais exposer au navigateur :

- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPGRAM_API_KEY`
- secrets OAuth
- tokens Sentry/Auth
- cles admin d'outils tiers

Stockage recommande :

- local : `.env.local` seulement si necessaire
- CI : GitHub Secrets / Environment Secrets
- hebergement : variables sensibles Vercel uniquement si necessaire

Variables privees utiles pour le vocal local :

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID` (reference projet / dashboard)

## Supabase local

Le dossier `supabase/` contient :

- `config.toml`
- les migrations SQL versionnees
- le seed local

Principes :

- toute evolution de schema passe par migration
- preprod avant production
- pas de drift durable entre dashboard et repo

Commandes utiles :

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
npm run supabase:reset
npm run supabase:reset:seeded
npm run db:migration:new add_feature_name
npm run db:push
npm run db:types
```

`npm run supabase:reset:seeded` reinitialise la base locale puis recree les comptes et donnees de test.

## Scripts utiles

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test:unit
npm run test:db
npm run test:e2e
npm run ci:check
npm run preprod:check
npm run production:check
```

Tests utiles pour la partie voice :

```bash
npm run test:unit -- dartsSpeechParser
npm run typecheck
```

## Securite et plateforme

Le repo contient deja :

- headers de securite dans `vercel.json`
- scan de secrets avec `Gitleaks`
- review securite npm + CodeQL
- tests DB/RLS
- smoke tests Playwright
- cle Deepgram non exposee dans le frontend
- endpoint local / serverless pour token temporaire Deepgram

Reglages manuels a faire dans GitHub / Vercel :

- exiger l'approbation des PR de forks externes
- rendre les checks CI requis sur `main`, `release/*` et `preprod` selon ton ruleset
- proteger les previews Vercel
- verifier que seules des variables `VITE_*` non sensibles sont exposees

Voir aussi [SECURITY.md](/home/e103350/projects/perso/Bougnat_darts_counter/SECURITY.md).

## Branches a proteger

Je recommande de proteger au minimum :

- `main`
- `develop`
- `release/*`

Et selon ton niveau de verrouillage :

- `preprod`
- `production`

Regles recommandees :

- PR obligatoire
- checks requis avant merge
- au moins une review sur `main`
- pas de direct push humain sur `main`
- si `preprod` et `production` sont protegees, autoriser le workflow de promotion a les synchroniser

## Donnees gerees

Le projet persiste notamment :

- comptes Supabase Auth
- profils joueurs
- presence joueur
- relations d'amis
- invitations email
- invitations de lobby
- salons ouverts
- participants de salon
- sessions de match partage
- historique de matchs

## Documentation complementaire

- specs produit et techniques : [docs/specifications.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/specifications.md)
