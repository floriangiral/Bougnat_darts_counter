# Bougnat Darts

Application web React + Vite + TypeScript pour le scoring de flechettes traditionnelles, avec authentification Supabase, historique de matchs, stats joueur et un premier socle multijoueur autour du lobby.

## Version actuelle

- Version courante : `v1.0.0-beta.3`
- Cible : beta stable orientee jeu local + compte joueur + lobby + premiers flux multijoueur

## Fonctionnalites beta.3

- Scoring local pour plusieurs modes :
  - `X01`
  - `Cricket`
  - `Capital`
  - `Triathlon`
  - `Checkout Randomizer`
  - `Around The World`
- Authentification joueur via Supabase
- Profil joueur avec pseudo, avatar et pays
- Historique de matchs et statistiques personnelles
- Lobby connecte avec :
  - resume joueur
  - actions rapides
  - historique recent
  - progression
  - amis
  - invitations
  - salons rejoignables
- Gestion des amis :
  - ajout d'un joueur existant
  - invitation par email
  - suppression
- Flux multijoueur prepares :
  - defier un ami
  - rejoindre avec un code
  - creation de salon
  - lobby room
  - reprise d'une room active
- Premier match partage pour `X01`

## Roadmap beta.4

- amelioration du lobby
- visualisation des matchs en direct
- QR code en fin de partie pour consulter les stats sur telephone

## Stack

- React 18
- TypeScript
- Vite
- Supabase Auth
- Supabase Database
- Supabase Realtime
- Docker + Supabase CLI pour le dev local

## Architecture

Le modele retenu reste volontairement simple :

- GitHub = source de verite du code + PR + CI
- GitHub Actions = checks uniquement
- Vercel = deploiement automatique via Git integration
- Supabase = auth, database, realtime
- WSL = environnement de dev principal
- Docker = support de Supabase local

## Environnements

### Local

- app Vite lancee depuis WSL
- Supabase local via `npx supabase start`
- secrets et variables locales dans `.env.local`

### Preprod

- projet Vercel dedie
- branche cible : `preprod`
- projet Supabase dedie

### Production

- projet Vercel dedie
- branche cible : `main`
- projet Supabase dedie

## Demarrage rapide

```bash
npm ci
cp .env.local.example .env.local
npm run supabase:start
npm run supabase:status
npm run dev
```

Application locale :

- front : `http://localhost:3000`
- Supabase API locale : `http://127.0.0.1:54321`
- Supabase Studio : `http://127.0.0.1:54323`

## Variables d'environnement

### Variables frontend publiques

Ces variables sont visibles dans le bundle Vite et doivent commencer par `VITE_`.

Exemples :

- `VITE_APP_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_ANALYTICS`

Stockage :

- local : `.env.local`
- preprod : variables Vercel du projet preprod
- production : variables Vercel du projet prod

### Variables privees

Ces variables ne doivent jamais etre exposees au navigateur.

Exemples :

- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `SENTRY_AUTH_TOKEN`

Stockage :

- local : `.env.local` uniquement si necessaire
- CI : GitHub Secrets
- runtime heberge : Vercel environment variables sensibles si necessaire

### Regles de stockage

Va dans `.env.local` :

- les `VITE_*` utiles au front local
- les secrets locaux strictement necessaires

Va dans GitHub Secrets :

- uniquement les secrets utiles a la CI

Va dans GitHub Variables :

- uniquement les valeurs non sensibles utiles aux jobs CI

Va dans Vercel :

- les variables de build/runtime de l'application hebergee

Ne doit jamais etre committe :

- `.env.local`
- cles Supabase reelles
- secrets Google OAuth
- service role keys

## Google Auth

La configuration Google OAuth est portee principalement par Supabase.

Dans Supabase, pour chaque environnement :

- activer le provider Google
- renseigner `Client ID`
- renseigner `Client Secret`
- configurer `Site URL`
- configurer les redirect URLs autorisees

Dans le frontend :

- utiliser uniquement `VITE_SUPABASE_URL`
- utiliser uniquement `VITE_SUPABASE_ANON_KEY`

Le `GOOGLE_OAUTH_CLIENT_SECRET` ne doit jamais etre expose dans le front.

## Supabase local

Le dossier `supabase/` contient :

- `config.toml`
- les migrations SQL versionnees
- le seed local

Principes :

- toute evolution de schema passe par migration
- preprod avant prod
- pas de drift durable entre dashboard et repo

Commandes utiles :

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
npm run supabase:reset
npm run db:migration:new add_feature_name
npm run db:push
npm run db:types
```

Pour recuperer les valeurs locales generees par Supabase :

```bash
npx supabase status
```

## Scripts utiles

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run ci:check
npm run seed:lobby-users
```

## Branches

- `main` : branche par defaut, reference production
- `preprod` : validation de preproduction
- `develop` : integration
- `release/<version>` : beta / release candidate

Branches a proteger :

- `main`
- `preprod`
- `develop`

Regles recommandees :

- PR obligatoire vers chaque branche protegee
- checks CI obligatoires avant merge
- au moins 1 review pour `main` et `preprod`
- pas de direct push sur `main` et `preprod`

## CI / CD

CI :

- GitHub Actions lance les checks :
  - `env:check`
  - `lint`
  - `typecheck`
  - `build`

CD :

- Vercel deploye automatiquement via Git integration
- `preprod` -> projet Vercel preprod
- `main` -> projet Vercel production

## Donnees et persistance

Le projet persiste maintenant notamment :

- comptes Supabase Auth
- profils joueurs
- presence joueur
- amis
- invitations email
- invitations de lobby
- salons ouverts
- participants de salon
- sessions de match partage
- historique de matchs
- achievements
- challenges quotidiens
- progression de challenges

## Notes produit

- la voice assistance a ete retiree de cette beta
- `180 Attack` n'est plus propose dans l'arena setup
- les statistiques sont prevues pour s'enrichir encore a mesure que la base de matchs se remplit

## Documentation complementaire

- specs produit et techniques : [docs/specifications.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/specifications.md)
