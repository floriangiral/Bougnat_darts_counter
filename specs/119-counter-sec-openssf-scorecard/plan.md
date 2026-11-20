# Plan — 119 OpenSSF Scorecard

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Aucun workflow Scorecard ; réglages Actions et rulesets lus le 2026-11-20 (115 §4).
- `.github/actions/setup-ci-app/action.yml:31`, `docker/app.Dockerfile:1, 16`, `docker/playwright.Dockerfile:1`.

## 2. Approche retenue (et alternatives écartées)

Retenue : action officielle `ossf/scorecard-action` dans un workflow dédié, `GITHUB_TOKEN` seul.
Écartées : exécution CLI locale ponctuelle (pas de suivi) ; jeton personnel (115 RM, Q1).

## 3. Étapes

1. Ajouter `ossf/scorecard-action` à la liste d'actions autorisées (115).
2. Créer `scorecard.yml` (FR-01 à FR-03), épinglé par SHA.
3. Première exécution manuelle ; capture des scores.
4. Rédiger le plan d'amélioration (FR-04) en reliant chaque écart à sa spec.
5. Ajouter la ligne Scorecard au rapport hebdomadaire (127) et, si Q2, le badge (128).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `.github/workflows/scorecard.yml` (nouveau) | Workflow |
| Plan d'amélioration (emplacement 128) | Nouveau document |
| `README.md` | Badge (Q2) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

`workflow_dispatch` ; vérification de l'onglet Security et de l'API publique.

## 8. Non-régression

Aucun check requis ajouté.

## 9. Rollback / désactivation

Supprimer ou désactiver le workflow ; `publish_results` peut être désactivé.

## 10. Documentation à mettre à jour avec l'implémentation

Documentation CI et sécurité (128), `SECURITY.md` (mention de Scorecard), README.
