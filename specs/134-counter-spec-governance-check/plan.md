# Plan — 134 Contrôle de cohérence des specs

> Proposition à exécuter uniquement après validation de la spec et de Q1–Q2.

## 1. Lecture de l'existant
Conventions, index, en-têtes historiques/V2 et scripts de gouvernance existants.

## 2. Approche proposée
Un contrôle local en lecture seule, sans réseau. Choisir le parsing adapté à la syntaxe réellement utilisée ; justifier toute dépendance de développement avant ajout.

## 3. Étapes
1. Valider Q1–Q2 et inventorier les écarts existants.
2. Implémenter les diagnostics et la commande ; tester sur fixtures puis sur le dépôt.
3. Corriger les écarts ou soumettre les arbitrages, sans exceptions implicites.
4. Proposer l'intégration CI dans une PR dédiée et documentée.

## 4. Fichiers impactés
`scripts/`, tests unitaires d'outillage, `package.json`, `AGENTS.md` et documentation technique ; workflow dans sa PR dédiée.

## 5. Impacts UI / domaine / application / infrastructure
Aucun.

## 6. Migration
Aucune migration de données. Les corrections documentaires seront explicites.

## 7. Tests
Fixtures conformes et erreurs AC-01 à AC-04 ; contrôle du dépôt et `governance:coverage`.

## 8. Non-régression
Pas d'écriture, de réseau, de validation automatique ni de changement des seuils.

## 9. Retour arrière
Corriger le contrôle dans une PR dédiée, sans contourner les règles de contribution.

## 10. Documentation
Commande et limites dans `AGENTS.md`, `docs/technical.md` et les conventions, lors de sa livraison.
