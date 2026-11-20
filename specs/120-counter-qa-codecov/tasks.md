# Tâches — 120 Codecov

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q4 tranchées, 113 livrée (couverture unique)
- [ ] T001 Opération manuelle : activer le dépôt dans Codecov (via 128)

## Implémentation
- [ ] T002 Job `codecov` en OIDC, sans jeton sur les forks, non bloquant (AC-01, AC-02, AC-05)
- [ ] T003 `codecov.yml` : statuts informatifs, composants métier, commentaire condensé (AC-01, AC-03)

## Tests
- [ ] T004 PR jetable ajoutant du code métier non testé (AC-03)
- [ ] T005 PR de fork de test (AC-02)
- [ ] T006 Comparer les fichiers reçus avec les exclusions 029 (AC-04)

## Documentation et clôture
- [ ] T007 Politique de couverture (Vitest, Sonar, Codecov, Stryker) dans `CONTRIBUTING.md` ; badge unique
- [ ] T008 Note de validation CI dans la spec 029
- [ ] T009 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
