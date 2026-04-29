# Serie de commits proposee - Spec 025

## Phase 1 - Preparation React 18.3

1. `chore(frontend): upgrade react runtime to 18.3`
   - bump `react` et `react-dom` vers `18.3.x`
   - conserver les types actuels si aucun warning type ne l exige encore

2. `fix(runtime): stabilize strict mode side effects before react 19`
   - corriger les hooks a cleanup fragile
   - fiabiliser audio, micro, websocket, timers ou service worker si necessaire

3. `test(frontend): lock react 18.3 migration baseline`
   - ajuster ou completer les tests couvrant les regressions detectees

## Phase 2 - Migration React 19

1. `chore(frontend): upgrade to react 19 and types`
   - bump `react`, `react-dom`, `@types/react`, `@types/react-dom`

2. `refactor(types): apply react 19 codemods and jsx fixes`
   - appliquer `types-react-codemod`
   - corriger refs, JSX et signatures de composants

3. `fix(frontend): adapt lazy suspense and integration surfaces for react 19`
   - corriger les regressions constatees sur `Suspense`, analytics, PWA ou bootstrap si necessaire

## Phase 3 - Validation produit

1. `test(e2e): cover critical game flows on react 19`
   - renforcer les scenarios Playwright sur les parcours critiques si la couverture manque

2. `docs(release): document react 19 validation matrix and rollout decision`
   - consigner les verifications manuelles, legacy et preview Vercel

## Regle de packaging

- ne pas melanger bump de dependances et fixes runtime complexes dans un meme commit si un diff plus petit reste reviewable
- preferer un commit par cause technique observable
- garder la validation finale produit dans un commit ou document separe des changements framework