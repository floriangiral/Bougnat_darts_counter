# Plan — 094 Éditeur visuel de thème

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `views/HomeView.tsx:141` et pied de page : actions secondaires de l'accueil.
- `App.tsx:54-62` : vues chargées à la demande ; `src/app/appShell.ts` : écrans et modes.
- `components/match/MatchSettingsModal.tsx:53` : seule modale d'options (en partie), hors périmètre.
- Module `src/features/theming` (093) : validation, dérivation, presets.

## 2. Approche retenue (et alternatives écartées)
Écran dédié chargé à la demande, formulaire contrôlé, aperçus par composants réels enveloppés dans un conteneur portant les variables dérivées (`style` local). Écartées : éditeur dans `MatchSettingsModal` (pendant la partie) ; assistant multi-écrans (trop long) ; aperçu par captures statiques (infidèle).

## 3. Étapes
1. Ajouter l'écran `THEME_EDITOR` (nom indicatif) à l'union `AppScreen` (`src/app/appShell.ts:10-25`). Note : `SCORING_ONLY_SCREENS` (`src/app/appShell.ts:65`) n'inclut pas `HOME`, et `isScreenAllowedForAccessMode` (`:109`) n'est appelée ni dans `App.tsx` ni dans `src/` [vérifié par grep] ; l'appartenance du nouvel écran à cet ensemble est à clarifier avec 001 (V2-ARCH-12). L'éditeur ne doit pas être proposé pendant un match lié (030).
2. Créer `ThemeEditorView` (formulaire, presets, avancé, bibliothèque).
3. Créer `ThemePreviewFrame` (conteneur à variables locales) et les aperçus Accueil, X01, Cricket, TV à données factices.
4. Brancher `themeStorage` (093) pour enregistrer, activer, supprimer, restaurer.
5. Ajouter l'entrée dans le pied de page de l'accueil.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/presentation/theme/ThemeEditorView.tsx` | Nouveau |
| `src/presentation/theme/ThemePreviewFrame.tsx` | Nouveau |
| `src/presentation/theme/previews/*.tsx` | Nouveaux aperçus |
| `views/HomeView.tsx` | Entrée secondaire en pied de page |
| `App.tsx`, `src/app/appShell.ts` | Nouvel écran chargé à la demande |
| `tests/unit/theme/ThemeEditorView.test.tsx` | Nouveaux tests |
| `tests/e2e/theme-editor.spec.ts` | Nouveau scénario E2E |

## 5. Impacts UI / domaine / application / infrastructure
UI : nouvel écran et une entrée. Domaine : aucun. Application : aucun nouveau cas d'usage hors 093. Infrastructure : réutilise `themeStorage`.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune migration ; utilise les stockages de 093.

## 7. Stratégie de test
Composants (synchronisation sélecteur/hex, badges, plafond, confirmation de sortie) ; E2E (création, activation, restauration, parcours de base inchangé sur les 7 projets Playwright) ; tests manuels sur appareils réels.

## 8. Non-régression
Parcours de base E2E inchangé ; contrôle des chunks initiaux (éditeur absent).

## 9. Rollback / désactivation (feature flag le cas échéant)
Même drapeau que 093 : l'entrée de l'accueil est masquée, le thème officiel s'applique.

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur « Personnaliser » (037) ; captures de l'éditeur dans `docs/user/` [emplacement selon 035].
