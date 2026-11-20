# Plan — 050 Rétro-spécifications des règles

> Plan proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et décisions Q1 à Q4.

## 1. Lecture de l'existant

- Règles affichées : `src/features/game-setup/setupPresentation.ts:59-140`.
- Résumé documentaire : `docs/specifications.md:76-121`.
- Moteurs : `src/application/scoring/matchLifecycle.ts`, `src/features/x01/scoring/*`, `utils/cricketLogic.ts`, `utils/capitalLogic.ts`, `src/features/capital/capitalGameModel.ts`, `utils/triathlonScoring.ts`, `src/domain/triathlon/*`.
- Tests existants : `tests/unit/{cricketLogic,cricketGameModel,capitalLogic,capitalGameModel,triathlonScoring,triathlonFlow}.test.ts`, `tests/unit/x01/*`, `tests/unit/application/*`.

## 2. Approche retenue (et alternatives écartées)

Valider d'abord le §8 de la spec (arbitrage des M), puis publier la référence en documentation et brancher les golden tests sur les identifiants. Écartées : générer la référence depuis le code (fige les bugs) ; attendre la fin des corrections (bloque les golden tests).

## 3. Étapes

1. Revue PO du §8 (statuer sur chaque M ; Q2, Q3).
2. Relecture par un joueur licencié (Q4) — les écarts trouvés deviennent des questions ou des E.
3. Rédaction de `docs/regles/{x01,cricket,capital,triathlon}.md` (selon Q1) à partir du §8 validé.
4. Alignement des règles affichées (`setupPresentation.ts`) — via les specs 045/046/047/048 pour les E, via une PR documentaire pour les M.
5. Table de correspondance identifiant ↔ golden test (spec 039).
6. Lien depuis `docs/specifications.md` et le README.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `docs/regles/*.md` (nouveau, emplacement Q1) | Référence publiée |
| `docs/specifications.md` | Renvoi vers la référence |
| `README.md` | Lien « Règles des jeux » |
| `src/features/game-setup/setupPresentation.ts` | Textes alignés (M seulement) |
| `tests/**` | Identifiants dans les noms de tests (spec 039) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun impact de code hors textes des règles affichées.

## 6. Stratégie de migration

Sans objet (documentation).

## 7. Stratégie de test

Relecture croisée ; contrôle optionnel des identifiants cités dans les tests (V2-QA-10, spec 043).

## 8. Non-régression

La référence suit l'état livré : chaque spec 045-049, 051, 053, 054 met à jour la règle concernée à sa clôture.

## 9. Rollback / désactivation

Sans objet.

## 10. Documentation à mettre à jour avec l'implémentation

`docs/specifications.md`, README, index des specs (`specs/README.md`, par le coordinateur), guide utilisateur (V2-DOC-05).
