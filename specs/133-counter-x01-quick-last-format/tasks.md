# Tâches

> Spec validée par le product owner le 2026-11-26.

- [x] T001 : modèle pur du format rapide (extraction, éligibilité, validation, application) et tests (RM-01, RM-07, AC-06, AC-07).
- [x] T002 : stockage local dédié et tests (AC-05, AC-06).
- [x] T003 : écran de setup — ouverture sur le format mémorisé, « ← Partie rapide » qui garde le format, enregistrement du format lancé en rapide, exclusions partenaire et revanche (RM-02 à RM-05, AC-01 à AC-04, AC-10, AC-11).
- [x] T004 : carte de la partie rapide — manches ou sets, limite de volées, bouton « Revenir au standard » (RM-06, RM-08, AC-02, AC-08, AC-09).
- [ ] T005 : E2E de la partie rapide avec format mémorisé, changement de format et retour au standard (couvert en unitaire ; E2E non écrit).
- [x] T006 : documentation et notes de version.
- [ ] T007 : recette sur téléphone ; implémentation vérifiée au commit `0ee2573`.

## Révision du 2026-11-27 — toutes les parties X01

> Décisions du product owner du 2026-11-27 (Q2 révisée, Q6 à Q9).

- [x] T010 : partie mémorisée en version 2 (composition, prénoms, robot et niveau), relecture de la version 1 et validation de cohérence (RM-01, RM-07, RM-09, AC-07, AC-12).
- [x] T011 : enregistrement de toute partie lancée hors lien partenaire et revanche ; « ← Partie rapide » quelle que soit la composition ; « Revenir au standard » en 1 contre 1 avec les deux premiers prénoms (RM-03, RM-04, RM-08, AC-03, AC-08, AC-13).
- [x] T012 : carte et prénoms de la partie rapide pour le solo, 3-4 joueurs, 2 contre 2 et robot ; enchaînement avec Entrée (RM-06).
- [x] T013 : plafond de 99 manches dans l'écran (RM-10).
- [x] T014 : tests unitaires (modèle, stockage, écran) ; documentation, notes joueurs et changelog in-app.
- [ ] T015 : CI du commit et recette sur téléphone (4 joueurs, 2 contre 2, robot, retour au standard, ancienne partie mémorisée) ; renseigner `verifie_au_commit`.
