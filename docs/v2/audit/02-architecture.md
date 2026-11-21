> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 02 — Architecture logicielle (chantier 5.9 + fondations transverses V2)

Agent : Architecture logicielle — Bougnat Darts V2
Date : 2026-11-20 — Branche analysée : `feat/v2.0.0` (HEAD `508dfa6`)
Mode : lecture seule stricte (aucun fichier du repo modifié, aucune dépendance installée, aucun script écrivant dans le repo). Les analyses de graphe ont été faites par scripts Node exécutés en mémoire (stdin → stdout), sans fichier écrit nulle part.

Légende : **[VÉRIFIÉ code]** constaté en lisant le code (chemin:ligne) · **[VÉRIFIÉ outil]** constaté via analyse automatique du graphe d'imports · **[HYPOTHÈSE]** déduction non exécutée · **[À CONFIRMER]** nécessite une vérification complémentaire (exécution, source externe, arbitrage).

---

## 1. Périmètre et fichiers analysés

### 1.1 Sources lues intégralement ou en grande partie
- Racine : `App.tsx` (479 l.), `index.tsx` (99), `types.ts` (155), `constants.ts` (165), `vite.config.ts`, `tsconfig.json`, `package.json`, `sonar-project.properties`, `vitest.config.ts` (extraits), `scripts/guard-clean-codebase.sh`, `manifest.json`, `sw.js` (présence).
- `views/` : `MatchView.tsx` (869, lu en entier), `CricketGameView.tsx`, `KillerGameView.tsx`, `GotchaGameView.tsx`, `CapitalGameView.tsx`, `TriathlonGameView.tsx` (extraits ciblés état/undo/orchestration).
- `src/app/` : `appShell.ts`, `useGameLifecycle.ts`, `useAppScreenHistory.ts` (imports).
- `src/domain/` : `scoring/**` (entités, services, value objects), `killer/killer.ts`, `gotcha/gotcha.ts`, `x01Bot/x01Bot.ts`, `triathlon/*` (exports).
- `src/application/` : `scoring/{matchLifecycle,matchStats,RecordThrow,UndoThrow,StartGame,EndLeg,EndGame,ports}.ts`, `x01Bot/x01BotTurn.ts`.
- `src/features/` : `x01/scoring/*`, `x01/session/useSharedX01Session.ts`, `x01/hooks/useMatchTimer.ts`, `x01/voice/{voiceProposalModel,useDeepgramStreaming (structure),dartsSpeechTypes,dartsSpeechParserScoring (extraits)}.ts`, `external-match/*` (structure complète), `cricket/cricketGameModel.ts`, `capital/capitalGameModel.ts`, `triathlon/triathlonFlow.ts` (exports), `tablet/tabletLayout.ts`.
- `src/infrastructure/local/{IndexedDBSessionRepository,sessionPersistence}.ts`, `src/shared/**`, `src/lib/env.ts`, `utils/{appPersistence,arenaFlow,cricketLogic,capitalLogic,triathlonScoring}.ts` (imports/exports), `src/styles/tailwind.css` (structure).
- Tests : arborescence `tests/unit` (81 fichiers) et `tests/e2e` (8 fichiers, liste des scénarios).

### 1.2 Documentation et gouvernance lues
- `docs/architecture.md`, `docs/architecture/{counter-pragmatic-clean-architecture,scoring-access-modes,scoring-terminal-offline-first-foundation}.md`, `docs/technical.md` (sections état, qualité, frontière).
- `.specify/memory/constitution.md`, `.specify-workspace/ (workspace, hors dépôt) constitution.transverse.md`, `.specify-workspace/backlog/next-specs.md`.
- `specs/010-counter-offline-session-recovery-guarantees/spec.md`, `specs/022-counter-arch-single-responsibility-split/spec.md`, `specs/031-counter-pwa-static-delivery/spec.md` (extraits).
- Repo voisin (lecture seule) : `Bougnat_Darts_Tournaments/docs/04-offline-strategy.md` et `docs/08-domain-model.md` (modèle `ScoreEvent`, règles d'autorité).

### 1.3 Outillage
- `madge` / `dependency-cruiser` / `dpdm` : **absents** de `node_modules/.bin` → graphe construit par script Node en mémoire (résolution des imports relatifs + alias `@/`, algorithme de Tarjan pour les cycles).

---

## 2. Cartographie de l'existant

### 2.1 Volumétrie par zone [VÉRIFIÉ outil]

| Zone | Fichiers | Lignes | Rôle réel constaté |
|---|---:|---:|---|
| `App.tsx` | 1 | 479 | Composition racine + **état global de navigation et de résultats** (14 `useState`) + orchestration spec 030 |
| `index.tsx` | 1 | 99 | Bootstrap, service worker, beacon analytics |
| `types.ts` | 1 | 155 | **Noyau de types partagé de facto** (importé par 55 fichiers) |
| `constants.ts` | 1 | 165 | Uniquement `CHECKOUT_GUIDE` (table de checkouts) |
| `views/` | 13 | 3 802 | Écrans **+ état de partie + orchestration des règles** |
| `components/` | 32 | 3 791 | UI réutilisable (keypads, scoreboards, modales) |
| `utils/` | 6 | 1 003 | **Moteurs de jeu legacy** (Cricket, Capital, Triathlon) + persistance localStorage + plein écran |
| `lib/` (racine) | 1 | 69 | Côté serveur : `grantDeepgramToken` (partagé Vite dev / Pages Function) |
| `functions/` | 1 | 199 | Pages Function `/api/deepgram/token` |
| `src/app` | 3 | 466 | Shell (écrans, persistance debounced, cycle de vie) |
| `src/domain` | 17 | 776 | Killer, Gotcha, bot X01, règles Triathlon, **domaine scoring X01 non branché** |
| `src/application` | 11 | 976 | `matchLifecycle` (moteur X01 réel), `matchStats`, bot, **use cases non branchés** |
| `src/features` | 48 | 5 117 | Setup, X01 (scoring/voix/hooks), Cricket/Capital/Triathlon (modèles), external-match, tablette/smartphone, install |
| `src/infrastructure` | 4 | 361 | IndexedDB + fallback localStorage, détection legacy CSS |
| `src/presentation` | 3 | 198 | Libellés FR stats / external match |
| `src/shared` | 4 | 90 | Types de session persistée, `createId`, ré-export env |
| `src/lib` | 1 | 50 | Lecture des variables `VITE_*` |
| `src/styles` | 1 | 549 | Tailwind 4 + règles de layout par device |
| `tests/unit` / `tests/e2e` | 81 / 8 | 8 922 / 755 | |

### 2.2 Où vit chaque moteur de jeu [VÉRIFIÉ code]

| Jeu | Règles pures | Modèle/transitions | État de partie détenu par | Undo | Reprise après reload |
|---|---|---|---|---|---|
| **X01** | `src/application/scoring/matchLifecycle.ts` (`submitTurn` l.265, `finishLeg` l.222) — **dans la couche application, pas domaine** | `src/features/x01/scoring/matchSubmission.ts` (validation de saisie, décision checkout) | `views/MatchView.tsx` (`useState<MatchState>` l.76) puis remonté à `App` via `onStateChange` (l.212) | Pile de snapshots dans la vue (`pushUndoSnapshot` l.297, `handleUndoAction` l.309) | **Oui** (seul jeu) via `matchRuntime` ; pile d'undo **vidée** à la restauration (l.147) |
| X01 « domaine » officiel | `src/domain/scoring/**` (`ScoringRules`, `ScoreValidator`, `ScoreInput`, entités `Game/Leg/Turn/Throw/Score`) | `src/application/scoring/RecordThrow.ts` etc. | — | `UndoThrow` → `undoTurn` | — |
| **Bot X01** | `src/domain/x01Bot/x01Bot.ts` (niveaux) | `src/application/x01Bot/x01BotTurn.ts` (`random` injectable l.96) | Déclenché par `useEffect` dans `MatchView` (l.560-645) | snapshot vue | X01 |
| **Cricket** | `utils/cricketLogic.ts` (`processCricketHit`, `checkCricketWin`) | `src/features/cricket/cricketGameModel.ts` (snapshots, agrégats, `advanceCricketTurn`) | `views/CricketGameView.tsx` : **7 `useState` séparés** (l.47-67) ; enchaînement tour/victoire/limite de rounds codé dans `handleHit` l.110, `handleMisses` l.140, `advanceTurn` l.191 | snapshots vue (`handleUndo` l.200) | **Non** |
| **Capital** | `utils/capitalLogic.ts` | `src/features/capital/capitalGameModel.ts` (`capitalGameReducer`, pur) | `useReducer` dans `views/CapitalGameView.tsx` l.50 | action `undo` du reducer | **Non** |
| **Killer** | `src/domain/killer/killer.ts` (pur, immuable) | idem | `useState` dans `views/KillerGameView.tsx` l.31 | snapshots vue (max 20, l.70) | **Non** |
| **Gotcha** | `src/domain/gotcha/gotcha.ts` (pur, immuable) | idem | `useState` dans `views/GotchaGameView.tsx` l.69 | snapshots vue (max 30) | **Non** |
| **Triathlon** | `src/domain/triathlon/*` + `utils/triathlonScoring.ts` (452 l.) | `src/features/triathlon/triathlonFlow.ts` (reducer) | `useReducer` dans `views/TriathlonGameView.tsx` l.31, qui **embarque** `MatchView`, `CricketGameView`, `CapitalGameView` | celui de chaque sous-jeu | **Non** (même l'étape X01 interne : pas de `onStateChange` passé, l.302-318) |

Constat de synthèse : **il existe au moins quatre « styles » de moteur coexistant** (fonctions pures dans `domain/` ; fonctions pures dans `utils/` ; reducer dans `features/` ; orchestration impérative dans la vue), et **le domaine X01 « officiel » (`src/domain/scoring`) n'est pas celui qui tourne**.

### 2.3 Logique métier mélangée à React [VÉRIFIÉ code]
- `views/MatchView.tsx` `handleRemainingSubmit` (l.388-425) : règles « score restant impossible », « utilise MISS », double-out reste 1, plafond 180 — **réimplémente** `ScoreValidator.validateRemainingTarget` (`src/domain/scoring/services/ScoreValidator.ts` l.16-44), qui n'est appelé nulle part en production.
- `MatchView` gère aussi : transition de leg (compte à rebours l.440-470), tour du bot (l.560-645), prévisualisation de victoire bot, pile d'undo, plein écran mobile, voix, raccourcis, persistance, chronomètre → **≥ 10 responsabilités**, 25+ `useState`/`useRef`.
- `views/CricketGameView.tsx` : la machine d'état de la partie (enchaînement des lancers, rotation, détection de fin par fermeture ou par limite de rounds, arbitrage) est **dans les handlers React**, malgré la mention « extrait » de la spec 022.
- `views/GotchaGameView.tsx` l.75-90 : calcul de projection (« would bust », « would win », cibles Gotcha) dans la vue — acceptable (présentation), mais à mutualiser avec une future projection TV.
- `src/app/useGameLifecycle.ts` l.69-75 : **tous les jeux** créent un `MatchState` X01 (`createMatch`) qui sert uniquement de « porteur » de `players`+`config` pour Cricket/Capital/Killer/Gotcha/Triathlon → modèle trompeur (un `MatchState` avec `startingScore`, `legsWon`… pour une partie de Cricket).

---

## 3. Direction des dépendances

### 3.1 Matrice des arêtes inter-zones (extrait significatif) [VÉRIFIÉ outil]

```
src/domain       -> root:types.ts            3   (gotcha, killer, x01Bot importent Player/X01BotLevel)
root:types.ts    -> src/domain               3   (KillerTarget, KillerPlayerState, GotchaPlayerState via import('...'))
root:types.ts    -> root:utils               1   (TriathlonScorecard via import('./utils/triathlonScoring'))
src/application  -> root:types.ts            9
src/application  -> src/features             1   (x01BotTurn.ts:4 -> features/x01/scoring/possibleTurnScores)
src/features     -> root:components          1   (voice/VoiceScoringControl.tsx:4 -> components/ui/Button)
src/features     -> src/app                  2   (tablet/tabletLayout.ts:1, tablet/useTabletLayout.ts:2 -> app/appShell)
src/features     -> root:utils               6   (cricket/capital/triathlon models -> utils/*Logic ; game-setup -> utils/arenaFlow)
src/shared       -> root:utils               1   (session/persistedAppSession.ts:10 -> utils/arenaFlow)
src/shared       -> src/lib                  1   (config/env.ts)
src/infrastructure -> root:utils             1   (IndexedDBSessionRepository.ts:4 -> utils/appPersistence)
root:utils       -> src/application          1   (triathlonScoring.ts:2 -> application/scoring/matchStats)
src/presentation -> src/features/application 2
root:views       -> src/domain               3   (directement, sans passer par application)
```

### 3.2 Violations de la règle documentée
La règle de `docs/architecture.md` l.112-118 (« domain may depend only on shared », « application may depend on domain and shared », « infrastructure may depend on application, domain, and shared », « no inward layer may import an outward layer ») est violée **[VÉRIFIÉ outil]** par :

| # | Violation | Preuve | Gravité |
|---|---|---|---|
| V1 | `domain` → racine `types.ts` (hors couches) | `src/domain/killer/killer.ts:1`, `gotcha/gotcha.ts:1`, `x01Bot/x01Bot.ts:1` | Moyenne (type-only, mais crée le cycle conceptuel V6) |
| V2 | `application` → `features` | `src/application/x01Bot/x01BotTurn.ts:4` | Moyenne |
| V3 | `features` → `app` | `src/features/tablet/tabletLayout.ts:1`, `useTabletLayout.ts:2` | Faible |
| V4 | `shared` → `utils` (legacy) | `src/shared/session/persistedAppSession.ts:10` (`GameType`) | Faible |
| V5 | `infrastructure` → `utils` | `src/infrastructure/local/IndexedDBSessionRepository.ts:4` | Faible |
| V6 | `utils` (moteur legacy) → `application` | `utils/triathlonScoring.ts:2` | Moyenne |
| V7 | `features` → `components` (UI) | `src/features/x01/voice/VoiceScoringControl.tsx:4` | Faible — convention « features = tranche verticale avec UI » non écrite |

Aucun garde-fou automatique n'existe : pas de `no-restricted-imports` ni de plugin de frontières dans `eslint.config.js` / `eslint.type-aware.config.js` **[VÉRIFIÉ code]** ; `scripts/guard-clean-codebase.sh` ne vérifie que l'absence de fichiers legacy.

### 3.3 Dépendances circulaires
- **Cycle statique (types inclus) : 1 composante fortement connexe** **[VÉRIFIÉ outil]** :
  `types.ts → src/domain/killer/killer.ts → types.ts`, `types.ts → src/domain/gotcha/gotcha.ts → types.ts`, `types.ts → utils/triathlonScoring.ts → src/application/scoring/matchStats.ts → types.ts`, `utils/triathlonScoring.ts → utils/cricketLogic.ts → types.ts`.
- **Cycles d'exécution (en excluant `import type` et `types.ts`, qui n'a aucune valeur runtime) : 0** **[VÉRIFIÉ outil]**. Le cycle est donc **conceptuel** (pas de risque d'initialisation de module), mais il signifie que `types.ts` n'est pas un noyau stable : il dépend du domaine et d'un utilitaire legacy.
- Fan-in le plus élevé : `components/ui/Button.tsx` (23), `src/application/scoring/matchLifecycle.ts` (15 — importé par toutes les vues de jeu pour `formatDuration` et `getOrderedPlayersAndStarter`, donc **helpers de présentation et de rotation logés dans le moteur X01**), `matchStats.ts` (7).

---

## 4. Gestion de l'état des parties

### 4.1 Modèle de données X01 [VÉRIFIÉ code]
`types.ts` l.29-56 : `MatchState { config, players, setsWon, legsWon, completedLegs: LegState[], currentLeg: LegState{scores, history: Turn[], winnerId, startingPlayerIndex}, status, matchWinnerId, currentPlayerIndex, duration }`.
- **Nature** : document immuable (chaque transition renvoie un nouvel objet — `submitTurn` l.265-299), **contenant** un journal de tours (`history: Turn[]`) mais aussi des agrégats redondants (`scores`, `legsWon`, `setsWon`, `currentPlayerIndex`).
- **Rejouabilité** : `submitTurn(match, score, darts)` est déterministe ; l'état complet est **reconstructible** à partir de `(players, config, choix du starter, suite des (score, darts))` **[HYPOTHÈSE forte : la fonction n'a ni horloge ni aléa ; non testé par rejeu]**. Le bot utilise l'aléa, mais son résultat est figé dans le `Turn` → le rejeu reste déterministe.
- **Granularité** : un `Turn` = une volée (score total + nb fléchettes), **pas de fléchette individuelle** (`Throw` n'existe que dans le domaine non branché `src/domain/scoring/entities/Throw.ts`). Conséquence : checkout réel, double-in et stats par segment sont impossibles à dériver.
- **Règles non appliquées** : `config.checkIn` (Double-in / Master-in) est configurable dans le setup (`components/game-setup/SetupX01RulesSection.tsx` l.32) mais **n'est lu nulle part dans `submitTurn` ni `matchSubmission`** **[VÉRIFIÉ code — grep `checkIn` vide dans `src/application` et `src/features/x01`]**. Le master-out n'est pas busté à reste 1 dans `submitTurn` (l.270 ne teste que `Double`). À transmettre à l'agent « Revue des jeux ».

### 4.2 Modèle des autres jeux [VÉRIFIÉ code]
- Cricket : `CricketPlayerState[]` (marks, score, historique de hits par compétiteur) + **état de tour hors modèle** (`currentThrowerIdx`, `turnDartsThrown`, `orderedPlayers`, `winnerId`, `aggregateStats` dans 5 autres `useState`). Pas d'objet sérialisable unique.
- Capital : `CapitalGameState` (reducer) — sérialisable, mais non persisté.
- Killer / Gotcha : `KillerState` / `GotchaState` — sérialisables, immuables, non persistés.
- Triathlon : `TriathlonFlowState` + états internes des sous-vues — non sérialisable d'un bloc.

### 4.3 Undo / correction [VÉRIFIÉ code]
- **Toutes les implémentations d'undo sont des piles de snapshots dans la vue**, avec 5 variantes (append/pop en X01 et Cricket ; prepend/slice(1) bornée à 20 en Killer, 30 en Gotcha ; action reducer en Capital).
- `undoTurn` (`matchLifecycle.ts` l.301-327) — la version « domaine » — est **incomplète** : ne franchit pas une frontière de leg (le leg terminé est déjà archivé dans `completedLegs`) et, si le match est fini, restaure le score sans annuler `status='finished'`, `legsWon`, `matchWinnerId`. Elle n'est utilisée qu'en test (via `UndoThrow`, non branché).
- **Aucune correction d'une volée passée** (seul un undo LIFO existe). Pour corriger le tour n-3, il faut annuler 3 tours et les ressaisir.
- **L'undo ne survit pas au rechargement** (X01 : `setUndoStack([])` à la restauration l.147 ; autres jeux : tout est perdu).

### 4.4 Source de vérité et flux [VÉRIFIÉ code]
```
MatchView.useState(match) ──onStateChange (chaque rendu où match/elapsedSeconds/hasGameStarted change)──▶ App.setMatchRuntime
App (14 useState) ──useEffect──▶ persistAppSession (debounce 300 ms) ──▶ IndexedDBSessionRepository.saveAppSession (+ localStorage synchrone)
                                                                    └─▶ saveCurrentMatch(session.currentMatch)
```
- La source de vérité « vivante » est **l'état React de la vue** ; `App` en détient une copie (`matchRuntime`) ; IndexedDB et localStorage en détiennent deux autres. Pour les jeux non-X01, la seule vérité est l'état React de la vue.
- `useMatchTimer` incrémente `elapsedSeconds` **chaque seconde** (`src/features/x01/hooks/useMatchTimer.ts` l.27-33), qui fait partie du snapshot remonté (l.212-217) → **une écriture complète de session (JSON.stringify de toute la session en localStorage synchrone + put IndexedDB + relecture/réécriture de la table `bougnat-current-match-v1`) toutes les secondes pendant un match X01** **[VÉRIFIÉ code, coût non mesuré]**.
- `useSharedX01Session` (`src/features/x01/session/useSharedX01Session.ts`) est un **stub no-op** hérité de la sync v1 retirée ; `MatchView` l'appelle à chaque transition (`persistSharedState`). Props `sharedSessionId`/`currentUserId` jamais passées par `App` → code mort… mais **point d'accroche naturel** pour une future diffusion.

### 4.5 Persistance [VÉRIFIÉ code]
- `IndexedDBSessionRepository` (DB `bougnat-counter-local` v1 ; stores `app_sessions`, `current_matches`, `match_history`) + fallback localStorage écrit **systématiquement** (pas seulement en secours).
- **Croissance non bornée** : `saveCurrentMatch` (l.107-127) ajoute chaque `match.id` dans `current_matches` **et** dans la map localStorage `bougnat-current-match-v1`, **jamais purgées** (y compris le `MatchState` porteur des parties Cricket/Capital…). `getCurrentMatch` n'est appelé nulle part. Risque de saturation du quota localStorage (~5 Mo selon navigateurs **[À CONFIRMER]**) → les écritures échouent **silencieusement** (catch vide l.233) → la reprise de session cesse de fonctionner sans signal **[HYPOTHÈSE sur l'échéance : dépend du nombre de parties]**.
- Historique local : borné à 50 en localStorage, **non borné** en IndexedDB ; `listLocalGameHistory` n'est consommé par aucun écran.
- **Aucun versionnement de schéma ni validation structurelle** : restauration par cast (`readLocalStorageJson<PersistedAppSession>` → `as T`), seule `externalMatch` est revalidée (`restoreExternalMatchContext`). Une évolution du format en V2 (ex. ajout d'un état Cricket) chargera d'anciens objets sans contrôle **[VÉRIFIÉ code]** ; un `matchRuntime` structurellement incohérent ferait planter `MatchView` (`currentPlayer.teamId` l.162) **[HYPOTHÈSE]**.
- Port `SessionRepository` (`src/application/scoring/ports.ts`) : **implémenté mais jamais consommé** par la couche application ; l'app shell appelle directement le singleton `sessionPersistence.ts`. `SyncRepository = Record<string, never>` (placeholder).

### 4.6 Reprise de partie [VÉRIFIÉ code]
- X01 : reprise de l'état (score, legs, chrono) ✔ ; undo perdu ✘.
- **Cricket, Capital, Killer, Gotcha, Triathlon** : `App` restaure `screen='CRICKET_GAME'` et `currentMatch` (porteur players/config) → la vue se remonte avec un **état initial** → la partie **recommence silencieusement à zéro** (overlay de starter réaffiché). **Contradiction directe avec l'invariant de la spec 010** « pas de perte silencieuse d'état critique pendant une partie en cours ». Non couvert par les E2E (aucun test reload sur ces jeux).
- Killer/Gotcha : `handleKillerFinish`/`handleGotchaFinish` ne naviguent pas (l.148-180) ; les écrans `KILLER_STATS`/`GOTCHA_STATS` sont déclarés dans `AppScreen` mais **jamais rendus** par `App` (valeurs d'énumération mortes).

---

## 5. Docs d'architecture : divergences avec le code

| # | Document (ligne) | Affirmation | Réalité code | Gravité |
|---|---|---|---|---|
| D1 | `docs/architecture.md` l.112-118 | Règle de dépendance stricte | 7 violations (§3.2), aucun outil de contrôle | Moyenne |
| D2 | `docs/architecture.md` l.69-101 | Arborescence sous `src/` | `views/`, `components/`, `utils/`, `types.ts`, `constants.ts`, `lib/` sont **à la racine** ; `src/presentation`, `src/styles` absents du schéma | Moyenne (trompe un nouveau contributeur) |
| D3 | `docs/architecture.md` l.21, l.105-106 | « domaine et use cases… », `application/` = use cases et ports | Use cases `RecordThrow/UndoThrow/StartGame/EndLeg/EndGame` + domaine `src/domain/scoring` **non branchés** (tests uniquement) ; le vrai moteur X01 est `matchLifecycle` + `matchSubmission` + `MatchView` | **Haute** (domaine fantôme) |
| D4 | `docs/architecture.md` l.34-36 + spec 010 | « reprise de session », « pas de perte silencieuse » | Reprise X01 uniquement | **Haute** |
| D5 | `docs/architecture.md` l.87 | `useMatchTimer` = timer + horloge | Utilisé par X01 seulement ; 5 autres vues réimplémentent horloge/chrono (`setInterval` dans Cricket l.232, Capital l.81, Triathlon l.55, Killer l.45, Gotcha l.98) | Faible |
| D6 | `docs/architecture.md` l.156 | « seule intégration réseau : Deepgram » | `index.tsx` l.18-33 injecte aussi le beacon Cloudflare Web Analytics si `VITE_CF_WEB_ANALYTICS_TOKEN` est défini (documenté ailleurs dans `technical.md` « Observabilité web ») | Faible (formulation) |
| D7 | `docs/architecture/scoring-terminal-offline-first-foundation.md` | « débuts de ports et adapters pour une future sync » | Port non consommé, placeholder vide | Faible (archive) |
| D8 | `specs/022` | Cricket « extrait » dans `cricketGameModel` | Orchestration toujours dans la vue | Moyenne |
| D9 | `sonar-project.properties` (commentaire) | « UI composition is validated through Playwright » | Les 7 vues de jeu sont **exclues de la couverture** ; les E2E ne testent que l'**entrée** dans les jeux (`gameplay-entry.smoke.spec.ts`), pas le déroulé, l'undo ni la reprise (seul X01 lié est joué jusqu'au bout dans `external-match-link.smoke.spec.ts`) | **Haute** : la logique de jeu logée dans les vues n'est testée ni en unitaire ni en E2E |
| D10 | Constitution locale règle 2 | « Les vues ne doivent pas concentrer durablement orchestration, persistence et domaine » | `MatchView`, `CricketGameView` le font | Moyenne |
| D11 | `docs/architecture/scoring-access-modes.md` | Liste d'écrans sans Killer/Gotcha | Archive v1.0.0 | Faible |

Points **conformes** (à préserver) : description de la spec 030 dans `docs/architecture.md` l.160-172 fidèle au code ; `externalMatchLink.ts` réellement pur (horloge injectée `now`) ; domaine Killer/Gotcha pur et immuable ; bot à aléa injectable ; parseur vocal pur séparé du hook Deepgram ; **0 cycle d'exécution**.

---

## 6. Fondations pour les usages V2

### 6.1 (a) Mode TV / multiscreen
**Question** : peut-on synchroniser plusieurs interfaces sans dupliquer les règles ?
**Constat** :
- X01 : oui en principe — l'état est un objet sérialisable immuable ; tout ce qu'affiche un tableau de score (scores, legs/sets, joueur courant, dernier tour, stats `matchStats`, `CHECKOUT_GUIDE`) en dérive par fonctions pures **[VÉRIFIÉ code]**. Taille estimée d'un `MatchState` 501 en 5 legs : ~10-20 Ko JSON **[HYPOTHÈSE, non mesuré]**.
- **Autres jeux : impossible en l'état** sans réécrire l'orchestration côté TV, car l'état vit éclaté dans des `useState` de vues (Cricket) ou n'est pas exposé hors de la vue (Capital/Killer/Gotcha/Triathlon) **[VÉRIFIÉ code]**. C'est **la même cause racine que le défaut de reprise (§4.6)**.

**Responsabilités proposées** (cohérentes avec `Bougnat_Darts_Tournaments/docs/04-offline-strategy.md` : « un écran public ne pousse jamais de mutation, il repart d'un snapshot puis realtime ») :
- **Appareil de contrôle** = unique écrivain ; exécute les commandes via le reducer pur du jeu ; produit après chaque transition une **projection d'affichage versionnée** (`seq` monotone) ; détient la capacité d'écriture.
- **Écran de diffusion** = lecteur pur ; n'embarque **aucun dispatcher de commande** (lecture seule par construction, pas seulement par droit) ; rend la projection ; en cas de reconnexion, demande le dernier snapshot (pas de rejeu nécessaire).
- **Service de synchronisation éventuel** = relais « dernier snapshot + diffusion » ; aucune règle de jeu ; accepte les publications uniquement avec un secret de contrôle distinct de l'identifiant de visionnage ; TTL du canal. Choix technique et coûts : **périmètre de l'agent Mode TV** ; côté architecture, il suffit d'un port `ScoreboardBroadcaster` avec un adaptateur local (`BroadcastChannel`, gratuit, mais **même navigateur/même appareil uniquement**) et un ou plusieurs adaptateurs distants à évaluer **[À CONFIRMER : coûts Cloudflare Durable Objects / WebRTC + signalisation non vérifiés par moi]**.

**Pourquoi des snapshots (state transfer) et pas des événements pour les spectateurs** :
- Correction d'un score = nouveau snapshot de `seq` supérieur → cohérence **par construction**, aucun recalcul côté TV.
- Reprise après déconnexion = récupérer le dernier snapshot (idempotent, auto-réparant).
- Pas de conflit : un seul écrivain. Plusieurs sessions simultanées = identifiants de session distincts (`createId` existe déjà : `src/shared/ids/createId.ts`).
- Les événements restent utiles pour l'**animation** (« 180 ! », « bust ») : un champ `lastEvent` dans l'enveloppe suffit.

**Projection vs état brut** : recommander une **projection par jeu** (`toScoreboardProjection(state): ScoreboardProjectionV1`) calculée côté contrôleur, plutôt que d'envoyer l'état interne :
- découple le contrat public (TV, partenaires, Tournaments live) de l'état interne qui évoluera ;
- garantit que l'écran spectateur et les partenaires ne réimplémentent jamais de règle (exigence §7 de la mission) ;
- la même projection peut alimenter la vue « grand écran » locale (tablette + HDMI) et la TV distante ;
- coût : une fonction pure + un type par jeu, testables unitairement.

### 6.2 (b) Design system / thèmes / personnalisation
- Styles : utilitaires Tailwind **inline**, couleurs **codées en dur** (~963 occurrences de classes de couleur `bg-/text-/border-<palette>` dans `views/components/src/App.tsx`, 8× `bg-[#06080d]`, 6× `#101827`…) ; `src/styles/tailwind.css` (549 l.) ne contient **aucun token sémantique** (`@theme` absent, pas de `data-theme`, pas de `prefers-color-scheme`) ; seules des variables de safe-area/layout existent **[VÉRIFIÉ outil]**. `components/game-setup/setupViewStyles.ts` centralise quelques chaînes de classes (amorce de tokens).
- Couplage domaine ↔ style : **aucun** (bon point) — mais `getFeedbackStyles` (`src/features/x01/scoring/matchFeedback.ts`) mappe des états métier vers des classes Tailwind dans `features` : à garder côté présentation.
- Fondation recommandée (détail UI laissé à l'agent design) : tokens sémantiques en variables CSS (Tailwind 4 `@theme`) ; thème appliqué par attribut sur la racine (`data-theme`, `data-surface="tv"`) ; configuration de personnalisation (logo, couleurs club) = **objet de préférences séparé** de la session de jeu, stocké localement, jamais importé par `domain/application` ; contrainte de contraste validée à la saisie. Coût récurrent : 0 €.

### 6.3 (c) Intégrations partenaires (spec 030)
- `src/features/external-match/externalMatchLink.ts` (478 l.) regroupe : contrat d'entrée v1 (parsing URL), politique d'origines, contexte persistant + TTL 12 h, contrôle de conformité du match, contrat de sortie (URL de résultat + stats). Pur et bien testé (`tests/unit/externalMatch/*`, 30 scénarios E2E) **[VÉRIFIÉ code]**.
- Il s'agit **de facto d'un adaptateur entrant/sortant** logé dans `features` ; les dépendances sont propres (types + `matchStats`).
- Recommandation : **ne pas créer maintenant de port générique** « PartnerIntegration » (une seule intégration, protocole simple). Formaliser par ADR la règle « contrat versionné + module adaptateur pur + mapping depuis la projection/les événements » et extraire un port **seulement à la 2e intégration** (ex. Tournaments ou export DartConnect si l'agent interop en confirme la faisabilité). Le futur contrat de sortie devrait se brancher sur la **même projection/journal** que la TV (§6.1, §6.5) plutôt que sur `MatchState` brut.

### 6.4 (d) Scoring vocal et manuel : mêmes use cases ?
**[VÉRIFIÉ code]** Oui pour la décision finale, non pour l'architecture :
- Voix : `useDeepgramStreaming` → `onUtterance` (`MatchView` l.190) → `buildVoiceScoreProposal` (pur) → **pré-remplit le buffer clavier** (l.206) → l'utilisateur valide → `handleSubmitScore` → `processScoreSubmission` (l.347) → `buildScoreSubmissionResult` → `submitTurn`. Le clavier passe par la même fonction. ✔ pas de double règle de comptage.
- Mais le « use case » est une **fermeture dans la vue** (`processScoreSubmission`, `handleRemainingSubmit`, `handleCheckoutShortcut`, `handleCheckoutConfirm`, tour du bot) : non réutilisable par une télécommande, un partenaire, un futur mode TV interactif ou un test unitaire. Le bot **contourne** la validation (`buildX01BotTurnResult` appelle `submitTurn` directement).
- Divergences mineures : l'intention vocale « reste N » calcule le score dans le parseur (`dartsSpeechParserScoring.ts` l.85-97) sans les garde-fous de `handleRemainingSubmit` (reste = score courant → « UTILISE MISS ») ; le contexte vocal fixe `dartsAlreadyThrown: 0`.
- Le fournisseur STT (Deepgram) est couplé directement au hook ; pas de port. Justifié **seulement** si la V2 introduit un 2e moteur (ex. Web Speech API gratuit en secours) — à arbitrer avec l'agent voix.
- **Recommandation** : un contrôleur X01 pur `x01Reducer(state, command)` avec commandes typées `SubmitVisit{score, darts, source:'keypad'|'voice'|'bot'|'remaining'|'checkout'}`, `ConfirmCheckout`, `Undo`, `CorrectVisit`, `ChooseStarter` ; la vue ne fait que dispatcher. Le champ `source` permet des stats locales d'usage de la voix sans télémétrie.

### 6.5 (e) Intégration future avec Bougnat_Darts_Tournaments
- Constitution transverse §2 : « commandes explicites, événements explicites, identifiants stables, idempotence, versionnement » ; Tournaments `08-domain-model.md` : `ScoreEvent` distinguant « saisie brute / accepté / correctif », « les corrections ne suppriment pas l'historique, elles le supersèdent ».
- Le counter actuel ne produit **ni commande ni événement** : seulement des snapshots de document mutable (côté UI) **[VÉRIFIÉ code]**. Il n'y a pas d'identifiant de volée (`Turn` sans `id`) ni de numéro de séquence.
- Fondation minimale recommandée (sans backend) : **journal local append-only** d'événements de partie `{matchId, seq, eventId, type, payload, source, at}` avec `VisitCorrected{supersedesSeq}` ; état = repli du journal (ou snapshot mis en cache + journal). Ce format est directement mappable vers `ScoreEvent` et vers le workspace backlog `001-xrepo-scoring-contract-v1` / `005-counter-offline-scoring-session-store`. **Aucune sync n'est à implémenter en V2** ; seulement ne pas fermer la porte.

---

## 7. Dette technique

| # | Dette | Preuves | Gravité | Impact V2 |
|---|---|---|---|---|
| T1 | État de partie détenu par les vues, non sérialisable (hors X01) | §4.2, §4.6 | **Critique** | Bloque TV multi-jeux, reprise, tests |
| T2 | Domaine X01 fantôme / code mort | `src/domain/scoring/**`, `RecordThrow/UndoThrow/StartGame/EndLeg/EndGame`, `SyncRepository`, `useSharedX01Session` stub, `KILLER_STATS`/`GOTCHA_STATS`, `getCurrentMatch`, `listLocalGameHistory`, `isScreenAllowedForAccessMode` (tests seulement) | Haute | Trompe les contributeurs/agents ; double vérité de règles |
| T3 | Règles dupliquées | `DOUBLE_OUT_BOGEY_SCORES` ×4 (`ScoringRules.ts:4`, `checkoutEligibility.ts:3`, `x01BotTurn.ts:11`, `matchStats.ts:4`) ; ensemble des scores possibles ×3 (`ScoreInput.ts`, `possibleTurnScores.ts`, `x01BotTurn.ts`) ; `isCheckoutPossible` ×3 ; validation « reste » ×2 (`MatchView.tsx:388`, `ScoreValidator.ts:16`) | Haute | Risque de divergence de règles (déjà le cas pour le master-out) |
| T4 | God objects | `MatchView.tsx` 869 l. (≥10 responsabilités), `useDeepgramStreaming.ts` 650 l. (~20 refs, 1 `start` de ~280 l. l.334-612), `App.tsx` 479 l. (14 `useState`, 1 `useEffect` de persistance à 13 dépendances), `CapitalKeypad.tsx` 530 l., `dartsSpeechParserScoring.ts` 512 l., `externalMatchLink.ts` 478 l., `setupModel.ts` 457 l., `utils/triathlonScoring.ts` 452 l. | Moyenne | Les 3 premiers sont sur le chemin TV/voix |
| T5 | Duplication inter-jeux (UI/infra de partie) | Horloge + chrono ×6, confirmations de sortie ×4, écrans de victoire ad hoc (Killer/Gotcha), 5 variantes d'undo, `getOrderedPlayersAndStarter` + `formatDuration` importés de `matchLifecycle` par toutes les vues | Moyenne | Coût ×6 de toute évolution transverse (thème, TV, tablette) |
| T6 | Pas de registre de jeux | Ajouter Gotcha a touché **16 fichiers** (`App.tsx`, `appShell.ts`, `arenaFlow.ts`, `types.ts`, `persistedAppSession.ts`, `useGameLifecycle.ts`, `setupModel.ts`, `setupPresentation.ts`, `setupViewModel.ts`, `SetupView.tsx`, `GameSelectionView.tsx`, `SetupTargetScoreSection.tsx`, `externalMatchStartup.ts`, `ChangelogModal.tsx`, vue, domaine) | Moyenne | Chaque nouveau jeu / projection TV / mode de saisie se paie partout |
| T7 | Persistance : écriture chaque seconde, croissance non bornée, pas de schéma versionné | §4.4, §4.5 | Haute | Fiabilité de la reprise, INP sur tablettes modestes |
| T8 | `MatchState` utilisé comme porteur pour tous les jeux | `useGameLifecycle.ts:71` | Moyenne | Modèle trompeur, pollue la persistance |
| T9 | Couverture fictive de la logique de jeu | Vues de jeu exclues de la couverture + E2E limités à l'entrée (§5 D9) | Haute | Aucune protection de non-régression sur Cricket/Killer/Gotcha/undo |
| T10 | Organisation `utils/` / `lib/` ambiguë | `utils/` mélange moteurs de jeu, persistance et plein écran ; deux `lib/` (racine = serveur, `src/lib` = client) ; `src/shared/config/env.ts` simple ré-export | Faible | Lisibilité |
| T11 | Ressources statiques | `manifest.json` et `sw.js` hors `public/` → `sw.js` absent de `dist/` (vérifié : `dist/` sans `sw.js`, manifest émis haché `assets/manifest-*.json`) — **déjà traité par spec 031 (planned)** | Couverte par 031 | — |
| T12 | Configuration | `src/lib/env.ts` propre et typé ; `VITE_APP_ACCESS_MODE` lu mais n'affecte que la détection tablette ; aucune config de jeu (règles) externalisée — correct | Faible | — |
| T13 | i18n | Libellés FR codés en dur dans les vues ; seuls stats et external match ont un fichier `.fr.ts` | Faible (hors V2 sauf partenaires étrangers) | — |

---

## 8. Changements architecturaux significatifs proposés

Principe directeur : **une seule fondation à forte valeur (état de partie sérialisable + reducer pur par jeu) débloque simultanément la reprise de partie (spec 010), le mode TV, les tests, la voix multi-jeux et le contrat Tournaments.** Le reste est du nettoyage incrémental à faible risque. Aucune nouvelle dépendance npm n'est nécessaire pour l'ensemble des recommandations ci-dessous.

### 8.1 CA-1 — État de partie sérialisable et contrôleur pur par jeu
- **Problème** : l'état et l'orchestration des parties vivent dans les vues React (§2.2, §4.2).
- **Preuves** : `CricketGameView.tsx` l.47-67/110-210 ; `KillerGameView.tsx` l.31-95 ; `GotchaGameView.tsx` l.69-140 ; `MatchView.tsx` l.297-470, 560-645 ; reprise absente §4.6.
- **Options** :
  1. Statu quo + persister chaque `useState` des vues (rapide, mais fige la dette et ne sert pas la TV).
  2. **Par jeu : `GameSession<S>` sérialisable + `reduce(state, command) → { state, events }` pur + hook `useGameSession(gameId)` générique** qui gère dispatch, undo, persistance, (diffusion).
  3. Store global (Redux/Zustand) — nouvelle dépendance non justifiée ; React `useReducer` suffit.
- **Recommandation** : option 2, en réutilisant l'existant (Killer/Gotcha sont déjà des reducers « de fait » : `recordKillerDart(state, result)` ; Capital a déjà `capitalGameReducer` ; Triathlon `triathlonFlowReducer`). Cricket et X01 sont les seuls vrais chantiers.
- **Bénéfices** : reprise pour tous les jeux ; TV possible sans réécrire de règle ; tests unitaires des enchaînements ; vues plus petites ; voix/clavier/bot = commandes.
- **Risques** : régression de comportements subtils (rotation doublettes, transition de leg, bot) ; mitigé par tests de caractérisation **avant** extraction.
- **Impacts** : `views/*GameView.tsx`, `MatchView.tsx`, `App.tsx` (stockage de session par jeu), `persistedAppSession.ts`.
- **Migration** : jeu par jeu, du plus simple au plus complexe : Gotcha → Killer → Capital → Cricket → X01 → Triathlon (compose les autres). Chaque étape livrable seule.
- **Non-régression** : tests de caractérisation par jeu écrits sur la vue actuelle (Testing Library, déjà présent) puis rejoués sur le reducer ; E2E « partie complète + undo + reload » par jeu ; retirer les vues de `sonar.coverage.exclusions` au fur et à mesure.

### 8.2 CA-2 — Journal de commandes/événements + undo/correction par rejeu
- **Problème** : undo par snapshots en mémoire, perdu au reload, pas de correction de volée passée, pas d'identifiants stables, incompatibilité avec la constitution transverse §2.
- **Preuves** : §4.3, §6.5.
- **Options** : (a) garder les piles de snapshots mais les persister ; (b) **journal append-only + snapshot mis en cache ; undo = événement `Undone{seq}` ou rejeu sans la dernière entrée ; correction = `VisitCorrected{supersedesSeq}` puis rejeu** ; (c) event-sourcing complet avec projections multiples et store dédié (disproportionné).
- **Recommandation** : (b), d'abord pour X01 (déterminisme vérifiable), puis généralisable. Rejeu de ≤ quelques centaines d'entrées : coût négligeable **[HYPOTHÈSE]**.
- **Bénéfices** : undo qui survit au reload et traverse les legs (corrige les limites d'`undoTurn`) ; correction cohérente d'un score passé (exigence mode TV) ; base du contrat Tournaments ; stats par source.
- **Risques** : changement de format persistant (→ CA-4) ; tentation de sur-concevoir (rester sur un tableau typé, pas de bus d'événements).
- **Migration** : introduire le journal à côté du `MatchState` existant ; l'état reste le cache ; basculer l'undo ; supprimer la pile d'undo de la vue.
- **Non-régression** : test de propriété « rejouer le journal = état courant » sur les fixtures existantes (`tests/unit/application/matchLifecycle.test.ts`) ; test undo à travers une fin de leg et une fin de match.

### 8.3 CA-3 — Projection de tableau de score versionnée + port de diffusion
- **Problème** : pas de contrat d'affichage indépendant de l'état interne ; impossible de diffuser sans dupliquer les règles.
- **Options** : envoyer l'état brut ; **envoyer une projection `ScoreboardProjectionV1` par jeu** ; rendre la TV via le même composant React que la tablette (partage de code, pas de contrat).
- **Recommandation** : projection pure par jeu (dans `application/<jeu>/projection.ts`) + enveloppe `{schema:'scoreboard', v:1, sessionId, seq, gameType, projection, lastEvent?}` + port `ScoreboardBroadcaster` (adaptateur local `BroadcastChannel` d'abord ; distant selon étude agent TV). Le `useSharedX01Session` stub est remplacé par ce port.
- **Bénéfices** : TV et partenaires sans règle ; correction/reconnexion triviales ; contrat testable.
- **Risques** : figer trop tôt le contrat → le versionner et le marquer « expérimental » tant que la TV n'est pas validée.
- **Dépend de** CA-1. **Non-régression** : tests snapshot de projection par jeu ; aucune dépendance de `domain/application` vers le port (inversion).

### 8.4 CA-4 — Persistance de session fiable (finaliser la spec 010)
- **Problème** : reprise X01 seulement, écriture chaque seconde, croissance non bornée, pas de schéma.
- **Recommandation** : une entrée « partie en cours » unique par jeu actif (`{schemaVersion, gameType, journal|state, timing:{startedAt, pausedMs}}`) ; validation structurelle à la restauration (garde de type manuelle, pas de lib) avec repli propre ; purge de `current_matches` à la fin/abandon ; écriture sur **changement métier** uniquement (le chrono devient horodatages : `startedAt` + pauses, dérivé à l'affichage) ; bump `DB_VERSION` avec migration ou purge explicite.
- **Bénéfices** : respect de l'invariant spec 010 ; moins d'I/O (INP) ; pas de saturation de quota.
- **Risques** : sessions v1 existantes non restaurées après mise à jour → stratégie : migration best-effort X01, sinon retour accueil avec message.
- **Non-régression** : tests IndexedDB existants (`fake-indexeddb`) étendus ; E2E reload pour chaque jeu.

### 8.5 CA-5 — Assainissement du noyau et des frontières (incrémental, faible risque)
- Déplacer `Player`, `GameConfig`, `InOutRule`, `GameType` vers `src/domain/shared/` (ou `src/domain/match/`) ; `types.ts` devient un **ré-export transitoire** → casse le cycle §3.3 et V1/V4.
- Déplacer `utils/{cricketLogic,capitalLogic,triathlonScoring}.ts` vers `src/domain/<jeu>/` (avec ré-exports transitoires) → corrige V6.
- Unifier les règles X01 dupliquées (T3) dans **un** module de règles (`src/domain/x01/rules.ts`) ; décider du sort de `src/domain/scoring` (rebrancher comme module de règles unique, ou supprimer) et des use cases morts (T2).
- Déplacer `formatDuration` vers `src/presentation`, `getOrderedPlayersAndStarter`/`buildDoublesRotation` vers `src/domain/match/rotation.ts` (utilisés par tous les jeux).
- Ajouter des règles ESLint `no-restricted-imports` par dossier (outil déjà présent, 0 dépendance) pour verrouiller : `domain` ↛ (React, `application`, `features`, `infrastructure`, `views`, `components`, `utils`) ; `application` ↛ (`features`, `views`, `components`, `infrastructure`) ; etc. Démarrer en `warn` puis `error` quand les violations sont résorbées.
- Écrire la convention `features/` = tranche verticale pouvant contenir hooks et composants (régularise V7) ; `views/` = écrans de composition.
- **Non-régression** : déplacements purs + ré-exports ; `typecheck` + suite unitaire inchangée ; aucun changement de comportement.

### 8.6 CA-6 — Registre de jeux
- **Problème** : 16 fichiers à toucher par jeu (T6).
- **Recommandation** : un descripteur `GameModule` par jeu `{ id, label, setup: {defaults, constraints}, createSession, reducer, projection, View, StatsView?, toHistoryEntry }` et un registre unique consommé par `App`, `GameSelectionView`, `setupModel`, `appShell`, `useGameLifecycle`. **À faire après CA-1** (sinon le descripteur n'a rien de stable à référencer).
- **Bénéfice** : nouveaux jeux V2 (agent « revue des jeux »/« innovation ») et TV multi-jeux à coût marginal. **Risque** : abstraction prématurée si aucun nouveau jeu n'est prévu → conditionner à l'arbitrage produit.

### 8.7 CA-7 — Décomposition de `MatchView` et `useDeepgramStreaming`
- `MatchView` : devient mince une fois CA-1/CA-2 faits (le reducer X01 absorbe soumission/checkout/undo/bot ; transitions de leg et aperçu bot deviennent des états dérivés). Extraire `useX01VoiceAssist` (glue voix ↔ buffer) et `useCompactBrowserMobile`.
- `useDeepgramStreaming` : découpe déjà amorcée (spec 022) ; ne poursuivre que si un 2e fournisseur STT est retenu (port `SpeechToTextSession` : `start/stop/onUtterance/onIssue`), sinon **ne pas toucher** (fonction critique bien testée : `tests/unit/x01/useDeepgramStreaming.test.tsx` 506 l.).

### 8.8 CA-8 — Fondation de thèmes (tokens)
Voir §6.2. Architecture : tokens CSS + attribut racine + préférences séparées ; aucun impact domaine. Migration écran par écran en commençant par les composants partagés (`Button`, keypads, scoreboards) qui couvrent ~70 % de la surface **[HYPOTHÈSE]**.

---

## 9. Propositions d'ADR (titres + résumé)

Proposition de convention : créer `docs/adr/NNNN-titre.md` (format court : contexte, décision, conséquences, statut). Aucun dossier ADR n'existe aujourd'hui ; les « Decision vX » de `docs/architecture.md` en tiennent lieu.

| ADR | Titre | Résumé de la décision proposée |
|---|---|---|
| ADR-0001 | Frontières de couches outillées | Carte des couches réelle (racine legacy incluse) ; règle de dépendance vérifiée par ESLint `no-restricted-imports` ; `features/` = tranche verticale autorisée à contenir de l'UI. |
| ADR-0002 | L'état d'une partie n'appartient pas aux vues | Chaque jeu expose un état sérialisable et un reducer pur `(state, command) → {state, events}` ; les vues dispatchent et rendent ; un hook générique gère undo/persistance/diffusion. |
| ADR-0003 | Journal append-only comme vérité locale de partie | Commandes typées avec `source` ; événements avec `matchId/seq/eventId` ; état = repli du journal (snapshot = cache) ; undo/correction par événements superseding + rejeu ; compatible `ScoreEvent` de Tournaments. |
| ADR-0004 | Diffusion par projections versionnées, mono-écrivain | Le contrôleur est l'unique écrivain ; les spectateurs reçoivent des `ScoreboardProjectionV{n}` avec `seq` ; spectateurs sans dispatcher (lecture seule par construction) ; pas de sync bidirectionnelle de document. |
| ADR-0005 | Schéma de session persistée versionné et validé | `schemaVersion`, validation structurelle à la restauration, repli sain, purge des parties terminées, écriture sur changement métier, chronomètre par horodatages. |
| ADR-0006 | Thèmes par design tokens | Variables CSS sémantiques (`@theme`), attribut racine, préférences de personnalisation stockées à part ; interdiction d'import thème dans `domain`/`application`. |
| ADR-0007 | Intégrations externes : contrat versionné d'abord, port générique ensuite | Chaque intégration = module adaptateur pur + contrat versionné ; extraction d'un port commun seulement à la 2e intégration ; sorties alimentées par projection/journal, jamais par l'état interne. |
| ADR-0008 | Une seule source des règles X01 | Fusion des règles dupliquées ; décision explicite sur `src/domain/scoring` et les use cases non branchés (rebrancher ou supprimer). |
| ADR-0009 | Registre de jeux (conditionnel) | Descripteur `GameModule` unique par jeu consommé par shell/setup/sélection/TV — adopté seulement si de nouveaux jeux sont planifiés en V2. |

---

## 10. Propositions de spécifications

| ID provisoire | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances | Spec existante concernée |
|---|---|---|---|---|---|---|---|---|
| V2-ARCH-01 | Carte des couches et garde-fous d'imports | Reco archi | Mettre à jour `docs/architecture.md` (arbo réelle, conventions `features/`), ajouter règles ESLint de frontières en `warn`, inventaire des 7 violations | Empêche la dérive pendant les gros chantiers V2 | S | P1 | — | Prolonge **022** |
| V2-ARCH-02 | Noyau de types et moteurs legacy dans `domain` | Reco archi | Sortir `Player/GameConfig/GameType/InOutRule` de `types.ts` ; migrer `utils/*Logic.ts` vers `src/domain/<jeu>` avec ré-exports ; supprimer le cycle conceptuel | Lisibilité, prérequis de CA-1 | S-M | P2 | 01 | Prolonge **022**, **002** |
| V2-ARCH-03 | Source unique des règles X01 et nettoyage du domaine fantôme | Reco archi | Fusionner bogeys/scores possibles/checkout/validation « reste » ; trancher `src/domain/scoring` + use cases non branchés ; retirer stubs (`useSharedX01Session`, `SyncRepository`, écrans `*_STATS` morts) | Supprime la double vérité de règles | S | P1 | 01 | Lien **023** (double-out) |
| V2-ARCH-04 | Sessions de jeu sérialisables et contrôleurs purs (tous jeux) | Reco archi | CA-1 : reducer + état sérialisable par jeu, hook `useGameSession`, tests de caractérisation préalables, migration Gotcha→…→Triathlon | **Fondation** TV, reprise, tests, voix multi-jeux | L | **P0** (si TV ou reprise multi-jeux retenues) | 02, 03 | Absorbe le reliquat de **022** ; rend tenable **010** |
| V2-ARCH-05 | Journal de partie, undo persistant et correction de volée | Reco archi | CA-2 : journal append-only X01 puis autres jeux, `source` de saisie, correction d'une volée passée | Cohérence après correction (TV), undo après reload, contrat Tournaments | M | P1 | 04 | Nouveau ; aligné backlog workspace **005-counter-offline-scoring-session-store** |
| V2-ARCH-06 | Reprise fiable de toutes les parties (finalisation 010) | Reco archi / Backlog existant | CA-4 : schéma versionné, validation, purge, écriture sur changement métier, chrono par horodatages, E2E reload par jeu | Respect de la promesse offline-first, INP | M | **P0** | 04 (pour non-X01) ; partie X01 indépendante | **Enrichir 010** (statut `active` mais invariant non tenu) |
| V2-ARCH-07 | Contrat de projection de tableau de score et port de diffusion | Reco archi | CA-3 : `ScoreboardProjectionV1` par jeu, enveloppe versionnée, port + adaptateur local ; adaptateurs distants spécifiés par la spec TV | Mode TV sans duplication de règles ; réutilisable partenaires | M | P1 (P0 si TV = signature V2) | 04 | Nouveau ; à co-écrire avec l'agent TV |
| V2-ARCH-08 | Fondation de thèmes par tokens | Reco archi / Demande V2 | CA-8 : tokens sémantiques, attribut racine, préférences séparées, migration des composants partagés | Light mode, TV, personnalisation clubs | M-L | P1 | — | Nouveau ; co-écrit avec agent design |
| V2-ARCH-09 | Registre de jeux | Reco archi | CA-6, conditionnel à de nouveaux jeux | Coût marginal par jeu | M | P2 | 04 | — |
| V2-ARCH-10 | Tests de jeu de bout en bout | Reco archi | Retirer progressivement les vues de `sonar.coverage.exclusions` au profit des reducers ; E2E « partie complète + undo + reload » par jeu ; regrouper `tests/unit` par couche (`domain/`, `application/`, `features/`, `components/`) | Non-régression réelle des règles | M | P1 | 04 | Prolonge **029**, **008** |
| V2-ARCH-11 | Décomposition `MatchView` | Reco archi | CA-7 après 04/05 | Maintenabilité X01/voix | M | P2 | 04, 05 | Prolonge **022** |
| V2-ARCH-12 | Port de reconnaissance vocale (conditionnel) | Étude exploratoire | Port `SpeechToTextSession` si 2e fournisseur ou voix multi-jeux | Indépendance fournisseur | M | P3 | décision agent voix | Lien **003**, **006** |
| V2-ARCH-13 | Architecture d'intégration : règle des contrats versionnés | Documentation | ADR-0007 + guide ; aucun code | Évite l'abstraction prématurée | S | P2 | — | Lien **030** |
| V2-ARCH-14 | Dossier ADR et traçabilité spec ↔ code | Documentation | Créer `docs/adr/`, convertir les « Decision vX » ; généraliser l'en-tête `// Spec:` (26 fichiers l'ont aujourd'hui, 8 specs référencées sur 29) | Gouvernance SDD | S | P2 | — | Lien `specs/README.md` |

Spec 031 (PWA) : la dette ressources statiques (T11) y est déjà correctement décrite — **aucune action supplémentaire**, conserver.

---

## 11. Décisions nécessitant l'arbitrage du product owner

1. **Le mode TV doit-il couvrir tous les jeux dès la V2, ou X01 d'abord ?** X01 seul est faisable sans CA-1 complet (état déjà sérialisable) ; tous les jeux imposent V2-ARCH-04 (L).
2. **Reprise de partie pour tous les jeux = P0 ?** Je recommande oui (invariant de la spec 010 aujourd'hui non tenu, perte silencieuse) ; cela impose de faire V2-ARCH-04 avant ou avec la TV.
3. **Domaine fantôme `src/domain/scoring` + use cases non branchés** : rebrancher (en faire la source unique des règles X01) ou supprimer ? Recommandation : en extraire les règles utiles vers le module X01 unique, supprimer le reste.
4. **Granularité fléchette par fléchette en X01** (vs volée) : nécessaire pour double-in, checkouts réels, stats avancées, certains partenaires (à confirmer par l'agent interop). Impact fort sur le journal (CA-2) — à décider avant d'en figer le format.
5. **Contrat de projection public ou interne ?** S'il doit servir à des partenaires/écrans tiers, il faut le versionner et le documenter comme l'est le contrat 030.
6. **Registre de jeux** : seulement si de nouveaux jeux sont planifiés en V2.
7. **Migration des sessions persistées v1** lors du passage au schéma versionné : migration best-effort X01 ou purge annoncée ?
8. Accepter que la **règle `features/` contient de l'UI** (régularisation) plutôt que de déplacer des composants.

---

## 12. Bénéfices, contraintes, risques (synthèse)

- **Bénéfices** : une seule fondation (V2-ARCH-04) sert 5 chantiers V2 (TV, reprise, tests, voix, Tournaments) ; nettoyage (01/02/03) à risque quasi nul ; aucune dépendance npm ajoutée ; coût récurrent 0 € pour tout ce rapport (hors relais TV distant, chiffré par l'agent TV).
- **Contraintes** : brownfield — migrations jeu par jeu avec ré-exports transitoires ; zéro régression sur un produit en usage.
- **Risques** : (1) régressions dans Cricket/X01 lors de l'extraction des reducers — mitigé par tests de caractérisation préalables (aujourd'hui inexistants, cf. D9) ; (2) sur-ingénierie de l'event-sourcing — limiter à un tableau typé + rejeu ; (3) figer trop tôt un contrat de projection — versionner et marquer expérimental ; (4) charge de migration de styles (CA-8) importante — la faire progressivement.

---

## 13. Limites de l'analyse / points non vérifiés

- Aucun test, build ni exécution de l'application n'a été lancé (lecture seule stricte) : les comportements « reprise silencieuse à zéro » (§4.6) et « écriture chaque seconde » (§4.4) sont **déduits de la lecture du code**, non observés en navigateur.
- Le déterminisme de rejeu de `submitTurn` est une **hypothèse forte** (pas d'horloge ni d'aléa dans la fonction), non prouvée par test.
- Tailles de snapshot (~10-20 Ko), coût de rejeu et échéance de saturation du quota localStorage : **estimations**.
- Le crash sur session structurellement corrompue est une **hypothèse** (cast sans validation).
- Je n'ai pas lu en détail : `dartsSpeechParserScoring.ts` en entier, `useDeepgramStreaming.ts` au-delà de la structure, `CapitalKeypad.tsx`, `setupModel.ts`, `matchStats.ts` en entier, `functions/api/deepgram/token.ts` (périmètre sécurité/voix d'autres agents).
- Le graphe d'imports est construit par regex (imports statiques/dynamiques, alias `@/`) : les imports via chaînes calculées ne seraient pas détectés (aucun repéré).
- Les coûts et faisabilités des transports TV distants (WebSocket relais, WebRTC, Durable Objects) ne sont pas évalués ici : **[À CONFIRMER]** par l'agent Mode TV avec sources externes.
- Repo `Bougnat_Darts_Tournaments` : seuls deux documents lus ; l'existence d'un contrat de scoring implémenté côté Go n'a pas été vérifiée.
