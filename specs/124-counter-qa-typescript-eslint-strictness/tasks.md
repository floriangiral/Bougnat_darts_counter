# Tâches — 124 TypeScript strict et règles ESLint

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q3 tranchées, 043 livrée
- [ ] T001 Remesurer les erreurs par option sur le commit courant

## Implémentation
- [ ] T002 Activer `strict` et les options à 0 erreur dans `tsconfig.json` (AC-01)
- [ ] T003 Aligner `ecmaVersion`, réactiver `react-hooks/purity`, `ban-ts-comment` avec description (AC-06)
- [ ] T004 Script de cliquet des contournements et référence initiale (AC-05)
- [ ] T005 Corriger les 33 erreurs `exactOptionalPropertyTypes` et activer l'option (AC-03)
- [ ] T006 `tsconfig.strict-core.json` + `typecheck:core` + job CI (AC-04)
- [ ] T007 Traiter `set-state-in-effect` (9) et `refs` (6) selon Q2 (AC-06)

## Tests
- [ ] T008 PR jetable : paramètre implicitement `any` (AC-02)
- [ ] T009 PR jetable : directive de désactivation sans justification (AC-05)
- [ ] T010 Tests unitaires du script de cliquet

## Documentation et clôture
- [ ] T011 Règles de contournement dans `CONTRIBUTING.md` et `AGENTS.md`
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
