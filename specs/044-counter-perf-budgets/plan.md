# Plan — 044 Budgets de performance mesurés (INP, bundle)

> Plan d'implémentation proposé, sans décision retenue. Il ne s'exécute qu'après passage de la spec au statut `validee` et arbitrage des questions ouvertes.

## 1. Lecture de l'existant

- `vite.config.ts` (legacy et `manualChunks`), `App.tsx:2-3,104-117` (`HomeView` statique, autres vues en `lazy`).
- `views/MatchView.tsx:27-33` et `src/features/x01/voice/` (imports statiques de la voix et du SDK).
- `scripts/lib/pwaBuild.mjs`, `public/sw.js`, `src/infrastructure/web/serviceWorkerUpdates.ts` (précache et mises à jour déjà implémentés par 031).
- `index.tsx` (beacon Cloudflare conditionnel, exclu des tentatives de lien partenaire), `public/_headers` (CSP).
- `views/MatchView.tsx:508-521`, `src/app/appShell.ts` (pas de publication au seul tick, persistance différée).
- `specs/020-counter-inp-phase1-quick-wins/spec.md` (invariants à préserver et reliquat transféré à 044).
- Artefact CI, tailles et méthode reproductible : §4 de `spec.md`. Aucune mesure INP ni de latence n'a été effectuée dans ce cadrage.

## 2. Pistes proposées (aucune décision)

Le projet de spec propose un script Node (`node:zlib`) et un fichier de budgets, un laboratoire Playwright/Event Timing en CI et un relevé terrain Cloudflare sous réserve de disponibilité. Les choix de métrique, de budgets, de transfert PWA et de lot restent au PO (Q1-Q7 et DSO-Q1).

`size-limit`/`bundlesize` ajouteraient des dépendances ; `web-vitals` et une collecte supplémentaire exigeraient une justification et une décision explicite. Lighthouse CI est étudié séparément par la spec 123, elle-même `a-valider` ; il ne remplace pas une mesure d'interactions.

## 3. Étapes

1. Après arbitrage, écrire `scripts/check-bundle-budget.mjs`, `perf-budgets.json` et le script npm `perf:budget` ; calibrer les seuils et la compression sur une mesure explicite.
2. Tests unitaires du script (`tests/unit/tooling/checkBundleBudget.test.ts`) avec un `dist` factice, notamment imports statiques transitifs et déduplication.
3. Étape CI après `build` (coordonnée avec 043), uniquement dans une PR dédiée avec justification écrite et revue du mainteneur.
4. Étudier la suppression de la règle `views` de `manualChunks` et vérifier le graphe réel produit ; traiter séparément les transferts du précache 031 selon Q5.
5. Import dynamique de la voix dans `MatchView` (contrôle + hook derrière un composant chargé à la demande), sans modifier les gardes de consentement.
6. Selon Q6, test laboratoire `tests/perf/inp.perf.spec.ts` (projet Playwright `perf`, Chromium, CDP `Emulation.setCPUThrottlingRate`), exclu de `test:e2e`, exécuté en nightly/CI seulement.
7. Vérifier les données du projet dans Cloudflare, leur segmentation et leurs limites de couverture, puis consigner le relevé retenu ; traiter le reliquat de 020 déjà clôturée.
8. Réviser les budgets après les étapes 4-5 uniquement selon la décision du PO ; ne pas supposer que les anciennes cibles sont atteignables.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `scripts/check-bundle-budget.mjs`, `perf-budgets.json` | Création |
| `package.json` | Script `perf:budget` (aucune dépendance) |
| `vite.config.ts` | Suppression du regroupement `views` |
| `views/MatchView.tsx` | Import différé de la voix |
| `scripts/lib/pwaBuild.mjs`, `public/sw.js` | Éventuel ajustement du précache, uniquement selon Q5 |
| `tests/unit/tooling/checkBundleBudget.test.ts`, `tests/perf/inp.perf.spec.ts` | Création |
| `playwright.config.ts` | Projet `perf` exclu par défaut |
| `.github/workflows/quality-gate.yml`, `e2e.yml` | Étape budget ; laboratoire en nightly, dans une PR dédiée avec justification et revue du mainteneur |

## 5. Impacts UI / domaine / application / infrastructure

UI : pas de changement fonctionnel prévu, mais le délai, l'indicateur `Suspense` et les erreurs de chargement peuvent devenir visibles. Domaine/application : aucun changement prévu.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Pas de migration de données prévue. Le service worker 031 versionne déjà son cache par contenu, attend hors écran protégé avant activation et supprime ses anciens caches à l'activation (`scripts/lib/pwaBuild.mjs`, `public/sw.js`, `src/infrastructure/web/serviceWorkerUpdates.ts`). La disponibilité des anciens chunks sur Cloudflare Pages n'est pas établie : vérifier les anciennes pages/parties actives et les usages hors ligne avant tout changement. Le legacy n'est pas précaché.

## 7. Stratégie de test

Unitaires du script ; en CI uniquement, E2E réseau (page et installation du service worker distinguées), premier usage hors ligne, mise à jour en partie et laboratoire d'interactions ; vérification des invariants de 020 (tests existants `tests/unit/components/keypads.test.tsx`). Aucun E2E/smoke, navigateur ou serveur de test en local.

## 8. Non-régression

E2E complets (040) et matrice (042) verts ; usage hors ligne vérifié avec 031.

## 9. Rollback / désactivation

Prévoir le rétablissement du découpage et de la politique de précache ensemble, sans invalider une partie active ; retirer l'étape CI si nécessaire. Budgets relevables seulement par PR justifiée et acceptée.

## 10. Documentation à mettre à jour avec l'implémentation

Guide de test/CI (035 ou `docs/technical.md`) : budgets et relevé INP ; note de version : INP P75 relevé avec couverture et limites ; spec 044 : résultat du reliquat de 020 ; `AGENTS.md` (036) : règle de chargement différé si elle est validée.
