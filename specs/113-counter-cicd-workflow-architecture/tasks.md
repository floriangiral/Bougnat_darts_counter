# Tâches — 113 Architecture des workflows GitHub Actions et fréquences des contrôles

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (statut `validee`), que Q1 à Q5 sont tranchées et que 043 est livrée
- [ ] T001 Exporter la configuration actuelle du ruleset `main` (JSON) pour le rollback

## Implémentation
- [ ] T002 Restructurer `quality-gate.yml` en `ci.yml` : installation unique, couverture et build partagés par artefact (AC-05)
- [ ] T003 Fusionner `security-review.yml` et `secret-scan.yml` en `security.yml`, permissions au niveau job (AC-04)
- [ ] T004 `e2e.yml` : jobs `e2e-critique` et `e2e-complet`, nightly, `retention-days` (AC-02, AC-06) — job critique ajouté ; nightly, rétention et migration des checks restent à finaliser.
- [x] T005 Marquer `@critique` les parcours de base et le lien externe `v=1` (AC-06)
- [ ] T006 Créer l'action de notification d'échec planifié et l'appliquer à tous les planifiés (AC-03)
- [x] T007 Corriger les permissions de niveau workflow de `secret-scan.yml` et `issue-auto-label.yml` (AC-04)
- [x] T008 Vérifier la version de npm après installation globale dans `setup-ci-app` (FR-05)
- [ ] T009 Retirer `dependency-watch.yml` une fois le Dependency Dashboard actif (FR-01, après 116)

## Tests
- [ ] T010 PR jetables : succès, échec unitaire, échec E2E critique ; deux pushes rapprochés (annulation)
- [ ] T011 Échec simulé d'un planifié par `workflow_dispatch` puis relance réussie (AC-03)
- [ ] T012 PR depuis un fork de test (AC-07)
- [ ] T013 Mesurer et consigner le temps runner par push (AC-08)

## Documentation et clôture
- [ ] T014 Publier le catalogue et la matrice dans la documentation CI (AC-01, via 128)
- [ ] T015 Migrer les checks requis en deux temps avec 115 (opération manuelle)
- [ ] T016 Ajouter la note de validation CI datée à la spec 029
- [ ] T017 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
