# Plan — Spec 022

## Phase 1 : Extraction depuis App.tsx

- [x] Créer `src/app/useGameLifecycle.ts` — tous les handlers `handleQuickGame`, `handleGameSelect`, `handleStartSetup`, `handleMatchFinish*`, `handleCricketFinish`, `handleTriathlonFinish`, `handleCapitalFinish`, `handleKillerFinish`, `handleGotchaFinish`, `handleReturnToGameSelection`, `handleRematch`
- [x] Rationaliser l observabilite frontend autour d un singleton partage (historique)

## Phase 2 : Extraction depuis MatchView

- [x] Créer `src/features/x01/hooks/useMatchTimer.ts` — elapsed timer + live clock
- [x] Créer `src/features/x01/hooks/useMatchShortcuts.ts` — état shortcuts + draft sync + resize listener

## Phase 3 : Extraction depuis setupModel

- [x] Créer `src/features/game-setup/setupPresentation.ts` — `SetupRulesContent`, `getRuleDescription`, `getRuleLabel`, `getMatchModeLabel`, `getSetupTitle`, `getGameName`, `getRulesContent`

## Phase 4 : Suppression X01_501_BO5

- [x] Supprimer le type `X01_501_BO5` de `GameType`
- [x] Supprimer `isQuickPreset` de `SetupView` et `buildSetupPlayers`
- [x] Nettoyer analytics domain, tests, helpers e2e

## Phase 5 : SetupView split

- [x] Créer `components/game-setup/SetupPlayersSection.tsx` — gestion joueurs, doublettes, bot et starters d'équipe
- [x] Créer `components/game-setup/SetupSummarySection.tsx` — rendu du résumé de configuration et action de lancement
- [x] Créer `src/features/game-setup/setupViewModel.ts` — options de joueurs, résumé et fallback labels

## Phase 6 : Voice runtime split

- [x] Créer `src/features/x01/voice/voiceStreamingModel.ts` — file PCM bornée, assemblage d'utterance, normalisation des erreurs
- [x] Créer `src/features/x01/voice/voiceStreamingLogger.ts` — logs debug bornés au dev, erreurs structurées
- [x] Réduire `useDeepgramStreaming.ts` à l'orchestration React + I/O Deepgram

## Phase 7 : Triathlon domain split

- [x] Créer `src/domain/triathlon/triathlonTypes.ts` — types scorecards/evenements hors de `utils/triathlonScoring.ts`
- [x] Créer `src/domain/triathlon/triathlonScoringRules.ts` — regles et fabriques d'evenements vides
- [x] Garder `utils/triathlonScoring.ts` comme facade compatible

## Phase 8 : Capital / Cricket game models

- [x] Créer `src/features/capital/capitalGameModel.ts` — reducer, snapshots et helpers de fin de partie
- [x] Créer `src/features/cricket/cricketGameModel.ts` — competiteurs, snapshots, agrégats et resume de match
- [x] Réduire `CapitalGameView.tsx` et `CricketGameView.tsx` au wiring écran + handlers React

## Phase 9 : Voice managers

- [x] Créer `src/features/x01/voice/audioContextManager.ts` — capture micro, audio graph, cleanup audio
- [x] Créer `src/features/x01/voice/deepgramConnectionManager.ts` — ouverture socket, wiring handlers, cleanup connexion
- [x] Réduire `useDeepgramStreaming.ts` aux refs/état React et callbacks métier
