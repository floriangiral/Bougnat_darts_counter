# Tasks

- [x] Ajouter les checks Deepgram dans les workflows de promotion
- [x] Ajouter la verification projet dans le provider token
- [x] Ajouter les tests unitaires de couverture
- [x] Extraire les types live Deepgram dans un contrat dedie
- [x] Extraire et tester la conversion PCM voice
- [ ] Completer le runbook d incident voice dans la doc release

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la « Révision V2 » de `spec.md`.

- [ ] T000 Vérifier que la spec est validée (Révision V2) et que Q1-Q5 sont tranchées
- [ ] T001 Exiger `Origin` hors développement, avec phase d'observation de 48 h (V2-AC-01)
- [ ] T002 Implémenter la coupure d'urgence sur le support retenu (V2-AC-04)
- [ ] T003 Implémenter le plafond de dépense et la cause `budget` (V2-AC-03)
- [ ] T004 Implémenter la limite globale (V2-AC-02)
- [ ] T005 Mettre en cache la vérification projet (V2-AC-06)
- [ ] T006 Compteur agrégé sans IP persistée (V2-FR-08)
- [ ] T007 Causes `budget`/`disabled` côté client et message français (V2-AC-05)
- [ ] T008 Tests de route et de client (Origin, 429, 503, zéro appel Deepgram)
- [ ] T009 Déclarer les nouvelles variables (spec 009, `wrangler.jsonc`, exemple d'environnement)
- [ ] T010 Rédiger et dérouler en preview le runbook d'incident voix (V2-AC-07 ; clôt la tâche historique)
- [ ] T011 Configurer l'alerte de consommation ou le contrôle manuel
- [ ] T012 Mettre à jour `SECURITY.md` et `docs/architecture.md`
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
