# Plan

1. Definir les types numeriques de sortie pour `matchStats`
2. Refactorer `matchStats` et adapter ses tests
3. Creer un module unique de labels FR pour les ecrans stats
4. Creer un presenter FR pour formatter les stats numeriques
5. Brancher les ecrans stats sur labels + presenter
6. Ajouter tests presenter/labels et valider lint/typecheck

## Révision V2 — plan proposé

> À exécuter uniquement après validation de la révision V2 (V2-GAMES-10).

1. Arbitrer Q1-Q4 et publier le lexique des jeux (avec la spec 050).
2. Étendre `src/presentation/stats/statsLabels.fr.ts` (clés des tranches de scores) et brancher `components/stats/StatsModal.tsx:154-179`.
3. Créer un module de libellés des écrans de jeu (ex. `src/presentation/game/gameLabels.fr.ts`) ; y déplacer les chaînes de `components/game/PlayerScore.tsx`, `components/game/Keypad.tsx`, `src/features/x01/scoring/matchFeedback.ts`, `src/features/x01/scoring/matchPresentation.ts`, `views/MatchView.tsx:287,293`, `components/game/CheckoutHint.tsx`.
4. Corriger accents et casse : `views/CricketGameView.tsx:255`, `views/KillerGameView.tsx:221,241`, `components/game-setup/SetupSummarySection.tsx:34`, `components/game/StartingPlayerOverlay.tsx:31`, `src/features/game-setup/setupViewModel.ts:63,79`, `src/features/game-setup/setupPresentation.ts:109-110`.
5. Supprimer ou traduire les pastilles de `views/GameSelectionView.tsx` (Q3).
6. Tests : `tests/unit/presentation/stats/statsLabels.fr.test.ts` (clés, casse), tests de composants concernés ; E2E inchangés (sélecteurs `data-testid`).
7. Rollback : revert ; aucune donnée concernée.
8. Documentation : lexique dans la référence des règles (spec 050), notes de version.
