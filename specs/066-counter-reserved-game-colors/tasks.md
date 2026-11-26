# Tâches — 066 Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée — décision du PO du 2026-11-20 : recommandations appliquées ; 063 livrée dans le même chantier
- [x] T001 Reporter les décisions Q1 (Capital) et Q3 (contraste)

## Implémentation
- [x] T002 Rôles `game-*` Dark dans les tokens (AC-05) — Dark et Light
- [x] T003 `matchFeedback.ts` → fonction de ton pure (AC-02)
- [x] T004 Supprimer le style inline `#d90416` de `CricketKeypad.tsx` (AC-02)
- [x] T005 Aligner `CapitalKeypad.tsx` sur la convention (si Q1) (AC-01)
- [x] T006 Attributs `data-tone`/`data-multiplier`/`data-state` (AC-01)
- [x] T007 Contraste score et nom inactifs `PlayerScore.tsx` (AC-03) — `game-score-inactive` ≥ 4,5:1
- [x] T008 Indices de forme vérifiés pour chaque état (AC-04) — indices de forme en place ; revue en niveaux de gris : voir T012

## Tests
- [x] T009 Tests unitaires de tons par jeu (AC-01)
- [x] T010 Test unitaire de la fonction de ton du feedback (AC-02)
- [ ] T011 E2E axe-core contraste X01 2 joueurs (AC-03) — dépend de V2-QA-05 (spec 041)
- [ ] T012 Revue des captures en niveaux de gris (AC-04) — revue des captures à faire

## Documentation et clôture
- [x] T013 Publier la convention (AC-05) ; notes de release — `docs/design-system.md` §3, notes v2.0.0
- [x] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — commit `24dbbab`, issue #228 fermée

## Suivi d'implémentation (2026-11-20)

Couleurs métier livrées sur `feat/v2.0.0` et vérifiées au commit `24dbbab` ; #228 est fermée. Restent l'E2E axe-core (T011) et la revue en niveaux de gris (T012), suivis dans #354.
