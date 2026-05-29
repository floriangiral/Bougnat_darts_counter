# Plan - counter hub auth tournament scoring

## Phase 1 - Contrat et configuration

- [x] documenter le backend Bougnat Darts par cible
- [x] introduire `VITE_TOURNAMENT_API_BASE_URL`
- [x] aligner docs produit, architecture, technique et specifications
- [x] ajouter la spec locale `027`

## Phase 2 - Frontieres applicatives

- [ ] definir les ports `AuthSessionPort`, `TournamentMatchPort` et `TournamentResultPort`
- [ ] ajouter les types de contrats frontend minimaux pour utilisateur, session, match tournoi et soumission resultat
- [ ] isoler le client HTTP dans `src/infrastructure/bougnatApi/`

## Phase 3 - Authentification

- [x] ajouter les ecrans inscription / connexion / deconnexion via Clerk
- [x] recuperer le JWT Clerk `bougnat-darts-api` sans stockage durable
- [x] gerer expiration, erreur reseau et retour au mode local

## Phase 4 - Scorage tournoi

- [ ] charger un match tournoi assigne ou ouvert via lien/jeton
- [ ] mapper le contexte tournoi vers la configuration de scoring existante
- [ ] conserver un brouillon local pendant la partie
- [ ] soumettre le resultat de facon idempotente
- [ ] afficher les etats confirme, refuse, conflit et retry

## Phase 5 - Verification

- [x] ajouter tests unitaires de l adapter compte joueur
- [ ] ajouter smoke E2E du parcours tournoi
- [ ] etendre `deployment-check` si de nouveaux contrats deviennent obligatoires
- [ ] verifier que les jeux locaux restent jouables sans backend
