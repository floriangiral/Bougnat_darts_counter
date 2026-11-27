# Tâches — 042 Matrice d'appareils et de viewports réalistes

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) ; noter l'état de 070, 071 et de la décision 018
- [ ] T001 Trancher Q1 (budget/prêt d'appareils) et Q5 (seuil de police)

## Implémentation
- [ ] T002 Créer la matrice déclarative des profils (AC-02, AC-04)
- [ ] T003 Générer les projets Playwright depuis la matrice, tags PR/nightly (AC-04)
- [ ] T004 Créer le spec de matrice : recette, cibles ≥ 48 px, Cricket 7 lignes, score X01, Killer 21 cibles (AC-02, AC-03)
- [ ] T005 Déclarer les défauts connus en `test.fail` référencés 070/071 (AC-02)
- [ ] T006 Retirer le mode forcé des tests d'affichage ; créer le test dédié au mode forcé (AC-01)
- [ ] T007 Ajouter Chromium mobile (Pixel 7) en PR, Firefox desktop en nightly (AC-04)
- [ ] T008 Projet legacy conditionné à la décision 018 (FR-07)

## Tests
- [ ] T009 Vérifier sur branche jetable qu'une cible < 48 px fait échouer le test (AC-03)
- [ ] T010 Mesurer la durée PR et nightly (NFR-01)
- [ ] T011 Revoir `tests/unit/tabletLayout.test.ts:71` avec le rédacteur de 070 (AC-06)

## Documentation et clôture
- [ ] T012 Rédiger le protocole terrain et l'exécuter sur un iPad et une tablette Android (AC-05)
- [ ] T013 Ajouter la note de validation CI dans la spec 029
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue


## Reliquats reçus à la clôture des recettes (2026-11-27)

Sources : [071](../071-counter-tablet-landscape-fixes/spec.md#clôture-2026-11-27), [072](../072-counter-arena-layout/spec.md#clôture-2026-11-27). Les tâches non livrées décrites dans leurs clôtures sont désormais suivies ici, sans les déclarer exécutées. La recette du produit en production a été confirmée par le product owner ; elle ne valide ni cette proposition ni ses nouveaux outils. Le statut reste `a-valider`.
