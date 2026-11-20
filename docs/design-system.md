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
- `FitText` (`components/ui/FitText.tsx`, hook `useFitText`, calcul pur `fitTextLayout.ts`) : case de tout nom de joueur ou d'équipe, **jamais tronqué** (ni `truncate`, ni ellipse, ni `line-clamp` sur un nom). La taille suit la largeur mesurée (ResizeObserver) entre un plafond — taille posée par le CSS de l'écran, prop `maxFontPx` ou variable CSS `maxFontVar` (`--fit-max` par défaut, `--x01-name-max` en X01) — et un plancher de 14 px (ou la taille du design si elle est plus petite) ; en dessous, le nom passe sur deux lignes équilibrées (`text-wrap: balance`, puis `overflow-wrap: anywhere`). La case doit tirer sa largeur de son parent (`w-full`, bloc ou `flex-1`). L'état est exposé par `data-fit` (`fit`, `wrap`, `auto` sans mesure possible).
- Plancher tactile : classe `bd-touch-target` (44 px téléphone, 48 px tablette), posée par les composants de base. Les pavés de jeu vont au-delà en tablette : touches d'au moins 64 px visées dans l'« arène portrait » (spec 072, révision PO, en cours), Annuler et Valider ≥ 64 px en arène paysage (≥ 48 px en densité serrée).

## 5. Garde-fous

- `npm run guard:clean` lance `scripts/design-tokens/check.mjs` : le nombre de classes de palette brute (`bg-gray-800`, `text-orange-500`, `border-white/10`, valeurs arbitraires `bg-[#06080d]`, `shadow-[…rgba…]`) ne peut que baisser ; la référence, dans `scripts/design-tokens/baseline.json`, est à **0** depuis la fin de la migration.
- La palette Tailwind par défaut est verrouillée (`--color-*: initial` dans le bloc `@theme inline` de `src/styles/tokens/bridge.css`) : une classe brute comme `bg-gray-800` ne génère plus aucune CSS.
- `scripts/design-tokens/migrate.mjs` convertit les cas non ambigus (table dans `scripts/design-tokens/palette.mjs`) ; les autres sont migrés à la main.
- Tout nouveau rôle est ajouté aux **deux** thèmes de `themes.css`, puis au pont `bridge.css` ; le test de contraste (`tests/unit/designSystem/themeContrast.test.ts`) vérifie les paires déclarées en Dark et en Light.

## 6. Thème et préférence (specs 068, 069)

- Préférence `system` (défaut) | `dark` | `light`, clé `localStorage` `bougnat-theme-v1` (`{"v":1,"mode":…}`), locale à l'appareil.
- Un script inline synchrone de `index.html` applique `data-theme`, `theme-color` et la barre d'état iOS avant le premier rendu (aucun flash) ; `src/app/themeController.ts` prend le relais (choix manuel, changement du thème système).
- Sélecteur « Apparence : Auto / Sombre / Clair » (`components/ui/ThemeSelector.tsx`) dans la page Réglages (`views/SettingsView.tsx`, ouverte par la roue crantée de l'accueil, spec 129) et dans les options de partie X01 ; l'accueil ne porte plus le sélecteur.

## 7. Commandes de jeu et claviers

> Demande du product owner du 2026-11-20 : uniformiser les boutons de sortie, d'annulation, de validation et les claviers de tous les jeux, dans tous les modes d'affichage (téléphone portrait et paysage, tablette portrait — présentation de référence —, arène, bureau ; thèmes Dark et Light). Les briques vivent dans `components/game/controls/` et `src/styles/layout/game-controls.css` ; les six jeux (X01, Cricket, Capital, Killer, Gotcha, Triathlon) les utilisent : même en-tête (`GameHeader`), même dialogue de sortie (`ConfirmExitDialog`), même rangée « Annuler | … | Valider ».

### 7.1 Une action = un libellé, une icône, un rôle

| Action | Libellé (nom accessible) | Icône | Rôle | Où |
|---|---|---|---|---|
| `exit` | « Quitter » | `LogOut` | danger | En-tête, isolé à droite, **toujours confirmé** |
| `undo` | « Annuler » | `Undo2` | secondaire | Rangée d'actions, **à gauche**, adjacent à Valider |
| `validate` | « Valider » (« OK » en X01) | `Check` | primaire | Rangée d'actions, **à droite** |
| `pass` | « Passer » | `SkipForward` | primaire | Rangée d'actions, à droite (fin du tour en Killer) |
| `miss` | « MISS » (« 3 MISS » en Cricket ; Killer compris, ex-« Raté ») | — | touche danger | Clavier ou rangée d'actions |
| `stats` | « Statistiques » | `BarChart3` | neutre | En-tête |
| `settings` | « Réglages » (ex-« Configuration » du X01) | `Settings` | neutre | En-tête |

Le catalogue est `GAME_ACTIONS` (`components/game/controls/gameActions.ts`). Décision PO du 2026-11-20 : plus de touches « C » et « Retour » distinctes. Sur les pavés numériques (X01, Gotcha, Capital en mode chiffré), une seule touche « Annuler », placée à gauche de « OK » / « Valider », **efface la saisie en cours s'il y en a une, sinon annule la dernière volée validée**, et reste désactivée quand il n'y a rien à annuler (`GameUndoButton`, règle pure `resolveUndoIntent`). En Cricket, Capital (modes cible) et Killer, la touche d'annulation unique s'appelle aussi « Annuler » et garde sa fonction (dernière fléchette ou dernière action).

### 7.2 Briques

| Composant | Rôle | Attributs exposés |
|---|---|---|
| `GameActionButton` | Commande standard ; `display="full"` (libellé + icône) ou `display="icon"` (bouton carré d'en-tête, `IconButton`) ; `label` pour un libellé propre au jeu | `data-action`, `data-variant`, `data-tone` |
| `GameHeader` | Bandeau d'en-tête **unique** des six jeux (remplace `MatchTopBar` et les en-têtes propres à chaque vue) : marque « BOUGNAT DARTS » et pastille (`badge` / `compactBadge` : nom du jeu, format, cible, tour), heure et chronomètre (`clock`), indicateurs du jeu (`indicators`), puis `GameHeaderActions` | `data-game`, `role="timer"` « Durée de la partie » |
| `GameUndoButton` | Touche « Annuler » fusionnée des pavés numériques (`hasPendingInput`, `canUndoLast`, `onClearInput`, `onUndoLast`) | `data-action="undo"`, `data-undo-intent` (`clear-input` / `undo-last` / `none`) |
| `GameHeaderActions` | Groupe d'en-tête : indicateurs du jeu (`children`), Statistiques, Réglages, puis Quitter séparé | `role="group"` « Actions de la partie » |
| `ConfirmExitDialog` + `useExitConfirmation(onExit)` | Dialogue unique « Quitter la partie ? » (tous les jeux, Triathlon compris) : « Non » secondaire à gauche (focus initial), « Oui » danger à droite ; Échap = Non ; le focus reste dans le dialogue puis revient au déclencheur ; le dialogue se ferme avant `onExit` (enchaînement avec le dialogue du match lié, spec 030) | `aria-labelledby`, `aria-describedby`, `data-testid="confirm-exit-dialog"`, `confirm-exit-cancel`, `confirm-exit-confirm` |
| `KeypadPanel` | Surface du clavier, remplit la zone `input` de `GameScreenLayout` | — |
| `KeypadGrid` | Grille CSS : `columns` (nombre ou `auto` borné par `maxColumns`), `rows`, `label` (`role="group"`), `fill` | `data-columns`, `data-rows`, `data-fill` |
| `KeypadKey` | Touche : `tone` (spec 066), `multiplier`, `keyId`, `selected` (bascule), `state`, `size` (`digit` / `target` / `label`), `span` / `rowSpan` | `data-variant="keypad"`, `data-tone`, `data-multiplier`, `data-key`, `data-state`, `data-size`, `aria-pressed` |
| `KeypadActionRow` | Rangée du bas : `undo` toujours à gauche, `validate` toujours à droite, touches du jeu entre les deux (`columns` pour un gabarit explicite) | `role="group"` « Actions du tour » |

Le pavé X01 tablette est la référence visuelle des claviers : rayon qui suit l'écran, contour franc, liseré bas en relief (couleur du texte pour les tons double, triple et danger), enfoncement à l'appui, rangée du bas « Annuler | … | Valider » ; `game-controls.css` applique ce langage à toutes les touches des tablettes tactiles. Les fonctions propres à chaque jeu passent par les props natives et le contenu : appui long et `pointerdown` immédiat du X01, raccourcis, voix et RESTE ; sélecteur SIMPLE / DOUBLE / TRIPLE et Bull « BULL (25) » / « D-BULL (50) » ; modes de Capital ; 21 touches de Killer ; etc. Les `data-testid` existants se posent directement sur les briques.

### 7.3 Tailles par recette

Les tailles sont des variables CSS héritées de la racine (`data-layout`, `data-recipe`, `data-input`, `data-density`) ; un jeu peut en redéfinir une sur `.game-screen[data-game='<jeu>']` dans son fichier `src/styles/games/<jeu>.css`.

| Recette | Touche (`--bd-key-min-h`) | Rangée d'actions (`--bd-action-min-h`) | Espacement |
|---|---|---|---|
| Téléphone portrait, bureau | 44 px | 48 px | 6 px (8 px dès 640 px) |
| Tablette portrait (stack / stack-wide tactiles) | 64 px (56 px sous 900 px de haut) | 64 px (56 px) | 8 à 12 px |
| Arène (tablette paysage tactile) | 48 px | 64 px (48 px en `tight`) | 8 px (4 px en `tight`) |
| Téléphone paysage | 44 px | 44 px | 4 px |

Rayon commun `--bd-key-radius` (12 px ; 12 à 20 px en tablette) ; typographie commune par `data-size`.

Bandeau d'en-tête (`--bd-header-*`), lisible à distance sans dominer le score :

| Recette | Hauteur | Marque | Pastille / heure | Chronomètre | Boutons (icône) |
|---|---|---|---|---|---|
| Téléphone portrait, bureau | 78 px (88 px dès 640 px ; 64 / 56 px sur bureau bas) | 16–20 px | 9–11 px | 16–20 px | 40 px bureau, 44 px téléphone (20 px) |
| Tablette tactile (portrait et arène), 768 → 1200 px de large | 72 → 96 px | 22 → 30 px | 14 → 18 px | 28 → 40 px | 56 → 64 px (24 → 28 px) |
| Arène `tight` | 56 px | 22 px | 14 px | 24 px | 48 px (20 px) |
| Téléphone paysage | 48 px | 16–20 px | 9–11 px | 16–20 px | 44 px |

Dialogues de confirmation (classes `bd-confirm-card`, `-title`, `-text`, `-actions`, `-button`, posées par `ConfirmExitDialog` et la confirmation d'ouverture du X01) : bureau inchangé ; téléphone, boutons ≥ 56 px ; tablette, carte de 78 % de la largeur (au plus 896 px), titre 32 → 48 px, texte 20 → 28 px, boutons 72 → 96 px. La touche sélectionnée porte, en plus de l'aplat métier, un soulignement (indice non coloré). Aucune couleur dans `game-controls.css` : les rôles viennent des classes de tokens posées par les composants, donc Dark et Light sont couverts.
