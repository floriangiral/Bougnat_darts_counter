# Tâches — 081 Voix — état vocal affiché sur la TV

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée et que les specs 084, 085, 075 et 076 sont livrées

## Implémentation
- [ ] T001 Type `VoiceStateMessage` v1 et validateur, sans champ de transcription (AC-03, AC-05)
- [ ] T002 Publication coalescée de l'état vocal par le contrôleur (AC-01)
- [ ] T003 Exclusion du rejeu par le relais (si 087 livrée)
- [ ] T004 Badge TV distinct et expiration (AC-02, AC-04)
- [ ] T005 Tolérance des TV anciennes aux messages inconnus (AC-06)
- [ ] T006 Réglage « Afficher la voix sur la TV »

## Tests
- [ ] T007 Tests unitaires de contrat, d'ordre et d'expiration
- [ ] T008 E2E TV locale + faux moteur vocal, mesure de latence (AC-01)
- [ ] T009 Test terrain de lisibilité à 4 m

## Documentation et clôture
- [ ] T010 Mettre à jour les guides TV et voix
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
