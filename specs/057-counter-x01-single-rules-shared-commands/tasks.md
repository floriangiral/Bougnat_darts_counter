# Tâches — 057 Règles X01 uniques et commandes partagées

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`), que la spec 039 (V2-QA-01) fournit les golden tests X01 et que Q1 à Q4 sont tranchées

## Implémentation
- [ ] T001 Écrire un test d'immutabilité qui échoue sur `finishLeg` (fin de manche, fin de set, fin de match) (AC-03)
- [ ] T002 Corriger la mutation de `legsWon`/`setsWon` dans `src/application/scoring/matchLifecycle.ts` (AC-03)
- [ ] T003 Créer `src/domain/x01/rules.ts` et rediriger les copies existantes par ré-export (AC-01)
- [ ] T004 Créer `src/domain/x01/commands.ts` (`applyX01Command`, `X01Command`, `X01Outcome`) (AC-02, AC-06)
- [ ] T005 Brancher keypad et raccourcis rapides sur la commande (AC-06)
- [ ] T006 Brancher RESTE et corriger la garde `views/MatchView.tsx:429` (AC-05)
- [ ] T007 Brancher le robot (score candidat) et supprimer l'import `features/` de `x01BotTurn.ts` (AC-04, AC-07)
- [ ] T008 Brancher la proposition vocale validée selon la décision Q2, en coordination avec la spec 003 (AC-02)
- [ ] T009 Supprimer les copies de règles devenues inutiles (AC-01)

## Tests
- [ ] T010 Tests unitaires : table de vérité des règles et commandes par source (AC-01, AC-02, AC-04)
- [ ] T011 Tests de composant `MatchView` : keypad, RESTE, raccourci checkout, voix simulée (AC-02, AC-05)
- [ ] T012 Rejouer la suite golden X01 et les E2E X01/partenaire (AC-06)

## Documentation et clôture
- [ ] T013 Mettre à jour `docs/architecture.md` (moteur X01) et le statut de l'ADR-0002
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
