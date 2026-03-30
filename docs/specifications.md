# Bougnat Darts - Product And Technical Specifications

## 1. Product Scope - Beta.4

Bougnat Darts est une application web de scoring de flechettes pensee pour :

- le jeu rapide en local
- le suivi de performances joueur
- la consultation de stats et d'historique
- un premier parcours social et multijoueur via lobby

Le scope courant couvre :

- home publique et home connectee
- login / sign up
- quick game
- arena setup
- matchs locaux multi-modes
- profil joueur
- history
- my stats
- lobby
- amis
- defier un ami
- rejoindre avec un code
- creer un salon
- room multijoueur
- reprise d'une room
- premier match partage `X01`
- premiere assistance vocale IA pour `X01`

## 2. User Journeys

### Public user

1. Arrivee sur Home
2. Choix entre `Quick Game` et `Lobby`
3. `Quick Game` -> Arena Setup en invite
4. `Lobby` -> Login / Sign Up

### Connected user

1. Arrivee sur Home connectee
2. Acces rapide :
   - `Quick Game`
   - `Lobby`
3. Depuis le lobby :
   - lancer une nouvelle partie
   - reprendre
   - rejoindre avec un code
   - defier un ami
   - gerer ses amis

### Multiplayer flow

1. Creer un salon ou rejoindre via code
2. Entrer dans une lobby room
3. L'hote peut editer la configuration
4. L'hote lance la partie
5. Les participants basculent dans l'arena
6. Pour `X01`, une session partagee Supabase peut synchroniser le match

## 3. Supported Game Modes

- `X01`
- `Cricket`
- `Capital`
- `Triathlon`
- `Checkout Randomizer`
- `Around The World`

Presets `X01` exposes dans l'arena :

- `X01`
- `501 Double Out`
- `170 Double Out`

## 4. Current Functional Rules

### X01

- bust rule
- open / double / master in
- open / double / master out
- best of legs
- mode doubles selon la configuration
- match partage prepare pour lobby room
- assistance vocale IA optionnelle

Fonctionnement de l'assistance vocale `X01` :

- capture micro navigateur
- streaming Deepgram live
- transcription finale parsee par un moteur darts/X01 dedie
- proposition de score dans la barre de scoring
- validation finale par l'utilisateur via le flux de score existant

Contraintes volontaires de cette V1 :

- uniquement `X01`
- pas d'auto-validation
- fallback manuel permanent
- interpretation bornee au vocabulaire darts / score restant / score du tour

### Other modes

- Cricket
- Capital
- Triathlon
- Checkout Randomizer
- Around The World

Chaque mode possede :

- son ecran de jeu
- ses stats
- son enregistrement de match en base

## 5. Frontend Structure

Principales zones frontend :

- `views/` : ecrans applicatifs
- `components/` : UI partagee et blocs metier
- `components/lobby/` : blocs lobby
- `components/game/` : composants de match
- `lib/` : acces Supabase et helpers applicatifs
- `src/lib/` : services de preparation de donnees
- `src/features/x01/voice/` : moteur vocal `X01`, Deepgram, parser et UI associee
- `src/types/` : types metier
- `supabase/` : config et migrations

## 6. Main Data Model

### Authentication

- `auth.users`

### Player identity

- `player_profiles`
- `player_presence`

### Social

- `friendships`
- `friend_email_invites`
- `lobby_invites`

### Lobby / multiplayer

- `open_lobbies`
- `open_lobby_participants`
- `shared_match_sessions`

### Match history and analytics

- `matches`

### Progression

- `player_achievements`
- `daily_challenges`
- `player_challenge_progress`

## 7. Matches Table Purpose

La table `matches` doit permettre :

- historique recent
- stats globales
- stats par mode
- winrate
- moyennes
- meilleurs checkouts
- scores max
- progression achievements / challenges

Champs analytiques majeurs deja prevus :

- `game_type`
- `game_name`
- `mode_variant`
- `status`
- `finished_at`
- `player_names`
- `opponent_label`
- `is_win`
- `starting_score`
- `check_in`
- `check_out`
- `match_mode`
- `legs_to_win`
- `sets_to_win`
- `duration_seconds`
- `score_for`
- `score_against`
- `total_darts`
- `total_points`
- `average`
- `first9_average`
- `checkout_rate`
- `highest_checkout`
- `highest_score`
- `count_180`
- `count_140_plus`
- `count_100_plus`
- `best_leg_darts`
- `summary`

## 8. Supabase Usage

Supabase est utilise pour :

- auth
- profils
- social
- lobbies
- sessions partagees
- historique
- stats
- achievements
- challenges

Les migrations versionnees dans le repo sont la source de verite du schema.

## 9. Environment Model

### Local

- Vite en local
- Supabase local via Docker + Supabase CLI
- option Deepgram locale via `.env.local`
- token temporaire Deepgram servi par l'application

### Preprod

- Vercel preprod
- Supabase preprod

### Production

- Vercel production
- Supabase production

## 10. Voice Architecture

Le scoring vocal `X01` repose sur quatre couches :

- capture audio navigateur
- client Deepgram live streaming
- parser darts/X01 contextualise
- integration UI dans `MatchView`

Principes :

- la cle Deepgram reste cote serveur
- le frontend consomme un token temporaire
- seul le resultat confirme est soumis comme score
- la logique metier darts reste separee des composants React

## 11. CI / Delivery

- GitHub = code source + PR + CI
- GitHub Actions = checks uniquement
- Vercel = deploiement automatique via Git integration

## 12. Known Limits In Beta.4

- le match partage temps reel est surtout avance pour `X01`
- les modes non `X01` ne disposent pas encore du meme niveau de synchro live
- le suivi live spectateur n'est pas encore disponible
- le QR code de fin de partie pour stats mobile n'est pas encore disponible
- l'assistance vocale est limitee a `X01`
- la validation vocale reste manuelle
- les regles avancees de bust vocal / double-out contextuel peuvent encore etre enrichies

## 13. Beta.4+ Roadmap

- amelioration du lobby
- visualisation des matchs en direct
- QR code de fin de partie pour consulter les stats sur telephone
- amelioration continue du parser vocal darts
- affichage UX plus riche pour l'intention vocale et la couverture de tour
