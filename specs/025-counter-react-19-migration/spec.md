---
id: 025-counter-react-19-migration
v2_id: null
type: fonctionnel
statut: cloturee
validation: en-attente
statut_reel: "Clôturée le 2026-11-23 : React 19 en place ; validations manuelles transférées à V2-REL-01 (gate 2.1.0), V2-DS-00 et V2-QA-09."
traitement_propose: "Clôturer après validations (V2-REL-01)."
decision_traitement: validee
issue: null
transfere_a: [V2-REL-01, V2-DS-00, V2-QA-09]
verifie_au_commit: 863b4bd
derniere_revue: 2026-11-23
---
# Spec 025 - counter react 19 migration

## Meta

- ID: `025-counter-react-19-migration`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Faire migrer `Bougnat_darts_counter` de React 18.2 vers une cible React 19 de maniere progressive, spec-driven et compatible avec la clean architecture existante.

## Decisions

- la migration se fait en 3 phases distinctes: preparation en React 18.3, migration framework vers React 19, validation produit/runtime
- la phase 1 sert a absorber les warnings de transition React sans ouvrir un chantier fonctionnel annexe
- les adaptations de code restent limitees aux frontieres framework, types JSX et effets runtime sensibles
- les couches domain, application et infrastructure ne doivent pas etre refactorees sans besoin directement prouve par la migration React
- toute correction d effet non idempotent doit rester locale au composant, hook ou adapter qui controle reellement le lifecycle concerne
- la migration doit etre compatible avec le build GitHub puis le deploiement connecte deja en place

## Invariants critiques

- aucune regression fonctionnelle sur les parcours de jeux X01, Cricket, Capital, Killer, Gotcha et Triathlon
- aucune regression sur le scoring vocal, les websockets Deepgram, les timers, le PWA/service worker et la restauration de session
- aucune dependance React ne doit contourner les ports et adapters existants juste pour satisfaire la migration
- les tests existants restent verts avant et apres chaque phase
- la compatibilite legacy iOS/Safari reste un critere explicite de validation finale

## Impacted Code

- `package.json`
- `tsconfig.json`
- `index.tsx`
- `App.tsx`
- `src/app/**`
- `src/infrastructure/audio/**`
- `src/infrastructure/voice/**`
- `src/lib/**`
- `tests/**`

## Canonical Entry Points

- `index.tsx`
- `App.tsx`
- `src/hooks/useDeepgramStreaming.ts`
- `npm run ci:check`

## Key Tests

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`

## Validation

- React 18.3 ne remonte plus de warning de transition bloquant
- React 19 compile avec `@types/react@19` et `@types/react-dom@19`
- les hooks sensibles au lifecycle restent idempotents en dev sous `StrictMode`
- les parcours critiques sont verifies manuellement avant merge

## Clôture (2026-11-23)

Vérifiée au commit `863b4bd` (`origin/develop`) ; décision du product owner du 2026-11-23 (spec 032, Q4, #215).

Critères vérifiés :

- React 19 compilé : `react` et `react-dom` 19.3.1, `@types/react` ^19.3.0 (`package.json`) ; `npm run typecheck`, `npm run lint`, `npm run test:unit` et `npm run build` exécutés par la CI (`.github/workflows/quality-gate.yml`).
- Parcours des six jeux couverts par les smoke tests Playwright (`tests/e2e/`), exécutés par `.github/workflows/e2e.yml`.

Écart documentaire : la spec cite des chemins qui n'existent pas (`src/hooks/useDeepgramStreaming.ts`, `src/infrastructure/audio/**`, `src/infrastructure/voice/**`) ; le hook vocal est `src/features/x01/voice/useDeepgramStreaming.ts`.

Reliquats transférés (tâches non cochées de `tasks.md` et lignes `pending` de `docs/release/react-19-validation-matrix.md`) :

- parcours manuels (annuler, revanche, voix, PWA et mise à jour, aperçu connecté) → V2-REL-01 ([spec 033](../033-counter-release-v2-0-0-publication/spec.md)), item (i) « Validations manuelles 025 » de la gate 2.1.0 de [docs/release/checklist.md](../../docs/release/checklist.md) ;
- Safari/iOS ancien → V2-DS-00 ([spec 018](../018-counter-ios12-compatibility/spec.md), décision de navigateurs supportés) ;
- appareils réels → V2-QA-09 ([spec 042](../042-counter-qa-real-device-matrix/spec.md)).

`validation` reste `en-attente` et n'est plus suivie ici.
