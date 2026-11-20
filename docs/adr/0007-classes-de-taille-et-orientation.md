---
id: ADR-0007
titre: Mise en page par classes de taille et orientation
statut: acceptee
date: 2026-11-20
specs_liees: [070, 071, 072, 073, 027, 028]
---

# ADR-0007 — Classes de taille et orientation

## Statut
Acceptée le 2026-11-20, à la demande du product owner lors du chantier « refonte tablette et thèmes » (recommandations des specs 070 à 072 et des révisions de 027 et 028). La partie orientation tablette (spec 073) a été rejetée par le PO le même jour.

## Contexte
Deux détections concurrentes (`src/features/tablet/tabletLayout.ts:22-56` et `views/MatchView.tsx:246-266`) ; un iPad 10,2" Safari paysage (1080×750) et une Galaxy Tab 1280×800 reçoivent la mise en page téléphone ; cascade CSS qui écrase le keypad (`src/styles/tailwind.css:198` vs `:535`).

## Décision
Un résolveur unique fondé sur la **classe de taille (largeur 600/840/1200, hauteur 480/900) et l'orientation**, sans user-agent ni type d'appareil ; le pointeur tactile ne change que la taille minimale des cibles (48 px). Quatre recettes de mise en page (`stack`, `stack-wide`, `arena`, `phone-landscape`) consommées par un composant à zones commun à tous les jeux.

Orientation (décision du product owner, 2026-11-20) : l'orientation n'est jamais imposée (WCAG 1.3.4) et **aucun verrou d'orientation** n'est demandé. Sur tablette, le **portrait est la présentation de référence** (« arène portrait », spec 072) ; le paysage reste supporté (recette `arena`) **sans invite ni verrou** — la proposition initiale (verrou paysage Android en plein écran, invite « Tournez la tablette ») est rejetée avec la spec 073 : « Je ne veux pas utiliser mes tablettes en mode paysage, alors pourquoi inciter les utilisateurs à le faire ? ». Sur téléphone, seule une invite non bloquante à revenir en portrait subsiste sur les écrans de jeu (spec 028, option B).

## Conséquences réelles (2026-11-20)
- Résolveur pur `src/features/layout/viewportClass.ts` et hook unique `useViewportClass` lu par `App.tsx`, qui pose `data-size-w`, `data-size-h`, `data-orientation`, `data-input`, `data-density`, `data-recipe` et un `data-layout` dérivé (conservé tant que la CSS le lit). `src/features/tablet/` et la détection locale de `MatchView` sont supprimés ; `dedicated_tablet` ne force que la modalité tactile.
- Composant à zones `components/layout/GameScreenLayout.tsx` utilisé par les six écrans de jeu ; placement par recette dans `src/styles/layout/game-screen.css` et `src/styles/games/*.css`. L'arène ne s'applique qu'en tactile (`data-input="touch"`) : le bureau garde son rendu tant que l'arène n'est pas validée sur PC (spec 070, Q2) ; d'ici là, la modalité conditionne aussi la structure, écart temporaire au principe ci-dessus.
- Tablette portrait : recettes `stack` / `stack-wide` tactiles en présentation tablette (`[data-layout='tablet'][data-input='touch']:not([data-recipe='arena'])`), joueurs en haut et grande zone de saisie en bas (environ 46 % de la hauteur).
- Orientation : décision pure `src/features/layout/orientationHint.ts` limitée au téléphone en paysage, hook `src/app/useGameOrientation.ts` sans verrou, invite `components/ui/OrientationHint.tsx` mémorisée par partie ; écran bloquant, verrou portrait téléphone, port et adaptateur d'orientation supprimés (aucun appel à `screen.orientation.lock()`).
- Restent : exécution des E2E sur les profils réalistes de `playwright.config.ts` dans la CI, captures de référence (spec 041) et recette sur appareils (iPad, tablette Android, téléphones).
