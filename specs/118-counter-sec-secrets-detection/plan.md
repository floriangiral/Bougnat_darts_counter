# Plan — 118 Secrets : Gitleaks, secret scanning, protection des pushes, rotation

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `.github/workflows/secret-scan.yml:1-54`, `.gitleaksignore:1-2`, `wrangler.jsonc:11, 23`.
- `.github/workflows/promote-preprod.yml:77-92`, `promote-production.yml:78-93`.
- `SECURITY.md:85-99` ; spec 006 (révision V2, C-07).

## 2. Approche retenue (et alternatives écartées)

Retenue : conserver l'action Gitleaks en durcissant ses sorties ; configuration versionnée ; protections natives conservées ; runbook écrit et exercé.
Écartées : retirer Gitleaks au profit du seul secret scanning natif (les motifs génériques ne sont pas couverts par défaut) ; réécriture d'historique en cas de fuite (inutile pour un dépôt public déjà cloné).

## 3. Étapes

1. Relancer Gitleaks localement ou par `workflow_dispatch` sur l'historique complet ; consigner le résultat sans valeur.
2. `.gitleaks.toml` + justification des exceptions ; remplacement de `.gitleaksignore` par des règles justifiées.
3. Workflow (dans `security.yml`, 113) : masquage, commentaires et artefact désactivés, planification historique, permissions de job.
4. Opérations manuelles (128) : motifs non-fournisseurs et contrôles de validité si disponibles.
5. Runbook de rotation (un paragraphe par secret) ; exercice à blanc sur `SONAR_TOKEN`.
6. Tests négatifs sur branche jetable (AC-01, AC-02).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `.github/workflows/secret-scan.yml` (ou `security.yml`) | Sorties masquées, planification historique, permissions |
| `.gitleaks.toml` (nouveau), `.gitleaksignore` | Configuration justifiée |
| `SECURITY.md` + runbook (emplacement 128) | Procédure de rotation |
| `.github/workflows/promote-*.yml` | Suppression de l'affichage des réponses (avec 115) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Secret fictif sur branche jetable ; push d'un jeton fictif au format fournisseur ; revue des journaux et artefacts du run.

## 8. Non-régression

Check `Gitleaks` toujours publié sous son nom ou via l'agrégateur.

## 9. Rollback / désactivation

Revert de la configuration ; les protections natives restent actives indépendamment.

## 10. Documentation à mettre à jour avec l'implémentation

`SECURITY.md`, runbook, documentation CI (128), spec 006 (renvoi vers le runbook commun).
