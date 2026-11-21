# Tasks - Sonar coverage governance

- [x] Define the coverage classification by architecture layer.
- [x] Define mandatory unit, component and E2E test expectations.
- [x] Define the temporary exception process.
- [x] Reference the spec from contribution and spec indexes.
- [x] Align Playwright browser installation with declared projects.
- [x] Add an automated check that validates coverage exclusions against the spec.
- [ ] Add CI reporting for changed-file coverage strategy.
- [ ] Review and reduce existing UI coverage exclusions incrementally.

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la révision V2 (V2-QA-11).

- [ ] T000 Vérifier que la révision V2 de la spec est validée et que Q1-Q4 sont tranchées
- [ ] T001 Restreindre le garde-fou à la section « Approved current exclusions » et ajouter ses tests unitaires (V2-AC-02)
- [ ] T002 Étendre les préfixes protégés (`src/infrastructure/`, `src/shared/`, `src/presentation/`, `src/app/`) (V2-AC-03)
- [ ] T003 Ajouter le tableau raison / preuve / spec de retrait / critère de sortie des exclusions restantes (V2-AC-05)
- [ ] T004 Publier en CI la couverture « toutes sources » à titre informatif (V2-AC-04) — avec 043
- [ ] T005 Publier la liste des fichiers modifiés exclus dans le résumé de PR (V2-FR-07) — reprend la tâche historique « changed-file coverage strategy »
- [ ] T006 Retirer l'exclusion de chaque vue de jeu dans la PR d'extraction correspondante de 058 (Gotcha, Killer, Capital, Cricket, X01, Triathlon) (V2-AC-01) — reprend la tâche historique « Review and reduce existing UI coverage exclusions »
- [ ] T007 Réévaluer SetupView, MatchView et App après 061 et 049 (V2-AC-06)
- [ ] T008 Ajouter les notes de validation CI des specs 041, 042, 043, 044 (V2-FR-08)
- [ ] T009 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Révision DevSecOps — tâches proposées

- [ ] T-DSO-01 Vérifier que `codecov.yml` (120) ne définit aucune exclusion de fichiers source (DSO-FR-01)
- [ ] T-DSO-02 Décider DSO-Q1 et, si oui, ajouter `scripts/ci/` au périmètre de couverture
- [ ] T-DSO-03 Recevoir les notes de validation CI des specs 113, 114, 117, 120, 123 (DSO-FR-04)
