# Tâches — 130 Nouveau jeu « 180 Around the Clock »

> Exécutées le 2026-11-20 à la demande directe du product owner. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Demande explicite du product owner (2026-11-20) : 1 à 4 joueurs, aucune variante, égalité ex aequo

## Implémentation
- [x] T001 Domaine pur : barème, ordre des tours et des joueurs, Passer, annulation, fin, classement, statistiques, cohérence (AC-02 à AC-05)
- [x] T002 Type de jeu `ATC180`, écran `ATC180_GAME`, plein écran, cycle de vie et historique local (AC-01)
- [x] T003 Configuration 1 à 4 joueurs, règles et résumé (AC-01)
- [x] T004 Instantané de reprise, validation et codec (AC-06)
- [x] T005 Écran de jeu sur `GameScreenLayout`, « Qui commence ? », saisie TRIPLE / DOUBLE / SIMPLE / MISS, Annuler | Passer (AC-03, AC-05)
- [x] T006 Écran de fin : classement, statistiques, score par tour, revanche (AC-04, AC-07)
- [x] T007 CSS `src/styles/games/atc180.css` (téléphone, tablette portrait, arène, téléphone paysage, bureau) et identité `game-atc180-*` Dark/Light (AC-08)
- [x] T008 Carte de sélection `game-card-atc180` dans `views/GameSelectionView.tsx`, couverte par `tests/unit/components/homeAndSelection.test.tsx` (AC-01)

## Tests
- [x] T010 Tests golden du domaine (AC-02 à AC-05)
- [x] T011 Tests de la vue, de la reprise, de la configuration, du cycle de vie et du contraste (AC-03 à AC-07)
- [x] T012 E2E `tests/e2e/atc180.smoke.spec.ts` écrit (exécution en CI de la PR)
- [ ] T013 Recette terrain Dark/Light, téléphone, tablette portrait/paysage, bureau (AC-08)

## Documentation et clôture
- [x] T020 `specs/README.md`, `README.md`, `docs/specifications.md`, `docs/product-scope.md`, `docs/release/v2.0.0.md`, `docs/release/v2.0.0-coverage-map.md`
- [ ] T021 Issue #351 créée ; après recette, actualiser `verifie_au_commit` et passer `validation` à `validee`
