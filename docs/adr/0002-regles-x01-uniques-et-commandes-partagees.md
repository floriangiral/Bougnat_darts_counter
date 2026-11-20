---
id: ADR-0002
titre: Règles X01 uniques et commandes métier partagées par toutes les entrées
statut: proposee
date: 2026-11-20
specs_liees: [057, 045, 046, 003, 075]
---

# ADR-0002 — Règles X01 uniques et commandes partagées

## Statut
Proposée.

## Contexte
- Les scores impossibles en Double Out existent en 4 copies, `isCheckoutPossible` en 3 ; `MatchView.handleRemainingSubmit` réimplémente la validation ; le robot contourne la validation.
- Le parseur vocal rejette un bust annoncé (`src/features/x01/voice/dartsSpeechParserShared.ts:126-135`) alors que le keypad l'accepte (`src/features/x01/scoring/matchSubmission.ts:63`).
- `src/domain/scoring` et ses use cases (`RecordThrow`…) ne sont utilisés que par les tests.

## Options
1. Rebrancher tels quels les use cases existants.
2. **Une seule source de règles X01 (module pur) et une commande métier unique** (`SubmitVisit`, `UndoVisit`…) appelée par le keypad, la voix, le robot et le lien partenaire ; le moteur qualifie le bust, jamais le parseur.
3. Garder la logique dans les vues.

## Décision proposée
Option 2 ; les use cases existants ne sont rebranchés que s'ils passent les tests du chemin réellement exécuté, sinon ils sont supprimés (spec 056).

## Conséquences
Cohérence voix/keypad, bugs de sortie corrigés une fois (spec 045), base pour la voix multi-jeux. Risque : régression du chemin X01 principal → caractérisation préalable obligatoire.
