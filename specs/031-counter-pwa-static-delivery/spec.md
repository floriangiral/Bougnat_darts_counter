---
id: 031-counter-pwa-static-delivery
v2_id: V2-REL-02
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Implémentée sur feat/v2.0.0 (2026-11-20) ; validation préprod et terrain Android/iOS restante."
traitement_propose: "Finaliser (Révision V2)."
decision_traitement: validee
issue: '#216'
verifie_au_commit: ad86dfb
derniere_revue: 2026-11-20
---
# Spec 031 - Counter PWA static delivery

## Status

Implemented on `feat/v2.0.0` (2026-11-20), delivered to `release/v2.0.0` by pull request. Preproduction and field validation (V2-AC-02, V2-AC-04, V2-AC-08) remain. See « Décisions et réalisation » at the end.

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

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : VALIDÉE ET IMPLÉMENTÉE (2026-11-20).** Proposition issue de l'audit V2 du 2026-11-20 (V2-REL-02), validée par la demande d'implémentation du product owner avec les options recommandées, sauf Q1 (voir « Décisions et réalisation »). Le contenu historique ci-dessus est conservé tel quel.

### Constats vérifiés (code au commit `508dfa6`)

- [vérifié] `manifest.json`, `sw.js` et `logo.svg` sont à la racine du dépôt ; `public/` ne contient que les icônes, `_headers`, `_routes.json`, `pcmCaptureWorklet.js`, `app-qr.svg`, `preview.svg` et l'affiche.
- [vérifié] `index.html:15` référence `/manifest.json` ; Vite le traite comme un asset : `dist/index.html` pointe vers `/assets/manifest-<hash>.json`, **qui est livré**. En revanche `/manifest.json`, `/sw.js` et `/logo.svg` sont absents de `dist/`.
- [vérifié] `index.tsx:43-75` enregistre `/sw.js?appVersion=<VITE_APP_VERSION>` en production : la requête reçoit le repli SPA (HTML), l'enregistrement échoue et l'erreur est seulement journalisée (`logRuntimeInfo`).
- [vérifié] `sw.js:3-8` précache `/`, `/index.html`, `/logo.svg` **et** `/manifest.json` : même une fois `sw.js` livré, `cache.addAll` échouerait sur les deux dernières URL et l'installation du SW serait rejetée.
- [vérifié] `sw.js:17` appelle `skipWaiting()` sans condition et `sw.js:33` `clients.claim()` : une nouvelle version prend le contrôle d'une page en pleine partie ; seul le rechargement est différé (`index.tsx:48-55`, `App.tsx:222-228`, écrans protégés `src/app/appShell.ts:29`).
- [vérifié] `sw.js:21-31` supprime **tous** les caches dont le nom diffère du cache courant (contraire à l'invariant 6).
- [vérifié] `sw.js:42-56` met en cache toute réponse de navigation sous `/index.html` sans vérifier `response.ok`.
- [vérifié] `sw.js:1-2` dérive le nom de cache du paramètre `appVersion` ; `src/lib/env.ts:43` retombe sur `dev`. `VITE_APP_VERSION` n'est pas déclarée dans `wrangler.jsonc:10-19,22-31` alors que le build servi est produit par Cloudflare Pages à partir de ces variables ; les workflows GitHub la fixent à `github.sha` mais pour leurs propres builds de contrôle. [à confirmer : variable éventuellement définie dans le tableau de bord Cloudflare] → risque d'un cache `bougnat-darts-dev` constant, jamais purgé.
- [vérifié] `public/_headers` ne contient aucune règle propre à `/sw.js` ni `/manifest.json` ; la CSP autorise `manifest-src 'self'` et `worker-src 'self' blob:`.
- [vérifié] `eslint.config.js:22` cible `sw.js` à la racine.
- [vérifié] `manifest.json` : pas de champ `id` ni `description` ; `orientation: "any"` (l.11), à coordonner avec le portrait imposé sur téléphone et l'éventuel verrouillage paysage tablette.
- [vérifié] Les vues sont regroupées dans un chunk `views` chargé à la demande (`vite.config.ts:87-88`, `App.tsx:54-63`) ; aucun asset haché n'est précaché → le hors-ligne dépendrait du cache d'exécution des seuls fichiers déjà téléchargés [hypothèse].

### Écarts avec la spec

| # | Spec 031 | Réalité | Conséquence |
|---|---|---|---|
| E1 | « The manifest is unusable » (Context) | Manifeste haché livré et référencé | Corriger le contexte ; décider de l'URL stable (V2-FR-01) |
| E2 | Tâche « Move `logo.svg` or remove it from the precache » | `/manifest.json` aussi absent du précache | Garde de build sur toutes les URL précachées |
| E3 | Décision « non-`dev` build identifier » | Non contrôlé (`validate-pages-build-env.mjs` ne vérifie pas `VITE_APP_VERSION`) | Coordination avec V2-REL-03 (009) |
| E4 | Invariant 6 (caches tiers préservés) | Violé par `sw.js:26` | Filtrer sur le préfixe `bougnat-darts-` |
| E5 | Invariant 4 (pas de rechargement en partie) | Respecté pour le rechargement, mais `skipWaiting()` change le contrôleur en pleine partie | Activation différée hors partie (V2-FR-06) |

### Exigences proposées

- V2-FR-01 Livrer `public/sw.js` et `public/manifest.json` (URL stables, non hachées) ; `index.html` conserve `/manifest.json` ; supprimer les copies racine et mettre à jour `eslint.config.js`.
- V2-FR-02 Le précache ne contient que des URL présentes dans `dist/` ; une garde de build (script Node sans dépendance, branché sur `npm run build` ou `deployment-check`) échoue si une URL précachée, une icône du manifeste ou `/sw.js` manque ou contient du HTML.
- V2-FR-03 Le nom de cache provient d'un identifiant de build non `dev` dans tout build Cloudflare Pages (variable obligatoire ou dérivée de `CF_PAGES_COMMIT_SHA`, à arbitrer avec V2-REL-03).
- V2-FR-04 L'activation ne supprime que les caches `bougnat-darts-*` obsolètes.
- V2-FR-05 La navigation reste network-first et ne met en cache que des réponses `ok`.
- V2-FR-06 Une nouvelle version s'installe puis **attend** : la page demande l'activation (`postMessage` `SKIP_WAITING`) seulement hors écran protégé, puis recharge ; aucune prise de contrôle en pleine partie.
- V2-FR-07 Après une visite en ligne, l'application s'ouvre hors ligne et une partie X01 au clavier est jouable de bout en bout (voix indisponible signalée).
- V2-FR-08 `public/_headers` : `/sw.js` en `Cache-Control: no-cache`, `/manifest.json` avec une politique explicite courte.
- V2-FR-09 Manifeste : `id` stable, `description` et `lang: "fr"` ; `orientation` inchangée tant que V2-TAB-06 (028) et la refonte tablette n'ont pas tranché.
- V2-NFR-01 Aucune dépendance ajoutée (pas de Workbox/vite-plugin-pwa sauf décision Q3) ; coût récurrent nul.
- V2-NFR-02 Le SW ne lit ni n'écrit IndexedDB/localStorage : la persistance de partie (spec 010) reste hors de son périmètre.

### Critères d'acceptation

- V2-AC-01 Après `npm run build`, `dist/sw.js` et `dist/manifest.json` existent, sont respectivement JavaScript et JSON valides ; la garde V2-FR-02 passe et échoue si on réintroduit `/logo.svg` dans le précache.
- V2-AC-02 En preprod, `/sw.js` est servi en JavaScript avec `Cache-Control: no-cache` ; `/manifest.json` en JSON/manifest.
- V2-AC-03 L'enregistrement réussit sans erreur console (Playwright `navigator.serviceWorker.ready`).
- V2-AC-04 Déploiement d'une nouvelle version pendant un X01 : aucune prise de contrôle ni rechargement ; retour à l'accueil → rechargement unique, nouvelle version affichée.
- V2-AC-05 Playwright : après une visite, `context.setOffline(true)` → accueil, configuration et partie X01 complète fonctionnent.
- V2-AC-06 Un cache tiers de même origine survit à l'activation ; l'ancien cache `bougnat-darts-<ancienne>` est supprimé.
- V2-AC-07 Le cache de production ne s'appelle pas `bougnat-darts-dev`.
- V2-AC-08 Terrain : invite d'installation et lancement autonome sur Chrome Android ; ajout manuel à l'écran d'accueil sur iPhone Safari ; valide la spec 011.

### Questions ouvertes

| # | Question | Options | Recommandation |
|---|---|---|---|
| Q1 | Livrer 031 dans 2.0.0 ou 2.0.1 | 2.0.0 / 2.0.1 | 2.0.1, après validation preprod (cf. V2-REL-01, 033, Q2) |
| Q2 | Stratégie de précache | Coquille minimale + cache d'exécution / liste complète générée depuis `dist/.vite/manifest.json` | Liste générée (hors-ligne fiable dès la 1re visite), sans dépendance |
| Q3 | SW manuel ou vite-plugin-pwa (Workbox) | Manuel / plugin | Manuel : SW court, aucune dépendance |
| Q4 | Mise à jour : rechargement silencieux hors partie ou bandeau « Nouvelle version » | Silencieux / bandeau | Silencieux hors écran protégé (parcours inchangé) ; bandeau à étudier plus tard |
| Q5 | `orientation` du manifeste | `any` / `portrait` / selon appareil | `any` tant que V2-TAB-06 n'a pas tranché |

### Dépendances

Aucune bloquante (catalogue). Liens : V2-REL-01 (033, séquencement), V2-REL-03 (009, identifiant de build), spec 011 (validation de l'installation), V2-DS-00 (018, volet E3), V2-QA-09 (042, appareils), V2-ARCH-06 (010, persistance hors SW), V2-TAB-06 (028, orientation).

### Décisions et réalisation (2026-11-20)

| # | Décision | Réalisation |
|---|---|---|
| Q1 | Livrée dans 2.0.0 (même PR que la finalisation de 030), publication conditionnée à la validation préprod | — |
| Q2 | Liste de précache générée depuis `dist/`, sans dépendance | `scripts/generate-sw-precache.mjs` et `scripts/lib/pwaBuild.mjs` : 15 URL, environ 1,5 Mio (page, manifeste, icônes, QR d'accueil, JS/CSS modernes ; chunks legacy et sources maps exclus) |
| Q3 | Service worker manuel | `public/sw.js` |
| Q4 | Mise à jour silencieuse hors écran protégé | `src/infrastructure/web/serviceWorkerUpdates.ts`, `App.tsx` (`applyPendingServiceWorkerUpdate`) |
| Q5 | `orientation: "any"` conservée | `public/manifest.json` |

- V2-FR-03 : l'identifiant de cache est un hash du contenu livré (`bougnat-darts-<12 caractères>`), calculé au build ; il ne dépend plus de `VITE_APP_VERSION` ni du paramètre `appVersion`, et `sw.js` change d'octets à chaque version.
- Rollback : `BOUGNAT_PWA_KILL_SWITCH=true npm run build` livre `scripts/pwa/sw-kill-switch.js` comme `dist/sw.js`.
- Limite : les navigateurs legacy (iOS 12) ne fonctionnent hors ligne qu'avec les fichiers déjà chargés sous le contrôle du service worker (chunks legacy non précachés).

Critères d'acceptation :

- V2-AC-01 : garde `scripts/validate-pwa-build.mjs` branchée sur `npm run build` ; `tests/unit/tooling/pwaBuild.test.ts` (dont le cas `/logo.svg` réintroduit).
- V2-AC-02 : règles `public/_headers` vérifiées avec `wrangler pages dev` en local ; **à confirmer en préprod**.
- V2-AC-03, V2-AC-05, V2-AC-07 : `tests/e2e/pwa.smoke.spec.ts` (exécuté par la CI de la PR).
- V2-AC-04 : logique couverte par `tests/unit/infrastructure/serviceWorkerUpdates.test.ts` ; **à confirmer en préprod** avec un vrai déploiement pendant une partie.
- V2-AC-06 : `tests/unit/tooling/serviceWorker.test.ts` (service worker exécuté dans un bac à sable `node:vm`).
- V2-AC-08 : **à valider sur le terrain** (Chrome Android, Safari iPhone) ; valide aussi la spec 011.

### Suivi de la 2.2.0 (2026-11-27)

L'implémentation est incluse dans la GitHub Release `v2.1.0`, sans promotion en production : celle-ci reste en `1.1.4`. La `2.2.0` est en préparation, ni taguée ni promue en production ; ses validations sont suivies dans la [gate 2.2.0](../../docs/release/checklist.md#gate-220) et [#361](https://github.com/floriangiral/Bougnat_darts_counter/issues/361).

- Le [run CI E2E](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45962187926) de la PR #359 a réussi sur la fusion `a147a0b`, de même arbre que sa tête `645613d`. Sur Chromium, `pwa.smoke` vérifie la livraison statique, l'enregistrement du service worker, puis l'accueil et le début d'une partie X01 hors ligne. Cette preuve ne couvre pas une partie complète hors ligne (V2-AC-05) et ne valide pas le futur candidat 2.2.0.
- V2-AC-02, V2-AC-04 et V2-AC-08 restent à confirmer en préproduction ou sur les appareils ; aucune validation terrain ne découle de ce run CI.
