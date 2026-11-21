# Tâches — 095 Import du logo du club

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 093 est livrée et que Q1 à Q5 sont tranchées
- [ ] T001 Vérifier sur appareils cibles (018) : `createImageBitmap`, `toBlob('image/webp')`, Blob en IndexedDB

## Implémentation
- [ ] T002 Parseur pur `imageHeader.ts` : signatures, dimensions, bornes (AC-02, AC-03, AC-04, AC-06)
- [ ] T003 `logoProcessor.ts` : décodage borné, canvas, réencodage itératif, SHA-256 (AC-01, AC-05)
- [ ] T004 Store `logos` et repli `ArrayBuffer` (AC-01)
- [ ] T005 Composant `ClubLogo` : URL `blob:`, révocation, pastille automatique (AC-08)
- [ ] T006 Section logo de l'éditeur : import, erreurs typées, retrait
- [ ] T007 Exposer `normalizeLogo(bytes, profile)` pour 096 et 098 (AC-07)

## Tests
- [ ] T008 Fixtures binaires et tests unitaires du parseur (AC-02, AC-03, AC-04, AC-06)
- [ ] T009 Tests navigateur du traitement et de la suppression EXIF (AC-01, AC-05)
- [ ] T010 E2E : import réussi, échecs, absence de SVG/HTML importé dans le DOM (AC-08)

## Documentation et clôture
- [ ] T011 Documenter formats, bornes et conseils d'export dans le guide utilisateur
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
