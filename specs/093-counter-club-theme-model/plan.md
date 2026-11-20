# Plan — 093 Modèle de thème club

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `src/styles/tailwind.css` : aucun token de couleur (à créer par 063).
- `utils/appPersistence.ts:1-3` : clés `localStorage` existantes (préfixe `bougnat-`).
- `src/infrastructure/local/IndexedDBSessionRepository.ts:10-14` : base `bougnat-counter-local` v1.
- `src/features/external-match/externalMatchLink.ts:23-35,49,65,148` : modèle de contrat versionné et de validation.
- `index.html:7,21-28` : `theme-color` et style inline du `body`.

## 2. Approche retenue (et alternatives écartées)
Module pur `src/features/theming` + adaptateurs DOM et stockage. Écartées : CSS libre importé (injection) ; bibliothèque colorimétrique (`culori`, `chroma-js`) non justifiée ; thème parallèle aux tokens (double maintenance).

## 3. Étapes
1. Aligner les noms de tokens avec 063 et 066 (liste des tokens surchargeables).
2. Écrire `colorMath.ts` (sRGB ↔ OKLab/OKLCH, luminance relative, contraste, ΔE, clamp gamut).
3. Écrire `themeDescriptor.ts` (types, validation liste blanche, nettoyage des textes).
4. Écrire `deriveThemeTokens.ts` et `presets.ts`.
5. Écrire `src/infrastructure/web/themeDom.ts` (variables sur `<html>`, `theme-color`).
6. Écrire `src/infrastructure/local/themeStorage.ts` (`bougnat-theme-v1`, IndexedDB dédiée).
7. Brancher le thème actif au démarrage, en coordination avec l'anti-flash de 069.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/theming/colorMath.ts` | Nouveau (pur) |
| `src/features/theming/themeDescriptor.ts` | Nouveau (pur) |
| `src/features/theming/deriveThemeTokens.ts` | Nouveau (pur) |
| `src/features/theming/presets.ts` | Nouveau (pur) |
| `src/infrastructure/web/themeDom.ts` | Nouveau |
| `src/infrastructure/local/themeStorage.ts` | Nouveau |
| `index.tsx` / `index.html` | Application du thème actif (avec 069) |
| `tests/unit/theming/*.test.ts` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI : aucune modification visible sans thème club. Domaine de jeu : aucun. Infrastructure : deux adaptateurs.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Nouvelles clés uniquement ; aucune migration des sessions. Schéma versionné : un futur schéma 2 devra fournir une migration 1 → 2 pure et testée.

## 7. Stratégie de test
Unitaires exhaustifs (matrice de contraste, propriétés aléatoires), composant (variables posées), E2E (persistance, repli). Couverture du module pur ≥ 90 % (spec 029).

## 8. Non-régression
Captures de référence du Dark officiel (V2-QA-05, 041) identiques sans thème club.

## 9. Rollback / désactivation (feature flag le cas échéant)
Drapeau `VITE_FEATURE_CLUB_THEME` [nom à confirmer] ; désactivé : la clé est ignorée et le thème officiel s'applique. Suppression de `bougnat-theme-v1` sans effet sur les parties.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture/` (modèle de thème, règles de garde-fous) ; ADR « thème = tokens dérivés » ; guide utilisateur thèmes (037) au moment de la livraison.
