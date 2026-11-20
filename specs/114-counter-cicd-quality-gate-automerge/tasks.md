# Tâches — 114 Quality gate agrégé et politique d'auto-merge vérifiable

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q5 tranchées, 113 et 115 livrées

## Implémentation
- [ ] T001 Écrire `scripts/ci/expected-jobs.mjs` (AC-04)
- [ ] T002 Ajouter le job agrégateur `requis` à chaque workflow applicatif (AC-03, AC-04)
- [ ] T003 Écrire `scripts/ci/automerge-eligibility.mjs` (AC-02, AC-05, AC-06)
- [ ] T004 Job `eligibilite` : déclenchement d'`e2e-complet`, désactivation d'auto-merge et étiquette si non éligible (AC-01, AC-02)
- [ ] T005 Opérations manuelles : auto-merge activé, squash seul, mise à jour de branche proposée, ruleset sur agrégateurs (via 128)

## Tests
- [ ] T006 Tests unitaires des deux scripts, cas `skipped`/`cancelled`/fork/branche usurpée (AC-08)
- [ ] T007 PR jetables : test en échec, job requis ignoré (AC-03, AC-04)
- [ ] T008 Observer la première vague Renovate : patch fusionné, major en attente, échec visible (AC-01, AC-02, AC-07)
- [ ] T009 PR Renovate simulée hors liste blanche (AC-06)

## Documentation et clôture
- [ ] T010 Documenter la politique d'auto-merge et les agrégateurs (via 128) ; ajouter RM-04 à `AGENTS.md`
- [ ] T011 Note de validation CI dans la spec 029
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
