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
    appShell.ts          — session persistence, screen guards
    useAppScreenHistory.ts
    useGameLifecycle.ts  — [v1.0.2] game finish/rematch/exit handlers
  domain/
  application/
  infrastructure/
  features/
    game-setup/
      setupModel.ts        — reducer, state, factories
      setupPresentation.ts — [v1.0.2] labels, rule descriptions, game names
    x01/
      scoring/
      voice/
      hooks/
        useMatchTimer.ts    — [v1.0.2] elapsed timer + live clock
        useMatchShortcuts.ts — [v1.0.2] shortcut state + handlers
    triathlon/
  lib/
    env.ts
    analyticsInstance.ts — [v1.0.2] analytics port singleton
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
- `src/features/x01/hooks/`: hooks cibles extraits des vues (timer, shortcuts)
- `src/features/game-setup/setupPresentation.ts`: labels, descriptions de regles et contenu des modales — separation presente/etat
- `src/app/useGameLifecycle.ts`: cycle de vie des parties (start, finish, rematch, exit) sorti de App.tsx
- `src/lib/analyticsInstance.ts`: instance analytics partagee, singleton module-level

Principe de decoupe:

- un fichier = une responsabilite metier identifiable
- les fonctions de presentation (labels, descriptions) ne vivent pas dans les reducers d etat
- les handlers de lifecycle ne vivent pas dans le composant racine
- les effects secondaires ciblables (timer, listeners) sortent dans des hooks dedies

La direction de refactor est de reduire progressivement les fichiers centraux (`MatchView`, `SetupView`, `useDeepgramStreaming`) en extrayant d abord les responsabilites pures et testables, puis les blocs UI autonomes.

## Integration Boundary

Any remote scoring or session platform is treated as an external system.

The supported open source repo does not own:

- authentication workflows
- persistent cloud user profiles
- cloud statistics consolidation
- tournament orchestration
- proprietary business persistence

## Decision v1.0.2

Le refactoring `v1.0.2` decoupe les god objects identifies :

- `setupModel.ts` : separation reducer d etat / helpers de presentation → `setupPresentation.ts`
- `App.tsx` : extraction des handlers cycle de vie → `useGameLifecycle.ts`
- `App.tsx` : instance analytics partagee → `analyticsInstance.ts`
- `MatchView.tsx` : timer side-effect → `useMatchTimer.ts`
- `MatchView.tsx` : shortcuts state + handlers → `useMatchShortcuts.ts`

Resultat: −402 lignes sur les fichiers centraux, 5 nouveaux modules a responsabilite unique, 0 changement fonctionnel, 120/120 tests unitaires conserves.

Fichiers restant a decouvper (backlog):

- `views/SetupView.tsx` (770 lignes) : extraire `PlayerConfigSection`, `GameRulesSection`, `SetupSummary`
- `src/features/x01/voice/useDeepgramStreaming.ts` (555 lignes) : extraire `audioContextManager`, `deepgramConnectionManager`, `pcmBufferManager`
- `utils/triathlonScoring.ts` (572 lignes) : types domaine → `src/domain/triathlon/`, regles → `src/domain/triathlon/triathlonScoringRules.ts`
- `views/CapitalGameView.tsx` (500 lignes) : extraire hooks metier Capital
- `views/CricketGameView.tsx` (475 lignes) : extraire hooks metier Cricket

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
