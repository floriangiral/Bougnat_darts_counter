# Tâches — 059 Journal de partie append-only

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que les specs 058 et 010 sont livrées et que Q1 (granularité) est tranchée

## Implémentation
- [ ] T001 Mesurer le coût de rejeu sur les fixtures X01 et fixer la fréquence d'instantané (AC-06)
- [ ] T002 Définir les entrées de journal X01 et `replay` dans le domaine (AC-02)
- [ ] T003 Étendre `useGameSession` : ajout d'entrées, instantané, `Undone` (AC-01, AC-03)
- [ ] T004 Persister journal et instantané dans l'enveloppe de la spec 010 avec migration sans journal (AC-01)
- [ ] T005 Interface de correction d'une volée X01 avec confirmation RM-02 (AC-04)
- [ ] T006 Annulation depuis l'écran de victoire X01 avant validation (AC-05)
- [ ] T007 Étendre l'annulation persistante aux jeux migrés par la spec 058

## Tests
- [ ] T008 Test de propriété « rejeu = état » (AC-02)
- [ ] T009 Tests unitaires et de composant annulation/correction (AC-03, AC-04, AC-05)
- [ ] T010 E2E rechargement puis annulation (AC-01)

## Documentation et clôture
- [ ] T011 Mettre à jour `docs/architecture.md`, le guide utilisateur et l'ADR-0004
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
