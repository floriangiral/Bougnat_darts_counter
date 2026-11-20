# Tâches — 053 Killer et Gotcha : variantes et règles de référence

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que Q1 à Q5 sont tranchées et que la spec 049 est livrée pour Killer et Gotcha

## Implémentation
- [ ] T001 Golden tests Killer/Gotcha d'après la référence §8
- [ ] T002 `startingLives` (3/5) dans le domaine Killer et bornes de vies (AC-01)
- [ ] T003 Ordre de jeu choisi après attribution et conservé (AC-02)
- [ ] T004 Option « Vies » au setup et règles affichées dynamiques (AC-01)
- [ ] T005 Journal visible dans Killer et Gotcha (AC-03)
- [ ] T006 Overlay du premier joueur dans Gotcha (AC-04)
- [ ] T007 Cœurs affichés selon le nombre de vies (AC-01)

## Tests
- [ ] T010 Tests unitaires Killer (5 vies, ordre) et Gotcha (premier joueur) (AC-01, AC-02, AC-04)
- [ ] T011 Test de composant du journal (AC-03)
- [ ] T012 E2E Killer 5 vies

## Documentation et clôture
- [ ] T020 Publier la référence Killer/Gotcha (AC-05) ; révision V2 des specs 017 et 019
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
