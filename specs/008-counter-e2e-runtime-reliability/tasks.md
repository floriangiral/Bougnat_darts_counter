# Tasks

- [x] Stabiliser le worker local par defaut
- [ ] Ajouter une verification explicite preview server avant tests
- [ ] Ajouter une section de troubleshooting e2e dans la doc
- [ ] Mesurer la stabilite e2e sur plusieurs executions consecutives

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la révision V2 (V2-QA-08).

- [ ] T000 Vérifier que la révision V2 de la spec est validée et que Q1-Q4 sont tranchées
- [ ] T001 Créer l'environnement E2E versionné et le script `build:e2e` vers `dist-e2e/` (V2-AC-01, V2-AC-04)
- [ ] T002 Ajouter `webServer` (port strict, réutilisation locale seulement) à `playwright.config.ts` (V2-AC-03)
- [ ] T003 Ajouter la vérification préalable des navigateurs avec message d'installation (V2-AC-02)
- [ ] T004 Réduire `scripts/run-playwright.sh` à l'amorçage des bibliothèques ; journaux dans `test-results/` (V2-FR-06)
- [ ] T005 Aligner l'action `run-local-smoke` avec 043 (serveur unique) (V2-AC-03)
- [ ] T006 Aligner le profil Docker `e2e` sur le build E2E et la suite complète (V2-AC-05)
- [ ] T007 Réécrire la procédure E2E locale et documenter l'origine de test (V2-FR-04, V2-FR-07) — reprend les tâches historiques « vérification explicite preview server » et « troubleshooting e2e »
- [ ] T008 Mesurer 5 exécutions locales consécutives (V2-AC-06) — reprend la tâche historique « Mesurer la stabilité »
- [ ] T009 Ajouter la note de validation CI à la spec 029
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
