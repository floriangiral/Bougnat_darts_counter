# Tâches — 068 Mode Light

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-03 (065) et V2-THEME-02 (069) sont livrées
- [ ] T001 Reporter les décisions Q1 à Q3

## Implémentation
- [ ] T002 Prototype de palette sur 4 écrans et validation PO (AC-03)
- [ ] T003 Valeurs `light` de tous les rôles et `game-*` (AC-01)
- [ ] T004 Fonction pure de contraste (AC-01)
- [ ] T005 Remplacer les lueurs résiduelles servant d'indice d'état (AC-05)
- [ ] T006 Barre d'état iOS et `theme-color` en clair (AC-03)
- [ ] T007 Activer le drapeau Light quand le registre DS-03 est à 100 % (AC-04)

## Tests
- [ ] T008 Test de matrice de contraste Dark + Light (AC-01)
- [ ] T009 axe-core en `colorScheme: 'light'` sur tous les écrans (AC-02)
- [ ] T010 Captures Light de référence ; captures Dark inchangées (AC-03, AC-06)
- [ ] T011 Test terrain tablette en salle éclairée

## Documentation et clôture
- [ ] T012 Guide utilisateur, notes de release, README
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
