# Plan — 041 Accessibilité automatisée et régression visuelle

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `playwright.config.ts:1-54` (projets, `use`, captures en échec seulement).
- `docker/playwright.Dockerfile:1-7`, `compose.yml:18-32` (service `playwright`, profil `e2e`, serveur de dev).
- `tests/e2e/helpers.ts:67-74` (`seedAppSession`) pour atteindre les écrans de jeu.
- Défauts connus à lister en dette : `components/ui/Button.tsx:15` (focus), `components/game/PlayerScore.tsx:125` (contraste), classes `animate-in` (`views/MatchView.tsx` ×3).

## 2. Approche retenue (et alternatives écartées)

Retenue : `toHaveScreenshot` natif + `@axe-core/playwright`, exécutés dans l'image Playwright épinglée, contre un **build de production servi par `vite preview`** (pas le serveur de dev, pour un rendu identique à la production).
Écartées : Chromatic/Percy/Argos (payants ou compte tiers) ; captures générées sur la machine du contributeur (rendu non déterministe) ; Lighthouse CI (lourd, redondant avec axe pour l'a11y).

## 3. Étapes

1. Ajouter la devDependency `@axe-core/playwright` (après décision Q1).
2. Créer `tests/visual/screens.ts` : liste déclarative des écrans (nom, URL ou session injectée, actions, masques).
3. Créer `tests/visual/screens.visual.spec.ts` et `tests/a11y/screens.a11y.spec.ts` qui parcourent cette liste.
4. Ajouter à `playwright.config.ts` les projets `visual-*` et `a11y` (via `testMatch`), et les exclure des projets existants (`testIgnore`).
5. Ajouter un service Compose `playwright-visual` (profil `visual`) : build de production + `vite preview` + Playwright dans l'image épinglée.
6. Ajouter les scripts npm `test:visual`, `test:visual:update`, `test:a11y`.
7. Générer les captures de référence dans le conteneur ; constituer `tests/a11y/known-violations.json`.
8. Ajouter un job CI `visual-a11y` (`container: mcr.microsoft.com/playwright:v1.65.1-noble`) sur les PR vers `develop`, `main`, `release/**` ; informatif puis bloquant (Q3).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `package.json`, `package-lock.json` | devDependency `@axe-core/playwright`, 3 scripts |
| `playwright.config.ts` | Projets `visual-*`, `a11y` ; `testIgnore` sur les projets existants |
| `compose.yml`, `docker/playwright.Dockerfile` | Service/profil `visual` ; commande paramétrable |
| `tests/visual/**`, `tests/a11y/**` | Création |
| `.github/workflows/quality-gate.yml` ou nouveau `visual.yml` | Job conteneurisé |
| `specs/029-…/spec.md` | Note de validation CI (exigée par 029 pour tout changement de workflow) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun impact sur le code applicatif.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet. Mise à jour de l'image Playwright = régénération groupée des captures dans une PR dédiée.

## 7. Stratégie de test

Validation de la détection sur branche jetable (AC-02, AC-03) ; 5 exécutions sans diff (AC-05).

## 8. Non-régression

`npm run test:e2e` n'exécute pas les nouveaux projets ; durée et résultats inchangés.

## 9. Rollback / désactivation

Désactiver le job CI (`if: false`) ; retirer la devDependency et les dossiers `tests/visual`, `tests/a11y`.

## 10. Documentation à mettre à jour avec l'implémentation

Guide de test (spec 035 / `docs/technical.md`) : commandes Docker, mise à jour des captures, gestion de la dette a11y ; `AGENTS.md` (036) : interdiction de régénérer des captures hors conteneur.
