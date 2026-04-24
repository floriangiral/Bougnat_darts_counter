# Guide technique et developpement

Ce document regroupe les informations techniques qui ne doivent pas alourdir le README principal, destine aux joueurs et a la communaute.

## Etat du projet

- Version de reference : `v1.0.1`
- Application Vite / React
- Scorage offline-first
- Jeux supportes : `X01`, `501 Double Out`, `Cricket`, `Capital`, `Triathlon`
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
- `VITE_ENABLE_VOICE_SCORING`
- `VITE_TOURNAMENT_API_URL`
- `VITE_LOG_LEVEL`

Variables privees utiles pour l'assistance vocale :

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID`

Regles importantes :

- Les variables `VITE_*` sont publiques cote frontend.
- Les cles privees ne doivent jamais etre exposees au navigateur.
- L'assistance vocale reste optionnelle et garde toujours un fallback manuel.
- `VITE_TOURNAMENT_API_URL` reste optionnelle et ne sert qu'aux integrations futures cote systeme maitre.

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

## Documentation technique

- [Specifications](specifications.md)
- [Architecture](architecture.md)
- [Architecture clean pragmatique](architecture/counter-pragmatic-clean-architecture.md)
- [Scoring access modes](architecture/scoring-access-modes.md)
- [Fondation offline-first](architecture/scoring-terminal-offline-first-foundation.md)
- [Audit securite Vercel et performance](audit-security-vercel-performance-2026-04-24.md)
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
