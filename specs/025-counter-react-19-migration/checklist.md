# Checklist operationnelle executable - Spec 025

## Phase 1 - Preparation React 18.3

1. Mettre a jour les dependances:
   - `npm install react@18.3 react-dom@18.3`
2. Executer les controles techniques:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test:unit`
   - `npm run build`
3. Relever et corriger les warnings React 18.3 avant toute suite
4. Rejouer localement les flux sensibles:
   - scoring vocal start/stop
   - navigation pendant ecoute
   - timers de partie
   - restauration de session
   - update service worker

## Phase 2 - Migration React 19

1. Mettre a jour les dependances:
   - `npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19`
2. Executer le codemod types:
   - `npx types-react-codemod@latest preset-19 .`
3. Corriger le code casse par la migration
4. Executer la batterie complete:
   - `npm run ci:check`
   - `npm run test:e2e`
5. Verifier manuellement:
   - `App.tsx` sous `Suspense`
   - points d entree `createRoot`
   - analytics/speed insights
   - PWA et service worker

## Phase 3 - Validation produit

1. Tester les jeux:
   - X01 complet
   - Cricket
   - Capital
   - Killer
   - Gotcha
   - Triathlon
2. Tester les parcours transverses:
   - undo/rematch
   - installation app
   - live update
   - retour depuis un match en cours
3. Tester les plateformes cibles:
   - mobile
   - tablette paysage
   - Safari/iOS legacy ou BrowserStack equivalent
4. Valider en preview Vercel avant merge/release

## Definition of done

- `npm run ci:check` vert
- `npm run test:e2e` vert ou ecarts documentes et acceptes
- aucun warning React bloquant restant
- parcours metier critiques verifies
- validation preview Vercel effectuee