# Tasks

- [x] Ajouter resolution `AppAccessMode`
- [x] Ajouter guardrails de screens par mode
- [x] Couvrir app shell en tests
- [x] Couvrir les garde-fous d accès en tests

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2. Les tâches historiques cochées ci-dessus ne couvrent pas le garde à l'exécution.

- [ ] T000 Vérifier que la spec est validée (Révision V2), que Q1 à Q8 sont tranchées et que la spec 070 est livrée
- [ ] T001 Retirer la lecture du mode dans le calcul de mise en page et adapter l'E2E tablette (V2-AC-04)
- [ ] T002 Déplacer le type de mode dans `src/shared/` et créer la table des politiques de mode (V2-AC-05)
- [ ] T003 Réécrire le garde à partir de la table et l'appliquer à la navigation et à la restauration (V2-AC-02, V2-AC-06)
- [ ] T004 Implémenter `dedicated_tablet` : écran d'entrée, confirmation de sortie, reprise automatique (V2-AC-02)
- [ ] T005 Implémenter l'entrée `spectator` (détection avant restauration, écran d'attente, aucun micro ni écriture) (V2-AC-03)
- [ ] T006 Traiter `personal_phone` selon Q3 (V2-AC-05)
- [ ] T007 Tests unitaires, intégration et E2E par mode ; non-régression du parcours `local` (V2-AC-01 à V2-AC-06)
- [ ] T008 Mettre à jour `docs/technical.md`, `.env.local.example` et l'archive `docs/architecture/scoring-access-modes.md`
- [ ] T009 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
