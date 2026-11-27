# Tasks - PWA static delivery

## Priority 0 - Delivery blockers

- [x] Move `manifest.json` to `public/manifest.json`.
- [x] Move `sw.js` to `public/sw.js` and update the ESLint target.
- [x] Move `logo.svg` to `public/` or remove it from the precache.
- [x] Verify that the production build emits the manifest, service worker and every required icon.
- [x] Add build guards that reject missing files, invalid JSON and SPA HTML returned as a static PWA asset.

## Priority 1 - Safe activation

- [x] Define the final precache list using only deployed resources.
- [x] Verify cache versioning outside local development (replaced by a content hash computed at build time).
- [x] Test `skipWaiting()` and `controllerchange` during an active match.
- [x] Test deferred updates through `isLiveUpdateBlocked()` and `setLiveUpdatePending(true)`.
- [x] Test the safe reload after the protected match flow ends.
- [x] Test obsolete Bougnat Darts cache deletion.
- [x] Test offline application-shell loading after one online visit (`tests/e2e/pwa.smoke.spec.ts`, [CI PR #359](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45962187926), Chromium, tête `645613d`).

## Priority 2 - Hosting and manifest

- [x] Add `/sw.js` cache headers to `public/_headers`.
- [x] Add an explicit cache policy for `/manifest.json`.
- [x] Verify JavaScript and manifest/JSON MIME types on preproduction. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Add a stable manifest `id` and a description.
- [x] Validate all icon paths, dimensions, MIME types and maskable purpose.
- [x] Evaluate `launch_handler` with external match links: not added (browser tab recommended for linked matches, spec 030).
- [ ] Decide separately whether Android screenshots are useful (out of 2.0.0).

## Priority 3 - Acceptance and closure

- [x] Confirm service worker registration without console or MIME errors. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Confirm the Android/Chromium install prompt and standalone launch. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Validate navigation and scoring offline. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Validate update behavior during and after a match. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Validate supported phone and tablet profiles. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Validate Safari/iOS manual installation and document browser-link isolation. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Validate tournament links in a normal browser tab. — recette confirmée le 27/11/2026 sur le contenu déployé.
- [x] Mark the delegated spec 030 task complete.
- [x] Remove the v2.0.0 known defect and update the coverage map.
- [x] Mark the React 19 PWA/update validation row complete. — recette confirmée le 27/11/2026 sur le contenu déployé.

## Révision V2 — tâches proposées

- [x] V2-T000 Vérifier que la révision V2 est validée et que la décision de séquencement (Q1, liée à V2-REL-01) est prise
- [x] V2-T001 Déplacer `manifest.json` et `sw.js` vers `public/` ; traiter `logo.svg` ; mettre à jour ESLint (V2-AC-01)
- [x] V2-T002 Garantir un identifiant de build non `dev` sur Cloudflare Pages avec V2-REL-03 (V2-AC-07)
- [x] V2-T003 Générer la liste de précache depuis le manifeste Vite (V2-AC-01, V2-AC-05)
- [x] V2-T004 Activation différée hors partie via `SKIP_WAITING` (V2-AC-04)
- [x] V2-T005 Purge limitée aux caches `bougnat-darts-*` ; cache de navigation limité aux réponses `ok` (V2-AC-06)
- [x] V2-T006 Règles `_headers` pour `/sw.js` et `/manifest.json` (V2-AC-02)
- [x] V2-T007 Ajouter `id`, `description`, `lang` au manifeste (V2-FR-09)
- [x] V2-T008 Garde de build PWA + tests unitaires des scripts (V2-AC-01)
- [x] V2-T009 E2E `pwa.smoke` : enregistrement et début de partie hors ligne (V2-AC-03, V2-AC-05 partiel) ; mise à jour différée couverte en unitaire, à confirmer en préprod (V2-AC-04)
- [x] V2-T010 Validation preprod HTTP + terrain Android/iOS ; valider la spec 011 (V2-AC-02, V2-AC-08) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).
- [x] V2-T011 Préparer et tester le SW « kill switch » de retour arrière
- [x] V2-T012 Mettre à jour notes de release, coverage map, matrice React 19 (ligne PWA), tâche déléguée de 030 ; passer la spec à `implementee`
- [ ] V2-T013 Vérifier en CI sur le candidat 2.2.0 une partie X01 complète hors ligne (V2-AC-05) ; le smoke actuel ne vérifie que le début de partie. Consigner la preuve dans la [gate](../../docs/release/checklist.md#gate-220) et [#361](https://github.com/floriangiral/Bougnat_darts_counter/issues/361).

La CI liée ci-dessus a testé la fusion `a147a0b`, de même arbre que `645613d` ; elle ne remplace ni la validation terrain ni les contrôles du candidat 2.2.0, encore à fixer.


## Bilan de clôture (2026-11-27)

Recette du périmètre livré validée par le product owner ; preuves et transferts détaillés dans [spec.md](spec.md#clôture-2026-11-27). Les tâches non cochées ci-dessus sont conservées pour la traçabilité et ne sont pas déclarées exécutées.
Reliquats suivis par [V2-QA-04](../040-counter-qa-e2e-full-game-journeys/spec.md) ; leurs propositions restent à arbitrer avant implémentation.
