# Tasks - PWA static delivery

## Priority 0 - Delivery blockers

- [ ] Move `manifest.json` to `public/manifest.json`.
- [ ] Move `sw.js` to `public/sw.js` and update the ESLint target.
- [ ] Move `logo.svg` to `public/` or remove it from the precache.
- [ ] Verify that the production build emits the manifest, service worker and every required icon.
- [ ] Add build guards that reject missing files, invalid JSON and SPA HTML returned as a static PWA asset.

## Priority 1 - Safe activation

- [ ] Define the final precache list using only deployed resources.
- [ ] Verify cache versioning from `VITE_APP_VERSION` outside local development.
- [ ] Test `skipWaiting()` and `controllerchange` during an active match.
- [ ] Test deferred updates through `isLiveUpdateBlocked()` and `setLiveUpdatePending(true)`.
- [ ] Test the safe reload after the protected match flow ends.
- [ ] Test obsolete Bougnat Darts cache deletion.
- [ ] Test offline application-shell loading after one online visit.

## Priority 2 - Hosting and manifest

- [ ] Add `/sw.js` cache headers to `public/_headers`.
- [ ] Add an explicit cache policy for `/manifest.json`.
- [ ] Verify JavaScript and manifest/JSON MIME types on preproduction.
- [ ] Add a stable manifest `id` and a description.
- [ ] Validate all icon paths, dimensions, MIME types and maskable purpose.
- [ ] Evaluate `launch_handler` with external match links; add it only if the behavior is accepted.
- [ ] Decide separately whether Android screenshots are useful.

## Priority 3 - Acceptance and closure

- [ ] Confirm service worker registration without console or MIME errors.
- [ ] Confirm the Android/Chromium install prompt and standalone launch.
- [ ] Validate navigation and scoring offline.
- [ ] Validate update behavior during and after a match.
- [ ] Validate supported phone and tablet profiles.
- [ ] Validate Safari/iOS manual installation and document browser-link isolation.
- [ ] Validate tournament links in a normal browser tab.
- [ ] Mark the delegated spec 030 task complete.
- [ ] Remove the v2.0.0 known defect and update the coverage map.
- [ ] Mark the React 19 PWA/update validation row complete.
