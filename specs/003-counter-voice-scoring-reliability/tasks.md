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
