# Tâches — 089 Interfaces TV des autres jeux

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre. Les tâches par jeu ne démarrent qu'après la livraison de ce jeu dans 058.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 086 est livrée et que 058 l'est pour le jeu concerné
- [ ] T001 Valider la liste des temps forts par jeu avec le PO

## Implémentation
- [ ] T002 Gotcha : projection, temps forts `gotcha`/`bust`, écran (AC-04, AC-07)
- [ ] T003 Killer : projection sans `log` brut, derniers faits typés, écran (AC-02, AC-07)
- [ ] T004 Capital : projection, « ÷2 », écran (AC-03, AC-07)
- [ ] T005 Cricket : projection avec cibles fermées calculées côté contrôleur, grille, écran (AC-01, AC-07)
- [ ] T006 Triathlon : phases, classement, sous-vues réutilisées, transitions (AC-05, AC-07)
- [ ] T007 Extension du contrat (`kind`) et message « jeu non pris en charge »
- [ ] T008 Commande « Diffuser » activée par jeu livré

## Tests
- [ ] T009 Tests unitaires des projections et temps forts par jeu, dont annulation (AC-01 à AC-05, AC-07)
- [ ] T010 Tests de taille à 6 joueurs, noms de 32 caractères (AC-06)
- [ ] T011 Captures de référence et E2E local par jeu

## Documentation et clôture
- [ ] T012 Compléter le guide TV (037) par jeu
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
