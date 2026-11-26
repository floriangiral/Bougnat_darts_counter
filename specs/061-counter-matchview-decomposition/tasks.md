# Tâches proposées — 061 Découpage de MatchView

> Toutes les tâches ci-dessous sont futures et restent décochées. À exécuter uniquement après validation de 061 et arbitrage de ses questions ; 022 est déjà clôturée et 070/072 sont déjà implémentées.

## Préalables

- [ ] T000 Faire arbitrer Q1, Q2 et Q4 à Q6 ; vérifier la livraison de 057 et coordonner les interfaces X01 avec 058.
- [ ] T001 Dresser la carte des responsabilités et des tests existants de `MatchView`, `App`, `SetupView` et Triathlon ; caractériser uniquement les lacunes pertinentes (AC-01, AC-02).
- [ ] T002 Mesurer les rendus X01 seul et dans Triathlon et les écritures ; choisir des critères selon Q5, sans présumer une amélioration (AC-05).

## Implémentation éventuelle

- [ ] T003 Si retenu, isoler la planification robot et stabiliser ses dépendances, y compris le callback du stub ; préserver délais et nettoyage (AC-03).
- [ ] T004 Si retenu, isoler la transition de manche et caractériser sa réinitialisation à la reprise (AC-01, AC-04).
- [ ] T005 Si retenu, isoler l'orchestration voix/saisie en conservant consentement, confirmation et remise à zéro (AC-04).
- [ ] T006 Simplifier la composition résiduelle en réutilisant les composants déjà extraits ; conserver `useViewport` et les recettes 070/072 (AC-01, AC-06).
- [ ] T007 Selon Q4, clarifier l'orchestration session/partenaire d'`App` sans dupliquer les modules existants ; préserver les props utilisées par Triathlon (AC-04, AC-07).
- [ ] T008 Coordonner avec 056 toute suppression du stub partagé ou de ses props ; ne pas confondre ce stub avec le lien partenaire (AC-04).

## Tests

- [ ] T009 Compléter les tests de robot sous tics/rerendus, démontage et changement de tour, ainsi que les tests de transition et de voix manquants (AC-02, AC-03, AC-04).
- [ ] T010 Vérifier snapshots, reprise, partenaire et les deux phases X01 de Triathlon, sans doublon ni écriture sur un tic seul (AC-04, AC-05, AC-07).
- [ ] T011 Rejouer les E2E/smoke X01, partenaire, Triathlon et formats adaptatifs en CI uniquement ; aucune exécution locale (AC-06).

## Documentation et clôture futures

- [ ] T012 Mettre à jour la documentation d'architecture et, si nécessaire, `AGENTS.md` ; traiter toute modification de politique Sonar dans une PR dédiée.
- [ ] T013 Après livraison et vérification, renseigner le commit, le statut et les tâches de 061 et suivre l'issue #253 selon les conventions.
