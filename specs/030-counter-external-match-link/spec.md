---
id: 030-counter-external-match-link
v2_id: V2-INT-01
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Implémentée sur la branche v2.0.0, non publiée."
traitement_propose: "Finaliser pour publication (Révision V2)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
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

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Cette révision n'enlève et ne modifie aucun paramètre du contrat `v=1` décrit ci-dessus.

Identifiant V2 : `V2-INT-01` (P0, S, lot 0, poids 80). Sources : rapport d'audit 08 (intégrations), compte rendu V2 §C.10 et §H (questions 1, 2, 20 à 22).

### R1. Constats vérifiés (commit `508dfa6`)

| # | Constat | Référence |
|---|---|---|
| C1 | Le contrat `v=1` est **activé** pour `https://badarts.fr` en préprod et en production. | `wrangler.jsonc:17`, `wrangler.jsonc:29` (commit `f9ac4c2`) |
| C2 | badarts.fr consomme déjà `v=1` : lien construit avec `stats=1`, ouverture par `window.open(…, "_blank")`, retour sur `/bougnat-retour?bougnat_match=<id>` **sans jeton**, relais `BroadcastChannel`, validation humaine ; `sets1`/`sets2` ignorés. [vérifié sur le bundle public du partenaire le 2026-11-20, susceptible d'évoluer] | rapport 08 §2.7 |
| C3 | Le TTL de 12 h s'applique au **contexte restauré** depuis la session persistée, pas à l'URL entrante : `createExternalMatchContext` date le contexte à l'ouverture du lien (`createdAt = now`), donc un même lien rouvert des jours plus tard crée un contexte neuf. | `src/features/external-match/externalMatchLink.ts:302-307`, `App.tsx:99-101` |
| C4 | L'expiration n'est vérifiée qu'à la restauration (`restoreExternalMatchContext`) ; `buildExternalReturnUrl` ne la revérifie pas : dans un onglet jamais rechargé, un contexte de plus de 12 h reste utilisable. | `externalMatchLink.ts:341-350`, `externalMatchLink.ts:438-445`, `App.tsx:101`, `App.tsx:162` |
| C5 | Le guide partenaire affirme qu'« un lien en attente est oublié après 12 heures » et que l'URL de retour reste sur la tablette « au plus 12 heures » : formulations ambiguës au regard de C3 et C4. | `docs/integration/external-match-link.md`, sections « Sécurité » et « Dépannage » |
| C6 | Le résultat n'est pas signé (décision du 2026-11-19). Aucun secret (HMAC ou autre) ne peut être protégé dans un bundle client public ; le guide recommande à juste titre un jeton du partenaire, mais ce jeton **corrèle** le retour à un match, il ne **certifie** pas le score saisi par les joueurs. | spec 030 « Result integrity », guide, section « Sécurité : ce que vous devez vérifier » |
| C7 | La note de version annonce encore le lien « désactivé tant qu'aucune origine partenaire n'est déclarée ». | `docs/release/v2.0.0.md:9` |
| C8 | La carte de couverture indique que le lien n'a pas été essayé avec une application partenaire réelle et que la suite E2E complète n'a pas été exécutée. | `docs/release/v2.0.0-coverage-map.md:31-32` |
| C9 | Les tâches 030 « Configure the allowed origins… » et « Run the full Playwright suite » restent ouvertes alors que la première est faite (C1). | `specs/030-counter-external-match-link/tasks.md` |
| C10 | Aucun scénario E2E ne combine voix et match lié ; la commande voix vit dans `MatchView`, hors des `fieldset` verrouillés du setup, donc a priori disponible [à confirmer par test]. | `tests/e2e/external-match-link.smoke.spec.ts` (aucune occurrence de « voice »), `views/MatchView.tsx:108`, `views/SetupView.tsx:289`, `:328` |
| C11 | Libellés en dur et orientés tournoi : « Match de tournoi », « Quitter le match du tournoi ? », « Retour au tournoi ». Inadaptés à une ligue ou à un entraînement. | `src/presentation/externalMatch/externalMatchLabels.fr.ts:15`, `:21`, `:23` |
| C12 | `sets1`/`sets2` dépendent de `match.setsWon`, muté par `finishLeg` ; `legs1`/`legs2` sont recomptés depuis l'historique. Une refonte du moteur X01 (V2-ARCH-03, V2-ARCH-04) peut donc changer le résultat sans toucher au module de lien. | `externalMatchLink.ts:406-412`, `:456-459`, `src/application/scoring/matchLifecycle.ts:215-220` |
| C13 | La variable GitHub `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` alimente le build de validation CI ; son alignement avec `wrangler.jsonc` n'est contrôlé que par un avertissement. [valeur à confirmer] | `.github/workflows/promote-preprod.yml:44`, `promote-production.yml:44`, `scripts/deployment-check.mjs:84` |
| C14 | Cloudflare Web Analytics est autorisé par la CSP ; la capture éventuelle de la chaîne de requête (prénoms, URL de retour) **avant** le nettoyage de la barre d'adresse n'est pas établie. [à confirmer] | `index.tsx:19-39` (balise injectée avant le rendu), `App.tsx:124-127`, `public/_headers:2` |
| C15 | Le statut « implemented on `release/v2.0.0` » cite une branche qui existe, mais le code audité est `feat/v2.0.0` @ `508dfa6`. | spec 030 l. 18 |

### R2. Écarts avec la spec 030

- Invariant 5 (« expire ») : vrai à la restauration, pas pendant une session ouverte (C4).
- Tâches et notes de version non alignées avec l'activation réelle (C1, C7, C9).
- « Acceptance checks » : aucun critère ne couvre la voix en match lié (C10) ni l'essai avec le partenaire réel (C8).

### R3. Exigences proposées

- **V2-FR-01** — Le contrat `v=1` est déclaré **figé** : aucun paramètre existant ne change de nom, de valeurs admises, de défaut ni de sens. Seuls des paramètres **optionnels et additifs** peuvent être ajoutés, ignorés sans erreur par un compteur plus ancien ; tout changement incompatible impose `v=2` (cf. `CONTRIBUTING.md`, V2-INT-05 / 108).
- **V2-FR-02** — La politique de compatibilité est écrite dans le guide partenaire (paramètres additifs, liste des paramètres réservés, durée de support de `v=1` après l'arrivée d'une `v=2`).
- **V2-FR-03** — Le guide distingue explicitement : (a) le TTL de 12 h du contexte local restauré ; (b) l'URL entrante, qui n'expire pas côté compteur ; (c) la protection anti-rejeu, qui relève du **jeton à usage unique et à durée courte émis par le partenaire**.
- **V2-FR-04** — Le guide décrit le jeton du partenaire comme un moyen de **corrélation** et d'anti-rejeu, et rappelle qu'il ne certifie pas le score ; la validation humaine reste obligatoire. Il rappelle qu'aucun secret ne peut être protégé côté compteur.
- **V2-FR-05** — Le guide ajoute la variante observée « nouvel onglet + relais vers l'onglet de gestion » (limites : même appareil et même navigateur) à côté de la variante « même onglet ».
- **V2-FR-06** — Les libellés du match lié deviennent neutres (par exemple « Match organisé par {host} », « Quitter le match lié ? », « Retour vers {host} ») ; le domaine reste toujours affiché. Aucun libellé fourni par le partenaire en `v=1`.
- **V2-FR-07** — Tâches, note de version 2.0.0 et carte de couverture sont alignées avec l'activation de badarts.fr (C1, C7, C8, C9).
- **V2-FR-08** — Des tests de contrat « golden » figent les URL de résultat (`completed` simple, double, sets, `stats=1`, `cancelled`) produites à partir de `MatchState` de référence, pour qu'une refonte du moteur X01 ne change pas silencieusement le résultat (C12).
- **V2-NFR-01** — Non-régression : un scénario E2E « voix active pendant un match lié » (avec un faux transport voix) vérifie que la voix fonctionne, que le setup reste verrouillé et que l'URL de résultat est inchangée.
- **V2-NFR-02** — Confidentialité : vérifier [à confirmer] si Web Analytics capture la chaîne de requête du lien ; si oui, décider d'une mitigation (question Q4).
- **V2-NFR-03** — Aucune nouvelle dépendance, aucun appel réseau, aucun secret ; coût récurrent : 0 €.

### R4. Critères d'acceptation

- **V2-AC-01** — Un lien `v=1` valide existant (exemple de la spec) produit, après un match 3-1 simple, exactement la même URL de résultat qu'à `508dfa6` (test golden).
- **V2-AC-02** — Un paramètre inconnu ajouté au lien est ignoré et ne rend pas le lien invalide (test unitaire existant à référencer ou ajouter).
- **V2-AC-03** — E2E Chromium : lien valide → setup verrouillé → match lancé → voix activée (transport simulé) → une volée vocale validée → fin de match → URL de résultat conforme.
- **V2-AC-04** — Le guide contient une section « Durées et rejeu » conforme à V2-FR-03 et V2-FR-04 ; les phrases « au plus 12 heures », « un lien en attente est oublié après 12 heures » et « le lien a expiré (12 heures) » sont corrigées.
- **V2-AC-05** — Aucun libellé de l'interface du match lié ne contient « tournoi » ; les tests de composants vérifient la présence du domaine.
- **V2-AC-06** — `tasks.md` 030, `docs/release/v2.0.0.md` et la carte de couverture ne contredisent plus `wrangler.jsonc`.
- **V2-AC-07** — Un essai de bout en bout avec badarts.fr est consigné (date, appareil, résultat) **ou** la limite reste explicitement documentée si le product owner n'autorise pas le contact (Q2).

### R5. Questions ouvertes

| # | Question | Options | Recommandation |
|---|---|---|---|
| Q1 | Statut de `v=1` pour 2.0.0 (H.20) | (a) figé avec ajouts optionnels ; (b) figé strict | (a), documenté (V2-FR-01, V2-FR-02) |
| Q2 | Essai réel avec badarts.fr avant publication (H.21) | (a) contacter le partenaire, **après autorisation du product owner** ; (b) publier avec la limite documentée | (a) si autorisé, sinon (b) ; aucun contact sans autorisation |
| Q3 | Revérifier l'expiration au moment de l'envoi (C4) ? | (a) non, documenter ; (b) oui, `buildExternalReturnUrl` reçoit `now` et refuse un contexte expiré | (a) pour 2.0.0 (le jeton du partenaire est la vraie protection), (b) à réévaluer avec V2-INT-08 |
| Q4 | Analytics et chaîne de requête (C14) | (a) vérifier puis documenter ; (b) charger la balise après nettoyage ; (c) désactiver la balise si lien présent | (a) d'abord ; (b) si la capture est avérée |
| Q5 | Impact de V2-GAMES-02 (046) sur `in=` | (a) Double/Master-In implémenté : `in=` inchangé ; (b) retiré : `in=double`/`master` reste **accepté** en `v=1` | Ne jamais rejeter un `in=` aujourd'hui valide en `v=1` ; décision portée par 046 |
| Q6 | Libellés génériques avant ou après 2.0.0 | avant / après | Avant (S, sans impact contrat) |
| Q7 | Publication avant ou après la spec 031 (V2-REL-02) | — | Indépendant ; garder la recommandation « onglet de navigateur » du guide |

### R6. Dépendances

- Aucune dépendance bloquante. Liens : V2-REL-01 (033, publication 2.0.0), V2-DOC-01 (034, corrections documentaires), V2-REL-02 (031, PWA), V2-GAMES-02 (046, `in=`), V2-ARCH-03 (057) et V2-ARCH-04 (058) qui doivent passer les tests golden V2-FR-08, V2-VOICE-01 (003, voix).
- Suites : V2-INT-02 (106), V2-INT-04 (107), V2-INT-08 (110). Décision d'architecture associée : [ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée).
