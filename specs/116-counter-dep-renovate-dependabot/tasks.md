# Tâches — 116 Renovate et Dependabot (veille de sécurité)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q6 tranchées, branche cible décidée (113 Q1)
- [ ] T001 Opération manuelle : installer l'application Mend Renovate sur ce seul dépôt (via 128) (AC-01) — le [Dependency Dashboard #340](https://github.com/floriangiral/Bougnat_darts_counter/issues/340) confirme au moins une analyse du bot ; le périmètre de l'installation reste à confirmer.

## Implémentation
- [ ] T002 Rédiger `renovate.json` (planification, maturité, groupes, PR dédiées, étiquettes, limites, contraintes) sans auto-merge (AC-02, AC-03, AC-04) — configuration validée en CI ; première vague automatique à observer.
- [ ] T003 Configurer `vulnerabilityAlerts` et `osvVulnerabilityAlerts` (AC-05) — configuration préparée ; activation et recette restent à faire.
- [x] T004 Ajouter le job de validation de configuration Renovate (AC-07) — [validation stricte réussie sur `main`](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45439819445) le 24 novembre 2026 ; le test d'une configuration invalide reste couvert par T008.
- [ ] T005 Supprimer `.github/dependabot.yml` (AC-06)
- [ ] T006 Activer l'auto-merge des catégories autorisées après livraison de 114 (FR-06)
- [ ] T007 Après la première PR de sécurité Renovate : désactiver les mises à jour de sécurité Dependabot (AC-06, opération manuelle)

## Tests
- [ ] T008 PR jetable avec configuration invalide (AC-07)
- [ ] T009 Observer 4 vagues : maturité, groupes, alignement des versions Playwright, majeures non fusionnées, absence de doublon (AC-02, AC-03, AC-04, AC-08) — au 26 novembre 2026, aucune PR Renovate observée ; première fenêtre ordinaire après création du Dashboard : lundi 30 novembre, 5 h–11 h (Europe/Paris). Les mises à jour en attente de fenêtre ou de contrôles internes ne prouvent pas une panne ; la cause précise des contrôles en attente reste à confirmer.

## Documentation et clôture
- [ ] T010 Mettre à jour `docs/technical.md:149-150`, `CONTRIBUTING.md`, `AGENTS.md`, documentation CI
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
