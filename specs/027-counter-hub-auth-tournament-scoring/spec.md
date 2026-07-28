# Spec 027 - counter hub auth tournament scoring

## Meta

- ID: `027-counter-hub-auth-tournament-scoring`
- Slug: `spec:counter/hub-auth-tournament-scoring`
- Statut: `active`
- Milestone cible: `M10: Hub Integration`

## Objectif

Integrer `Bougnat_darts_counter` au hub `Bougnat_Darts_Tournaments` pour permettre :

- l inscription et la connexion d un utilisateur
- l utilisation de l application de scoring comme terminal de tournoi
- la synchronisation contractuelle des parties de tournoi avec le backend Bougnat Darts

Le counter reste le client de scorage. Le hub et son backend restent la source de verite pour les comptes, les tournois, les affectations de matchs et les resultats consolides.

## Backend cible

Le backend Bougnat Darts est expose aux URLs suivantes :

- dev: `http://localhost:8080`
- preprod: `https://bougnat-darts-develop.fly.dev`
- production: `https://api.bougnatdarts.fr`

Le frontend consomme cette base via la variable publique `VITE_TOURNAMENT_API_BASE_URL`.

## Decisions

- utiliser `VITE_TOURNAMENT_API_BASE_URL` comme contrat canonique pour le backend Tournament
- conserver `VITE_BOUGNAT_API_URL` seulement comme alias legacy local quand il existe deja
- ne pas appeler de endpoints backend `POST /v1/auth/login` ou `POST /v1/auth/register`
- deleguer inscription / connexion au provider d auth frontend configure, actuellement Clerk/OIDC
- recuperer un JWT destine a l API Bougnat Darts via le template/audience `bougnat-darts-api`
- appeler ensuite `GET /v1/auth/me` puis `GET /v1/player/me/scoring-app/bootstrap` avec `Authorization: Bearer <jwt>`
- lire les succes backend via l enveloppe `{ data, request_id }` et retourner `data` cote adapter
- garder le coeur de scoring local independant du backend
- isoler l authentification, le chargement de matchs tournoi et la remontée de resultats derriere des adapters explicites
- conserver un mode local jouable sans compte ni reseau
- faire du backend la source de verite pour les comptes, les tournois, les inscriptions, les droits et l etat officiel des matchs

## Invariants critiques

- le scoring local et les jeux existants ne regressent pas
- un utilisateur peut encore lancer une partie locale sans compte
- les secrets d authentification ne sont jamais exposes via des variables `VITE_*`
- `VITE_TOURNAMENT_API_BASE_URL` est une URL publique de routage, pas un secret
- le domaine de scoring ne depend pas directement des endpoints HTTP
- une interruption reseau pendant un match de tournoi ne doit pas faire perdre la saisie locale deja effectuee
- la soumission d un resultat tournoi doit etre idempotente cote contrat applicatif
- le bearer utilisateur ne doit jamais remplacer `device_session_id` / `device_key` dans le flux QR scoring
- le flux QR scoring ne doit jamais utiliser `/v1/scoring/events`; il doit utiliser `/v1/devices/scoring/events`

## Parcours cibles

### Inscription / connexion

1. L utilisateur ouvre l application.
2. Il peut continuer en mode local ou se connecter.
3. Il peut creer un compte ou utiliser un compte existant.
4. Une session connectee donne acces aux matchs de tournoi assignes par le hub.
5. La deconnexion repasse l application en mode local sans supprimer les sessions locales non liees au compte.

### Scorage en tournoi

1. Le scoreur connecte recupere ses matchs ou entre via un lien/jeton de match fourni par le hub.
2. Le counter charge le contexte du match : joueurs, format, variante, droits et etat courant.
3. Le scoreur saisit le match dans l UI existante de scoring.
4. Le counter conserve un brouillon local pendant la partie.
5. A la fin, le resultat est soumis au backend.
6. Le backend confirme, refuse ou demande une resolution explicite si l etat distant a diverge.

## Hors perimetre de cette spec

- implementation du backend hub
- gestion organisateur complete
- paiement, licences, abonnements
- social, chat, lobby public
- statistiques cloud avancees hors resultat de match necessaire au tournoi

## Impacted Code

- `src/lib/env.ts`
- `.env.local.example`
- `wrangler.jsonc`
- `scripts/deployment-check.mjs`
- futurs adapters `src/infrastructure/bougnatApi/*`
- futurs ports applicatifs auth/tournament dans `src/application/*`
- ecrans d entree auth/tournament dans `views/` ou `src/features/*`

## Canonical Entry Points

- `docs/product-scope.md`
- `docs/architecture.md`
- `docs/technical.md`
- `docs/specifications.md`
- `specs/027-counter-hub-auth-tournament-scoring/spec.md`

## Key Tests

- tests unitaires des clients/adapters API avec fetch mocke
- tests unitaires des ports auth/tournament
- tests de resilience offline sur brouillon tournoi
- smoke E2E : connexion, selection match tournoi, scoring, soumission resultat
- checks de configuration : dev, preprod, production

## Validation

- les trois URLs backend sont documentees et validees dans les environnements cibles
- le mode local reste disponible sans compte
- aucun endpoint HTTP n est importe par le domaine de scoring
- les erreurs auth, reseau et conflit de resultat sont visibles et recuperables par l utilisateur
