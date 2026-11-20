# Tâches — 071 Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et la décision Q3 (2.0.0 ou 2.0.x)
- [ ] T001 Reporter les décisions Q1, Q2, Q4

## Tests d'abord
- [ ] T002 Projets Playwright réalistes sans `?mode=dedicated_tablet` (1080×750, 1280×696, 1280×800, 960×520, 1366×950) (AC-01)
- [ ] T003 Assertions de mesure : touches ≥ 48 px, pavé pleine colonne, score > seuil, 21 touches Killer, ligne Bull (AC-02 à AC-06)

## Implémentation
- [ ] T004 Élargir la classification transitoire dans `tabletLayout.ts` et mettre à jour `tests/unit/tabletLayout.test.ts:69` (AC-01)
- [ ] T005 Corriger la cascade `tailwind.css:198` vs `:535` (AC-02)
- [ ] T006 Rétablir le plancher 48 px du pavé X01 en tablette (`tailwind.css:164-167` vs `:508-512`) (AC-02)
- [ ] T007 Taille minimale du score X01 (`tailwind.css:524-528`) (AC-03)
- [ ] T008 Killer : touches atteignables (`KillerGameView.tsx:115`) (AC-04)
- [ ] T009 Cricket : ligne Bull visible (`CricketGameView.tsx:320`) (AC-05)
- [ ] T010 Boutons d'en-tête 48 × 48 px Capital/Triathlon (AC-06)

## Non-régression
- [ ] T011 E2E téléphone et bureau inchangés (AC-07)
- [ ] T012 Test terrain iPad Safari et tablette Android

## Documentation et clôture
- [ ] T013 Mettre à jour `docs/release/v2.0.0.md` (points connus) et la Révision V2 de 027
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
