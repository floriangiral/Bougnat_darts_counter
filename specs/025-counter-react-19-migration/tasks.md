# Tasks - Spec 025

## Phase 1 - Preparation React 18.3

- [x] mettre a jour `react` et `react-dom` en `18.3.x`
- [x] executer `npm run typecheck`
- [x] executer `npm run lint`
- [x] executer `npm run test:unit`
- [x] executer `npm run build`
- [x] verifier qu aucun warning de transition React 18.3 n apparait dans la validation technique automatisee
- [ ] stabiliser les effets sensibles (audio, micro, websocket, timers, service worker)

## Phase 2 - Migration React 19

- [x] mettre a jour `react`, `react-dom`, `@types/react` et `@types/react-dom`
- [x] lancer `npx types-react-codemod@latest preset-19 .`
- [x] verifier qu aucune incompatibilite TypeScript ou JSX bloquante n est remontee
- [x] executer `npm run ci:check`
- [ ] valider les surfaces `Suspense`, `lazy`, analytics et PWA

## Phase 3 - Validation produit

- [x] tester les parcours smoke X01, Cricket, Capital, Gotcha, Killer et Triathlon via Playwright
- [ ] tester undo, rematch et retour setup si applicables
- [ ] tester le scoring vocal Deepgram (start, stop, navigation, timeout)
- [ ] tester installation PWA et cycle de mise a jour
- [ ] tester Safari/iOS legacy ou equivalent
- [ ] valider preview connectee avant promotion
