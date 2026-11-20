# Tâches — 064 Composants de base accessibles (focus visible, états, cibles 48 px)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée (sauf T001-T002 si Q1 = Lot 0) — décision du PO du 2026-11-20 : recommandations appliquées ; 063 livrée dans le même chantier

## Implémentation
- [x] T001 Remplacer `focus:outline-none` par `focus-visible:` (Button et 6 occurrences) (AC-01, AC-02) — focus visible global, 0 `focus:outline-none`
- [x] T002 Supprimer `releaseButtonFocus` de `CricketKeypad.tsx` (AC-02)
- [x] T003 Ajouter variantes `keypad`/`success`, prop `tone`, états unifiés dans `Button.tsx` (AC-03)
- [ ] T004 Créer `IconButton`, `Surface`, `BrandMark` (AC-04) — `IconButton` créé ; `Surface` et `BrandMark` non créés
- [x] T005 Migrer `Keypad`, `CricketKeypad`, `CapitalKeypad`, `VoiceScoringControl` et supprimer les `!` (AC-03)
- [x] T006 Porter le plancher tactile dans le composant, en coordination avec V2-TAB-02 (AC-04, AC-05) — classe `bd-touch-target`
- [ ] T007 Remplacer les duplications du mot-symbole par `BrandMark` (AC-06) — `BrandMark` non livré

## Tests
- [x] T008 Tests unitaires des variantes/tons (attributs `data-tone`, `aria-pressed`) (AC-03)
- [x] T009 Adapter `keypads.test.tsx:106` et `VoiceScoringControl.test.tsx` (AC-03)
- [ ] T010 E2E navigation clavier X01 + axe-core (AC-01) — dépend de V2-QA-05 (spec 041)
- [ ] T011 E2E mesure des cibles sur profils tablette/téléphone réalistes (AC-04, AC-05) — écrit, à exécuter dans la CI de la PR
- [ ] T012 Captures Dark V2-QA-05 (AC-06) — captures à produire par V2-QA-05 (spec 041)

## Documentation et clôture
- [x] T013 Guide des composants et notes de release — `docs/design-system.md` §4, notes v2.0.0
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — spec passée à `implementee` ; `verifie_au_commit` à renseigner et issue à fermer

## Suivi d'implémentation (2026-11-20)

Composants de base livrés sur `feat/v2.0.0` (issue #231) ; commit de vérification à renseigner. Restent ouverts : `Surface` et `BrandMark` (T004, T007), E2E clavier + axe-core et captures (T010, T012, spec 041), exécution des E2E de mesure dans la CI de la PR (T011), validation par le product owner et clôture de l'issue (T014).
