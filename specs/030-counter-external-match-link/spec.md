# Spec 030 - Counter external match link

## Status

Accepted - implemented on `release/v2.0.0` (not released yet).

Partner integration guide (French): [docs/integration/external-match-link.md](../../docs/integration/external-match-link.md).

## Objective

Let an external app (for example a club tournament manager) open the counter with an X01 match already configured, and get the result back at the end of the match, without any network integration: the link is a plain URL in, the result is a plain top-level navigation out.

Without link params, or with an invalid / non-allowed link, the counter behaves exactly as today.

## Scope

- X01 only (singles and doubles).
- Incoming link: query params pre-fill the X01 setup screen (players, start score, legs or sets, in/out rules). Players and format are then locked; players review them and press "Lancer la partie" as usual.
- Outgoing result: on the end-of-match screen, a "ENVOYER LE RESULTAT" button navigates to the return URL with the legs (and sets) won by each side and the winner.
- Outgoing abandon: leaving a linked match can tell the external app that it was cancelled.
- Out of scope: tournament logic, accounts, any `fetch` / `postMessage` / backend call, other games, signed results (see "Result integrity").

## Link contract (version 1)

Incoming params (unknown params are ignored, `?mode=` keeps working):

| Param | Values | Default |
|---|---|---|
| `v` | contract version, `1` | `1` (an unknown version rejects the link) |
| `game` | `x01` (required) | - |
| `p1`, `p2` | singles player names | - |
| `t1p1`, `t1p2`, `t2p1`, `t2p2` | doubles player names (take precedence over singles) | - |
| `start` | integer 2-9999 (301, 501, 701 or custom) | `501` |
| `in` / `out` | `open`, `double`, `master` | `open` / `double` |
| `legs` | legs to win (per set in the sets format), integer 1-15 | `3` |
| `sets` | sets to win, integer 1-15 (switches to the sets format) | legs format |
| `stats` | `1` to add match statistics to the result, `0` | `0` |
| `return` | absolute return URL (required, must be allowed) | - |

Example: `https://play.bougnatdarts.fr/?v=1&game=x01&start=501&out=double&legs=3&p1=Alice&p2=Bob&return=https%3A%2F%2Fexample.org%2Fmatch%2F12`

Names: whitespace controls become spaces, control (`Cc`) and invisible format (`Cf`: bidi overrides, zero-width characters, BOM) characters are removed, the name is NFC-normalized, spaces are collapsed and the name is cut to 32 characters without splitting an emoji. Any malformed value makes the whole link invalid (no silent guess for a competition match).

A query with `game` or `return` is read as a link attempt: when it is rejected, the counter shows the first issue found (`ExternalLinkIssue`: feature disabled, unsupported version or game, missing or non-allowed return URL with its host, missing players, invalid start, in, out, legs, sets or stats) in a dialog, removes the link params from the address bar and opens as usual. Without `game` nor `return`, nothing is shown.

Return URL params (existing params of the return URL are kept; same-name params are replaced, so `v`, `status`, `legs1`, `legs2`, `sets1`, `sets2`, `winner`, `avg1`, `avg2`, `n180_1`, `n180_2`, `hco1`, `hco2` and `duration` are reserved):

| Param | Meaning |
|---|---|
| `v` | contract version, `1` |
| `status` | `completed` (result) or `cancelled` (match abandoned on the counter, no score) |
| `legs1`, `legs2` | `completed` only: legs won over the whole match by player/team 1 and 2 (link order) |
| `sets1`, `sets2` | `completed` only, sets format only: sets won |
| `winner` | `completed` only: `1` or `2` |
| `avg1`, `avg2` | `completed` with `stats=1`: 3-dart average over the match, 2 decimals (`45.67`) |
| `n180_1`, `n180_2` | `completed` with `stats=1`: number of 180s |
| `hco1`, `hco2` | `completed` with `stats=1`: highest checkout, `0` if none |
| `duration` | `completed` with `stats=1`: match duration in seconds |

Statistics are computed per player (singles) or team (doubles) with the existing `calculateDetailedStatsForTeam`.

## Allowed return URLs

- The allowed origins come from the public env `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` (comma-separated origins, empty by default = feature off).
- The deployed bundles are built by Cloudflare Pages from `wrangler.jsonc` (`env.production.vars`, `env.preview.vars`), which is the source of truth. The GitHub variable of the same name only feeds the CI validation build; `npm run preprod:check` / `production:check` warn when both values differ.
- The tooling rejects invalid entries (`scripts/lib/externalReturnOrigins.mjs`): `https` origins only (no path, query, credentials, duplicate or localhost), checked by `npm run wrangler:check`, the deployment checks and the Cloudflare Pages build. At runtime, invalid entries are ignored.
- A return URL is used only if it is absolute, without credentials, its origin exactly matches an allowed origin, and it is `https`. `http` is accepted for `localhost` / `127.0.0.1`, and for a private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) only when `VITE_APP_ENV` is explicitly `local` (testing on a phone on the local network). The runtime rules are grouped in an `ExternalReturnPolicy` built once in `App.tsx`.

## Architectural decisions

- Pure parsing, validation, context and URL building live in `src/features/external-match/externalMatchLink.ts` (no DOM, no React), with the search string, the return policy and the current time injected.
- The startup arbitration between a link and the restored session is the pure `src/features/external-match/externalMatchStartup.ts`.
- The address bar cleanup is a small browser adapter: `src/features/external-match/externalMatchAddressBar.ts`.
- `App.tsx` reads the link once at startup:
  - without conflict, the link takes precedence over the restored session: X01 is selected, the existing `arenaPrefillPlayers` / `arenaPrefillConfig` setup prefill is filled and the setup screen is shown;
  - if the restored session has a match in progress (any game screen) or the end screen of a linked match whose result can still be sent, the players are asked first (`ExternalMatchConflictDialog`): keep the current match (the link is dropped) or open the new one;
  - once decided, the link params are removed from the address bar so a reload restores the persisted session.
- The external context (`PersistedAppSession.externalMatch`) keeps the return URL, the imposed players and format, and its creation date. It is re-validated when read back and dropped when malformed or older than 12 hours (`EXTERNAL_MATCH_CONTEXT_TTL_MS`), so a forgotten link and the partner token of its return URL do not linger on a shared device.
- `views/SetupView.tsx` gets an optional `externalMatchHost` prop: a banner names the external app, the score, format and rules sections are wrapped in a disabled `fieldset`, and `SetupPlayersSection` locks names, player count, singles/doubles and the bot option. Only the starter of each doubles pair stays selectable.
- The result URL is only built for the linked match (`matchFollowsExternalLink`: same players in the same order and teams, no bot, same start score, rules and format), and re-validated against the policy when the end screen is displayed, so an edited local storage can neither redirect elsewhere nor send a result for another match.
- `views/StatsView.tsx` gets an optional `externalReturn` prop: it shows the send button, hides "REVANCHE" (its result would not belong to the linked match) and disables the 2-minute automatic exit while the result has not been sent.
- Leaving a linked match (setup "Retour", match exit, end screen "SORTIE") opens `ExternalMatchLeaveDialog`: notify the external app (send the result, or `status=cancelled`), leave without notifying, or stay. The match exit confirmation closes itself so "Annuler" returns to the match.
- Leaving for the external app clears the context, then navigates once the state is committed, after flushing the debounced session write (`flushAppSessionPersistence`), so the session left behind no longer carries the context.
- Legs per side are counted from the leg history (`completedLegs` + `currentLeg`), because `legsWon` is reset after each set in the sets format.

## Partner simulator

`docs/integration/partner-simulator/index.html` is a standalone page (no dependency, no network call) that builds links and displays the received result with basic checks (version, single-use token, winner consistency). Served locally (`python3 -m http.server 7020 --directory docs/integration/partner-simulator`), it acts as the partner app for phone testing with `VITE_APP_ENV=local`. It is documentation tooling and is not deployed with the counter.

## PWA and app launch (evaluation, 2026-11-19)

- Finding: `manifest.json` and `sw.js` live at the repository root, not in `public/`, so they are not in `dist/`. On preprod and production both URLs return the SPA `index.html` (`200 text/html`): the web manifest is invalid and the service worker registration fails (MIME type). The Chromium install prompt and the service worker cache are therefore inactive in deployed environments. This predates spec 030 and is tracked separately: shipping them activates the service worker in production for the first time (caching, live update reloads) and needs its own validation.
- Once the manifest is served: `scope: "/"` covers every link; `launch_handler: { "client_mode": "navigate-existing" }` would reuse an open app window on Chromium instead of opening a new one; Android can capture in-scope links into the installed app.
- iOS / iPadOS never open a link (QR code, other app) in the home-screen app: it opens in Safari, whose storage is separate from the home-screen app. A linked match and its context therefore live in the browser.
- Recommendation for tournaments: keep each board tablet on a browser tab (one QR code per board, see the partner guide), not on the installed app. No manifest change in this spec.

## Result integrity

The return URL is not signed: a player can edit `legs1` by hand before it reaches the external app. The counter cannot sign it without a secret, and a secret in a public bundle is not one.

Decision (2026-11-19): signing the result through a server function (for example a Cloudflare Pages Function holding a per-partner secret) is **rejected**. It would add a backend, outside the open source frontier of `CONTRIBUTING.md`. The counter stays backend-free for this feature.

The external app must therefore treat the result as an input to confirm, as documented in the partner guide: a single-use, short-lived token in the return URL, idempotent handling, consistency checks (legs to win reached by the winner) and a validation by the referee or the organizer.

## Invariants

1. Without params the startup, setup, match and end screens are unchanged.
2. No network call is added; the only exits are same-tab navigations started by the players.
3. A return URL is used only if it passes the policy above; preprod and production accept `https` only.
4. An empty allowlist disables the feature entirely.
5. The external context is dropped when leaving to the home or game selection screens, when another game is selected, once the result or the abandon is sent, and when it expires, so a result is never sent for another match.
6. Players and format of a linked match cannot be changed in the setup; if they differ anyway, no result can be sent.
7. A link never silently replaces a match in progress or an unsent linked result.
8. Gameplay, scoring and persistence contracts are unchanged.

## Changed layers and test strategy (spec 029)

| File | Layer | Strategy |
|---|---|---|
| `src/features/external-match/externalMatchLink.ts` | feature, pure | unit tests (`tests/unit/externalMatch/externalMatchLink.test.ts`) |
| `src/features/external-match/externalMatchStartup.ts` | feature, pure | unit tests (`tests/unit/externalMatch/externalMatchStartup.test.ts`) |
| `src/features/external-match/externalMatchAddressBar.ts` | browser adapter | unit tests with injected location/history fakes |
| `src/presentation/externalMatch/externalMatchLabels.fr.ts` | presentation labels and invalid link reasons | component tests (`tests/unit/components/externalMatchDialogs.test.tsx`) |
| `components/external-match/ExternalMatchDialogs.tsx` | view | component tests (`tests/unit/components/externalMatchDialogs.test.tsx`) |
| `components/game-setup/SetupExternalMatchBanner.tsx` | view | component tests (`tests/unit/components/externalMatchDialogs.test.tsx`) |
| `components/game-setup/SetupPlayersSection.tsx`, `PlayerNameField.tsx` | view | component tests (`tests/unit/components/setupPlayers.test.tsx`) |
| `views/StatsView.tsx` | view | component tests (`tests/unit/components/statsViews.test.tsx`) |
| `src/app/appShell.ts` (`flushAppSessionPersistence`) | app shell | unit tests (`tests/unit/app/persistAppSession.test.ts`) |
| `src/lib/env.ts` (`isExplicitLocalAppEnv`) | config | unit tests (`tests/unit/lib/env.test.ts`) |
| `src/shared/session/persistedAppSession.ts` | shared type | type only |
| `scripts/lib/externalReturnOrigins.mjs` and the env scripts | tooling | unit and process tests (`tests/unit/tooling/externalReturnOrigins.test.ts`) |
| `docs/integration/partner-simulator/index.html` | documentation tooling (not deployed, not in coverage) | manual check |
| `App.tsx`, `views/SetupView.tsx`, `views/MatchView.tsx` | shell composition (approved exclusions) | Playwright acceptance: `tests/e2e/external-match-link.smoke.spec.ts` |

No new coverage exclusion is requested.

## Acceptance checks

- A valid link opens the X01 setup pre-filled and locked, and the address bar no longer contains the link params; the lock survives a reload.
- A link without params opens the usual home screen; a rejected link (no allowed return URL, unknown version, invalid option) shows its reason, then the usual screen.
- A link opened over a match in progress or an unsent linked result asks first; keeping the current match drops the link.
- At the end of a linked match the stats screen shows "ENVOYER LE RESULTAT" with the destination host, and no "REVANCHE"; the result URL carries `v=1&status=completed`, plus the statistics with `stats=1`.
- Leaving a linked match asks first and can send `status=cancelled`.
- `npm run typecheck`, `npm run lint`, `npm run lint:type-aware`, `npm run test:unit:coverage`, `npm run governance:coverage`, `npm run wrangler:check` and `npm run build` pass.
