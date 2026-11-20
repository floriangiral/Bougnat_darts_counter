> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 10 — Documentation (chantier 5.8) + Qualité, tests et non-régression

Agent : Documentation + Qualité / tests / non-régression — préparation V2 Bougnat Darts
Date d'analyse : 20 novembre 2026 — branche `feat/v2.0.0` (HEAD `508dfa6`)
Mode : **lecture seule** (aucun fichier du repo modifié, aucune commande d'écriture lancée : ni build, ni coverage, ni e2e).

Légende : [VÉRIFIÉ code] = constaté dans le code/config/git ; [VÉRIFIÉ source externe + URL] ; [HYPOTHÈSE] ; [À CONFIRMER].

---

## 1. Périmètre et fichiers analysés

### 1.1 Documentation (Périmètre A)

`git ls-files '*.md'` (hors node_modules) = 116 fichiers / 6 169 lignes [VÉRIFIÉ code] :

| Zone | Fichiers |
|---|---|
| Racine | `README.md` (129 l.), `CONTRIBUTING.md` (132), `SECURITY.md` (112), `LICENSE.md` (19) |
| `docs/` | `architecture.md` (225), `technical.md` (422), `specifications.md` (302), `product-scope.md` (63), `audit-security-hosting-performance-2026-04-24.md` (61) |
| `docs/architecture/` | `counter-pragmatic-clean-architecture.md`, `scoring-access-modes.md`, `scoring-terminal-offline-first-foundation.md` (tous trois titrés « archive v1.0.0 ») |
| `docs/integration/` | `external-match-link.md` (221) + `partner-simulator/index.html` (non-Markdown, testé par `tests/unit/tooling/partnerSimulator.test.ts`) |
| `docs/release/` | 19 fichiers : `v1.0.0`, `v1.0.1`, `v1.0.2`, `v1.1`, `v1.1.1`…`v1.1.5`, `v2.0.0` (+ coverage maps), `react-19-validation-matrix.md` |
| `.specify/` | `memory/constitution.md`, `templates/{spec,plan,tasks}-template.md` |
| `specs/` | `specs/README.md` (181) + 29 dossiers 001→031 (012 et 024 retirées) — contenu détaillé audité par un autre agent ; ici seulement leur place dans l'organisation |
| `.github/` | `ISSUE_TEMPLATE/{bug_report,improvement,config}.yml`, `dependabot.yml`, 10 workflows, 2 actions composites |
| Instructions agents IA | **Aucune** : pas de `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/instructions/`, `*.prompt.md`, `.cursorrules` [VÉRIFIÉ code — `find` sur le repo]. Seul `.vscode/mcp.json` est versionné. |
| Workspace (hors repo) | `.specify-workspace/ (workspace, hors dépôt) {README.md, constitution.transverse.md, workflow-brownfield.md, backlog/next-specs.md, templates/*.template.md}` |

Note : `.env.local` est couvert par une politique d'exclusion de contenu ; il n'a pas été lu. `.env.local.example` a été lu.

### 1.2 Qualité / tests (Périmètre B)

- `tests/unit/**` : 80 fichiers `*.test.ts(x)` + `x01/voiceBrowserFakes.ts` ; ≈ 532 blocs `it/test` statiques (la release note annonce 746 tests exécutés, cohérent avec `it.each`) ; 29 fichiers en `@vitest-environment jsdom` [VÉRIFIÉ code].
- `tests/e2e/**` : 7 specs + `helpers.ts` [VÉRIFIÉ code].
- `vitest.config.ts`, `playwright.config.ts`, `sonar-project.properties`, `scripts/validate-sonar-coverage.mjs`, `scripts/guard-clean-codebase.sh`, `scripts/run-playwright.sh`, `scripts/ensure-local-env.mjs`, `compose.yml`, `docker/*.Dockerfile`.
- `.github/workflows/*` (10) et `.github/actions/{setup-ci-app,run-local-smoke}`.
- `coverage/coverage-summary.json` (daté 19/11 16:49) et `test-results/.last-run.json` (20/11 ≈ 09:19-09:23) — lus sans relance.
- Code source échantillonné pour preuves : `App.tsx`, `views/*`, `src/app/appShell.ts`, `src/domain/**`, `src/application/**`, `src/features/**`, `src/infrastructure/local/IndexedDBSessionRepository.ts`, `src/shared/session/persistedAppSession.ts`, `src/lib/env.ts`, `utils/cricketLogic.ts`, `wrangler.jsonc`, `package.json`, `vite.config.ts`.

---

## 2. Constats — Documentation

### 2.1 Fiche par document

| Document | Rôle / public | État | Preuves principales |
|---|---|---|---|
| `README.md` | Vitrine joueurs/bars/clubs + liens contributeurs | **À jour (ton, jeux) mais 3 sur-promesses** | (a) « Réglez … l'ouverture » (l.30) : le *check-in* (Open/Double/Master In) est configurable mais **jamais appliqué au scoring** (voir §2.2-F1). (b) « Une pause n'efface pas la partie : elle reste sur l'appareil et peut être reprise » (l.22) : vrai **pour X01 seulement** (§2.2-F2). (c) Intégration partenaire / badarts.fr présentée comme disponible (l.70-78) alors que la v2.0.0 n'est pas publiée (`origin/production` = 1.1.4, `origin/main` = 1.1.5) [VÉRIFIÉ git] — acceptable sur `feat/v2.0.0`, bloquant si fusionné dans `main` avant la mise en production. (d) « écran de comptoir … tout le monde suit la partie » (l.21, l.60) : ambigu — aucun mode TV/diffusion n'existe (un seul appareil) [HYPOTHÈSE d'interprétation]. |
| `CONTRIBUTING.md` | Contributeurs humains | **Incomplet / partiellement redondant** | Pas d'installation (renvoi implicite à `technical.md`), pas de modèle de branches (`develop` → `release/*` → `main` → `preprod` → `production`, `feat/*`), pas de convention de commit (le `git log` suit Conventional Commits FR/EN), pas de procédure SDD (comment créer une spec, statuts), pas de prérequis E2E (WebKit, origine partenaire de test), pas de règle de langue/accents (5 commits du 20/11 corrigent des accents UI). « Vérification minimale » (l.39-48) omet `guard:clean` et `test:e2e`. Sections « Frontière open source » et « Orientation produit » se recouvrent. Demande de reporter la stratégie de test dans la PR alors qu'**aucun `pull_request_template.md`** n'existe. |
| `SECURITY.md` | Chercheurs sécurité | **À jour** (inclut le lien externe) | Contact `security_code@bougnatdarts.net` alors que tout le reste du projet utilise `bougnatdarts.fr` [À CONFIRMER : domaine .net réellement opéré ?]. |
| `LICENSE.md` | Légal | À jour (MIT 2026) | — |
| `docs/architecture.md` | Référence architecture | **Non conforme au code + mal structuré** | Arbre l.69-101 : place `views/`, `components/`, `lib/env.ts` **sous `src/`** alors qu'ils sont à la racine (seul `src/lib/env.ts` existe) ; omet `src/features/{tablet,capital,cricket,external-match,app-install,x01/session}`, `src/presentation/`, `src/shared/ids/`, `src/domain/{killer,gotcha,x01Bot,triathlon}`, `src/application/x01Bot/`, `functions/`, `lib/` racine. Règle de dépendance l.112-118 (« domain may depend only on shared », « application may depend on domain and shared ») **violée** : `src/domain/killer/killer.ts:1`, `gotcha.ts:1`, `x01Bot.ts:1` importent `../../../types` (racine legacy) ; `src/application/x01Bot/x01BotTurn.ts:4` importe `src/features/x01/scoring/possibleTurnScores` [VÉRIFIÉ code]. Aucune règle ESLint ne l'impose (`eslint.config.js` sans `no-restricted-imports`). `CONNECTED_MODE` (l.60-65) n'existe pas dans le code (`AppAccessMode = 'local' | 'dedicated_tablet' | 'personal_phone'`, `src/app/appShell.ts:8`) — seul un commentaire « placeholder » dans `src/application/scoring/ports.ts:9`. Décisions v2.0/v1.1/v1.0.1 empilées dans le même fichier (contenu ADR non isolé). Mélange FR/EN. |
| `docs/technical.md` | Guide dev / exploitation | **Partiellement obsolète + contradictoire** | « préparée sur `release/v2.0.0` » alors que le dev est sur `feat/v2.0.0`. Liste « `501 Double Out` » comme jeu (l.12) : ce n'est qu'une variante X01 (`views/GameSelectionView.tsx:36-82` : 6 cartes). Section Playwright : « socle Node 24 de l'application » contredit Node 26 (`.nvmrc` = 26.13.1). « 61 tests E2E Chromium/WebKit passent » contredit `docs/release/v2.0.0.md:100-102` (« suite complète reste à exécuter ») ; comptage statique actuel ≈ 87 instances (§4.2). Chiffres de couverture du « 3 novembre 2026, 398 tests » obsolètes (746 tests le 19/11). Deux liens absolus `/home/<utilisateur>/...wrangler.jsonc` (l.187, l.218) **cassés sur GitHub**. Index de doc (l.393-412) omet `v1.0.0*`, `v1.0.2-coverage-map`, `react-19-validation-matrix`. Docker de dev (`compose.yml`, `npm run docker:dev`, profil `e2e`) non documenté. Support navigateurs (iOS ≥ 12 via `@vitejs/plugin-legacy`, `vite.config.ts:29-33`) non documenté. Prérequis E2E locaux incomplets (cf. §4.4). Document fourre-tout (installation, overrides npm, inventaire des versions, CI, déploiement, qualité) → difficile à maintenir. |
| `docs/specifications.md` | Spécification produit globale | **Obsolète / non conforme** | « historique local » dans le scope courant (l.21) et « historique récent sur le device » (l.245) : l'historique est **écrit** (`useGameLifecycle.ts:97-169` → `saveLocalGameHistoryEntry`) mais **jamais lu par l'UI** (`listLocalGameHistory` n'est appelé que par l'infrastructure et les tests) [VÉRIFIÉ code]. « open / double / master in » listé comme règle fonctionnelle courante (l.80) : non implémenté (F1). « `501 Double Out` » comme mode (l.68). Aucune règle Killer/Gotcha (§4 ne couvre que X01, Cricket, Capital, Triathlon). §5.bis « specs locales actives » : 13 slugs sur 29 specs. Modes d'accès (`dedicated_tablet`, `personal_phone`, `?mode=`) non décrits alors que `docs/architecture/scoring-access-modes.md` y renvoie. |
| `docs/product-scope.md` | Frontière produit | **Globalement à jour**, 2 inexactitudes | « historique local » (non exposé). « mode bot IA » : le robot est un tirage probabiliste par niveau (`src/domain/x01Bot/x01Bot.ts:11-17`, moyennes 30→120) ; l'UI dit « Adversaire robot » (`SetupPlayersSection.tsx:118`). Terme « IA » trompeur (même remarque pour « Assistance vocale IA », `MatchSettingsModal.tsx:89`, qui est une transcription Deepgram + parseur à règles). |
| `docs/architecture/*.md` (3) | Archives v1.0.0 | **Mal positionnés** | Titrés « archive » mais rangés au même niveau que la référence et listés dans l'index « Documentation technique » de `technical.md`. `scoring-access-modes.md` renvoie à `specifications.md` comme « référence courante », qui ne traite pas le sujet → **sujet orphelin** alors que les modes sont actifs (`appShell.ts:63-90`, `tabletLayout.ts:36`, e2e `?mode=dedicated_tablet`). Liste d'écrans sans `KILLER_*`/`GOTCHA_*`. |
| `docs/audit-security-hosting-performance-2026-04-24.md` | Audit ponctuel | **Historique non signalé comme tel** | Daté, pertinent comme trace ; pas de bandeau « historique », risques résiduels (rate-limit mémoire, `MatchView` volumineux : 869 l.) non reportés dans un registre de dette vivant. |
| `docs/integration/external-match-link.md` | Partenaires (FR, accentué) | **À jour et conforme** | Bornes vérifiées : `start` 2-9999, `legs/sets` 1-15, noms 32 car., TTL 12 h (`externalMatchLink.ts:61-69`) [VÉRIFIÉ code]. **Mais** accepte `in=double|master` (`externalMatchLink.ts:224-226`) sans effet sur le scoring (F1) → un partenaire peut croire imposer un Double In. |
| `docs/release/v2.0.0.md` + coverage map | Notes de version en préparation | **Contradiction interne** | l.9 « le lien externe reste désactivé tant qu'aucune origine n'est déclarée dans `wrangler.jsonc` » alors que `wrangler.jsonc` déclare `https://badarts.fr` en preview et production (commit `f9ac4c2`) et que le README l'annonce. Chiffres E2E (28 scénarios lien externe) ≠ comptage statique (29) [mineur]. |
| `docs/release/v1.0.x` / `v1.1.x` | Historique | **Bandeau trompeur / hétérogène** | v1.1.x : « La version active est v2.0.0 » alors que v2.0.0 n'est pas publiée et que la production est en 1.1.4 [VÉRIFIÉ git `origin/production:package.json`, à confirmer côté Cloudflare]. v1.0.x : statut « stable » sans bandeau historique. `react-19-validation-matrix.md` cite React 19.2.0 (actuel 19.3.1) sans bandeau. Aucun document ne dit « ce qui est en production aujourd'hui ». Doublon fonctionnel avec `components/ui/ChangelogModal.tsx` (305 l., notes v1.1.1→v2.0.0 codées en dur dans le TSX). |
| `specs/README.md` | Index SDD | **Incomplet / incohérent** | 027 et 028 absentes de l'index. « 727 tests unitaires » (l.142) vs « 746 » (release note). Référence `spec:counter/release-v1.1.3-sonar-debt` sans dossier. Toutes les specs « active », y compris releases v1.0.1/v1.1 terminées → **aucun cycle de vie** ; statuts hétérogènes (`active`, `Active`, `accepted`, `planned`, absent pour 017/018/019/029/030/031 en tête de liste) et **non conformes** au cycle `draft/validated/in_progress/done/superseded/cancelled` de `.specify-workspace/workflow-brownfield.md`. Catégories `counter-sync-*`, `counter-backend-adapter-*` jamais utilisées. 020, 021, 027, 028 sans `plan.md`/`tasks.md` malgré la « structure minimale ». Langue FR (001-026) puis EN (027-031). |
| `.specify/memory/constitution.md` | Constitution locale | **Obsolète + lien inaccessible** | Référence un chemin absolu local (`/home/<utilisateur>/.../constitution.transverse.md`) invisible pour tout contributeur GitHub. Mission « expériences joueur/social si maintenues » contredit la décision v1.0.0 (social retiré, `docs/architecture/counter-pragmatic-clean-architecture.md:41-48`). Règle 5 (queue d'opérations, mapping contrat backend) hors sujet pour un client sans backend. Ne mentionne ni gratuité, ni absence de pub, ni compte non obligatoire, ni frontière open source. |
| `.specify/templates/*` | Gabarits SDD | **Trop minimaux** | 12 rubriques ; manquent : ID, origine, user stories, parcours, ENF, cas limites, erreurs, impacts données/interfaces, compatibilité, dépendances, critères d'acceptation mesurables, scénarios de test, non-régression, décisions, questions ouvertes (exigés par la mission §8). Statut par défaut `draft` jamais utilisé par les specs existantes. |
| `.specify-workspace/*` | Gouvernance multi-repo | **Obsolète pour le counter** | `backlog/next-specs.md` (17/04/2026) propose `003-counter-split-scoring-client-from-player-social-shell`, `005-counter-offline-scoring-session-store` : numéros déjà pris localement et orientation (sync/queue/devices) abandonnée par la frontière v1.0/v2.0. Non versionné (« si le workspace devient un dépôt Git… ») → invisible des contributeurs. Template `adr-lite` existant mais **aucun ADR** dans le repo. |
| `.github/ISSUE_TEMPLATE/*.yml` | Testeurs | **Obsolète** | Zones : « 501 Double Out » (pas un jeu), « Historique » (pas d'écran), **absence de Killer, Gotcha, lien de match / tournoi, mode tablette**. Placeholder version « v1.0.1 ». Lien WhatsApp public (`config.yml`) [À CONFIRMER : volonté de l'exposer]. Pas de template PR, pas de `CODEOWNERS`. |
| Instructions agents IA | Agents (Copilot, Claude, Codex…) | **Manquant** | Aucun fichier. Les règles critiques (lecture seule du domaine, frontière backend, Sonar, accents FR, Node 26/npm 12, pas de `crypto.randomUUID` hors contexte sécurisé…) sont dispersées dans 6 documents. |
| Documentation utilisateur | Joueurs | **Quasi absente hors README** | Règles des jeux uniquement dans l'app (`setupPresentation.ts`, modale règles). Aucun guide de la voix (vocabulaire reconnu, permissions micro, limites). Aucune FAQ tablette/installation/iOS. |
| Tests / QA | Contributeurs | **Dispersé** | Stratégie de test répartie entre `CONTRIBUTING.md`, `technical.md`, spec 008, spec 029, coverage maps. Pas de document « comment tester » unique. |

### 2.2 Fonctionnalités présentées comme disponibles alors que non (ou partiellement) implémentées

| ID | Affirmation | Où | Réalité code | Gravité |
|---|---|---|---|---|
| F1 | Ouverture / Double In / Master In | README l.30, `specifications.md:80`, `product-scope` (implicite), guide partenaire (`in=`), modale de règles (« le score ne commence qu'après une ouverture valide », `setupPresentation.ts:109`) | `checkIn` est saisi (`SetupX01RulesSection.tsx:27`), persisté (`persistedAppSession.ts:15`), accepté par le lien (`externalMatchLink.ts:224`) mais **aucun calcul de score ne le lit** : seules `checkOut` est utilisé (`matchLifecycle.ts:264`, `ScoringRules.ts:16`, `MatchView.tsx:409-533`) [VÉRIFIÉ code]. La saisie par volée totale ne permet d'ailleurs pas de vérifier une ouverture. | **Critique** (règle affichée au joueur et contractuelle pour les partenaires, sans effet) |
| F2 | Reprise de partie après pause/rechargement | README l.22, spec 010 (« pas de perte silencieuse d'état critique pendant une partie en cours ») | Seul X01 persiste son état courant (`matchRuntime`, `App.tsx:106-110, 355-360`). Cricket, Capital, Killer, Gotcha, Triathlon sont remontés sans état restauré (`App.tsx:364-420` : pas de `restoredState`/`onStateChange`) ; leur état et leur historique d'annulation vivent en `useState` (`GotchaGameView.tsx:69-72`, `KillerGameView.tsx:31-34`, `CricketGameView.tsx:60`) → **progression perdue au rechargement**, partie relancée à zéro [VÉRIFIÉ code]. La spec 010 cite `saveSession`/`loadSession` qui n'existent pas. | **Critique** (promesse produit et invariant de spec) |
| F3 | Historique local | `specifications.md:21,245`, `product-scope.md:11`, archives | Écrit, jamais affiché ni consultable | Majeure |
| F4 | « Mode bot IA », « Assistance vocale IA » | `product-scope.md:28`, UI | Heuristique probabiliste / transcription + parseur à règles | Mineure (vocabulaire) |
| F5 | `CONNECTED_MODE` | `architecture.md:60-65` | Inexistant | Mineure |
| F6 | Lien externe « désactivé par défaut » | `v2.0.0.md:9`, `architecture.md:158`, `product-scope.md:41` | Vrai pour le code, faux pour la config livrée (`wrangler.jsonc` : badarts.fr en preview et production) | Majeure (contradiction de release) |
| F7 | Master Out | README, `product-scope.md:28` | Reste = 1 n'est pas « bust » en Master Out (seul Double est testé : `ScoringRules.ts:16`, `matchLifecycle.ts:264`) ; table des « bogeys » dupliquée 3 fois (`ScoringRules.ts:4`, `checkoutEligibility.ts:3`, `x01BotTurn.ts:11`) [VÉRIFIÉ code ; règle exacte à confirmer par l'agent « jeux »] | Majeure (à confirmer) |

Inversement (implémenté mais non documenté) : modes d'accès `dedicated_tablet`/`personal_phone` et paramètre `?mode=` ; mise en page tablette (spec 027) ; verrouillage portrait téléphone (`usePortraitLock.ts`, `RotateToPortraitOverlay.tsx`) hors release note ; Docker de dev ; support iOS 12 ; garde `guard:clean` ; simulateur partenaire bien documenté.

### 2.3 Contradictions doc/spec ↔ code notables

1. **Spec 028** (« Landscape is never functionally blocked », l.31) ↔ v2.0.0 « téléphone en portrait uniquement » (`RotateToPortraitOverlay.tsx`, e2e `smartphone-layout.smoke.spec.ts:36-47`). Spec non mise à jour [VÉRIFIÉ code].
2. **Spec 027** (« Portrait is the default », l.9/28) ↔ chantier V2 5.4 (verrouillage paysage tablette) : à arbitrer.
3. **Planchers de couverture** : `vitest.config.ts` / spec 029 / CONTRIBUTING = 90/80/90/90 ; le résumé CI `quality-gate.yml` (« Publish global quality baseline ») affiche « Floors: 75% statements/lines, 60% branches, 75% functions » [VÉRIFIÉ code].
4. **Exécution E2E** : `technical.md` (61 tests passés) ↔ `v2.0.0.md` / coverage map (suite complète non exécutée).
5. **Nombre de tests** : 727 (`specs/README.md`) ↔ 746 (release note).
6. **Règle de dépendances** (`architecture.md`) ↔ imports réels (domain → `types.ts` racine ; application → features).
7. **Statuts de spec** (repo) ↔ cycle de vie du workspace.
8. **Constitution locale** (social « si maintenu ») ↔ CONTRIBUTING (social exclu).
9. **Traçabilité** : `tests/e2e/completion.smoke.spec.ts:1` référence `spec:counter/smoke-e2e-per-game-navigation`, slug inexistant ; seuls 9 slugs de spec sont cités dans le code (killer, gotcha, bot, tablette, smartphone, Sonar… jamais) [VÉRIFIÉ code].
10. `.env.local.example` contient `VITE_ENABLE_BETA_BADGE` (aucun usage dans le code) et omet `DEEPGRAM_PROJECT_ID` (lu par `vite.config.ts:54`).

---

## 3. Constats — Qualité, tests, CI

### 3.1 Couverture (rapport existant, non relancé)

`coverage/coverage-summary.json` (19/11 16:49) : lignes 95,8 %, instructions 94,78 %, fonctions 97,1 %, branches 88,05 % [VÉRIFIÉ fichier].

- **Rapport périmé** : antérieur aux commits `d76dfd0` (17:34, `src/shared/ids/createId.ts`) et `1e8becd` (21:20, `usePortraitLock.ts`, `RotateToPortraitOverlay.tsx`) — ces fichiers n'y figurent pas [VÉRIFIÉ git + fichier].
- **Biais structurel** : `sonar.coverage.exclusions` (repris par Vitest) exclut `App.tsx` (479 l.), `views/MatchView.tsx` (869), `SetupView` (430), les 5 autres vues de jeu (~1 630 l.) et 7 composants modaux. ≈ 3 400 lignes de composition **contenant de la logique** (undo, gestion de fin, timers, état de partie) sont hors mesure ; le 95,8 % ne décrit donc que la partie « pure ».
- **Fichiers sous les planchers (branches)** : `application/scoring/EndLeg.ts` 50 %, `RecordThrow.ts` 55,5 %, `cricketLogic.ts` 58,3 %, `x01BotTurn.ts` 59,5 %, `matchPlayerScore.ts` 62,5 %, `GameSelectionView.tsx` 62,5 %, `appShell.ts` 66,7 % (fonctions 73,3 %), `dartsSpeechParserIntent.ts` 67,5 % (lignes 76,5 %), `killer.ts` 74,6 %, `PlayerScore.tsx` 75 %.
- **Code mort mesuré à 0** : `src/domain/scoring/entities/{Game,Leg,Throw,Turn}.ts` (types seuls, présentés comme « modèle de données majeur » dans `specifications.md §6`).

### 3.2 Cartographie des tests par jeu / module

| Jeu / module | Logique pure (Vitest) | Vue (exclue de la couverture) | E2E Playwright | Verdict |
|---|---|---|---|---|
| **X01** | `gameLogic`, `application/matchLifecycle`, `scoringUseCases`, `x01/matchScoring`, `scoringDomain`, `matchHooks`, `matchPlayerScore`, `botVictoryPreview` | `MatchView.tsx` 869 l. | entrée (`gameplay-entry`), mise en page (tablette/phone), **match complet seulement via le lien externe** (`external-match-link` : fin de match, envoi, reprise après reload) | Bonne couverture règles Double Out ; **aucun test Double/Master In** (non implémenté), **Master Out non testé**, pas de test sets complets hors lien |
| **Bot X01** | `x01BotDefinition`, `x01BotTurn` (B 59,5 %) | — | aucun | Faible (probabiliste, pas de graine déterministe documentée) [HYPOTHÈSE à vérifier] |
| **Voix X01** | ≈ 14 fichiers (parseur, normaliseur, PCM, AudioContext, Deepgram client/connexion, streaming 506 l.) avec fakes navigateur | `VoiceScoringControl` testé | **aucun** (CI : `VITE_ENABLE_VOICE_SCORING=false`) | Unitaire riche, **zéro bout-en-bout** |
| **Cricket** | `cricketLogic` (5 tests, B 58,3 %), `cricketGameModel`, `cricketScoreboard` | `CricketGameView` 364 l. | entrée + layout | Pas de partie jouée en E2E ; pas de cas limite de limite de rounds/égalité |
| **Capital** | `capitalLogic` (255 l.), `capitalGameModel`, `capitalKeypad`, `capitalStatsView` | `CapitalGameView` 335 l. | entrée + layout | Correct sur règles |
| **Killer** | `killerLogic` (5 tests) | `KillerGameView` 274 l. (état + undo en `useState`) | **ouverture seulement** (`completion`, layout) — absent de `gameplay-entry` | Faible ; spec 029 exige « au moins un check d'acceptation » : satisfait seulement de façon nominale |
| **Gotcha** | `gotchaLogic` (5 tests) | `GotchaGameView` 300 l. (undo 30 états en vue) | **ouverture seulement** | Faible ; logique d'annulation non testée et exclue de la couverture (contraire à spec 029 §25 « Domain and application behavior must never be excluded ») |
| **Triathlon** | `triathlonScoring` (160 l.), `triathlonFlow`, `triathlonPresentation` | `TriathlonGameView` 354 l. | entrée + tirage du premier joueur | Correct sur règles, rien sur les transitions de manche en E2E |
| **Setup** | `setupModel` (311 l.), `setupViewModel`, `setupPresentation`, sections | `SetupView` | via tous les parcours | Bon |
| **Persistance / reprise** | `indexedDbSessionRepository` (+ fake-indexeddb), `persistAppSession`, `appPersistence`, `appShell` | — | reload **uniquement** dans les tests du lien externe | **Aucun test de reprise des jeux non-X01** (et pour cause, F2) |
| **Lien externe** | 5 fichiers, 100 % | — | 29 scénarios | Très bon (modèle à généraliser) |
| **Install/PWA** | `installPromptModel`, `useInstallPrompt`, `installAppButton` | — | aucun | Spec 031 à venir |
| **Token Deepgram (Function)** | `deepgramTokenRoute`, `deepgramToken` | — | aucun | Correct |
| **Outillage** | `externalReturnOrigins`, `partnerSimulator`, `cloudflareMultipart` | — | — | Bon |

### 3.3 E2E : inventaire

| Spec | Projets | Contenu |
|---|---|---|
| `app.smoke` (2) | chromium | accueil, absence de « Connexion/Inscription » |
| `completion.smoke` (6) | chromium | **nom trompeur** : entrée/sortie du setup par jeu, aucune « complétion » |
| `gameplay-entry.smoke` (4) | chromium | démarrage X01, Cricket, Capital, Triathlon (pas Killer/Gotcha) |
| `navigation.smoke` (1) | chromium | parcours de navigation (redondant avec `completion`) |
| `external-match-link.smoke` (29) | chromium | lien externe complet |
| `tablet-layout.smoke` (6) | chromium + 3 iPad WebKit | ouverture de chaque jeu, absence de débordement |
| `smartphone-layout.smoke` (7) | 3 iPhone WebKit | rotation + débordement |

≈ 48 instances Chromium + 18 tablette + 21 smartphone ≈ **87 instances** [VÉRIFIÉ comptage statique, non exécuté].

Types de tests **absents** [VÉRIFIÉ code — aucune occurrence de `toHaveScreenshot`, `toMatchSnapshot`, `axe`, `BroadcastChannel`, `storage` event, `prefers-color-scheme`/thème dans `tests/` ni dans le code] :
- régression visuelle ; accessibilité automatisée (axe) ; contraste ; thèmes (il n'y a qu'un thème sombre) ;
- synchronisation multi-onglets / multi-appareils (nécessaire au mode TV) ;
- voix bout-en-bout (micro simulé + WebSocket Deepgram simulé) ;
- parties complètes jusqu'à la victoire pour 5 jeux sur 6 ; reprise après reload hors X01 ;
- navigateurs : pas de Firefox, **pas de profil Android Chrome** (les « smartphones » sont des iPhone WebKit), pas de test du **bundle legacy** (cible iOS ≥ 12, spec 018) ;
- performance (INP, spec 020) non mesurée en CI.

### 3.4 Robustesse CI

| # | Constat [VÉRIFIÉ code] | Gravité |
|---|---|---|
| C1 | `lint:type-aware`, `guard:clean`, `wrangler:check` **ne tournent pas en CI** (`grep` sur `.github/` : seul `env:check`) alors que CONTRIBUTING les exige localement. `governance:coverage` ne tourne que dans le job Sonar. | Majeure |
| C2 | E2E déclenché seulement sur PR vers `main`, `preprod`, `release/**` ; ni sur `develop` (cible de Dependabot), ni sur push, ni planifié → montées de dépendances jamais testées E2E avant la PR de release. | Majeure |
| C3 | Résumé « Global Quality Baseline » affiche des planchers faux (75/60/75). | Mineure |
| C4 | `run-local-smoke` démarre `vite preview` puis `npm run test:e2e` → `run-playwright.sh` en démarre un **second** (`PLAYWRIGHT_EXTERNAL_SERVER` non défini) ; `vite preview` sans `--strictPort` bascule silencieusement sur un autre port ; logs écrits dans `/tmp`. Fonctionne par chance. | Mineure |
| C5 | `guard-clean-codebase.sh` utilise `rg` dans un `if` : si `rg` est absent (code 127), la garde **passe silencieusement** [disponibilité de `rg` sur `ubuntu-latest` : À CONFIRMER]. | Mineure |
| C6 | `retries: 1` en CI sans rapport de flakiness → tests instables masqués. | Mineure |
| C7 | Couverture calculée deux fois (job baseline + job Sonar). | Mineure (coût temps) |
| C8 | Jobs Sonar/Snyk dépendants de secrets → échec sur PR de fork (contributeurs open source). | Mineure |
| C9 | E2E local **non hermétique** : `test-results/.last-run.json` (20/11) montre 64 échecs = 25 du lien externe (bannière absente : `.env.local` local sans `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=https://partner.example`) + 39 WebKit non installé (`Executable doesn't exist … webkit-2388`). `technical.md` ne mentionne aucun de ces prérequis [VÉRIFIÉ artefacts ; auteur du run inconnu]. | Majeure (expérience contributeur / agents IA) |
| C10 | Aucun contrôle de liens/documentation (liens absolus cassés passés inaperçus). | Mineure |
| C11 | Pas de garde-fou d'architecture (imports inter-couches) ni de « doc drift » (ex. vérifier que chaque `spec:counter/…` cité existe). | Majeure (V2 = forte croissance du code) |

---

## 4. Problèmes / dettes (synthèse par gravité)

**Critiques**
- D1 (F1) Double/Master In affiché et contractualisé sans implémentation.
- D2 (F2) Reprise de partie limitée à X01 alors que promise pour tous ; invariant de spec 010 violé.

**Majeures**
- D3 Aucune instruction pour agents IA ; onboarding dispersé (6 documents, chemins absolus).
- D4 Absence de distinction implémenté / spécifié / futur / décision / historique ; bandeaux « version active v2.0.0 » faux tant que non publiée ; aucun « état de production ».
- D5 `architecture.md` non conforme au code ; règles de dépendance non outillées.
- D6 Specs : cycle de vie inexistant, index incomplet, templates insuffisants pour la mission §8, contradictions 027/028.
- D7 Couverture « pure » flatteuse ; vues de jeu contenant de la logique exclues ; jeux Killer/Gotcha quasi non testés.
- D8 CI : contrôles locaux obligatoires absents de la CI ; E2E tardif ; E2E local non hermétique.
- D9 Contradictions de release (`v2.0.0.md` vs `wrangler.jsonc`, nombres de tests, E2E).

**Mineures**
- D10 Vocabulaire « IA », « 501 Double Out » comme jeu, templates d'issues obsolètes, `.env.local.example` désaligné, liens absolus, FR/EN et accents hétérogènes, doublon changelog TSX / docs.

---

## 5. Solutions possibles et recommandations

### 5.1 Organisation documentaire cible

Trois options comparées :

| Option | Description | + | − |
|---|---|---|---|
| A. Statu quo corrigé | Corriger les erreurs, garder la structure | Coût minimal | Ne résout ni la distinction implémenté/futur ni l'onboarding ; `technical.md` reste fourre-tout |
| **B. Réorganisation par public + statut (recommandée)** | Arborescence ci-dessous, docs courtes, un index unique, ADR, bandeaux de statut normalisés | Lisible humains + agents ; distinction exigée par la mission ; maintenable | Déplacements de fichiers (liens à mettre à jour, redirections README) |
| C. Site de doc (Docusaurus/VitePress) | Génération HTML | Navigation, recherche | Nouvelle dépendance + build + hébergement ; injustifié à ce stade (GitHub rend le Markdown gratuitement) |

Arborescence cible (option B) — **aucun déplacement avant validation** :

```
README.md                      # joueurs (inchangé dans l'esprit) + liens
CONTRIBUTING.md                # humains : workflow, branches, commits, SDD, checks
AGENTS.md                      # agents IA (format ouvert agents.md)
.github/copilot-instructions.md  # court, renvoie à AGENTS.md
.github/pull_request_template.md # spec, couche, stratégie de test, exclusions
SECURITY.md, LICENSE.md
docs/
  README.md                    # INDEX + légende des statuts (Implémenté / Spécifié / Futur / Décision / Historique)
  product/
    vision.md                  # principes non négociables (gratuité, sans pub, sans compte…)
    scope.md                   # ex-product-scope.md (implémenté uniquement)
    status.md                  # « État livré » : version en prod, preprod, branche en cours
    games/x01.md cricket.md capital.md killer.md gotcha.md triathlon.md  # règles IMPLÉMENTÉES, liées aux golden tests
    roadmap.md                 # futur (V2…), sans promesse de date
  user/
    guide.md, voice.md, tablet-and-install.md, faq.md
  architecture/
    overview.md                # ex-architecture.md réécrit (arbre réel, couches, règles outillées)
    access-modes.md            # reprend le sujet orphelin
    persistence.md             # IndexedDB + fallback localStorage, ce qui est/n'est pas restauré
    adr/0001-…md               # décisions extraites (résultat non signé, pas de backend, React 19, Node 26, portrait phone…)
  dev/
    setup.md                   # Node/npm, .env, Docker
    testing.md                 # pyramide, commandes, prérequis E2E, golden tests, Sonar
    ci-cd.md                   # workflows, branches, environnements, secrets
    dependencies.md            # overrides npm, allowScripts, inventaire de versions
    conventions.md             # langue, accents, nommage, commits
  integration/                 # inchangé (partenaires)
  operations/
    deployment.md, observability.md, environments.md
  history/
    releases/vX.Y.Z.md (+ coverage maps)  # déplacés, bandeau « Historique »
    archive/architecture-v1.0.0/*.md
    audits/2026-04-24-security-hosting-performance.md
specs/README.md                # index complet, statuts normalisés, lien vers template v2
```

Règle de statut proposée (bandeau en tête de chaque doc) : `Statut : Implémenté (vX.Y.Z) | Spécifié (spec NNN, non livré) | Futur (non spécifié) | Décision (ADR) | Historique`. Une fonctionnalité n'apparaît dans `product/` et `user/` qu'à l'état « Implémenté » et livré en production ; sinon elle reste dans `roadmap.md` ou la spec.

### 5.2 Guide d'onboarding agents IA

Recommandation : **`AGENTS.md` à la racine** (format ouvert, lisible par plusieurs outils — [VÉRIFIÉ source externe https://agents.md/]) + `.github/copilot-instructions.md` minimal qui y renvoie (prise en charge exacte par GitHub Copilot : [À CONFIRMER] — doc GitHub non joignable pendant l'analyse). Éventuellement `.github/instructions/*.instructions.md` ciblés (`applyTo: tests/**`, `specs/**`) [À CONFIRMER].

Contenu proposé (≤ 200 lignes, aucun secret) :
1. Mission et principes non négociables (gratuité, sans pub, sans compte, simplicité, navigateur) ; frontière : pas de backend métier, `Bougnat_Darts_Tournaments` = source de vérité tournoi.
2. Carte du code **réelle** (racine legacy vs `src/` en couches) et règles d'import autorisées.
3. Commandes (Node 26.13.1 via `.nvmrc`, npm 12.2.3, `npm ci`, `ci:check`, `lint:type-aware`, `test:unit:coverage`, `governance:coverage`) et **prérequis E2E** (`npx playwright install chromium webkit`, `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=https://partner.example` pour le build de smoke).
4. Workflow SDD : lire `specs/README.md`, ne jamais coder hors spec validée, statuts, template, traçabilité `// Spec: spec:counter/...`.
5. Règles qualité : planchers 90/80/90/90, interdiction d'exclure du domaine, tests golden obligatoires pour toute règle de jeu, `act` attendu, pas de désactivation de règles ESLint.
6. Conventions : UI en français **accentué**, commits Conventional Commits, pas de `crypto.randomUUID` direct (utiliser `src/shared/ids/createId.ts`), pas de secret en `VITE_*`.
7. Interdits : modifier `wrangler.jsonc` sans PR dédiée, ajouter une dépendance sans justification, présenter une fonctionnalité non livrée comme disponible dans la doc.
8. Définition de « terminé » : spec à jour, tests, doc de statut, release note, changelog in-app.

### 5.3 Templates SDD v2

Proposer `.specify/templates/spec-template.md` v2 couvrant les 26 rubriques de la mission §8, avec en-tête normalisé (`ID`, `Slug`, `Statut` ∈ {draft, validated, in_progress, done, superseded, cancelled}, `Origine`, `Milestone`, `Version cible`, `Langue`), plus deux gabarits distincts : `study-template.md` (étude de faisabilité) et `adr-template.md` (repris du workspace, versionné dans le repo). Langue unique recommandée : français (cohérent avec le produit), à arbitrer.

### 5.4 Stratégie de non-régression V2

| Brique | Mise en œuvre proposée | Coût récurrent | Dépendance |
|---|---|---|---|
| **Golden tests de règles par jeu** | Fixtures déclaratives versionnées `tests/golden/<jeu>/*.json` (séquence d'entrées → états attendus : scores, bust, victoire, undo), exécutées par Vitest contre les moteurs purs. Une table par règle documentée dans `docs/product/games/<jeu>.md` (lien bidirectionnel). Couvrir d'abord : X01 (Double/Master Out, bogeys, sets, Double/Master In une fois implémentés), Cricket (limite de rounds, égalité), Killer, Gotcha, Triathlon (transitions), Capital. | 0 € | aucune |
| **Reprise de session par jeu** | Tests unitaires de sérialisation/restauration + 1 E2E reload par jeu (après correction F2). | 0 € | aucune |
| **Contrat de snapshot TV** | Schéma versionné (`snapshotVersion`) du « MatchSnapshot » diffusé ; tests de contrat Vitest : fixtures golden par jeu → snapshot attendu ; test de compatibilité ascendante (un récepteur vN lit vN-1). Indépendant du transport (BroadcastChannel / WebRTC / autre, à décider par l'agent TV). | 0 € | aucune |
| **Synchronisation multi-onglets** | Playwright : 2 `page` dans le même `browserContext` (émetteur + écran TV), vérification de convergence après chaque saisie, undo, reload de l'émetteur, fermeture/réouverture du récepteur [HYPOTHÈSE technique : BroadcastChannel est partagé dans un même contexte navigateur]. Multi-appareils réels : hors CI, checklist manuelle. | 0 € | aucune |
| **Voix bout-en-bout** | Playwright Chromium avec micro simulé (`--use-fake-device-for-media-stream`, `--use-file-for-fake-audio-capture=<wav>`) [À CONFIRMER sur WebKit : non supporté] + **WebSocket Deepgram simulé** via `page.routeWebSocket()` ([VÉRIFIÉ source externe https://playwright.dev/docs/api/class-websocketroute]) + route HTTP simulée pour `/api/deepgram/token`. Corpus d'énoncés golden (transcription → intention → score) partagé avec le parseur. Aucun appel Deepgram réel en CI (coût 0, pas de secret). Un essai réel reste manuel. | 0 € | aucune |
| **Régression visuelle** | `expect(page).toHaveScreenshot()` natif ([VÉRIFIÉ source externe https://playwright.dev/docs/test-snapshots]) sur un petit jeu d'écrans clés × viewports × thèmes, exécuté **dans l'image Docker Playwright** déjà présente (`docker/playwright.Dockerfile`) pour la stabilité des rendus. Alternatives payantes (Chromatic, Percy, Argos) non nécessaires. | 0 € ; poids des PNG dans le repo (quelques Mo) | aucune |
| **Accessibilité / contraste** | `@axe-core/playwright` ([VÉRIFIÉ source externe https://playwright.dev/docs/accessibility-testing]) sur accueil, setup, chaque jeu, stats, en mode sombre **et** Light ; règle `color-contrast` incluse. Seuil : zéro violation « serious/critical » sur les nouveaux écrans, dette existante listée. Compléter par audit manuel (le doc Playwright rappelle que l'automatique ne suffit pas). | 0 € | **+1 devDependency** (`@axe-core/playwright`, MPL-2.0 [À CONFIRMER licence]) — justifiée : seul moyen standard de mesurer le contraste exigé par le chantier Light |
| **Thèmes** | Projet Playwright paramétré par thème (`colorScheme` / attribut de thème) ; test unitaire des tokens (chaque token défini dans chaque thème, ratio de contraste calculé sur les paires texte/fond déclarées). | 0 € | aucune |
| **Matrice navigateurs/appareils** | CI : Chromium desktop, WebKit iPad portrait/paysage + 1024×600, WebKit iPhone, **+ Chromium Android (Pixel)**, **+ Firefox desktop** (smoke seulement), **+ build legacy** servi à WebKit (smoke). Hebdomadaire : matrice complète. Manuel avant release : vrais appareils (iPad, Android, TV/Chromecast selon décision TV). Services cloud (BrowserStack/Sauce) : programmes open source gratuits possibles [À CONFIRMER conditions] — non recommandés par défaut. | 0 € (minutes GitHub Actions gratuites pour dépôt public [À CONFIRMER quotas]) | aucune |
| **Garde-fous d'architecture et de doc** | Règle ESLint `no-restricted-imports` par couche (aucune dépendance) ; script « doc drift » : chaque `spec:counter/…` cité existe, aucun lien absolu, chaque spec indexée dans `specs/README.md`, aucun statut hors liste. | 0 € | aucune |
| **CI** | Ajouter `lint:type-aware`, `guard:clean`, `wrangler:check`, `governance:coverage` au job `validate` ; E2E sur PR vers `develop` + nightly ; corriger le résumé des planchers ; `PLAYWRIGHT_EXTERNAL_SERVER=1` dans `run-local-smoke` ; `command -v rg || exit 1` ; rapport de tests « flaky » ; réutiliser l'artefact de couverture. | 0 € | aucune |

---

## 6. Bénéfices, contraintes, risques

- **Bénéfices** : onboarding humain/IA en minutes ; plus aucune promesse non tenue ; base de non-régression réutilisable par les chantiers voix, TV, Light, tablette ; specs V2 directement implémentables par un autre agent.
- **Contraintes** : réorganisation documentaire = déplacement de ~30 fichiers et mise à jour des liens (README, CONTRIBUTING, specs, `ChangelogModal`) ; les tests visuels exigent un environnement de rendu figé (Docker) ; corrections F1/F2 relèvent du code (autorisation distincte).
- **Risques** : (1) dérive doc/code si les garde-fous ne sont pas automatisés ; (2) baselines visuelles fragiles (à limiter à ~20 captures) ; (3) temps CI accru (matrice étendue → nightly plutôt que par PR) ; (4) retirer « Double In » de la doc sans l'implémenter peut casser des liens partenaires existants (`in=double`) → décision produit ; (5) déplacer `docs/release/*` casse des liens externes éventuels (prévoir un index).

---

## 7. Plan de mise à jour documentaire (à valider avant toute modification)

### 7.1 Corrections immédiatement réalisables (indépendantes de la V2, doc seule)

| # | Action | Fichiers |
|---|---|---|
| I1 | Retirer/qualifier « l'ouverture » et « open/double/master in » (« configurable mais non appliqué au calcul — voir spec à venir ») ; retirer « historique local » du scope « disponible » ; préciser que la reprise après rechargement concerne X01 | `README.md`, `docs/specifications.md`, `docs/product-scope.md`, `docs/integration/external-match-link.md` (avertissement sur `in=`) |
| I2 | Supprimer « 501 Double Out » comme jeu ; ajouter Killer, Gotcha, Lien de match, Tablette aux zones des formulaires d'issues ; retirer « Historique » | `docs/technical.md`, `docs/specifications.md`, `.github/ISSUE_TEMPLATE/*.yml` |
| I3 | Corriger `v2.0.0.md` (origine badarts.fr déclarée), uniformiser le nombre de tests (746), lever la contradiction E2E de `technical.md` | `docs/release/v2.0.0.md`, `specs/README.md`, `docs/technical.md` |
| I4 | Remplacer « La version active est v2.0.0 » par « Dernière version préparée : v2.0.0 (non publiée) — production : v1.1.4 [à confirmer] » ; bandeaux historiques sur v1.0.x et la matrice React 19 | `docs/release/*.md` |
| I5 | Remplacer les liens absolus `/home/<utilisateur>/...` par des liens relatifs ; dans la constitution, citer le contenu transverse utile plutôt qu'un chemin local | `docs/technical.md`, `.specify/memory/constitution.md` |
| I6 | Corriger l'arbre et les règles de dépendance de `architecture.md` (état réel + écarts connus listés), retirer `CONNECTED_MODE` ou le marquer « futur » | `docs/architecture.md` |
| I7 | Compléter `specs/README.md` (027, 028, statuts réels, retirer la référence fantôme v1.1.3-sonar-debt ou créer une note historique) ; signaler la contradiction spec 028 / portrait | `specs/README.md` |
| I8 | Documenter les prérequis E2E locaux, Docker de dev, support navigateurs | `docs/technical.md` (ou `docs/dev/testing.md` si option B validée) |
| I9 | Remplacer « bot IA » par « adversaire robot » dans la doc | `docs/product-scope.md` |
| I10 | `.env.local.example` : retirer `VITE_ENABLE_BETA_BADGE`, ajouter `DEEPGRAM_PROJECT_ID` (commentée) | `.env.local.example` (fichier de config documentaire, à valider) |
| I11 | Créer `AGENTS.md`, `.github/copilot-instructions.md`, `.github/pull_request_template.md` | nouveaux fichiers |

### 7.2 Mises à jour liées à l'implémentation V2 (à faire *avec* chaque livraison)

- Réorganisation option B (si validée) en un lot unique avant les specs V2, pour que les nouvelles specs pointent vers la structure cible.
- Pages `docs/product/games/*.md` alimentées par la revue des jeux (chantier 5.5) et reliées aux golden tests.
- `docs/user/voice.md` avec le chantier voix (5.1) ; `docs/architecture/adr/` pour chaque décision TV, thème, personnalisation, orientation tablette.
- `docs/product/status.md` mis à jour à chaque promotion `preprod`/`production` (étape de la checklist de release).
- Release note V2, changelog in-app et README mis à jour **uniquement** au moment de la mise en production.
- Mise à jour de la constitution locale (principes non négociables, frontière, cycle de vie des specs) et du backlog workspace (marquer obsolètes les entrées counter).

---

## 8. Propositions de spécifications

| ID provisoire | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances / specs existantes |
|---|---|---|---|---|---|---|---|
| V2-DOC-01 | Corrections documentaires immédiates | Documentation | Lot I1→I10 (§7.1) : supprimer les sur-promesses, contradictions, liens absolus, templates d'issues | Crédibilité, conformité mission §5.8 | S | **P0** | Aucune ; touche specs/README (statut 028) |
| V2-DOC-02 | Organisation documentaire cible et statuts | Documentation | Arborescence option B, `docs/README.md` index, bandeaux de statut, déplacement de l'historique, archives | Distinction implémenté/spécifié/futur/décision/historique | M | P1 | V2-DOC-01 |
| V2-DOC-03 | Onboarding agents IA et contributeurs | Documentation | `AGENTS.md`, `copilot-instructions.md`, template PR, CONTRIBUTING réécrit (branches, commits, SDD, langue) | Productivité, réduction des erreurs d'agents | S | **P0** | V2-DOC-01 |
| V2-DOC-04 | Gouvernance SDD v2 (statuts, templates, ADR) | Documentation / Reco archi | Cycle de vie unique, templates spec/étude/ADR couvrant mission §8, extraction des décisions de `architecture.md` en ADR, normalisation 001-031 (statut réel, sans réécriture du fond), langue unique | Specs implémentables sans réinterprétation | M | P1 | Agent specs ; touche toutes les specs (en-têtes seulement) ; spec 007 (gouvernance) à superseder |
| V2-DOC-05 | Documentation produit et utilisateur | Documentation | `product/games/*.md` (règles implémentées), `user/guide|voice|tablet|faq`, `product/status.md`, `roadmap.md` | Joueurs, bars, clubs ; base des golden tests | M | P2 | Revue des jeux (5.5), voix (5.1) |
| V2-DOC-06 | Changelog unique | Documentation / Reco archi | Source unique des notes (Markdown ou JSON) alimentant `ChangelogModal` et `docs/history/releases` | Supprime la double saisie | S | P3 | V2-DOC-02 |
| V2-QA-01 | Golden tests de règles par jeu | Reco QA | Fixtures déclaratives par jeu et par règle, liées à la doc des règles ; inclut cas Master Out, bogeys centralisés, limites Cricket, Killer, Gotcha, Triathlon | Non-régression du cœur métier | M | **P0** | Revue des jeux (5.5) ; décision F1 |
| V2-QA-02 | Reprise de partie pour tous les jeux | Backlog existant (spec 010) / Reco QA | Rendre vrai l'invariant de la spec 010 pour Cricket, Capital, Killer, Gotcha, Triathlon (+ undo persistant) avec tests unitaires et 1 E2E reload par jeu | Promesse produit tenue | M-L | **P0** | **Enrichir/finaliser spec 010** (corriger `saveSession/loadSession`) ; agent archi |
| V2-QA-03 | Décision et implémentation du Double/Master In | Demande V2 (revue des jeux) | Soit implémenter (nécessite saisie par fléchette ou confirmation d'ouverture), soit retirer l'option de l'UI et du contrat `in=` (versionnement `v=2` ou tolérance) | Cohérence règles / contrat partenaire | M | **P0** (décision) | Spec 030 (contrat), revue des jeux, scoring vocal |
| V2-QA-04 | E2E parcours complets par jeu | Reco QA | Une partie jouée jusqu'à la victoire par jeu (y c. Killer/Gotcha), stats, revanche ; renommer `completion.smoke` ; supprimer redondance `navigation`/`completion` | Couvre les vues exclues (respect réel de spec 029) | M | P1 | V2-QA-01 ; spec 008, 029 |
| V2-QA-05 | Accessibilité, contraste et thèmes automatisés | Reco QA / Reco UX | `@axe-core/playwright`, seuils, projet par thème, test des tokens | Prérequis du mode Light (5.2) | S-M | P1 | Chantier Light, design system |
| V2-QA-06 | Régression visuelle ciblée | Reco QA | `toHaveScreenshot` dans l'image Docker Playwright, ~20 écrans × viewports × thèmes | Protège tablette/TV/personnalisation | M | P2 | V2-QA-05, chantiers 5.2/5.3/5.7 |
| V2-QA-07 | Contrat de snapshot TV et tests de synchronisation | Reco QA / chantier TV | Schéma versionné, golden snapshots par jeu, tests multi-onglets Playwright, compat ascendante | Fiabilité du mode TV | M | P1 (si TV retenu) | Agent TV (transport), V2-QA-01 |
| V2-QA-08 | Voix bout-en-bout simulée | Reco QA / chantier voix | Micro simulé + `routeWebSocket` Deepgram + corpus golden d'énoncés ; nightly | Différenciation majeure sécurisée | M | P1 | Chantier voix 5.1 ; spec 003 |
| V2-QA-09 | Matrice navigateurs/appareils | Reco QA | Ajout Android Chromium, Firefox, build legacy, 1024×600 ; nightly complet ; checklist appareils réels | Tablettes de bar, Android | S-M | P1 | Spec 018, 027, 028 ; chantier tablette |
| V2-QA-10 | Durcissement CI et garde-fous | Reco QA / Reco archi | C1→C11 : checks manquants, E2E sur `develop` + nightly, résumé planchers, double preview, `rg`, flaky report, lint de couches, « doc drift » | Fiabilité, prévention de dérive | S-M | **P0** (C1, C2, C9) / P2 (reste) | Spec 029 (à enrichir : workflow modifié ⇒ note de validation) |
| V2-QA-11 | Couverture réaliste | Reco QA | Extraire la logique des vues exclues (undo Gotcha/Killer, fin de partie) vers des modules testés, réduire la liste d'exclusions, publier la couverture « vues » séparément | Indicateur honnête | M | P2 | Spec 022 (split), 029 ; agent archi |

Specs existantes concernées : **010** (à finaliser/corriger, V2-QA-02), **027/028** (à mettre à jour : portrait phone, éventuel paysage tablette), **029** (enrichir : vues contenant de la logique, workflows), **030** (contrat `in=`, V2-QA-03), **008** (E2E — fusionner avec V2-QA-04/09 ou superseder), **007** (gouvernance de release v1.0.x — superseder par V2-DOC-04), **018** (iOS 12 — vérifier si toujours ciblé, V2-QA-09).

---

## 9. Décisions nécessitant l'arbitrage du product owner

1. **Double/Master In** : implémenter (impact saisie, voix, contrat) ou retirer de l'UI, de la doc et du contrat partenaire (`in=` toléré mais ignoré ? ou `v=2`) ?
2. **Reprise des jeux non-X01** : priorité P0 de la V2 (promesse README) ou correction immédiate de la doc en attendant ?
3. **Organisation documentaire** : option B (réorganisation) ou A (corrections sur place) ? Accord pour déplacer `docs/release/*` et les archives ?
4. **Langue unique** des specs et docs techniques (FR accentué recommandé) ?
5. **Cycle de vie des specs** : adopter celui du workspace (`draft…done/superseded`) et re-statuer 001-031 (en-têtes seulement) ?
6. **Agents IA** : `AGENTS.md` (+ pointeur Copilot) accepté ? Faut-il publier les règles du workspace multi-repo ou les recopier dans le repo ?
7. **Nouvelle devDependency** `@axe-core/playwright` acceptée ? Captures d'écran de référence versionnées dans le repo (poids) acceptées ?
8. **Matrice CI** : extension par PR (plus long) ou nightly (détection différée) ? E2E sur `develop` ?
9. **Changelog in-app** : conserver la saisie manuelle dans `ChangelogModal.tsx` ou source unique ?
10. **README et fonctionnalités V2** : politique « une fonctionnalité n'apparaît dans le README qu'une fois en production » (implique de gérer le README de `main` vs `production`) ?
11. **Spec 028 vs portrait-only** et **spec 027 vs verrouillage paysage tablette** (chantier 5.4) : quelle orientation fait foi ?
12. **Lien WhatsApp public** dans `ISSUE_TEMPLATE/config.yml` et **adresse sécurité `.net`** : à conserver ?

---

## 10. Limites de l'analyse / points non vérifiés

- Aucune exécution de tests, build, couverture ni E2E (contrainte lecture seule) ; comptages E2E et tests statiques. Le rapport de couverture lu est **antérieur** aux derniers commits.
- `test-results/.last-run.json` : origine du run local (utilisateur ou autre agent) inconnue ; interprétation des causes d'échec fondée sur `error-context.md`.
- État réel de la production Cloudflare non vérifié (déduit de `origin/production:package.json` = 1.1.4).
- `.env.local` non lu (exclusion de contenu).
- Contenu détaillé des specs 001-031 non audité (autre agent) ; seules leur place, leurs statuts et quelques contradictions flagrantes sont relevés.
- Règle exacte Master Out (bust à 1) et caractère déterministe du bot à confirmer par l'agent « jeux ».
- Disponibilité de `rg` sur les runners GitHub, quotas Actions, conditions des programmes open source BrowserStack/Sauce, licence d'`@axe-core/playwright`, prise en charge d'`AGENTS.md` par Copilot : **[À CONFIRMER]** (documentation GitHub non joignable pendant l'analyse).
- Le support WebKit du micro simulé (flags Chromium) n'est pas garanti : la voix E2E serait limitée à Chromium [À CONFIRMER].
