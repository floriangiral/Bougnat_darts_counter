# Tâches — 135 Mesure d'audience par jeu et par étape

## Préalables
- [x] T000 Q1 à Q5 tranchées et spec validée par le product owner (2026-11-27, recommandations retenues).

## Implémentation
- [x] T001 Fonction pure (écran, jeu) → chemin, sans donnée personnelle : `src/app/appScreenPath.ts` (AC-04).
- [x] T002 Chemin transmis à `pushState` / `replaceState` et normalisé au chargement : `src/app/useAppScreenHistory.ts` (AC-01, AC-03).
- [x] T003 Chaîne de requête et fragment conservés ; liens partenaires inchangés (AC-05).

## Tests
- [x] T004 Tests unitaires de la dérivation et du hook d'historique : `tests/unit/app/appScreenPath.test.ts`, `tests/unit/app/useAppScreenHistory.test.ts` (AC-01, AC-03, AC-04).
- [x] T005 Parcours E2E vérifiant le chemin, exécutés en CI : `tests/e2e/navigation.smoke.spec.ts`, `tests/e2e/gameplay-entry.smoke.spec.ts` (AC-01) ; [run de la PR #359](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45962187926), tête `645613d`, fusion testée `a147a0b` de même arbre. Cette preuve ne remplace ni la recette ni la CI du candidat 2.2.0.

## Documentation et clôture
- [ ] T006 Recette en préprod du candidat 2.2.0 et lecture de la dimension « Path » (AC-02). Prérequis : site de zone `bougnatdarts.fr` en « Enable with JS Snippet installation » (voir `docs/technical.md`). Suivi : [gate 2.2.0](../../docs/release/checklist.md#gate-220) et [#361](https://github.com/floriangiral/Bougnat_darts_counter/issues/361).
- [x] T007 Documentation (`docs/technical.md`), notes de la prochaine version, changelog in-app, preuves et statut `implementee`.
