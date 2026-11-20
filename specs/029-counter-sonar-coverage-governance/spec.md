---
id: 029-counter-sonar-coverage-governance
v2_id: V2-QA-11
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Appliquée ; exclusions de vues contenant de la logique."
traitement_propose: "Enrichir (Révision V2)."
decision_traitement: a-valider
issue: '#239'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 029 - Counter Sonar coverage governance

## Status

Active

## Objective

Prevent SonarCloud quality-gate regressions by defining a spec-driven coverage contract before implementation and review.

## Scope

- TypeScript and TSX source introduced or modified by a pull request
- Vitest coverage and LCOV publication
- SonarCloud new-code coverage
- UI, application, domain and infrastructure layers
- Pull requests targeting `main`, `develop`, `preprod` or `release/**`

## Architectural decisions

- Coverage policy is defined in a spec before code changes are merged.
- Coverage exclusions are explicit, narrow and justified by the test strategy.
- Business, application and presentation-model code remains covered by unit tests.
- Pure UI composition is validated by Playwright and may be excluded from line coverage only when the corresponding E2E acceptance checks exist.
- Domain and application behavior must never be excluded from coverage to make a quality gate pass.
- Global Vitest floors and Sonar new-code coverage are independent gates.
- Vitest includes every TypeScript/TSX source in the Sonar source directories,
  even when no test imports it. It reads the existing approved coverage
  exclusions directly from `sonar-project.properties`; there is no separate
  Vitest exclusion list.
- Global Vitest floors are 90% statements, 80% branches, 90% functions and
  90% lines. These are regression floors, not a replacement for the Sonar
  new-code gate.
- A coverage exception is temporary, documented in the spec and linked to a follow-up issue.

## Coverage classification

| Layer | Primary test | Coverage rule |
|---|---|---|
| Domain and application | Vitest unit tests | Must remain included in Sonar coverage |
| Presentation models and pure functions | Vitest unit tests | Must remain included in Sonar coverage |
| UI composition and route wiring | Playwright/component tests | May use narrow `sonar.coverage.exclusions` when E2E acceptance is present |
| Infrastructure adapters | Vitest unit/integration tests | Must remain included unless an explicit exception is approved |
| CSS and static assets | Build and visual/E2E checks | Excluded from executable coverage by nature |

## Invariants

1. Every feature pull request references one active spec.
2. The spec declares the changed layers and their test strategy before implementation.
3. New domain, application, model and adapter code is covered by Vitest tests.
4. UI coverage exclusions list concrete paths and never use a broad catch-all to hide untested behavior.
5. Each excluded UI path has at least one Playwright or component acceptance check.
6. `npm run test:unit:coverage` passes the configured Vitest floors.
7. SonarCloud new-code coverage remains at or above 80%.
8. A temporary exception includes an owner, reason, expiration criterion and follow-up issue.
9. Generated files, build output, coverage output and test artifacts remain excluded from source analysis.

## Pull request acceptance checklist

- [ ] Spec updated with changed files/layers and test strategy.
- [ ] Unit tests added for domain, application, models and adapters.
- [ ] Component or E2E tests added for user-visible UI behavior.
- [ ] Coverage report generated locally with `npm run test:unit:coverage`.
- [ ] Sonar coverage exclusions are narrow, justified and documented.
- [ ] `npm run typecheck`, `npm run test:unit` and `npm run build` pass.
- [ ] CI Quality Gate and SonarCloud checks are green.

## Exception process

A pull request may temporarily fall below the Sonar new-code threshold only when the missing test is blocked by an external dependency or an approved migration. The pull request must document the exception in its feature spec, link a follow-up issue, name an owner and define the condition that removes the exception. Excluding a file solely because it is difficult to test is not an accepted exception.

## Canonical configuration

- `sonar-project.properties`
- `vitest.config.ts`
- `.github/workflows/quality-gate.yml`
- `.github/actions/setup-ci-app/action.yml`

## Approved current exclusions

The following paths are approved because their user-visible behavior is covered
by Playwright or component acceptance tests:

- `App.tsx`
- `components/game-setup/SetupCustomNumberModal.tsx`
- `components/game-setup/SetupRulesModal.tsx`
- `components/game-setup/SetupSummarySection.tsx`
- `components/game/StartingPlayerOverlay.tsx`
- `components/match/MatchSettingsModal.tsx`
- `components/stats/CricketStatsModal.tsx`
- `components/stats/StatsModal.tsx`
- `src/features/smartphone/useVisualViewport.ts`
- `src/features/tablet/useTabletLayout.ts`
- `views/CapitalGameView.tsx`
- `views/CricketGameView.tsx`
- `views/GotchaGameView.tsx`
- `views/KillerGameView.tsx`
- `views/MatchView.tsx`
- `views/SetupView.tsx`
- `views/TriathlonGameView.tsx`

The executable guard `scripts/validate-sonar-coverage.mjs` requires every
configured coverage exclusion to be listed here and rejects exclusions that
target protected business layers.

## Validation

The quality workflow must run unit coverage before SonarCloud analysis. The integration smoke workflow must install every browser declared by `playwright.config.ts`. Any change to either workflow requires a corresponding update to this spec and a CI validation note.

### Coverage expansion validated on 2026-11-03

- Voice: real audio manager, connection manager and streaming hook behavior
  tested against browser audio/Deepgram boundary fakes, including PCM delivery,
  transcripts, errors, timeouts, restart and cleanup.
- Application: browser history/fullscreen navigation, game completion/rematch,
  result persistence, match timer and configurable shortcut validation.
- Domain/infrastructure: Triathlon event scoring, bonuses, ties and phase
  transitions; JSON storage failures; IndexedDB session/history round trips.
- UI: score entry and callbacks, disabled controls, Cricket scoreboard, setup
  players, installation, home/navigation and statistics/recap views.
- Full source-scope baseline: 217 tests, 62.58% lines (1940/3100),
  62.64% statements, 57.91% branches and 64.15% functions.
- After expansion: 398 tests in 67 files, 95.29% lines (2954/3100),
  94.10% statements, 85.71% branches and 96.33% functions.
- Validation: full unit coverage, lint, typecheck, coverage governance and
  production build passed. No source was newly excluded and no threshold was
  lowered. SonarCloud new-code results still require a server analysis.

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 (V2-QA-11) ; aucune exigence ci-dessous n'est validée. Le contenu historique ci-dessus est conservé tel quel ; la liste « Approved current exclusions » reste la seule source d'approbation.
>
> Convention de rédaction de cette section : les chemins exclus de la couverture n'y sont **jamais** écrits seuls entre accents graves, parce que `scripts/validate-sonar-coverage.mjs:25` considère comme approuvée toute exclusion citée ainsi n'importe où dans ce fichier (voir V2-FR-02). Ils sont écrits en texte simple ou suivis d'un numéro de ligne.

### Constats vérifiés (code, commit 508dfa6)

- 17 exclusions de couverture (`sonar-project.properties:9`), reprises telles quelles par Vitest (`vitest.config.ts:5-11, 27`). Les huit plus volumineuses totalisent environ 3 400 lignes : views/MatchView.tsx (869), App.tsx (479), views/SetupView.tsx (430), views/CricketGameView.tsx (364), views/TriathlonGameView.tsx (354), views/CapitalGameView.tsx (335), views/GotchaGameView.tsx (300), views/KillerGameView.tsx (274).
- Ces fichiers ne sont pas de la « composition pure » : état de partie et historique d'annulation de Gotcha dans la vue (`views/GotchaGameView.tsx:69-72`, historique de 30 états `:117`), idem Killer (`views/KillerGameView.tsx:31-34`) ; fin de partie Cricket (`views/CricketGameView.tsx:95-104`) ; validation du « reste » X01 réimplémentée dans la vue (`views/MatchView.tsx:388`) ; montage et restauration des jeux (`App.tsx:354-420`). C'est contraire à la décision « Domain and application behavior must never be excluded from coverage » de cette spec.
- L'invariant 5 (« chaque chemin exclu a au moins un contrôle d'acceptation Playwright ou composant ») n'est satisfait que nominalement : les E2E ouvrent les jeux (`tests/e2e/gameplay-entry.smoke.spec.ts`, `tests/e2e/tablet-layout.smoke.spec.ts`) sans les jouer ; aucune vue de jeu n'est rendue par un test de composant.
- `scripts/validate-sonar-coverage.mjs:25` accepte une exclusion dès que son chemin apparaît entre accents graves **n'importe où** dans ce fichier, pas seulement dans la liste approuvée ; le script n'a aucun test (`grep validate-sonar-coverage tests` vide).
- Préfixes protégés : `src/domain/`, `src/application/`, `utils/`, `lib/`, `functions/` (`scripts/validate-sonar-coverage.mjs:5`). `src/infrastructure/`, `src/shared/`, `src/presentation/` et `src/app/` ne sont pas protégés, alors que la classification de cette spec impose que les adaptateurs d'infrastructure restent couverts.
- Le résumé CI « Global Quality Baseline » affiche des planchers 75/60/75 (`.github/workflows/quality-gate.yml:115`) au lieu des 90/80/90/90 de cette spec (correction portée par V2-QA-10, spec 043).
- Le rapport local `coverage/coverage-summary.json` (19/11) est antérieur aux commits `d76dfd0` et `1e8becd` ; ses 95,8 % de lignes ne mesurent que le code non exclu.
- Tâches ouvertes : « Add CI reporting for changed-file coverage strategy » et « Review and reduce existing UI coverage exclusions incrementally » (`specs/029-…/tasks.md`).

### Écarts avec la spec

| Exigence historique | Constat |
|---|---|
| Décision « Domain and application behavior must never be excluded » | Logique d'état, d'annulation et de fin de partie exclue avec les vues |
| Invariant 5 (acceptation E2E par chemin exclu) | Acceptation limitée à l'ouverture des jeux |
| Invariant 8 (exception temporaire avec propriétaire, raison, critère de sortie, issue) | Les 17 exclusions n'ont ni critère de sortie ni issue de suivi |
| Section « Validation » (note de validation à chaque changement de workflow) | Aucune note depuis le 2026-11-03 |

### Exigences proposées

- V2-FR-01 Plan de retrait des exclusions de vues, aligné sur l'extraction des moteurs (V2-ARCH-04, spec 058) dans l'ordre Gotcha → Killer → Capital → Cricket → X01 → Triathlon, puis views/SetupView.tsx et App.tsx selon V2-ARCH-11 (061) et V2-GAMES-06 (049). Une exclusion est retirée dans la PR qui extrait la logique correspondante.
- V2-FR-02 Le garde-fou ne reconnaît comme approuvées que les exclusions listées dans la section « Approved current exclusions » (analyse de la section, pas du fichier entier) ; le script reçoit des tests unitaires.
- V2-FR-03 Chaque exclusion restante porte, dans un tableau : raison, preuve d'acceptation (fichier de test E2E ou composant), spec de retrait, critère de sortie (invariant 8).
- V2-FR-04 Préfixes protégés étendus à `src/infrastructure/`, `src/shared/`, `src/presentation/` et `src/app/` ; `src/features/` après décision Q1.
- V2-FR-05 Publication informative, en CI, d'une couverture « toutes sources » (sans exclusions) à côté de la couverture contractuelle, pour suivre la réduction.
- V2-FR-06 Aucune nouvelle exclusion de vue de jeu n'est acceptée ; un nouvel écran est couvert par des tests de composant ou composé de modules couverts.
- V2-FR-07 Rapport de stratégie par fichier modifié (tâche historique ouverte) : le résumé de PR liste les fichiers modifiés qui sont exclus de la couverture et la preuve associée.
- V2-FR-08 Les specs 041, 042, 043 et 044, qui modifient des workflows, ajoutent chacune une note datée dans la section « Validation ».
- V2-NFR-01 Planchers Vitest inchangés (90/80/90/90) ; aucun seuil abaissé pour retirer une exclusion.
- V2-NFR-02 Coût : 0 € ; aucune nouvelle dépendance.

### Critères d'acceptation proposés

- V2-AC-01 Après l'extraction du moteur Gotcha (058), views/GotchaGameView.tsx n'est plus exclu et `npm run test:unit:coverage` respecte les planchers.
- V2-AC-02 Un test du garde-fou prouve qu'une exclusion citée hors de la section approuvée est rejetée par `npm run governance:coverage`.
- V2-AC-03 Une exclusion sous `src/infrastructure/` est rejetée par `npm run governance:coverage`.
- V2-AC-04 Le résumé CI affiche la couverture contractuelle et la couverture « toutes sources » (informative).
- V2-AC-05 Chaque exclusion restante figure dans le tableau de V2-FR-03 avec une preuve existante (fichier de test présent dans le dépôt).
- V2-AC-06 Cible proposée : au plus 10 exclusions à la fin du lot 2, au plus 8 (composition, modales, hooks navigateur) à la fin de la migration 058 [à valider].

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Protéger `src/features/` ? | Oui maintenant / après déplacement des hooks navigateur exclus / non | Après déplacement des deux hooks exclus (taille d'écran, viewport) vers une couche UI dédiée | — |
| Q2 | Couverture « toutes sources » : informative ou plancher ? | Informative / plancher progressif | Informative au lot 1, plancher de 60 % de lignes à la fin du lot 2 | — |
| Q3 | Cibles de V2-AC-06 | Telles quelles / autres | Telles quelles, revues à chaque jeu migré | — |
| Q4 | Rédiger la mise à jour de la liste approuvée en français ? | Français / anglais (langue historique) | Garder l'anglais de la liste existante (pas de traduction des specs historiques, conventions §7) ; nouvelles sections en français | — |

### Dépendances

- V2-ARCH-04 (058) : condition de retrait des exclusions de vues de jeu.
- V2-QA-01 (039) et V2-QA-04 (040) : preuves de comportement avant et après retrait.
- V2-ARCH-11 (061), V2-GAMES-06 (049) : réduction de views/MatchView.tsx et de la composition.
- V2-QA-10 (043) : correction du résumé de couverture et calcul unique.
- Sources : `docs/v2/audit/10-docs-quality.md` (§3.1, §3.2, V2-QA-11), `docs/v2/audit/02-architecture.md` (D9, T9), `docs/v2/compte-rendu-audit-2026-11-20.md` (§B.2, §F.1).
