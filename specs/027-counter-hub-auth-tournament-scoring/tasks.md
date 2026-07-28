# Tasks - counter hub auth tournament scoring

## Documentation et contrat

- [x] creer `specs/027-counter-hub-auth-tournament-scoring/spec.md`
- [x] documenter `VITE_TOURNAMENT_API_BASE_URL`
- [x] documenter les URLs backend dev/preprod/production
- [x] mettre a jour les docs produit, architecture, technique et specifications
- [x] referencer la spec dans `specs/README.md`

## Configuration

- [x] ajouter `VITE_TOURNAMENT_API_BASE_URL` dans `.env.local.example`
- [x] ajouter `VITE_TOURNAMENT_API_BASE_URL` dans `wrangler.jsonc`
- [x] exposer `VITE_TOURNAMENT_API_BASE_URL` via `src/lib/env.ts`
- [x] verifier `VITE_TOURNAMENT_API_BASE_URL` dans `scripts/deployment-check.mjs`

## A implementer

- [x] creer le client API compte joueur Bougnat Darts
- [x] brancher inscription / connexion sur le provider auth frontend Clerk/OIDC
- [x] recuperer le JWT `bougnat-darts-api`
- [x] appeler `GET /v1/auth/me`
- [x] appeler `GET /v1/player/me/scoring-app/bootstrap`
- [x] gerer 401 en supprimant l etat connecte local
- [x] gerer profil joueur absent en etat `profil scoring a completer`
- [ ] creer les ports applicatifs tournament
- [ ] ajouter le chargement d un match tournoi
- [ ] ajouter la soumission de resultat tournoi
- [ ] ajouter la resilience locale du brouillon tournoi
- [ ] couvrir les parcours connectes par tests unitaires et E2E
