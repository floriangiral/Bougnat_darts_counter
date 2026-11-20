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

## Révision V2 — plan proposé

> Plan exécuté le 2026-11-20 (V2-REL-02) ; voir « Décisions et réalisation » de la spec. L'identifiant de cache est un hash du contenu calculé au build plutôt que `VITE_APP_VERSION` (étape 2).

1. **Livraison statique** : déplacer `manifest.json` et `sw.js` vers `public/` (V2-FR-01) ; supprimer `logo.svg` du précache ou le déplacer dans `public/` ; mettre à jour `eslint.config.js:22`.
2. **Identifiant de build** : avec V2-REL-03 (009), rendre `VITE_APP_VERSION` obligatoire et non `dev` dans `scripts/validate-pages-build-env.mjs`, ou la dériver de `CF_PAGES_COMMIT_SHA` dans `vite.config.ts` (V2-FR-03).
3. **Précache** : activer `build.manifest` de Vite et générer la liste des fichiers à précacher par un script post-build (`scripts/generate-sw-precache.mjs`, sans dépendance), injectée dans `dist/sw.js` (V2-FR-02, Q2).
4. **Cycle de vie** : retirer `skipWaiting()` de l'installation ; écouter un message `SKIP_WAITING` ; côté page (`index.tsx`), envoyer ce message seulement quand `isLiveUpdateBlocked()` est faux, puis recharger une fois (V2-FR-06) ; filtrer la purge sur `bougnat-darts-` (V2-FR-04) ; ne mettre en cache que les réponses `ok` (V2-FR-05).
5. **Hébergement** : règles `/sw.js` et `/manifest.json` dans `public/_headers` (V2-FR-08).
6. **Garde de build** : `scripts/validate-pwa-build.mjs` (existence, JSON valide, icônes, absence de HTML, URL précachées) branché sur `npm run build` et la CI (V2-AC-01).
7. **Preprod puis production** selon la décision de séquencement (Q1).

**Fichiers** : `public/sw.js`, `public/manifest.json`, `index.html`, `index.tsx`, `eslint.config.js`, `vite.config.ts`, `public/_headers`, `scripts/validate-pages-build-env.mjs`, nouveaux `scripts/generate-sw-precache.mjs` et `scripts/validate-pwa-build.mjs`, `package.json` (script `build`).

**Tests** : unitaires des scripts (`tests/unit/tooling/pwaBuild.test.ts`) ; Playwright `tests/e2e/pwa.smoke.spec.ts` (enregistrement, hors-ligne via `context.setOffline`, mise à jour différée simulée par un second SW de test) ; terrain Android/iOS.

**Migration** : les clients sans SW n'ont rien à migrer ; le premier SW installé crée le cache courant. Si un cache `bougnat-darts-dev` existe déjà [à confirmer], il est purgé par le filtre de préfixe.

**Rollback** : livrer un `public/sw.js` « kill switch » (installation immédiate, purge des caches `bougnat-darts-*`, `self.registration.unregister()`), sans toucher à la persistance des parties ; le manifeste reste livré indépendamment.
