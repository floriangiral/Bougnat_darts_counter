# Tâches — 077 Caller « Bougnat » — annonces vocales en français

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, Q1-Q5 tranchées, et la spec 075 livrée

## Implémentation
- [ ] T001 Événements neutres de partie X01 (avec la spec 057) (AC-02, AC-03)
- [ ] T002 Formateur français des nombres et gabarits (AC-01)
- [ ] T003 `AudioOutputPort`, `WebSpeechSynthesizer`, choix de voix `fr-*` (AC-06)
- [ ] T004 Service audio unique : file, priorités, interruption, signal de lecture (AC-04)
- [ ] T005 Propriété de l'`AudioContext` transférée au service audio
- [ ] T006 Réglages et mémorisation locale
- [ ] T007 Semi-duplex avec le contrôleur vocal (AC-05)
- [ ] T008 Lot B : sons de moments forts
- [ ] T009 Traduction des libellés « Bust »/« Turn »

## Tests
- [ ] T010 Tests table-driven du formateur (AC-01)
- [ ] T011 E2E avec stub `speechSynthesis` (AC-02, AC-03, AC-04)
- [ ] T012 Test terrain d'intelligibilité (AC-07)

## Documentation et clôture
- [ ] T013 Guide utilisateur ; alignement du site vitrine (spec 034)
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
