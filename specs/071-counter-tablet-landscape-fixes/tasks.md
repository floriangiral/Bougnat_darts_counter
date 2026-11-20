# Tâches — 071 Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et la décision Q3 (2.0.0 ou 2.0.x) — décision du PO du 2026-11-20 : recommandations appliquées ; inclus dans la 2.0.0 (Q3)
- [x] T001 Reporter les décisions Q1, Q2, Q4

## Tests d'abord
- [ ] T002 Projets Playwright réalistes sans `?mode=dedicated_tablet` (1080×750, 1280×696, 1280×800, 960×520, 1366×950) (AC-01) — projets ajoutés ; écrit, à exécuter dans la CI de la PR
- [ ] T003 Assertions de mesure : touches ≥ 48 px, pavé pleine colonne, score > seuil, 21 touches Killer, ligne Bull (AC-02 à AC-06) — assertions écrites (Killer à la configuration par défaut, ligne Bull non mesurée) ; écrit, à exécuter dans la CI de la PR

## Implémentation
- [x] T004 Élargir la classification transitoire dans `tabletLayout.ts` et mettre à jour `tests/unit/tabletLayout.test.ts:69` (AC-01) — remplacé par le résolveur de 070 (Q1) ; `tests/unit/tabletLayout.test.ts` supprimé
- [x] T005 Corriger la cascade `tailwind.css:198` vs `:535` (AC-02) — règle bureau limitée à `[data-layout='default']`
- [x] T006 Rétablir le plancher 48 px du pavé X01 en tablette (`tailwind.css:164-167` vs `:508-512`) (AC-02)
- [x] T007 Taille minimale du score X01 (`tailwind.css:524-528`) (AC-03) — plancher `--x01-score-floor`
- [x] T008 Killer : touches atteignables (`KillerGameView.tsx:115`) (AC-04)
- [x] T009 Cricket : ligne Bull visible (`CricketGameView.tsx:320`) (AC-05)
- [x] T010 Boutons d'en-tête 48 × 48 px Capital/Triathlon (AC-06) — `IconButton` 48 × 48 px en tablette

## Non-régression
- [ ] T011 E2E téléphone et bureau inchangés (AC-07) — comparaison au commit 508dfa6 à faire (captures spec 041)
- [ ] T012 Test terrain iPad Safari et tablette Android — recette terrain à faire

## Documentation et clôture
- [x] T013 Mettre à jour `docs/release/v2.0.0.md` (points connus) et la Révision V2 de 027 — `docs/release/v2.0.0.md` et Révision V2 de 027 mis à jour
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — spec passée à `implementee` ; `verifie_au_commit` à renseigner et issue à fermer

## Suivi d'implémentation (2026-11-20)

Correctifs livrés sur `feat/v2.0.0` (issue #209) ; commit de vérification à renseigner. Restent ouverts : exécution des E2E dans la CI de la PR (T002, T003), non-régression comparée (T011), recette terrain (T012), validation par le product owner et clôture de l'issue (T014).
