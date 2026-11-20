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
- [ ] Ship `manifest.json` and `sw.js` in the build (owned by priority spec `031-counter-pwa-static-delivery`, outside spec 030).
- [ ] Run the full Playwright suite on the v2.0.0 release branch.
- [ ] Configure the allowed origins in `wrangler.jsonc` (preview, then production) once a partner is validated.

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2 (`V2-INT-01`). Chaque tâche cite les critères `V2-AC-xx` couverts.

- [ ] T000 Vérifier que la Révision V2 de la spec est validée et que les questions Q1 à Q7 sont tranchées
- [ ] T001 Cocher la tâche « Configure the allowed origins » (fait par `f9ac4c2`) et préciser la branche réellement auditée (V2-AC-06)
- [ ] T002 Écrire les tests golden des URL de résultat et d'abandon dans `tests/unit/externalMatch/externalMatchContract.golden.test.ts` (V2-AC-01)
- [ ] T003 Vérifier ou ajouter le test « paramètre inconnu ignoré » (V2-AC-02)
- [ ] T004 Ajouter le scénario E2E voix + match lié dans `tests/e2e/external-match-link.smoke.spec.ts` (V2-AC-03)
- [ ] T005 Remplacer les libellés « tournoi » dans `externalMatchLabels.fr.ts` et adapter les tests de composants et l'E2E (V2-AC-05)
- [ ] T006 Ajouter au guide partenaire : compatibilité de `v=1`, durées et rejeu, jeton du partenaire (corrélation, pas certification), variante nouvel onglet + relais ; corriger les phrases « au plus 12 heures », « lien en attente oublié après 12 heures » et « le lien a expiré (12 heures) » (V2-AC-04)
- [ ] T007 Aligner `docs/release/v2.0.0.md` et `docs/release/v2.0.0-coverage-map.md` avec l'activation de badarts.fr (V2-AC-06)
- [ ] T008 Vérifier en préprod si Web Analytics capture la chaîne de requête et consigner la décision Q4
- [ ] T009 Si le product owner l'autorise : essai de bout en bout avec badarts.fr, consigné ; sinon laisser la limite documentée (V2-AC-07)
- [ ] T010 Exécuter `npm run typecheck`, `npm run lint`, `npm run test:unit:coverage`, la suite E2E du lien externe, puis renseigner `verifie_au_commit` et fermer l'issue `V2-INT-01`
