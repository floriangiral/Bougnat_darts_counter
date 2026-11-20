# Bougnat Darts Counter Architecture Target

## Objective

`Bougnat_darts_counter` est un client de scorage open source, offline-first, pensé pour rester utile sans backend métier obligatoire.

Cette architecture cible sert à garder le coeur de scoring stable, lisible et publiable.

## Product Positioning

Le repo porte le moteur de scorage, les modes de jeu, les sessions locales et le voice scoring optionnel.

Il ne porte pas la source de vérité métier pour l organisation de tournoi, les profils distants ou les statistiques cloud.

La base `v1.1` a stabilise le scorage local open source. La `v2.0.0` y ajoute un seul contrat externe optionnel, le lien de match externe `X01` ([spec 030](../specs/030-counter-external-match-link/spec.md)), sans backend ni logique tournoi : voir [Decision v2.0](#decision-v20).

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
    appShell.ts          — session persistence (debounce, background flush), screen guards
    appScreens.ts        — screen list and guard
    sessionRecovery.ts   — [spec 010] versioned session validation and migration
    useAppScreenHistory.ts
    useGameLifecycle.ts  — [v1.1] game finish/rematch/exit handlers
  domain/
  application/
  infrastructure/
  features/
    game-setup/
      setupModel.ts        — reducer, state, factories
      setupPresentation.ts — [v1.1] labels, rule descriptions, game names
    x01/
      scoring/
        checkoutEligibility.ts — [v1.1] checkout eligibility rules
      voice/
      hooks/
        useMatchTimer.ts    — [v1.1] elapsed timer + live clock
        useMatchShortcuts.ts — [v1.1] shortcut state + handlers ([v2.0] phone bar + on/off)
    game-session/
      commonGuards.ts   — [spec 010] player/config guards
      gameRuntime.ts    — [spec 010] non-X01 game snapshot validation + clock resume
      gameTiming.ts     — [spec 010] clock persisted as timestamped elapsed seconds
    cricket/
      cricketGameModel.ts — [spec 010] serializable Cricket state + pure reducer
    triathlon/
    smartphone/
      useVisualViewport.ts        — viewport height, keyboard detection
      usePortraitLock.ts          — [v2.0] best-effort portrait lock on phones
      RotateToPortraitOverlay.tsx — [v2.0] "turn your phone" screen in landscape
  lib/
    env.ts
  views/
  components/
    game/
      MatchPlayerArea.tsx — [v1.1] X01 player-area composition
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

## Local Session Persistence (spec 010)

État réellement implémenté :

- Chaque vue de jeu publie un instantané JSON après chaque action validée (`onStateChange`) et le reçoit au remontage (`restoredState`) : `MatchRuntimeSnapshot` pour X01 (`views/MatchView.tsx`), `GameRuntimeSnapshot` (`{ gameType, state, timing }`) pour Cricket, Capital, Killer, Gotcha et Triathlon ; le Triathlon compose son déroulé et l'instantané de l'épreuve embarquée. `App.tsx` garde ces instantanés (`matchRuntime`, `gameRuntime`) dans la session persistée.
- Écriture : `persistAppSession` (anti-rebond 300 ms) sur changement métier, `persistAppSessionNow` sur `pagehide` / `visibilitychange` ; le chronomètre n'est jamais une dépendance d'écriture (lu par référence et horodaté, `gameTiming.ts`).
- Lecture : `restoreAppSession` (repli `localStorage`, synchrone) puis `restoreAppSessionAsync` (IndexedDB) passent par `parsePersistedAppSession` : version (`schemaVersion` 2, format sans version migré pour X01), âge (7 jours), validation structurelle écrite à la main. Une session écartée est supprimée et signalée par `components/session/SessionNotice.tsx`.
- Stockage compact : `src/features/game-session/storedSessionCodec.ts` borne les étapes d'annulation écrites à 20 et remplace, dans chacune, les données qui ne font que croître (manches X01 terminées, historiques par joueur) par la longueur du préfixe de la partie courante ; la lecture les reconstruit avant validation.
- Démarrage sans copie `localStorage` : `App.tsx` lit la session IndexedDB avant toute écriture et avant d'appliquer un lien partenaire.
- Infrastructure : `IndexedDBSessionRepository` (base version 1, sans montée de version) signale une session écrite nulle part (`saveAppSession` renvoie `false`) et ne garde dans `current_matches` que la partie X01 en cours.
- Écarts connus à la règle de dépendance : `src/shared/session/persistedAppSession.ts` importe (types seulement) les états de jeu de `src/domain` et `src/features` ; plusieurs onglets ne sont pas coordonnés : le dernier onglet qui sauvegarde gagne (décision du product owner).

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
- `components/game/MatchPlayerArea.tsx`: composition d'une zone joueur X01 a partir d'un ViewModel de feature

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

En pratique, la seule integration reseau supportee dans le runtime `v2.0` reste le voice scoring optionnel via Deepgram, avec fallback manuel obligatoire et sans dependance gameplay au reseau.

Le lien de match externe optionnel ([spec 030](../specs/030-counter-external-match-link/spec.md), [guide partenaire](integration/external-match-link.md)) n est pas une integration reseau : il pre-remplit et verrouille le setup X01 depuis l URL et renvoie le resultat (ou l abandon) par une simple navigation vers une origine autorisee (`VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS`, vide par defaut, source de verite `wrangler.jsonc`). Le contrat est versionne (`v=1`), le resultat n est envoye que pour le match impose par le lien, et le resultat n est pas signe : sa validation reste a la charge de l application partenaire. Aucun appel reseau, aucune logique tournoi dans ce repo.

## Decision v2.0

La `v2.0.0` ouvre le premier contrat public avec des applications tierces, sans elargir le perimetre metier du repo :

- `src/features/external-match/externalMatchLink.ts` : module pur (lecture et diagnostic du lien, politique de retour, contexte, controle de conformite du match, URL de resultat et d annulation, statistiques optionnelles) ;
- `src/features/external-match/externalMatchStartup.ts` : arbitrage pur entre un lien entrant et la session restauree ;
- `src/features/external-match/externalMatchAddressBar.ts` : adaptateur navigateur de nettoyage de l URL ;
- `components/external-match/ExternalMatchDialogs.tsx` et `src/presentation/externalMatch/externalMatchLabels.fr.ts` : dialogues et textes ;
- `views/SetupView.tsx`, `components/game-setup/SetupPlayersSection.tsx` : verrouillage du setup d un match lie ;
- `App.tsx` : composition (lecture unique au demarrage, gardes de sortie, navigation vers le partenaire apres ecriture de la session) ;
- `scripts/lib/externalReturnOrigins.mjs` : validation des origines partenaires par l outillage de deploiement.

Invariants : aucun appel reseau ajoute, aucune logique tournoi, fonctionnalite desactivee par defaut, `https` obligatoire hors `VITE_APP_ENV=local`, resultat envoye uniquement pour le match impose par le lien. Le resultat n est pas signe : une signature serveur a ete refusee pour ne pas reintroduire de backend.

## Decision v1.1

La consolidation `v1.1` confirme et etend les extractions pragmatiques engagees sur les fichiers centraux :

- `setupModel.ts` : separation reducer d etat / helpers de presentation → `setupPresentation.ts`
- `App.tsx` : extraction des handlers cycle de vie → `useGameLifecycle.ts`
- `MatchView.tsx` : timer side-effect → `useMatchTimer.ts`
- `MatchView.tsx` : shortcuts state + handlers → `useMatchShortcuts.ts`
- `MatchView.tsx` : eligibility checkout → `src/features/x01/scoring/checkoutEligibility.ts`
- `MatchView.tsx` : player-area rendering → `components/game/MatchPlayerArea.tsx`
- `SetupView.tsx` : configuration joueurs + resume → `SetupPlayersSection.tsx`, `SetupSummarySection.tsx`, `setupViewModel.ts`
- `useDeepgramStreaming.ts` : buffer/transcript/logging/audio/socket → `voiceStreamingModel.ts`, `voiceStreamingLogger.ts`, `audioContextManager.ts`, `deepgramConnectionManager.ts`
- `useDeepgramStreaming.ts` : session attempt, issue runtime et arbitrage proposition → `voiceSessionModel.ts`, `voiceProposalModel.ts`
- `utils/triathlonScoring.ts` : types/regles → `src/domain/triathlon/`
- `CapitalGameView.tsx` : reducer + snapshots → `src/features/capital/capitalGameModel.ts`
- `CricketGameView.tsx` : competiteurs + snapshots + resume → `src/features/cricket/cricketGameModel.ts`
- `index.tsx` : injection unique du beacon web analytics au bootstrap
- runtime/frontend : migration `React 19` sans reouvrir le scope produit

Resultat: baisse continue de la taille des fichiers centraux, 0 changement fonctionnel, et couverture unitaire maintenue sur les extractions pures.

Backlog `v1.1+` volontairement limite :

- `views/SetupView.tsx` : extractions UI additionnelles uniquement si le flux setup regrossit
- `src/features/x01/voice/useDeepgramStreaming.ts` : callbacks supplementaires seulement si le protocole voix s'elargit
- `views/CapitalGameView.tsx` et `views/CricketGameView.tsx` : extractions UI futures seulement en cas d'evolution produit concrete

## Decision v1.0.1

The `v1.0.1` release locks the current runtime to:

- scoring flows
- game modes
- local sessions
- offline-first UX
- optional voice scoring

The repository intentionally avoids carrying proprietary product logic in runtime code.

## Release Controls v2.0

- `npm run wrangler:check`, les verifications `preprod` / `production` et le build Cloudflare Pages bloquent une origine partenaire invalide
- `wrangler.jsonc` reste la source de verite des origines partenaires du bundle publie
- les controles `v1.1` ci-dessous restent en vigueur

## Release Controls v1.1

- promotion `preprod` et `production` bloquee si `DEEPGRAM_API_KEY` ou `DEEPGRAM_PROJECT_ID` manque
- promotion `preprod` et `production` bloquee si le projet Deepgram cible n est pas accessible (`GET /v1/projects/{project_id}`)
- quality gate basee sur `lint`, `typecheck`, `test:unit`, `build`
- smoke E2E conserve pour proteger les flux critiques de scoring
- aucun contrat d environnement tournament-specifique n est requis par le runtime supporte
