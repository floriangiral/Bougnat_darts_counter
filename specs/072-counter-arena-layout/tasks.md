# Tâches — 072 Disposition « arène » tablette paysage

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-TAB-01 (070) et V2-DS-01 (063) sont livrées
- [ ] T001 Prototype X01/Cricket sur appareil ; reporter Q1 à Q5

## Implémentation
- [ ] T002 `GameScreenLayout` (zones, recettes, slots optionnels) (AC-07)
- [ ] T003 Lot X01 avec V2-DS-03 : cartes, finish inline, contrôles (AC-01, AC-04, AC-05)
- [ ] T004 Lot Cricket (AC-02)
- [ ] T005 Lot Capital (AC-04)
- [ ] T006 Lot Killer et Gotcha (AC-03)
- [ ] T007 Lot Triathlon (bandeau de phase) (AC-04)
- [ ] T008 Suppression des crochets `.tablet-<jeu>-*` migrés (AC-07)

## Tests
- [ ] T009 Tests unitaires du composant (AC-07)
- [ ] T010 E2E de mesure par jeu/profil (AC-01 à AC-05)
- [ ] T011 E2E rotation en cours de saisie (AC-06)
- [ ] T012 Test terrain de lisibilité à 3 m (AC-08)

## Documentation et clôture
- [ ] T013 Guide utilisateur tablette, notes de release, architecture
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
