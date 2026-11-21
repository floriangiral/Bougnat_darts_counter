# Tâches — 079 Voix — extension aux autres jeux (Cricket d'abord)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée et que les specs 058 (reducer Cricket) et 075 (port, contrôleur) sont livrées

## Implémentation
- [ ] T001 Extraire le lexique FR partagé sans changer le comportement X01
- [ ] T002 Grammaire Cricket : `Hit`, `Miss`, `TripleMiss`, commandes (AC-01, AC-02)
- [ ] T003 Conversion en commandes du reducer Cricket (AC-01)
- [ ] T004 Limite de fléchettes restantes dans la volée (AC-03)
- [ ] T005 Branchement `useVoiceSession`, bannière multi-fléchettes, réglage
- [ ] T006 Indices de vocabulaire spécifiques au Cricket

## Tests
- [ ] T007 Tests table-driven de la grammaire et test de parité pavé/voix (AC-01, AC-02)
- [ ] T008 Garde d'architecture : grammaire sans dépendance aux règles (AC-04)
- [ ] T009 Sous-corpus Cricket et mesure (AC-05)

## Documentation et clôture
- [ ] T010 Mettre à jour le guide utilisateur et `docs/specifications.md`
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
