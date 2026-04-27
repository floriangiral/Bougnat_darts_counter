# Plan — Spec 022

## Phase 1 : Extraction depuis App.tsx

- [x] Créer `src/app/useGameLifecycle.ts` — tous les handlers `handleQuickGame`, `handleGameSelect`, `handleStartSetup`, `handleMatchFinish*`, `handleCricketFinish`, `handleTriathlonFinish`, `handleCapitalFinish`, `handleKillerFinish`, `handleGotchaFinish`, `handleReturnToGameSelection`, `handleRematch`
- [x] Créer `src/lib/analyticsInstance.ts` — singleton `analytics` partagé

## Phase 2 : Extraction depuis MatchView

- [x] Créer `src/features/x01/hooks/useMatchTimer.ts` — elapsed timer + live clock
- [x] Créer `src/features/x01/hooks/useMatchShortcuts.ts` — état shortcuts + draft sync + resize listener

## Phase 3 : Extraction depuis setupModel

- [x] Créer `src/features/game-setup/setupPresentation.ts` — `SetupRulesContent`, `getRuleDescription`, `getRuleLabel`, `getMatchModeLabel`, `getSetupTitle`, `getGameName`, `getRulesContent`

## Phase 4 : Suppression X01_501_BO5

- [x] Supprimer le type `X01_501_BO5` de `GameType`
- [x] Supprimer `isQuickPreset` de `SetupView` et `buildSetupPlayers`
- [x] Nettoyer analytics domain, tests, helpers e2e
