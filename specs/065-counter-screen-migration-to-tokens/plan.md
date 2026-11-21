# Plan — 065 Migration écran par écran vers les tokens

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

> **Réalisation (2026-11-20)** : migration réalisée en une branche : codemod (étape 2) puis migration manuelle de tous les écrans dans l'ordre du §9 (étapes 3 à 7). L'étape 8 (verrouillage `--color-*: initial` dans `bridge.css`, référence du cliquet à 0) est appliquée en clôture du chantier. Registre ci-dessous (§6).

## 1. Lecture de l'existant
- 48 fichiers couplés aux couleurs (rapport 05 §2.2) ; les plus couplés : `CapitalKeypad.tsx`, `ChangelogModal.tsx`, `CapitalGameView.tsx`, `GotchaGameView.tsx`, `GameSelectionView.tsx`, `KillerGameView.tsx`, `Keypad.tsx`, `HomeView.tsx`.
- `src/features/x01/scoring/matchFeedback.ts:3-45`.
- Tests couplés : `tests/unit/components/keypads.test.tsx:106`, `cricketScoreboard.test.tsx:24`, `tests/unit/x01/VoiceScoringControl.test.tsx`, `tests/unit/x01/matchScoring.test.ts`.

## 2. Approche retenue (et alternatives écartées)
Conversion outillée (table validée) + reprise manuelle des transparences/lueurs, écran par écran, dans les mêmes PR que l'arène (V2-TAB-03). Écartée : conversion « big bang » (revue impossible, conflits).

## 3. Étapes
1. Établir la table de correspondance (≈ 100 classes) et la faire valider.
2. Écrire `scripts/migrate-colors.mjs` (hors runtime) : remplace les correspondances sûres, liste les cas ambigus.
3. Lot A : accueil, sélection, setup.
4. Lot B : X01 (avec arène X01 si TAB-03 validée).
5. Lots C à F : Cricket, Capital, Killer/Gotcha, Triathlon (chacun avec son arène).
6. Lot G : statistiques et modales ; Lot H : `ChangelogModal`.
7. Convertir les assertions de tests au fil des lots.
8. Verrouillage `--color-*: initial`, cliquet à 0.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `views/*.tsx`, `components/**/*.tsx`, `App.tsx` | Classes brutes → rôles |
| `src/features/x01/scoring/matchFeedback.ts` | Retourne un ton |
| `src/styles/tokens/tailwind-bridge.css` | Verrouillage final |
| `scripts/migrate-colors.mjs` | Création (outil de dev) |
| `tests/unit/**` (4 fichiers) | Assertions sémantiques |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement ; aucune règle de jeu modifiée.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Registre de migration ci-dessous, mis à jour à chaque lot :

Registre au 2026-11-20 : « prêt Light » = toutes les couleurs passent par des rôles déclarés dans les deux thèmes (matrice de contraste au vert) ; la revue visuelle se fait sur les captures de la PR (spec 068, Q3).

| Écran | Migré Dark | Prêt Light | Capture de référence |
|---|---|---|---|
| Accueil / sélection / setup | ☑ | ☑ | à produire par 041 |
| X01 | ☑ | ☑ | à produire par 041 |
| Cricket | ☑ | ☑ | à produire par 041 |
| Capital | ☑ | ☑ | à produire par 041 |
| Killer / Gotcha | ☑ | ☑ | à produire par 041 |
| Triathlon | ☑ | ☑ | à produire par 041 |
| Statistiques et modales | ☑ | ☑ | à produire par 041 |
| Changelog | ☑ | ☑ | à produire par 041 |

## 7. Stratégie de test
Captures Dark V2-QA-05 par lot, tests unitaires sémantiques, E2E smoke. Couverture inchangée (spec 029).

## 8. Non-régression
Specs 005, 014, 021 ; E2E tablette/téléphone.

## 9. Rollback / désactivation
Revert du lot concerné (un écran par PR). Le verrouillage final est un commit séparé, réversible.

## 10. Documentation à mettre à jour avec l'implémentation
Guide des rôles (exemples par écran), `CONTRIBUTING.md`, notes de release.
