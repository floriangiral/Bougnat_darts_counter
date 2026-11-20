# Tâches — 054 Refus des totaux impossibles (Gotcha, Capital)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que Q1 et Q2 sont tranchées et l'état de la spec 057 (source unique)

## Implémentation
- [ ] T001 `recordGotchaTurn` utilise `isPossibleThreeDartTurnScore` (AC-01, AC-04)
- [ ] T002 Aperçu Gotcha « Score impossible » et bouton Valider selon Q1 (AC-01)
- [ ] T003 Refus des totaux irréalisables pour l'objectif Capital + message (AC-02)
- [ ] T004 Constantes de couleurs des multiplicateurs et application aux modes du keypad Capital (AC-05)

## Tests
- [ ] T010 Tests paramétrés des 9 totaux irréalisables, de 0 et de 180 (AC-01 à AC-03)
- [ ] T011 Test de composant du keypad Capital (refus, couleurs) (AC-02, AC-05)
- [ ] T012 E2E Gotcha saisie 179 puis correction (AC-01)

## Documentation et clôture
- [ ] T020 Mettre à jour la référence des règles (specs 050, 053), notes de version
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
