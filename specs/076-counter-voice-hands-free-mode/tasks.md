# Tâches — 076 Voix — mode partie mains libres

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, Q1-Q5 tranchées et les specs 003, 074, 075, 006 livrées

## Implémentation
- [ ] T001 Port `VoiceActivityPort` et adaptateur VAD ; mesure CPU (AC-05)
- [ ] T002 États `armed`/`paused`, micro conservé, pré-roll (AC-02, AC-05)
- [ ] T003 Réglage dans les réglages du match, désactivé par défaut (AC-01)
- [ ] T004 Écran d'information avant la première écoute continue (spec 080)
- [ ] T005 Modes de confirmation A et B ; garde du mode C (AC-10)
- [ ] T006 Pause automatique, Wake Lock, indicateur micro (AC-08)
- [ ] T007 Plafond par match et réaction aux refus serveur (AC-07)
- [ ] T008 Semi-duplex avec la sortie audio de la spec 077 (AC-09)
- [ ] T009 Compteurs locaux de volées sans contact (AC-03)

## Tests
- [ ] T010 Tests unitaires du contrôleur continu et du plafond
- [ ] T011 E2E simulé : 3 volées enchaînées sans clic, aucun audio hors parole (AC-05)
- [ ] T012 Corpus négatif : taux d'engagement erroné (AC-04)
- [ ] T013 Campagne terrain et mesure du coût (AC-02, AC-03, AC-06)

## Documentation et clôture
- [ ] T014 Guide utilisateur et page confidentialité à jour
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
