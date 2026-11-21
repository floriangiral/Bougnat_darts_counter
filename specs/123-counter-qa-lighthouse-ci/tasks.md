# Tâches — 123 Lighthouse CI

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q5 tranchées, 113 et 044 livrées (artefact de build, budgets)

## Implémentation
- [ ] T001 Ajouter `@lhci/cli` et `lighthouserc.json` (FR-01, AC-05)
- [ ] T002 Créer `performance.yml` réutilisant l'artefact `dist/` (AC-01)
- [ ] T003 Résumé de job et artefacts (FR-04, FR-05)
- [ ] T004 Baseline : 10 exécutions sur `main`, médianes et écart-type consignés (AC-02)
- [ ] T005 Calibrer et passer les assertions bloquantes (§8)

## Tests
- [ ] T006 PR jetable : ressource lourde bloquante (AC-03)
- [ ] T007 PR jetable : dégradation du CLS (AC-04)

## Documentation et clôture
- [ ] T008 Ajouter la mesure preprod à la checklist de release (FR-06, avec 033)
- [ ] T009 Documentation CI et `CONTRIBUTING.md` ; note de validation CI dans la spec 029
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
