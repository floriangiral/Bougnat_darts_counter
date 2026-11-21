# Tâches — 065 Migration écran par écran vers les tokens

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) et V2-QA-05 (041) sont livrées — décision du PO du 2026-11-20 : recommandations appliquées ; V2-QA-05 (041) non livrée, écart assumé
- [x] T001 Reporter la décision de séquencement avec V2-TAB-03 (Q1) — mêmes lots que l'arène (Q1)

## Implémentation
- [x] T002 Table de correspondance validée (≈ 100 classes) — `scripts/design-tokens/palette.mjs`
- [x] T003 `scripts/migrate-colors.mjs` (hors runtime) avec rapport des cas ambigus — `scripts/design-tokens/migrate.mjs` (nom différent)
- [x] T004 Lot A : accueil, sélection, setup (AC-01, AC-02)
- [x] T005 Lot B : X01 (AC-01, AC-02)
- [x] T006 Lot C : Cricket (AC-01, AC-02)
- [x] T007 Lot D : Capital (AC-01, AC-02)
- [x] T008 Lot E : Killer et Gotcha (AC-01, AC-02)
- [x] T009 Lot F : Triathlon (AC-01, AC-02)
- [x] T010 Lot G : statistiques et modales ; Lot H : changelog (AC-01, AC-02)
- [x] T011 `matchFeedback.ts` renvoie un ton (AC-03)
- [x] T012 Verrouillage `--color-*: initial`, cliquet à 0 (AC-04) — `baseline.json` à 0, verrou dans `src/styles/tokens/bridge.css`

## Tests
- [x] T013 Convertir les assertions de `keypads.test.tsx`, `cricketScoreboard.test.tsx`, `VoiceScoringControl.test.tsx`, `matchScoring.test.ts` (AC-03)
- [ ] T014 Captures Dark par lot (AC-02) — captures à produire par V2-QA-05 (spec 041)
- [x] T015 Test CI : classe brute ajoutée → échec (AC-04) — test du cliquet sur dépôt factice (`paletteGuard.test.ts`) ; `guard:clean` en CI

## Documentation et clôture
- [x] T016 Registre de migration complet (AC-05) ; notifier V2-THEME-01 — registre complet dans `plan.md` §6 ; Light activé (068)
- [ ] T017 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — spec passée à `implementee` ; `verifie_au_commit` à renseigner et issue à fermer

## Suivi d'implémentation (2026-11-20)

Migration livrée sur `feat/v2.0.0` (issue #250) ; vérifiée au commit `24dbbab`. Verrouillage `--color-*: initial` et cliquet à 0 appliqués en clôture (T012). Restent ouverts : captures Dark (T014, spec 041), validation par le product owner et clôture de l'issue (T017).
