# Tâches — 116 Renovate et Dependabot (veille de sécurité)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q6 tranchées, branche cible décidée (113 Q1)
- [ ] T001 Opération manuelle : installer l'application Mend Renovate sur ce seul dépôt (via 128) (AC-01)

## Implémentation
- [ ] T002 Rédiger `renovate.json` (planification, maturité, groupes, PR dédiées, étiquettes, limites, contraintes) sans auto-merge (AC-02, AC-03, AC-04)
- [ ] T003 Configurer `vulnerabilityAlerts` et `osvVulnerabilityAlerts` (AC-05)
- [ ] T004 Ajouter le job de validation de configuration Renovate (AC-07)
- [ ] T005 Supprimer `.github/dependabot.yml` (AC-06)
- [ ] T006 Activer l'auto-merge des catégories autorisées après livraison de 114 (FR-06)
- [ ] T007 Après la première PR de sécurité Renovate : désactiver les mises à jour de sécurité Dependabot (AC-06, opération manuelle)

## Tests
- [ ] T008 PR jetable avec configuration invalide (AC-07)
- [ ] T009 Observer 4 vagues : maturité, groupes, Playwright groupé, majeures non fusionnées, absence de doublon (AC-02, AC-03, AC-04, AC-08)

## Documentation et clôture
- [ ] T010 Mettre à jour `docs/technical.md:149-150`, `CONTRIBUTING.md`, `AGENTS.md`, documentation CI
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
