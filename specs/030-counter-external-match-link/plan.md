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

## Rollback

- Leaving `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` empty disables the feature without code change.

## Exit criteria

- All checks of `CONTRIBUTING.md` pass.
- No behavior change without link params.
