# Tâches — 043 Durcissement de la CI

> Spec validée le 2026-11-23 ; implémentation au commit `7bdb292`. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (statut `validee`) et que Q1-Q5 sont tranchées
- [x] T001 Exécuter localement `lint:type-aware`, `guard:clean`, `wrangler:check`, `governance:coverage` et corriger la dette éventuelle avant activation — aucune dette (0 avertissement type-aware)

## Implémentation
- [x] T002 Ajouter `guard:clean`, `wrangler:check`, `governance:coverage`, `lint:type-aware` au job `validate` (AC-01, AC-02)
- [x] T003 Rendre la garde robuste à l'absence de `rg` (`git grep` ou contrôle explicite) (AC-06)
- [x] T004 Déclencher les E2E sur PR vers `develop` et chaque nuit (AC-03) — aussi `main` (T-DSO-02)
- [x] T005 Serveur unique, `--strictPort`, journal en `$RUNNER_TEMP` publié en artefact (AC-05)
- [x] T006 Résumé de couverture lisant les seuils à la source (AC-04)
- [x] T007 Signaler les tests « flaky » dans le résumé E2E (FR-07)
- [x] T008 Calcul de couverture unique partagé entre baseline et Sonar (FR-08)
- [x] T009 Ignorer proprement Sonar/Snyk sans secret (forks, Dependabot) (AC-07) — partie Sonar ici ; partie Snyk livrée par la PR « ci(security-review): reconfigurer Snyk »

## Tests
- [ ] T010 PR de démonstration : fichier legacy réintroduit, exclusion non documentée, port occupé (AC-01, AC-02, AC-05) — vérifié en local (garde, gouvernance, port occupé) ; exécution GitHub à faire
- [ ] T011 Observer une exécution nocturne et une PR de fork de test (AC-03, AC-07) — exige les workflows sur `main` et un fork
- [ ] T012 Mesurer la durée ajoutée au job `validate` (NFR-01) — environ 25 s en local ; mesure GitHub à faire

## Documentation et clôture
- [x] T013 Aligner `CONTRIBUTING.md` « Vérification minimale » (FR-10)
- [x] T014 Ajouter la note de validation CI datée à la spec 029 (AC-08)
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — statut et commit renseignés ; issue #212 à fermer après les observations GitHub

## Révision DevSecOps — tâches

- [x] T-DSO-01 Notification des échecs planifiés (issue unique par workflow) appliquée aux planifiés existants (DSO-AC-01) — observation d'un échec réel à faire
- [x] T-DSO-02 Aligner les déclencheurs E2E sur la branche cible décidée en 113 Q1 — 113 Q1 non tranchée : `develop` et `main`
- [x] T-DSO-03 Vérifier qu'aucun nom de check requis n'est modifié (DSO-AC-02) — ruleset `main` relu le 2026-11-23

## Correctif sécurité — frontière du nocturne (2026-11-24)

- [x] T-SEC-01 Supprimer le checkout interbranche ; dispatch nocturne fixe sur `develop`, permissions isolées, erreurs propagées.
- [ ] T-SEC-02 Conserver les rapports 14 jours et distinguer les notifications du déclencheur et des tests — les échecs nocturnes des 25 et 26 novembre n'ont pas été signalés dans #338.
- [x] T-SEC-03 Valider les contrôles locaux : 6 tests unitaires ciblés, `actionlint` 1.7.12, typecheck et les deux lints réussis ; aucun E2E local.
- [x] T-SEC-03-CI PR #344 verte sur `299ed86` : qualité, sécurité et les deux smokes ; analyse Actions complète de `main` sur `50fad46` (2242443295), aucun résultat. Synchronisation de `develop` livrée par #345 (`8607165`).
- [ ] T-SEC-04 Observer une exécution nocturne et ses notifications en CI. Les nocturnes sur `develop` des 25 et 26 novembre ont échoué sans mise à jour de #338 ; l'analyse complète de `main` et la synchronisation de `develop` sont effectuées.
- [x] T-SEC-05 Corriger le suivi des nocturnes dans #356 : reconnaître le nom `End-to-End (nocturne)` et le workflow par son chemin ; la réception réelle de `workflow_run` reste à observer avec T-NIGHT-04 (#212).
- [x] T-SMOKE-132 Adapter le smoke à quatre joueurs à « Ordre de passage », avec ordre choisi différent de la saisie et dernier joueur placé automatiquement ; validé en CI par #356 (145 réussis, 8 ignorés, zéro échec).

## Correctif nocturne — PR CI dédiée (2026-11-26)

Justification (#338, #212) : le smoke à quatre joueurs attend l'ancien choix du seul partant, remplacé par l'ordre de passage de la spec 132. Le run réel `45820439768` porte `name` et `display_title` égaux à `End-to-End (nocturne)` ; la notification ne reconnaît que le nom de base. Le correctif doit accepter ce nom au déclenchement, identifier le workflow par son chemin et conserver le titre canonique de l'incident, sans changer les permissions ni les seuils.

- [x] T-NIGHT-01 Adapter le smoke au choix obligatoire d'un ordre différent de la saisie et vérifier les quatre passages ; CI #356 : 145 réussis, 8 ignorés, zéro échec, scénario quatre joueurs réussi.
- [x] T-NIGHT-02 Reconnaître le dispatch nocturne réel, exclure les dispatchs ordinaires et conserver les incidents distincts du déclencheur et des tests ; prédicat et effets testés sur les champs réels de l'API.
- [x] T-NIGHT-03 17 tests unitaires d'outillage, `actionlint` 1.7.12, typecheck, les deux lints, gardes, gouvernance de couverture et build réussis ; aucun E2E ni smoke local.
- [ ] T-NIGHT-04 Revue du mainteneur, intégration sur `main` puis synchronisation de `develop`, observation du prochain nocturne et de sa notification avant clôture.
