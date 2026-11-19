# Plan - External match link

## Phase 1 - Contract

- Define the incoming params, the result params and the allowlist rules in `spec.md`.
- Declare `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` (empty by default) in the env contract.

## Phase 2 - Pure module

- Parse and validate the link (`parseExternalMatchLink`), the allowlist (`parseAllowedOrigins`, `isAllowedReturnUrl`).
- Count legs from the leg history and build the result URL (`countLegsWonByTeam`, `buildExternalReturnUrl`).
- Unit tests first, including invalid links and open-redirect attempts.

## Phase 3 - Wiring

- `App.tsx`: read the link once, pre-fill the existing X01 setup, clean the address bar, persist and drop the context.
- `views/StatsView.tsx`: optional `externalReturn` prop (send button, no rematch, no auto exit).
- Component tests and a Playwright smoke test.

## Phase 4 - Hardening (v2.0.0)

- Keep the imposed players and format in the context; lock the setup and only send a result for the linked match.
- Ask before leaving a linked match (result, `status=cancelled`, or leave) and before a link replaces a match in progress or an unsent result.
- Validate the allowed origins in the tooling (`wrangler:check`, deployment checks, Pages build); `wrangler.jsonc` is the source of truth.
- Harden names (invisible format characters, NFC), version the contract (`v=1`), expire stale contexts (12 hours).
- Local testing on a phone: `http` to a private IPv4 for an explicit `VITE_APP_ENV=local` only.
- Partner integration guide.

## Phase 5 - Partner experience (v2.0.0)

- Explain a rejected link to the players (`analyzeExternalMatchLink`, `ExternalLinkIssueDialog`).
- Optional result statistics (`stats=1`).
- Standalone partner simulator page for link building and local phone testing.
- PWA launch evaluation (documented; the manifest and service worker shipping is a separate change).

## Rollback

- Leaving `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` empty disables the feature without code change.

## Exit criteria

- All checks of `CONTRIBUTING.md` pass.
- No behavior change without link params.
