# Tâches — 130 Nouveau jeu « 180 Around the Clock »

> Exécutées le 2026-11-20 à la demande directe du product owner. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Demande explicite du product owner (2026-11-20) : 1 à 4 joueurs, aucune variante, égalité ex aequo

## Implémentation
- [x] T001 Domaine pur : barème, ordre des tours et des joueurs, compatibilité des anciennes volées écourtées, annulation, fin, classement, statistiques, cohérence (AC-02 à AC-05)
- [x] T002 Type de jeu `ATC180`, écran `ATC180_GAME`, plein écran, cycle de vie et historique local (AC-01)
- [x] T003 Configuration 1 à 4 joueurs, règles et résumé (AC-01)
- [x] T004 Instantané de reprise, validation et codec (AC-06)
- [x] T005 Écran de jeu sur `GameScreenLayout`, premier lanceur à deux et ordre complet à 3 ou 4, saisie TRIPLE / DOUBLE / SIMPLE / MISS, Annuler seul (bouton Passer retiré à la demande du PO le 2026-11-27 ; AC-03, AC-05)
- [x] T006 Écran de fin : classement, statistiques, score par tour, revanche (AC-04, AC-07)
- [x] T007 CSS `src/styles/games/atc180.css` (téléphone, tablette portrait, arène, téléphone paysage, bureau) et identité `game-atc180-*` Dark/Light (AC-08)
- [x] T008 Carte de sélection `game-card-atc180` dans `views/GameSelectionView.tsx`, couverte par `tests/unit/components/homeAndSelection.test.tsx` (AC-01)
- [x] T009 Entraînement solo : grille responsive des 20 tours avec score provisoire et progression (décision PO du 2026-11-27, AC-09)

## Tests
- [x] T010 Tests golden du domaine (AC-02 à AC-05)
- [x] T011 Tests de la vue, de la reprise, de la configuration, du cycle de vie, de la progression solo et du contraste (AC-03 à AC-09)
- [x] T012 E2E `tests/e2e/atc180.smoke.spec.ts` écrit (exécution en CI de la PR)
- [x] T013 Recette du contenu déployé en `7d90e54` confirmée globalement par le product owner le 27/11/2026 (AC-08) ; aucun détail d'appareil reconstitué.

## Documentation et clôture
- [x] T020 `specs/README.md`, `README.md`, `docs/specifications.md`, `docs/product-scope.md`, `docs/release/v2.0.0.md`, `docs/release/v2.0.0-coverage-map.md`
- [x] T021 Recette et preuves de production consignées, `validation: validee`, `verifie_au_commit: 7d90e54`.
- [ ] T022 Suivre le correctif tablette solo de #365, sa promotion et sa recette avant clôture définitive de #351 ; ce correctif est absent du commit de production vérifié.
