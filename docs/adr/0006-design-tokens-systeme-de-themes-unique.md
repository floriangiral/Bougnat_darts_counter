---
id: ADR-0006
titre: Design tokens et système de thèmes unique (Dark, Light, club, TV)
statut: proposee
date: 2026-11-20
specs_liees: [063, 064, 065, 066, 068, 069, 093, 098, 018]
---

# ADR-0006 — Design tokens et système de thèmes unique

## Statut
Proposée. Dépend de la décision de baseline navigateurs (spec 018).

## Contexte
Aucun token sémantique ; environ 1 465 classes de couleur Tailwind codées en dur dans 48 fichiers, 213 transparences blanc/noir, 100 ombres/lueurs supposant un fond sombre, 51 `!important`, `theme-color` incohérent (`index.html:7` vs `manifest.json`).

## Options
1. Classes `dark:` partout.
2. CSS-in-JS.
3. Feuilles de style par thème.
4. **Variables CSS sur trois niveaux (primitives → rôles sémantiques → composants) exposées à Tailwind 4 par `@theme inline`, thème choisi par `data-theme` sur la racine.**

## Décision proposée
Option 4. Les thèmes officiels (Dark, Light) et les thèmes de club ne font que surcharger des rôles sémantiques dérivés ; la TV reçoit le même descripteur JSON (profil d'asset borné). Les couleurs métier (bust, fermé, multiplicateurs, joueur actif) sont réservées et non personnalisables. Une garde CI empêche l'ajout de nouvelles classes de palette brutes.

## Conséquences
Un seul système à maintenir ; migration écran par écran (spec 065), Light activé à 100 % de migration (spec 068). Risque : régression visuelle → captures de référence préalables (spec 041).
