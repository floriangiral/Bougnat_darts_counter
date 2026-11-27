# Tâches — 135 Mesure d'audience par jeu et par étape

> Ne pas exécuter avant validation explicite de la spec.

## Préalables
- [ ] T000 Faire trancher Q1 à Q5 et passer la spec à `validee`.

## Implémentation
- [ ] T001 Fonction pure (écran, jeu) → chemin, sans donnée personnelle (AC-04).
- [ ] T002 Chemin transmis à `pushState` / `replaceState` et normalisé au chargement (AC-01, AC-03).
- [ ] T003 Chaîne de requête et fragment conservés ; liens partenaires inchangés (AC-05).

## Tests
- [ ] T004 Tests unitaires de la dérivation et du hook d'historique (AC-01, AC-03, AC-04).
- [ ] T005 Parcours E2E vérifiant `location.pathname`, exécuté en CI (AC-01).

## Documentation et clôture
- [ ] T006 Recette en préprod et lecture de la dimension « Path » (AC-02).
- [ ] T007 Documentation, notes de release, changelog in-app, preuves et statut.
