# Tâches — 069 Préférence de thème (système, sombre, clair)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée
- [ ] T001 Reporter les décisions Q1 à Q4

## Implémentation
- [ ] T002 Module pur de préférence (type, validation, résolution) (AC-06)
- [ ] T003 Stockage protégé `bougnat-theme-v1` (AC-02, AC-06)
- [ ] T004 Application DOM (`data-theme`, `color-scheme`, `theme-color`) + écoute système (AC-03, AC-04)
- [ ] T005 Script inline anti-flash dans `index.html` (AC-01, AC-02)
- [ ] T006 `ThemeSelector` + hook ; intégration accueil et options de partie derrière le drapeau Light (AC-05)

## Tests
- [ ] T007 Tests unitaires : table de vérité de résolution, valeurs corrompues (AC-06)
- [ ] T008 E2E Chromium/WebKit : premier rendu, rechargement, changement système (AC-01 à AC-04)
- [ ] T009 E2E : sélecteur absent si Light désactivé (AC-05)
- [ ] T010 Vérification terrain iOS/Android (barre d'état, barre d'adresse)

## Documentation et clôture
- [ ] T011 Notes de release, documentation technique de la clé
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
