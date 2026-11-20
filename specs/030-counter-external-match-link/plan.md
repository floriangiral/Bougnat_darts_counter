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

## Révision V2 — plan proposé

> Plan proposé pour `V2-INT-01` ; il ne s'exécute qu'après validation de la Révision V2 de `spec.md`. Le contrat `v=1` n'est pas modifié.

### Étapes

1. **Traçabilité** : cocher la tâche d'origine des origines autorisées (fait par `f9ac4c2`), ajuster la mention de branche du statut (C15) sans toucher à l'en-tête YAML.
2. **Tests de contrat golden** (V2-FR-08) : fabriques de `MatchState` terminés (simple 3-1, double, sets 2-1, `stats=1`, abandon) et URL attendues figées, dans `tests/unit/externalMatch/externalMatchContract.golden.test.ts`.
3. **E2E voix + match lié** (V2-NFR-01) : nouveau scénario dans `tests/e2e/external-match-link.smoke.spec.ts`, avec un transport voix simulé. Aucun E2E voix n'existe aujourd'hui (aucune occurrence de « voice » ou « deepgram » dans `tests/e2e/`) : le faux (route Playwright sur la fonction de jeton et WebSocket simulé) est à créer, idéalement en commun avec V2-VOICE-01 (003) [faisabilité à confirmer].
4. **Libellés neutres** (V2-FR-06) : `src/presentation/externalMatch/externalMatchLabels.fr.ts` (l. 15, 21, 23 et suivantes) ; mise à jour de `tests/unit/components/externalMatchDialogs.test.tsx` et des textes recherchés par l'E2E.
5. **Guide partenaire** (V2-FR-02 à V2-FR-05) : `docs/integration/external-match-link.md` — sections « Compatibilité de `v=1` », « Durées et rejeu », « Jeton du partenaire : corrélation, pas certification », « Variante nouvel onglet + relais ».
6. **Notes de version et couverture** (V2-FR-07) : `docs/release/v2.0.0.md:9`, `docs/release/v2.0.0-coverage-map.md:31-32`, en coordination avec V2-REL-01 (033) et V2-DOC-01 (034).
7. **Analytics** (V2-NFR-02) : vérification manuelle en préprod (requête du beacon observée dans les outils réseau) ; décision Q4 consignée.
8. **Essai réel** (V2-AC-07) : uniquement si le product owner autorise le contact avec badarts.fr (Q2).

### Fichiers impactés

| Fichier | Nature |
|---|---|
| `specs/030-counter-external-match-link/tasks.md` | Traçabilité |
| `src/presentation/externalMatch/externalMatchLabels.fr.ts` | Libellés |
| `tests/unit/externalMatch/externalMatchContract.golden.test.ts` (nouveau) | Tests de contrat |
| `tests/unit/components/externalMatchDialogs.test.tsx`, `tests/unit/components/setupViewExternalMatch.test.tsx` | Tests de composants |
| `tests/e2e/external-match-link.smoke.spec.ts` | E2E voix + lien, libellés |
| `docs/integration/external-match-link.md`, `docs/release/v2.0.0.md`, `docs/release/v2.0.0-coverage-map.md` | Documentation |

### Migration, non-régression, rollback

- Aucune migration : ni le schéma `PersistedAppSession.externalMatch` ni les paramètres d'URL ne changent.
- Non-régression : les tests unitaires `tests/unit/externalMatch/*` et les 28 scénarios E2E existants restent verts ; les tests golden deviennent un garde obligatoire pour V2-ARCH-03 (057) et V2-ARCH-04 (058).
- Rollback : revert du commit de libellés (seul changement visible) ; la fonctionnalité reste désactivable sans code en vidant `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS`.
- Coût récurrent : 0 €.
