# Plan

1. Lister les variables par cible et leur criticite
2. Aligner scripts de check et lecture runtime
3. Supprimer les references legacy non utilisees
4. Documenter les exemples de configuration valides

## Révision V2 — plan proposé

> Proposition à valider (V2-REL-03).

1. Créer `scripts/lib/envContract.mjs` (registre V2-FR-01) à partir de `src/lib/env.ts`, `wrangler.jsonc`, des workflows et de `functions/api/deepgram/token.ts`.
2. Brancher `scripts/deployment-check.mjs`, `scripts/validate-pages-build-env.mjs`, `scripts/validate-wrangler-config.mjs` et le script `env:check` de `package.json` sur le registre (V2-FR-02, V2-FR-06).
3. Identifiant de build : selon Q1, dériver `VITE_APP_VERSION` de `CF_PAGES_COMMIT_SHA` dans `vite.config.ts` ou l'exiger dans `validate-pages-build-env.mjs` (V2-FR-03) — coordonné avec 031.
4. Aligner `.env.local.example` (V2-FR-05).
5. Tests : `tests/unit/tooling/envContract.test.ts`, `pagesBuildEnv.test.ts`, `wranglerConfig.test.ts` (exécution des scripts avec environnements simulés, comme `externalReturnOrigins.test.ts`).
6. Matrice par cible dans la documentation technique (emplacement selon V2-DOC-02), vérifiée par test (V2-AC-05).

**Migration** : aucune donnée ; ajouter éventuellement la variable manquante dans `wrangler.jsonc` avant d'activer la règle bloquante.
**Rollback** : revenir aux listes précédentes (commit unique) ; aucun effet sur l'application servie.
