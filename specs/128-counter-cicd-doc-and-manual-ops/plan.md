# Plan — 128 Documentation DevSecOps, opérations manuelles, séquencement et recette

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `SECURITY.md`, `CONTRIBUTING.md`, `README.md:100-111`, `docs/technical.md:145-150, 286-382`, `AGENTS.md`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`.

## 2. Approche retenue (et alternatives écartées)

Retenue : documentation incrémentale livrée avec chaque spec, checklist versionnée, recette finale consolidée.
Écartées : documentation écrite en une fois à la fin (dérive garantie) ; wiki GitHub (hors revue de PR).

## 3. Étapes

1. Publier la checklist §5.2 et le séquencement §5.3 dès la validation (document de travail, emplacement 035).
2. Phase 0 : corrections factuelles immédiates de `SECURITY.md`, `CONTRIBUTING.md`, `docs/technical.md` (contrôles réellement actifs).
3. Au fil des phases : documents §5.1 mis à jour dans les PR des specs 113 à 127.
4. Réécriture accentuée de `SECURITY.md` et `CONTRIBUTING.md` (une PR dédiée, sans changement de fond).
5. `CODE_OF_CONDUCT.md` (Q2), modèle d'issue (Q3), badges (Q1).
6. Recette globale et matrice finale ; revue indépendante (agent ou humain).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `docs/dev/*.md` (nouveaux, selon 035) | Documentation CI/CD, maintenance, sécurité, tests, observabilité |
| `SECURITY.md`, `CONTRIBUTING.md`, `README.md`, `AGENTS.md` | Réécriture, alignement |
| `docs/technical.md` | Corrections `:303-310`, `:375-382`, `:149-150` |
| `CODE_OF_CONDUCT.md` (nouveau) | Q2 |
| `.github/ISSUE_TEMPLATE/maintenance.yml` (nouveau) | Q3 |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Contrôle de liens (035/036) ; essai de lecture par un agent sans contexte (AC-05).

## 8. Non-régression

Les renvois existants vers `SECURITY.md` et `CONTRIBUTING.md` restent valides.

## 9. Rollback / désactivation

Revert documentaire.

## 10. Documentation à mettre à jour avec l'implémentation

Cette spec est elle-même la documentation ; mise à jour de `specs/README.md` par le coordinateur.
