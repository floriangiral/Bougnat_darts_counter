# Plan — 049 Cadre de jeu commun

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison de la spec 058 pour le jeu concerné.

## 1. Lecture de l'existant

- Barres : `components/match/MatchTopBar.tsx`, `views/CricketGameView.tsx:283-317`, `views/CapitalGameView.tsx`, `components/triathlon/TriathlonGameHeader.tsx`, `views/KillerGameView.tsx:118-130`, `views/GotchaGameView.tsx:170-185`.
- Fins : `views/MatchView.tsx:771-786`, `views/CricketGameView.tsx:244-276`, `views/CapitalGameView.tsx:140-150`, `views/KillerGameView.tsx:100-110`, `views/GotchaGameView.tsx:143-162`.
- Cycle de vie : `src/app/useGameLifecycle.ts:77-202` ; écrans `src/app/appShell.ts`.
- Libellés : `src/presentation/stats/statsLabels.fr.ts`.
- Choix du lanceur : `components/game/StartingPlayerOverlay.tsx` ; `src/domain/killer/killer.ts:61-84`.

## 2. Approche retenue (et alternatives écartées)

Migration **jeu par jeu**, dans l'ordre Gotcha → Killer → Capital → Cricket → X01 → Triathlon (du plus simple au plus risqué), chaque jeu passant sur le contrat de la spec 058 puis dans le cadre. Écartées : « big bang » sur les 6 vues ; framework de jeu générique (sur-ingénierie).

## 3. Étapes

1. Composants `GameTopBar`, `ExitConfirmDialog`, `GameEndScreen` + tests de composants.
2. Libellés de fin centralisés.
3. Par jeu : tests de caractérisation → intégration du cadre → validation différée du résultat → choix du premier joueur → règles en partie.
4. Revanche avec alternance dans `useGameLifecycle.handleRematch`.
5. Statistiques : minuterie d'inactivité (Q2).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `components/game-frame/*` (nouveau) | Composants de cadre |
| `views/*GameView.tsx`, `views/MatchView.tsx` | Intégration |
| `components/game/CricketKeypad.tsx` | Libellé « Annuler ↶ » |
| `src/domain/killer/killer.ts` | Ordre conservé après attribution |
| `src/app/useGameLifecycle.ts`, `src/app/appShell.ts` | Enregistrement à la validation, revanche, écrans morts |
| `views/StatsView.tsx` | Minuterie (Q2) |
| `src/presentation/stats/statsLabels.fr.ts` | Libellés |
| `tests/unit/components/*`, `tests/e2e/*` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

UI majoritaire ; domaine Killer (ordre) ; application (cycle de vie). Infrastructure : aucun.

## 6. Stratégie de migration

Aucune donnée persistée modifiée. Les sessions X01 restaurées s'affichent dans le nouveau cadre.

## 7. Stratégie de test

Composants (cadre), un test de vue par jeu, E2E par jeu (spec 040). Couverture des nouvelles vues sans exclusion Sonar (spec 029).

## 8. Non-régression

Suites unitaires et E2E existantes ; sélecteurs `data-testid` conservés ou migrés explicitement.

## 9. Rollback / désactivation

Migration par jeu : chaque PR est réversible indépendamment.

## 10. Documentation à mettre à jour avec l'implémentation

README (parcours), `docs/specifications.md`, guide utilisateur (V2-DOC-05), notes de version.
