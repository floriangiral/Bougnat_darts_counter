# Tâches — 104 Défi du comptoir

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que V2-ARCH-04 (058) et la validation unique des totaux (057/054) sont livrées, et que Q1, Q2, Q4, Q7 sont tranchées

## Implémentation
- [ ] T001 Créer le domaine `src/domain/challenge/` : définition, reducer de tentative, classement, expiration (AC-02, AC-03, AC-04, AC-06)
- [ ] T002 Créer le port `ChallengeRepository` et les cas d'usage (AC-05, AC-06)
- [ ] T003 Implémenter le store `challenges` (IndexedDB v2 + repli localStorage) et la migration additive (AC-05, AC-09)
- [ ] T004 Créer les écrans création, défi et tentative ; entrée secondaire (AC-01, AC-07, AC-08)
- [ ] T005 Purger les défis expirés au démarrage (AC-06)
- [ ] T006 Ajouter confirmation et code local facultatif pour effacer/terminer (FR-09)

## Tests
- [ ] T010 Tests unitaires du domaine et des cas d'usage (AC-02, AC-03, AC-04, AC-06)
- [ ] T011 Test de migration IndexedDB v1 → v2 (AC-09)
- [ ] T012 Tests de composants (AC-07)
- [ ] T013 Tests E2E : création, tentative, reprise, parcours de base inchangé (AC-01, AC-02, AC-05, AC-08)
- [ ] T014 Pilote terrain dans un lieu, sur autorisation (Q7)

## Documentation et clôture
- [ ] T020 Mettre à jour le guide lieux, `README.md`, `docs/product-scope.md`, notes de release
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
