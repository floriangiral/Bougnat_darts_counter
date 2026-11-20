# Tâches — 121 Knip

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q3 tranchées, 113 livrée

## Implémentation
- [ ] T001 Installer Knip en dépendance de développement et ajouter les scripts (FR-01, FR-02)
- [ ] T002 Rédiger `knip.json` (entrées non standard, greffons, exclusions justifiées) (AC-03)
- [ ] T003 Job hebdomadaire, artefact, résumé, issue « Dette Knip » (AC-02)
- [ ] T004 PR dédiées pour `autoprefixer` et `qrcode` après confirmation (AC-04)
- [ ] T005 Option Q2 : contrôle PR des nouvelles dépendances inutilisées

## Tests
- [ ] T006 Branche jetable avec dépendance inutilisée (AC-01)
- [ ] T007 Revue du rapport initial : aucun faux positif sur les entrées déclarées (AC-03)

## Documentation et clôture
- [ ] T008 Documenter la procédure de nettoyage dans `AGENTS.md` et la documentation CI
- [ ] T009 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
