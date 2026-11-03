# Spec 029 - Counter Sonar coverage governance

## Status

Active

## Objective

Prevent SonarCloud quality-gate regressions by defining a spec-driven coverage contract before implementation and review.

## Scope

- TypeScript and TSX source introduced or modified by a pull request
- Vitest coverage and LCOV publication
- SonarCloud new-code coverage
- UI, application, domain and infrastructure layers
- Pull requests targeting `main`, `develop`, `preprod` or `release/**`

## Architectural decisions

- Coverage policy is defined in a spec before code changes are merged.
- Coverage exclusions are explicit, narrow and justified by the test strategy.
- Business, application and presentation-model code remains covered by unit tests.
- Pure UI composition is validated by Playwright and may be excluded from line coverage only when the corresponding E2E acceptance checks exist.
- Domain and application behavior must never be excluded from coverage to make a quality gate pass.
- Global Vitest floors and Sonar new-code coverage are independent gates.
- Vitest includes every TypeScript/TSX source in the Sonar source directories,
  even when no test imports it. It reads the existing approved coverage
  exclusions directly from `sonar-project.properties`; there is no separate
  Vitest exclusion list.
- Global Vitest floors are 90% statements, 80% branches, 90% functions and
  90% lines. These are regression floors, not a replacement for the Sonar
  new-code gate.
- A coverage exception is temporary, documented in the spec and linked to a follow-up issue.

## Coverage classification

| Layer | Primary test | Coverage rule |
|---|---|---|
| Domain and application | Vitest unit tests | Must remain included in Sonar coverage |
| Presentation models and pure functions | Vitest unit tests | Must remain included in Sonar coverage |
| UI composition and route wiring | Playwright/component tests | May use narrow `sonar.coverage.exclusions` when E2E acceptance is present |
| Infrastructure adapters | Vitest unit/integration tests | Must remain included unless an explicit exception is approved |
| CSS and static assets | Build and visual/E2E checks | Excluded from executable coverage by nature |

## Invariants

1. Every feature pull request references one active spec.
2. The spec declares the changed layers and their test strategy before implementation.
3. New domain, application, model and adapter code is covered by Vitest tests.
4. UI coverage exclusions list concrete paths and never use a broad catch-all to hide untested behavior.
5. Each excluded UI path has at least one Playwright or component acceptance check.
6. `npm run test:unit:coverage` passes the configured Vitest floors.
7. SonarCloud new-code coverage remains at or above 80%.
8. A temporary exception includes an owner, reason, expiration criterion and follow-up issue.
9. Generated files, build output, coverage output and test artifacts remain excluded from source analysis.

## Pull request acceptance checklist

- [ ] Spec updated with changed files/layers and test strategy.
- [ ] Unit tests added for domain, application, models and adapters.
- [ ] Component or E2E tests added for user-visible UI behavior.
- [ ] Coverage report generated locally with `npm run test:unit:coverage`.
- [ ] Sonar coverage exclusions are narrow, justified and documented.
- [ ] `npm run typecheck`, `npm run test:unit` and `npm run build` pass.
- [ ] CI Quality Gate and SonarCloud checks are green.

## Exception process

A pull request may temporarily fall below the Sonar new-code threshold only when the missing test is blocked by an external dependency or an approved migration. The pull request must document the exception in its feature spec, link a follow-up issue, name an owner and define the condition that removes the exception. Excluding a file solely because it is difficult to test is not an accepted exception.

## Canonical configuration

- `sonar-project.properties`
- `vitest.config.ts`
- `.github/workflows/quality-gate.yml`
- `.github/actions/setup-ci-app/action.yml`

## Approved current exclusions

The following paths are approved because their user-visible behavior is covered
by Playwright or component acceptance tests:

- `App.tsx`
- `components/game-setup/SetupCustomNumberModal.tsx`
- `components/game-setup/SetupRulesModal.tsx`
- `components/game-setup/SetupSummarySection.tsx`
- `components/game/StartingPlayerOverlay.tsx`
- `components/match/MatchSettingsModal.tsx`
- `components/stats/CricketStatsModal.tsx`
- `components/stats/StatsModal.tsx`
- `src/features/smartphone/useVisualViewport.ts`
- `src/features/tablet/useTabletLayout.ts`
- `views/CapitalGameView.tsx`
- `views/CricketGameView.tsx`
- `views/GotchaGameView.tsx`
- `views/KillerGameView.tsx`
- `views/MatchView.tsx`
- `views/SetupView.tsx`
- `views/TriathlonGameView.tsx`

The executable guard `scripts/validate-sonar-coverage.mjs` requires every
configured coverage exclusion to be listed here and rejects exclusions that
target protected business layers.

## Validation

The quality workflow must run unit coverage before SonarCloud analysis. The integration smoke workflow must install every browser declared by `playwright.config.ts`. Any change to either workflow requires a corresponding update to this spec and a CI validation note.

### Coverage expansion validated on 2026-11-03

- Voice: real audio manager, connection manager and streaming hook behavior
  tested against browser audio/Deepgram boundary fakes, including PCM delivery,
  transcripts, errors, timeouts, restart and cleanup.
- Application: browser history/fullscreen navigation, game completion/rematch,
  result persistence, match timer and configurable shortcut validation.
- Domain/infrastructure: Triathlon event scoring, bonuses, ties and phase
  transitions; JSON storage failures; IndexedDB session/history round trips.
- UI: score entry and callbacks, disabled controls, Cricket scoreboard, setup
  players, installation, home/navigation and statistics/recap views.
- Full source-scope baseline: 217 tests, 62.58% lines (1940/3100),
  62.64% statements, 57.91% branches and 64.15% functions.
- After expansion: 398 tests in 67 files, 95.29% lines (2954/3100),
  94.10% statements, 85.71% branches and 96.33% functions.
- Validation: full unit coverage, lint, typecheck, coverage governance and
  production build passed. No source was newly excluded and no threshold was
  lowered. SonarCloud new-code results still require a server analysis.
