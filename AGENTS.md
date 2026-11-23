# AGENTS.md — Guide pour les agents IA et les nouveaux contributeurs

Ce fichier est la porte d'entrée pour tout agent IA (Copilot, Claude, Codex…) ou développeur qui intervient sur Bougnat Darts. Il résume l'état **réel** du projet ; en cas de doute, le code fait foi, puis les specs, puis la documentation.

## 1. Le produit en bref

- Compteur de fléchettes web (PWA) gratuit, sans publicité, **sans compte obligatoire**, open source (MIT), en français.
- Jeux : X01 (301/501/701/personnalisé jusqu'à 2501, legs/sets, sorties Open/Double/Master, limite de volées par manche optionnelle avec départage au bull, simple ou 2v2, adversaire robot), Cricket, Capital, Triathlon, Killer, Gotcha.
- Voix optionnelle en X01 (Deepgram via un token éphémère servi par une Cloudflare Pages Function).
- Lien de match partenaire `v=1` (spec 030) : un partenaire ouvre un match X01 verrouillé et récupère le résultat par navigation.
- Présentation téléphone, tablette (portrait de référence avec « arène portrait », paysage supporté en arène) et bureau ; thème Auto / Sombre / Clair. L'orientation n'est jamais imposée ni verrouillée (WCAG 1.3.4) : seule une invite non bloquante propose au téléphone en paysage de revenir en portrait (spec 028) ; aucune incitation au paysage sur tablette (spec 073 rejetée).
- Parcours de base à préserver absolument : **ouvrir → choisir un jeu → saisir les prénoms → jouer**. En X01, la « partie rapide » (501, 3 manches, Open / Double) le réduit à deux prénoms puis « Lancer la partie ».
- Version en cours : `2.1.0` (branche `release/v2.1.0`, non publiée), première version 2 publiée ; la `2.0.0` n'a jamais été promue et la production est en `1.1.4`. Notes : [docs/release/v2.1.0.md](docs/release/v2.1.0.md).
- Frontière : pas de backend métier, pas de comptes, pas de stats cloud ; la logique tournoi appartient au dépôt `Bougnat_Darts_Tournaments`.

## 2. Stack et commandes

- React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Vitest 5, Playwright 1.65, Node 26 (`.nvmrc`), npm 12.
- Déploiement Cloudflare Pages (`wrangler.jsonc`), fonctions dans `functions/`.

```bash
npm run dev                 # serveur de dev (génère aussi le QR d'accueil)
npm run typecheck
npm run lint && npm run lint:type-aware
npm run test:unit           # Vitest
npm run test:unit:coverage && npm run governance:coverage
npm run guard:clean && npm run wrangler:check
npm run build
npm run test:e2e            # Playwright (Chromium + WebKit)
```

## 3. Architecture réelle (au 2026-11-23)

- **Racine legacy** : `App.tsx` (shell, écrans, persistance), `views/` (un écran par jeu ; X01 = `MatchView.tsx`), `components/`, `utils/` (moteurs Cricket, Capital, Triathlon), `types.ts`, `constants.ts`.
- **`src/` en couches** : `domain/` (Killer, Gotcha, robot X01, Triathlon, modèle X01), `application/` (`scoring/matchLifecycle.ts`, `matchStats.ts`), `features/` (x01/voice, x01/scoring, layout, theming, smartphone, external-match, game-setup…), `infrastructure/local` (IndexedDB, préférence de thème), `infrastructure/web` (document, service worker), `presentation/`, `shared/`, `app/`, `styles/` (`tokens/`, `layout/`, `games/`).
- **Présentation adaptative** (ADR 0007) : un seul résolveur `src/features/layout/viewportClass.ts` (classes de taille, orientation, modalité, recette `stack` / `stack-wide` / `arena` / `phone-landscape`) lu par `App.tsx`, qui pose les attributs `data-recipe`, `data-input`, `data-density`… ; les vues lisent `useViewport()`, jamais `matchMedia`. Tous les écrans de jeu passent par `components/layout/GameScreenLayout.tsx` (zones `header` / `band` / `players` / `input`) ; en tablette tactile, le portrait (recettes `stack`) est la présentation de référence (« arène portrait » : joueurs en haut, grand pavé en bas) et le paysage reçoit l'arène (`arena`) ; le bureau garde son rendu.
- **Préparation X01** : `views/SetupView.tsx` ouvre la partie rapide (`components/game-setup/SetupQuickX01Section.tsx`) ; « Personnaliser la partie » affiche l'écran complet, « ← Partie rapide » rétablit le standard (`apply_x01_quick_defaults` dans `src/features/game-setup/setupModel.ts`). Un lien partenaire ouvre toujours l'écran complet verrouillé.
- **Thèmes** (ADR 0006) : tokens dans `src/styles/tokens/` (primitives `--bd-*` → rôles par thème → pont Tailwind) ; thème Auto / Sombre / Clair porté par `<html data-theme>` ; guide dans [docs/design-system.md](docs/design-system.md).
- Pièges connus :
  - la logique X01 exécutée est dans `src/application/scoring/matchLifecycle.ts` (+ `x01Rotation.ts` pour l'ordre de passage WDF, limite de volées et départage au bull : `isLegVisitLimitReached` / `resolveLegByBullOff`), `src/domain/scoring/x01CheckoutRules.ts` / `x01OpeningRules.ts` / `reachableTotals.ts`, `src/features/x01/scoring/matchSubmission.ts` et `views/MatchView.tsx` ; les use cases historiques de `src/domain/scoring` (`RecordThrow`…) ne servent qu'aux tests ;
  - chaque jeu publie un instantané sérialisable (`onStateChange` / `restoredState`) ; la session est versionnée et validée (`src/app/sessionRecovery.ts`, `src/features/game-session/*`) : toute évolution d'état de jeu doit mettre à jour son validateur ;
  - les vues et composants n'importent pas `src/domain` directement : passer par une façade `src/features/*` ;
  - couleurs : uniquement des rôles sémantiques (`bg-surface`, `text-fg`, `border-border`, `game-*`…) ; aucune classe de palette brute (`bg-gray-800`, `text-orange-500`, `[#…]`) — `npm run guard:clean` échoue si leur nombre dépasse `scripts/design-tokens/baseline.json` ; un nouveau rôle se déclare dans les deux thèmes ; les couleurs métier `game-*` sont réservées et les tests lisent `data-tone` / `data-multiplier` / `data-state`, jamais une classe de couleur ;
  - `data-layout` (`smartphone` / `tablet` / `default`) est un attribut dérivé conservé pour la CSS existante : les nouvelles règles s'appuient sur `data-recipe` et `data-input` ;
  - la règle de dépendance de `docs/architecture.md` n'est pas outillée et a des violations connues.
- Décisions d'architecture : [docs/adr/](docs/adr/README.md) (0006 tokens et thèmes, 0007 classes de taille et orientation : acceptées ; les autres : proposées).

## 4. Spec-Driven Development

- Conventions : [.specify/conventions.md](.specify/conventions.md) ; gabarits dans `.specify/templates/`.
- Index et statut des specs : [specs/README.md](specs/README.md). Feuille de route : [docs/roadmap-v2.md](docs/roadmap-v2.md).
- **N'implémente qu'une spec au statut `validee`.** Une spec `a-valider` est une proposition : ses « Questions ouvertes » doivent être tranchées par le product owner avant tout code.
- Chaque spec a une issue GitHub `[V2-XXX-NN]` (labels famille, priorité, difficulté, recommandation, lot ; projet « Bougnat Darts V2 »).
- En fin d'implémentation : passer la spec à `implementee`, renseigner `verifie_au_commit`, mettre à jour la documentation concernée, fermer l'issue.

## 5. Règles de contribution

- Règles de jeu indépendantes de React, de la voix, des thèmes, de la TV et des partenaires ; une seule source de règles par jeu.
- Pas de nouvelle dépendance runtime, abstraction ou backend sans justification écrite dans la spec (et ADR si structurant).
- Couverture : planchers 90 % instructions/fonctions/lignes et 80 % branches ; exclusions Sonar uniquement pour de la composition UI, listées dans la spec 029 (`scripts/validate-sonar-coverage.mjs` le vérifie).
- Textes UI et documentation en **français accentué**.
- Pas de `crypto.randomUUID` hors contexte sécurisé (voir `src/shared/ids`).
- Ne jamais présenter dans la doc une fonctionnalité non livrée comme disponible.
- Commits au format Conventional Commits (`feat(scope): …`, `fix(…)`, `docs(…)`), avec un scope.
- Ne jamais committer de secret (`.env.local` est local ; `DEEPGRAM_API_KEY` reste côté serveur).

## 6. Où trouver quoi

| Besoin | Document |
|---|---|
| Installation, CI, déploiement | [docs/technical.md](docs/technical.md) |
| Architecture et décisions | [docs/architecture.md](docs/architecture.md), [docs/adr/](docs/adr/README.md) |
| Tokens, thèmes, couleurs métier, composants de base | [docs/design-system.md](docs/design-system.md) |
| Mise en page des écrans de jeu (zones, recettes) | `components/layout/GameScreenLayout.tsx`, `src/styles/layout/game-screen.css`, specs [070](specs/070-counter-size-class-resolver/spec.md) et [072](specs/072-counter-arena-layout/spec.md) |
| Périmètre produit | [docs/product-scope.md](docs/product-scope.md) |
| Intégration partenaire | [docs/integration/external-match-link.md](docs/integration/external-match-link.md) |
| Audit V2 du 2026-11-20 | [docs/v2/](docs/v2/README.md) |
| Contribution | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Sécurité | [SECURITY.md](SECURITY.md) |
