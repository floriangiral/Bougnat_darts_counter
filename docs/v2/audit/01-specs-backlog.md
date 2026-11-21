> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 01 — Product Management : Spécifications & Backlog (préparation V2)

Agent : Product Management / Spécifications & Backlog
Date d'analyse : 2026-11-20
Repository : `Bougnat_darts_counter`, branche `feat/v2.0.0` (package `2.0.0`, non publié), PR #203 ouverte `feat/v2.0.0 -> release/v2.0.0`.
Mode : **lecture seule** (aucun fichier du repo modifié ; `git status` vide avant/après analyse).

Légende des marqueurs : **[VÉRIFIÉ code]** constat issu de la lecture du code/config/tests ; **[VÉRIFIÉ git]** issu de `git log`/branches/tags ; **[VÉRIFIÉ GitHub]** issu de `gh` ; **[VÉRIFIÉ source externe + URL]** ; **[HYPOTHÈSE]** ; **[À CONFIRMER]**.

---

## 1. Périmètre et fichiers analysés

### 1.1 Spécifications locales
- `specs/README.md` (181 lignes), 29 dossiers `specs/001..031` (012 et 024 absents = retirées).
- Pour chaque spec : `spec.md`, `plan.md`, `tasks.md` ; en plus `025/checklist.md`, `025/commits.md`.
- Specs avec `spec.md` seul : **020, 021, 027, 028** [VÉRIFIÉ code].

### 1.2 Gouvernance SDD
- `.specify/memory/constitution.md` (v1.0.0), `.specify/templates/{spec,plan,tasks}-template.md`.
- Workspace : `.specify-workspace/ (workspace, hors dépôt) {README.md, constitution.transverse.md, workflow-brownfield.md, backlog/next-specs.md, templates/*}`.
- Coup d'œil (lecture seule) au repo voisin `Bougnat_Darts_Tournaments/specs/` (liste + en-tête de `042-bdt-runtime-scoring-live`).

### 1.3 Documentation
- `docs/specifications.md`, `docs/architecture/scoring-access-modes.md`, `docs/technical.md` (extraits), `CONTRIBUTING.md`, `README.md` (extraits).
- `docs/release/*` : toutes les notes v1.0.0 → v2.0.0 + coverage maps + `react-19-validation-matrix.md` (sections « limites », « points connus », « dette »).

### 1.4 GitHub
- `gh issue list --state all --limit 200` : 38 issues, **0 ouverte** [VÉRIFIÉ GitHub].
- `gh issue view` sur #44–#50, #70–#75, #103, #104 (stateReason + corps).
- `gh pr list --state all --limit 50` : PR #203 **OPEN** ; #202 mergée le 2026-11-19 ; #201/#199 fermées (remplacées).
- Note : l'API GitHub a renvoyé des erreurs de connexion intermittentes ; #71, #103 n'ont pas pu être relus en détail (titres et état seulement).

### 1.5 Code vérifié (principaux fichiers)
`App.tsx`, `index.tsx`, `index.html`, `manifest.json`, `sw.js`, `vite.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `sonar-project.properties`, `wrangler.jsonc`, `package.json`, `public/*`, `scripts/run-playwright.sh`, `scripts/guard-clean-codebase.sh`,
`src/app/appShell.ts`, `src/app/useGameLifecycle.ts`, `src/lib/env.ts`,
`src/application/scoring/{matchLifecycle,matchStats,ports,index,StartGame,RecordThrow,EndLeg,EndGame,UndoThrow}.ts`,
`src/domain/{killer,gotcha,x01Bot,scoring,triathlon}/*`, `src/features/{tablet,smartphone,x01/voice,game-setup,external-match}/*`,
`src/infrastructure/local/{IndexedDBSessionRepository,sessionPersistence}.ts`, `src/shared/session/persistedAppSession.ts`,
`components/game/Keypad.tsx`, `components/game/PlayerScore.tsx`, `components/stats/*`, `views/*` (grep ciblés), `utils/{arenaFlow,appPersistence,cricketLogic}.ts`, `tests/unit/**` et `tests/e2e/**` (listes de cas).
- Grep `TODO|FIXME|XXX|HACK` (ts/tsx/js/mjs hors node_modules/dist/coverage) : **0 occurrence** [VÉRIFIÉ code] — cohérent avec `scripts/guard-clean-codebase.sh`. Seules dérogations : 2 `eslint-disable-next-line react-hooks/exhaustive-deps` dans `views/MatchView.tsx:164` et `:228` (justifiées en commentaire).

---

## 2. Synthèse exécutive (specs & backlog)

1. **Les statuts déclarés ne sont plus informatifs.** 27 specs sur 29 sont `active` (ou `Active`), y compris des releases livrées et taguées depuis des mois (004 → `v1.0.1`, 026 → `v1.1`). Seules 030 (`Accepted`) et 031 (`Planned`) ont un statut signifiant. Les dossiers 001→021 n'ont pas été modifiés depuis avril 2026 [VÉRIFIÉ git].
2. **Bilan réel** (détail §3) : 12 specs implémentées et clôturables, 9 partielles/à finaliser, 4 contredites ou dépassées par le code actuel (001, 027, 028, 018 [risque]), 1 non traitée (031, 0/29 tâches), 2 retirées sans trace dans l'arborescence (012, 024).
3. **Divergences spec ↔ code majeures** :
   - 028 (smartphone) exige « landscape never blocked » alors que le code impose le **portrait-only** depuis `1e8becd` (2026-11-19) — `src/features/tablet/tabletLayout.ts:53-55`, `App.tsx:220,327`.
   - 001 décrit un mode `social` inexistant (code : `local`) ; le garde-fou `isScreenAllowedForAccessMode` (`src/app/appShell.ts:109-112`) ignore son paramètre `_mode` et **n'est appelé nulle part hors tests**.
   - 011/018 supposent un manifeste et un service worker actifs : ils **ne sont pas livrés** dans `dist/` (`manifest.json`, `sw.js`, `logo.svg` à la racine, pas dans `public/`) → ce point est la raison d'être de 031.
   - 018 (iOS 12) est très probablement **régressée** : Tailwind CSS v4 cible Safari ≥ 16.4 [VÉRIFIÉ source externe : https://tailwindcss.com/docs/compatibility] ; validation iOS legacy toujours `pending` dans `docs/release/react-19-validation-matrix.md`.
   - 016 : niveau Pro 86–120 dans le code (`src/domain/x01Bot/x01Bot.ts:16`) vs 100–120 dans la spec.
   - 013 : libellés stats en dur dans `components/stats/CricketStatsModal.tsx:59-71,84,108,131` malgré l'invariant « aucun label stats en dur ».
   - 022 : la spec revendique `App.tsx` 347 lignes / `MatchView.tsx` 848 ; réalité **479 / 869** lignes (re-croissance).
4. **Modèle de domaine parallèle non utilisé** : `src/domain/scoring/*` (Game, Leg, Turn, Throw, ScoreValidator, ScoringRules) et les use cases `StartGame/RecordThrow/EndLeg/EndGame/UndoThrow` ne sont importés **que par les tests** (`tests/unit/application/scoringUseCases.test.ts`, `tests/unit/x01/scoringDomain.test.ts`). Le X01 réel passe par `matchLifecycle.ts` (`createMatch`, `submitTurn`, `undoTurn`). Dette structurante pour la V2 (voix multi-jeux, TV, intégrations).
5. **Fonctionnalités sans spec** : les règles cœur X01, Cricket, Capital, Triathlon n'ont **aucune spec dédiée** (seuls Killer 017 et Gotcha 019 en ont) ; la barre de raccourcis téléphone, le portrait-only, le changelog in-app, le QR de partage, le différé de mise à jour live, la balise Cloudflare Web Analytics n'ont pas de spec.
6. **5 slugs « fantômes »** référencés dans docs/tests sans dossier de spec (`release-v1.0.2-stabilization`, `release-v1.1.3-sonar-debt`, `security-review`, `capital-game`, `smoke-e2e-per-game-navigation`) + 3 slugs « à formaliser » cités dans les issues (#72 `scoring-domain-core`, #73 `gameplay-entry-and-smoke`, #75 `connected-mode-contracts`).
7. **Backlog workspace** (`next-specs.md`) : aucun des 7 items n'a été ouvert ; 1 obsolète (003 social shell), 2 hors périmètre counter (bdt), 4 à reporter/fusionner.
8. **Issues fermées NOT_PLANNED (2026-04-24)** à réintégrer comme sources V2 : #45 suivi live sur autre écran (→ mode TV), #46 QR stats fin de partie, #47 QR configuration multi-appareils, #48 identifiant de partie visible, #50 hors-ligne renforcé (→ 031).
9. **Conventions SDD** : 4 formats d'en-tête coexistent, 3 vocabulaires de statut, langue FR/EN mélangée, README incomplet (017–019 sans métadonnées, **027/028 absents**), structure minimale non respectée (020/021/027/028). Propositions argumentées au §10.
10. **Backlog consolidé** : 29 specs existantes conservées avec leur ID + 2 retirées tracées + 28 entrées provisoires `V2-BKL-01..28` (§11).

---

## 3. Tableau exhaustif spec par spec

Colonnes : **Tâches** = cochées / total dans `tasks.md` (« — » = pas de tasks.md) ; **Statut réel** ∈ {Implémentée, Partielle, Non traitée, Implémentée non validée, Obsolète/contredite} ; **Traitement** = proposition (à valider).

| ID | Titre | Statut déclaré | Tâches | Vérification code / tests | Statut réel | Écarts attendu ↔ réel | Traitement proposé |
|---|---|---|---|---|---|---|---|
| 001 | scoring-access-modes | active (M5, #70 fermée) | 4/4 | `src/app/appShell.ts:8,85-112` ; `tests/unit/app/appShell.test.ts` ; seul consommateur runtime : `src/features/tablet/useTabletLayout.ts:14` | **Obsolète/contredite partiellement** | Mode `social` → code `local` ; `isScreenAllowedForAccessMode` ignore `_mode` et n'est **jamais appelé** au runtime (garde-fou inopérant) ; `HOME` refusé même en `local` dans la fonction ; spec cite `views/HomeView.tsx`/`MatchView.tsx` qui n'utilisent pas le mode | **Revoir intégralement** (réaligner sur le code puis servir de base aux modes d'usage V2 : station club/bar, TV/spectateur) ; absorbe workspace `007-xrepo-smartphone-vs-tablet-access-bounds` |
| 002 | setup-clean-architecture (frontière OSS / local-first) | active (M6, #71) | 7/8 | `matchLifecycle.ts:102,259,293` ; `IndexedDBSessionRepository.ts` ; `ports.ts:9-10` (`SyncRepository` placeholder vide) | **Implémentée** (frontière) / reliquat | Point d'entrée `undoLastThrow` inexistant (réel : `undoTurn`) ; tâche ouverte « décomposition SetupView » relève de 022 | **Clôturer après vérification** (corriger entrée canonique) ; transférer la tâche ouverte vers 022/V2-BKL-09 |
| 003 | voice-scoring-reliability | active (M3, #74) | 8/9 | `voiceSessionModel.ts` (tentatives, causes), `voiceProposalModel.ts` (arbitrage), `useDeepgramStreaming.ts` ; `tests/unit/x01/useDeepgramStreaming.test.tsx` (≈25 cas start/stop/timeout/reset/races) | **Implémentée** (tâche ouverte en réalité couverte) | Tâche « couvrir start/stop/timeout/reset/navigation » non cochée alors que couverte par `useDeepgramStreaming.test.tsx:95-506` ; pas de budget de latence mesuré ; validation micro réelle `pending` (matrice React 19) ; X01 seulement | **Clôturer après vérification** (socle fiabilité) ; le chantier V2 voix (5.1) = nouvelle spec qui **référence** 003 (la spec 003 interdit elle-même les doublons tant que le périmètre reste X01) |
| 004 | release-v1.0.1-stabilization | active (M7, #77) | 4/4 | Tag `v1.0.1` présent [VÉRIFIÉ git] ; `docs/release/v1.0.1*.md` | **Implémentée** (historique) | Statut `active` trompeur | **Clôturer après vérification** → statut `done` |
| 005 | ui-scoreboard-layout-consistency | active (M2, `#to-create`) | 4/6 | `src/features/x01/scoring/matchPlayerScore.ts`, `components/game/PlayerScore.tsx:82-83` (hauteurs px fixes) ; `tests/unit/x01/matchPlayerScore.test.ts` | **Partielle** | Pas d'E2E nom court/long (aucun cas trouvé dans `tests/e2e`) ; pas de guide de vérification visuelle | **Fusionner avec** la spec V2 responsive/design system (successeur de 027/028, V2-BKL-05) |
| 006 | voice-token-provisioning-hardening | active (M3, #74) | 5/6 | `lib/deepgramToken.ts`, `functions/api/deepgram/token.ts`, workflows `promote-*` ; `tests/unit/lib/deepgramToken.test.ts`, `tests/unit/api/deepgramTokenRoute.test.ts` | **Partielle** (code fait) | Runbook incident voix absent (aucun « runbook » dans `docs/`) | **Finaliser dans la V2** (runbook, rattaché à la spec voix V2) puis clôturer |
| 007 | release-governance-v1.0.x | active (M7, #77) | 2/4 | Branches/PR [VÉRIFIÉ git/GitHub] | **Obsolète/contredite** | Flux décrit `develop → release/* → main` ; flux réel v1.1.x : PR `release/v1.1.x → main` ; v2 : `release/v2.0.0` créée **depuis `main`**, devs sur `feat/v2.0.0` (PR #202/#203). Checklist release + runbook post-release absents | **Revoir intégralement** (gouvernance release v2.x unique, remplace 007 + parties gouvernance de 026) |
| 008 | e2e-runtime-reliability | active (M5) | 1/4 | `scripts/run-playwright.sh` (lance `preview` + `wait-on`), `playwright.config.ts:7-8` (retries/workers), 7 projets (Chromium + 6 profils WebKit) | **Partielle** | La vérif preview existe déjà (tâche non cochée à tort) ; pas de section troubleshooting ; stabilité non mesurée ; **suite E2E complète non exécutée pour v2.0.0** (notes v2.0.0) | **Finaliser dans la V2** (gate de release) |
| 009 | env-contract-and-validation | active (M6) | 2/4 | `src/lib/env.ts`, `scripts/deployment-check.mjs`, `scripts/validate-*.mjs` ; tests `tests/unit/tooling/externalReturnOrigins.test.ts:122+` exécutent `deployment-check.mjs` | **Partielle** | Matrice env par cible partielle dans `docs/technical.md` ; tests deployment-check limités au cas 030 ; `VITE_CF_WEB_ANALYTICS_TOKEN` lu dans `env.ts:46` mais absent de `wrangler.jsonc` [À CONFIRMER : configuré côté dashboard ?] | **Finaliser dans la V2** (P2) |
| 010 | offline-session-recovery-guarantees | active (M4, #71) | 1/4 | `IndexedDBSessionRepository.ts:43-56` ; tests corruption `indexedDbSessionRepository.test.ts:70,101` ; **aucune validation structurelle** au boot : `App.tsx:105` cast `restoredSession?.screen as AppScreen` (`isAppScreen` existe mais non utilisé ici) ; pas de version de schéma dans `PersistedAppSession` | **Partielle** | Pas de grille de corruption ; pas d'E2E reload en partie active hors lien externe (`external-match-link.smoke.spec.ts:146,372` seulement) ; pas de versionnement/migration de session | **Enrichir + Finaliser dans la V2** (prérequis : thèmes, TV, voix multi-jeux ajouteront des champs persistés) |
| 011 | home-install-shortcut | active (M5) | 6/6 | `components/ui/InstallAppButton.tsx`, `src/features/app-install/*` ; tests unitaires | **Implémentée non validée** | Le prompt Android (`beforeinstallprompt`) ne peut pas se déclencher en prod tant que manifeste/SW ne sont pas servis (031) ; guide iOS OK | **Clôturer après vérification** — validation **fusionnée avec 031** (critère d'acceptation 031 « Chromium expose beforeinstallprompt ») |
| 013 | stats-french-clean-architecture | active (M6) | 7/7 | `src/presentation/stats/*` ; utilisé par `StatsView`, `TriathlonStatsView`, `CricketStatsView`, `CapitalStatsView`, `StatsModal` | **Partielle** (régression) | `CricketStatsModal.tsx` : 0 usage de `STATS_LABELS_FR`, libellés en dur (l.59-71, 84, 108, 131) ; Killer/Gotcha hors périmètre initial | **Finaliser dans la V2** (reliquat S) — à intégrer à la spec i18n/libellés du design system |
| 014 | x01-keypad-digit-scale | active (M5) | 3/3 | `components/game/Keypad.tsx:46` (`digitTextClass`) | **Implémentée, dépassée** | Les tailles ont été retravaillées en v2.0.0 (chiffres pilotés par la hauteur de touche, max 48 px dès tablette) ; ratio ×1,5 non vérifiable aujourd'hui [À CONFIRMER] ; unités `rem` (sensibles au font-scale, cf. 021) | **Clôturer après vérification** ; contenu absorbé par la spec V2 clavier/design system |
| 015 | x01-simple-two-player-limit | active (M2) | 5/5 | `setupModel.ts:108-115,261-264` (`getSimplePlayerBounds`) ; `tests/unit/gameSetup/setupModel.test.ts` | **Implémentée** | — | **Clôturer après vérification** |
| 016 | x01-simple-bot-opponent | active (M2) | 12/12 | `src/domain/x01Bot/x01Bot.ts:12-16,55`, `src/application/x01Bot/x01BotTurn.ts`, `botVictoryPreview.ts` ; tests associés | **Implémentée** (écart doc) | Pro = 86–120 (affichage plancher 85) dans le code depuis `e94d921` (2026-04-29) vs 100–120 dans la spec | **Clôturer après vérification** en mettant à jour la plage Pro dans la spec (ou arbitrer) |
| 017 | killer-game | *(aucun statut)* | 6/6 | `src/domain/killer/killer.ts:29-31,38-50,96-106` ; `tests/unit/killerLogic.test.ts` | **Implémentée** | Spec sans bloc Meta/statut/milestone ; règle « double » uniquement (pas de variante) | **Clôturer après vérification** ; rattacher à la revue des jeux V2 (5.5, V2-BKL-08) |
| 018 | ios12-compatibility | *(aucun statut)* | 7/7 | `vite.config.ts:29-33` (legacy `ios>=12`), `src/infrastructure/web/legacySupport.ts`, `tailwind.css:420-432` (`no-*`), `index.html:8-11` | **Implémentée non validée — régression probable** | Tailwind v4 exige Safari 16.4+ (source externe ci-dessus) ; E3 « SW/PWA bootstrap » inopérant en prod (031) ; validation iOS legacy `pending` | **Revoir intégralement — arbitrage PO** : maintenir (coût élevé : CSS de repli) ou **abandonner** le support iOS 12 (validation humaine requise ; utilisateur nommé dans le commit `a53e173`) |
| 019 | gotcha-game | *(aucun statut)* | 6/6 | `src/domain/gotcha/gotcha.ts` ; `tests/unit/gotchaLogic.test.ts` | **Implémentée** | Spec sans Meta | **Clôturer après vérification** ; rattacher à V2-BKL-08 |
| 020 | inp-phase1-quick-wins | active (M8) | — (pas de plan/tasks) | `Keypad.tsx:49-105,138,167,317` (`onPointerDown`, `isPrimary`, `longPressTriggeredRef`) ; `IndexedDBSessionRepository.ts:53-56` ; `appShell.ts:126-150` (debounce 300 ms) ; `tests/unit/app/persistAppSession.test.ts` | **Implémentée non validée** | Objectif INP P75 < 200 ms jamais mesuré/documenté ; structure minimale non respectée | **Clôturer après vérification** (fournir la mesure terrain) ; la suite (phase 2) → V2-BKL-22 budget perf |
| 021 | score-layout-font-scale-resilience | active (M5) | — | `PlayerScore.tsx:82-83,118-124` ; `MatchView.tsx:715` (clamp px) | **Implémentée** (partiellement dépassée) | Retouchée en v2.0.0 (variables `--x01-score-fs`, modes compacts) ; limites connues v2.0.0 (score ≈ 28 px à ≤ 568 px de haut) ; pas de plan/tasks | **Fusionner avec** 028 révisée / spec V2 responsive |
| 022 | arch-single-responsibility-split | active (M6, #88 fermée) | tableau 16/16 (format non standard) | Modules extraits présents [VÉRIFIÉ code] | **Partielle / dérive** | Métriques périmées (App 479 l. vs 347 ; MatchView 869 vs 848 ; « 120/132 tests » vs 746) ; backlog de découpe restant (SetupView, useDeepgramStreaming 650 l., CapitalGameView, CricketGameView, triathlonScoring 452 l.) | **Fusionner avec** la spec V2 architecture (V2-BKL-09) — conserver 022 comme historique `superseded` |
| 023 | x01-double-out-checkout-rate | active (M6) | 4/4 | `matchStats.ts` ; `tests/unit/application/matchStats.test.ts:69,85,101` | **Implémentée** | — | **Clôturer après vérification** |
| 025 | react-19-migration | active (M6) | 11/18 | `package.json` : `react 19.3.1` ; spec cite des chemins inexistants (`src/hooks/useDeepgramStreaming.ts`, `src/infrastructure/audio/**`, `src/infrastructure/voice/**`) | **Implémentée non validée** | 7 validations manuelles ouvertes (undo/rematch, voix, PWA, iOS legacy, preview) ; matrice `react-19-validation-matrix.md` : 12 lignes `pending`, ligne « Analytics » obsolète (024 retirée) | **Clôturer après vérification** ; transférer les validations manuelles vers la checklist de release V2 (V2-BKL-02) |
| 026 | release-v1.1-stabilization | active (M9, #103/#104 fermées) | 12/21 | Branche `release/1.1` + tag `v1.1` existent [VÉRIFIÉ git] | **Implémentée** (historique) | 9 tâches non cochées pourtant réalisées ; titre « v1.1.2 » vs dossier « v1-1 » | **Clôturer après vérification** → `done` |
| 027 | tablet-display | Active (EN) | — | `src/features/tablet/*`, `data-layout` (`App.tsx:214-218,323-325`), Playwright 768×1024, 1024×768, 1024×600 | **Partielle / à revoir** | Critère « 1280×800 » non couvert par `playwright.config.ts` ; anomalies connues v2.0.0 : X01 1024×600 (score minuscule, touches ≈ 26 px), iPad paysage (touches ≈ 44 px) ; « portrait par défaut » vs chantier V2 5.4 (paysage verrouillé tablette) ; absent de `specs/README.md` | **Revoir intégralement** (refonte tablette 5.3 + verrouillage paysage 5.4) |
| 028 | smartphone-display | Active (EN) | — | `src/features/smartphone/*`, `tabletLayout.ts:40-55` ; `tests/e2e/smartphone-layout.smoke.spec.ts:34,49` | **Obsolète/contredite** | Invariants 2 (« landscape never blocked ») et portée (« landscape allowed ») contredits par le portrait-only (`RotateToPortraitOverlay`, `usePortraitLock`) ; la logique « smartphone » vit dans `src/features/tablet/tabletLayout.ts` et non `src/features/smartphone` ; E2E smartphone v2.0.0 « non exécuté » ; absent de `specs/README.md` | **Enrichir** (mettre à jour la décision portrait-only, la barre de raccourcis, les seuils 720/700 px) — absorbe 021 et 005 |
| 029 | sonar-coverage-governance | Active (EN) | 6/8 | `sonar-project.properties` (17 exclusions = liste spec) ; `vitest.config.ts:28-33` (90/80/90/90) ; `scripts/validate-sonar-coverage.mjs` | **Implémentée** (gouvernance vivante) | 2 tâches ouvertes (reporting CI par fichier modifié ; réduction des exclusions UI) ; `sonar.sources` n'inclut pas `types.ts`, `constants.ts`, `index.tsx` (racine) | **Conserver en l'état** (+ finaliser les 2 tâches en P3) |
| 030 | external-match-link | Accepted (implémentée sur `release/v2.0.0`, non publiée) | 18/21 | `src/features/external-match/*`, `components/external-match/*`, `views/StatsView.tsx`, `SetupView` ; 5 fichiers de tests unitaires + `tests/e2e/external-match-link.smoke.spec.ts` (28 scénarios) | **Implémentée non validée** (release) | Suite E2E complète non exécutée ; tâche « configurer les origines une fois un partenaire validé » de fait **réalisée** (`wrangler.jsonc` : `https://badarts.fr`, commit `f9ac4c2`) alors que `docs/release/v2.0.0.md` affirme encore « désactivé tant qu'aucune origine n'est déclarée » ; partenaire réel non testé ; X01 uniquement | **Finaliser dans la V2** (clôture release 2.0.0) ; extensions (autres jeux, contrat v2) → spec V2 interopérabilité (5.10) |
| 031 | pwa-static-delivery | Planned (« prochaine priorité ») | 0/29 | `manifest.json`, `sw.js`, `logo.svg` à la racine ; `dist/` ne les contient pas [VÉRIFIÉ code] ; `index.tsx:43-58` enregistre `/sw.js` en prod ; `sw.js:3-8` précache `/logo.svg` et `/manifest.json` (absents du build) ; `sw.js` `activate` supprime **tous** les caches de nom différent (l.22-33) | **Non traitée** | Défaut antérieur à v2 ; bloque 011, 018-E3, offline réel (#50) | **Finaliser dans la V2** — **P0** (bloquant release ou 2.0.x à arbitrer) |
| 012 | (retirée) observabilité custom | retirée (README) | — | Remplacée par balise Cloudflare Web Analytics `index.tsx:24-39` (non spécifiée) | Retirée | Aucune trace dans `specs/` (pas de dossier « pierre tombale ») | **Conserver retirée** ; créer un tombstone `012-*/spec.md` statut `cancelled` + documenter l'observabilité native actuelle (V2-BKL-25) |
| 024 | (retirée) pageviews SPA | retirée (README) | — | Aucun événement métier analytics trouvé [VÉRIFIÉ code] | Retirée | Matrice React 19 référence encore « Analytics » | **Conserver retirée** (tombstone) ; nettoyer la ligne obsolète de la matrice |

### 3.1 Récapitulatif
| Statut réel | Specs |
|---|---|
| Implémentée → clôturable | 002, 003, 004, 014, 015, 016, 017, 019, 023, 026 (+ 020, 025 après mesure/validation) |
| Partielle → à finaliser | 005, 006, 008, 009, 010, 013, 022, 029 |
| Implémentée non validée | 011, 018, 020, 025, 030 |
| Obsolète / contredite par le code | 001, 007, 028 (et 027 vs demande V2) |
| Non traitée | 031 |
| Retirées | 012, 024 |

---

## 4. Specs « fantômes » et slugs orphelins

| Slug | Référencé dans | Constat | Traitement proposé |
|---|---|---|---|
| `spec:counter/release-v1.0.2-stabilization` | `docs/release/v1.0.2-coverage-map.md:25` | Aucun dossier | Rétro-spec `done` minimale ou rattacher à 007/026 (historique) |
| `spec:counter/release-v1.1.3-sonar-debt` | `specs/README.md:152`, `docs/release/v1.1.3-coverage-map.md:9` | Aucun dossier, pourtant listé comme « release » dans le README | Idem (historique) |
| `spec:counter/security-review` | `docs/release/v1.1.2-coverage-map.md:27`, `v1.1.3-coverage-map.md:15` | Workflow `.github/workflows/security-review.yml` existe, pas de spec | Créer une spec gouvernance sécurité (V2-BKL-26) ou fusionner dans 029 élargie |
| `spec:counter/capital-game` | `docs/release/v1.1.2-coverage-map.md:21` | Règles Capital uniquement dans `docs/specifications.md` §4 et invariants de 026 | Spec de jeu dédiée (V2-BKL-08) |
| `spec:counter/smoke-e2e-per-game-navigation` | `tests/e2e/completion.smoke.spec.ts:1` | Annotation de test vers une spec inexistante | Rattacher à 008 |
| `scoring-domain-core` (#72), `gameplay-entry-and-smoke` (#73), `connected-mode-contracts` (#75) | Issues fermées COMPLETED | « à formaliser », jamais formalisées | #72 → V2-BKL-08/09 ; #73 → 008 ; #75 → workspace `001-xrepo` (reporter) |

---

## 5. Backlog workspace (`.specify-workspace/backlog/next-specs.md`)

Aucune des 7 specs n'a été ouverte (pas de dossier `specs/` dans le workspace ; aucun `xrepo` côté counter) [VÉRIFIÉ code].

| Item | Périmètre | Constat | Traitement proposé |
|---|---|---|---|
| `001-xrepo-scoring-contract-v1` | xrepo | Non démarré. Côté BDT, `042-bdt-runtime-scoring-live` est `in_progress` (QR token, session, soumission) [VÉRIFIÉ code repo voisin, en-tête seulement]. Côté counter, 030 (`v=1`) est un contrat « navigation » léger, **pas** le contrat commandes/événements exigé par la constitution transverse §2 | **Reporter** (post-V2) sauf décision PO d'intégrer le runtime BDT en V2 ; à relier à V2-BKL-14 (interop) |
| `002-bdt-extract-organizer-…` | bdt | Hors repo counter | Hors périmètre de ce rapport (laisser au workspace) |
| `003-counter-split-scoring-client-from-player-social-shell` | counter | Le shell social/auth n'existe plus (scoring-only depuis v1.0.1, garde `guard-clean-codebase.sh`, issue #42 auth close) | **Abandonner** (obsolète — validation humaine) |
| `004-xrepo-device-board-session-model` | xrepo | Rien côté counter ; synergie forte avec mode TV / station club et BDT 042 | **Reporter** ; à rouvrir si le mode TV ou la station club V2 nécessite un appairage device |
| `005-counter-offline-scoring-session-store` | counter | Store local = IndexedDB + fallback localStorage (010) ; **aucune queue d'opérations** (`ports.ts:9-10` placeholder) | **Fusionner avec** 010 pour la partie store/snapshot ; partie queue/retries **reportée** (n'a de sens qu'avec un backend) |
| `006-bdt-live-sync-projections-hardening` | bdt | Hors repo | Hors périmètre |
| `007-xrepo-smartphone-vs-tablet-access-bounds` | xrepo | Recoupe 001 (modes) et 027/028 (présentation) | **Fusionner avec** 001 révisée |

---

## 6. Issues et PR GitHub

- **0 issue ouverte**. Milestones M1–M9 toutes fermées (#93–#104).
- **Fermées NOT_PLANNED le 2026-04-24** (à réintégrer comme sources V2, aucune n'est implémentée [VÉRIFIÉ code]) :
  - #45 Suivre un match en direct depuis un autre écran → **mode TV** (chantier 5.6) ;
  - #46 QR code des stats de fin de partie → innovation (partage sans compte) ;
  - #47 QR code dans le résumé de création de partie → multi-écran / TV ;
  - #48 Identifiant unique visible de partie → prérequis TV/QR/historique (un `id` interne existe via `createId`, non exposé) ;
  - #50 Renforcer le mode hors ligne → 031.
- Fermées COMPLETED pertinentes : #49 (voix IA → 003), #44 (BO7), #70/#71/#72/#73/#74/#75 (pilotage specs v1.0.x ; #72/#73/#75 renvoient à des specs jamais formalisées).
- **PR #203 OPEN** `feat/v2.0.0 → release/v2.0.0` (19 commits) : portrait-only téléphone, barre de raccourcis, activation `badarts.fr`, Node 26, fallback `createId`. Ces évolutions ne sont tracées dans **aucune spec** (seulement release notes/coverage map).

---

## 7. Anomalies connues (consolidées)

| # | Anomalie | Source | Gravité | Rattachement |
|---|---|---|---|---|
| A1 | Manifeste/SW non livrés : PWA, install Android, offline inactifs en prod | `docs/release/v2.0.0.md` « Points connus » ; [VÉRIFIÉ code] `dist/` | **Haute** | 031 |
| A2 | `sw.js` précache `/logo.svg` (absent du build) → `cache.addAll` échouera à l'activation | [VÉRIFIÉ code] `sw.js:3-8`, `logo.svg` racine | Haute (dès que 031 livré) | 031 |
| A3 | `sw.js` `activate` supprime tous les caches d'origine de nom différent | [VÉRIFIÉ code] `sw.js:22-33` | Moyenne | 031 (invariant 6) |
| A4 | X01 tablette 1024×600 paysage : score minuscule, touches ≈ 26 px | Notes v2.0.0 | Haute (cible tablette V2) | 027 → V2 tablette |
| A5 | iPad paysage 1024×768 : touches pavé ≈ 44 px vs colonnes raccourcis 96 px | Notes v2.0.0 | Moyenne | 027 |
| A6 | Hauteur utile ≤ 568 px : score ≈ 28 px | Notes v2.0.0 | Moyenne | 028/021 |
| A7 | Suite E2E complète Chromium/WebKit non exécutée pour 2.0.0 ; E2E smartphone (rotation) jamais exécuté | Notes + coverage map v2.0.0 | Haute (gate release) | 008/030 |
| A8 | SonarCloud / Snyk / CI distants non confirmés pour 2.0.0 | Notes v2.0.0 | Moyenne | 029 |
| A9 | Doc release contradictoire : « lien externe désactivé tant qu'aucune origine » alors que `badarts.fr` est configuré | `docs/release/v2.0.0.md` vs `wrangler.jsonc` | Moyenne (doc publique/partenaire) | 030 |
| A10 | Nombre de tests incohérent : 727 (`specs/README.md:142`) vs 746 (notes v2.0.0) | [VÉRIFIÉ code] | Faible | Doc |
| A11 | `docs/specifications.md` §3 liste « 501 Double Out » comme mode (type supprimé en v1.0.2 ; `GameType` = 6 jeux, `utils/arenaFlow.ts:1`) ; §4 sans règles Killer/Gotcha | [VÉRIFIÉ code] | Faible | V2-BKL-23 |
| A12 | Garde-fou d'accès inopérant (`isScreenAllowedForAccessMode` non appelé) | [VÉRIFIÉ code] | Faible aujourd'hui, **Haute** si mode kiosque/TV | 001 |
| A13 | Restauration de session sans validation structurelle (`App.tsx:105` cast) | [VÉRIFIÉ code] | Moyenne | 010 |
| A14 | Libellés stats Cricket en dur | `CricketStatsModal.tsx` | Faible | 013 |
| A15 | Bot Pro 86–120 vs spec 100–120 | `x01Bot.ts:16` | Faible | 016 |
| A16 | Support iOS 12 probablement cassé (Tailwind v4) | Source externe + matrice `pending` | Moyenne (utilisateur réel connu) | 018 |
| A17 | Résultat du lien externe non signé (décision assumée) | Spec 030 | Accepté (by design) | 030 |
| A18 | iOS ouvre les liens dans Safari, jamais dans l'app installée | Spec 030 | Accepté (limite plateforme) | 030/031 |

---

## 8. Dettes (specs, doc, code)

| # | Dette | Preuve | Gravité |
|---|---|---|---|
| D1 | **Modèle de domaine scoring parallèle inutilisé** (`src/domain/scoring/*`, use cases `StartGame/RecordThrow/EndLeg/EndGame/UndoThrow`) ; X01 réel dans `matchLifecycle.ts` | Imports limités aux tests [VÉRIFIÉ code] | **Haute** pour V2 (où brancher voix multi-jeux, TV, intégrations sans duplication ?) |
| D2 | Règles de jeux dispersées : X01 `src/application/scoring`, Cricket `utils/cricketLogic.ts`, Capital `utils/capitalLogic.ts`, Triathlon `utils/triathlonScoring.ts` + `src/domain/triathlon`, Killer/Gotcha/Bot `src/domain/*` | [VÉRIFIÉ code] | Haute (chantier 5.5) |
| D3 | God components : `views/MatchView.tsx` 869 l., `App.tsx` 479 l., `useDeepgramStreaming.ts` 650 l., `CapitalKeypad.tsx` 530 l., `setupModel.ts` 457 l. | `wc -l` | Moyenne |
| D4 | Historique local **écrit mais jamais lu** : `listLocalGameHistory` non appelé hors infra | `useGameLifecycle.ts:89-169` écrit ; aucun lecteur UI [VÉRIFIÉ code] | Moyenne (fonction annoncée « historique local » dans docs) |
| D5 | Pas de version de schéma de session persistée | `persistedAppSession.ts` | Moyenne (V2 ajoutera thème, TV, voix) |
| D6 | Statuts de specs non maintenus (27 `active`) ; tasks non cochées alors que faites (003, 008, 026) ou cochées sans validation (011, 018) | §3 | Moyenne (traçabilité) |
| D7 | Chemins périmés dans les specs (025 `src/hooks/...`, `src/infrastructure/audio|voice` ; 002 `undoLastThrow`) | [VÉRIFIÉ code] | Faible |
| D8 | `SyncRepository` placeholder vide dans `ports.ts:9-10` | [VÉRIFIÉ code] | Faible (abstraction prématurée) |
| D9 | `sonar.sources` exclut `types.ts`, `constants.ts`, `index.tsx` | `sonar-project.properties` | Faible |
| D10 | `scripts/run-playwright.sh` écrit un log dans `/tmp` et télécharge des `.deb` via `apt download` | [VÉRIFIÉ code] | Faible (portabilité) |
| D11 | Validations manuelles React 19 jamais faites (12 lignes `pending`) | matrice | Moyenne |

---

## 9. Fonctionnalités reportées (à ne pas perdre)

- **031 intégrale** (29 tâches) — PWA/offline réel.
- **030** : suite E2E complète ; test avec partenaire réel / iPad physique ; extension aux autres jeux ; `launch_handler` (évalué, non retenu) ; contrat `v=2` éventuel.
- **025** : validations manuelles (undo/rematch, voix réelle, PWA, iOS legacy, preview connectée).
- **022** : découpes restantes (SetupView `GameRulesSection`, callbacks voix, rendu winner Capital, hook de tour Cricket, calculateurs Triathlon vers `src/domain`).
- **029** : reporting CI par fichier modifié ; réduction progressive des 17 exclusions UI.
- **005** : E2E nom court/long, guide visuel release. **006** : runbook incident voix. **007** : checklist release + runbook post-release. **008** : troubleshooting E2E + mesure de stabilité. **009** : matrice env + tests deployment-check. **010** : grille de corruption + tests restauration dégradée + E2E reload.
- **003** : budget de latence vocale mesuré.
- **020** : mesure INP terrain ; « phase 2 » implicite jamais spécifiée.
- Issues NOT_PLANNED #45, #46, #47, #48, #50.
- Workspace : 001-xrepo, 004-xrepo, 005 (queue) — reportés.

---

## 10. Fonctionnalités implémentées non (ou insuffisamment) documentées par une spec

| Fonctionnalité | Code | Documentation existante |
|---|---|---|
| Règles X01 (in/out Open/Double/Master, legs/sets, doublettes et rotation, bust, undo, hints de checkout, raccourcis personnalisables) | `matchLifecycle.ts`, `src/features/x01/scoring/*`, `CheckoutHint.tsx`, `useMatchShortcuts.ts` | `docs/specifications.md` §4 (liste à puces) ; 015/016/023 partiels |
| Cricket (dont tours configurables, issue #66) | `utils/cricketLogic.ts:119-121`, `src/features/cricket/cricketGameModel.ts` | 3 puces dans `docs/specifications.md` |
| Capital (17 cibles, `3 à côtés`, `Moins de 21`) | `utils/capitalLogic.ts`, `types.ts:88`, `CapitalKeypad.tsx` | `docs/specifications.md` §4 + invariants 026 ; slug fantôme `capital-game` |
| Triathlon (phases, bonus, égalités, starter overlay) | `utils/triathlonScoring.ts`, `src/domain/triathlon/*`, `src/features/triathlon/triathlonFlow.ts` | 3 puces |
| Barre de 6 raccourcis téléphone + interrupteur (v2.0.0) | `Keypad.tsx`, `useMatchShortcuts.ts`, `MatchSettingsModal.tsx` | Notes v2.0.0 seulement |
| Téléphone portrait-only + overlay rotation (v2.0.0) | `usePortraitLock.ts`, `RotateToPortraitOverlay.tsx`, `tabletLayout.ts` | Notes v2.0.0 ; **contredit 028** |
| Changelog in-app | `components/ui/ChangelogModal.tsx` (305 l.) | Aucune spec |
| QR code de partage de l'app | `scripts/generate-app-qr.mjs`, `public/app-qr.svg`, `HomeView` | Aucune spec |
| Différé des mises à jour live pendant une partie | `utils/appPersistence.ts:34,63`, `LIVE_UPDATE_PROTECTED_SCREENS` (`appShell.ts:30`) | Cité dans 031 seulement |
| Balise Cloudflare Web Analytics (observabilité native remplaçant 012) | `index.tsx:24-39`, CSP `public/_headers` | Aucune spec (README specs : une ligne) |
| Fallback `createId` hors contexte sécurisé | `src/shared/ids/createId.ts` (commit `d76dfd0`) | Notes v2.0.0 |
| Historique local des parties (écriture seule) | `sessionPersistence.ts`, `IndexedDBSessionRepository.ts` (50 dernières) | `docs/specifications.md` §7 |
| Middleware token Deepgram local en dev | `vite.config.ts` plugin `local-deepgram-token-route` | `docs/technical.md` [À CONFIRMER] |
| Environnement Docker de dev | `compose.yml`, `docker/` | Aucune spec (doc technique) |

---

## 11. Conventions SDD : analyse et propositions

### 11.1 Constats
| Sujet | Constat | Preuve |
|---|---|---|
| Nomenclature dossiers | `NNN-counter-sujet` respectée (29/29) ✔ | `ls specs` |
| Slugs | `spec:counter/...` utilisés dans README/docs/tests, mais **002** a un slug (`offline-scoring-terminal-foundation`) sans rapport avec son dossier (`setup-clean-architecture`) | `specs/README.md` |
| En-têtes | 4 formats : (a) `## Meta` + liste (001–016, 020, 021, 023, 025, 026) ; (b) **aucun** en-tête (017, 018, 019) ; (c) `**Statut** :` gras (022) ; (d) `## Status` texte libre EN (027–031) | lecture des specs |
| Statuts | 3 vocabulaires : `active`, `Active`/`Accepted`/`Planned` (EN), retirée ; le workflow workspace prévoit `draft/validated/in_progress/done/superseded/cancelled` — **jamais utilisé** ; le template local impose `Statut: draft` | `workflow-brownfield.md`, templates |
| Structure minimale | README : `spec.md + plan.md + tasks.md` ; non respectée par 020, 021, 027, 028 | `ls` |
| Index README | Liste 017–019 sans métadonnées ; **027 et 028 absents** ; références `spec:counter/release-v1.1.3-sonar-debt` (pas de dossier) ; mélange « specs actives » et « release active » | `specs/README.md` |
| Langue | FR sans accents (001–026), EN (027–031) | — |
| `Issues GitHub` | `#to-create` dans 10 specs, jamais créées | grep |
| Traçabilité code | Annotations `// Spec: spec:counter/...` utiles mais partielles (ex. 017/019 aucune) | grep |
| Clôture | Aucune règle de clôture : release livrée = spec toujours `active` | 004, 026 |
| Formalisme vs mission §8 | Le template (`Contexte / État actuel / Problème / Objectif / Inclus / Exclus / Exigences / Invariants / Tests / Risques`) couvre ≈ 10 des 26 rubriques demandées. Manquent : origine, user stories, règles métier numérotées, parcours, ENF, cas alternatifs/limites, gestion d'erreurs, impacts données/interfaces, compatibilité, dépendances, critères d'acceptation mesurables, non-régression, décisions archi (ADR), questions ouvertes | `.specify/templates/spec-template.md` |
| Typologie | Aucune distinction spec fonctionnelle / étude / ADR / release / gouvernance — 004, 007, 026 (releases) et 029 (gouvernance) sont rangées comme specs fonctionnelles ; 030 contient une étude PWA et un ADR (« signature rejetée ») inline | — |

### 11.2 Propositions (à valider)
1. **Statuts normalisés** (réutiliser ceux du workspace, déjà décidés) : `draft → validated → in_progress → done` + `superseded` (avec lien vers successeur) + `cancelled` (avec justification + validateur humain). Ajouter `implemented_unvalidated` *ou* utiliser `in_progress` + champ `validation: pending`. *Argument* : aligner local/transverse, rendre le statut décisionnel ; coût nul.
2. **En-tête de métadonnées unique** (YAML front-matter, lisible par script) :
   ```yaml
   id: 031-counter-pwa-static-delivery
   slug: spec:counter/pwa-static-delivery
   type: feature | study | adr | release | governance
   status: validated
   origin: backlog-existant | demande-v2 | reco-archi | reco-ux | innovation | documentation | etude
   milestone: v2.0.x
   supersedes: [] / superseded_by: []
   depends_on: [030]
   issues: []
   owner: …
   last_verified: 2026-11-20   # date de dernière vérification code
   ```
   *Argument* : permet un index généré et un contrôle CI ; pas de nouvelle dépendance si le contrôle est un petit script `node` (comme `validate-sonar-coverage.mjs`).
3. **Index unique généré** : `specs/README.md` régénéré (ou vérifié) par un script à partir des front-matters ; un check `governance:specs` (sur le modèle de `governance:coverage`) refuse un dossier sans en-tête, un statut hors liste, un slug cité sans dossier. *Argument* : supprime les dérives constatées (027/028 absents, slugs fantômes). Coût : S.
4. **Template enrichi** couvrant les 26 rubriques de la mission §8, avec sections facultatives marquées « N/A + justification » (pour éviter la surdocumentation interdite par la constitution transverse §6). Distinguer 3 gabarits : `feature`, `study` (faisabilité, comparatifs), `adr-lite` (déjà présent au workspace : `templates/adr-lite.template.md`, à importer localement).
5. **Règle de clôture** : une spec passe `done` quand (a) toutes les tâches sont cochées ou explicitement transférées (« → V2-BKL-xx »), (b) la release qui la livre est taguée, (c) les validations manuelles sont tracées. Les specs de release (004, 007, 026) deviennent `type: release` et sont `done` au tag.
6. **Tombstones** pour 012/024 (et toute spec `cancelled`) : dossier conservé avec `spec.md` minimal (raison, date, validateur). *Argument* : « aucune spec ne disparaît ».
7. **Rétro-specs légères** pour les jeux sans spec (X01, Cricket, Capital, Triathlon) : nécessaires avant la revue des jeux V2 (5.5), sinon la V2 modifiera des règles non spécifiées.
8. **Langue** : FR (accents autorisés) pour toutes les nouvelles specs, identifiants/code en anglais. *Argument* : cohérence produit francophone ; 027–031 peuvent rester EN (pas de réécriture gratuite).
9. **`plan.md`/`tasks.md` obligatoires uniquement pour `type: feature` en `validated`+** ; pour 020/021/027/028 créer les fichiers lors de la révision, pas rétroactivement pour des specs `done`.
10. **Tâches transférées** : syntaxe `- [→] tâche (→ V2-BKL-NN)` pour éviter les cases ouvertes orphelines.

---

## 12. Backlog consolidé unique (IDs existants conservés + `V2-BKL-NN` provisoires)

Toutes les entrées sont **À VALIDER**. Colonnes : ID | Titre | Origine | Description courte | Valeur | Complexité | Priorité proposée | Dépendances | Traitement/Décision proposée.

### 12.1 Specs existantes
| ID | Titre | Origine | Description / reste à faire | Valeur | Cx | Prio | Dép. | Décision proposée |
|---|---|---|---|---|---|---|---|---|
| 001 | scoring-access-modes | Backlog existant | Réaligner (`local`), câbler ou supprimer le garde-fou ; base des modes station/TV | Moyenne | M | P2 | V2-BKL-11/12 | Revoir intégralement |
| 002 | setup-clean-architecture | Backlog existant | Corriger entrée canonique ; transférer tâche SetupView | Faible | S | P3 | 022 | Clôturer après vérification |
| 003 | voice-scoring-reliability | Backlog existant | Cocher la tâche couverte ; budget latence → V2-BKL-10 | Moyenne | S | P3 | — | Clôturer après vérification |
| 004 | release-v1.0.1 | Backlog existant | — | — | S | P3 | — | Clôturer (`done`) |
| 005 | scoreboard-layout-consistency | Backlog existant | E2E noms courts/longs | Moyenne | S | P2 | V2-BKL-05 | Fusionner avec V2-BKL-05 |
| 006 | voice-token-hardening | Backlog existant | Runbook incident voix | Moyenne | S | P2 | V2-BKL-10 | Finaliser dans la V2 |
| 007 | release-governance | Backlog existant | Réécrire pour flux v2.x | Moyenne | S | P1 | — | Revoir intégralement (→ V2-BKL-02) |
| 008 | e2e-runtime-reliability | Backlog existant | Troubleshooting, mesure stabilité, suite complète en gate | Haute | S | P1 | — | Finaliser dans la V2 |
| 009 | env-contract | Backlog existant | Matrice env ; tests deployment-check ; statut analytics token | Faible | S | P3 | — | Finaliser dans la V2 |
| 010 | offline-session-recovery | Backlog existant | Validation structurelle, version de schéma, E2E reload | Haute | M | P1 | — | Enrichir + Finaliser |
| 011 | home-install-shortcut | Backlog existant | Valider en prod après 031 | Moyenne | S | P1 | 031 | Clôturer après vérif. (via 031) |
| 013 | stats-french | Backlog existant | Libellés Cricket ; Killer/Gotcha | Faible | S | P3 | V2-BKL-06 | Finaliser dans la V2 |
| 014 | keypad-digit-scale | Backlog existant | Absorbé par refonte clavier | Faible | S | P3 | V2-BKL-05 | Clôturer après vérification |
| 015 | simple-two-player-limit | Backlog existant | — | — | — | P3 | — | Clôturer après vérification |
| 016 | x01-bot | Backlog existant | Mettre à jour plage Pro | Faible | S | P3 | — | Clôturer après vérification |
| 017 | killer-game | Backlog existant | Ajout Meta ; revue jeux | Moyenne | S | P2 | V2-BKL-08 | Clôturer + rattacher à V2-BKL-08 |
| 018 | ios12-compatibility | Backlog existant | Décider maintien/abandon | Moyenne | M–L | P1 (décision) | Arbitrage PO | Revoir intégralement / Abandonner (validation humaine) |
| 019 | gotcha-game | Backlog existant | Idem 017 | Moyenne | S | P2 | V2-BKL-08 | Clôturer + rattacher à V2-BKL-08 |
| 020 | inp-phase1 | Backlog existant | Mesure INP terrain | Moyenne | S | P3 | V2-BKL-22 | Clôturer après vérification |
| 021 | font-scale-resilience | Backlog existant | Absorbé par 028 révisée | Moyenne | S | P2 | 028 | Fusionner avec 028 |
| 022 | arch-SRP-split | Backlog existant | Découpes restantes, métriques | Haute | L | P1 | V2-BKL-09 | Fusionner avec V2-BKL-09 (`superseded`) |
| 023 | checkout-rate | Backlog existant | — | — | — | P3 | — | Clôturer après vérification |
| 025 | react-19 | Backlog existant | Validations manuelles → checklist release | Moyenne | S | P1 | V2-BKL-02 | Clôturer après vérification |
| 026 | release-v1.1 | Backlog existant | — | — | — | P3 | — | Clôturer (`done`) |
| 027 | tablet-display | Backlog existant + Demande V2 (5.3/5.4) | Refonte tablette, paysage verrouillé, A4/A5, 1280×800 | Très haute | L | P0/P1 | V2-BKL-04/05 | Revoir intégralement |
| 028 | smartphone-display | Backlog existant | Aligner sur portrait-only, raccourcis, A6 | Haute | M | P1 | 021, 005 | Enrichir |
| 029 | sonar-coverage-governance | Backlog existant | 2 tâches ouvertes | Moyenne | S | P3 | — | Conserver en l'état |
| 030 | external-match-link | Backlog existant | Clôture release 2.0.0 (E2E complet, doc badarts.fr, partenaire réel) | Haute | S | P0 | 031 (arbitrage) | Finaliser dans la V2 |
| 031 | pwa-static-delivery | Backlog existant | 29 tâches | Très haute | M | **P0** | — | Finaliser dans la V2 |
| 012 | (retirée) observabilité custom | Backlog existant | Tombstone + doc observabilité native | Faible | S | P3 | V2-BKL-25 | Conserver retirée (tombstone) |
| 024 | (retirée) pageviews SPA | Backlog existant | Tombstone ; nettoyer matrice | Faible | S | P3 | — | Conserver retirée (tombstone) |

### 12.2 Nouvelles entrées provisoires
| ID provisoire | Titre | Origine | Description | Valeur | Cx | Prio | Dépendances | Lien specs existantes |
|---|---|---|---|---|---|---|---|---|
| V2-BKL-01 | Gouvernance SDD v2 (statuts, front-matter, index généré, check `governance:specs`, tombstones) | Documentation / Reco archi | §11.2 | Haute (traçabilité) | S | P0 (avant rédaction des specs V2) | — | Toutes ; 012/024 |
| V2-BKL-02 | Release v2.0.0 : clôture et checklist de publication (E2E complet Chromium/WebKit, Sonar/Snyk, validations manuelles 025, doc badarts.fr) | Backlog existant | Gate unique de release, remplace 007/026 pour v2.x | Haute | S | P0 | 008, 025, 030, 031? | 007, 025, 026, 030 |
| V2-BKL-03 | Arbitrage : 031 dans 2.0.0 ou 2.0.1 | Backlog existant | Décision de séquencement (031 active le SW pour la 1re fois) | Haute | — | P0 (décision) | 031 | 031, 030, 011 |
| V2-BKL-04 | Verrouillage paysage tablette + refonte tablette | Demande V2 (5.3/5.4) | Successeur de 027 | Très haute | L | P0/P1 | V2-BKL-05, 031 (manifest `orientation`) | 027 |
| V2-BKL-05 | Design system responsive unifié (tokens, densités, clavier, scoreboard) | Reco UX/UI | Absorbe 005, 014, 021 ; base des modes Light/thèmes | Très haute | L | P1 | V2-BKL-01 | 005, 014, 021, 027, 028 |
| V2-BKL-06 | Couche de libellés/i18n FR unifiée (tous écrans, stats Cricket/Killer/Gotcha) | Reco archi | Généralise 013 | Moyenne | M | P2 | — | 013 |
| V2-BKL-07 | Rétro-specs des jeux cœur : X01, Cricket, Capital, Triathlon | Documentation | Formaliser les règles actuelles avant toute modification V2 | Haute | M | P1 | V2-BKL-01 | slugs fantômes `capital-game`, #72 |
| V2-BKL-08 | Revue complète des jeux (chantier 5.5) | Demande V2 | Revue règles/UX par jeu, variantes | Haute | L | P1 | V2-BKL-07, V2-BKL-09 | 015, 016, 017, 019, 023 |
| V2-BKL-09 | Moteur de jeux unifié & découpe des god components (décider du sort de `src/domain/scoring` inutilisé) | Reco archi | Point d'entrée unique pour saisie manuelle/voix/TV/partenaires | Très haute | XL | P1 | V2-BKL-07 | 002, 022 |
| V2-BKL-10 | Scoring vocal V2 (multi-jeux, latence mesurée, runbook) | Demande V2 (5.1) | Successeur fonctionnel de 003/006 | Très haute | L | P1 | V2-BKL-09 | 003, 006, #49 |
| V2-BKL-11 | Mode TV / spectateur | Demande V2 (5.6) + issues #45, #47 | Diffusion lecture seule | Très haute | L–XL | P1 | V2-BKL-09, V2-BKL-13, 001 | 001 ; workspace 004-xrepo |
| V2-BKL-12 | Profils d'usage (particulier / station club / bar) sans compte | Reco produit | Réécriture de 001 + workspace 007-xrepo | Haute | M | P2 | 001 | 001 |
| V2-BKL-13 | Identifiant de partie visible + QR (ouverture multi-écran, stats) | Backlog existant (#46, #47, #48) | Prérequis TV et partage | Haute | M | P2 | 010 | #46–#48 |
| V2-BKL-14 | Interopérabilité partenaires (contrat lien v2, autres jeux, éventuel contrat BDT) | Demande V2 (5.10) | Extension de 030 ; décider du rapport à 042-bdt | Haute | L | P2 | 030 | 030 ; workspace 001-xrepo |
| V2-BKL-15 | Mode Light véritable | Demande V2 (5.2) | — | Haute | M | P1 | V2-BKL-05 | — |
| V2-BKL-16 | Personnalisation graphique clubs/bars | Demande V2 (5.7) | — | Haute | L | P2 | V2-BKL-05, V2-BKL-15 | — |
| V2-BKL-17 | Session persistée versionnée + migrations | Reco archi | Version de schéma, validation structurelle (A13) | Haute | M | P1 | — | 010 |
| V2-BKL-18 | Historique local consultable (ou suppression de l'écriture morte) | Backlog existant (D4) | Exposer `listLocalGameHistory` ou retirer | Moyenne | M | P2 | V2-BKL-17 | 010 |
| V2-BKL-19 | Décision support navigateurs (iOS 12 vs Safari 16.4+) | Étude exploratoire | Matrice de support officielle | Moyenne | S (étude) | P1 (décision) | — | 018 |
| V2-BKL-20 | Correctifs anomalies tablettes/téléphones A4–A6 | Backlog existant | 1024×600, iPad paysage, ≤ 568 px | Haute | M | P1 | V2-BKL-04/05 | 027, 028 |
| V2-BKL-21 | Documentation V2 (specifications.md, README specs, release notes cohérentes) | Documentation (5.8) | Corriger A9–A11, slugs fantômes | Moyenne | M | P1 | V2-BKL-01 | 004, 026 |
| V2-BKL-22 | Budget de performance (INP, LCP, poids bundle legacy) | Reco archi | Suite de 020 | Moyenne | M | P3 | — | 020 |
| V2-BKL-23 | Nettoyage doc `docs/specifications.md` (modes, règles Killer/Gotcha) | Documentation | Sous-lot de V2-BKL-21 | Faible | S | P2 | — | — |
| V2-BKL-24 | Structure du projet : migration racine legacy (`views/`, `components/`, `utils/`) | Reco archi (5.9) | Plan progressif | Moyenne | L | P2 | V2-BKL-09 | 002, 022 |
| V2-BKL-25 | Observabilité native documentée (CF Web Analytics, CSP, consentement) | Documentation | Tombstone 012 + doc | Faible | S | P3 | — | 012, 024 |
| V2-BKL-26 | Spec gouvernance sécurité (security-review, Snyk, CSP, secrets) | Documentation | Formaliser slug fantôme `security-review` | Moyenne | S | P3 | — | 029 |
| V2-BKL-27 | Robustesse E2E : couverture 1280×800, exécution smartphone, troubleshooting | Backlog existant | Sous-lot de 008 | Haute | S | P1 | 008 | 008, 027 |
| V2-BKL-28 | Workspace : abandonner `003-counter-split-…social-shell`, reporter `001/004-xrepo`, fusionner `005`/`007` | Backlog existant | Mise à jour `next-specs.md` (hors repo) | Faible | S | P3 | Décision PO | §5 |

---

## 13. Décisions nécessitant l'arbitrage du product owner

1. **031 avant ou après publication 2.0.0** ? (activer un SW pour la première fois en même temps qu'un contrat public partenaire = risque cumulé ; mais 2.0.0 sans PWA = défaut connu publié).
2. **Support iOS 12** : maintenir (coût CSS + tests manuels sur un iPad Air réel) ou abandonner (spec 018 → `cancelled`, validation humaine). Le moteur Tailwind v4 rend le maintien coûteux [VÉRIFIÉ source externe].
3. **Portrait-only téléphone** (déjà codé) : valider la décision et réviser 028 en conséquence ; cohérence avec le paysage verrouillé tablette demandé (5.4).
4. **Sort du domaine `src/domain/scoring` inutilisé** : le faire devenir le moteur réel (V2-BKL-09) ou le supprimer.
5. **Historique local** : l'exposer (valeur joueurs/clubs) ou supprimer l'écriture morte.
6. **Relation avec `Bougnat_Darts_Tournaments` 042** et `badarts.fr` : la V2 doit-elle préparer le contrat xrepo (workspace 001/004) ou s'en tenir au lien `v=1` ? [À CONFIRMER : badarts.fr est-il le front de BDT ?]
7. **Adoption des conventions SDD v2** (§11.2) avant la rédaction des nouvelles specs.
8. **Clôtures en masse** (002, 003, 004, 014, 015, 016, 017, 019, 023, 025, 026) et abandon workspace `003-…social-shell` : validation demandée.
9. **Issues #45–#48, #50 (NOT_PLANNED)** : les rouvrir comme sources tracées des specs V2 ou les référencer seulement.
10. **Plage du bot Pro** (86–120 code vs 100–120 spec) : quelle valeur fait foi ?

---

## 14. Limites de l'analyse

- Aucune exécution de tests/build (règle lecture seule) : les comptes de tests (727/746) et la couverture proviennent des docs, non re-mesurés.
- Comportement visuel (layouts, tailles en px des anomalies A4–A6) non vérifié en navigateur : repris des notes v2.0.0.
- Mesure INP (020), latence vocale (003), comportement iOS 12 réel (018) : non vérifiables sans terrain → [À CONFIRMER].
- API GitHub instable pendant l'analyse : #71 et #103 non relues en détail ; tags distants non comparés (`git tag` local : `v1.0.0..v1.1`, `v1.1.3` présents ; `v1.1.1/2/4/5` absents localement [À CONFIRMER via `gh release list`]).
- `docs/technical.md`, `docs/architecture.md`, `docs/product-scope.md` lus par extraits ciblés seulement (domaine d'un autre agent documentation).
- Repo voisin `Bougnat_Darts_Tournaments` : seul l'en-tête de la spec 042 a été lu.
- Le ratio ×1,5 de 014 et la conformité fine de 017/019 aux règles officielles n'ont pas été recalculés (relève de la revue des jeux).
