# Tasks - Spec 026

## Phase 1 - Base develop

- [x] synchroniser `develop` avec `origin/develop`
- [x] cherry-pick les commits valides de `release/1.0.2` manquants sur `develop`
- [x] supprimer le contrat `VITE_TOURNAMENT_API_URL`

## Phase 2 - Version et documentation

- [x] creer le milestone GitHub `M9: Open Source Release v1.1`
- [x] creer l issue GitHub `#103` de pilotage release `v1.1`
- [x] ajouter la spec locale `026-counter-release-v1-1-stabilization`
- [x] aligner `package.json` et `package-lock.json` sur `1.1.0`
- [x] mettre a jour README, architecture, scope, technical, specifications et contributing
- [x] creer `docs/release/v1.1.md`
- [x] creer `docs/release/v1.1-coverage-map.md`
- [x] actualiser `HomeView` et `ChangelogModal` sur `v1.1`

## Phase 3 - Validation et publication

- [x] executer `npm run ci:check` sur `develop`
- [ ] creer et pousser `release/1.1`
- [ ] executer `npm run ci:check` sur `release/1.1`
- [ ] executer `npm run test:e2e` sur `release/1.1`
- [ ] executer `npm run preprod:check` sur `release/1.1`
- [ ] executer `npm run production:check` sur `release/1.1`
- [ ] creer le tag `v1.1`
- [ ] ouvrir la PR `release/1.1 -> main`
- [ ] realigner `develop` apres stabilisation release