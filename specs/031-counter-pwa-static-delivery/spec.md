# Spec 031 - Counter PWA static delivery

## Status

Planned — next development priority.

## Objective

Deliver a valid web app manifest and service worker in deployed builds, then activate the existing PWA lifecycle without risking stale scoring sessions, broken updates or an untestable offline state.

## Context

`manifest.json` and `sw.js` currently live at the repository root. Vite copies static files from `public/`, so neither file is emitted to `dist/`. On preproduction and production, `/manifest.json` and `/sw.js` can therefore resolve to the SPA HTML fallback. The manifest is unusable and service worker registration fails because the response has the wrong content and MIME type.

This defect predates spec 030. Shipping the files will activate the service worker in production for the first time, so this work is more than a file move: caching, offline behavior and the live-update lifecycle must be validated together.

## Scope

- Static delivery of `manifest.json`, `sw.js` and every asset referenced by them
- Web app manifest identity and install metadata
- Service worker precache, runtime cache and cache-version lifecycle
- Update handling during and after a live match
- Cloudflare Pages cache headers and MIME behavior
- Build-time regression guards
- Preproduction validation on Chromium, Android, tablet and Safari/iOS
- Documentation and closure of the PWA finding recorded by spec 030

## Out of scope

- Changing the external match link contract
- Making iOS open browser links directly inside the installed home-screen app
- Adding a backend or remote synchronization layer
- Replacing the current installation UI unless validation exposes a defect
- Adding `launch_handler` or screenshots without separate compatibility evidence

## Architectural decisions

- Static PWA assets are owned by `public/` and copied unchanged by Vite.
- The service worker cache version remains tied to `VITE_APP_VERSION`; production and preproduction must provide a non-`dev` build identifier.
- A service worker update must never force a reload during a protected scoring session.
- `isLiveUpdateBlocked()` and `setLiveUpdatePending(true)` remain the application boundary for deferred reloads.
- The precache contains only resources that are guaranteed to exist in the deployed output.
- `/sw.js` is served with a revalidation-friendly cache policy so browsers can detect releases promptly.
- Build validation fails when the manifest, service worker or referenced mandatory icons are absent or resolve to SPA HTML.
- Tournament links continue to be tested in a normal browser tab; installed-PWA link capture is not assumed on iOS/iPadOS.

## Invariants

1. `dist/manifest.json` is valid JSON and `dist/sw.js` is JavaScript, never the SPA fallback.
2. Every mandatory manifest icon exists in `dist/` with the declared size and type.
3. Every precached URL exists in the deployed build or is deliberately provided by the hosting platform.
4. Installing or updating the service worker cannot erase the persisted match or reload an active scoring screen.
5. A pending update is applied once the protected session ends.
6. Old application caches are removed after activation without touching unrelated origin caches.
7. After one successful online visit, the application shell can open offline.
8. Fresh online navigation remains network-first and receives the current deployment.
9. Development mode unregisters stale production service workers as it does today.
10. External match links keep their documented browser/PWA behavior.

## Acceptance checks

- `npm run build` emits `dist/manifest.json` and `dist/sw.js`.
- The manifest parses, exposes a stable `id`, and references existing icons.
- The service worker response has a JavaScript MIME type and a cache policy that permits update checks.
- The manifest response has a manifest/JSON MIME type and an explicit cache policy.
- Browser registration completes without MIME or scope errors.
- Chromium exposes `beforeinstallprompt` when installability conditions are met.
- The installed application launches in standalone mode.
- The application shell loads offline after an initial online visit.
- An update during a match is deferred; the same update after the match reloads safely.
- Old versioned caches are deleted during activation.
- Chrome Android, the supported tablet profiles and Safari/iOS receive manual or automated validation.
- External tournament links are validated in a browser tab, including the documented iOS limitation.

## Test strategy

- Unit tests for service worker cache/version and update decisions where logic can be isolated.
- Tooling tests for manifest parsing, required files, icon paths and non-HTML asset contents.
- A production-build contract check integrated into deployment validation or the quality gate.
- Playwright coverage for registration, installability signals where browser APIs allow them, offline shell loading and deferred update behavior.
- Manual preproduction evidence for Android installation and Safari/iOS behavior that cannot be faithfully automated.

## Documentation closure

Once preproduction validation succeeds:

- Mark the delegated PWA task in spec 030 as complete.
- Remove the known defect from `docs/release/v2.0.0.md` and its coverage map.
- Mark the PWA/update row in `docs/release/react-19-validation-matrix.md` as validated.
- Record browser, device, offline and update-cycle evidence in the release notes.
