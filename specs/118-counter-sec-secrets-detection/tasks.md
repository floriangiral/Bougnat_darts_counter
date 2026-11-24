# Tâches — 118 Secrets : Gitleaks, secret scanning, protection des pushes, rotation

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (statut `validee`) et que Q1 à Q3 sont tranchées

## Implémentation
- [ ] T001 Scan Gitleaks de tout l'historique, résultat consigné sans valeur (AC-03)
- [ ] T002 `.gitleaks.toml` et justification des exceptions existantes (AC-04)
- [ ] T003 Workflow : masquage, commentaires et artefact désactivés, planification historique, permissions de job (AC-01)
- [ ] T004 Supprimer l'affichage des réponses d'API dans les promotions (AC-06, avec 115)
- [ ] T005 Opération manuelle : motifs non-fournisseurs et contrôles de validité si disponibles (FR-04)

## Tests
- [ ] T006 Secret fictif sur branche jetable : détection masquée, aucun commentaire ni artefact (AC-01)
- [ ] T007 Jeton fictif au format fournisseur : push refusé (AC-02)

## Documentation et clôture
- [ ] T008 Runbook de rotation par secret, lié depuis `SECURITY.md` (AC-05) — brouillon : `docs/security/rotation-secrets.md` ; lien et revue restent à faire.
- [ ] T009 Exercice de rotation à blanc de `SONAR_TOKEN` consigné (AC-05)
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
