# Tâches — 046 X01 : ouverture Double/Master-In

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que Q1 (A ou B), Q2, Q3, Q4, Q5 sont tranchées et que la spec 030 (V2-INT-01) intègre la décision

## Implémentation — option B
- [ ] T001 Fonctions de domaine `isTeamOpened` et `isPossibleOpeningTotal` (AC-01 à AC-04)
- [ ] T002 Résultat `opening_confirm` et refus « OUVERTURE IMPOSSIBLE » dans la soumission (AC-01, AC-02)
- [ ] T003 Dialogue de confirmation, refus RESTE, état d'ouverture dans le bandeau (AC-01, AC-03)
- [ ] T004 Robot interdit avec ouverture ≠ Open (Q4) dans le setup
- [ ] T005 Vérifier le flux voix (proposition → confirmation d'ouverture)

## Implémentation — option A
- [ ] T010 Retirer la section « Ouverture » du setup et du résumé ; normaliser `checkIn` (AC-06)
- [ ] T011 Appliquer Q3 dans `externalMatchLink.ts` et le simulateur partenaire

## Tests
- [ ] T020 Tests unitaires ouverture (table exhaustive, undo, doublettes, nouvelle manche) (AC-01 à AC-04)
- [ ] T021 Tests setup (option retirée ou robot désactivé) (AC-06)
- [ ] T022 E2E Double-In local et lien `in=double` (AC-05)

## Documentation et clôture
- [ ] T030 Règles affichées, guide partenaire (retrait de la limite connue), référence des règles (spec 050), notes de version (AC-07)
- [ ] T031 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Suivi d'implémentation (2026-11-20)

Implémentée au commit `0c9ab98` (issue #213). Les tâches de code, de tests unitaires et de documentation sont réalisées ; restent ouvertes les tâches de recette terrain et de tests E2E, ainsi que la validation par le product owner.
