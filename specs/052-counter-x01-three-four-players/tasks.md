# Tâches — 052 X01 : 3 à 4 joueurs en simple

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que la spec 015 est révisée (Q1), que Q2 et Q3 sont tranchées et que la spec 072 est livrée

## Implémentation
- [ ] T001 Bornes X01 simple 1-4 et robot limité à 2 joueurs (AC-01)
- [ ] T002 Remplacer `teams[0]/teams[1]` par la liste des joueurs dans `MatchView` (AC-02, AC-03)
- [ ] T003 Blocs joueurs N via la disposition de la spec 072 (AC-03)
- [ ] T004 Statistiques N colonnes (AC-04)
- [ ] T005 Écran de victoire et classement (RM-03)

## Tests
- [ ] T010 Tests setup (bornes, robot) (AC-01)
- [ ] T011 Tests moteur rotation à 3 et 4 joueurs (AC-02)
- [ ] T012 E2E 4 joueurs + captures tablette/téléphone (AC-03)
- [ ] T013 Régression visuelle 2 joueurs (AC-05)

## Documentation et clôture
- [ ] T020 Mettre à jour README, `docs/specifications.md`, notes de version
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
