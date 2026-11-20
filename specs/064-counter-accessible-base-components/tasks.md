# Tâches — 064 Composants de base accessibles (focus visible, états, cibles 48 px)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée (sauf T001-T002 si Q1 = Lot 0)

## Implémentation
- [ ] T001 Remplacer `focus:outline-none` par `focus-visible:` (Button et 6 occurrences) (AC-01, AC-02)
- [ ] T002 Supprimer `releaseButtonFocus` de `CricketKeypad.tsx` (AC-02)
- [ ] T003 Ajouter variantes `keypad`/`success`, prop `tone`, états unifiés dans `Button.tsx` (AC-03)
- [ ] T004 Créer `IconButton`, `Surface`, `BrandMark` (AC-04)
- [ ] T005 Migrer `Keypad`, `CricketKeypad`, `CapitalKeypad`, `VoiceScoringControl` et supprimer les `!` (AC-03)
- [ ] T006 Porter le plancher tactile dans le composant, en coordination avec V2-TAB-02 (AC-04, AC-05)
- [ ] T007 Remplacer les duplications du mot-symbole par `BrandMark` (AC-06)

## Tests
- [ ] T008 Tests unitaires des variantes/tons (attributs `data-tone`, `aria-pressed`) (AC-03)
- [ ] T009 Adapter `keypads.test.tsx:106` et `VoiceScoringControl.test.tsx` (AC-03)
- [ ] T010 E2E navigation clavier X01 + axe-core (AC-01)
- [ ] T011 E2E mesure des cibles sur profils tablette/téléphone réalistes (AC-04, AC-05)
- [ ] T012 Captures Dark V2-QA-05 (AC-06)

## Documentation et clôture
- [ ] T013 Guide des composants et notes de release
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
