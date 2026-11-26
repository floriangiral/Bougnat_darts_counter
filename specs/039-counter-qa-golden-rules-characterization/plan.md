# Plan — 039 Golden tests de règles et tests de caractérisation par jeu

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- X01 : `src/features/x01/scoring/matchSubmission.ts` (`buildScoreSubmissionResult`), `src/application/scoring/matchLifecycle.ts` (`finishLeg`, `submitTurn`, `undoTurn`), `src/application/x01Bot/x01BotTurn.ts` (aléa injectable).
- Cricket : `utils/cricketLogic.ts`.
- Capital : `utils/capitalLogic.ts`.
- Killer : `src/domain/killer/killer.ts`.
- Gotcha : `src/domain/gotcha/gotcha.ts`.
- Triathlon : `utils/triathlonScoring.ts`, `src/domain/triathlon/`.
- Vues : `views/{MatchView,CricketGameView,CapitalGameView,KillerGameView,GotchaGameView,TriathlonGameView}.tsx` ; `views/Atc180GameView.tsx` selon Q6.
- 180 Around the Clock : `src/domain/atc180/` et `tests/unit/atc180/` ; périmètre à arbitrer en Q6.
- Tests existants à inventorier : `tests/unit/x01/matchScoring.test.ts`, `tests/unit/components/`, `tests/unit/triathlonScoringGolden.test.ts` et `tests/unit/atc180/`.

## 2. Approche proposée (et alternatives)

Proposition à arbitrer : scénarios TypeScript typés + adaptateur par jeu + exécuteur Vitest générique, verdicts `valide-metier` / `bug-connu` (`test.fails`) / `a-decider` (`test.todo`).
Alternatives : instantanés Vitest (`toMatchSnapshot`) — risquent de figer tout l'état, y compris les bugs ; JSON — pas de typage sans outil supplémentaire ; tests de propriétés avec `fast-check` — dépendance de développement déjà présente, complément éventuel à arbitrer.

## 3. Étapes

1. Créer `tests/unit/golden/scenario.ts` : types `GoldenScenario<TConfig, TInput, TExpected>`, `Verdict`, helper `runGoldenSuite(name, scenarios, adapter)` qui choisit `it`, `it.fails` ou `it.todo` selon le verdict.
2. Créer `tests/unit/golden/deepFreeze.ts` (gel récursif) et `tests/unit/golden/consistency.test.ts` (identifiants uniques, verdict, source, spec pour `bug-connu`).
3. X01 : `tests/unit/golden/x01/{adapter.ts,scenarios.ts}` + `x01.golden.test.ts` ; inclure robot avec `random` fixé.
4. Cricket, Capital, Killer, Gotcha, Triathlon : même structure ; 180 Around the Clock selon Q6.
5. `tests/unit/golden/immutability.test.ts` : chaque fonction de moteur appelée sur une entrée gelée ; vérifier que la fin de manche ne modifie pas les compteurs de l'entrée.
6. `tests/unit/golden/determinism.test.ts` : double rejeu.
7. Caractérisation des vues : `tests/unit/characterization/<jeu>View.test.tsx` (jsdom, `vi.useFakeTimers()` pour les chronos).
8. Revue PO des scénarios par jeu ; passage des verdicts `a-decider` à `valide-metier` après décision.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `tests/unit/golden/**` | Création (format, exécuteurs, scénarios, adaptateurs) |
| `tests/unit/characterization/**` | Compléments aux tests de vues existants, selon le périmètre arbitré |
| `specs/039-…/spec.md` | Mise à jour des volumes réels et décisions |
| Code applicatif | **Aucun** prévu ; réutiliser les sélecteurs accessibles des tests existants |

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
