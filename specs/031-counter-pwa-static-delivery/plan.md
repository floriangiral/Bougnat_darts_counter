# Plan - PWA static delivery

## Phase 1 - Static asset delivery

- Move `manifest.json` and `sw.js` under `public/` so Vite emits them unchanged.
- Move `logo.svg` under `public/` or remove it from the precache.
- Update the ESLint file target for the service worker.
- Build and verify the exact contents of `dist/manifest.json` and `dist/sw.js`.

## Phase 2 - Manifest contract

- Add a stable application `id` and a description.
- Verify `start_url`, `scope`, display modes, orientation and all icon files.
- Evaluate `launch_handler: { "client_mode": "navigate-existing" }` against tournament links before adopting it.
- Treat screenshots as optional enhancement work, not a release blocker.

## Phase 3 - Service worker hardening

- Replace the current precache with deployed, deterministic resources.
- Verify cache naming from `VITE_APP_VERSION` in every deployed environment.
- Keep navigation network-first and define the offline shell fallback explicitly.
- Confirm that activation deletes only obsolete Bougnat Darts caches.
- Validate `skipWaiting()`, `controllerchange`, deferred live updates and post-match reloads.

## Phase 4 - Hosting and regression guards

- Add explicit `/sw.js` and `/manifest.json` rules to `public/_headers`.
- Add a build contract that checks file existence, JSON parsing, icon paths, content types where testable and absence of SPA HTML.
- Run the contract from deployment checks or the quality workflow.

## Phase 5 - Preproduction validation

- Deploy to preproduction before production.
- Validate HTTP responses, registration, install prompt, standalone launch and offline shell behavior.
- Exercise updates during an active match and after leaving the protected screen.
- Validate Chrome Android, supported tablet layouts and Safari/iOS.
- Re-run external tournament link journeys in a normal browser tab.

## Phase 6 - Documentation and rollout

- Record evidence and known browser limitations.
- Close the delegated task in spec 030.
- Update the v2.0.0 known-defect notes, coverage map and React 19 validation matrix.
- Promote only after the update and offline lifecycle is accepted on preproduction.

## Rollback

- Remove service worker registration from the release or restore a non-registering build if production caching causes a scoring risk.
- Preserve persisted sessions during rollback.
- Keep the manifest independently deliverable even if service worker activation is postponed.

## Exit criteria

- All automated checks in `CONTRIBUTING.md` pass.
- Static asset build guards pass.
- Preproduction installation, offline and update evidence is recorded.
- No active-match reload or persisted-session regression is observed.
