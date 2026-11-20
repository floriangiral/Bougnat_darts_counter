# Tâches — 074 Voix — corpus de référence et banc de mesure

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée et que Q1-Q5 sont tranchées

## Implémentation
- [ ] T001 Définir le schéma `corpus.v1` et son validateur (AC-01)
- [ ] T002 Rédiger 500 énoncés texte, dont ≥ 15 % négatifs et ≥ 60 commandes (AC-01)
- [ ] T003 Générer les tests table-driven et le fichier d'écarts connus (AC-02)
- [ ] T004 Helpers E2E : micro factice et WebSocket Deepgram intercepté (AC-04)
- [ ] T005 Banc local `scripts/voice-bench/` : envoi, parseur, métriques, rapports (AC-03)
- [ ] T006 Protocole d'enregistrement et formulaire de consentement (AC-06)
- [ ] T007 Session pilote (5 locuteurs) puis extension à 10 locuteurs (AC-03)
- [ ] T008 (si Q4 acceptée) Compteurs locaux opt-in exportables

## Tests
- [ ] T009 Tests unitaires du calcul des métriques sur cas construits
- [ ] T010 Tests E2E simulés : proposition, validation, timeout, erreur jeton (AC-04)

## Documentation et clôture
- [ ] T011 Archiver le rapport de référence et le citer dans les specs 003 et 078 (AC-05)
- [ ] T012 Mettre à jour `docs/technical.md` et `CONTRIBUTING.md`
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
