# Plan

1. Recenser les causes de flakiness runtime e2e
2. Verrouiller les preconditions d execution e2e
3. Ajuster les parametres Playwright local/CI
4. Documenter les procedures de diagnostic rapide

## Révision V2 — plan proposé

> Plan proposé (V2-QA-08), à exécuter uniquement après validation de la révision V2 de la spec.

1. **Lecture de l'existant** : `scripts/run-playwright.sh:1-95`, `playwright.config.ts:1-54`, `scripts/ensure-local-env.mjs`, `.env.local.example:27`, `.github/actions/run-local-smoke/action.yml`, `compose.yml:18-32`, `docker/playwright.Dockerfile`, `docs/technical.md:159-170, 275-282`.
2. **Approche retenue** : option native `webServer` de Playwright (`command` = build E2E + `vite preview --strictPort --outDir dist-e2e`, `reuseExistingServer: !process.env.CI`) ; environnement E2E versionné ; vérification préalable des navigateurs dans un `globalSetup`. Écartées : conserver le démarrage manuel dans le script shell (source du double serveur) ; serveur de dev pour les E2E (différent du build livré).
3. **Étapes** : (a) créer `.env.e2e` (valeurs publiques de test) et un script `build:e2e` ; (b) ajouter `webServer` et `globalSetup` à `playwright.config.ts` ; (c) réduire `run-playwright.sh` à l'amorçage des bibliothèques et au journal dans `test-results/` ; (d) aligner `run-local-smoke` (avec 043 : plus de `vite preview` en arrière-plan) ; (e) aligner le profil Docker `e2e` (build + suite complète) ; (f) réécrire la procédure locale ; (g) 5 exécutions consécutives.
4. **Fichiers impactés** : `playwright.config.ts`, `scripts/run-playwright.sh`, `package.json` (scripts `build:e2e`, éventuellement `test:e2e:docker`), `.env.e2e` (nouveau), `.gitignore` (`dist-e2e/`), `.github/actions/run-local-smoke/action.yml`, `compose.yml`, `docker/playwright.Dockerfile`, `docs/technical.md`.
5. **Migration** : aucune donnée ; les contributeurs suppriment éventuellement leur contournement local (`.env.local` modifié).
6. **Tests** : V2-AC-01 à V2-AC-06 ; exécution CI complète sur une PR de démonstration.
7. **Non-régression** : mêmes scénarios, mêmes projets ; `promote-production.yml` continue d'exécuter le smoke.
8. **Rollback** : revert des fichiers ci-dessus ; l'ancien script reste dans l'historique Git.
9. **Documentation** : procédure locale, prérequis, diagnostic ; note de validation CI dans la spec 029.
