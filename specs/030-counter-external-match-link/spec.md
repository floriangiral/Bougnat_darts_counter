# Spec 030 - Counter external match link

## Status

Proposed

## Objective

Let an external app (for example a club tournament manager) open the counter with an X01 match already configured, and get the result back at the end of the match, without any network integration: the link is a plain URL in, the result is a plain top-level navigation out.

Without link params, or with an invalid / non-allowed link, the counter behaves exactly as today.

## Scope

- X01 only (singles and doubles).
- Incoming link: query params pre-fill the existing X01 setup screen (players, start score, legs or sets, in/out rules). Players review it and press "Lancer la partie" as usual.
- Outgoing result: on the end-of-match screen, a "ENVOYER LE RESULTAT" button navigates to the return URL with the legs (and sets) won by each side and the winner.
- Out of scope: tournament logic, accounts, any `fetch` / `postMessage` / backend call, other games.

## Link contract

Incoming params (unknown params are ignored, `?mode=` keeps working):

| Param | Values | Default |
|---|---|---|
| `game` | `x01` (required) | - |
| `p1`, `p2` | singles player names | - |
| `t1p1`, `t1p2`, `t2p1`, `t2p2` | doubles player names (take precedence over singles) | - |
| `start` | integer 2-9999 (301, 501, 701 or custom) | `501` |
| `in` / `out` | `open`, `double`, `master` | `open` / `double` |
| `legs` | legs to win, integer 1-15 | `3` |
| `sets` | sets to win, integer 1-15 (switches to the sets format) | legs format |
| `return` | absolute return URL (required, must be allowed) | - |

Example: `https://play.bougnatdarts.fr/?game=x01&start=501&out=double&legs=3&p1=Alice&p2=Bob&return=https%3A%2F%2Fexample.org%2Fmatch%2F12`

Result: the return URL is opened with these params added (existing params are kept):

| Param | Meaning |
|---|---|
| `legs1`, `legs2` | legs won over the whole match by player/team 1 and 2 (link order) |
| `sets1`, `sets2` | sets won, only in the sets format |
| `winner` | `1` or `2` |

Names are trimmed, control characters are removed and names are cut to 32 characters. Any malformed value makes the whole link invalid (no silent guess for a competition match).

## Architectural decisions

- Pure parsing, validation and result URL building live in `src/features/external-match/externalMatchLink.ts` (no DOM, no React), with the search string and the allowed origins injected, like `getAppAccessMode`.
- The address bar cleanup is a small browser adapter: `src/features/external-match/externalMatchAddressBar.ts`.
- The allowed return origins come from the public env `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` (comma-separated, empty by default = feature off), declared in `src/lib/env.ts`, `.env.local.example`, `wrangler.jsonc` and `docs/technical.md` (spec 009 env contract).
- `App.tsx` reads the link once at startup. A valid link takes precedence over the restored session (the players explicitly opened a new match): X01 is selected, the existing `arenaPrefillPlayers` / `arenaPrefillConfig` setup prefill is filled and the setup screen is shown. The link params are then removed from the address bar so a reload restores the persisted session.
- Only the return URL is kept in the session (`PersistedAppSession.externalMatch`, optional, so existing sessions stay valid) to survive a reload during the match.
- The result URL is rebuilt and re-validated against the allowlist when the end screen is displayed, so an edited local storage cannot turn the counter into an open redirect.
- `views/StatsView.tsx` gets an optional `externalReturn` prop: it shows the send button, hides "REVANCHE" (its result would not belong to the linked match) and disables the 2-minute automatic exit while the result has not been sent.
- Legs per side are counted from the leg history (`completedLegs` + `currentLeg`), because `legsWon` is reset after each set in the sets format.

## Invariants

1. Without params the startup, setup, match and end screens are unchanged.
2. No network call is added; the only exit is a same-tab navigation started by the user.
3. The return URL is used only if it is absolute, `https` (`http` only for `localhost` / `127.0.0.1`), without credentials, and its origin exactly matches an allowed origin.
4. An empty allowlist disables the feature entirely.
5. The external context is dropped when leaving to the home or game selection screens, when another game is selected, or once the result is sent, so a result is never sent for another match.
6. If the players change the composition in setup (one player, a bot), no result can be sent.
7. Gameplay, scoring and persistence contracts are unchanged.

## Changed layers and test strategy (spec 029)

| File | Layer | Strategy |
|---|---|---|
| `src/features/external-match/externalMatchLink.ts` | feature, pure | unit tests, 100 % lines (`tests/unit/externalMatch/externalMatchLink.test.ts`) |
| `src/features/external-match/externalMatchAddressBar.ts` | browser adapter | unit tests with injected location/history fakes |
| `views/StatsView.tsx` | view | component tests (`tests/unit/components/statsViews.test.tsx`): send button, no rematch, no auto exit |
| `src/presentation/stats/statsLabels.fr.ts` | presentation labels | covered by the component tests |
| `src/shared/session/persistedAppSession.ts` | shared type | type only |
| `src/lib/env.ts` | config | default value covered by the existing env usage |
| `App.tsx` | shell composition (already an approved exclusion) | Playwright acceptance: `tests/e2e/external-match-link.smoke.spec.ts` |

No new coverage exclusion is requested.

## Acceptance checks

- A valid link opens the X01 setup pre-filled with the players and format, and the address bar no longer contains the link params.
- A link without allowed return URL, or without params, opens the usual home screen.
- At the end of a linked match the stats screen shows "ENVOYER LE RESULTAT" with the destination host, and no "REVANCHE".
- `npm run typecheck`, `npm run lint`, `npm run lint:type-aware`, `npm run test:unit:coverage`, `npm run governance:coverage` and `npm run build` pass.
