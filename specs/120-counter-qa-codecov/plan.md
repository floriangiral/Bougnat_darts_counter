# Plan — 120 Codecov

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `vitest.config.ts:5-33`, `sonar-project.properties:9`, `.github/workflows/quality-gate.yml:79-147`, `README.md:100-111`.

## 2. Approche retenue (et alternatives écartées)

Retenue : envoi du `lcov` existant par l'action officielle en OIDC, `codecov.yml` informatif avec composants métier.
Écartées : jeton de dépôt (secret à gérer) ; second calcul de couverture ; exclusions propres à Codecov (double source).

## 3. Étapes

1. Opération manuelle (128) : connexion à Codecov avec le compte GitHub, activation du dépôt, installation de l'application Codecov si nécessaire.
2. Ajouter `codecov/codecov-action` à la liste d'actions autorisées (115).
3. Job `codecov` (113) : téléchargement de l'artefact `coverage/`, envoi OIDC.
4. `codecov.yml` (FR-02).
5. Observation de 10 PR ; ajustement du commentaire.
6. Badge (Q4) et documentation de la politique (FR-05).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `.github/workflows/ci.yml` | Job `codecov` |
| `codecov.yml` (nouveau) | Statuts, composants, commentaires |
| `README.md` | Badge |
| `CONTRIBUTING.md`, documentation CI (128) | Politique de couverture |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

PR jetables et fork de test ; vérification de la liste des fichiers reçus par Codecov.

## 8. Non-régression

Sonar et planchers Vitest inchangés ; aucun check requis ajouté.

## 9. Rollback / désactivation

Supprimer le job et `codecov.yml` ; désactiver le dépôt dans Codecov.

## 10. Documentation à mettre à jour avec l'implémentation

`CONTRIBUTING.md` (gouvernance de couverture), `docs/technical.md` (« Couverture locale et SonarCloud »), spec 029 (note de validation CI).
