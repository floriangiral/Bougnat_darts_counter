# Plan — 122 Étude-pilote StrykerJS

> Plan d'étude proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`. L'étude ne modifie pas `main` : le pilote vit sur une branche dédiée.

## 1. Lecture de l'existant

- `vitest.config.ts:12-34`, `tests/unit/`, `utils/{cricketLogic,capitalLogic,triathlonScoring}.ts`, `src/application/scoring/`, `src/features/x01/scoring/`, `src/domain/{killer,gotcha,triathlon,x01Bot}/`.

## 2. Approche retenue (et alternatives écartées)

Retenue : pilote option B sur branche d'étude, exécution `workflow_dispatch` sur runner standard.
Écartées : campagne complète (C) et mutation en PR (D) avant mesure.

## 3. Étapes

1. Branche `study/stryker` : dépendances de développement Stryker (non fusionnées tant que l'étude n'est pas arbitrée).
2. Configuration minimale (un fichier), puis périmètre B.
3. Workflow d'étude `workflow_dispatch` (délai 90 min, artefact HTML + JSON).
4. Mesures, mutation volontaire, analyse de 20 survivants.
5. Rapport et proposition (spec fonctionnelle ou abandon).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `stryker.config.json` (branche d'étude) | Configuration |
| `package.json` (branche d'étude) | Dépendances de développement |
| `.github/workflows/mutation.yml` (branche d'étude) | Exécution manuelle |
| Rapport d'étude (emplacement 128) | Nouveau document |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Mutation volontaire d'une règle sur branche jetable ; comparaison de deux exécutions (stabilité).

## 8. Non-régression

Aucune modification de `main` pendant l'étude.

## 9. Rollback / désactivation

Supprimer la branche d'étude.

## 10. Documentation à mettre à jour avec l'implémentation

Rapport d'étude ; si retenue : spec fonctionnelle, `CONTRIBUTING.md`, documentation CI (128), politique de couverture (120 FR-05).
