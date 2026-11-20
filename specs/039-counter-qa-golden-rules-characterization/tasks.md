# Tâches — 039 Golden tests de règles et tests de caractérisation par jeu

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que les questions Q1-Q5 sont tranchées
- [ ] T001 Recenser avec le PO les bugs connus à enregistrer en `bug-connu` (045, 047, 048, 054, 057) (AC-02, AC-03)

## Implémentation
- [ ] T002 Créer le format de scénario, l'exécuteur générique et le gel profond (`tests/unit/golden/scenario.ts`, `deepFreeze.ts`) (AC-01)
- [ ] T003 Créer le contrôle de cohérence des scénarios (AC-04)
- [ ] T004 Scénarios et adaptateur X01 via `buildScoreSubmissionResult` (≥ 25, dont Master Out à 1 et finitions impossibles en `bug-connu`) (AC-01, AC-02)
- [ ] T005 Scénarios robot X01 avec aléa fixé (≥ 4) (AC-01)
- [ ] T006 Scénarios et adaptateurs Cricket, Capital, Killer, Gotcha, Triathlon (AC-01)
- [ ] T007 Test d'immuabilité de toutes les fonctions de moteur exportées, cas `finishLeg` en `it.fails` (AC-03)
- [ ] T008 Test de déterminisme (double rejeu) (AC-01)
- [ ] T009 Tests de caractérisation des 6 vues de jeu (AC-05)

## Tests
- [ ] T010 Vérifier localement qu'une régression volontaire dans chaque moteur fait échouer son exécuteur (non commité) (AC-01)
- [ ] T011 Mesurer la durée ajoutée à `npm run test:unit` et la consigner dans la spec (NFR-01)
- [ ] T012 Vérifier que `package.json` et le lockfile sont inchangés (AC-07)

## Documentation et clôture
- [ ] T013 Faire relire les scénarios `valide-metier` par le PO, jeu par jeu, et tracer l'accord dans l'issue (AC-06)
- [ ] T014 Documenter l'ajout d'un scénario et le changement de verdict (guide contributeur / `AGENTS.md`)
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
