# Tâches — 102 « La partie à emporter » : récap partageable

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que Q1, Q2, Q3 et Q6 sont tranchées et que V2-QR-01 (092) est livrée ou planifiée

## Implémentation
- [ ] T001 Écrire `buildMatchRecap` (X01 simple, doublettes, robot) (AC-03, AC-06)
- [ ] T002 Écrire le contrat de fragment `recap v=1` (encodage, décodage strict, sélection sous budget) (AC-03, AC-05)
- [ ] T003 Écrire le formateur texte et l'export JSON (AC-06)
- [ ] T004 Écrire le rendu canvas PNG et l'adaptateur de partage avec repli téléchargement (AC-02)
- [ ] T005 Ajouter le panneau « Emporter la partie » à `views/StatsView.tsx` et suspendre la minuterie (AC-01, AC-07, AC-09)
- [ ] T006 Détecter `#r=` dans `App.tsx`, créer `views/RecapView.tsx`, nettoyer l'URL (AC-03, AC-04, AC-05)
- [ ] T007 Brancher le générateur QR de V2-QR-01 en chargement différé (AC-03, AC-08)
- [ ] T008 Ajouter l'entrée depuis « Mes parties » (101) si livrée

## Tests
- [ ] T010 Tests unitaires : modèle, contrat (aller-retour, 30 cas malformés), formateur (AC-03, AC-05, AC-06)
- [ ] T011 Tests de composants : panneau, vue de lecture, minuterie (AC-01, AC-09)
- [ ] T012 Tests E2E Chromium + WebKit : AC-01, AC-02 (repli), AC-04, AC-06, AC-07
- [ ] T013 Vérifier les chunks différés dans le rapport de build (AC-08)
- [ ] T014 Test terrain iPhone + Android : partage de fichier et lecture du QR à 30-50 cm (AC-02, AC-03)

## Documentation et clôture
- [ ] T020 Documenter le contrat du fragment récap, mettre à jour `README.md`, guide utilisateur, notes de release, changelog in-app
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
