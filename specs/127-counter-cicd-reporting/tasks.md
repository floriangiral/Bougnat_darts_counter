# Tâches — 127 Rapport hebdomadaire DevSecOps

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q4 tranchées, 113, 116 et 117 livrées

## Implémentation
- [ ] T001 Schéma `weekly-report.json` documenté (AC-04)
- [ ] T002 Script de collecte et de rendu, indicateurs « non mesurés » motivés (AC-01)
- [ ] T003 Issue épinglée « Tableau de bord DevSecOps » et mise à jour hebdomadaire (AC-01, AC-05)
- [ ] T004 Seuils d'alerte et commentaire unique (AC-02)
- [ ] T005 Détection des planifiés absents (AC-03)
- [ ] T006 Ajout progressif des sources 115, 119 à 123

## Tests
- [ ] T007 Tests unitaires du script (réponses simulées, sources manquantes)
- [ ] T008 `workflow_dispatch` avec seuils de test (AC-02)

## Documentation et clôture
- [ ] T009 Documentation de lecture du rapport (128) ; retrait de `dependency-watch.yml` (avec 113)
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
