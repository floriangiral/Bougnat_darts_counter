# Plan — 063 Design tokens (socle unique Dark/Light/club/TV)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `src/styles/tailwind.css:1-13` (import Tailwind, style `body`), `:207`, `:266`, `:425` (couleurs en dur).
- `index.html:7` (`theme-color`), `index.html:21-28` (style inline du `body`).
- `scripts/guard-clean-codebase.sh` (garde existant, sans contrôle de couleurs).
- `package.json` : `tailwindcss ^4.3.5`, `@tailwindcss/vite`, `@vitejs/plugin-legacy` (`vite.config.ts:29-33`).

## 2. Approche retenue (et alternatives écartées)
Variables CSS à trois niveaux + `@theme inline` (ADR 0006). Écartées : `dark:` partout (×2 classes, pas de couleurs runtime), CSS-in-JS (dépendance, re-render), feuilles échangées (flash), daisyUI (identité générique).

## 3. Étapes
1. Attendre la décision V2-DS-00 (format des valeurs) et les captures de référence V2-QA-05.
2. Créer `src/styles/tokens/primitives.css` (hex/rgb), `themes.css` (`[data-theme='dark']`), `components.css`, `tailwind-bridge.css` (`@theme inline`, `@custom-variant`).
3. Importer les tokens dans `src/styles/tailwind.css` ; remplacer les 3 couleurs en dur par des rôles.
4. Poser `data-theme="dark"` sur `<html>` dans `index.html` ; supprimer le `<style>` inline du `body`.
5. Ajouter le cliquet dans `scripts/guard-clean-codebase.sh` (fichier de référence du compteur, ex. `scripts/lib/raw-color-baseline.txt`).
6. Rédiger ADR 0006 et un guide court des rôles (doc technique).
7. Rejouer les captures V2-QA-05 et ajuster les valeurs Dark jusqu'à tolérance.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/styles/tokens/*.css` | Création |
| `src/styles/tailwind.css` | Import des tokens, 3 couleurs tokenisées, `body` unique |
| `index.html` | `data-theme`, suppression du style inline |
| `scripts/guard-clean-codebase.sh`, `scripts/lib/*` | Cliquet |
| `tests/unit/tooling/` | Tests du cliquet et de la structure des tokens |
| `docs/adr/0006-*.md` | ADR (rédigé par la gouvernance) |

## 5. Impacts UI / domaine / application / infrastructure
UI : aucun changement visible. Domaine/application/infrastructure : aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Cohabitation palette par défaut + tokens jusqu'à la fin de V2-DS-03.

## 7. Stratégie de test
Unitaires (structure des tokens, cliquet), E2E captures V2-QA-05 (Docker Playwright), vérification manuelle sur la baseline basse. Couverture : fichiers TS du cliquet couverts (spec 029).

## 8. Non-régression
Suite unitaire complète, E2E smoke tablette/téléphone, captures. Aucun sélecteur `data-layout` modifié.

## 9. Rollback / désactivation
Revert du commit : les écrans non migrés n'utilisent pas encore les rôles, le retour arrière est sans effet fonctionnel.

## 10. Documentation à mettre à jour avec l'implémentation
ADR 0006, guide des rôles (docs techniques), `CONTRIBUTING.md` (règle « pas de couleur brute »), notes de release.
