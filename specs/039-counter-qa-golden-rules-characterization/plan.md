# Plan — 039 Golden tests de règles et tests de caractérisation par jeu

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- X01 : `src/features/x01/scoring/matchSubmission.ts:39-88` (`buildScoreSubmissionResult`), `src/application/scoring/matchLifecycle.ts:215-316` (`finishLeg`, `submitTurn`, `undoTurn`), `src/application/x01Bot/x01BotTurn.ts:93-142` (aléa injectable).
- Cricket : `utils/cricketLogic.ts` (`processCricketHit` l.25, `checkCricketWin` l.90, `resolveCricketWinnerOnRounds` l.123).
- Capital : `utils/capitalLogic.ts` (`evaluateCapitalRound` l.254).
- Killer : `src/domain/killer/killer.ts` (`createKillerState` l.38, `assignKillerTarget` l.61, `recordKillerDart` l.127).
- Gotcha : `src/domain/gotcha/gotcha.ts` (`createGotchaState` l.32, `recordGotchaTurn` l.60).
- Triathlon : `utils/triathlonScoring.ts` (`buildTriathlonScorecards` l.413, `getTriathlonWinnerId` l.145), `src/domain/triathlon/`.
- Vues : `views/{MatchView,CricketGameView,CapitalGameView,KillerGameView,GotchaGameView,TriathlonGameView}.tsx`.
- Motif existant à réutiliser : `tests/unit/x01/matchScoring.test.ts:34` (instantané + comparaison).

## 2. Approche retenue (et alternatives écartées)

Retenue : scénarios TypeScript typés + adaptateur par jeu + exécuteur Vitest générique, verdicts `valide-metier` / `bug-connu` (`test.fails`) / `a-decider` (`test.todo`).
Écartées : instantanés Vitest (`toMatchSnapshot`) — figent tout l'état, y compris les bugs, et sont illisibles pour le PO ; JSON — pas de typage, aucune valeur ajoutée sans outil de génération documentaire ; bibliothèque de tests de propriétés (`fast-check`) — nouvelle dépendance, à reconsidérer plus tard.

## 3. Étapes

1. Créer `tests/unit/golden/scenario.ts` : types `GoldenScenario<TConfig, TInput, TExpected>`, `Verdict`, helper `runGoldenSuite(name, scenarios, adapter)` qui choisit `it`, `it.fails` ou `it.todo` selon le verdict.
2. Créer `tests/unit/golden/deepFreeze.ts` (gel récursif) et `tests/unit/golden/consistency.test.ts` (identifiants uniques, verdict, source, spec pour `bug-connu`).
3. X01 : `tests/unit/golden/x01/{adapter.ts,scenarios.ts}` + `x01.golden.test.ts` ; inclure robot avec `random` fixé.
4. Cricket, Capital, Killer, Gotcha, Triathlon : même structure.
5. `tests/unit/golden/immutability.test.ts` : chaque fonction de moteur appelée sur une entrée gelée ; cas `finishLeg` en `it.fails` référencé 057.
6. `tests/unit/golden/determinism.test.ts` : double rejeu.
7. Caractérisation des vues : `tests/unit/characterization/<jeu>View.test.tsx` (jsdom, `vi.useFakeTimers()` pour les chronos).
8. Revue PO des scénarios par jeu ; passage des verdicts `a-valider` interne → `valide-metier`.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `tests/unit/golden/**` | Création (format, exécuteurs, scénarios, adaptateurs) |
| `tests/unit/characterization/**` | Création (6 tests de vues) |
| `specs/039-…/spec.md` | Mise à jour des volumes réels et décisions |
| Code applicatif | **Aucun** (les `data-testid` manquants Killer/Gotcha sont ajoutés par 040) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun. Tests uniquement.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet : pas de donnée persistée. Lors de V2-ARCH-04 (058), seul `adapter.ts` du jeu migré change.

## 7. Stratégie de test

Les tests sont le livrable. Vérifier que chaque exécuteur échoue réellement en injectant une régression volontaire en local (non commitée). Couverture : inchangée ou en hausse ; aucune exclusion ajoutée (spec 029).

## 8. Non-régression

Tous les tests existants restent ; `npm run test:unit`, `npm run lint`, `npm run typecheck` verts.

## 9. Rollback / désactivation

Suppression du dossier `tests/unit/golden/` et `tests/unit/characterization/` ; aucun impact produit.

## 10. Documentation à mettre à jour avec l'implémentation

- Guide de test contributeur (V2-DOC-02, spec 035, ou `CONTRIBUTING.md`) : comment ajouter un scénario et changer un verdict.
- `AGENTS.md` (V2-DOC-03, spec 036) : « toute règle de jeu modifiée exige un scénario ».
- Lien croisé avec les règles de référence (V2-GAMES-26, spec 050).
