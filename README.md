# Bougnat Darts Counter

[![Quality Gate](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/quality-gate.yml)
[![Security Review](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/security-review.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/security-review.yml)
[![End-to-End](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/e2e.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/e2e.yml)
[![Secret Scan](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/floriangiral/Bougnat_darts_counter/actions/workflows/secret-scan.yml)
[![Release](https://img.shields.io/github/v/tag/floriangiral/Bougnat_darts_counter?sort=semver&label=release)](https://github.com/floriangiral/Bougnat_darts_counter/tags)
[![Open Issues](https://img.shields.io/github/issues/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/issues)
[![Open PRs](https://img.shields.io/github/issues-pr/floriangiral/Bougnat_darts_counter)](https://github.com/floriangiral/Bougnat_darts_counter/pulls)

Application open source de scorage de flechettes, pensée pour un usage terrain rapide, lisible et fiable.

La version `v1.0.1` consacre le repo comme une base stable de scoring open source : jeux supportés, scorage manuel, voice scoring `X01`, sessions locales et expérience offline-first.

## Ce que contient le projet

- moteur de scoring
- jeux `X01`, `501 Double Out`, `Cricket`, `Capital` et `Triathlon`
- UI de scorage mobile, tablette et desktop
- voice scoring `X01` optionnel
- sessions locales et reprise après rechargement
- persistence locale offline-first

## Ce que le projet ne porte pas

- backend métier
- authentification métier
- espace utilisateur riche
- profils distants
- statistiques cloud consolidées
- logique tournoi avancée
- orchestration organisateur
- persistence backend métier

## Etat du projet

- version de référence : `v1.0.1`
- application utilisable localement pour le scorage
- socle recentré sur un moteur de scoring propre, testable et offline-first
- aucune dépendance runtime à un backend métier pour le gameplay supporté

## Démarrage rapide

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Accès local par défaut : `http://localhost:3000`

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

Variables privées utiles pour l’assistance vocale :

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID`

Règles importantes :

- les variables `VITE_*` sont publiques côté frontend
- les clés privées ne doivent jamais être exposées au navigateur
- l’assistance vocale reste optionnelle et garde toujours un fallback manuel
- `VITE_TOURNAMENT_API_URL` reste optionnelle et ne sert qu’aux intégrations futures côté système maître

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

## Qualité

Le projet embarque une base de qualité sérieuse :

- lint
- typecheck
- tests unitaires
- tests end-to-end
- contrôle de sécurité

La qualité du projet repose aussi sur deux choix structurels :

- une approche spec-driven pour cadrer les évolutions fonctionnelles
- une Clean Architecture pragmatique pour protéger le cœur de scorage

## Documentation

- [docs/specifications.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/specifications.md)
- [docs/architecture.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/architecture.md)
- [docs/product-scope.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/product-scope.md)
- [docs/release/v1.0.1.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/release/v1.0.1.md)
- [docs/release/v1.0.1-coverage-map.md](/home/e103350/projects/perso/Bougnat_darts_counter/docs/release/v1.0.1-coverage-map.md)
- [SECURITY.md](/home/e103350/projects/perso/Bougnat_darts_counter/SECURITY.md)
- [CONTRIBUTING.md](/home/e103350/projects/perso/Bougnat_darts_counter/CONTRIBUTING.md)

## Licence

This project is licensed under the MIT License.

Tournament management, backend orchestration and proprietary business features live outside this repository and must integrate through explicit contracts only.
