# Tâches — 041 Accessibilité automatisée et régression visuelle

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que Q1/Q2 (H.25) sont tranchées
- [ ] T001 Vérifier que 063 (design tokens) n'a pas commencé ; sinon geler ses PR jusqu'à AC-01

## Implémentation
- [ ] T002 Ajouter `@axe-core/playwright` en devDependency et les scripts `test:visual`, `test:visual:update`, `test:a11y` (AC-06)
- [ ] T003 Déclarer la liste des écrans et leurs masques (`tests/visual/screens.ts`) (AC-01)
- [ ] T004 Créer le spec visuel et les projets `visual-*` (AC-01, AC-02)
- [ ] T005 Créer le spec a11y, le fichier de dette et le contrôle « entrée inutile » (AC-03, AC-04)
- [ ] T006 Créer le test de focus visible en `test.fails` référencé 064 (FR-05)
- [ ] T007 Ajouter le service Compose `visual` (build + preview + Playwright épinglé) (AC-05)
- [ ] T008 Ajouter le job CI conteneurisé, informatif puis bloquant (FR-08)

## Tests
- [ ] T009 Générer les captures de référence dans le conteneur et les versionner (AC-01)
- [ ] T010 Vérifier la détection sur branche jetable (couleur, bouton sans nom) (AC-02, AC-03)
- [ ] T011 5 exécutions consécutives sans diff (AC-05)

## Documentation et clôture
- [ ] T012 Documenter les commandes et la procédure de mise à jour (AC-06)
- [ ] T013 Ajouter la note de validation CI dans la spec 029
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
