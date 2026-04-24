# Bougnat Darts Counter Architecture Target

## Objective

`Bougnat_darts_counter` est un client de scorage open source, offline-first, pensé pour rester utile sans backend métier obligatoire.

Cette architecture cible sert à garder le coeur de scoring stable, lisible et publiable.

## Product Positioning

Le repo porte le moteur de scorage, les modes de jeu, les sessions locales et le voice scoring optionnel.

Il ne porte pas la source de vérité métier pour l organisation de tournoi, les profils distants ou les statistiques cloud.

## Core Principles

- gameplay first: aucune évolution ne doit dégrader les flux de scoring supportés
- spec-driven: les responsabilités importantes sont écrites avant ou avec le code
- clean architecture pragmatique: le domaine et les use cases ne dépendent ni de React ni du stockage
- offline-first: le jeu reste exploitable sans réseau
- explicit boundaries: les intégrations externes passent par des contrats clairs
- open source ready: aucune logique métier propriétaire ne doit vivre dans le runtime supporté

## Scope Split

### Ce qui reste dans le counter

- scoring engine
- règles de jeu et variantes supportées
- saisie de score
- voice scoring `X01`
- sessions locales
- persistence locale
- reprise de session
- experience offline-first
- UI de scorage

### Ce qui sort du counter

- authentification métier
- profils cloud persistés
- statistiques cloud consolidées
- logique tournoi propriétaire
- orchestration organisateur
- persistance métier distante

Ces responsabilités appartiennent à `Bougnat_Darts_Tournaments` et doivent être consommées via des contrats explicites si besoin.

## Operating Modes

### `LOCAL_MODE`

- no auth required
- no backend dependency
- storage on device
- session recovery after reload

### `CONNECTED_MODE`

- integrations optional only
- remote state stays behind ports
- local gameplay remains available
- backend-specific workflows stay outside the scoring core

## Clean Architecture Layers

```text
src/
  app/
  domain/
  application/
  infrastructure/
  features/
  views/
  components/
  shared/
```

Layer responsibilities:

- `domain/`: model métier pur
- `application/`: use cases et ports
- `infrastructure/`: storage et adapters
- `features/`: orchestration de feature et helpers métier ciblés
- `views/` et `components/`: composition UI et rendu
- `shared/`: primitives transverses framework-agnostic

Dependency rule:

- `views` and `components` may depend on `application`, `features`, and `shared`
- `infrastructure` may depend on `application`, `domain`, and `shared`
- `application` may depend on `domain` and `shared`
- `domain` may depend only on `shared`
- no inward layer may import an outward layer

## Refactoring Guidance

Les vues React restent des orchestrateurs de flux: elles connectent les hooks, handlers et composants, mais les donnees derivees metier doivent sortir vers `src/features/*`.

Responsabilites attendues:

- `views/`: composition d ecran, wiring des handlers, et navigation entre etats UI majeurs
- `components/`: rendu reutilisable ou rendu localise sans connaissance profonde du match
- `src/features/x01/scoring/`: presentation metier X01, mapping de donnees score, validations et transitions de scoring
- `src/features/x01/voice/`: integration Deepgram, types de messages vocaux, conversion audio et orchestration streaming

La direction de refactor est de reduire progressivement les fichiers centraux (`MatchView`, `SetupView`, hooks voice) en extrayant d abord les responsabilites pures et testables, puis les blocs UI autonomes.

## Integration Boundary

Any remote scoring or session platform is treated as an external system.

The supported open source repo does not own:

- authentication workflows
- persistent cloud user profiles
- cloud statistics consolidation
- tournament orchestration
- proprietary business persistence

## Decision v1.0.1

The `v1.0.1` release locks the current runtime to:

- scoring flows
- game modes
- local sessions
- offline-first UX
- optional voice scoring

The repository intentionally avoids carrying proprietary product logic in runtime code.

## Release Controls v1.0.1

- promotion `preprod` et `production` bloquee si `DEEPGRAM_API_KEY` ou `DEEPGRAM_PROJECT_ID` manque
- promotion `preprod` et `production` bloquee si le projet Deepgram cible n est pas accessible (`GET /v1/projects/{project_id}`)
- quality gate basee sur `lint`, `typecheck`, `test:unit`, `build`
- smoke E2E conserve pour proteger les flux critiques de scoring
