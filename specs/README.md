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
- `025-counter-react-19-migration`
  - slug: `spec:counter/react-19-migration`
  - statut: `active`
  - milestone: `M6: Architecture & Technical Cleanup`
- `026-counter-release-v1-1-stabilization`
  - release historique `v1.1.2`; la release active est `v2.0.0`
  - slug: `spec:counter/release-v1.1-stabilization`
  - statut: `active`
  - milestone: `M9: Open Source Release v1.1`
- `029-counter-sonar-coverage-governance`
  - slug: `spec:counter/sonar-coverage-governance`
  - statut: `active`
  - gouvernance: couverture Vitest et SonarCloud du nouveau code
  - perimetre: tous les fichiers source TS/TSX, y compris non importes, avec les exclusions Sonar approuvees
  - planchers globaux: 90 % instructions/fonctions/lignes, 80 % branches; Sonar nouveau code: 80 %
- `030-counter-external-match-link`
  - slug: `spec:counter/external-match-link`
  - statut: `accepted` (branche `release/v2.0.0`, non publiee)
  - perimetre: lien de match X01 externe optionnel (configuration pre-remplie et verrouillee, resultat ou abandon renvoye par navigation, contrat `v=1`)
  - securite: origines de retour autorisees par `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS`, vide par defaut, source de verite `wrangler.jsonc`, validees par l outillage; `https` obligatoire hors `VITE_APP_ENV=local`
  - guide partenaire: [docs/integration/external-match-link.md](../docs/integration/external-match-link.md)
- `031-counter-pwa-static-delivery`
  - slug: `spec:counter/pwa-static-delivery`
  - statut: `planned` — prochaine priorite de developpement
  - milestone: `M5: Offline-first UX`
  - perimetre: livrer le manifeste et le service worker, securiser leur activation en production, ajouter les gardes de build et valider installation, offline et mises a jour
  - origine: suivi du constat PWA de la spec `030-counter-external-match-link`

## Release active

- cible majeure: `v2.0.0` (non publiee)
  - branche de release: `release/v2.0.0`, creee depuis `main` (`v1.1.5`) avec la PR #201; developpements sur `feat/v2.0.0`
  - notes: [release v2.0.0](../docs/release/v2.0.0.md)
  - tracabilite: [coverage map v2.0.0](../docs/release/v2.0.0-coverage-map.md)
  - objectif: lien de match externe `X01` optionnel (`030-counter-external-match-link`), premier contrat public pour les applications partenaires, sans modification des regles metier
  - validation locale: lints, typecheck, 727 tests unitaires, couverture, gouvernance, `wrangler:check`, build et 28 scenarios E2E du lien externe sur Chromium
  - suite E2E complete Chromium/WebKit, CI, SonarCloud, Snyk et deploiement distant a confirmer avant publication
  - prochaine priorite apres les travaux en cours: `031-counter-pwa-static-delivery`
  - historique v1.1.5: [notes](../docs/release/v1.1.5.md)

- `spec:counter/release-v1.1-stabilization`
  - release cible historique: `v1.1.2`
  - issue de pilotage: `#103`
  - gouvernance associee: `spec:counter/release-governance-v1.0.x`

- `spec:counter/release-v1.1.3-sonar-debt`
  - release historique: `v1.1.3`
  - branche historique: `release/v1.1.3`
  - objectif: traiter la dette SonarCloud historique sans regression metier

Les specs `004-counter-release-v1-0-1-stabilization` et `007-counter-release-governance-v1-0-x` restent historiques et servent de base de gouvernance pour `v1.1.x`.

## Specs retirees

- `012` : ancienne spec d observabilite custom, remplacee par une observabilite native sans couche metier.
- `024` : ancienne spec de pageviews SPA, retiree du perimetre v1.1 pour eviter les evenements metier analytics dans le runtime open source.

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
