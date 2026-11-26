# Tâches proposées — 058 État de partie et transitions par jeu

> Toutes les tâches ci-dessous sont futures et restent décochées. À exécuter uniquement après validation de 058 et arbitrage de ses questions ; les capacités déjà livrées par 010 ne sont pas des tâches à refaire.

## Préalables

- [ ] T000 Faire arbitrer Q1 à Q8 ; vérifier la caractérisation métier 039 et coordonner les interfaces X01 avec 057 et 061.
- [ ] T001 Inventorier les sept jeux, les deux contrats existants, leurs effets et annulations ; identifier les lacunes des tests de reprise déjà présents (AC-01, AC-03).
- [ ] T002 Préparer des fixtures de sessions v2 et ancien X01, avec chrono, piles compactées, erreurs et résultats Triathlon, avant changement de format (AC-01, AC-04).

## Implémentation éventuelle

- [ ] T003 Retenir et documenter, après arbitrage, les interfaces/adaptateurs utiles ; réutiliser les reducers Cricket et Capital plutôt que les recréer (AC-02).
- [ ] T004 Extraire seulement les transitions encore couplées à la vue pour les jeux retenus, avec conservation des sémantiques d'annulation et refus (AC-02, AC-03).
- [ ] T005 Selon Q6, caractériser ATC180, dont fin → annulation → nouvelle fin et historique local ; ne pas remplacer son annulation dérivée ni tronquer ses volées (AC-01, AC-03).
- [ ] T006 Coordonner l'étape X01 avec 057 et 061 : commandes, robot, voix, bull, places et pile existante (AC-02, AC-03, AC-06).
- [ ] T007 Préserver la composition Triathlon, ses quatre phases d'épreuve et les résultats antérieurs ; adapter les transitions seulement si nécessaire (AC-05).
- [ ] T008 Si Q8 retient le remplacement du porteur, adapter lancement, résultats, revanche, reprise et anciens formats avant suppression (AC-07).
- [ ] T009 Si un instantané change, adapter version/migration, codec, validateurs et compatibilité de retour arrière ; conserver la limite persistée décidée dans 010 (AC-01, AC-04).

## Tests

- [ ] T010 Compléter les tests de transitions pures, gel, déterminisme et refus à partir des cas caractérisés, sans supprimer les tests existants (AC-02).
- [ ] T011 Vérifier reprise et annulation par jeu, unités et bornes, parties longues, corruption et absence d'écriture sur tic seul (AC-01, AC-03, AC-04).
- [ ] T012 Couvrir les phases et transitions Triathlon, robot/voix, lien partenaire, sortie et non-duplication de résultat après reprise (AC-05, AC-06).
- [ ] T013 Vérifier les parcours E2E/smoke concernés en CI uniquement ; aucune exécution locale.

## Documentation et clôture futures

- [ ] T014 Mettre à jour la documentation d'architecture et les ADR pertinentes selon les décisions prises ; traiter toute modification de politique Sonar dans une PR dédiée.
- [ ] T015 Après livraison et vérification, renseigner le commit, le statut et les tâches de 058 et suivre l'issue #226 selon les conventions.
