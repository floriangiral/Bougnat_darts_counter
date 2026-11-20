---
id: 014-counter-x01-keypad-digit-scale
v2_id: null
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Implémentée."
traitement_propose: "Clôturer après vérification."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 014 - counter x01 keypad digit scale

## Meta

- ID: `014-counter-x01-keypad-digit-scale`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#to-create`

## Objectif

Augmenter de 50% la taille visuelle des chiffres du clavier X01 pour ameliorer la lisibilite en condition terrain.

## Decisions

- augmenter uniquement les touches numeriques `0-9`
- conserver les touches textuelles (`RESTE`, `C`, `OK`) inchangées
- appliquer un ratio x1.5 sur les tailles responsive existantes

## Invariants critiques

- aucune regression fonctionnelle du clavier
- aucune modification des actions des touches
- lisibilite accrue des chiffres sur mobile et tablette

## Impacted Code

- `components/game/Keypad.tsx`

## Key Tests

- `npm run typecheck`

## Validation

- tailles chiffres augmentees de 50%
- compilation TypeScript valide
