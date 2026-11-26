# Tâches — 119 OpenSSF Scorecard

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (statut `validee`), Q1 à Q3 tranchées, 115 appliquée (actions autorisées)

## Implémentation
- [x] T001 Créer `scorecard.yml` (déclencheurs, permissions, publication, SARIF, résumé) (AC-01, AC-02) — résumé dans `scorecard-summary.yml` (restrictions de publication)
- [ ] T002 Première exécution manuelle et relevé des scores (AC-01) — l'analyse sur push a réussi le 24 novembre et publié 7,6/10 ; l'exécution hebdomadaire prévue par AC-01 reste à observer.
- [ ] T001-E Valider la garde des envois SARIF, sans masquer l'échec d'analyse ni accepter un succès sans rapport — 5 tests ciblés, typecheck, lint ciblé et `actionlint` réussis localement ; PR #347 fusionnée avec les contrôles verts, mais aucune approbation formelle n'est enregistrée sur GitHub : revue du mainteneur à confirmer.
- [x] T003 Rédiger le plan d'amélioration à partir du premier relevé, avec les décisions et les actions restantes (AC-03)

## Tests
- [x] T004 Vérifier l'onglet Security et l'API publique (AC-01, AC-02) — alertes et résultat de l'analyse sur push visibles ; l'exécution planifiée reste à vérifier en T002.
- [ ] T005 Relever la progression de « Token-Permissions » après 113 (AC-04)

## Documentation et clôture
- [ ] T006 Ajouter Scorecard au rapport hebdomadaire (127) et le badge si Q2 (128) — badge ajouté au README ; rapport hebdomadaire restant.
- [ ] T007 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
