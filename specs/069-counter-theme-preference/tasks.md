# Tâches — 069 Préférence de thème (système, sombre, clair)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée — décision du PO du 2026-11-20 : recommandations appliquées ; 063 livrée dans le même chantier
- [x] T001 Reporter les décisions Q1 à Q4

## Implémentation
- [x] T002 Module pur de préférence (type, validation, résolution) (AC-06)
- [x] T003 Stockage protégé `bougnat-theme-v1` (AC-02, AC-06)
- [x] T004 Application DOM (`data-theme`, `color-scheme`, `theme-color`) + écoute système (AC-03, AC-04) — `color-scheme` porté par `themes.css`
- [x] T005 Script inline anti-flash dans `index.html` (AC-01, AC-02)
- [x] T006 `ThemeSelector` + hook ; intégration accueil et options de partie derrière le drapeau Light (AC-05)

## Tests
- [x] T007 Tests unitaires : table de vérité de résolution, valeurs corrompues (AC-06)
- [x] T008 E2E Chromium/WebKit : premier rendu, rechargement, changement système (AC-01 à AC-04) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).
- [x] T009 E2E : sélecteur absent si Light désactivé (AC-05) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).
- [x] T010 Vérification terrain iOS/Android (barre d'état, barre d'adresse) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).

## Documentation et clôture
- [x] T011 Notes de release, documentation technique de la clé — notes v2.0.0, `docs/design-system.md` §6, `docs/technical.md`
- [x] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — commit `24dbbab`, issue #237 fermée

## Suivi d'implémentation (2026-11-20)

Préférence de thème livrée sur `feat/v2.0.0` et vérifiée au commit `24dbbab` ; #237 est fermée. Restent les E2E en CI (T008) et la vérification terrain (T010), suivis dans #354.


## Bilan de clôture (2026-11-27)

Recette du périmètre livré validée par le product owner ; preuves et transferts détaillés dans [spec.md](spec.md#clôture-2026-11-27). Les tâches non cochées ci-dessus sont conservées pour la traçabilité et ne sont pas déclarées exécutées.
