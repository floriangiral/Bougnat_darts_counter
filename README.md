# Bougnat Darts Counter

[![Quality Gate](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/quality-gate.yml)
[![Security Review](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/security-review.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/security-review.yml)
[![End-to-End](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/e2e.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/e2e.yml)
[![Secret Scan](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/secret-scan.yml)
[![Release](https://img.shields.io/github/v/tag/floriangiral/Bougnat_darts_counter?sort=semver&label=release)](https://github.com/floriangiral/Bougnat_darts_counter/tags)
[![Open Issues](https://img.shields.io/github/issues/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/pulls)

Application open source de scorage de flechettes, pensée pour les joueurs exigeants, les scoreurs et les clubs qui veulent une interface rapide, lisible et fiable en situation réelle.

La `v1.0.0` marque une base produit mature : plusieurs jeux jouables, une UX pensée pour le rythme d’un match, des statistiques utiles, une reprise locale de session, et des fonctionnalités avancées comme l’assistance vocale sur `X01`.

Le projet assume aussi une trajectoire d engineering claire :

- produit guide par les specifications
- refactor incremental spec-driven
- architecture orientee Clean Architecture
- coeur metier isole, testable et durable

## Pourquoi Bougnat Darts Counter

Bougnat Darts Counter est conçu pour faire une chose très bien : scorer une partie de façon fluide, propre et professionnelle.

L’application met l’accent sur :

- une saisie rapide sur mobile, tablette et grand écran
- une lisibilité immédiate pour le joueur comme pour le scoreur
- une logique de jeu fidèle et stable
- une continuité de session locale robuste
- une expérience agréable, moderne et prête pour une utilisation régulière

## Fonctionnalités

### Jeux disponibles

- `501 Double Out`
- `Match X01`
- `Cricket`
- `Capital`
- `Triathlon`

### Pour les scoreurs

- saisie manuelle rapide au clavier
- raccourcis de score
- gestion des busts et checkouts
- confirmation de fermeture quand nécessaire
- reprise de partie locale
- affichage optimisé pour le suivi de match
- calcul du score restant pendant la volée sur `X01`

### Pour les joueurs

- interface claire et lisible à distance
- suivi des manches et des sets
- indication visuelle des états de jeu
- statistiques de fin de partie
- rematch rapide
- expérience immersive en plein écran

### Assistance vocale `X01`

Le mode `X01` inclut une assistance vocale orientée scoring :

- écoute micro en direct
- transcription des annonces
- proposition de score avant validation
- prise en charge des annonces de score du tour
- prise en charge des annonces de fléchettes
- prise en charge des annonces de score restant

La validation finale reste toujours sous contrôle du scoreur.

## Etat du projet

- version de référence : `v1.0.0`
- application utilisable localement pour le scorage
- persistance locale des sessions et de l’historique de jeu
- socle d’architecture recentré sur un moteur de scoring clean, testable et offline-first
- aucune dépendance runtime à Supabase pour le gameplay supporté de `v1.0.0`

## Périmètre v1.0.0

Le dépôt contient :

- les jeux de fléchettes supportés
- le moteur de scoring
- l UI de scorage
- le voice scoring `X01`
- les sessions locales
- la persistance locale offline-first

Le dépôt ne porte pas :

- backend métier
- authentification métier
- espace utilisateur riche
- profils distants
- statistiques cloud consolidées
- logique tournoi avancée
- orchestration organisateur
- persistance backend métier

## Philosophie produit

Le projet vise une application de scorage :

- open source
- lisible
- testable
- orientée performance d’usage
- fiable dans le feu de l’action

La direction technique est volontairement affirmee :

- les evolutions importantes doivent partir d un besoin formule clairement dans les specs
- les regles de jeu doivent etre deplacees dans un coeur de domaine pur
- les use cases doivent orchestrer la logique metier sans dependre de l UI
- l infrastructure doit rester remplaçable
- le refactor doit rester incremental et mesurable

Le gameplay passe avant tout : toute évolution doit préserver la fluidité de saisie, la stabilité des règles et la clarté de l’interface.

## Stack de l’application

La stack technique reste volontairement simple et moderne :

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Vitest
- Playwright

Pour l’assistance vocale `X01`, l’application utilise une intégration de transcription temps réel dédiée.

## Demarrage rapide

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Accès local par défaut :

- application : `http://localhost:3000`

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

Tests utiles pour la partie vocale :

```bash
npm run test:unit -- dartsSpeechParser
npm run typecheck
```

## Configuration

Le projet repose sur `.env.local` pour le développement local.

Variables publiques utiles :

- `VITE_APP_ENV`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_APP_URL`
- `VITE_TOURNAMENT_API_URL`
- `VITE_APP_ACCESS_MODE`
- `VITE_ENABLE_VOICE_SCORING`
- `VITE_LOG_LEVEL`

Variables privées utiles pour l’assistance vocale :

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID`

Règles importantes :

- les variables `VITE_*` sont publiques côté frontend
- les clés privées ne doivent jamais être exposées au navigateur
- l’assistance vocale doit rester optionnelle : le fallback manuel est toujours disponible
- `VITE_TOURNAMENT_API_URL` reste optionnelle et ne sert qu’aux intégrations futures en mode connecté

## Qualité

Le projet embarque déjà une base de qualité sérieuse :

- lint
- typecheck
- tests unitaires
- tests end-to-end
- contrôle de sécurité

Le but n’est pas seulement d’avoir une belle interface, mais un moteur de scorage fiable et maintenable.

La qualite du projet repose aussi sur deux choix structurels :

- une approche spec-driven pour cadrer les evolutions fonctionnelles
- une Clean Architecture pour proteger le coeur de scorage des details techniques

## Contribution

Les contributions sont bienvenues si elles respectent ces principes :

- ne pas casser le gameplay existant
- privilégier les changements incrémentaux
- garder le code lisible et testable
- éviter la sur-ingénierie
- préserver la rapidité d’usage en situation réelle

Avant de proposer une évolution, il est recommandé de vérifier :

- `npm run typecheck`
- `npm run test:unit`
- `npm run build`

## License

This project is licensed under the MIT License.

This repository contains only the scoring engine and gameplay logic.

Tournament management, backend orchestration and proprietary business features live outside this repository and must integrate through explicit contracts only.

## Documentation complémentaire

- spécifications : [docs/specifications.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/specifications.md)
- architecture : [docs/architecture.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/architecture.md)
- périmètre produit : [docs/product-scope.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/product-scope.md)
- release `v1.0.0` : [docs/release/v1.0.0.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/release/v1.0.0.md)
- coverage map `v1.0.0` : [docs/release/v1.0.0-coverage-map.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/release/v1.0.0-coverage-map.md)
- sécurité : [SECURITY.md](/home/e103350/projects/perso/Bougnat_darts_counter/SECURITY.md)
- cible d’architecture : [docs/architecture.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/architecture.md)
- périmètre produit : [docs/product-scope.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/product-scope.md)
- note de release : [docs/release/v1.0.0.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/release/v1.0.0.md)
