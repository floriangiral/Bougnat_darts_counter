# Tasks

- [x] Relier explicitement la reprise locale a la milestone M4
- [ ] Definir une grille de cas de corruption de session
- [ ] Ajouter des tests unitaires de restauration degradee
- [ ] Ajouter un scenario e2e reload en partie active

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2. Chaque tâche référence les critères d'acceptation V2-AC.

- [ ] T000 Vérifier que la spec est validée (Révision V2), que Q1 à Q8 sont tranchées et, pour les jeux non-X01, que la spec 058 a migré le jeu concerné
- [ ] T001 Écrire la grille de corruption et les fixtures de sessions réelles (V2-AC-03, V2-AC-04)
- [ ] T002 Ajouter `schemaVersion`, l'enveloppe et le validateur manuel (V2-AC-04)
- [ ] T003 Écrire la migration depuis le format sans version (X01 au mieux, purge des autres) (V2-AC-03)
- [ ] T004 Valider l'écran restauré et afficher le message d'abandon (V2-AC-04)
- [ ] T005 Remplacer le chrono persisté par des horodatages ; retirer le chrono des déclencheurs d'écriture (V2-AC-05)
- [ ] T006 Écrire sur changement métier et sur `visibilitychange`/`pagehide` (V2-AC-01, V2-AC-05)
- [ ] T007 Purger `current_matches` et la table localStorage ; incrémenter `DB_VERSION` (V2-AC-06)
- [ ] T008 Remonter les échecs d'écriture vers une alerte non bloquante (V2-AC-07)
- [ ] T009 Livrer la reprise X01 avec E2E de rechargement (V2-AC-01 pour X01)
- [ ] T010 Brancher la reprise de Gotcha, Killer, Capital, Cricket au fil de la spec 058 (V2-AC-01)
- [ ] T011 Brancher la reprise de Triathlon et de ses sous-étapes (V2-AC-02)
- [ ] T012 Implémenter le verrou mono-onglet selon Q5
- [ ] T013 Tests unitaires, composants et E2E listés au plan (V2-AC-01 à V2-AC-07)
- [ ] T014 Mettre à jour `README.md`, `docs/architecture.md`, `docs/technical.md` et l'ADR-0003 (V2-AC-08)
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Suivi d'implémentation (2026-11-20)

Implémentée au commit `0c9ab98` (issue #223). Les tâches de code, de tests unitaires et de documentation sont réalisées ; restent ouvertes les tâches de recette terrain et de tests E2E, ainsi que la validation par le product owner.
