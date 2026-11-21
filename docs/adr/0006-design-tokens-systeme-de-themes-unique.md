---
id: ADR-0006
titre: Design tokens et système de thèmes unique (Dark, Light, club, TV)
statut: acceptee
date: 2026-11-20
specs_liees: [063, 064, 065, 066, 068, 069, 093, 098, 018]
---

# ADR-0006 — Design tokens et système de thèmes unique

## Statut
Acceptée le 2026-11-20, à la demande du product owner lors du chantier « refonte tablette et thèmes » (option 4, recommandations des specs 063 à 069). La baseline navigateurs (spec 018) n'est pas encore décidée : le format retenu (hexadécimal et `rgba()` pré-calculés, sans `color-mix()` ni `oklch()`) reste compatible avec toute baseline.

## Contexte
Aucun token sémantique ; environ 1 465 classes de couleur Tailwind codées en dur dans 48 fichiers, 213 transparences blanc/noir, 100 ombres/lueurs supposant un fond sombre, 51 `!important`, `theme-color` incohérent (`index.html:7` vs `manifest.json`).

## Options
1. Classes `dark:` partout.
2. CSS-in-JS.
3. Feuilles de style par thème.
4. **Variables CSS sur trois niveaux (primitives → rôles sémantiques → composants) exposées à Tailwind 4 par `@theme inline`, thème choisi par `data-theme` sur la racine.**

## Décision
Option 4. Les thèmes officiels (Dark, Light) et les thèmes de club ne font que surcharger des rôles sémantiques dérivés ; la TV reçoit le même descripteur JSON (profil d'asset borné). Les couleurs métier (bust, fermé, multiplicateurs, joueur actif) sont réservées et non personnalisables. Une garde CI empêche l'ajout de nouvelles classes de palette brutes.

## Conséquences
Un seul système à maintenir ; migration écran par écran (spec 065), Light activé à 100 % de migration (spec 068). Risque : régression visuelle → captures de référence préalables (spec 041).

## Conséquences réelles (2026-11-20)
- Trois niveaux livrés : primitives `--bd-*` (`src/styles/tokens/primitives.css`), rôles Dark et Light (`src/styles/tokens/themes.css`, thème porté par `<html data-theme>`), pont `@theme inline` (`src/styles/tokens/bridge.css`). Pas de niveau « tokens de composants » séparé : les variantes de boutons sont centralisées dans `components/ui/buttonStyles.ts`. Guide : [design-system.md](../design-system.md).
- Migration : codemod `scripts/design-tokens/migrate.mjs` (1 540 → 203 classes de palette brute), puis migration manuelle de tous les écrans jusqu'à 0 ; garde CI `scripts/design-tokens/check.mjs` dans `npm run guard:clean` (la référence ne peut que baisser). Clôture : référence du cliquet à 0 et palette Tailwind par défaut verrouillée par `--color-*: initial` dans `src/styles/tokens/bridge.css` (spec 065).
- Couleurs métier `game-*` réservées et communes aux six jeux (spec 066) ; Light activé à 100 % de migration (spec 068) ; préférence Auto / Sombre / Clair appliquée avant le premier rendu par un script inline (spec 069).
- Restent : captures de référence (spec 041), thèmes de club (spec 093) et TV (spec 086), non livrés.
