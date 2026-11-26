# Tâches — 044 Budgets de performance mesurés (INP, bundle)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que Q1-Q7 et DSO-Q1 sont tranchées
- [ ] T001 Vérifier dans le tableau Cloudflare les données du projet, la disponibilité d'un INP P75 global par type d'appareil et les limites de couverture, dont l'exclusion des liens partenaires (AC-05)

## Implémentation
- [ ] T002 Écrire `scripts/check-bundle-budget.mjs`, `perf-budgets.json` et le script `perf:budget`, avec les périmètres et seuils arbitrés (AC-01)
- [ ] T003 Ajouter l'étape budget dans le job `validate` (avec 043), dans une PR dédiée justifiée et revue par le mainteneur (AC-01)
- [ ] T004 Adapter le regroupement `views` ; vérifier le graphe réel et les transferts de la page et du précache selon Q5 (AC-02)
- [ ] T005 Charger la voix à la demande dans `MatchView` (AC-03)
- [ ] T006 Créer le test laboratoire d'interactions retenu (Chromium, CPU ×4) en nightly/CI uniquement ; toute modification de workflow exige une PR dédiée justifiée et revue (AC-04)

## Tests
- [ ] T007 Tests unitaires du script de budget (dépassement, imports statiques transitifs, déduplication, `dist` absent) (AC-01)
- [ ] T008 En CI, E2E réseau distinguant le graphe de la page et le précache : accueil sans `MatchView`, partie X01 sans code Deepgram si voix désactivée, selon Q5 (AC-02, AC-03)
- [ ] T009 Vérifier les invariants de 020 (pointerdown, long-press), le premier usage hors ligne et la mise à jour en partie avec 031

## Documentation et clôture
- [ ] T010 Consigner la première mesure laboratoire et le relevé terrain avec leur définition et leurs limites (AC-04, AC-05)
- [ ] T011 Traiter sur preuve le reliquat terrain transféré par 020, déjà clôturée
- [ ] T012 Réviser les budgets selon l'arbitrage du PO et documenter la règle de chargement différé retenue
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue

## Révision DevSecOps — tâches proposées

- [ ] T-DSO-01 Exposer `perf-budgets.json` comme source unique lue par Lighthouse CI (123) (DSO-FR-01)
- [ ] T-DSO-02 Analyser l'artefact `dist/` partagé de la CI plutôt qu'un build dédié (DSO-FR-02)
