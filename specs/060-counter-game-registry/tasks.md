# Tâches — 060 Registre de jeux

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que la spec 058 est livrée et que le déclencheur Q1 est atteint (nouveau jeu validé)

## Implémentation
- [ ] T001 Définir `GameModule` et `src/app/gameRegistry.ts` ; enregistrer X01 et brancher `App` (AC-01)
- [ ] T002 Enregistrer Cricket, Capital, Killer, Gotcha, Triathlon (AC-02)
- [ ] T003 Brancher la sélection et le setup sur le registre (AC-02, AC-03)
- [ ] T004 Fin de partie et historique génériques dans `useGameLifecycle` (AC-02)
- [ ] T005 Écrans dérivés du registre dans `appShell` ; brancher la persistance (spec 010) (AC-02)
- [ ] T006 Supprimer les conditions par jeu devenues inutiles (AC-02)

## Tests
- [ ] T007 Test d'intégration avec un jeu factice (AC-01)
- [ ] T008 E2E par jeu et mesure du bundle initial (AC-03, AC-04)

## Documentation et clôture
- [ ] T009 Documenter « ajouter un jeu » dans `docs/architecture.md`
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
