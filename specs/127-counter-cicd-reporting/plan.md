# Plan — 127 Rapport hebdomadaire DevSecOps

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `.github/workflows/dependency-watch.yml:33-55`, `quality-gate.yml:100-116`, résumés de `security-review.yml`.

## 2. Approche retenue (et alternatives écartées)

Retenue : script Node sans dépendance, issue épinglée, artefact JSON.
Écartées : tableau de bord externe (coût, compte) ; commits de rapport dans le dépôt (bruit d'historique) ; GitHub Pages (déploiement supplémentaire).

## 3. Étapes

1. Définir le schéma `weekly-report.json` (commun avec 126).
2. Écrire `scripts/ci/weekly-report.mjs` et ses tests (sources disponibles d'abord : PR Renovate, code scanning, couverture, E2E, durées).
3. Job hebdomadaire, issue épinglée (création manuelle initiale puis mise à jour).
4. Ajouter les sources au fil des livraisons (119, 120, 121, 122, 123, 115 FR-11).
5. Calibrer les seuils après 4 semaines.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `scripts/ci/weekly-report.mjs` (nouveau) + tests | Collecte et rendu |
| `scripts/ci/weekly-report.thresholds.json` (nouveau) | Seuils |
| `.github/workflows/weekly-maintenance.yml` (113) | Job |
| Documentation CI (128) | Lecture du rapport |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Tests unitaires avec réponses simulées ; exécution manuelle ; observation de 4 lundis.

## 8. Non-régression

Retrait de `dependency-watch.yml` seulement quand le rapport couvre les dépendances obsolètes.

## 9. Rollback / désactivation

Désactiver le job ; l'issue reste comme archive.

## 10. Documentation à mettre à jour avec l'implémentation

Documentation CI (128), `AGENTS.md` (lecture du JSON par les agents).
