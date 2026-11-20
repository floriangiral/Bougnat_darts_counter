---
id: TEMPLATE-FEATURE
v2_id: V2-XXX-NN
titre: Titre de la spécification
type: fonctionnel            # fonctionnel | etude | adr | gouvernance | doc
statut: a-valider            # voir .specify/conventions.md
validation: en-attente       # en-attente | validee
origine: Demande V2          # Backlog existant | Demande V2 | Recommandation architecturale | Recommandation UX/UI | Innovation produit | Documentation | Étude exploratoire
famille: jeux
priorite: P1                 # P0 | P1 | P2 | P3
difficulte: M                # S | M | L | XL
recommandation: recommande   # recommande | optionnel | deconseille | etude
lot: 2
poids: 0                     # (valeur × priorité × 5) ÷ difficulté, borné 1-100
depend_de: []
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# NNN — Titre

> **Statut : À VALIDER.** Ce document est une proposition. Aucune exigence n'est validée tant que le statut n'est pas `validee`.

## 1. Origine et contexte
Pourquoi cette spec existe, d'où vient la demande (backlog, demande V2, audit), liens vers les sources.

## 2. Problématique
Le problème utilisateur ou technique, en une ou deux phrases.

## 3. Objectifs
Objectifs mesurables.

## 4. État actuel vérifié dans le code
Constats avec références `chemin:ligne`. Distinguer [vérifié], [hypothèse], [à confirmer].

## 5. Comportement cible
Description du comportement attendu.

## 6. Périmètre
### Inclus
### Exclu

## 7. User stories
- En tant que …, je veux …, afin de …

## 8. Règles métier
RM-01 …

## 9. Parcours utilisateurs
Parcours nominal pas à pas.

## 10. Exigences fonctionnelles
FR-01 …

## 11. Exigences non fonctionnelles
NFR-01 (performance, accessibilité, compatibilité, sécurité, confidentialité, coût) …

## 12. Cas nominaux et alternatifs

## 13. Cas limites

## 14. Gestion des erreurs

## 15. Impacts architecturaux
Couches touchées, direction des dépendances, nouvelles abstractions (justifiées).

## 16. Impacts sur les données et les interfaces
Schémas persistés, contrats, migrations.

## 17. Compatibilité avec l'existant

## 18. Dépendances
Specs et issues prérequises.

## 19. Critères d'acceptation
AC-01 … (mesurables, avec état initial, action, résultat attendu, appareil/jeu, preuve).

## 20. Scénarios de tests
Unitaires, composants, E2E, terrain.

## 21. Exigences de non-régression

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |

## 23. Décisions architecturales
ADR liés ou décisions à prendre.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|

## 25. Traçabilité
Rapports d'audit, issues, commits, specs liées.
