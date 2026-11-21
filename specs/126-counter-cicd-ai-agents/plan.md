# Plan — 126 Cadre d'intervention des agents IA dans la chaîne CI/CD

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `AGENTS.md`, `.github/pull_request_template.md`, `.github/workflows/issue-auto-label.yml:21-35`, spec 036.

## 2. Approche retenue (et alternatives écartées)

Retenue : cadre documentaire + étiquettes + artefacts structurés + un contrôle CI anti-suppression de tests.
Écartées : agent automatique déclenché par workflow (coût, secrets d'API, surface d'injection) ; application tierce d'IA avec droits d'écriture.

## 3. Étapes

1. Section « CI/CD et sécurité » d'`AGENTS.md` (≤ 30 lignes, renvoi vers 128) — coordonnée avec 036.
2. Étiquettes (opération manuelle, 128).
3. Rubrique « Origine IA » du modèle de PR.
4. Format JSON des artefacts (schéma minimal commun : outil, date, commit, éléments, gravité, lien).
5. Contrôle FR-05 (comparaison du nombre de tests JUnit base/PR) + tests.
6. Guide de prompts sûrs (128).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `AGENTS.md` | Section CI/CD et sécurité |
| `.github/pull_request_template.md` | Rubrique « Origine IA » |
| `scripts/ci/check-test-count.mjs` (nouveau) + test | FR-05 |
| Workflows de rapport (113, 121, 122, 123) | Artefacts JSON |
| Documentation CI (128) | Guide de prompts |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

PR jetable supprimant un test ; essai manuel d'injection.

## 8. Non-régression

Aucun contrôle retiré ; contrôle de 036 vert.

## 9. Rollback / désactivation

Passer FR-05 en avertissement.

## 10. Documentation à mettre à jour avec l'implémentation

`AGENTS.md`, `CONTRIBUTING.md`, documentation CI (128).
