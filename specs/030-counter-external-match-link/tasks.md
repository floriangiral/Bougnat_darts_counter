# Tasks - External match link

- [x] Define the link contract, result params and allowlist rules.
- [x] Add `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` to the env contract (code, example, wrangler, docs).
- [x] Implement and unit test the pure link module.
- [x] Implement and unit test the address bar adapter.
- [x] Pre-fill the X01 setup from the link in `App.tsx` and persist the return URL.
- [x] Add the send-result button to `StatsView` (component tests).
- [x] Add a Playwright smoke test for the link entry.
- [x] Lock players and format in the setup of a linked match; check the match before sending a result.
- [x] Ask before leaving a linked match; send `status=cancelled` on request.
- [x] Ask before a link replaces a match in progress or an unsent linked result.
- [x] Validate the allowed origins in `wrangler:check`, the deployment checks and the Pages build.
- [x] Harden player names, add the contract version `v=1`, expire stale contexts.
- [x] Allow `http` to a private IPv4 for an explicit `VITE_APP_ENV=local` (phone testing).
- [x] Write the partner integration guide.
- [x] Show the reason of a rejected link (priority 3).
- [x] Add the optional `stats=1` result statistics (priority 3).
- [x] Add the partner simulator page (priority 3).
- [x] Evaluate PWA launch behavior; manifest and service worker not shipped, tracked separately (priority 3).
- [x] Ship `manifest.json` and `sw.js` in the build (owned by priority spec `031-counter-pwa-static-delivery`, delivered in the same pull request).
- [x] Suite Playwright vérifiée sur le contenu livré en 2.2.0 ; preuve CI dans les notes de release.
- [x] Configure the allowed origins in `wrangler.jsonc` (preview, then production) once a partner is validated (`https://badarts.fr`, commit `f9ac4c2`).

## Révision V2 — tâches proposées

> Révision V2 validée et exécutée le 2026-11-20 (voir R7 de la spec). Chaque tâche cite les critères `V2-AC-xx` couverts.

- [x] T000 Vérifier que la Révision V2 de la spec est validée et que les questions Q1 à Q7 sont tranchées
- [x] T001 Cocher la tâche « Configure the allowed origins » (fait par `f9ac4c2`) et préciser la branche réellement auditée (V2-AC-06)
- [x] T002 Écrire les tests golden des URL de résultat et d'abandon dans `tests/unit/externalMatch/externalMatchContract.golden.test.ts` (V2-AC-01)
- [x] T003 Vérifier ou ajouter le test « paramètre inconnu ignoré » (V2-AC-02)
- [x] T004 Ajouter le scénario E2E voix + match lié dans `tests/e2e/external-match-link.smoke.spec.ts` (V2-AC-03)
- [x] T005 Remplacer les libellés « tournoi » dans `externalMatchLabels.fr.ts` et adapter les tests de composants et l'E2E (V2-AC-05)
- [x] T006 Ajouter au guide partenaire : compatibilité de `v=1`, durées et rejeu, jeton du partenaire (corrélation, pas certification), variante nouvel onglet + relais ; corriger les phrases « au plus 12 heures », « lien en attente oublié après 12 heures » et « le lien a expiré (12 heures) » (V2-AC-04)
- [x] T007 Aligner `docs/release/v2.0.0.md` et `docs/release/v2.0.0-coverage-map.md` avec l'activation de badarts.fr (V2-AC-06)
- [x] T008 Décision Q4 consignée : la balise Web Analytics n'est plus chargée sur une page ouverte par un lien (mitigation retenue sans attendre la vérification en préprod)
- [x] T009 Contact non autorisé : la limite reste documentée (V2-AC-07)
- [x] T010 Exécuter `npm run typecheck`, `npm run lint`, `npm run test:unit:coverage`, la suite E2E du lien externe, puis renseigner `verifie_au_commit` et fermer l'issue `V2-INT-01` (contrôles locaux passés et `verifie_au_commit` renseigné le 2026-11-20 ; E2E par la CI de la PR, fermeture de l’issue au merge) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).


## Bilan de clôture (2026-11-27)

Recette du périmètre livré validée par le product owner ; preuves et transferts détaillés dans [spec.md](spec.md#clôture-2026-11-27). Les tâches non cochées ci-dessus sont conservées pour la traçabilité et ne sont pas déclarées exécutées.
