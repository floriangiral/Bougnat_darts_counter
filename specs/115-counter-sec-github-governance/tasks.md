# Tâches — 115 Gouvernance du dépôt GitHub

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que Q1 à Q5 sont tranchées
- [ ] T001 Exporter les rulesets et paramètres actuels (JSON) — opération en lecture

## Implémentation (PR)
- [ ] T002 Durcir les workflows de promotion : `inputs.reason` par `env:`, plus d'affichage de réponse API, permissions par job (FR-07)
- [ ] T003 Si Q2 = finaliser : jeton d'application de promotion (`actions/create-github-app-token`, SHA épinglé) (FR-04)
- [ ] T004 Écrire `scripts/ci/check-github-settings.mjs` et ses tests (AC-06)

## Opérations manuelles du product owner (détail dans 128)
- [ ] T005 Squash seul, auto-merge autorisé, suppression des branches fusionnées, mise à jour de branche (AC-01)
- [ ] T006 Approbateur requis sur `Production`, contournement administrateur selon Q4 (AC-04)
- [ ] T007 Actions autorisées « selected » et épinglage SHA obligatoire (AC-03)
- [ ] T008 Ruleset `main` : conversations, squash, code owners (Q3) ; rulesets `release/**` (AC-02)
- [ ] T009 Ruleset `preprod`/`production` selon Q2 ; suppression des secrets inutilisés (AC-05)
- [ ] T010 Après 116 : désactiver les mises à jour de sécurité Dependabot (FR-08)
- [ ] T011 Supprimer les branches obsolètes validées (FR-09) ; vérifier la détection de licence (FR-10)

## Tests
- [ ] T012 Workflow de test avec action non autorisée et référence par tag (AC-03)
- [ ] T013 PR de fork de test (AC-07) ; script FR-11 sans écart (AC-06)

## Documentation et clôture
- [ ] T014 Mettre à jour `docs/technical.md:375-382`, `CONTRIBUTING.md`, `SECURITY.md`
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
