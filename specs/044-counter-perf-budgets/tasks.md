# Tâches — 044 Budgets de performance mesurés (INP, bundle)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que Q1-Q4 sont tranchées
- [ ] T001 Vérifier dans le tableau Cloudflare Web Analytics la disponibilité de l'INP P75 par type d'appareil (AC-05)

## Implémentation
- [ ] T002 Écrire `scripts/check-bundle-budget.mjs`, `perf-budgets.json` et le script `perf:budget` (AC-01)
- [ ] T003 Ajouter l'étape budget dans le job `validate` (avec 043) (AC-01)
- [ ] T004 Supprimer le regroupement `views` et vérifier l'absence de préchargement des écrans (AC-02)
- [ ] T005 Charger la voix à la demande dans `MatchView` (AC-03)
- [ ] T006 Créer le test laboratoire INP (Chromium, CPU ×4) en nightly (AC-04)

## Tests
- [ ] T007 Tests unitaires du script de budget (dépassement, chargement initial, `dist` absent) (AC-01)
- [ ] T008 E2E réseau : accueil sans `MatchView`, partie X01 sans code Deepgram si voix désactivée (AC-02, AC-03)
- [ ] T009 Vérifier les invariants de 020 (pointerdown, long-press) et l'usage hors ligne avec 031

## Documentation et clôture
- [ ] T010 Consigner la première mesure laboratoire et le relevé terrain (AC-04, AC-05)
- [ ] T011 Proposer la clôture (ou la réouverture) de 020 sur preuve
- [ ] T012 Abaisser les budgets vers la cible et documenter la règle de chargement différé
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Révision DevSecOps — tâches proposées

- [ ] T-DSO-01 Exposer `perf-budgets.json` comme source unique lue par Lighthouse CI (123) (DSO-FR-01)
- [ ] T-DSO-02 Analyser l'artefact `dist/` partagé de la CI plutôt qu'un build dédié (DSO-FR-02)
