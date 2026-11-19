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
- [ ] Run the full Playwright suite on the v2.0.0 release branch.
- [ ] Configure the allowed origins in `wrangler.jsonc` (preview, then production) once a partner is validated.
