# Plan — 068 Mode Light

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Tokens V2-DS-01 (`src/styles/tokens/themes.css`, à créer par 063).
- Registre de migration V2-DS-03 (`specs/065-counter-screen-migration-to-tokens/plan.md` §6).
- Lueurs : `components/ui/Button.tsx:19`, `components/game/PlayerScore.tsx:78`, `components/game/CricketScoreboard.tsx:52` (exemples).
- `index.html:7`, `:10` (méta navigateur).

## 2. Approche retenue (et alternatives écartées)
Palette conçue (rapport 05 §5.2) validée sur maquette, valeurs par rôle. Écartées : inversion automatique (contrastes non conformes) ; filtre CSS `invert()` (couleurs de jeu faussées).

## 3. Étapes
1. Prototype de palette sur 4 écrans (accueil, X01, Cricket, Killer), captures soumises au PO.
2. Valeurs `[data-theme='light']` pour tous les rôles et `game-*`.
3. Fonction pure de contraste + test de matrice (Dark et Light).
4. Revue des lueurs restantes dans les écrans migrés ; remplacement par anneaux/barres.
5. Adapter `theme-color` (via V2-THEME-02) et barre d'état iOS.
6. Captures Light de référence, axe-core en clair.
7. Activer le drapeau Light en production quand le registre est à 100 %.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/styles/tokens/themes.css` | Valeurs `light` |
| `src/features/theming/contrast.ts` | Fonction pure de contraste |
| `tests/unit/theming/contrastMatrix.test.ts` | Matrice |
| Composants avec lueurs résiduelles | Indices compatibles clair |
| `tests/e2e/` (captures Light, axe-core) | Tests |
| Configuration du drapeau Light | Activation |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Les utilisateurs en `system` avec appareil clair basculeront automatiquement à l'activation : à annoncer dans les notes de version.

## 7. Stratégie de test
Matrice de contraste unitaire, axe-core Light, captures Light, test terrain.

## 8. Non-régression
Captures Dark ; tests existants.

## 9. Rollback / désactivation
Drapeau Light désactivé → thème `dark` forcé, sélecteur masqué (V2-THEME-02).

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur (V2-DOC-05), notes de release, README (fonctionnalité disponible seulement après activation).
