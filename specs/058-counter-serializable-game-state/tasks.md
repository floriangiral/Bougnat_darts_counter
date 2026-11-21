# Tâches — 058 État de partie sérialisable et reducer pur par jeu

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que la spec 039 couvre le jeu à migrer et que la spec 057 est livrée avant l'étape X01

## Implémentation
- [ ] T001 Créer `GameSetup`, `GameRuntimeSnapshot` et le hook `useGameSession` (annulation bornée, publication) (AC-04, AC-05)
- [ ] T002 Migrer Gotcha (état + reducer + vue) (AC-01, AC-02, AC-03)
- [ ] T003 Migrer Killer (AC-01, AC-02, AC-03, AC-05)
- [ ] T004 Migrer Capital (reducer déplacé dans `src/domain/capital/`) (AC-01, AC-02, AC-03)
- [ ] T005 Migrer Cricket (regroupement des états, enchaînements dans le reducer) (AC-01 à AC-04)
- [ ] T006 Migrer X01 sur la commande de la spec 057 (AC-01, AC-02, AC-03)
- [ ] T007 Migrer Triathlon (état composite) (AC-01, AC-02, AC-03)
- [ ] T008 Remplacer le `MatchState` porteur par `GameSetup` dans `useGameLifecycle` (AC-07)
- [ ] T009 Retirer des exclusions de couverture chaque vue migrée (coordination spec 029)

## Tests
- [ ] T010 Tests de sérialisation et de gel profond par jeu (AC-01, AC-06)
- [ ] T011 Tests de composant par vue avec état fourni (AC-03)
- [ ] T012 Test d'intégration `App` : snapshot publié pour chaque jeu (AC-04)

## Documentation et clôture
- [ ] T013 Mettre à jour `docs/architecture.md` et le statut de l'ADR-0001
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
