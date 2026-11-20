# Tâches — 122 Étude-pilote StrykerJS

> À exécuter uniquement après validation de la spec. Chaque tâche référence le protocole (§8) de l'étude.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q5 tranchées, 039 avancée (golden tests)

## Pilote
- [ ] T001 Créer la branche d'étude et installer Stryker et le lanceur Vitest (§8.1)
- [ ] T002 Vérifier la compatibilité avec Vitest 5 et les tests `jsdom` (Q5)
- [ ] T003 Exécuter sur `utils/cricketLogic.ts`, puis sur le périmètre B ; mesurer durée et mémoire (§8.2)
- [ ] T004 Mutation volontaire d'une règle X01 sur branche jetable : vérifier qu'un test la tue (§8.3)
- [ ] T005 Analyser 20 mutants survivants (§8.4)

## Restitution
- [ ] T006 Rédiger le rapport de pilote et transmettre les tests à renforcer à 039 (§9)
- [ ] T007 Proposer une spec fonctionnelle ou l'abandon (§9)
- [ ] T008 Passer l'étude à `cloturee` après arbitrage, fermer l'issue
