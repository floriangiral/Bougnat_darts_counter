# Tâches — 052 X01 : 3 à 4 joueurs en simple

> Spec implémentée le 2026-11-20 (questions ouvertes tranchées par le product owner selon les recommandations). Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée, que la spec 015 est révisée (Q1), que Q2 et Q3 sont tranchées et que la spec 072 est livrée

## Implémentation
- [x] T001 Bornes X01 simple 1-4 et robot limité à 2 joueurs (AC-01)
- [x] T002 Remplacer `teams[0]/teams[1]` par la liste des joueurs dans `MatchView` (AC-02, AC-03) — chantier écran de match X01
- [x] T003 Blocs joueurs N via la disposition de la spec 072 (AC-03) — chantier écran de match X01
- [x] T004 Statistiques N colonnes (AC-04)
- [x] T005 Écran de victoire (chantier écran de match X01) et classement de fin (`StatsView`, RM-03)

## Tests
- [x] T010 Tests setup (bornes, robot) (AC-01)
- [x] T011 Tests moteur rotation à 3 et 4 joueurs (AC-02)
- [x] T012 E2E 4 joueurs (`tests/e2e/x01-four-players.smoke.spec.ts`, exécuté en CI) — captures tablette/téléphone à produire (AC-03)
- [ ] T013 Régression visuelle 2 joueurs (AC-05)

## Documentation et clôture
- [x] T020 Mettre à jour README, `docs/specifications.md` — notes de version par le coordinateur
- [x] T021 Passer la spec à `implementee` — `verifie_au_commit` et fermeture de l'issue #280 par le coordinateur
