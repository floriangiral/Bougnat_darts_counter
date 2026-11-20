# Tâches — 126 Cadre d'intervention des agents IA dans la chaîne CI/CD

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q3 tranchées, 036 et 114 livrées

## Implémentation
- [ ] T001 Section « CI/CD et sécurité » dans `AGENTS.md` (AC-01)
- [ ] T002 Étiquettes `agent:a-traiter`, `agent:en-cours`, `origine:ia`, `suppression-test-validee` (opération manuelle)
- [ ] T003 Rubrique « Origine IA » dans le modèle de PR (FR-04)
- [ ] T004 Schéma JSON commun des artefacts de rapport (AC-05)
- [ ] T005 Contrôle de suppression de tests (AC-03)

## Tests
- [ ] T006 PR jetable supprimant un test (AC-03)
- [ ] T007 Vérifier qu'une PR d'agent n'est pas éligible à l'auto-merge (AC-02)
- [ ] T008 Essai manuel d'injection via notes de version (AC-04)

## Documentation et clôture
- [ ] T009 Guide de prompts sûrs dans la documentation CI (FR-06)
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
