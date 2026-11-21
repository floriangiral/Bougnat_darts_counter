# Tâches — 043 Durcissement de la CI

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que Q1-Q5 sont tranchées
- [ ] T001 Exécuter localement `lint:type-aware`, `guard:clean`, `wrangler:check`, `governance:coverage` et corriger la dette éventuelle avant activation

## Implémentation
- [ ] T002 Ajouter `guard:clean`, `wrangler:check`, `governance:coverage`, `lint:type-aware` au job `validate` (AC-01, AC-02)
- [ ] T003 Rendre la garde robuste à l'absence de `rg` (`git grep` ou contrôle explicite) (AC-06)
- [ ] T004 Déclencher les E2E sur PR vers `develop` et chaque nuit (AC-03)
- [ ] T005 Serveur unique, `--strictPort`, journal en `$RUNNER_TEMP` publié en artefact (AC-05)
- [ ] T006 Résumé de couverture lisant les seuils à la source (AC-04)
- [ ] T007 Signaler les tests « flaky » dans le résumé E2E (FR-07)
- [ ] T008 Calcul de couverture unique partagé entre baseline et Sonar (FR-08)
- [ ] T009 Ignorer proprement Sonar/Snyk sans secret (forks, Dependabot) (AC-07)

## Tests
- [ ] T010 PR de démonstration : fichier legacy réintroduit, exclusion non documentée, port occupé (AC-01, AC-02, AC-05)
- [ ] T011 Observer une exécution nocturne et une PR de fork de test (AC-03, AC-07)
- [ ] T012 Mesurer la durée ajoutée au job `validate` (NFR-01)

## Documentation et clôture
- [ ] T013 Aligner `CONTRIBUTING.md` « Vérification minimale » (FR-10)
- [ ] T014 Ajouter la note de validation CI datée à la spec 029 (AC-08)
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Révision DevSecOps — tâches proposées

- [ ] T-DSO-01 Notification des échecs planifiés (issue unique par workflow) appliquée aux planifiés existants (DSO-AC-01)
- [ ] T-DSO-02 Aligner les déclencheurs E2E sur la branche cible décidée en 113 Q1
- [ ] T-DSO-03 Vérifier qu'aucun nom de check requis n'est modifié (DSO-AC-02)
