# Tâches — 065 Migration écran par écran vers les tokens

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) et V2-QA-05 (041) sont livrées
- [ ] T001 Reporter la décision de séquencement avec V2-TAB-03 (Q1)

## Implémentation
- [ ] T002 Table de correspondance validée (≈ 100 classes)
- [ ] T003 `scripts/migrate-colors.mjs` (hors runtime) avec rapport des cas ambigus
- [ ] T004 Lot A : accueil, sélection, setup (AC-01, AC-02)
- [ ] T005 Lot B : X01 (AC-01, AC-02)
- [ ] T006 Lot C : Cricket (AC-01, AC-02)
- [ ] T007 Lot D : Capital (AC-01, AC-02)
- [ ] T008 Lot E : Killer et Gotcha (AC-01, AC-02)
- [ ] T009 Lot F : Triathlon (AC-01, AC-02)
- [ ] T010 Lot G : statistiques et modales ; Lot H : changelog (AC-01, AC-02)
- [ ] T011 `matchFeedback.ts` renvoie un ton (AC-03)
- [ ] T012 Verrouillage `--color-*: initial`, cliquet à 0 (AC-04)

## Tests
- [ ] T013 Convertir les assertions de `keypads.test.tsx`, `cricketScoreboard.test.tsx`, `VoiceScoringControl.test.tsx`, `matchScoring.test.ts` (AC-03)
- [ ] T014 Captures Dark par lot (AC-02)
- [ ] T015 Test CI : classe brute ajoutée → échec (AC-04)

## Documentation et clôture
- [ ] T016 Registre de migration complet (AC-05) ; notifier V2-THEME-01
- [ ] T017 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
