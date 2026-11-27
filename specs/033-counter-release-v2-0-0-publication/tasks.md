# Tâches — 033 Clôture et publication de la release 2.0.0

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

> **Suivi du 2026-11-27 :** ce plan historique vise la 2.0.0, qui n'a été ni taguée ni publiée ; son contenu a été repris dans la GitHub Release 2.1.0, non promue en production. La production reste en 1.1.4. La 2.2.0 est en préparation, ni taguée ni promue en production : voir sa [gate](../../docs/release/checklist.md#gate-220) et [#361](https://github.com/floriangiral/Bougnat_darts_counter/issues/361). La spec 033 reste `a-valider` ; ce suivi ne tranche pas ses questions ouvertes.

## Préalables
- [ ] T000 Vérifier que la spec est validée et que V2-INT-01 (030), V2-DOC-01 (034), V2-QA-10 (043, C1/C2/C9), V2-GAMES-01 (045), V2-GAMES-02 (046) sont clos
- [ ] T001 Obtenir les décisions Q1 à Q6 (notamment séquencement 031 et Double/Master-In)

## Implémentation
- [ ] T002 Rédiger la checklist « Gate 2.0.0 » réutilisable (AC-01)
- [ ] T003 Rédiger le runbook post-release et de retour arrière, reliquat 007 (AC-01, AC-08)
- [ ] T004 Geler `release/v2.0.0` et fusionner `feat/v2.0.0` (PR #203)
- [ ] T005 Exécuter `ci:check`, `lint:type-aware`, `test:unit:coverage`, `governance:coverage` ; archiver les sorties (AC-01)
- [ ] T006 Confirmer SonarCloud Quality Gate et Snyk sur la PR de release (AC-03)
- [ ] T007 Promouvoir en preprod (workflow « Deploy Preview »)
- [ ] T008 Mettre à jour notes 2.0.0, coverage map, bandeaux v1.1.x, date du changelog in-app (AC-06)
- [ ] T009 Fusionner vers `main`, promouvoir en production, taguer `v2.0.0`, créer la GitHub Release (AC-05)

## Tests
- [ ] T010 Suite E2E complète 7 projets avec prérequis documentés ; rapport archivé (AC-02)
  - Le [run CI E2E](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45962187926) de la PR #359 a réussi : 145 tests passés, 8 ignorés, sur la fusion `a147a0b` de même arbre que la tête `645613d`. Cette preuve ne clôt ni T010 ni la gate 2.2.0, dont le commit candidat reste à fixer.
- [ ] T011 Validations manuelles 025 : undo/revanche/retour setup, voix, PWA (si incluse), Safari/iOS, preview (AC-04)
- [ ] T012 Parcours partenaire en preprod avec le simulateur ; essai badarts.fr si autorisé (AC-07)
- [ ] T013 Test de rollback : session 2.0.0 relue par 1.1.x sans erreur

## Documentation et clôture
- [ ] T014 Statuts : 030 `implementee`, 025/026 `cloturee`, 007 remplacée ; reliquats transférés (AC-08)
- [ ] T015 Suivi J+1 et J+7 selon le runbook ; consigner le bilan
- [ ] T016 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
