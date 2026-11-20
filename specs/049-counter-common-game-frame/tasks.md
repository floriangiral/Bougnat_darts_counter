# Tâches — 049 Cadre de jeu commun

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que Q1 à Q4 sont tranchées et que la spec 058 couvre le jeu à migrer

## Implémentation
- [ ] T001 Créer `ExitConfirmDialog` et l'intégrer aux 6 jeux (AC-01)
- [ ] T002 Créer `GameEndScreen` (ex æquo, 4 actions ordonnées) (AC-02, AC-03, AC-08)
- [ ] T003 Différer l'enregistrement du résultat de Killer et Gotcha (AC-02)
- [ ] T004 Annulation depuis la fin en X01 (AC-03)
- [ ] T005 Créer `GameTopBar` avec bouton « Règles » (AC-07)
- [ ] T006 Renommer « C » du Cricket et unifier Effacer/Annuler (AC-05)
- [ ] T007 Choix du premier joueur Killer/Gotcha ; ordre conservé dans Killer (AC-06)
- [ ] T008 Revanche avec alternance (AC-04)
- [ ] T009 Prénoms des équipiers en doublettes Cricket/Triathlon
- [ ] T010 Minuterie d'inactivité des statistiques (Q2)

## Tests
- [ ] T020 Tests de composants du cadre (AC-01, AC-02, AC-07)
- [ ] T021 Un test de vue par jeu : fin, annulation, validation unique (AC-02, AC-03)
- [ ] T022 E2E par jeu : partie, annulation depuis la fin, revanche (AC-04, coordination spec 040)

## Documentation et clôture
- [ ] T030 Mettre à jour README, `docs/specifications.md`, notes de version
- [ ] T031 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
