# Tâches — 075 Voix — port de reconnaissance et commandes vocales

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que l'ADR 0008 est acceptée et que la spec 057 est livrée (ou son interface figée)

## Implémentation
- [ ] T001 Caractériser le comportement vocal actuel de `MatchView` (AC-02)
- [ ] T002 Définir port, intentions et états dans `src/application/voice/` (AC-01)
- [ ] T003 Implémenter `VoiceSessionController` pur (AC-01)
- [ ] T004 Déplacer le pipeline vers `DeepgramRecognizer` ; créer `FakeSpeechRecognizer` (AC-02, AC-09)
- [ ] T005 Créer `useVoiceSession` et basculer `MatchView` ; retirer `useDeepgramStreaming` (AC-02)
- [ ] T006 Grammaire X01 : `Confirm`, `Cancel`, `Correct`, `Next`, `UndoLastTurn`, `QueryRemaining` (AC-03, AC-05, AC-06)
- [ ] T007 Brancher les commandes de la spec 057 et l'aperçu moteur (AC-03, AC-04)
- [ ] T008 Annulation de la proposition par toute frappe keypad (AC-07)
- [ ] T009 Indices de vocabulaire sans prénoms (AC-08)

## Tests
- [ ] T010 Tests unitaires contrôleur et grammaire (corpus spec 074)
- [ ] T011 Tests E2E simulés des parcours 1 à 3 (AC-09)
- [ ] T012 Session terrain de 20 volées avec commandes

## Documentation et clôture
- [ ] T013 Mettre à jour `docs/architecture.md`, `docs/specifications.md`, statut de l'ADR 0008
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
