# Plan - Spec 025

## Phase 1 - Preparation React 18.3

1. Mettre a jour `react` et `react-dom` vers `18.3.x`
2. Rejouer `typecheck`, `lint`, `test:unit` et `build`
3. Corriger les warnings de transition remontes par React 18.3
4. Auditer et stabiliser les hooks/effets sensibles: audio, micro, websocket, timers, service worker, restauration

## Phase 2 - Migration framework React 19

1. Mettre a jour `react`, `react-dom`, `@types/react` et `@types/react-dom` vers la cible React 19
2. Lancer `npx types-react-codemod@latest preset-19 .`
3. Corriger les impacts de typage JSX, refs et signatures de composants
4. Rejouer la verification technique complete `ci:check`
5. Verifier les integrations frontend critiques: Suspense/lazy, analytics, speed insights, PWA

## Phase 3 - Validation produit et runtime

1. Rejouer les parcours metier majeurs par mode de jeu
2. Tester le scoring vocal et les transitions d ecran pendant ecoute
3. Verifier PWA, update lifecycle, session restore et navigation tactile/tablette
4. Rejouer les validations legacy iOS/Safari ou equivalent BrowserStack
5. Ouvrir la promotion release seulement apres validation preview Vercel