# Plan — 033 Clôture et publication de la release 2.0.0

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `docs/release/v2.0.0.md:3-10,68-108` (statut, points connus, vérification) et `docs/release/v2.0.0-coverage-map.md`.
- `.github/workflows/promote-preprod.yml`, `promote-production.yml` (déclenchement manuel, confirmations, synchronisation de branche), `e2e.yml:6-8` (sur PR uniquement), `quality-gate.yml`.
- `playwright.config.ts:7-8,18-49` (retries CI = 1, 7 projets).
- `components/ui/ChangelogModal.tsx:24-65` (entrée v2.0.0 datée du 19/11/2026).
- Reliquats : `specs/007-…/tasks.md:5-6`, `specs/025-…/tasks.md:24-28`, `specs/030-…/tasks.md:21-23`.

## 2. Approche retenue (et alternatives écartées)
- **Retenue** : une checklist versionnée « Gate 2.0.0 » + exécution séquentielle sur un commit candidat unique de `release/v2.0.0`, 031 décalé en 2.0.1 (si Q2 validée).
- Écartée : publier immédiatement (contrat public sur base non vérifiée).
- Écartée : attendre la vision V2 complète (bloque badarts.fr plusieurs lots).

## 3. Étapes
1. Vérifier les dépendances closes : 034, 030, 043 (C1/C2/C9), 045, 046 (décision appliquée).
2. Rédiger `docs/release/checklist.md` (FR-01) et le runbook post-release (FR-07).
3. Geler `release/v2.0.0` ; fusionner la PR `feat/v2.0.0 → release/v2.0.0`.
4. Exécuter qualité locale + CI : `npm run ci:check`, `lint:type-aware`, `test:unit:coverage`, `governance:coverage`, puis `test:e2e` complet (CI ou image `docker/playwright.Dockerfile`).
5. Confirmer SonarCloud et Snyk sur la PR de release.
6. Promouvoir en preprod ; validations manuelles 025 et parcours partenaire (simulateur).
7. Mettre à jour notes, coverage map, date du changelog in-app, README (`main`).
8. Fusionner vers `main`, promouvoir en production, taguer `v2.0.0`, publier la GitHub Release.
9. Post-release J+1/J+7 selon le runbook ; mettre à jour les statuts de specs.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `docs/release/checklist.md` (nouveau, emplacement selon 035) | Checklist réutilisable + runbook |
| `docs/release/v2.0.0.md`, `v2.0.0-coverage-map.md` | Statut publié, preuves |
| `docs/release/v1.1*.md` | Bandeau « version active » exact |
| `components/ui/ChangelogModal.tsx` | Date de publication |
| `tests/unit/components/changelogModal.test.tsx` | Inchangé sauf si la date est testée |
| `README.md` (`main`) | Description 2.0.0 à la promotion |
| `specs/007`, `025`, `026`, `030` (`spec.md`/`tasks.md`) | Statuts et transferts |

## 5. Impacts UI / domaine / application / infrastructure
UI : date du changelog seulement. Aucun autre impact.

## 6. Stratégie de migration
Aucune migration de données. Contrat `v=1` publié tel que décrit par la spec 030.

## 7. Stratégie de test
E2E complet (7 projets), couverture et gouvernance (spec 029), validations manuelles 025, terrain Android + iPhone.

## 8. Non-régression
Parcours de base inchangé ; sessions 1.1.x restaurées ; aucun écran de lien externe sans paramètres.

## 9. Rollback / désactivation
- Désactivation rapide du lien partenaire : vider `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` dans `wrangler.jsonc` (env production) et redéployer.
- Retour de version : re-promouvoir le commit 1.1.x précédent sur `production` ou retour arrière de déploiement Cloudflare Pages [à confirmer : procédure].
- Vérifier avant publication qu'une session 2.0.0 est relue sans erreur par 1.1.x (test manuel).

## 10. Documentation à mettre à jour avec l'implémentation
Notes 2.0.0, coverage map, checklist, runbook, README, changelog in-app, `specs/README.md` (statuts).
