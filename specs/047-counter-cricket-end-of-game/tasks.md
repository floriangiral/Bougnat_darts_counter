# Tâches — 047 Cricket : écran de victoire, annulation et départage

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée et que Q1, Q2, Q3 sont tranchées

## Implémentation
- [ ] T001 Écrire les tests de caractérisation de `CricketGameView` avant modification
- [ ] T002 Différer `onFinish` au clic de validation, garde anti double clic (AC-01, AC-03)
- [ ] T003 Écran de fin : « Annuler la dernière fléchette », action de validation paramétrable (AC-02, AC-03)
- [ ] T004 Supprimer le départage alphabétique ; appliquer Q2 (AC-04)
- [ ] T005 Gérer `winnerId: null` dans l'historique, `CricketStatsView` et le Triathlon (AC-04, AC-05)
- [ ] T006 Classement de fin : vainqueur d'abord, ex æquo (AC-05)
- [ ] T007 Libellés « Match remporté », « Égalité » (AC-06)

## Tests
- [ ] T010 Tests unitaires de départage (2 et 3 joueurs, égalités) (AC-04)
- [ ] T011 Test de composant : fin, annulation, reprise du chrono, validation unique (AC-01, AC-02)
- [ ] T012 E2E Cricket simple et Triathlon jusqu'à la fin avec annulation (AC-01 à AC-03)

## Documentation et clôture
- [ ] T020 Mettre à jour les règles affichées et la référence (spec 050), notes de version
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Suivi d'implémentation (2026-11-20)

Implémentée au commit `0c9ab98` (issue #206). Les tâches de code, de tests unitaires et de documentation sont réalisées ; restent ouvertes les tâches de recette terrain et de tests E2E, ainsi que la validation par le product owner.
