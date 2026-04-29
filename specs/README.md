# Specs Locales - Bougnat_darts_counter

## Ou ecrire une spec

- nouvelle spec: `specs/NNN-counter-sujet/`
- contrat inter-repos majeur: preferer une spec transverse au workspace puis referencer ici

## Categories locales

- `counter-scoring-*`
- `counter-offline-*`
- `counter-sync-*`
- `counter-app-shell-*`
- `counter-backend-adapter-*`

## Specs actives

- `001-counter-scoring-access-modes`
  - slug: `spec:counter/scoring-access-modes`
  - statut: `active`
  - milestone: `M5: Offline-first UX`
- `002-counter-setup-clean-architecture`
  - slug: `spec:counter/offline-scoring-terminal-foundation`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `003-counter-voice-scoring-reliability`
  - slug: `spec:counter/voice-scoring-reliability`
  - statut: `active`
  - milestone: `M3: Voice Scoring Reliability`
- `004-counter-release-v1-0-1-stabilization`
  - slug: `spec:counter/release-v1.0.1-stabilization`
  - statut: `active`
  - milestone: `M7: Open Source Release v1.0.1`
- `005-counter-ui-scoreboard-layout-consistency`
  - slug: `spec:counter/ui-scoreboard-layout-consistency`
  - statut: `active`
  - milestone: `M2: Game Modes Stability`
- `006-counter-voice-token-provisioning-hardening`
  - slug: `spec:counter/voice-token-provisioning-hardening`
  - statut: `active`
  - milestone: `M3: Voice Scoring Reliability`
- `007-counter-release-governance-v1-0-x`
  - slug: `spec:counter/release-governance-v1.0.x`
  - statut: `active`
  - milestone: `M7: Open Source Release v1.0.1`
- `008-counter-e2e-runtime-reliability`
  - slug: `spec:counter/e2e-runtime-reliability`
  - statut: `active`
  - milestone: `M5: Offline-first UX`
- `009-counter-env-contract-and-validation`
  - slug: `spec:counter/env-contract-and-validation`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `010-counter-offline-session-recovery-guarantees`
  - slug: `spec:counter/offline-session-recovery-guarantees`
  - statut: `active`
  - milestone: `M4: Local Session Persistence`
- `011-counter-home-install-shortcut`
  - slug: `spec:counter/home-install-shortcut`
  - statut: `active`
  - milestone: `M5: Offline-first UX`
- `012-counter-vercel-observability-clean-architecture`
  - slug: `spec:counter/vercel-observability-clean-architecture`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `013-counter-stats-french-clean-architecture`
  - slug: `spec:counter/stats-french-clean-architecture`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `014-counter-x01-keypad-digit-scale`
  - slug: `spec:counter/x01-keypad-digit-scale`
  - statut: `active`
  - milestone: `M5: Offline-first UX`
- `015-counter-x01-simple-two-player-limit`
  - slug: `spec:counter/x01-simple-two-player-limit`
  - statut: `active`
  - milestone: `M2: Game Modes Stability`
- `016-counter-x01-simple-bot-opponent`
  - slug: `spec:counter/x01-simple-bot-opponent`
  - statut: `active`
  - milestone: `M2: Game Modes Stability`
- `017-counter-killer-game`
  - slug: `spec:counter/killer-game`
  - statut: `active`
  - milestone: `M2: Game Modes Stability`
- `018-counter-ios12-compatibility`
  - slug: `spec:counter/ios12-compatibility`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `019-counter-gotcha-game`
  - slug: `spec:counter/gotcha-game`
  - statut: `active`
  - milestone: `M2: Game Modes Stability`
- `020-counter-inp-phase1-quick-wins`
  - slug: `spec:counter/inp-phase1-quick-wins`
  - statut: `active`
  - milestone: `M8: Performance & UX Polish`
- `021-counter-score-layout-font-scale-resilience`
  - slug: `spec:counter/score-layout-font-scale-resilience`
  - statut: `active`
  - milestone: `M5: Offline-first UX`
- `022-counter-arch-single-responsibility-split`
  - slug: `spec:counter/arch-single-responsibility-split`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
  - note: refactoring v1.0.4 — decoupe continue des god objects (SetupView, useDeepgramStreaming, triathlonScoring, CapitalGameView, CricketGameView) apres App, MatchView et setupModel
- `023-counter-x01-double-out-checkout-rate`
  - slug: `spec:counter/x01-double-out-checkout-rate`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `024-counter-vercel-spa-pageviews-and-flags`
  - slug: `spec:counter/vercel-spa-pageviews-and-flags`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `025-counter-react-19-migration`
  - slug: `spec:counter/react-19-migration`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `026-counter-release-v1-1-stabilization`
  - slug: `spec:counter/release-v1.1-stabilization`
  - statut: `active`
  - milestone: `M9: Open Source Release v1.1`

## Release active

- `spec:counter/release-v1.1-stabilization`
  - release cible: `v1.1`
  - issue de pilotage: `#103`
  - gouvernance associee: `spec:counter/release-governance-v1.0.x`

Les specs `004-counter-release-v1-0-1-stabilization` et `007-counter-release-governance-v1-0-x` restent historiques et servent de base de gouvernance pour `v1.1`.

## Structure minimale d'une spec

- `spec.md`
- `plan.md`
- `tasks.md`

## Quand utiliser ce repo plutot qu'une spec transverse

Utiliser une spec locale si le changement reste majoritairement:

- dans l'architecture React/TypeScript;
- dans le moteur de jeu;
- dans les adapters frontend;
- dans les flows de session locale, voice scoring ou integration remote optionnelle.

## Regle de versioning

Tout le contenu de `specs/` et `.specify/` de ce repo doit etre versionne dans ce repo.
