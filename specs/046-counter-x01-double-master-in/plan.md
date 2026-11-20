# Plan — 046 X01 : ouverture Double/Master-In

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et décision Q1.

## 1. Lecture de l'existant

- Setup : `components/game-setup/SetupX01RulesSection.tsx:8-38`, `src/features/game-setup/setupModel.ts:17,80,250,333,444`, `setupViewModel.ts:86`, `setupPresentation.ts:11-31,97-113`, `views/SetupView.tsx:45,83,160,185,195,369`.
- Moteur : `src/application/scoring/matchLifecycle.ts:259-291` ; soumission `src/features/x01/scoring/matchSubmission.ts:39-114`.
- Vue : `views/MatchView.tsx:347-423` (soumission, RESTE), `components/game/MatchPlayerArea.tsx`, `components/game/PlayerScore.tsx`.
- Lien : `src/features/external-match/externalMatchLink.ts:225-245,317,383` ; doc `docs/integration/external-match-link.md:46-57` ; simulateur `docs/integration/partner-simulator/index.html`.

## 2. Approche retenue (et alternatives écartées)

Option B (si validée) : état d'ouverture **dérivé** de l'historique de manche, validation d'ouverture par table précalculée, confirmation unique par équipe et par manche. Écartées : champ persistant `openedTeams` (migration inutile) ; saisie par fléchette (option C, complexité).
Option A (si retenue) : suppression UI + normalisation `checkIn = 'Open'`, contrat traité selon Q3.

## 3. Étapes

Option B :
1. Golden tests d'ouverture (spec 039/050).
2. Domaine : `isTeamOpened(leg, teamId)`, `isPossibleOpeningTotal(total, rule)`.
3. `buildScoreSubmissionResult` : nouveau résultat `opening_confirm` quand l'équipe n'est pas ouverte et total > 0 ; refus si impossible.
4. `MatchView` : dialogue de confirmation (réutilise le style de `checkout-confirm-modal`), refus RESTE avant ouverture, état dans le bandeau.
5. Robot : désactivation de l'option robot si `checkIn ≠ Open` (Q4 = a) dans `setupModel.ts`.
6. Règles affichées et libellés « Ouverture » (au lieu de « Check-in »).
7. Doc partenaire : retirer la « limite connue ».

Option A : 1. retirer la section du setup et du résumé ; 2. normaliser `checkIn` à `Open` dans `setupModel` et `arenaPrefillConfig` ; 3. appliquer Q3 dans `externalMatchLink.ts` ; 4. docs.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/domain/scoring/` (ou module défini par la spec 057) | (B) Fonctions d'ouverture |
| `src/features/x01/scoring/matchSubmission.ts` | (B) Résultat `opening_confirm` |
| `views/MatchView.tsx`, `components/game/PlayerScore.tsx` | (B) Dialogue, état d'ouverture |
| `src/features/game-setup/setupModel.ts`, `setupPresentation.ts`, `setupViewModel.ts`, `components/game-setup/SetupX01RulesSection.tsx` | Règles affichées ; (A) retrait ; (B) robot |
| `src/features/external-match/externalMatchLink.ts` | (A) Q3 uniquement |
| `docs/integration/external-match-link.md`, `docs/specifications.md`, `README.md` | Doc |
| `tests/unit/x01/*`, `tests/unit/gameSetup/*`, `tests/e2e/external-match-link.smoke.spec.ts` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

B : domaine (2 fonctions), application (soumission), UI (dialogue, bandeau). A : UI et lien. Infrastructure : aucun.

## 6. Stratégie de migration

Aucun schéma modifié. B : un match restauré applique la règle aux visites suivantes. A : `checkIn` restauré ≠ Open → normalisé à Open à la restauration et signalé (journal de développement).

## 7. Stratégie de test

Unitaires table-driven (ouverture, undo, doublettes, manches), composant dialogue, E2E local + lien `in=double`.

## 8. Non-régression

Open par défaut ; lien sans `in` (badarts.fr) ; spec 045 ; voix ; robot Open.

## 9. Rollback / désactivation

B : constante de fonctionnalité `X01_OPENING_RULES_ENABLED` (build) permettant de revenir à la mesure transitoire Q2 a) ; A : revert.

## 10. Documentation à mettre à jour avec l'implémentation

Règles affichées, référence des règles (spec 050), guide partenaire, notes de version, révision V2 de la spec 030.
