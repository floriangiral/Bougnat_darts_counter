# Tâches — 090 Qualification sur TV réelles

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) ; 085/086 livrées pour la partie HDMI, 087/088 en préproduction pour la partie TV autonome
- [ ] T001 Décider du budget d'appareils et du mode démonstration

## Implémentation
- [ ] T002 Page `/tv?diag=1` : moteur, capacités, motif de test (AC-02)
- [ ] T003 Mode démonstration (si retenu) : partie enregistrée rejouée localement
- [ ] T004 Protocole Q1-Q9 et gabarit de rapport

## Campagne
- [ ] T005 Qualifier ordinateur + HDMI (Chrome, Edge, Firefox, Safari)
- [ ] T006 Qualifier Samsung 2022/2023 et LG 2022/2023 (AC-01, AC-05)
- [ ] T007 Qualifier Fire TV et Android TV (selon disponibilité)
- [ ] T008 Ouvrir les issues de correction (086/089/087) pour chaque écart

## Tests
- [ ] T009 Tests de composants de la page de diagnostic (API absentes)
- [ ] T010 Captures sur Chromium anciens en CI si une image est disponible

## Documentation et clôture
- [ ] T011 Publier la matrice dans le guide (037) (AC-03)
- [ ] T012 Transmettre la proposition de baseline à 018 (AC-04)
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
