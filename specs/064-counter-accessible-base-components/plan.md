# Plan — 064 Composants de base accessibles (focus visible, états, cibles 48 px)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

> **Réalisation (2026-11-20)** : étapes réalisées sauf `BrandMark` et `Surface` (non créés) ; le plancher tactile est porté par la classe `bd-touch-target` des composants de base. Restent les E2E en CI, l'E2E clavier + axe-core et les captures (spec 041).

## 1. Lecture de l'existant
- `components/ui/Button.tsx:15-29` (styles de base, variantes, tailles).
- `components/game/Keypad.tsx`, `CricketKeypad.tsx:21` (`releaseButtonFocus`), `CapitalKeypad.tsx`, `src/features/x01/voice/VoiceScoringControl.tsx` (utilitaires `!`).
- `src/styles/tailwind.css:34`, `:164-167`, `:502-512`, `:543-549` (planchers et exceptions).
- `components/match/MatchTopBar.tsx` (boutons d'en-tête).

## 2. Approche retenue (et alternatives écartées)
Composant unique enrichi (variantes + tons) basé sur les tokens. Écartée : multiplier les composants par jeu (duplication) ; conserver les règles globales `[data-layout] button` (fragiles, cause de la cascade actuelle).

## 3. Étapes
1. (Optionnel Lot 0) Remplacer `focus:outline-none` par `focus-visible:` dans `Button.tsx` et les 6 autres occurrences ; supprimer `releaseButtonFocus`.
2. Ajouter variantes `keypad`/`success`, prop `tone`, états unifiés dans `Button.tsx`.
3. Créer `components/ui/IconButton.tsx`, `components/ui/Surface.tsx`, `components/ui/BrandMark.tsx`.
4. Migrer les 4 pavés et `VoiceScoringControl` vers les variantes ; supprimer les `!`.
5. Porter le plancher tactile dans le composant (prop `size` dérivée de la présentation) en coordination avec V2-TAB-02 ; retirer les règles globales devenues inutiles.
6. Remplacer les duplications du mot-symbole par `BrandMark`.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `components/ui/Button.tsx` | Variantes, tons, états, focus |
| `components/ui/IconButton.tsx`, `Surface.tsx`, `BrandMark.tsx` | Création |
| `components/game/Keypad.tsx`, `CricketKeypad.tsx`, `CapitalKeypad.tsx` | Suppression des `!`, variantes |
| `src/features/x01/voice/VoiceScoringControl.tsx` | Suppression des `!` |
| `components/match/MatchTopBar.tsx` | `IconButton` |
| `src/styles/tailwind.css` | Retrait des planchers globaux remplacés |
| `tests/unit/components/keypads.test.tsx`, `tests/unit/x01/VoiceScoringControl.test.tsx` | Assertions `data-tone` au lieu de classes |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement. Domaine inchangé.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Migration composant par composant, chaque PR verte.

## 7. Stratégie de test
Unitaires (variantes, attributs), E2E clavier et mesure des cibles (profils V2-QA-09), axe-core (V2-QA-05).

## 8. Non-régression
Specs 014, 021, 005 ; tests de pavés ; captures Dark.

## 9. Rollback / désactivation
Revert par PR (une PR par composant). Pas de drapeau nécessaire.

## 10. Documentation à mettre à jour avec l'implémentation
Guide des composants (docs techniques), notes de release (focus visible).
