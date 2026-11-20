# Plan — 069 Préférence de thème (système, sombre, clair)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `index.html:7` (`theme-color`), `:10` (barre d'état iOS), `:21-28` (style inline du `body`, supprimé par V2-DS-01).
- `utils/appPersistence.ts:1-74` (modèle de lecture/écriture protégée).
- `views/HomeView.tsx:132-167` (pied de page), `components/match/MatchSettingsModal.tsx`.
- `public/_headers:2` (CSP compatible avec un script inline).

## 2. Approche retenue (et alternatives écartées)
Script inline + module d'application CSS (aucun contexte React nécessaire pour le rendu). Écartée : `ThemeProvider` React seul (flash avant hydratation).

## 3. Étapes
1. `src/features/theming/themePreference.ts` : type, validation, résolution (pure).
2. `src/infrastructure/local/themeStorage.ts` : lecture/écriture protégée de `bougnat-theme-v1`.
3. `src/infrastructure/web/themeDom.ts` : `data-theme`, `color-scheme`, `theme-color`, écoute `prefers-color-scheme`.
4. Script inline dans `index.html` (même logique minimale, ES5) + deux `theme-color` avec `media`.
5. Hook de présentation `useThemePreference` et composant `ThemeSelector` (3 états).
6. Intégrer le sélecteur dans `HomeView` (pied de page) et `MatchSettingsModal`, derrière le drapeau d'activation du Light.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `index.html` | Script inline, méta `theme-color` |
| `src/features/theming/themePreference.ts` | Création (pur) |
| `src/infrastructure/local/themeStorage.ts`, `src/infrastructure/web/themeDom.ts` | Création |
| `src/presentation/theme/ThemeSelector.tsx`, `useThemePreference.ts` | Création |
| `views/HomeView.tsx`, `components/match/MatchSettingsModal.tsx` | Point d'accès |
| `tests/unit/theming/*.test.ts`, `tests/e2e/theme.spec.ts` | Tests |

## 5. Impacts UI / domaine / application / infrastructure
Présentation + infrastructure web/local. Domaine inchangé.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Nouvelle clé seulement ; absence = `system`. Aucune migration de session.

## 7. Stratégie de test
Unitaires (résolution, validation, script), E2E Chromium + WebKit (`colorScheme`, rechargement), terrain iOS/Android.

## 8. Non-régression
Parcours de base, reprise X01 (010), installation (011), CSP inchangée.

## 9. Rollback / désactivation
Drapeau d'activation du Light : désactivé → thème forcé `dark`, sélecteur masqué. Revert possible sans perte (clé ignorée).

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur (apparence, V2-DOC-05), notes de release, documentation technique (clé de stockage).
