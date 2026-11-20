# Plan — 058 État de partie sérialisable et reducer pur par jeu

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Vues : `views/GotchaGameView.tsx:69-140`, `views/KillerGameView.tsx:31-95`, `views/CapitalGameView.tsx:50-135`, `views/CricketGameView.tsx:47-232`, `views/MatchView.tsx:81-646`, `views/TriathlonGameView.tsx:31-320`.
- Logique pure existante : `src/domain/gotcha/gotcha.ts`, `src/domain/killer/killer.ts`, `src/features/capital/capitalGameModel.ts`, `src/features/cricket/cricketGameModel.ts`, `utils/cricketLogic.ts`, `src/features/triathlon/triathlonFlow.ts`.
- Shell : `App.tsx:353-422`, `src/app/useGameLifecycle.ts:69-75`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : module pur par jeu + hook générique mince (ADR-0001, option 2).
- Écartées : persister les `useState` des vues (fige la dette, inutilisable pour la TV) ; store global (dépendance injustifiée) ; moteur générique unique (spec 060, prématuré).

## 3. Étapes
1. Socle : types `GameSetup`, `GameRuntimeSnapshot`, hook `useGameSession` (pile d'annulation bornée, publication du snapshot) avec tests.
2. Gotcha : extraire état + reducer (`recordGotchaTurn` existe) ; vue branchée sur le hook ; snapshot remonté.
3. Killer : idem (`assignKillerTarget`, `recordKillerDart`).
4. Capital : déplacer `capitalGameReducer` vers `src/domain/capital/` et le brancher sur le hook.
5. Cricket : regrouper les 9 états métier en un `CricketGameState` ; déplacer `handleHit`/`handleMisses`/rotation dans le reducer.
6. X01 : brancher la commande de la spec 057 comme reducer ; `MatchView` passe par le hook ; `MatchRuntimeSnapshot` devient un cas de `GameRuntimeSnapshot`.
7. Triathlon : état composite ; sous-vues alimentées par le hook parent.
8. `useGameLifecycle` : `GameSetup` au lieu du `MatchState` porteur.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/app/useGameSession.ts` | Création (hook générique) |
| `src/shared/session/persistedAppSession.ts` | Types `GameSetup`, `GameRuntimeSnapshot` (format persisté : spec 010) |
| `src/domain/{gotcha,killer,capital,cricket,x01,triathlon}/` | Ajout état + reducer |
| `views/*GameView.tsx`, `views/MatchView.tsx` | Branchement sur le hook |
| `App.tsx`, `src/app/useGameLifecycle.ts` | Callback de snapshot pour tous les jeux ; `GameSetup` |
| `sonar-project.properties` | Retrait progressif des vues migrées (avec spec 029) |

## 5. Impacts UI / domaine / application / infrastructure
UI inchangée visuellement ; domaine enrichi ; application : hook + shell ; infrastructure : aucune (stockage par la spec 010).

## 6. Stratégie de migration (données, sessions persistées, contrats)
Pas de changement de format dans cette spec. Tant que la spec 010 n'est pas livrée, le snapshot non-X01 est remonté mais non persisté (comportement de reprise inchangé). Contrat `v=1` intact.

## 7. Stratégie de test
Caractérisation (spec 039) rejouée sur chaque reducer ; tests de sérialisation et de gel profond ; tests de composant par vue ; E2E de la spec 040 après 010.

## 8. Non-régression
Suites unitaires existantes par jeu ; `gameplay-entry.smoke.spec.ts` ; E2E X01 et partenaire.

## 9. Rollback / désactivation
Une PR par jeu, réversible indépendamment ; aucune donnée persistée nouvelle tant que 010 n'est pas livrée.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (état des parties, carte des jeux), ADR-0001 (statut), spec 022 (reliquat clos).
