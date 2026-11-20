# Design system — tokens, thèmes et couleurs métier

> Specs [063](../specs/063-counter-design-tokens/spec.md) (tokens), [064](../specs/064-counter-accessible-base-components/spec.md) (composants de base), [065](../specs/065-counter-screen-migration-to-tokens/spec.md) (migration), [066](../specs/066-counter-reserved-game-colors/spec.md) (couleurs métier), [068](../specs/068-counter-light-mode/spec.md) (Light), [069](../specs/069-counter-theme-preference/spec.md) (préférence). Décision : [ADR 0006](adr/0006-design-tokens-systeme-de-themes-unique.md).

## 1. Trois niveaux

| Niveau | Fichier | Usage |
|---|---|---|
| Primitives (`--bd-ink-*`, `--bd-chalk-*`, `--bd-orange-*`…) | `src/styles/tokens/primitives.css` | Valeurs hexadécimales brutes. **Jamais** dans le JSX. |
| Rôles sémantiques (`--bd-canvas`, `--bd-fg`, `--bd-game-triple`…) | `src/styles/tokens/themes.css` | Une valeur par thème (`[data-theme='dark']`, `[data-theme='light']`). |
| Pont Tailwind | `src/styles/tokens/bridge.css` | `@theme inline` : chaque rôle devient un utilitaire (`bg-surface`, `text-fg`, `border-border-subtle`, `shadow-elevated`). |

Le thème effectif est porté par `<html data-theme>`. Les variantes `dark:`/`light:` existent mais sont réservées aux exceptions documentées : un composant n'utilise que des rôles, qui changent de valeur avec le thème.

Les valeurs sont en hexadécimal ou `rgba()` pré-calculé (pas de `color-mix()` ni d'`oklch()` dans les tokens). Le modificateur d'opacité Tailwind (`border-game-double/40`) reste permis sur un rôle opaque.

## 2. Rôles disponibles

| Famille | Utilitaires | Usage |
|---|---|---|
| Surfaces | `canvas`, `surface`, `surface-raised`, `surface-strong`, `surface-sunken` | Fond de page, panneaux, cartes, touches, creux |
| Voiles | `surface-tint`, `surface-tint-strong`, `surface-inset`, `surface-glass` | Élévation légère (remplace `white/5`, `white/10`, `black/20`, `gray-900/94`) |
| Superpositions | `scrim` (assombrit derrière une carte), `overlay` (fond quasi opaque portant directement du texte) | Modales, transitions |
| Papier | `paper` | Fond blanc dans les deux thèmes (QR code) |
| Bordures | `border-subtle`, `border`, `border-strong` | `border-border-subtle`, `border-border`… |
| Texte | `fg`, `fg-soft`, `fg-muted`, `fg-subtle`, `fg-faint`, `fg-disabled`, `fg-inverse` | Du plus fort au plus discret |
| Marque | `brand`, `brand-strong`, `brand-2`, `brand-fg`, `brand-fg-soft`, `brand-fg-faint`, `on-brand`, `brand-subtle`, `brand-muted`, `brand-border` | Dégradé « feu » `from-brand-strong to-brand-2`, texte d'accent, fonds teintés |
| Feedback | `success*`, `danger*`, `warning*`, `info*` (`-fg`, `-subtle`, `-border`, `on-*`) | Messages, états |
| Focus | `focus-ring` | Anneau `:focus-visible` (global, 2 px) |
| Ombres | `shadow-elevated`, `shadow-panel`, `shadow-raised`, `shadow-up`, `shadow-brand`, `shadow-glow-brand`, `shadow-glow-success`, `shadow-glow-danger`, `shadow-glow-info`, `drop-shadow-glow-brand`, `drop-shadow-text` | En clair, les lueurs deviennent des anneaux |
| Ambiance | `bg-ambient`, `bg-ambient-hot` | Fonds radiaux de l'accueil et de la sélection |

## 3. Couleurs métier réservées (spec 066)

Les rôles `game-*` ont **le même sens dans tous les jeux et les deux thèmes** et ne sont pas personnalisables (un thème club ne les modifie jamais). Chaque état porte aussi un indice non coloré (WCAG 1.4.1).

| Rôle | Sens | Indice de forme |
|---|---|---|
| `game-single` / `game-single-fg` | Simple | Libellé « S » ou chiffre seul |
| `game-double` / `-fg` / `-subtle` | Double (cyan) | Libellé « D » / `data-multiplier="2"` |
| `game-triple` / `-fg` / `-subtle` | Triple (orange) | Libellé « T » / `data-multiplier="3"` |
| `game-bull` / `-fg` / `-subtle` | Bull (vert) | Libellé « BULL (25) » |
| `game-dbull` / `-fg` / `-subtle` | Double bull (rouge) | Libellé « D-BULL (50) » |
| `on-game` | Texte sur aplat métier | — |
| `game-bust` / `-fg` | Trop / bust | Libellé « TROP ! » |
| `game-closed` / `-fg` | Cible fermée (Cricket) | Marque ⊗ |
| `game-dead` | Cible fermée par tous | Barré |
| `game-eliminated` | Joueur éliminé (Killer) | Barré + icône |
| `game-win` | Victoire | Libellé, trophée |
| `game-active` | Joueur actif | Barre + fond + symbole ▶ (au moins trois indices) |
| `game-score` / `game-score-inactive` | Score actif / inactif | Taille ; inactif ≥ 4,5:1 |
| `game-<jeu>-a/b/c`, `game-<jeu>-fg` | Identité des jeux (sélection) | Icône et nom du jeu |

Convention de la cible commune à tous les pavés : **simple neutre, double cyan, triple orange, Bull vert, double bull rouge** (Capital aligné sur Cricket). Les composants exposent `data-tone`, `data-multiplier` ou `data-state` : les tests vérifient ces attributs, jamais un nom de classe de couleur.

## 4. Composants de base (spec 064)

- `Button` (`components/ui/Button.tsx`) : `variant` ∈ `primary`, `secondary`, `danger`, `ghost`, `keypad`, `success` ; `tone` (pour `keypad`) ∈ `neutral`, `double`, `triple`, `bull`, `dbull`, `danger`, `success`. Pas de `!important`, pas de `focus:outline-none`.
- `IconButton` : libellé accessible obligatoire (`label`), cible carrée au plancher tactile.
- Plancher tactile : classe `bd-touch-target` (44 px téléphone, 48 px tablette), posée par les composants de base.

## 5. Garde-fous

- `npm run guard:clean` lance `scripts/design-tokens/check.mjs` : le nombre de classes de palette brute (`bg-gray-800`, `text-orange-500`, `border-white/10`, valeurs arbitraires `bg-[#06080d]`, `shadow-[…rgba…]`) ne peut que baisser ; la référence est dans `scripts/design-tokens/baseline.json`.
- `scripts/design-tokens/migrate.mjs` convertit les cas non ambigus (table dans `scripts/design-tokens/palette.mjs`) ; les autres sont migrés à la main.
- Tout nouveau rôle est ajouté aux **deux** thèmes de `themes.css`, puis au pont `bridge.css` ; le test de contraste (`tests/unit/designSystem/themeContrast.test.ts`) vérifie les paires déclarées en Dark et en Light.

## 6. Thème et préférence (specs 068, 069)

- Préférence `system` (défaut) | `dark` | `light`, clé `localStorage` `bougnat-theme-v1` (`{"v":1,"mode":…}`), locale à l'appareil.
- Un script inline synchrone de `index.html` applique `data-theme`, `theme-color` et la barre d'état iOS avant le premier rendu (aucun flash) ; `src/app/themeController.ts` prend le relais (choix manuel, changement du thème système).
- Sélecteur « Apparence : Auto / Sombre / Clair » (`components/ui/ThemeSelector.tsx`) dans le pied de page de l'accueil et dans les options de partie X01.
