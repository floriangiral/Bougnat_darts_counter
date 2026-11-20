# Plan — 044 Budgets de performance mesurés (INP, bundle)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `vite.config.ts:29-33` (legacy), `:77-94` (`manualChunks`, regroupement `views`).
- `App.tsx:54-65` (vues en `lazy`).
- `views/MatchView.tsx:20-21` (imports statiques de la voix).
- `index.tsx:30-39` (beacon Cloudflare Web Analytics), `public/_headers:2` (CSP).
- `src/features/x01/hooks/useMatchTimer.ts:27-32`, `src/app/appShell.ts:127-160` (persistance différée).
- `specs/020-counter-inp-phase1-quick-wins/spec.md` (invariants à préserver).

## 2. Approche retenue (et alternatives écartées)

Retenue : script Node sans dépendance (`node:zlib`) + fichier de budgets ; laboratoire Playwright + Event Timing ; terrain Cloudflare.
Écartées : `size-limit`/`bundlesize` (dépendances supplémentaires pour un besoin simple) ; Lighthouse CI (lourd, peu pertinent pour l'INP qui exige des interactions) ; bibliothèque `web-vitals` + collecte (nécessite un point de collecte, contraire à « pas de backend »).

## 3. Étapes

1. Écrire `scripts/check-bundle-budget.mjs` et `perf-budgets.json` (budgets de non-régression) ; script npm `perf:budget`.
2. Tests unitaires du script (`tests/unit/tooling/checkBundleBudget.test.ts`) avec un `dist` factice en mémoire.
3. Étape CI après `build` (coordonnée avec 043).
4. Supprimer la règle `views` de `manualChunks` ; vérifier le précache avec 031.
5. Import dynamique de la voix dans `MatchView` (contrôle + hook derrière un composant chargé à la demande).
6. Test laboratoire `tests/perf/inp.perf.spec.ts` (projet Playwright `perf`, Chromium, CDP `Emulation.setCPUThrottlingRate`), exclu de `test:e2e`, exécuté en nightly.
7. Relevé terrain Cloudflare et consignation ; décision de clôture de 020.
8. Abaisser les budgets vers la cible après les étapes 4-5.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `scripts/check-bundle-budget.mjs`, `perf-budgets.json` | Création |
| `package.json` | Script `perf:budget` (aucune dépendance) |
| `vite.config.ts` | Suppression du regroupement `views` |
| `views/MatchView.tsx` | Import différé de la voix |
| `tests/unit/tooling/checkBundleBudget.test.ts`, `tests/perf/inp.perf.spec.ts` | Création |
| `playwright.config.ts` | Projet `perf` exclu par défaut |
| `.github/workflows/quality-gate.yml`, `e2e.yml` | Étape budget ; laboratoire en nightly |

## 5. Impacts UI / domaine / application / infrastructure

UI : chargement différé (pas de changement visible hors indicateur de chargement `Suspense` existant). Domaine/application : aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet. Après déploiement, les anciens chunks restent servis par Cloudflare Pages le temps de la transition [à confirmer] ; le service worker (031) doit invalider l'ancien précache.

## 7. Stratégie de test

Unitaires du script ; E2E réseau (AC-02, AC-03) ; laboratoire INP ; vérification des invariants de 020 (tests existants `tests/unit/components/keypads.test.tsx`).

## 8. Non-régression

E2E complets (040) et matrice (042) verts ; usage hors ligne vérifié avec 031.

## 9. Rollback / désactivation

Rétablir `manualChunks` ; retirer l'étape CI ; budgets relevables par PR justifiée.

## 10. Documentation à mettre à jour avec l'implémentation

Guide de test/CI (035 ou `docs/technical.md`) : budgets et relevé INP ; note de version : INP P75 relevé ; spec 020 : clôture ; `AGENTS.md` (036) : règle de chargement différé.
