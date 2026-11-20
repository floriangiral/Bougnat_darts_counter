# Plan — 047 Cricket : écran de victoire, annulation et départage

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `views/CricketGameView.tsx:95-108` (`finishMatch`, `handleLegWin`), `:110-181` (fin par fermeture et par tours), `:200-211` (undo), `:244-276` (écran de fin).
- `utils/cricketLogic.ts:123-140` (`resolveCricketWinnerOnRounds`).
- `src/app/useGameLifecycle.ts:93-109` ; `views/TriathlonGameView.tsx:162-175,285-295` ; `views/CricketStatsView.tsx:14-15`.
- Modèle de référence : `views/CapitalGameView.tsx:140-150`.

## 2. Approche retenue (et alternatives écartées)

Différer `onFinish` au clic (comme Capital). Écartées : toast d'annulation de 5 s (moins explicite en bar, rapport 03 §6.3) ; extraction immédiate d'un `GameEndScreen` commun (relève de la spec 049, plus large).

## 3. Étapes

1. Tests de caractérisation de `CricketGameView` (rendu, fin actuelle) sur base des golden tests (spec 039).
2. `finishMatch` : ne plus appeler `onFinish` ; conserver le résumé dans l'état (ou le recalculer au clic).
3. Écran de fin : boutons « Annuler la dernière fléchette », action de validation (prop `finishActionLabel` fournie par le Triathlon), garde anti double clic.
4. `resolveCricketWinnerOnRounds` → retourne `{ winnerId: string | null }` ; suppression de `localeCompare` ; égalité selon Q2.
5. Consommateurs de `winnerId: null` : historique, `CricketStatsView`, Triathlon.
6. Libellés.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `views/CricketGameView.tsx` | Flux de fin, écran, prop de libellé |
| `utils/cricketLogic.ts` | Départage |
| `views/CricketStatsView.tsx` | Ordre et ex æquo |
| `views/TriathlonGameView.tsx` | Libellé « Épreuve suivante » |
| `utils/triathlonScoring.ts` | Robustesse `winnerId: null` (coordination spec 048) |
| `tests/unit/cricketLogic.test.ts`, nouveau `tests/unit/components/cricketGameView.test.tsx`, `tests/e2e/*` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

UI : écran de fin. Domaine (`utils/cricketLogic`) : départage. Application : moment d'enregistrement. Infrastructure : aucun.

## 6. Stratégie de migration

Aucune donnée persistée modifiée ; entrées d'historique existantes inchangées.

## 7. Stratégie de test

Unitaires de départage (égalités à 2 et 3 joueurs), composant (fin → annulation → nouvelle fin → validation unique), E2E partie simple et Triathlon.

## 8. Non-régression

Suites Cricket existantes, revanche, Triathlon complet, statistiques Cricket.

## 9. Rollback / désactivation

Revert du commit ; aucune donnée à restaurer.

## 10. Documentation à mettre à jour avec l'implémentation

Règles affichées (`setupPresentation.ts:116-127`, mention du départage), référence des règles (spec 050), notes de version.
