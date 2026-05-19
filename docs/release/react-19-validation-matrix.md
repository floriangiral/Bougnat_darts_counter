# React 19 validation matrix

## Scope

- Runtime target: React 19.2.0 / React DOM 19.2.0
- Validation target: local, Playwright, preview connected hosting, legacy browser spot-checks
- Repository: `Bougnat_darts_counter`

## Automated checks

| Check | Command | Status | Notes |
| --- | --- | --- | --- |
| TypeScript | `npm run typecheck` | done | passes under React 19 |
| Lint | `npm run lint` | done | no new lint issue |
| Unit tests | `npm run test:unit` | done | 28 files, 128 tests passed |
| Production build | `npm run build` | done | Vite production build passes |
| CI baseline | `npm run ci:check` | done | env, guard, lint, typecheck, unit, build all pass |
| E2E smoke | `npm run test:e2e` | done | Playwright green after Triathlon smoke update |

## Manual validation matrix

| Area | Scenario | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| X01 | lancer une partie, jouer quelques tours, finish, rematch | product/qa | pending | verifier scoreboard, keypad, fin de match |
| Cricket | lancer une partie, fermer des segments, quitter | product/qa | pending | verifier grille et keypad |
| Capital | lancer une partie et verifier l objectif courant | product/qa | pending | verifier les labels centre/bull |
| Gotcha | lancer une partie et verifier le layout tablette | product/qa | pending | verifier clavier, scroll et overlay |
| Killer | lancer une partie et verifier l entree en match | product/qa | pending | verifier elimination et retour |
| Triathlon | lancer une partie, overlay starter, enchainement des phases | product/qa | pending | verifier que l ancien tir a la bulle n existe plus |
| Voice scoring | start/stop micro, navigation pendant ecoute, timeout | product/qa | pending | cible Deepgram + cleanup hooks |
| Session restore | recharger pendant une partie et restaurer l etat | product/qa | pending | verifier persistance locale |
| PWA/update | install, refresh, update lifecycle | product/qa | pending | verifier service worker et blocage live update |
| Analytics | verifier events/pages/flags sur preview | product/qa | pending | cible preview avec observability active |
| Legacy Safari/iOS | smoke test sur Safari/iOS ancien ou BrowserStack | product/qa | pending | verifier compat legacy |
| Tablet landscape | smoke visuel sur tablette paysage | product/qa | pending | verifier layouts critiques |

## Rollout decision gates

- preview connectee validee sans regression visible
- aucun bug bloquant sur scoring vocal, session restore ou PWA
- smoke acceptable sur Safari/iOS legacy ou equivalent
- validation produit sur les 6 modes de jeu

## Notes

- Le seul ecart automatise detecte pendant la migration a ete un test Playwright Triathlon obsolet e qui attendait encore l ancien ecran `Tir a la bulle`.
- Le flux reel utilise deja `StartingPlayerOverlay`; le test a ete aligne sur le comportement metier courant.
