---
id: 015-counter-x01-simple-two-player-limit
v2_id: null
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Implémentée, puis révisée en V2 : limite portée à 4 joueurs en simple (spec 052)."
traitement_propose: "Révisée par la spec 052 (V2-GAMES-16) : invariant « ≤ 2 joueurs » remplacé par « ≤ 4 joueurs en simple, robot à 2 »."
decision_traitement: validee
remplacee_par: [052-counter-x01-three-four-players]
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 015 - counter x01 simple two player limit

## Meta

- ID: `015-counter-x01-simple-two-player-limit`
- Statut: `active`
- Milestone cible: `M2: Game Modes Stability`
- Issues GitHub: `#to-create`

> **Révisée le 2026-11-20 par la spec [052](../052-counter-x01-three-four-players/spec.md)** : la limite de 2 joueurs en X01 simple est levée (voir « Révision V2 » ci-dessous). Le texte d'origine est conservé pour l'historique.

## Objectif

Limiter le mode X01 en format SIMPLE a un maximum de 2 joueurs.

## Decisions

- appliquer la limite dans la logique de domaine setup (source of truth)
- aligner l UI setup pour proposer uniquement `1` et `2`
- normaliser aussi les donnees pre-remplies pour eviter les etats invalides

## Invariants critiques

- X01 SIMPLE ne depasse jamais 2 joueurs
- X01 DOUBLES reste a 4 joueurs (2v2)
- CRICKET et TRIATHLON conservent leurs regles existantes

## Impacted Code

- `src/features/game-setup/setupModel.ts`
- `views/SetupView.tsx`
- `tests/unit/gameSetup/setupModel.test.ts`

## Key Tests

- `tests/unit/gameSetup/setupModel.test.ts`
- `npm run typecheck`

## Validation

- impossible de selectionner plus de 2 joueurs en X01 SIMPLE
- un prefill X01 SIMPLE > 2 joueurs est automatiquement ramene a 2
- typage TypeScript valide

## Révision V2 (2026-11-20)

Décision du product owner (spec 052, Q1 a et Q2 a) :

- Invariant remplacé : « X01 SIMPLE ne dépasse jamais 2 joueurs » devient **« X01 SIMPLE compte de 1 à 4 joueurs ; une partie contre le robot compte exactement 2 joueurs »**.
- Source de vérité inchangée : la logique de setup (`src/features/game-setup/setupModel.ts`), bornes portées par les constantes `X01_SIMPLE_MAX_PLAYERS` (4) et `X01_BOT_MATCH_PLAYERS` (2). Revenir à 2 rétablit le comportement d'origine.
- L'UI de setup propose `1`, `2`, `3` et `4` ; un 5ᵉ joueur est refusé. À 3-4 joueurs, l'option robot est désactivée avec une explication ; passer de 2 à 3-4 joueurs désactive le robot.
- Normalisation des prérenseignements conservée : un prérenseignement X01 simple est borné à 4 joueurs ; une configuration incohérente (robot + 3-4 joueurs) est ramenée à 2 joueurs.
- Inchangés : X01 DOUBLES (2 contre 2), lien partenaire `v=1` (2 joueurs ou doublettes), CRICKET et TRIATHLON.
- Tests : `tests/unit/gameSetup/setupModel.test.ts` (bornes 1-4, 5ᵉ refusé, robot à 2), `tests/unit/gameSetup/setupViewModel.test.ts`, `tests/unit/components/setupPlayers.test.tsx`.

