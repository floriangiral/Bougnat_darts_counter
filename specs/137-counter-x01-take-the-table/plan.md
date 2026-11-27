# Plan — 137 « Je prends la gagne » en X01

> Spec validée par le product owner le 2026-11-27. Plan à exécuter après intégration des travaux en cours sur l'écran de fin X01 (partage) pour limiter les conflits dans `views/StatsView.tsx`.

## 1. Lecture de l'existant

- `views/StatsView.tsx:51-57` (sortie automatique), `:221-249` (rangée Revanche / Partager / Sortie).
- `App.tsx:522-531` (`MatchView` sans `skipStartingPlayerPrompt`), `:630-645` (`StatsView`, `onRematch` absent en partenaire), `:218+` (restauration de la session), écriture de la session persistée.
- `src/app/useGameLifecycle.ts:212-237` (`handleReturnToGameSelection`, `startRematch`, `handleMatchRematch`).
- `views/MatchView.tsx:344-367,450,516-523,1316-1329` (`skipStartingPlayerPrompt`, `hasGameStarted`, instantané).
- `src/features/game-setup/setupModel.ts:513-580` (`buildSetupPlayers`, `buildSetupConfig`), `src/features/game-setup/x01QuickFormat.ts`, `src/app/x01QuickFormatController.ts`.
- `src/application/scoring/x01Ranking.ts`, `src/presentation/stats/x01RankingPresenter.fr.ts`.
- `src/shared/session/persistedAppSession.ts`, `src/app/sessionRecovery.ts`.
- `components/ui/Button.tsx` (variantes), `components/ui/FitText.tsx`, `components/stats/X01ShareDialog.tsx` (modèle de fenêtre et de retour du focus), `src/styles/tokens/{primitives,themes,bridge}.css`, `src/styles/screens/tablet-pages.css:894-950` (actions de l'écran de fin sur tablette).

## 2. Approche retenue (et alternatives écartées)

- **Modèle pur** dans `src/features/x01/challenger/` : toute la règle (éligibilité, sortants, validation, composition, file) est testable sans React. La composition réutilise `buildSetupPlayers` et `buildSetupConfig` (même façade `src/features`), pour produire des joueurs identiques à ceux de la préparation.
- **Démarrage sans question** : `App.tsx` transmet `skipStartingPlayerPrompt` à `MatchView` pour la partie lancée par « Je prends la gagne » (identifiant de match retenu en mémoire) ; `hasGameStarted` publié dans l'instantané couvre le rechargement. Écarté : un nouveau champ de `GameConfig` (impact sur le contrat partenaire, les validateurs et l'historique).
- **File dans la session** : champ optionnel `x01ChallengerQueue`, sans montée de version du schéma. Écarté : une clé `localStorage` séparée (durée de vie différente de la session, effacement plus fragile).
- **Couleurs** : deux variantes de `Button` (`rematch`, `challenge`) adossées à des rôles déclarés dans les deux thèmes. Écarté : réutiliser `info` / `success` (sens d'état) ou `game-*` (réservés).
- **Disposition** : règles CSS sur les attributs du résolveur (`data-size-w`, `data-orientation`, `data-recipe`) dans la feuille de l'écran de fin, plus `FitText` dans chaque bouton ; pas de `matchMedia`.

## 3. Étapes

1. **Modèle** `src/features/x01/challenger/x01Challenger.ts` :
   - `canTakeTheTable(match, { isPartner })` (RM-01) ;
   - `getChallengerContext(match)` : vainqueur, joueurs sortants possibles avec rang (via `presentX01Ranking` ou `rankX01Competitors`), sortant par défaut (RM-04), mode duel / multi / doublettes ;
   - `normalizeName`, `validateChallengers({ challengerNames, remainingNames })` → erreurs par champ (RM-08) ;
   - `buildTakeTheTableSetup(match, { leaverIds, challengerNames })` → `{ players, config }` : ordre RM-05 ou RM-06, `initialStartingPlayerIndex: 0` ou `initialStartingTeamId: 'team1'` et `teamStarterIds` ; configuration reconduite (RM-07) ;
   - `toQuickFormat(...)` pour la mémorisation (RM-16) ;
   - file : `prefillChallengers(queue, count, remainingNames)`, `computeWaitingList(queue, challengerNames)`, `addToQueue`, `removeFromQueue`, `moveUpInQueue`, `sanitizeChallengerQueue(raw)` ; constante `X01_CHALLENGER_QUEUE_MAX = 12`, longueur 100.
2. **Rôles de couleur** : primitives éventuelles dans `primitives.css`, rôles `--bd-rematch`, `--bd-rematch-fg`, `--bd-rematch-subtle`, `--bd-rematch-border`, `--bd-on-rematch` et l'équivalent `challenge` dans les deux thèmes de `themes.css`, pont `bridge.css` ; paires ajoutées à `tests/unit/designSystem/themeContrast.test.ts` ; guide `docs/design-system.md`.
3. **Bouton** : variantes `rematch` et `challenge` dans `components/ui/Button.tsx` (classes de rôles, `data-variant`).
4. **Fenêtre** `components/stats/X01ChallengerDialog.tsx` : `<dialog>` modal sur le modèle de `X01ShareDialog` ; vainqueur avec trophée ; « Qui sort ? » (3-4 joueurs) ; champs challengers ou équipe challenger ; raccourcis ; « Prochain : … » et liste (Retirer, Monter) ; « Ajouter à la file » ; boutons d'ajout des sortants (`aria-pressed`) ; « Annuler » / « Lancer » ; Entrée ; messages ; cibles ≥ 44 / 48 px ; défilement interne. Libellés dans `src/presentation/stats/statsLabels.fr.ts`.
5. **Écran de fin** `views/StatsView.tsx` : props `onTakeTheTable?(request)` et `challengerQueue` ; bouton entre Revanche et Partager ; Revanche en `rematch` ; sortie automatique suspendue pendant la fenêtre ; classes de disposition (2 × 2 en téléphone portrait avec quatre boutons, une ligne de quatre élargie ailleurs) ; `FitText` dans les libellés ; règles CSS associées (feuille de l'écran de fin, `src/styles/screens/tablet-pages.css` pour la tablette).
6. **Cycle de vie** `src/app/useGameLifecycle.ts` : `handleTakeTheTable(finishedMatch, request)` : `saveFinishedMatchLocally`, `buildTakeTheTableSetup`, `createMatch`, `rememberX01QuickFormat`, `setChallengerQueue(waitingList)`, mémorisation de l'identifiant du match pour `skipStartingPlayerPrompt`, plein écran, écran `MATCH`. `handleReturnToGameSelection` vide la file.
7. **App** `App.tsx` : état `x01ChallengerQueue` (restauré, persisté), `onTakeTheTable` passé à `StatsView` seulement si `canTakeTheTable`, `skipStartingPlayerPrompt` passé à `MatchView` pour le match lancé.
8. **Session** : `x01ChallengerQueue?: string[]` dans `PersistedAppSession` ; assainissement dans `parsePersistedAppSession` (absent → `[]`) ; écriture dans la session.
9. **Tests** (§7), puis **documentation** (§10).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/features/x01/challenger/x01Challenger.ts` | Nouveau : modèle pur (éligibilité, sortants, validation, composition, file) |
| `components/stats/X01ChallengerDialog.tsx` | Nouveau : fenêtre « Qui prend la gagne ? » |
| `views/StatsView.tsx` | Bouton, variantes, disposition, sortie automatique |
| `components/ui/Button.tsx` | Variantes `rematch` et `challenge` |
| `src/presentation/stats/statsLabels.fr.ts` | Libellés et messages |
| `src/app/useGameLifecycle.ts` | `handleTakeTheTable`, file vidée au retour au choix des jeux |
| `App.tsx` | État de la file, props `StatsView` et `MatchView`, persistance |
| `src/shared/session/persistedAppSession.ts` | Champ optionnel `x01ChallengerQueue` |
| `src/app/sessionRecovery.ts` | Assainissement de la file relue |
| `src/styles/tokens/primitives.css`, `themes.css`, `bridge.css` | Rôles `rematch-*` et `challenge-*` |
| Feuille CSS de l'écran de fin, `src/styles/screens/tablet-pages.css` | Disposition adaptative et cibles |
| `tests/unit/x01/x01Challenger.test.ts` | Nouveau : modèle |
| `tests/unit/components/x01ChallengerDialog.test.tsx` | Nouveau : fenêtre |
| `tests/unit/components/statsViews.test.tsx` | Écran de fin |
| Tests de `useGameLifecycle` et de `sessionRecovery` | Cycle de vie et session |
| `tests/unit/designSystem/themeContrast.test.ts` | Paires des nouveaux rôles |
| `tests/e2e/…` | Parcours X01 « Je prends la gagne » (exécuté en CI uniquement) |

## 5. Impacts UI / domaine / application / infrastructure

- UI : écran de fin X01 et nouvelle fenêtre ; aucun autre écran.
- Domaine : aucun ; les règles X01 (`matchLifecycle`, rotation) sont réutilisées telles quelles.
- Application : `useGameLifecycle`, `App.tsx`.
- Infrastructure : session persistée (champ optionnel) ; stockage de la partie rapide inchangé.
- Règle de dépendance : la vue et la fenêtre passent par la façade `src/features/x01/challenger`, jamais par `src/domain`.

## 6. Stratégie de migration

Aucune migration : `x01ChallengerQueue` est optionnel ; absent, il vaut `[]`. `APP_SESSION_SCHEMA_VERSION` reste 2. Une file invalide est assainie sans écarter la session.

## 7. Stratégie de test

- Unitaires : toutes les règles RM-01 à RM-16 du modèle (AC-03 à AC-09, AC-12, AC-13).
- Composants : fenêtre (AC-07 à AC-10, AC-17) et écran de fin (AC-01, AC-02, AC-11, AC-15).
- Application : lancement sans question de départ et rechargement (AC-03, AC-14), file vidée (AC-12).
- Thèmes : contraste (AC-16) ; `npm run guard:clean`.
- E2E en CI uniquement (jamais en local) ; recette terrain sur téléphone, tablette, ordinateur.
- Couverture : planchers de la spec 029 respectés ; aucune exclusion nouvelle hors composition UI.
- Commandes locales : `npm run typecheck`, `npm run lint && npm run lint:type-aware`, `npm run test:unit`, `npm run test:unit:coverage && npm run governance:coverage`, `npm run guard:clean`, `npm run build`.

## 8. Non-régression

Revanche (mêmes joueurs, questions de départ), partage X01, Sortie, lien partenaire, ordre de passage et places jouées, partie rapide, reprise de session, écrans de fin des autres jeux : tests existants verts (AC-18).

## 9. Rollback / désactivation

Retirer `onTakeTheTable` de `StatsView` dans `App.tsx` masque la fonctionnalité ; le champ de session devient inerte. Un retour à une version antérieure ignore `x01ChallengerQueue` sans écarter la session.

## 10. Documentation à mettre à jour avec l'implémentation

- Spec 137 (`implementee`, `verifie_au_commit`), tâches cochées ; `specs/README.md`.
- Spec 133 : note sur l'exception à RM-05 (mémorisation par « Je prends la gagne »).
- `docs/design-system.md` (rôles `rematch-*`, `challenge-*`, variantes de bouton).
- `docs/specifications.md` (écran de fin X01), notes de version `docs/release/v2.2.0.md` et changelog in-app `components/ui/ChangelogModal.tsx`.
- `AGENTS.md` si l'arborescence décrite change (`src/features/x01/challenger`).
