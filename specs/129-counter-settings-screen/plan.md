# Plan — 129 Page Réglages

> Plan exécuté le 2026-11-20 à la demande directe du product owner (spec au statut `implementee`).

## 1. Lecture de l'existant
- `views/MatchView.tsx` : `showHints` (`useState(false)`), `voiceAssistEnabled` (`useState(true)`, remis à `true` à chaque nouvelle partie).
- `src/features/x01/hooks/useMatchShortcuts.ts` : raccourcis, brouillons et barre téléphone en état React.
- `components/match/MatchSettingsModal.tsx` : menu « Options de jeu » X01 et `ThemeSelector`.
- `views/HomeView.tsx` : `ThemeSelector` dans le pied de page.
- Modèle : `src/features/theming/themePreference.ts`, `src/infrastructure/local/themePreferenceStore.ts`, `src/app/themeController.ts`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : une préférence locale versionnée `bougnat-settings-v1`, un contrôleur unique avec abonnement (`useSyncExternalStore`) lu par la page Réglages et par la partie X01.
- Écartée : stocker les options dans la session de partie (perdues à la partie suivante) ; un contexte React global (inutile, le contrôleur suffit) ; déplacer le menu de partie (demande : il reste en place).

## 3. Étapes
1. Module pur `counterSettings.ts` (types, défauts, parse/validation, sérialisation, mises à jour).
2. Stockage `counterSettingsStore.ts`, contrôleur `counterSettingsController.ts`, hook `useCounterSettings.ts`.
3. `useShortcutDrafts` (brouillons) et `useMatchShortcuts` branché sur la préférence.
4. `MatchView` : aide de finish et voix lues dans la préférence, bascules du menu écrites dans la préférence.
5. Écran `SETTINGS` (`views/SettingsView.tsx`), câblage `App.tsx`, `appScreens.ts`.
6. Accueil : retrait du `ThemeSelector`, roue crantée.
7. Tests, documentation (spec 069, `docs/design-system.md` §6, index des specs).

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/settings/counterSettings.ts` | Nouveau (pur) |
| `src/features/settings/useShortcutDrafts.ts` | Nouveau (hook) |
| `src/infrastructure/local/counterSettingsStore.ts` | Nouveau (stockage) |
| `src/app/counterSettingsController.ts`, `src/app/useCounterSettings.ts` | Nouveaux |
| `src/app/appScreens.ts`, `App.tsx` | Écran `SETTINGS` |
| `views/SettingsView.tsx` | Nouveau |
| `views/HomeView.tsx` | Roue crantée, retrait du sélecteur |
| `views/MatchView.tsx`, `components/match/MatchSettingsModal.tsx` | Édition ciblée (réglages) |
| `src/features/x01/hooks/useMatchShortcuts.ts` | Branché sur la préférence |
| `tests/e2e/theme.smoke.spec.ts` | Sélecteur atteint par la roue crantée |

## 5. Impacts UI / domaine / application / infrastructure
UI : nouvel écran, accueil allégé. Domaine : aucun. Infrastructure : nouvelle clé `localStorage`.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée antérieure à migrer. Une session persistée sur `SETTINGS` est valide (`isAppScreen`).

## 7. Stratégie de test
Unitaires (module pur, stockage, contrôleur, écran, accueil, hook, `MatchView`) ; E2E adapté, exécuté en CI ; seuils de couverture de la spec 029.

## 8. Non-régression
Parcours de base, menu de partie X01, préférence de thème, reprise de session.

## 9. Rollback / désactivation
Revert du commit ; la clé `bougnat-settings-v1` est alors simplement ignorée.

## 10. Documentation à mettre à jour avec l'implémentation
Spec 069 (Implémentation, Q1), `docs/design-system.md` §6, `specs/README.md`.
