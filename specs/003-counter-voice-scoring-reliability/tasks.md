# Tasks

- [x] Formaliser les invariants du voice scoring
- [x] Relier le parsing vocal aux règles darts
- [x] Isoler l adapter Deepgram
- [x] Couvrir le parser vocal en tests
- [x] Ajouter un identifiant de session vocale / tentative borne au tour courant
- [x] Refuser toute utterance ou callback Deepgram stale apres changement de tour ou navigation
- [x] Ajouter une couche d arbitrage metier entre `turn_score`, `remaining_score` et `darts_sequence`
- [x] Exposer un etat UI vocal explicite par cause principale (`micro`, `token`, `socket`, `timeout`, `ambigu`) 
- [ ] Couvrir `start / stop / timeout / reset / navigation` par des tests unitaires ou integration locale cibles

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la « Révision V2 » de `spec.md`.

- [ ] T000 Vérifier que la spec est validée (Révision V2) et que les décisions Q1-Q7 sont tranchées
- [ ] T001 [lot 0] Ajouter `utterance_end_ms` à `buildDeepgramListenConfig` (V2-AC-03)
- [ ] T002 [lot 0] Retirer la vérification « supérieur au reste » du parseur et adapter la guidance (V2-AC-05)
- [ ] T003 [lot 0] Supprimer l'erreur de timeout après proposition (V2-AC-04)
- [ ] T004 [lot 0] Messages d'erreur exclusivement français, badge « Assistance vocale » (V2-AC-09)
- [ ] T005 État `connecting` et pré-roll circulaire ≥ 1,5 s (V2-AC-01, V2-AC-02)
- [ ] T006 Prolongation de la fenêtre d'écoute avec plafond (V2-FR-04)
- [ ] T007 Agrégation 20-40 ms dans le worklet et rééchantillonnage sans dérive (V2-FR-17)
- [ ] T008 Module `voiceCapabilities` (capacité + hors ligne) branché sur `VoiceScoringControl` (V2-AC-07, V2-AC-08)
- [ ] T009 Pré-chargement au premier appui ; reconnexion SDK désactivée (V2-FR-15, V2-FR-16)
- [ ] T010 [après 057] Parseur FR v2 : nombres en lettres, articles, « trois fois », volée nulle, ordre de normalisation (V2-AC-06)
- [ ] T011 [après 057] Vérification de possibilité via la règle unique (V2-FR-09)
- [ ] T012 État « À vérifier » pour les propositions ambiguës (V2-FR-11)
- [ ] T013 Tests unitaires : pré-roll, `UtteranceEnd`, fenêtre, parseur table-driven, parité bust
- [ ] T014 Test d'intégration `MatchView` : navigation pendant l'écoute (clôt E-01)
- [ ] T015 Mesure sur le corpus de la spec 074 et rapport des écarts (V2-AC-10)
- [ ] T016 Corriger « Key Tests » (E-02) et cocher/reformuler la dernière tâche historique
- [ ] T017 Mettre à jour `docs/specifications.md` et solder `docs/release/react-19-validation-matrix.md:30`
- [ ] T018 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
