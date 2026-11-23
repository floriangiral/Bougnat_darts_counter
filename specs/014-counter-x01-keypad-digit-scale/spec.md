---
id: 014-counter-x01-keypad-digit-scale
v2_id: null
type: fonctionnel
statut: cloturee
validation: validee
statut_reel: "Clôturée le 2026-11-23 : chiffres 0-9 du pavé X01 agrandis, touches textuelles inchangées ; tailles tablette reprises depuis par 072."
traitement_propose: "Clôturer après vérification."
decision_traitement: validee
issue: null
verifie_au_commit: 863b4bd
derniere_revue: 2026-11-23
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

## Clôture (2026-11-23)

Vérifiée au commit `863b4bd` (`origin/develop`) ; décision du product owner du 2026-11-23 (spec 032, Q4, #215).

Critères vérifiés :

- Seuls les chiffres `0-9` portent la classe de taille dédiée (`digitTextClass`, `components/game/Keypad.tsx:102`, appliquée l.181 et l.199) ; `RESTE`, `C` et `OK` gardent leur propre taille (`Keypad.tsx:73`).
- Les tailles téléphone introduites par la spec (`text-[1.6875rem] sm:text-[2rem]`, commit `3329d5e`) sont toujours celles du code ; à partir de `md`, la taille suit la hauteur de touche (plafond 3 rem) et la tablette est pilotée par la CSS de l'arène (spec [072](../072-counter-arena-layout/spec.md)).
- Aucune régression des actions : `tests/unit/components/keypads.test.tsx`, vert ; `npm run typecheck` en CI.

Aucun reliquat ; toute évolution du pavé relève désormais des specs 065 et 072.
