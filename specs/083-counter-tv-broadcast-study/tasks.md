# Tâches — 083 Étude : diffusion TV et frontière serveur

> À exécuter uniquement après validation de la spec. Une étude ne livre pas de code dans la branche principale.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que le PO a accepté de lancer les PoC

## Instruction
- [ ] T001 Atelier PO : trancher les questions 1 (relais), 3 (budget), 4 (autorité BDT), 5 (prénoms) ; consigner dans l'issue
- [ ] T002 PoC-1 : Worker + DO `BroadcastRoom` avec hibernation et attachement, binding depuis Pages (préproduction)
- [ ] T003 PoC-1 : simulateur de 2 h, émission au changement ; relever requêtes DO, GB-s, latence p95
- [ ] T004 PoC-1 : vérifier la déconnexion au redéploiement et la perte d'attachement à la fermeture de la socket émettrice
- [ ] T005 PoC-2 : page TV statique en CSS conservatrice rendue sur Chromium 85, 87, 94, 108
- [ ] T006 PoC-3 : deux émetteurs, génération attribuée par le DO, rejet de l'ancienne génération
- [ ] T007 Recalculer le tableau de coûts (Free, Paid nominal, ×10) avec les mesures

## Livrables
- [ ] T008 Rédiger l'ADR 0005 « Projection spectateur et transport » (avec frontière serveur)
- [ ] T009 Rédiger la proposition d'amendement de `CONTRIBUTING.md`, `docs/product-scope.md`, `docs/architecture.md`
- [ ] T010 Mettre à jour les specs 087, 088, 090 selon la décision

## Clôture
- [ ] T011 Supprimer le Worker et le binding de PoC
- [ ] T012 Renseigner les décisions dans la spec, passer l'étude à `cloturee`, fermer l'issue
