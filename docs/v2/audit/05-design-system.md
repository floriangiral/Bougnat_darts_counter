> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 05 — Design system, thèmes Dark/Light et personnalisation clubs/bars

Agent : UX/UI, design system, thèmes et personnalisation graphique
Chantiers : 5.2 (mode Light) et 5.7 (personnalisation clubs et bars), plus leurs liens avec 5.6 (positionnement du mode TV), 6 (vision) et 7 (Clean Architecture)
Repo : `../ (workspace) Bougnat_darts_counter`, branche `feat/v2.0.0`, HEAD `508dfa6`. Accès en lecture seule : aucun fichier du repo n'a été modifié.
Date : 2026-11-20

Légende : **[VÉRIFIÉ code]** = constaté dans le code (chemin:ligne). **[VÉRIFIÉ build]** = constaté dans `dist/assets/index-C2qto8R6.css` (build local du 19/11, potentiellement antérieur au HEAD). **[VÉRIFIÉ source externe + URL]**. **[HYPOTHÈSE]**. **[À CONFIRMER]**. **[CALCUL]** = ratio WCAG 2.x calculé par moi à partir des hex sRGB de repli générés par Tailwind 4 dans le build. Les navigateurs modernes utilisent les valeurs oklch, avec des écarts de l'ordre de ±0,1 sur les ratios.

---

## 1. Périmètre et fichiers analysés

**Système de styles**
- `src/styles/tailwind.css` (549 lignes), unique feuille de styles de l'app.
- `index.html` (meta `theme-color`, style inline du `body`), `manifest.json`, `postcss.config.mjs`, `vite.config.ts` (plugin `@vitejs/plugin-legacy` avec la cible `ios >= 12`), `public/_headers` (CSP), `sw.js`.
- `src/infrastructure/web/legacySupport.ts` (classes `no-*`), `index.tsx` (bootstrap).
- `components/ui/Button.tsx`, `components/game-setup/setupViewStyles.ts`, `src/shared/config/env.ts`, `constants.ts`. Ce dernier ne contient que la table de checkout et aucune couleur.
- `src/features/x01/scoring/matchFeedback.ts`, qui contient des styles de feedback dans une couche `features`.

**Composants et vues**
- Les 151 fichiers TS/TSX hors tests ont été scannés par grep. Les plus couplés ont été lus en détail : `components/game/PlayerScore.tsx`, `CricketScoreboard.tsx`, `CricketKeypad.tsx`, `Keypad.tsx`, `CapitalKeypad.tsx`, `CheckoutHint.tsx`, `components/match/MatchTopBar.tsx`, `MatchStatusPill.tsx`, `MatchSettingsModal.tsx`, `views/HomeView.tsx`, `GameSelectionView.tsx`, `MatchView.tsx`, `KillerGameView.tsx`, `GotchaGameView.tsx`, `CapitalGameView.tsx`, `CricketGameView.tsx`, `TriathlonGameView.tsx`, `App.tsx`.

**Persistance et partage (pour 5.7)**
- `utils/appPersistence.ts` (localStorage), `src/infrastructure/local/IndexedDBSessionRepository.ts`.
- `src/features/external-match/externalMatchLink.ts`, un précédent utile de contrat d'URL versionné.
- `scripts/generate-app-qr.mjs`, qui est le seul usage de `qrcode`.

**Tests et gouvernance**
- `tests/unit/**`, `tests/e2e/**`, `playwright.config.ts`, `scripts/guard-clean-codebase.sh`, `eslint.config.js`.
- `specs/README.md`, ainsi que les specs 005, 018, 021, 027, 028, 030 et 031 (en-têtes et recherches ciblées).
- `.specify/memory/constitution.md`, `docs/architecture/*`, backlog workspace `next-specs.md`. Aucune mention de thème, de design system ou de contraste n'y figure.

**Sources externes consultées**
- Compatibilité de Tailwind 4 : https://tailwindcss.com/docs/compatibility
- `@theme inline` : https://tailwindcss.com/docs/theme
- `@custom-variant` : https://tailwindcss.com/docs/dark-mode
- Tarifs Cloudflare KV : https://developers.cloudflare.com/kv/platform/pricing/ et limites : https://developers.cloudflare.com/kv/platform/limits/
- Tarifs Cloudflare R2 : https://developers.cloudflare.com/r2/pricing/
- Capacité des QR codes : https://en.wikipedia.org/wiki/QR_code (norme ISO/IEC 18004)

---

## 2. Constats

### 2.1 Architecture de styles réelle

| Élément | Constat | Statut |
|---|---|---|
| Design tokens | **Aucun.** Ni `@theme`, ni `@custom-variant`, ni variable CSS de couleur. Les 34 variables CSS existantes portent sur la mise en page : safe areas `--app-safe-*` et `--tablet-safe-*`, `--x01-score-fs`, `--x01-control-h`, `--app-viewport-height`. | [VÉRIFIÉ code] `src/styles/tailwind.css:15-20, 117-122, 530-537` |
| Palette | La palette par défaut de Tailwind 4 (oklch) est utilisée directement dans le JSX. | [VÉRIFIÉ code + build] |
| Mode sombre | Il est implicite et codé en dur partout. **0 usage de `dark:`**, aucune détection de `prefers-color-scheme`, aucune propriété `color-scheme`. | [VÉRIFIÉ code] grep |
| Couleur du `body` | `#1a1a1a` / `#e5e5e5` est déclaré **deux fois** : `index.html:21-28` (style inline) et `tailwind.css:9-13`. | [VÉRIFIÉ code] |
| Couleurs en dur dans le CSS | `rgb(31 41 55)` (gray-800) à `tailwind.css:207`, `rgb(6 8 13 / .94)` à `:266`, `rgba(12,16,26,.94)` à `:425` (repli sans `backdrop-filter`). | [VÉRIFIÉ code] |
| Composant bouton | Un seul composant UI partagé, `components/ui/Button.tsx` (4 variantes, 3 tailles). Les variantes sont codées en dur, par exemple `primary` = `from-orange-600 to-red-600` (l.19). | [VÉRIFIÉ code] |
| Styles mutualisés | `setupViewStyles.ts` contient 4 constantes de classes, utilisées seulement par le setup. C'est l'embryon d'un système de « recettes ». | [VÉRIFIÉ code] |
| Styles dans `features` | `matchFeedback.ts:3-45` renvoie des classes Tailwind (bust, miss, notice, info) depuis `src/features/x01/scoring`. Le module reste pur (aucune dépendance de domaine), mais la présentation fuit dans une couche « feature ». | [VÉRIFIÉ code] |
| Polices | Aucune police embarquée. Les polices système sont utilisées, avec `font-mono` (37 usages) pour les scores. **0 `tabular-nums`**. | [VÉRIFIÉ code] |
| Logo applicatif | Le logo est un mot-symbole en CSS (texte italique incliné en dégradé). Il est dupliqué dans 6 endroits : `HomeView.tsx:98-109`, `GameSelectionView.tsx:118-121`, `MatchTopBar.tsx:26`, `CricketGameView.tsx:285`, `CapitalGameView.tsx:171`, `TriathlonGameHeader.tsx:21`. Killer, Gotcha et Setup n'en affichent pas. `logo.svg` (racine) n'est utilisé que par le SW. | [VÉRIFIÉ code] |

### 2.2 Couplage aux couleurs : chiffres

Périmètre de mesure : les 151 fichiers `*.ts`/`*.tsx` versionnés hors `tests/` et `*.d.ts`.

| Mesure | Valeur |
|---|---|
| Commande de la mission (`--include=*.tsx`, préfixes bg/text/border/ring/from/to/via) | **1 404** occurrences |
| Regex élargie (avec fill, shadow, accent, decoration, divide…), `.ts` et `.tsx` | **1 465** occurrences, **305** classes distinctes, **48 fichiers** |
| Répartition par propriété | text 612, bg 343, border 324, from 74, to 72, via 26, shadow 9, autres 5 |
| Répartition par palette | gray 447, white 365, orange 264, red 102, black 73, cyan 51, slate 48, emerald 34, green 33, amber 16, yellow 12, violet/rose 5, autres ≤ 3 |
| Loi de Pareto | 20 classes = 56 % des usages, 50 = 72 %, 100 = 83 % |
| Classes les plus fréquentes | `text-white` 191, `text-gray-500` 90, `border-white/10` 74, `text-gray-300` 59, `text-gray-400` 54, `border-gray-700` 40, `text-orange-500` 35, `bg-gray-800` 34 |
| Transparences sur blanc (`*-white/x`) | **167** usages, 21 variantes. C'est une « élévation par voile blanc » qui **ne fonctionne qu'en sombre**. |
| Transparences sur noir (`*-black/x`) | 46 |
| Valeurs arbitraires colorées (`[#…]`, `[rgba…]`, `[…gradient…]`) | **100** : shadow 50, bg 39, drop-shadow 11 |
| Hex dans le TSX | 32, dont **10 nuances quasi noires différentes** : `#06080d`, `#05070b`, `#030508`, `#0a1018`, `#0b1019`, `#0b1119`, `#0f141d`, `#101827`, plus `#1a1a1a` (body) et `bg-black` (57 usages) |
| Fonds « très sombres » | `bg-black` 57, `bg-gray-900` 32, `bg-gray-950` 15, `bg-[#06080d]` 8, `bg-[#101827]` 6, … |
| Attributs `style={}` | 11. La plupart sont dynamiques et légitimes (largeur de progression, grilles). **Un seul porte une couleur** : `CricketKeypad.tsx:92-96` (`background:'#d90416'`, en doublon de la classe `bg-[#d90416]` l.88). |
| Classes avec `!important` (`!bg-…`) | **51**, réparties dans `Keypad.tsx`, `CricketKeypad.tsx`, `CapitalKeypad.tsx` et `VoiceScoringControl.tsx`. Elles écrasent les variantes de `Button`, signe que l'API de variantes est insuffisante. |
| Usages de `<Button>` / `<button>` bruts | 109 / 64. Variantes : `secondary` 57, `danger` 20, `primary` 8, `ghost` 1. |
| Dégradés | 69 |
| Fichiers les plus couplés (occurrences) | `CapitalKeypad.tsx` 131, `ChangelogModal.tsx` 119, `CapitalGameView.tsx` 73, `GotchaGameView.tsx` 70, `GameSelectionView.tsx` 67, `KillerGameView.tsx` 63, `Keypad.tsx` 63, `HomeView.tsx` 56 |
| Tests unitaires couplés aux classes de couleur | **10 assertions dans 4 fichiers** : `keypads.test.tsx:106`, `cricketScoreboard.test.tsx:24`, `VoiceScoringControl.test.tsx:28,34,45`, `matchScoring.test.ts:111-115` |

**Lecture.** Le couplage est **élevé mais homogène**. L'absence totale de `dark:` est un atout : il n'y a pas de double système à démêler. 83 % des usages reposent sur 100 classes, ce qui rend un codemod par table de correspondance réaliste. Le vrai coût se situe dans les **213 transparences blanc/noir**, les **100 valeurs arbitraires** (ombres et lueurs) et les dégradés : ils supposent un fond sombre et doivent être repensés plutôt que convertis mécaniquement.

### 2.3 Sémantique des couleurs de jeu (indicateurs)

[VÉRIFIÉ code] L'orange est **surchargé de sens**. Il désigne à la fois :
- la marque (logo, bouton primaire) ;
- le joueur actif : `PlayerScore.tsx:78` (barre dégradée), `:86` (nom), `CricketScoreboard.tsx:110-113` ;
- les triples : `CricketKeypad.tsx:65`, `CapitalKeypad.tsx:426` ;
- la victoire et le « gotcha possible » : `GotchaGameView.tsx:47,53` ;
- les vies du Killer : `KillerGameView.tsx:278` ;
- les cibles Cricket ouvertes : `CricketScoreboard.tsx:155` ;
- le minuteur et les manches : `MatchTopBar.tsx:36`, `MatchStatusPill.tsx:26,42`.

Conséquence directe pour la personnalisation : si un club choisit une couleur principale verte ou rouge, il entre en collision avec « fermé » (vert) ou « bust » (rouge).

[VÉRIFIÉ code] **Les multiplicateurs sont incohérents d'un jeu à l'autre, et à l'intérieur même de Capital.**

| Contexte | Simple | Double | Triple | Bull 25 | Bull 50 |
|---|---|---|---|---|---|
| Cricket (`CricketKeypad.tsx:37,51,65,77,88`) | blanc/slate | **cyan** | **orange** | émeraude | rouge `#d90416` |
| X01 (`Keypad.tsx:144,174,235`) | — | cyan (raccourcis) | orange (raccourcis) | — | — |
| Capital, mode plateau (`CapitalKeypad.tsx:82-86`) | **sky/bleu** | **émeraude** | **rouge** | émeraude (l.107) | rouge (l.106) |
| Capital, boutons fixes (`CapitalKeypad.tsx:424-426`) | gris | **cyan** | **orange** | — | rouge `red-600` (l.314) |

Autres états de jeu :
- Bust : rouge (`matchFeedback.ts:7-11`, `GotchaGameView.tsx:50`).
- Cible fermée : `green-500` avec lueur (`CricketScoreboard.tsx:51`).
- Fermée par tous : `gray-700` barré (`:49`, `:155`).
- Joueur éliminé au Killer : `red-300/70` barré (`KillerGameView.tsx:270`).

Couleurs d'identité des jeux : dégradés codés en dur dans `GameSelectionView.tsx:38-84`. X01 orange/rouge, Triathlon jaune/ambre, Cricket émeraude/lime, Capital violet/fuchsia, Gotcha cyan/bleu, Killer rose/rouge. Ces couleurs ne sont pas réutilisées dans les écrans de jeu, à l'exception partielle de Triathlon (`TriathlonGameView.tsx:236`).

Point positif [VÉRIFIÉ code] : le joueur actif X01 est signalé par **plusieurs indices**, et pas seulement par la couleur : fond `gray-800`, barre supérieure, nom orange, score blanc contre gris, badge du lanceur (`PlayerScore.tsx:71-113`). En Cricket, le X entouré marque la fermeture et le barré marque « fermé par tous ». C'est conforme à WCAG 1.4.1 (l'information ne repose pas sur la seule couleur) et à préserver.

### 2.4 États interactifs, focus, animations

- **Focus clavier.** **0 `focus-visible:`** et 0 `ring-` dans tout le code [VÉRIFIÉ code]. `Button.tsx:15` applique `focus:outline-none`, ce qui couvre les 109 usages. `CricketKeypad.tsx` retire aussi le focus (`releaseButtonFocus` + `focus:outline-none`). Or l'app propose des raccourcis clavier (`src/features/x01/hooks/useMatchShortcuts.ts`), et des utilisateurs de clavier existent donc. **Non-conformité WCAG 2.4.7.**
- **Survol.** 151 `hover:`. Ils sont peu utiles en tactile mais inoffensifs.
- **Pression.** `active:scale-95` (13) et `active:scale-[0.98]` (6). Il n'y a pas d'état « pressé » coloré homogène.
- **Désactivé.** Les valeurs d'opacité varient : `disabled:opacity-40/50/60/80/100`. Aucune règle unique.
- **Animations.**
  - **`animate-in fade-in` (6 usages) ne produit rien.** Ces classes viennent du plugin `tailwindcss-animate` / `tw-animate-css`, absent de `package.json`, et sont absentes du CSS généré [VÉRIFIÉ code + build]. Usages : `MatchView.tsx:664,679,772`, `CricketGameView.tsx:247`, `CapitalGameView.tsx:144`, `ChangelogModal.tsx:11`.
  - `animate-pulse` est **continu** : `CheckoutHint.tsx:14`, badge du lanceur `PlayerScore.tsx:110`, `CapitalGameView.tsx:233`.
  - 37 `transition-all` (coût de performance potentiel sur matériel ancien) [HYPOTHÈSE].
- **Mouvement réduit.** **0 prise en compte de `prefers-reduced-motion`** (`motion-reduce:` absent, aucune media query) [VÉRIFIÉ code]. WCAG 2.3.3 (AAA) n'est pas visé, mais c'est une bonne pratique attendue, en particulier pour les pulsations permanentes.

### 2.5 Contrastes (WCAG 2.x) [CALCUL]

| Paire (usage réel) | Ratio | Seuil | Verdict |
|---|---|---|---|
| `text-white` / fond de jeu `#06080d` | 20,0 | 4,5 | OK |
| `gray-400` (libellés secondaires) / `#06080d` | 7,7 | 4,5 | OK |
| `gray-500` (libellés, 90 usages) / `#06080d` | 4,14 | 4,5 | **Échec** (texte de 10-12 px) |
| `gray-500` « Application officielle… » / `#05070b` (`HomeView.tsx:146`) | 4,17 | 4,5 | **Échec** |
| `gray-500` libellés stats / carte active `gray-800` (`PlayerScore.tsx:138-156`) | 3,03 | 4,5 | **Échec** |
| **`gray-700` score X01 du joueur inactif / noir** (`PlayerScore.tsx:125`) | **2,04** | 3 (grand texte) | **Échec**. Le score adverse est une information de jeu essentielle. |
| `gray-600` nom du joueur inactif / noir (`PlayerScore.tsx:86`) | 2,78 | 3 (grand) | **Échec** |
| `gray-700` « fermé par tous » / `slate-800` (`CricketScoreboard.tsx:49`) | 1,42 | — | Choix volontaire (état « mort », doublé par le barré). Acceptable mais limite pour la TV. |
| `orange-500` nom actif / `gray-800` | 5,2 | 4,5 | OK |
| `orange-500` manches / `gray-900` | 6,3 | 3 | OK |
| Blanc / `orange-600` (début du dégradé primaire, `Button.tsx:19`) | 3,57 | 4,5 (texte de 14 px en gras) | **Échec** côté gauche du dégradé, OK en taille `lg` |
| Blanc / `red-600` (fin du dégradé) | 4,87 | 4,5 | OK |
| Noir / `orange-500` (badge lanceur) | 7,4 | 4,5 | OK |
| Blanc / `orange-500` (si réutilisé en mode clair) | 2,82 | 4,5 | Interdit en clair |
| `orange-500` / blanc (texte orange sur fond clair) | 2,82 | 4,5 | **Interdit en clair** : il faut un orange foncé |
| Blanc / D-BULL `#d90416` | 5,3 | 4,5 | OK |
| `green-500` fermé / `slate-800` | 6,5 | 3 | OK |
| Bordure `white/10` / fond | 1,24 | 3 (non-texte, 1.4.11) | Faible. Touches de pavé `slate-800` sur `#0b1019` : 1,3. Le libellé identifie la touche, ce qui reste tolérable mais fragile en TV ou en plein soleil. |

**Synthèse.** Le thème sombre actuel est **globalement lisible sur le texte principal**. Il échoue en revanche sur **les états atténués** (inactif, secondaire, désactivé), précisément les informations utiles à distance, en mode TV et en mode tablette sur pied.

### 2.6 Méta, manifeste, PWA

- `index.html:7` : `<meta name="theme-color" content="#1a1a1a">`, qui est **statique**. `manifest.json` : `background_color #1a1a1a`, mais `theme_color #ea580c` (orange). **Incohérence** entre la méta et le manifeste, et entre `#1a1a1a` et les fonds réels des écrans (`#05070b`, `#06080d`, noir). On peut s'attendre à une bande de couleur à l'overscroll et dans la barre d'état [HYPOTHÈSE visuelle, à confirmer sur appareil].
- `apple-mobile-web-app-status-bar-style: black-translucent` (`index.html:10`) : à revoir en mode clair, car le texte de la barre d'état est blanc sur fond clair.
- La spec 031 (PWA, *planned*) touche le manifeste. Toute évolution de `theme_color` doit y être coordonnée.

### 2.7 Contraintes de compatibilité structurantes

- **Tailwind 4 vise Safari ≥ 16.4, Chrome ≥ 111, Firefox ≥ 128** [VÉRIFIÉ source externe, https://tailwindcss.com/docs/compatibility].
- Le CSS généré place toutes les utilitaires dans `@layer utilities`, avec `@property`, `color-mix()` (205 blocs `@supports`) et `lab()` [VÉRIFIÉ build].
- La spec 018 (iOS 12, iPad Air) et `vite.config.ts:29-33` (`ios >= 12`) ne traitent que le JS legacy, `gap`, `clamp` et `backdrop-filter`.
- **[HYPOTHÈSE forte, À CONFIRMER sur appareil]** Safari < 15.4 ignore les blocs `@layer`. Sur iOS 12, la quasi-totalité des utilitaires Tailwind ne s'appliquerait donc pas. La divergence entre la spec 018 (« compatibilité rétablie », `docs/release/v1.0.2.md:25`) et le passage à Tailwind 4 (`b57b9c8`, 27/03/2026) doit être vérifiée. Cela sort de mon périmètre mais **conditionne les choix de tokens** : les variables CSS fonctionnent dès Safari 9.1, contrairement à `oklch`, `color-mix` et `@layer`.
- **CSP** (`public/_headers`) : `script-src 'self' 'unsafe-inline'` autorise un script inline anti-FOUC. `img-src 'self' data: blob: https:` autorise un logo en `data:` ou `blob:`. `style-src 'unsafe-inline'` autorise des variables CSS inline. Aucune modification n'est requise [VÉRIFIÉ code].
- **QR code** : le paquet `qrcode` figure dans `dependencies` mais **n'est utilisé qu'au build** (`scripts/generate-app-qr.mjs`). Le QR de partage est un SVG statique (`HomeView.tsx:44`, `/app-qr.svg`). Générer un QR de thème à l'exécution **ajouterait `qrcode` au bundle client**. C'est une divergence avec la formulation de la mission (« déjà présente »). Le coût est à mesurer, de l'ordre de 10-15 Ko gzip [HYPOTHÈSE].

### 2.8 Persistance existante

- `localStorage` : session applicative de repli et drapeaux de mise à jour (`utils/appPersistence.ts:1-74`), avec lecture et écriture synchrones protégées par `try/catch`.
- IndexedDB : `bougnat-counter-local` (sessions, matchs courants, historique), avec un repli sur localStorage (`IndexedDBSessionRepository.ts:10,39,246-260`).
- Aucune préférence utilisateur globale (thème, langue…) n'est persistée aujourd'hui, et il n'existe pas d'écran « Réglages » global. Seul `MatchSettingsModal` (« Options de jeu ») existe, en cours de match.
- `externalMatchLink.ts` fournit un **modèle à suivre** pour un lien de thème : module pur sans DOM ni réseau, contrat versionné (`EXTERNAL_MATCH_CONTRACT_VERSION`), validation stricte avec motifs de rejet typés, plafonds (`MAX_NAME_LENGTH`) et `feature-disabled`.

### 2.9 Tests visuels et d'accessibilité

- Playwright : 7 projets (desktop, 3 tablettes, 3 smartphones), uniquement des tests *smoke*. **Aucun `toHaveScreenshot`, aucun axe-core** [VÉRIFIÉ code].
- Aucun test de contraste.

---

## 3. Problèmes, dettes, incohérences

| # | Problème | Gravité | Réf. |
|---|---|---|---|
| P1 | Aucune couche de tokens. Le mode Light et la personnalisation sont impossibles sans migration des 1 465 usages. | **Bloquant V2** | §2.2 |
| P2 | 213 transparences blanc/noir et 100 lueurs ou ombres arbitraires qui supposent un fond sombre. | Élevée | §2.2 |
| P3 | Orange surchargé (marque, actif, triple, victoire, vies, minuteur). La personnalisation de la couleur principale casse la sémantique de jeu. | **Élevée (5.7)** | §2.3 |
| P4 | Couleurs des multiplicateurs incohérentes entre jeux et au sein de Capital. | Moyenne (UX, apprentissage) | §2.3 |
| P5 | Aucun focus visible (WCAG 2.4.7). | Élevée (a11y) | §2.4 |
| P6 | Contrastes insuffisants des états atténués : score inactif 2,04, nom inactif 2,78, libellés `gray-500` 3,0-4,2, début du dégradé primaire 3,57. | Élevée (lisibilité TV, tablette) | §2.5 |
| P7 | Classes `animate-in fade-in` mortes (6), pulsations continues, aucun `prefers-reduced-motion`. | Faible à moyenne | §2.4 |
| P8 | 10 nuances quasi noires et un fond du `body` différent des écrans. Méta et manifeste incohérents. | Moyenne | §2.2, §2.6 |
| P9 | `!important` utilisé 51 fois pour contourner `Button`. API de variantes insuffisante (pas de variantes keypad, success, ni tone). | Moyenne | §2.2 |
| P10 | Mot-symbole BOUGNAT DARTS dupliqué 6 fois et absent de Killer, Gotcha et Setup. Il n'y a pas de point d'ancrage unique pour le co-branding. | Moyenne (5.7) | §2.1 |
| P11 | `matchFeedback.ts` (couche features) renvoie des classes Tailwind. | Faible (archi) | §2.1 |
| P12 | Tests couplés aux noms de classes de couleur (10 assertions). | Faible (coût de migration) | §2.2 |
| P13 | Compatibilité iOS 12 et Tailwind 4 non démontrée. Elle conditionne le choix de format des tokens. | **À confirmer, potentiellement élevée** | §2.7 |
| P14 | Style du `body` dupliqué (`index.html` et `tailwind.css`). | Faible | §2.1 |
| P15 | Polices système pour les scores, sans `tabular-nums`. Le rendu varie selon l'OS, ce qui est sensible en TV. | Faible | §2.1 |

---

## 4. Solutions comparées et recommandation

### 4.1 Options d'architecture de thèmes

| Option | Principe | Light/Dark | Personnalisation runtime (couleurs arbitraires) | Duplication | Dépendance | Perf | Verdict |
|---|---|---|---|---|---|---|---|
| **A. Variables CSS (tokens) + Tailwind 4 `@theme inline`** | Les utilitaires (`bg-surface`, `text-fg`…) pointent vers des `var(--…)`. Le thème est un jeu de valeurs posé sur `<html data-theme>`, plus des surcharges inline pour le thème personnalisé. | Oui | **Oui, nativement** (`style.setProperty`) | Aucune : 1 classe = 1 rôle | Aucune | Changement de thème instantané, sans re-render React | **Recommandée** |
| B. Classes `dark:` partout | Chaque couleur est doublée (`bg-white dark:bg-gray-900`). | Oui | **Non** (couleurs connues au build). Exigerait un 2e système pour 5.7. | ×2 (≈ 2 900 classes) | Aucune | OK | Rejetée : contraire à la demande « pas trois systèmes » |
| C. CSS-in-JS (Emotion, styled-components) | Thème dans un contexte React. | Oui | Oui | Cohabitation avec Tailwind | +1 dépendance runtime | Coût de sérialisation runtime, re-render à chaque changement | Rejetée : refonte, nouvelle dépendance, aucun gain sur A |
| C'. vanilla-extract / Panda (build-time) | Tokens typés compilés. | Oui | Partielle (via vars) | Réécriture | +1 outil de build | OK | Rejetée : réécriture des 48 fichiers sans bénéfice sur A |
| D. Feuilles multiples (`dark.css`/`light.css` échangées) | Remplacement de `<link>`. | Oui | Non | Forte | Aucune | Flash au changement | Rejetée |
| E. Bibliothèque de thèmes (daisyUI…) | Thèmes prêts à l'emploi. | Oui | Partielle | — | +1 dépendance | OK | Rejetée : identité générique, contraire à « identité propre » |

**Recommandation : option A.** Justification :
- c'est le seul mécanisme qui sert **à la fois** Light, Dark, le thème club et la TV sans système parallèle ;
- il est natif à Tailwind 4 (`@theme inline`, `@custom-variant`) [VÉRIFIÉ source externe] ;
- il n'ajoute aucune dépendance ;
- les variables CSS sont prises en charge depuis Safari 9.1, ce qui reste compatible avec la contrainte iOS 12 si on évite `oklch` et `color-mix` dans les tokens critiques.

### 4.2 Architecture cible : tokens à trois niveaux

Proposition d'organisation des fichiers, illustrative et à valider. Les noms seront fixés en spec.

```
src/styles/
  tailwind.css            # @import "tailwindcss"; @import des tokens; règles layout existantes
  tokens/primitives.css   # Niveau 1 : palettes brutes (hex sRGB), échelles radius/ombre/motion
  tokens/themes.css       # Niveau 2 : [data-theme=dark] / [data-theme=light] → rôles sémantiques
  tokens/components.css   # Niveau 3 : quelques tokens de composants (bouton primaire, touche, scoreboard, TV)
  tokens/tailwind-bridge.css  # @theme inline { --color-surface: var(--bd-surface); … }
src/features/theming/      # PUR (aucun DOM) : types ThemeDescriptor, presets, validation,
                           #   contraste WCAG, dérivation de couleurs, (dé)sérialisation versionnée
src/infrastructure/web/themeDom.ts      # applique data-theme, variables CSS, meta theme-color, color-scheme
src/infrastructure/local/themeStorage.ts # localStorage (préférence + thème actif), IndexedDB (logos)
src/presentation/theme/                  # ThemeProvider / useTheme, ThemeToggle, BrandMark, éditeur
index.html                               # script inline anti-FOUC (≤ 1 Ko)
```

**Niveau 1, primitives.** Elles ne sont jamais utilisées directement dans le JSX. Exemples : `--bd-ember-50…950` (orange et rouge de la marque), `--bd-ink-0…1000` (neutres à dominante froide pour le sombre), `--bd-chalk-0…1000` (neutres chauds pour le clair), `--bd-green-*`, `--bd-cyan-*`, `--bd-red-*`. Échelles non colorées : `--bd-radius-*` (le `rounded-[1.75rem]` actuel devient `--radius-card`), `--bd-shadow-*`, `--bd-duration-*`, `--bd-ease-*`. **Valeurs en hex ou rgb**, sans oklch, pour iOS 12 (voir P13).

**Niveau 2, rôles sémantiques.** Ce sont les seuls exposés à Tailwind.

| Famille | Tokens (préfixe `--color-` côté Tailwind) | Personnalisable 5.7 ? |
|---|---|---|
| Surfaces | `canvas`, `surface`, `surface-raised`, `surface-sunken`, `scrim` (voile des modales) | Oui, en dérivé : teinte de surface |
| Bordures | `border-subtle`, `border`, `border-strong` | Dérivé |
| Texte | `fg`, `fg-muted`, `fg-subtle`, `fg-disabled`, `fg-inverse` | Non : dérivé automatiquement pour garantir le contraste |
| Marque | `brand`, `brand-hover`, `brand-pressed`, `on-brand`, `brand-fg` (version « texte » sûre), `brand-subtle`, `brand-2` (fin du dégradé), `accent`, `on-accent` | **Oui : graines brand, brand-2, accent** |
| Feedback | `success`, `danger`, `warning`, `info` (+ `on-*`, `*-subtle`) | Non |
| Focus | `focus-ring` | Non (dérivé, contraste ≥ 3:1) |
| **Jeu (réservé)** | `game-active`, `game-score`, `game-score-inactive`, `game-bust`, `game-win`, `game-closed`, `game-dead`, `game-single`, `game-double`, `game-triple`, `game-bull`, `game-dbull`, `game-eliminated` | **Non** (V2). Seul `game-active` peut suivre la marque, sous garde-fou. |
| Identité des jeux | `game-x01`, `game-cricket`, `game-capital`, `game-gotcha`, `game-killer`, `game-triathlon` | Non |

**Niveau 3, composants.** Ils restent limités à ce qui a vraiment besoin d'un réglage dédié :
- `--button-primary-from` / `--button-primary-to` (par défaut `brand` vers `brand-2`) ;
- `--keypad-key-bg` et `--keypad-key-border` ;
- `--scoreboard-active-bg` ;
- `--tv-*` (taille du score, densité). Le mode TV réutilise les rôles du niveau 2, avec seulement quelques surcharges de taille.

**Pont Tailwind** (extrait, conforme à https://tailwindcss.com/docs/theme) :
```css
@theme inline {
  --color-canvas: var(--bd-canvas);
  --color-surface: var(--bd-surface);
  --color-fg: var(--bd-fg);
  --color-brand: var(--bd-brand);
  --color-game-bust: var(--bd-game-bust);
  /* … */
}
@custom-variant light (&:where([data-theme=light], [data-theme=light] *));
@custom-variant dark  (&:where([data-theme=dark],  [data-theme=dark] *));
```
Les variants `light:` et `dark:` restent des **échappatoires exceptionnelles**, par exemple pour une illustration. La règle visée est 0 `dark:` dans les composants.

Fin de migration : `@theme { --color-*: initial; }` supprime la palette par défaut. Une classe comme `bg-gray-800` **ne génère alors plus rien**, ce qui interdit structurellement la réintroduction de couleurs brutes. Pendant la migration, un **cliquet** dans `scripts/guard-clean-codebase.sh` fait échouer la CI si le nombre de classes de palette brute augmente, en partant du compteur actuel de 1 465.

**Opacité et `color-mix`.** Tailwind 4 compile `bg-brand/20` en `color-mix()`, non pris en charge par Safari < 16.2. Pour les tokens critiques, il vaut mieux **pré-calculer les variantes** (`brand-subtle`, `scrim`) en hex ou rgba, au build pour les thèmes officiels et en JS pour les thèmes personnalisés, que de s'appuyer sur `/xx`.

### 4.3 Sélection du thème, persistance, anti-FOUC

- **Modèle de préférence.** `{ mode: 'system' | 'dark' | 'light', customThemeId?: string }`. La valeur par défaut est `system`.
- **Thème effectif.** Le mode `system` suit `matchMedia('(prefers-color-scheme: light)')`, avec un écouteur de changement. Un thème club s'applique **par-dessus** le mode effectif : il contient des graines, pas un mode figé.
- **Persistance.**
  - `localStorage['bougnat-theme-v1']` contient la préférence et le **descripteur du thème actif sans logo** (< 1 Ko). La lecture synchrone est nécessaire contre le FOUC.
  - Les logos sont des Blobs dans IndexedDB, dans un nouveau store de la base existante ou dans une base dédiée. Ils sont chargés de façon asynchrone et ne sont pas critiques au premier rendu.
  - Note iOS 12 : le stockage de `Blob` dans IndexedDB était peu fiable sur les anciens Safari [HYPOTHÈSE]. Il faut prévoir un repli en `ArrayBuffer` ou en data URL.
- **Anti-FOUC.** Un script inline dans le `<head>` de `index.html`, autorisé par la CSP actuelle, lit `localStorage` et pose :
  - `data-theme` sur `<html>` ;
  - les surcharges CSS du thème club (variables déjà dérivées, stockées telles quelles pour éviter tout calcul au boot) ;
  - `color-scheme` ;
  - la méta `theme-color`.

  Ce script ne contient aucune logique métier et reste ES5 (iOS 12). Le style inline du `body` (`index.html:21-28`) est supprimé au profit de `background: var(--bd-canvas)`.
- **Méta.**
  - `theme-color` est mis à jour dynamiquement. On ajoute en plus deux balises statiques `<meta name="theme-color" media="(prefers-color-scheme: light|dark)">` pour le premier rendu.
  - `apple-mobile-web-app-status-bar-style` est à arbitrer : `default` en clair ou `black-translucent` partout [À CONFIRMER sur iOS].
  - Manifeste : `background_color` doit être aligné sur le canvas sombre, en coordination avec la spec 031.
- **Points d'accès UI** (sans toucher au parcours de base) :
  - icône soleil/lune/auto dans le pied de page de l'accueil ;
  - bascule rapide dans `MatchSettingsModal`, utile en cas de reflet en cours de partie ;
  - l'entrée « Personnaliser (clubs et bars) » est discrète, dans le pied de page de l'accueil.

### 4.4 Transmission du thème à l'écran TV

- Le format pivot est le **`ThemeDescriptor` sérialisable**, unique pour le stockage, l'export, le lien, le QR et la TV :
  ```ts
  type ThemeDescriptor = {
    schema: 1;
    id: string;             // uuid local
    name: string;           // ≤ 32 car., nettoyé (cf. externalMatchLink MAX_NAME_LENGTH)
    orgName?: string;       // ≤ 40 car.
    seeds: { brand: Hex; brand2?: Hex; accent?: Hex; surfaceTint?: Hex };
    preferredMode?: 'dark' | 'light';    // suggestion, l'utilisateur garde la main
    logo?: { ref: string /* sha-256 */; mime: 'image/webp'|'image/png'; w: number; h: number; bytes: number };
    branding?: { placement: 'header' | 'corner' }; // la mention Bougnat n'est PAS paramétrable
  };
  ```
- La TV reçoit le descripteur, soit au moment du jumelage, soit dans le premier message d'état, puis applique **la même fonction `applyTheme()`** que la tablette. Le logo est transmis une seule fois, adressé par son hash, et mis en cache côté TV. Il n'est pas renvoyé à chaque mise à jour de score.
- Le mode de la TV (sombre ou clair) est indépendant de celui de la tablette. Par défaut, il est **sombre** : meilleure lisibilité à distance sur les dalles LCD et OLED en salle tamisée, moins de halo [HYPOTHÈSE UX à valider en bar éclairé].
- Le transport (BroadcastChannel, WebRTC, relais…) relève du chantier 5.6. Le présent rapport impose seulement que le thème soit **un message de données (JSON)** et jamais du CSS ou du HTML brut, ce qui ferme toute injection.

### 4.5 Garde-fous

1. **Contraste automatique.** Une fonction pure `contrastRatio(a, b)` (WCAG 2.x) et `ensureContrast(fg, bg, target)` ajuste la luminance (dans l'espace OKLCH ou HSL, avec clamp au gamut sRGB) jusqu'à atteindre :
   - 4,5:1 pour le texte normal ;
   - 3:1 pour le grand texte et les éléments non textuels ;
   - un objectif de **7:1 pour les scores** en mode TV.

   Implémentation estimée à environ 150 lignes, **sans dépendance**. `culori` ou `chroma-js` ne sont pas justifiés à ce stade.
2. **Couleurs « on-* » dérivées.** `on-brand` et `on-accent` valent blanc ou noir selon le meilleur contraste. L'utilisateur ne choisit jamais la couleur du texte.
3. **Dérivation des états.** `brand-hover` et `brand-pressed` sont obtenus par un décalage de luminance (±6-10 % L). `brand-subtle` est un mélange pré-calculé avec `surface`. `brand-fg` est la version de la marque qui garantit 4,5:1 sur `canvas` et `surface`.
4. **Couleurs réservées aux indicateurs de jeu.**
   - Les tokens `game-*` ne sont pas personnalisables.
   - Une **distance perceptuelle minimale** est imposée (ΔE OKLab, seuil à calibrer, par exemple 0,12) entre `brand` et `game-bust`, `game-closed` et `game-success`. Si la marque est trop proche (club rouge ou vert), `game-active` **ne suit plus la marque** et repasse à la valeur officielle, avec un message explicite dans l'éditeur.
   - Le **doublage par la forme** (barre, anneau, icône, barré) est rendu obligatoire dans la spec pour tous les états de jeu (WCAG 1.4.1).
5. **Clamp des surfaces.** La teinte de surface personnalisée est limitée en chroma et en luminance selon le mode. En sombre, L ∈ [0,08 ; 0,22]. En clair, L ∈ [0,94 ; 1]. Une couleur choisie ne peut donc pas transformer un mode sombre en mode clair ou produire un fond saturé fatigant.
6. **Validation stricte du descripteur.** Schéma versionné, hex `#rrggbb` uniquement, longueurs bornées, champs inconnus ignorés, motifs de rejet typés (comme dans `externalMatchLink.ts`). **Jamais de CSS libre.**
7. **Repli.** Un descripteur invalide entraîne le retour au thème officiel et un message non bloquant. Un thème personnalisé ne peut jamais empêcher de jouer.

### 4.6 Stratégie de migration incrémentale

1. **Lot 0, socle (sans changement visuel).**
   - Fichiers de tokens.
   - Thème **Dark officiel = valeurs actuelles normalisées** : les 10 quasi-noirs sont réduits à 3 niveaux, à valider visuellement.
   - Pont `@theme inline`, script anti-FOUC, `ThemeProvider`.
   - `Button` réécrit sur les tokens, avec focus visible et variantes `keypad`, `success` et `tone`. Cela supprime les `!important`.
   - Composant `BrandMark` unique.
   - Cliquet CI.
2. **Lot 1, codemod.**
   - Un script (jscodeshift ou regex outillée, **hors runtime**, sans dépendance de production) applique une table de correspondance « classe brute → rôle » validée à la main pour les ~100 classes qui couvrent 83 % des usages.
   - Les cas ambigus (dégradés, lueurs, `white/x`) sont signalés pour traitement manuel.
3. **Lot 2, écran par écran.** Ordre suggéré, par valeur et par risque :
   1. accueil, sélection, setup ;
   2. X01 (`MatchView`, `PlayerScore`, `Keypad`, `MatchTopBar`, `MatchStatusPill`) ;
   3. Cricket ;
   4. Capital (unification des multiplicateurs) ;
   5. Killer et Gotcha ;
   6. Triathlon ;
   7. statistiques et modales ;
   8. `ChangelogModal` en dernier (contenu statique, 119 occurrences).
4. **Lot 3.** Activation du mode Light, une fois que tous les écrans sont migrés. Pas de mode Light partiel en production : au besoin, l'activer derrière un drapeau tant qu'un écran n'est pas migré.
5. **Lot 4.** Personnalisation et TV.
6. **Lot 5.** Verrouillage final : `--color-*: initial`.

Tests associés :
- les 10 assertions de classes de couleur sont remplacées par des attributs sémantiques (`data-state="bust"`, `data-multiplier="2"`) ;
- `matchFeedback.ts` renvoie une **intention** (`tone: 'bust' | 'miss' | 'notice' | 'info'`) et la présentation la traduit en classes (P11).

### 4.7 Tests du design system

- **Unitaires (Vitest)** : contraste, dérivation, clamp, validation et (dé)sérialisation du descripteur. Tests de propriétés sur un échantillon de couleurs aléatoires, avec un générateur maison pour éviter toute dépendance : *toute paire dérivée respecte les seuils*.
- **Contraste des thèmes officiels** : un test lit les valeurs de `themes.css` et vérifie une **matrice de paires déclarées** (fg/canvas, fg-muted/surface, on-brand/brand, game-score-inactive/canvas…) dans les deux modes.
- **Régression visuelle Playwright** (`toHaveScreenshot`) : écrans clés × {dark, light, thème club de test} × {smartphone, tablette paysage, desktop}, soit environ 30 captures.
  - Coût : stockage des captures dans le repo, environ 3-6 Mo [HYPOTHÈSE].
  - Le rendu doit être déterministe : polices système variables d'une plateforme à l'autre, donc captures générées dans le conteneur CI uniquement.
- **axe-core** (`@axe-core/playwright`, devDependency justifiée) pour le contraste et les rôles en E2E. Option à arbitrer.

---

## 5. Mode Light

### 5.1 Principes (ce qui ne doit pas être une inversion)

1. **Fond chaud cassé plutôt que blanc pur.** Un canvas `#f5f3ef`, façon « craie » ou papier, limite l'éblouissement en salle et garde la chaleur de l'identité. Les surfaces sont blanches et l'élévation se fait par **ombre douce et bordure**, et non par voile blanc.
2. **Orange de marque assombri pour le texte.** `orange-500` sur blanc donne 2,82:1, ce qui est interdit. On utilise un `brand-fg` à environ `#b93a00` (5,2:1 sur le canvas). Les grands aplats (bouton primaire) gardent le **dégradé « feu »** partagé par les deux modes, assombri pour le blanc : `#c94100` → `#b4161b`, soit 4,95 et 6,84:1.
3. **Lueurs remplacées par des contours.** Les `shadow-[0_0_15px_rgba(234,88,12,.8)]` (lueurs) sont invisibles sur fond clair. En clair, l'activité est signalée par un **anneau ou une barre pleine** et un **fond teinté** (`brand-subtle`, `#fff1e6`).
4. **Les scores restent l'élément le plus contrasté.** Score `#0d0b09` sur blanc : 19,6:1. Score inactif à **≥ 3:1**, environ `#857c72` (3,7 à 4,1:1), contre 2,04 aujourd'hui en sombre.
5. **Couleurs de jeu recalibrées par mode, avec la même teinte et la même signification.** Les doubles restent cyan, les triples orange, etc., mais avec des valeurs plus foncées en clair.
6. **Même géométrie, mêmes composants, mêmes animations.** Seules les valeurs des tokens changent.

### 5.2 Palettes proposées [CALCUL, à valider visuellement]

| Rôle | Dark « Braise » (proposé) | Ratio sur canvas | Light « Craie » (proposé) | Ratio sur canvas |
|---|---|---|---|---|
| canvas | `#06080d` | — | `#f5f3ef` | — |
| surface | `#0f141d` | — | `#ffffff` | — |
| surface-raised | `#182030` | — | `#ebe7e0` | — |
| fg | `#f5f5f4` | 18,4 | `#17140f` | 16,6 |
| fg-muted | `#b4bcc8` | 10,5 | `#4f4942` | 8,0 |
| fg-subtle | `#8a94a3` | 6,5 (4,8 sur raised) | `#6b635a` | 5,3 (4,8 sur raised) |
| game-score-inactive | `#6f7887` | 4,5 | `#857c72` | 3,7 |
| brand-fg (texte) | `#ff8b1a` | 8,6 | `#b93a00` | 5,2 |
| brand (aplat) + on-brand blanc | `#c94100` → `#b4161b` | 4,95 / 6,84 | identique | 4,95 / 6,84 |
| danger / bust | `#ff6568` | 7,0 | `#b4161b` | 6,2 |
| success / closed | `#22c55e` | 8,8 | `#13723a` | 5,4 |
| double | `#22d3ee` | 11,1 | `#0b6c86` | 5,4 |
| triple | = brand-fg | 8,6 | `#b93a00` | 5,2 |
| bull / d-bull (aplat + blanc) | `#0f7a4a` / `#c0121f` | 5,4 / 6,3 (blanc) | idem | idem |
| focus-ring | `#7dd3fc` | 12,0 | `#1d4ed8` | 6,1 |
| border (non-texte) | ≥ 3:1 pour les touches → `#4a5568` [À calibrer] | — | `#8f867b` | 3,2 |

Les noms « Braise » et « Craie » sont de simples propositions. Le clin d'œil à l'ardoise de comptage des pubs est un fil identitaire possible.

**Unification des multiplicateurs (correction de P4)**, proposée pour les deux modes : simple = neutre, double = cyan, triple = orange, bull = vert, d-bull = rouge. Cette correspondance reprend la convention de cible (anneaux rouge et vert, bulls vert et rouge) déjà employée par Cricket. **Capital est à aligner**, ce qui est une décision PO car cela touche l'habitude des joueurs.

### 5.3 Écrans de jeu, a11y, animations

- **Écrans de jeu.** Les fonds noirs pleins (`MatchView.tsx:650` `bg-black`) passent à `canvas`. La zone de saisie passe à `surface-sunken`. Les cartes joueur actives passent à `surface-raised` avec la barre `game-active`.
- **Lisibilité des scores.**
  - Ajouter `font-variant-numeric: tabular-nums` au token typographique des scores pour éviter les sauts de largeur (P15).
  - Une police de chiffres auto-hébergée (≈ 15-30 Ko woff2 en sous-ensemble chiffres) n'est **utile que pour la TV**. C'est une option P3 [HYPOTHÈSE de poids].
- **Accessibilité.**
  - Focus visible obligatoire via `focus-visible:ring-2 ring-focus-ring ring-offset-2 ring-offset-canvas` dans `Button` et dans les touches.
  - Respect de `prefers-contrast: more`, qui active des bordures `border-strong` et supprime les transparences (P3).
  - L'information n'est jamais portée par la seule couleur (règle déjà respectée, à formaliser).
- **Animations.**
  - Tokens `--duration-fast` (120 ms), `--duration-base` (200 ms) et `--duration-slow` (300 ms), plus un easing de référence.
  - Une **règle globale `@media (prefers-reduced-motion: reduce)`** neutralise les pulsations et les transformations d'échelle.
  - Les classes mortes `animate-in fade-in` sont supprimées ou implémentées en CSS natif : `@keyframes` plus une utilité `animate-fade-in` déclarée via `@theme --animate-*`, **sans plugin**.
  - Les `animate-pulse` continus (badge du lanceur, conseil de checkout) sont remplacés par une impulsion unique à l'apparition.
  - Les animations sont identiques dans les deux modes.

---

## 6. Personnalisation clubs et bars (5.7)

### 6.1 Éléments personnalisables : recommandation

| Élément demandé | Proposition | Justification |
|---|---|---|
| Couleur principale | **Oui**, graine `brand` | Cœur de l'appropriation |
| Couleurs secondaires et d'accent | **Oui**, `brand2` (fin du dégradé) et `accent`, **facultatives**. Dérivées automatiquement si absentes (analogue ou complémentaire). | 1 à 3 couleurs suffisent pour une identité |
| Fond et surfaces | **Teinte uniquement** (`surfaceTint`, chroma et luminance bornés) | Évite les fonds illisibles. Le mode reste maître de la luminosité. |
| Textes | **Non** (dérivés) | Garantit le contraste |
| Scores | **Non** (dérivés, objectif 7:1) | Lisibilité, cœur de produit |
| Boutons | Indirect (dérivés de `brand`) | Cohérence |
| Indicateurs de jeu | **Non**, sauf `game-active` qui peut suivre `brand` sous garde-fou ΔE | Sémantique de jeu, daltonisme |
| Logo | **Oui** (voir §6.3) | Fort levier d'adoption |
| Nom du club, du bar ou de l'organisation | **Oui** (≤ 40 car.) | Affiché dans l'en-tête de jeu et sur la TV |
| Éléments d'identification sur les écrans de jeu et la TV | **Oui**, via `BrandMark` et deux emplacements prédéfinis | Pas de mise en page libre |
| Images de fond | **Non en V2** (proposition à valider pour plus tard) | Nuit à la lisibilité des scores, poids, modération. Alternative : motif de grille existant (`HomeView.tsx:86`) teinté. |
| Presets | **Oui** : environ 6-8 presets officiels (Braise, Craie, Nuit bleue, Vert club, Bordeaux, Ardoise, Contraste élevé) | Démarrage en 1 tap pour un non-technicien |
| Polices personnalisées | **Non** | Lisibilité, poids, licences |

### 6.2 Éditeur visuel

Parcours proposé en un seul écran, avec un aperçu en direct :
1. **Choisir un preset**, ou « Partir de mes couleurs ».
2. **Couleur principale.** Sélecteur natif `<input type="color">` (pris en charge par iOS 12.2 et plus [À CONFIRMER]), champ hex, et **pipette sur le logo importé** : extraction de 3 à 5 couleurs dominantes par un échantillonnage canvas simple, sans dépendance.
3. **Couleur secondaire et teinte de fond**, facultatives et repliées par défaut (« Avancé »).
4. **Logo et nom.**
5. **Aperçu**, sous forme d'onglets ou de vignettes vivantes **rendues avec les vrais composants** et des données factices :
   - accueil ;
   - X01 en cours (joueur actif, bust) ;
   - Cricket (fermé) ;
   - **TV**.

   Les vignettes sont affichées en dark et en light côte à côte, avec le **badge de contraste** (OK, ajusté automatiquement, ou couleur de jeu non suivie).
6. Boutons « Restaurer les couleurs Bougnat », « Enregistrer », « Partager ».

Plusieurs profils sont gérés sous forme d'une liste locale de thèmes (≤ 10), dont un seul est actif. Cela couvre le cas d'un bar qui accueille deux clubs, sans compte.

L'éditeur est **chargé à la demande** (`lazy`, comme les vues dans `App.tsx:60-65`). Le parcours de base n'est pas impacté : poids nul au démarrage, hors script anti-FOUC.

### 6.3 Import du logo

- **Formats acceptés : PNG, JPEG, WebP.**
- **SVG : soit refusé, soit accepté uniquement via rasterisation.** On le charge dans un `<img>` via une URL `blob:`. Dans ce contexte, les scripts et les ressources externes du SVG sont désactivés par les navigateurs [HYPOTHÈSE fondée sur le modèle de sécurité SVG-as-image, à citer en spec]. On le dessine ensuite sur un canvas, puis on exporte en PNG ou WebP.
  - **Le balisage SVG n'est jamais injecté dans le DOM**, ce qui évite tout besoin de bibliothèque de nettoyage (DOMPurify) et toute surface XSS.
  - Risque résiduel : un SVG avec `foreignObject` peut « tainter » le canvas sur certains Safari, et l'export lève alors une `SecurityError`. Il faut capturer l'erreur et afficher « format non pris en charge ».
- **Limites.** Fichier source ≤ 2 Mo. Dimension maximale ≤ 4096 px avant traitement. **Sortie redimensionnée à 512 px sur le plus grand côté**, ce qui suffit pour la TV en 1080p dans un en-tête. Les logos très étirés (ratio > 4:1) sont refusés ou recadrés en zone de sécurité. **Poids stocké visé ≤ 100 Ko**.
- **Encodage.** WebP qualité 0,85 si `canvas.toBlob('image/webp')` est pris en charge, sinon PNG (Safari ancien) [À CONFIRMER].
- **Recadrage.** Un simple « ajuster » ou « remplir » plus un fond de pastille (transparent, clair, sombre) suffit en V2. Un vrai outil de recadrage interactif est **P3**.
- **Adaptation automatique.** Le logo est affiché dans un cadre de hauteur fixe par contexte (en-tête 28-40 px, TV 64-96 px), avec `object-fit: contain`. Une pastille de fond est ajoutée automatiquement si le contraste moyen entre le logo et la surface est trop faible, par exemple un logo noir en mode sombre (calcul de luminance moyenne sur le canvas).
- **Performance.** Le logo est décodé une fois, mis en cache sous forme d'`objectURL` et ne fait l'objet d'aucun re-render pendant le match.

### 6.4 Stockage et partage sans compte : comparatif

| Mécanisme | Contenu | Taille | Fonctionne hors ligne | Multi-appareil | Coût récurrent | Risques | Verdict |
|---|---|---|---|---|---|---|---|
| **localStorage** | Préférence + descripteur actif (sans logo) | < 1 Ko | Oui | Non | 0 € | Quota de 5 Mo, synchrone, vidé en navigation privée | **Oui** (indispensable à l'anti-FOUC) |
| **IndexedDB** | Bibliothèque de thèmes + logos (Blob ou ArrayBuffer) | ≤ 10 × 100 Ko | Oui | Non | 0 € | Éviction possible sous pression de stockage (Safari). `navigator.storage.persist()` est à demander [À CONFIRMER]. | **Oui** |
| **Fichier JSON exportable** (`.bougnat-theme.json`, logo en data URL) | Tout | ~ 5-140 Ko | Oui | Oui (AirDrop, mail, WhatsApp, clé USB) | 0 € | Fichier modifié à la main : validation stricte | **Oui, mécanisme complet de référence** |
| **Lien encodé dans l'URL** (`?theme=1.<base64url>`) | Couleurs + nom, **sans logo** | ~ 150-300 car. | Oui | Oui | 0 € | Longueur. Le logo ne passe pas (20-100 Ko en base64 dépasse la taille raisonnable d'une URL). | **Oui, pour les couleurs** |
| **QR code du lien** | Idem lien | Un QR de version ~8-12 suffit pour 300 car. (capacité maximale 2 953 octets en binaire, version 40-L [VÉRIFIÉ source externe, Wikipedia/ISO 18004]) | Oui | Oui (scan par les membres au club) | 0 € | +10-15 Ko gzip de `qrcode` dans le bundle [HYPOTHÈSE], chargé en lazy dans l'éditeur | **Oui**, gros gain d'usage en club |
| **Code court via serveur** (Pages Function + **KV** pour le JSON, **R2** pour les logos) | Tout, adressé par un code de 6-8 caractères | — | Lecture seule hors ligne après premier chargement | Oui | Offre gratuite KV : 100 000 lectures/jour, **1 000 écritures/jour**, 1 Go, valeur ≤ 25 Mio [VÉRIFIÉ https://developers.cloudflare.com/kv/platform/pricing/ et /limits/]. Offre gratuite R2 : 10 Go-mois, 1 M d'opérations A, 10 M d'opérations B par mois, sortie gratuite [VÉRIFIÉ https://developers.cloudflare.com/r2/pricing/]. Au-delà : plan Workers payant (5 $/mois minimum) [HYPOTHÈSE d'après la tarification publique]. | **Modération** (logos offensants ou contrefaits hébergés sous le domaine Bougnat), abus (spam d'écritures : limitation de débit, Turnstile), RGPD (données d'une organisation, purge), **le repo devient opérateur de contenu**, en tension avec CONTRIBUTING (« pas de backend métier »). | **Non en V2.** À réévaluer en V2.x si une demande réelle apparaît. |

**Recommandation.**
- Stockage : **localStorage** pour le thème actif et l'anti-FOUC, **IndexedDB** pour la bibliothèque de thèmes et les logos.
- Partage :
  1. **fichier JSON** (complet, avec logo) ;
  2. **lien et QR** (couleurs et nom, avec la mention « logo à importer séparément », ou import du fichier) ;
  3. **pas de serveur** en V2.

  Le flux type d'un club : le responsable crée le thème, puis imprime ou affiche le QR au club. Les membres scannent et obtiennent les couleurs et le nom. Le logo s'ajoute en une fois avec le fichier envoyé sur le groupe WhatsApp du club.
- Variante à arbitrer, **sans serveur**, pour faire passer le logo dans le lien : le logo est **re-rasterisé à 64 px et en ≤ 4 couleurs** (≈ 1-2 Ko en base64, ce qui rend l'URL et le QR plus denses mais encore lisibles). Gain d'usage réel, mais logo dégradé. C'est une décision du PO.

### 6.5 Mention « Powered by Bougnat Darts » non désactivable

Règle technique : la mention est rendue par `BrandMark`/`CoBrandFooter`, **hors du `ThemeDescriptor`**. Aucun champ ne la masque. Ses couleurs sont dérivées pour rester lisibles (contraste ≥ 4,5:1), avec une **taille minimale** fixée en spec. Un test E2E vérifie sa présence sur tous les écrans de jeu et la TV, quel que soit le thème.

Quatre propositions graphiques (non exclusives, à arbitrer) :

1. **« Logo club × Bougnat Darts » en en-tête.** Sur les écrans de jeu, le `MatchTopBar` actuel affiche `[logo club] Nom du club` à gauche, puis un séparateur fin et le **mot-symbole BOUGNAT DARTS réduit**, monochrome `fg-subtle`. Sur la TV, le bandeau supérieur reprend la même composition à plus grande échelle. Avantage : se substitue proprement au mot-symbole déjà présent, sans surface supplémentaire.
2. **Signature de coin « Powered by Bougnat Darts ».** Petite pastille fixe en bas à droite de la TV et en pied de l'accueil, avec le pictogramme de cible et le texte. Elle est discrète mais permanente. Sur tablette, elle est placée dans l'en-tête plutôt qu'en coin, pour ne pas gêner le pavé tactile.
3. **Écran d'intermède co-brandé (TV).** Entre deux manches ou pendant l'attente : grand logo club, « Scoring par Bougnat Darts » et **QR « Jouez avec Bougnat Darts »** vers l'app, sans publicité. C'est un levier d'acquisition fort en bar.
4. **Liseré ou filigrane de marque.** Fin liseré au dégradé « feu » en pied d'écran TV, avec la mention en petites capitales. C'est l'identité Bougnat la plus discrète. Il reste lisible même avec un thème club très coloré, car sa couleur n'est pas personnalisable.

Recommandation : **1 sur les écrans de jeu, 1 + 2 + 3 sur la TV**. L'option 4 est une alternative graphique à soumettre au design.

### 6.6 Potentiel d'adoption

- **Club.** Une interface aux couleurs du club, partagée par QR, permet un passage rapide à l'app pour les membres, avec un sentiment d'outil officiel du club. Chaque membre devient un utilisateur individuel potentiel.
- **Bar.** Une TV aux couleurs du bar affiche la mention et le QR « Jouez avec Bougnat Darts ». C'est une **visibilité passive auprès de clients qui jouent déjà aux fléchettes**, sans publicité.
- **Synergies.**
  - Mode TV (5.6) : la personnalisation multiplie la valeur perçue de la TV.
  - Lien de match externe (spec 030) : un organisateur pourrait un jour joindre un thème à ses liens, à étudier.
  - Scoring vocal : aucun impact.
  - Tablette (5.3) : le thème clair améliore la lisibilité près de la cible éclairée.
- **Garde-fou de simplicité.** Pour l'utilisateur individuel, **rien ne change** : thème `system` par défaut, aucune question au démarrage, entrée de personnalisation discrète.
- **Mesure (sans tracking intrusif).** L'analytique existante (Cloudflare Web Analytics, `index.tsx:19-33`) est agrégée et sans cookie. On peut compter les visites portant `?theme=` [HYPOTHÈSE sur la capacité de filtrage de CF Web Analytics, à confirmer]. Aucune donnée de thème n'est remontée.

---

## 7. Bénéfices, contraintes, risques

**Bénéfices**
- Un seul système pour Light, Dark, club et TV.
- Correction des dettes a11y : focus, contrastes des états atténués.
- Cohérence des couleurs de jeu.
- Personnalisation sans backend ni compte.
- Levier d'adoption clubs et bars sans publicité.

**Contraintes**
- Migration lourde : 48 fichiers, 1 465 usages, 213 transparences, 100 valeurs arbitraires.
- Gel partiel des évolutions visuelles pendant les lots 1-2, et coordination avec la refonte tablette (5.3), qui touche les mêmes fichiers.

**Risques**
| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Conflits de fusion avec 5.3 (tablette) et 5.5 (revue des jeux) | Élevée | Moyen | Migrer chaque écran **dans la même PR** que sa refonte tablette ou jeu, ou faire les tokens **avant** 5.3 |
| Régression visuelle silencieuse du mode sombre | Moyenne | Moyen | Lot 0 « sans changement visuel », plus captures Playwright avant et après |
| iOS 12 : `@layer`, `color-mix` et oklch rendent les tokens sans effet | Inconnue | Élevé pour ces utilisateurs | Vérification sur appareil préalable (P13). Tokens en hex. Décision PO sur le maintien de iOS 12. |
| Thème club illisible malgré les garde-fous (logo, teintes) | Faible | Moyen | Clamp, contrastes auto, aperçu, bouton « Restaurer » |
| Logo inapproprié affiché en bar | Faible | Image | Pas d'hébergement serveur, donc responsabilité locale. Aucune galerie publique. |
| Dérive « white label » | Faible | Identité | Mention codée hors descripteur, test E2E |

---

## 8. Propositions de spécifications

Nomenclature du repo : `NNN-counter-<slug>`. Les IDs ci-dessous sont provisoires.

| ID provisoire | Titre | Origine | Description | Valeur | Complexité | Priorité | Dépendances |
|---|---|---|---|---|---|---|---|
| **V2-DS-00** | Étude : compatibilité réelle iOS 12 et Tailwind 4 (`@layer`, `color-mix`, oklch) | Étude exploratoire | Test sur iPad Air iOS 12 et simulateur. Décision : maintien, repli CSS ou abandon de la cible. Conditionne le format des tokens. | Évite de bâtir sur une hypothèse fausse | S | **P0** | Spec 018 (à réviser selon le résultat) |
| **V2-DS-01** | Fondations design tokens (3 niveaux) et pont Tailwind 4 | Reco archi / Demande V2 | Primitives, rôles sémantiques, tokens de composants, `@theme inline`, `@custom-variant`. Dark officiel = valeurs actuelles normalisées. Suppression du style dupliqué du `body`. | Prérequis de 5.2, 5.6 et 5.7 | M | **P0** | V2-DS-00 |
| **V2-DS-02** | Composants de base thémables et accessibles | Reco UX/UI | `Button` v2 (variantes keypad, success, tone ; focus visible ; fin des `!important`), `BrandMark`, `Surface`/`Card`, `IconButton`. Focus visible généralisé (WCAG 2.4.7). | Réduit la duplication, a11y | M | **P0** | DS-01 |
| **V2-DS-03** | Migration des écrans vers les tokens (codemod et lots par écran) + cliquet CI | Reco archi | Table de correspondance, script de codemod hors runtime, ordre des écrans, cliquet dans `guard-clean-codebase.sh`, verrouillage final `--color-*: initial`. Tests migrés vers `data-state`. | Rend Light et thèmes possibles | **L** | **P0** | DS-01, DS-02. **À coordonner avec 5.3 et 5.5** |
| **V2-DS-04** | Sémantique unifiée des couleurs de jeu | Reco UX/UI | Tokens `game-*`. Alignement des multiplicateurs (Capital). Doublage par la forme obligatoire. Score inactif ≥ 3:1 (≥ 4,5 visé). `matchFeedback` renvoie un ton. | Lisibilité, cohérence, prérequis de la personnalisation | M | **P1** | DS-01. Lien avec spec 005 (cohérence du scoreboard, à enrichir) |
| **V2-DS-05** | Motion et accessibilité visuelle | Reco UX/UI | Tokens de durée et d'easing, `prefers-reduced-motion`, suppression des classes mortes `animate-in`, pulsations ponctuelles, `prefers-contrast: more` (option). | a11y, finition | S | P2 | DS-01 |
| **V2-THEME-01** | Mode Light officiel | Demande V2 (5.2) | Palette « Craie », recalibrage des états et des couleurs de jeu, validation de contraste des paires déclarées, écrans de jeu, méta et manifeste. | Usage en plein jour, en bar, sur tablette | M | **P1** | DS-03 (tous les écrans migrés), DS-04 |
| **V2-THEME-02** | Sélection du thème : système, manuel, persistance, anti-FOUC | Demande V2 (5.2) | Préférence `system`/`dark`/`light`, `matchMedia` avec écoute, localStorage, script inline, `theme-color` dynamique, `color-scheme`, points d'accès (accueil, options de match). | Confort, aucun flash | S | **P1** | DS-01 (peut précéder THEME-01, avec dark seul et l'interrupteur masqué) |
| **V2-THEME-03** | Tests de contraste et régression visuelle | Reco archi | Tests unitaires de la matrice de contraste. `toHaveScreenshot` sur ~30 captures. Optionnel : `@axe-core/playwright`. | Non-régression durable | M | P1 | DS-01 ; THEME-01 pour la matrice light |
| **V2-BRAND-01** | Modèle de thème personnalisé (`ThemeDescriptor`) et moteur de dérivation | Demande V2 (5.7) | Module pur `src/features/theming` : schéma versionné, validation, dérivation `on-*`, hover et subtle, `ensureContrast`, clamp, distance ΔE avec les couleurs de jeu, (dé)sérialisation. | Garde-fous, base commune club et TV | M | **P1** | DS-01, DS-04 |
| **V2-BRAND-02** | Éditeur de personnalisation et aperçu | Demande V2 (5.7) | Presets, 1 à 3 couleurs, pipette sur le logo, nom, aperçus jeu et TV, dark et light, restauration, bibliothèque locale (≤ 10). Chargé en lazy. | Appropriation par un non-technicien | L | P1 | BRAND-01, BRAND-03 |
| **V2-BRAND-03** | Import de logo sécurisé | Demande V2 (5.7) | PNG, JPEG, WebP, SVG rasterisé (jamais dans le DOM). Limites de poids et de taille, redimensionnement à 512 px, pastille auto, stockage IndexedDB. | Sécurité, performance | M | P1 | DS-00 (encodage Safari) |
| **V2-BRAND-04** | Partage de thème sans compte (fichier, lien, QR) | Demande V2 (5.7) | Export et import `.bougnat-theme.json`. Lien `?theme=` versionné (sur le modèle de spec 030). QR en lazy (`qrcode` au runtime). Pas de serveur. | Diffusion en club | M | P1 | BRAND-01 |
| **V2-BRAND-05** | Co-branding obligatoire « Bougnat Darts » | Demande V2 (5.7) | `BrandMark` et `CoBrandFooter` non paramétrables, emplacements par écran et TV, taille minimale, test E2E de présence. | Identité préservée | S | **P1** | DS-02, BRAND-01 |
| **V2-BRAND-06** | Transmission du thème à la TV | Demande V2 (5.6 × 5.7) | Le descripteur est envoyé par le canal TV, le logo par hash avec cache, même `applyTheme`, mode TV indépendant. | Valeur signature bar et club | S-M | P2 | Spec TV (rapport 5.6), BRAND-01 |
| V2-BRAND-07 | Étude : code court serveur (KV et R2) | Étude exploratoire | À ouvrir seulement si une demande est avérée. Coûts, modération, limitation de débit, RGPD, compatibilité avec CONTRIBUTING. | — | M | P3 | BRAND-04 |
| V2-DS-06 | Police de chiffres pour scores TV (option) | Reco UX/UI | Sous-ensemble woff2 auto-hébergé, `tabular-nums`. | Lisibilité à distance | S | P3 | TV |

Specs existantes concernées :
- **018** (iOS 12) : à **réviser** selon DS-00 ; aucun abandon sans justification.
- **005** (cohérence du scoreboard) : à **enrichir** par DS-04 (sémantique des couleurs).
- **021** (résilience à l'échelle de police) : contraintes à **reprendre** comme non-régression dans DS-03.
- **027 et 028** (tablette, smartphone) : classes de mise en page (`tablet-*-root`, `[data-layout]`) **inchangées**. Seules les couleurs en dur de `tailwind.css:207,266,425` sont tokenisées.
- **031** (PWA) : coordination sur `theme_color` et `background_color` du manifeste.
- **030** (lien externe) : modèle de contrat pour BRAND-04. Extension future éventuelle (thème joint au lien), **hors V2**.

---

## 9. Décisions à arbitrer par le PO

1. **iOS 12** : maintien de la cible (avec repli CSS à coût élevé), dégradation acceptée (pas de thèmes sur iOS < 15.4), ou abandon documenté ? Cette décision précède DS-01.
2. **Séquencement avec la refonte tablette (5.3)** : tokens **avant** 5.3 (recommandé, pour éviter de styler deux fois) ou migration écran par écran **dans** les PR de 5.3 ?
3. **Le mode Light est-il livré seulement quand 100 % des écrans sont migrés** (recommandé) ou progressivement derrière un drapeau ?
4. **Unification des couleurs de multiplicateurs** (Capital vers la convention Cricket) : la cohérence ou l'habitude des joueurs actuels ?
5. **Thème de la TV par défaut** : sombre (recommandé) ou hérité de l'appareil maître ?
6. **Périmètre personnalisable** : faut-il limiter à marque, couleur secondaire, accent, teinte de surface, logo et nom (recommandé) ? Les images de fond sont-elles exclues en V2 ?
7. **Le joueur actif peut-il suivre la couleur du club** (sous garde-fou ΔE) ou reste-t-il toujours orange Bougnat ?
8. **SVG** : refus pur et simple ou rasterisation ?
9. **Logo dans le lien et le QR** (version 64 px dégradée) ou uniquement via fichier ?
10. **Ajout de `qrcode` au bundle runtime** (chargé en lazy dans l'éditeur), ou QR uniquement via un service tiers (déconseillé : fuite de données et dépendance réseau) ?
11. **Pas de serveur de partage en V2** : à confirmer (recommandé).
12. **Formule de co-branding** : 1 sur les écrans de jeu, 1 + 2 + 3 sur la TV ? Formulation exacte (« Powered by », « Scoring par », « avec ») et taille minimale.
13. **Noms et identité des thèmes officiels** (« Braise » et « Craie » proposés), et validation visuelle des palettes par une maquette avant implémentation.
14. **Tests visuels** : accepter environ 3-6 Mo de captures dans le repo, et `@axe-core/playwright` en devDependency ?

---

## 10. Limites de l'analyse

- **Rien n'a été exécuté ni rendu.** Les contrastes sont calculés sur les hex de repli sRGB du build (`dist/` du 19/11, possiblement antérieur au HEAD de quelques commits). Les rendus réels en oklch, P3, avec transparences et dégradés, ainsi que la perception sur TV, n'ont pas été mesurés. Les palettes proposées sont des **points de départ calculés**, pas des maquettes validées.
- **Le comportement iOS 12 n'a pas été vérifié sur appareil.** L'hypothèse `@layer` ignoré repose sur la compatibilité publiée des navigateurs.
- Les comptages par regex peuvent légèrement sur- ou sous-compter : classes dans des chaînes dynamiques, `bg-white/[0.04]` partiellement capturé comme `bg-white` par la commande de la mission.
- Les poids (`qrcode` runtime, police, captures) et le comportement de `canvas.toBlob('image/webp')` et des Blobs IndexedDB sur les anciens Safari sont des **[HYPOTHÈSES]** à mesurer.
- Le transport TV relève du chantier 5.6. Seul le contrat « descripteur JSON et logo par hash » est proposé ici.
- Je n'ai pas lu intégralement `ChangelogModal.tsx`, les vues de statistiques ni toutes les modales. Leur couplage est mesuré par grep, sans analyse ligne à ligne.
- L'analyse d'adoption est qualitative : pas de données d'usage disponibles, pas d'entretien avec des clubs ou des bars.
