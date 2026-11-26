# Tâches proposées — 057 Règles X01 uniques et commandes partagées

> **Aucune tâche d'implémentation n'est autorisée tant que 057 est `a-valider`.** Les tâches ci-dessous sont une proposition, conditionnée aux décisions Q1 à Q8 ; elles ne sont pas cochées par la présente relecture.

## Préalables
- [ ] T000 Obtenir la validation explicite de 057 et les décisions Q1 à Q8 ; traiter le prérequis 039 et confirmer les interfaces avec 056/058/061 (AC-08).
- [ ] T001 Caractériser le chemin réellement exécuté et les scénarios métier de 039 : distinguer comportement observé et attente validée, notamment pour voix/RESTE (AC-02, AC-03, AC-08).
- [ ] T002 Ajouter les tests de gel profond des entrées en fin de manche, set, match, bull et place ; `finishLeg` est déjà corrigée, aucun échec historique n'est présupposé (AC-04).

## Implémentation conditionnelle
- [ ] T003 Selon Q1/Q3, définir les frontières et préserver les règles actives ainsi que les consommateurs X01, Gotcha et Capital ; coordonner le sort des classes historiques avec 056 (AC-01).
- [ ] T004 Selon Q6, définir les commandes, les résultats et le contexte des confirmations/verrous, puis brancher progressivement keypad, RESTE et raccourcis (AC-02, AC-06).
- [ ] T005 Préserver l'attestation Double/Master-In et la confirmation de sortie, y compris le raccourci déjà corrigé et ses minima (AC-02, AC-06).
- [ ] T006 Préserver TROP déclaré, limite de volées, départage, ordre et places jouées, indépendamment du choix de leur interface (AC-04, AC-06, AC-07).
- [ ] T007 Brancher le candidat robot selon l'architecture retenue sans changer son aléa, ses bornes et ses restrictions de setup (AC-05).
- [ ] T008 Traiter la voix et RESTE vocal selon Q2/Q5, en coordination avec 003 ; conserver la confirmation tactile explicite (AC-03).
- [ ] T009 Conserver ou migrer explicitement l'état, les instantanés, l'undo persisté et leurs validateurs selon Q7, avec 010/058 ; ne pas créer d'émetteur partenaire non prévu (AC-07).

## Vérification conditionnelle
- [ ] T010 Tester les totaux, les priorités d'ouverture, sorties possibles/impossibles et messages, ainsi que l'immutabilité des refus et transitions (AC-01, AC-02, AC-04).
- [ ] T011 Tester les parcours composant keypad, RESTE, appui long, TROP et voix simulée, y compris les décisions Q2/Q5 (AC-03, AC-06).
- [ ] T012 Tester doublettes, 3/4 camps, bull/places, robot à aléa fixé, statistiques, reprise et Triathlon ; comparer les résultats et les URL partenaire `v=1` (AC-05, AC-07).
- [ ] T013 Rejouer les scénarios 039 validés avant/après ; faire exécuter les E2E/smoke existants **uniquement en CI**, jamais localement (AC-08).

## Documentation et clôture ultérieures
- [ ] T014 Mettre à jour la documentation et les ADR selon les décisions prises et les changements réellement livrés ; conserver les preuves de compatibilité et de validation.
- [ ] T015 Après implémentation et vérifications requises, renseigner le commit de vérification, le statut et le suivi de l'issue conformément aux conventions du dépôt.
