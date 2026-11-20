# Plan — 066 Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `components/game/CricketKeypad.tsx:47-93`, `CapitalKeypad.tsx:83-107`, `:424-426`, `Keypad.tsx:144-174`.
- `components/game/PlayerScore.tsx:78-125`, `CricketScoreboard.tsx:50-52`, `:154`.
- `views/KillerGameView.tsx:250-260`, `views/GotchaGameView.tsx:47-60`, `views/GameSelectionView.tsx:38-83`.
- `src/features/x01/scoring/matchFeedback.ts:3-45`.

## 2. Approche retenue (et alternatives écartées)
Rôles `game-*` dans les tokens + tons portés par les composants. Écartée : couleurs par jeu (incohérence actuelle) ; personnalisation des couleurs métier (contraire à C.7).

## 3. Étapes
1. Ajouter les rôles `game-*` (Dark) dans `src/styles/tokens/themes.css`.
2. Remplacer `getFeedbackStyles` par une fonction de ton pure ; traduire en présentation (`MatchView`/composant feedback).
3. Aligner `CapitalKeypad` (si Q1 validée) ; supprimer le style inline de `CricketKeypad`.
4. Ajouter `data-tone`/`data-multiplier`/`data-state` aux touches et cartes.
5. Relever le contraste du score inactif (`PlayerScore.tsx:125`) et du nom inactif (l.86).
6. Documenter la convention.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/styles/tokens/themes.css` | Rôles `game-*` |
| `src/features/x01/scoring/matchFeedback.ts` | Ton au lieu de classes |
| `components/game/CricketKeypad.tsx`, `CapitalKeypad.tsx`, `Keypad.tsx` | Tons, attributs |
| `components/game/PlayerScore.tsx`, `CricketScoreboard.tsx` | Rôles, contraste |
| `views/KillerGameView.tsx`, `GotchaGameView.tsx`, `GameSelectionView.tsx` | Rôles |
| `tests/unit/components/*.test.tsx`, `tests/unit/x01/matchScoring.test.ts` | Assertions sémantiques |

## 5. Impacts UI / domaine / application / infrastructure
UI ; `features/x01/scoring` devient pur (intention). Domaine inchangé.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée.

## 7. Stratégie de test
Unitaires (tons), E2E captures et axe-core, revue en niveaux de gris.

## 8. Non-régression
Tests pavés, scoreboard, feedback X01 ; specs 005, 017, 019.

## 9. Rollback / désactivation
Revert par PR ; l'alignement Capital est un commit séparé.

## 10. Documentation à mettre à jour avec l'implémentation
Guide des rôles (convention couleur → sens → forme), notes de release (changement Capital).
