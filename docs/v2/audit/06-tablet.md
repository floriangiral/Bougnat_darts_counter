> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 06 — Frontend, responsive et expérience tablette (chantiers 5.3 et 5.4)

Agent : « Frontend, responsive et expérience tablette », préparation V2 de Bougnat Darts.
Date : 2026-11-20. Branche analysée : `feat/v2.0.0` (HEAD `508dfa6`), dépôt laissé intact (`git status` vide après analyse).

Légende : **[VÉRIFIÉ code]** lu dans le dépôt ; **[VÉRIFIÉ émulation]** mesuré dans Chromium/Playwright (voir §1.3) ; **[VÉRIFIÉ source externe + URL]** ; **[HYPOTHÈSE]** ; **[À CONFIRMER]** (nécessite un test sur appareil réel ou une source).

---

## 1. Périmètre et méthode

### 1.1 Fichiers analysés

- Détection et coque : `src/features/tablet/tabletLayout.ts`, `src/features/tablet/useTabletLayout.ts`, `src/features/smartphone/{RotateToPortraitOverlay.tsx,usePortraitLock.ts,useVisualViewport.ts}`, `src/app/appShell.ts`, `src/app/useAppScreenHistory.ts`, `src/app/useGameLifecycle.ts`, `App.tsx`, `utils/uiUtils.ts` (plein écran).
- Plateforme : `index.html` (viewport), `manifest.json`, `sw.js`, `index.tsx` (enregistrement SW).
- Styles : `src/styles/tailwind.css` (549 lignes, tous les contrats `data-layout`).
- Écrans de jeu : `views/MatchView.tsx`, `views/CricketGameView.tsx`, `views/CapitalGameView.tsx`, `views/KillerGameView.tsx`, `views/GotchaGameView.tsx`, `views/TriathlonGameView.tsx` ; `views/SetupView.tsx` (classes tablette).
- Composants : `components/match/{MatchTopBar,MatchInputBar,MatchStatusPill,MatchSettingsModal}.tsx`, `components/game/{Keypad,PlayerScore,MatchPlayerArea,CricketScoreboard,CricketKeypad,CheckoutHint,StartingPlayerOverlay}.tsx`.
- Domaine (bornes) : `src/features/game-setup/setupModel.ts:59-66`, `src/domain/killer/killer.ts:29`, `src/domain/gotcha/gotcha.ts:28`.
- Tests : `tests/unit/tabletLayout.test.ts`, `tests/unit/components/portraitOrientation.test.tsx`, `tests/e2e/tablet-layout.smoke.spec.ts`, `tests/e2e/smartphone-layout.smoke.spec.ts`, `playwright.config.ts`.
- Specs/doc : `specs/027-counter-tablet-display/spec.md`, `specs/028-counter-smartphone-display/spec.md`, `specs/021-*`, `specs/014-*`, `specs/005-*`, `specs/031-*` (plan/spec), `specs/README.md`, `docs/release/v2.0.0.md`, `docs/architecture.md`, backlog workspace `next-specs.md`.
- Commits : `1e8becd` (portrait-only phones), `2a78c7a` (barre de raccourcis X01 téléphone).

### 1.2 Sources externes consultées

| Sujet | Source |
|---|---|
| `ScreenOrientation.lock()` (définition, pré-conditions « typiquement plein écran ») | https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock |
| Compatibilité `lock()` : Chrome Android 38+, Safari/iOS **non supporté**, Firefox Android 144+ | https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/ScreenOrientation.json |
| Spécification W3C : « pre-lock conditions » (plein écran ou application installée, au choix du navigateur) | https://www.w3.org/TR/screen-orientation/ (§5.2) |
| Chromium Android : `FullScreenRequired()` retourne `true` ; le verrouillage exige `IsFullscreen()` **ou** display-mode `fullscreen` ; déverrouillage à la sortie du plein écran | https://github.com/chromium/chromium/blob/main/content/browser/screen_orientation/screen_orientation_delegate_android.cc (l.25-28) et https://chromium.googlesource.com/chromium/src/+/main/content/browser/screen_orientation/screen_orientation_provider.cc (l.92-107, l.266-272) |
| Membre `orientation` du manifeste : Chrome/Android 39+, Firefox Android 79+, **Safari/iOS non supporté** ; valeur `natural` | https://raw.githubusercontent.com/mdn/browser-compat-data/main/manifests/webapp/orientation.json et https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/orientation |
| `display: fullscreen` non supporté par Safari (repli standalone) | https://raw.githubusercontent.com/mdn/browser-compat-data/main/manifests/webapp/display.json |
| Fullscreen API sur iPad : disponible (préfixé depuis iPadOS 12, standard 16.4), **iPad seulement**, bouton superposé non masquable, **glisser vers le bas quitte le plein écran** | https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Element.json (`requestFullscreen`) |
| WCAG 2.1 SC 1.3.4 Orientation (AA) | https://www.w3.org/WAI/WCAG21/Understanding/orientation.html |
| Classes de taille de fenêtre (600/840/1200/1600 dp en largeur, 480/900 dp en hauteur) | https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes |
| Verrou de rotation iPadOS (Centre de contrôle) | https://support.apple.com/guide/ipad/change-or-lock-the-screen-orientation-ipad997da459/ipados — **non lu (HTTP 429)** → [À CONFIRMER] |

### 1.3 Mesures en émulation (sans modification du dépôt)

- Serveur `npx vite --port 5199` (arrêté ensuite ; seul le cache ignoré `node_modules/.vite` a pu être mis à jour). Scripts Playwright placés dans le dossier de session (`files/scratch/audit.mjs`, `check2.mjs`), bibliothèque `libasound` manquante extraite localement (pas d'installation système). Captures : `(captures de session, non versionnées) *.png`, mesures brutes : `files/scratch/results*.json`.
- Chromium avec `isMobile` + `hasTouch` (donc `pointer: coarse`), DPR 1. **Pas de WebKit** : le rendu Safari réel n'est pas vérifié.
- Hauteurs « navigateur » : estimations **[HYPOTHÈSE]** de la place prise par les barres (Safari iPadOS ≈ 60-75 px, Chrome Android ≈ 80-110 px). Profils : iPad 10,2" 1080×810 (PWA) / 1080×750 (Safari) / 810×1010 ; iPad Pro 12,9" 1366×950 / 1024×1292 ; Galaxy Tab 1280×752 (PWA) / 1280×696 (Chrome) / 800×1176 ; petite tablette 960×520 / 600×880 ; référence 1024×768.

---

## 2. Constats

### 2.1 Comment l'appareil est détecté

**[VÉRIFIÉ code]** `resolveTabletLayout()` (`src/features/tablet/tabletLayout.ts:28-56`) est une fonction pure alimentée par `useTabletLayout()` (`innerWidth`, `innerHeight`, `matchMedia('(pointer: coarse)')`, mode d'accès `?mode=`). Aucun user-agent n'est utilisé (bonne pratique).

| Sortie | Règle | Réf. |
|---|---|---|
| `isTablet` | (`dedicated_tablet` ET largeur ≥ 768) OU (pointeur grossier ET petit côté ≥ 768 ET grand côté ≤ 1279) | l.22-23, 36-40 |
| `isSmartphone` | petit côté < 768 ET (pointeur grossier OU largeur < 768) | l.43-44 |
| `density` | `compact` si hauteur < 700 | l.24, 51 |
| `requiresPortrait` | pointeur grossier, non tablette, smartphone, paysage, grand côté < 960 | l.26, 53-54 |

`App.tsx:214-220` en déduit `data-layout = tablet | smartphone | default` posé sur la racine (`App.tsx:323`), plus `data-tablet-orientation` et `data-tablet-density`. **Tout le responsive tablette est en CSS** : aucun composant ne lit `useTabletLayout` hormis `App`. Les vues exposent des « crochets » (`.tablet-x01-root`, `.tablet-cricket-control-area`, etc.) que `tailwind.css:112-270` réorganise.

**Détection parallèle** : `MatchView.tsx:246-266` recalcule son propre `isCompactBrowserMobile` (`max-width: 767px` et non standalone) → deuxième source de vérité responsive.

`TABLET_BREAKPOINTS` (`tabletLayout.ts:58`) est exporté mais **jamais utilisé** **[VÉRIFIÉ code]**.

### 2.2 Ce que produit cette détection sur des tablettes réelles

**[VÉRIFIÉ émulation]** (valeurs de viewport « navigateur » = [HYPOTHÈSE]) :

| Profil (CSS px) | `data-layout` obtenu | Attendu produit | Conséquence |
|---|---|---|---|
| iPad 10,2" PWA paysage 1080×810 | tablet | tablet | OK (split score / saisie) |
| **iPad 10,2" Safari paysage 1080×750** | **smartphone** | tablet | Pavé X01 : touches **212×32 px** ; Cricket : **ligne Bull coupée** |
| iPad 10,2" Safari portrait 810×1010 | tablet | tablet | OK |
| **iPad Pro 12,9" paysage 1366×950 / portrait 1024×1292** | **default** (bureau) | tablet | Pas de plancher tactile (boutons 34-40 px), sinon rendu correct |
| **Galaxy Tab 1280×800 (PWA 1280×752, Chrome 1280×696)** | **smartphone** | tablet | Touches X01 **29-34 px**, Bull Cricket coupé |
| Galaxy Tab portrait 800×1176 | tablet | tablet | OK |
| **Petite tablette paysage 960×520** | **smartphone** | tablet | **Score X01 à 0 px (invisible)**, touches 26 px, **Killer : les 21 touches de numéro hors écran et inatteignables** |
| Petite tablette portrait 600×880 | smartphone | tablette portrait | Acceptable (téléphone agrandi) |
| iPad mini 6 (744×1133, [HYPOTHÈSE] dimensions) | smartphone dans les deux orientations (petit côté 744 < 768) | tablet | Statique **[VÉRIFIÉ code]**, non émulé |

Cause : le seuil « petit côté ≥ 768 » suppose un viewport sans barres de navigateur ; or en paysage, Safari et Chrome retirent 60-110 px de hauteur. **En pratique, la tablette en paysage dans un onglet de navigateur — l'usage cible de la V2 — tombe presque toujours dans la présentation smartphone.** Seuls l'iPad 1024×768 exact, la PWA plein écran ou `?mode=dedicated_tablet` donnent le split paysage. Le plafond `TABLET_MAX_WIDTH = 1279` exclut en outre les 1280×800 (Galaxy Tab S/A) et 1366×1024 (iPad Pro 12,9").

Les tests e2e ne voient pas le problème : `tests/e2e/tablet-layout.smoke.spec.ts:18` force `/?mode=dedicated_tablet`, ce qui court-circuite la détection, et `playwright.config.ts` n'utilise que 768×1024, 1024×768 et 1024×600 (viewports « nus »). `tests/unit/tabletLayout.test.ts:68-72` **fige** même `1024×600 → isSmartphone: true`.

### 2.3 La disposition tablette paysage elle-même

**[VÉRIFIÉ code + émulation]**

- Grille `tailwind.css:175-209` : colonne score `1fr` / colonne saisie `minmax(22rem, 42%)` pour X01, Cricket et Capital ; Killer/Gotcha passent en 2 colonnes (`tailwind.css:211-235`) ; Triathlon réutilise Capital → Cricket → X01 (`TriathlonGameView.tsx:77-125`).
- **Bug de cascade en densité compacte** : `@media (min-width:768px) and (max-height:760px) { .x01-control-area.laptop-compact-control-area { height: clamp(13.5rem,34svh,18rem) } }` (`tailwind.css:535-540`) a la même spécificité que `[data-layout='tablet'] .tablet-x01-control-area { height:auto }` (`tailwind.css:198-209`) et vient **après** : en paysage tablette de hauteur ≤ 760 px, le pavé X01 est écrasé à ~236 px en haut de sa colonne et laisse un vide noir dessous (capture `dt-galaxytab-land-chrome-x01.png`, touches 31 px ; 960×520 : 26 px). Cela touche aussi l'iPad Safari paysage en mode `dedicated_tablet` (750 < 760).
- **Plancher 48 px annulé** : `[data-layout='tablet'] button { min-height: 3rem }` (`tailwind.css:164-167`) est neutralisé pour le pavé X01 par `.x01-keypad-root button { min-height: 0 }` à partir de 768 px (`tailwind.css:508-512`), volontairement pour l'alignement (notes v2.0.0). Résultat : rien ne garantit 48 px en compact.
- En 1080×810, le split fonctionne (touches 53×146 px, score actif 129,6 px), mais : touches chiffres étroites et hautes (1024×768 : **47 px de large**, déjà signalé `docs/release/v2.0.0.md:74`), colonnes de raccourcis aussi larges que les chiffres, et zone joueurs coupée en deux colonnes étroites (score actif à 58 % de la largeur seulement).

### 2.4 Hiérarchie, lisibilité à distance, contraste

Conversion approximative **[HYPOTHÈSE]** : iPad (264 ppi, DPR 2) → 1 px CSS ≈ 0,19 mm ; hauteur des chiffres ≈ 0,72 × font-size. Règle empirique **[HYPOTHÈSE]** : hauteur de chiffre ≥ distance/150 pour une lecture confortable (3 m → ~20 mm → ~145 px de font-size sur iPad).

| Jeu | Information principale | Taille mesurée / lue | Lisible à 2-3 m ? |
|---|---|---|---|
| X01 | Score joueur actif | 113-141 px (tablette), 247 px (iPad Pro, layout bureau) **[VÉRIFIÉ émulation]** | Limite à 3 m sur iPad 10,2" ; OK iPad Pro |
| X01 | **Score joueur inactif** | même taille mais `text-gray-700` sur fond noir (`PlayerScore.tsx:125`) → contraste ≈ **2:1** [calcul WCAG] | **Non** : sous le seuil 3:1 des grands textes |
| X01 | Manches/sets | pastille centrale 50 px, chevauche le haut des deux cartes (`MatchStatusPill.tsx:24-45`) | Oui |
| X01 | Finish suggéré | `CheckoutHint` sous la pastille, seulement si `showHints` (`MatchStatusPill.tsx:47`) | Petit, loin du joueur actif |
| Cricket | Points | `text-sm…md:text-lg` = **18 px max** (`CricketScoreboard.tsx:129`) | **Non** |
| Cricket | Marques | 30 px max (`CricketScoreboard.tsx:39-45`) ; cibles 20 px | Non au-delà de ~1 m |
| Capital | Scores liste | ≈ 22 px, grand vide sous la liste (capture `ipad102-land-pwa-capital.png`) | Non |
| Killer | Tableau (nom, numéro, vies) | 15-16 px (`KillerGameView.tsx:249`) | Non |
| Gotcha | Tableau | ≈ 16 px ; carte du joueur actif lisible (nom ≈ 48 px) | Partiel |

Constat : seul X01 a été pensé pour la distance ; les autres jeux sont des interfaces de « saisisseur » à 50 cm.

### 2.5 Contrôles et cibles tactiles

**[VÉRIFIÉ émulation]**

- En-tête : Statistiques/Configuration/Quitter 38-40 px natifs (`MatchTopBar.tsx:42-64`), relevés à 44 (smartphone) ou 48 px (tablette) par la CSS ; **40×48 px** en Capital/Triathlon tablette (largeur < 48) ; **34-40 px** sur iPad Pro (layout bureau).
- Annuler (« Retour ») : `h-8/h-9` (`MatchInputBar.tsx:324-330`), placé en **haut** de la zone de saisie, loin d'OK (en bas) → deux zones de pouce différentes.
- Quitter est à côté de Configuration sans séparation (risque de mauvais appui, confirmation présente).
- Cricket tablette paysage : 18 touches chiffres + Bull/D-Bull/3 MISS/MISS/C (`CricketKeypad.tsx`) — en 1080×810, cibles 64×187 px, très confortables ; C (annuler) dans la même rangée que MISS (risque de confusion modéré, couleur proche).
- Le pavé X01 et ses raccourcis répondent sur `pointerdown` (`Keypad.tsx:103-108`, 138-143) → saisie rapide, mais sans tolérance au glissement (frôlement = saisie).

### 2.6 Orientation : ce qui existe aujourd'hui

**[VÉRIFIÉ code]**

- `manifest.json:11` : `"orientation": "any"`, `display: standalone`. **Mais** le manifeste et `sw.js` ne sont pas livrés par le build (`docs/release/v2.0.0.md:70`, spec 031 `planned`) : aucune PWA Android installable actuellement ; sur iOS, l'ajout à l'écran d'accueil passe par les `meta apple-mobile-web-app-*` d'`index.html:8-11`.
- Portrait-only téléphones (`1e8becd`) : `RotateToPortraitOverlay` plein écran `z-[200]` (`App.tsx:327`) si `requiresPortrait` ; `usePortraitLock(layoutMode === 'smartphone')` (`App.tsx:220`) appelle `screen.orientation.lock('portrait')` **au montage seulement** et avale l'erreur.
- **`usePortraitLock` est en pratique inopérant** : selon le code Chromium (§1.2), Android n'accepte le verrou qu'en plein écran (Fullscreen API) ou en `display: fullscreen` ; or l'effet s'exécute au montage, avant tout plein écran, et notre manifeste est `standalone`. Le commentaire du hook et la note de version (« pris en compte quand elle est installée ») sont donc **inexacts** pour le mode standalone **[VÉRIFIÉ source Chromium]**.
- **Risque latent** : `layoutMode === 'smartphone'` inclut les tablettes paysage mal classées (§2.2). Si `enabled` change pendant un plein écran Android (ex. tablette 1024×600 qui passe de « default » à « smartphone »), un verrou **portrait** pourrait être posé sur une tablette **[HYPOTHÈSE, non reproduit]**. Il n'y a jamais d'`unlock()`.
- **Plein écran déjà déclenché** : `handleStartSetup()` appelle `enterFullScreen()` (`useGameLifecycle.ts:69-75`) dans le geste « Lancer la partie », et `useAppScreenHistory.ts:38-44` entre/sort du plein écran selon `FULLSCREEN_SCREENS` (`appShell.ts:27`). Conséquence intéressante : sur Android, on dispose **déjà** de la pré-condition nécessaire à `lock('landscape')` pendant les parties ; sur iPad, le plein écran d'élément est disponible mais quitte sur glissement vers le bas [VÉRIFIÉ source BCD]. Une restauration de session (rechargement) remet l'écran de jeu **sans** plein écran (pas de geste) **[VÉRIFIÉ code]**.

### 2.7 Specs et documentation

| Élément | Constat | Type |
|---|---|---|
| Spec 027 « Acceptance checks » | annonce 1280×800 ; non couvert par `playwright.config.ts` et **exclu** par `TABLET_MAX_WIDTH = 1279` | Divergence spec ↔ code |
| Spec 027 invariant 3 (48 px) | violé en compact (26-31 px) et en paysage navigateur (classé smartphone) | Divergence |
| Spec 027 invariant 5 (« compact ne masque jamais l'action ») | Bull Cricket coupé, Killer inatteignable à 960×520 (mais classés smartphone) | Divergence de fait |
| Spec 027 « Portrait is the default » | contraire à l'exigence V2 « paysage pendant les parties » | À réviser |
| Spec 027 e2e « primary controls ≥ 48 px » | le test ne mesure que le débordement du document | Test insuffisant |
| Spec 028 « landscape allowed / never functionally blocked » (invariant 2) | **contredit par `1e8becd`** (écran « Tourne ton téléphone ») ; spec non mise à jour | Divergence majeure |
| `specs/README.md` | **027 et 028 absentes de l'index** | Incohérence doc |
| `docs/release/v2.0.0.md:73-74` | reconnaît 1024×600 et 1024×768 comme points connus, mais pas la mauvaise classification des tablettes réelles ni le bug de cascade | Doc incomplète |
| `docs/release/v2.0.0.md:42` | « verrouillage portrait pris en compte quand installée » | Inexact (cf. 2.6) |
| WCAG 1.3.4 | le blocage portrait des téléphones n'est admis que si l'orientation est « essentielle » | Point de conformité à arbitrer |

---

## 3. Problèmes, dettes et incohérences (gravité)

| ID | Problème | Gravité | Preuve |
|---|---|---|---|
| P1 | Tablettes paysage en navigateur classées « smartphone » (iPad Safari, Galaxy Tab, 7-8") ; iPad mini toujours smartphone | **Critique** pour la V2 tablette | §2.2 |
| P2 | Score X01 invisible (0 px) à 960×520 classé smartphone | **Bloquant** | `small-land-chrome-x01.png` |
| P3 | Killer : touches de numéro inatteignables à 960×520 | **Bloquant** | `check2.mjs` |
| P4 | Cricket : ligne Bull masquée dans tous les paysages « smartphone » (1024×700 à 1280×696) | **Majeur** (règle de jeu invisible) | captures cricket |
| P5 | Cascade CSS : pavé X01 écrasé en tablette paysage ≤ 760 px de haut | **Majeur** | `dt-galaxytab-land-chrome-x01.png` |
| P6 | iPad Pro 12,9" / 1280×800 en layout bureau (pas de plancher tactile) | Moyen | §2.2 |
| P7 | Score inactif à ~2:1 de contraste | Moyen (lecture à distance, accessibilité) | `PlayerScore.tsx:125` |
| P8 | Cricket/Capital/Killer/Gotcha illisibles au-delà de ~1 m | Majeur pour l'usage club/bar | §2.4 |
| P9 | `usePortraitLock` inopérant + risque de verrou portrait sur tablette + pas d'`unlock` | Moyen | §2.6 |
| P10 | Tests e2e tablette contournent la détection (`?mode=dedicated_tablet`), viewports irréalistes, pas d'assertion 48 px | Majeur (qualité) | §2.2 |
| P11 | Deux détections responsive (`useTabletLayout`, `MatchView.isCompactBrowserMobile`) ; crochets CSS dupliqués par jeu (`.tablet-x01-…`, `.tablet-cricket-…`, `.tablet-capital-…`) | Dette (maintenabilité) | `MatchView.tsx:246-266`, `tailwind.css:120-259` |
| P12 | Specs 027/028 divergentes et absentes de l'index | Moyen (SDD) | §2.7 |
| P13 | Undo éloigné d'OK ; Quitter collé à Configuration | Mineur | §2.5 |

---

## 4. Solutions et recommandations

### 4.1 Détection : classes de taille + orientation (et non type d'appareil)

**Options comparées**

| Option | Principe | + | − |
|---|---|---|---|
| A. Ajuster les seuils actuels | ex. petit côté ≥ 600, grand côté ≤ 1400 | Changement minime | Reste une détection « tablette vs téléphone » binaire, fragile (multitâche iPad, pliables, fenêtres bureau) |
| B. User-agent / `maxTouchPoints` | Détecter « iPad », « Android tablet » | Familier | iPadOS se présente comme macOS en mode bureau **[HYPOTHÈSE largement documentée, À CONFIRMER]** ; non testable ; contraire à la pratique actuelle |
| **C. Classes de taille de fenêtre + orientation + modalité d'entrée** (recommandé) | Largeur : compact < 600, medium 600-839, expanded 840-1199, large ≥ 1200 ; hauteur : compact < 480, medium 480-899, expanded ≥ 900 (valeurs Android, §1.2) ; `orientation` = w ≥ h ; `touch` = `(any-pointer: coarse)` | Indépendant de l'appareil, couvre multitâche/pliables/bureau, testable par table de vérité, une seule source | Petit refactoring de `resolveTabletLayout` et des sélecteurs CSS |

**Recettes de mise en page proposées (option C)** — vérifiées sur les profils mesurés :

| Recette | Condition | Profils couverts |
|---|---|---|
| `stack` (colonne : scores puis saisie) | portrait, largeur compact ou medium | téléphones portrait, iPad mini/10,2"/Galaxy portrait, 600×880 |
| `stack-wide` | portrait, largeur ≥ expanded | iPad Pro 12,9" portrait (1024×1292) |
| **`arena`** (paysage partagé) | paysage, largeur ≥ expanded, hauteur ≥ medium | 1080×750, 1080×810, 1133×~690, 1280×696/752/800, 1366×950, 960×520, et fenêtres bureau ≥ 840×480 |
| `phone-landscape` | paysage, hauteur compact (< 480) | 844×390, 932×430 → overlay portrait (tactile) ou pile condensée (bureau) |

Densité dérivée de la hauteur : `tight` 480-599, `compact` 600-759, `comfortable` 760-899, `spacious` ≥ 900. La modalité `touch` ne change **que** les planchers de cibles (48 px tablette/tactile, 44 px téléphone) et les états hover — pas la structure.

`dedicated_tablet` devient un forçage de `touch` (et éventuellement d'une valeur de densité) plutôt qu'un forçage de structure. La décision d'appliquer `arena` aussi aux ordinateurs est à arbitrer (§7, D3).

Exposition : `data-size-w`, `data-size-h`, `data-orientation`, `data-input`, `data-density` sur la racine (compatibles CSS pur), le hook unique remplaçant aussi `isCompactBrowserMobile` de `MatchView`. Coût récurrent : **0 €** (client seul).

### 4.2 Interface tablette paysage « arène »

Objectif : une seule structure en zones (grid areas) pour tous les jeux, remplie par chaque vue ; pas de composant par appareil.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ BANDEAU 56-64 px : [≡ Bougnat] Format « 501 · 1er à 3 legs » · chrono │ [TV●] [🎙] [⚙] ‖ [⏻] │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ ZONE JOUEURS (≈ 58 %)                          │ ZONE SAISIE (≈ 42 %, côté      │
│                                                │ configurable gauche/droite)    │
│  ┌─ CARTE JOUEUR ACTIF ──────────────────────┐ │  Saisie en cours + état voix   │
│  │ ▶ NOM (40-56 px)          Legs 2 · Sets 1 │ │  (transcription / proposition) │
│  │        SCORE 160-260 px                    │ │  ┌────────────────────────┐   │
│  │  Finish : T20 · T20 · D20 (28-40 px)       │ │  │ Pavé 4×4, touches ≥ 64 │   │
│  │  Moy. 58,4 · Fl. 12 · Dern. 60 (18-22 px)  │ │  │ px (≥ 48 en tight)     │   │
│  └────────────────────────────────────────────┘ │  └────────────────────────┘   │
│  ┌─ ADVERSAIRE(S) ───────────────────────────┐ │  Raccourcis : 1 rangée (6-8)   │
│  │ NOM  score 96-140 px (contraste ≥ 4,5:1)  │ │  [↶ Annuler ≥ 64 px] [ OK ]    │
│  └────────────────────────────────────────────┘ │  (même rangée, zone du pouce)  │
└───────────────────────────────────────────────┴──────────────────────────────┘
```

Règles par jeu (le contenu reste propre à chaque jeu, la structure est commune) :

- **X01 (1-2 joueurs/équipes)** : deux cartes côte à côte de largeur égale *ou* actif en haut / adversaire en bas ; à arbitrer par prototype. Le finish suggéré passe sous le score actif ; la pastille Manches est éclatée en « Legs/Sets » par carte.
- **Cricket (2-3)** : tableau de marques dans la zone joueurs, avec points ≥ 48-72 px, marques ≥ 40 px, colonne des cibles centrale ; la ligne Bull ne peut jamais être coupée (hauteur de rangée `minmax(…, 1fr)` sans `overflow:hidden` sur le tableau).
- **Capital (1-4)** : objectif courant en titre (≥ 40 px), cartes joueurs avec score ≥ 56 px (remplit l'espace vide actuel).
- **Killer / Gotcha (2-6)** : carte du joueur actif + grille 2×3 de cartes (numéro, vies, score) lisibles à distance ; la grille de saisie 1-20/Bull reste dans la zone saisie (7×3 ou 5×5 selon la largeur).
- **Triathlon** : hérite des trois recettes + bandeau de progression de phase.

Usages couverts :

| Usage | Adaptation |
|---|---|
| Posée sur table | `arena` ; saisie côté main dominante ; contrastes élevés (lecture rasante) |
| Murale | `arena` + densité `spacious` ; aucun hover ; actions principales dans la moitié basse |
| Debout, tenue en main | `stack` portrait accepté (mode dégradé assumé) |
| Club / bar, plusieurs joueurs | cartes joueurs lisibles à 2-3 m, joueur actif signalé par 3 indices (fond, bordure animée, ▶) |
| Avec la voix | variante « voix prioritaire » : la proposition vocale occupe le haut de la zone saisie (≥ 48 px de texte) avec [Valider] [Corriger] ≥ 64 px ; pavé réduit mais toujours accessible |
| Contrôleur de TV | variante « contrôleur » quand une diffusion est active : la zone joueurs se réduit à un résumé (le grand affichage est sur la TV), la zone saisie s'élargit ; voyant TV dans le bandeau (dépend du rapport mode TV) |

Réduction d'interactions (proposées, à valider) : choix des fléchettes au finish affiché **dans** la zone saisie (au lieu de la modale plein écran `MatchView.tsx:836-857`) ; Annuler à côté d'OK ; Quitter séparé et confirmé ; menu « ⋯ » pour Stats/Config afin d'alléger le bandeau.

Transitions : manche/vainqueur conservées en superposition, mais limitées à la zone joueurs pour garder le contexte de saisie (à arbitrer, faible coût).

**Architecture** : composant de présentation `GameScreenLayout` (slots `header`, `players`, `active`, `input`, `controls`) + CSS grid areas par recette. Justification : 6 vues réimplémentent aujourd'hui racine/en-tête/zone score/zone saisie et la CSS duplique les crochets par jeu (`tailwind.css:120-259`) ; les variantes voix et contrôleur TV multiplieraient encore ces sélecteurs. Alternative moins coûteuse : garder les crochets CSS par jeu et seulement corriger la détection (option « correctifs seuls »), au prix d'une dette qui croît avec chaque variante. Aucune règle de jeu n'entre dans ce composant (domaine inchangé ; Clean Architecture respectée). Nouvelle dépendance : **aucune**.

### 4.3 Verrouillage de l'orientation (5.4)

#### Faisabilité réelle

| Plateforme / mode | `screen.orientation.lock()` | Manifeste `orientation` | Plein écran | Conclusion |
|---|---|---|---|---|
| iPadOS Safari (onglet) | **Non supporté** [VÉRIFIÉ BCD] | n/a | Oui (élément), bouton superposé, sortie par glissement [VÉRIFIÉ BCD] | Aucun verrou technique |
| iPadOS écran d'accueil (standalone) | Non | **Non supporté** [VÉRIFIÉ BCD] | Idem | Aucun verrou technique |
| Android Chrome / Samsung Internet (onglet) | Oui **uniquement en plein écran** [VÉRIFIÉ Chromium] | n/a | Oui | Verrou possible pendant les parties (le plein écran est déjà demandé) |
| Android PWA `standalone` | **Refusé hors plein écran** [VÉRIFIÉ Chromium] | Pris en compte à l'installation (Chrome 39+) [VÉRIFIÉ BCD] mais **une seule valeur pour tous les appareils** | Oui | Verrou pendant les parties via plein écran ; manifeste = étude |
| Android PWA `display: fullscreen` | Oui | Oui | permanent | Changerait toute l'expérience (barre système masquée) → non recommandé |
| Firefox Android | Oui depuis 144 (conditions non vérifiées) [VÉRIFIÉ BCD / À CONFIRMER] | 79+ | Oui | Comme Chrome, à tester |
| Ordinateur | Toujours refusé | n/a | — | Hors sujet (consigne : ne pas transposer) |

Le manifeste `"orientation": "landscape"` imposerait le paysage aux **téléphones** (contraire à 1e8becd) : exclu. `"natural"` (portrait sur téléphone, paysage sur la plupart des tablettes Android) est une piste élégante mais non déterministe (tablettes 7-8" à orientation naturelle portrait, pliables) **[À CONFIRMER]** et dépend de la livraison du manifeste (spec 031). → **Étude exploratoire**, pas exigence.

Détection fiable d'une « tablette » : il n'en existe pas sur le web ; on raisonne en « viewport tactile dont la recette paysage est `arena` et la recette portrait est `stack` avec largeur ≥ 600 ». Cas iPad multitâche (Split View/Stage Manager) : la fenêtre peut être portrait alors que l'écran est paysage ; tourner l'appareil n'y change rien → **ne pas inviter** quand `screen.orientation.type` (Safari 16.4+) est paysage mais le viewport portrait **[À CONFIRMER sur iPad]**.

#### Stratégie recommandée (périmètre : écrans de jeu uniquement)

1. **Android (verrou best-effort)** : au geste « Lancer la partie », après résolution de `requestFullscreen()`, appeler `screen.orientation.lock('landscape')` **seulement** si l'appareil est tactile et que la largeur portrait ≥ 600 (classe tablette) ; `unlock()` à la sortie de l'écran de jeu (Chromium déverrouille aussi à la sortie du plein écran). Échec silencieux.
2. **Partout ailleurs (iPad, PWA iOS, plein écran quitté, restauration de session)** : **invite non bloquante** pendant les écrans de jeu (`FULLSCREEN_SCREENS`) en portrait tablette : bandeau/superposition légère « Tournez la tablette pour l'affichage paysage » + bouton « Continuer en portrait » mémorisé pour la partie en cours (sessionStorage). Le portrait tablette reste un mode **supporté** (les captures portrait 810×1010 et 800×1176 montrent un rendu correct).
3. **Écrans hors jeu** (accueil, sélection, réglages avec clavier virtuel, stats) : libres, aucune invite (la saisie des prénoms au clavier est plus confortable en portrait).
4. **Corriger `usePortraitLock`** : limité aux téléphones (classe hauteur compacte en paysage / largeur compacte en portrait), appelé après le plein écran et jamais sur une classe tablette ; ajouter `unlock()`.
5. **Accessibilité** : une invite non bloquante respecte WCAG 1.3.4 ; un blocage tablette exigerait de justifier l'orientation comme « essentielle » — difficile à soutenir pour un compteur de score.

Option alternative (si le PO veut un blocage strict) : réutiliser le modèle de `RotateToPortraitOverlay` (« Tournez votre tablette ») pendant les parties uniquement, avec la même garantie « partie conservée » ; risques : WCAG 1.3.4, supports muraux portrait, multitâche iPad.

#### Comportements attendus et critères d'acceptation (testables)

- **AC-O1** Écran de jeu + viewport tactile classe tablette + portrait (hors multitâche) → invite visible ≤ 300 ms après `resize`/`orientationchange` ; disparition en paysage ; état de partie strictement identique (snapshot persistant inchangé). *Test : Playwright `setViewportSize` 810×1010 ↔ 1080×750, `hasTouch`.*
- **AC-O2** Aucune invite sur HOME, GAME_SELECTION, SETUP, *_STATS. *Test : parcours e2e.*
- **AC-O3** Aucune invite sur pointeur fin (bureau) ni sur téléphone (qui garde son comportement propre). *Test : projets `chromium` et `smartphone-*`.*
- **AC-O4** « Continuer en portrait » masque l'invite jusqu'à la fin de la partie courante, pas au-delà. *Test : e2e + unitaire du store.*
- **AC-O5** Android : séquence `requestFullscreen` → `lock('landscape')` appelée une fois au lancement d'une partie tablette ; `unlock()` à la sortie ; rejet sans message d'erreur. *Test : unitaire avec `screen.orientation` simulé (modèle de `portraitOrientation.test.tsx`) + test manuel Chrome Android.*
- **AC-O6** Jamais de `lock('portrait')` sur une classe tablette. *Test : unitaire de table de vérité.*
- **AC-O7** Multitâche iPad (écran paysage, fenêtre portrait) → pas d'invite, recette `stack`. *Test : manuel iPadOS [À CONFIRMER faisabilité de la détection].*
- **AC-O8** Restauration d'une partie après rechargement en portrait → invite (pas de verrou possible sans geste). *Test : e2e reload.*

Limites à documenter : pas de verrou iPad ; le plein écran iPad se quitte par glissement ; aucun verrou en onglet hors plein écran ; le manifeste n'est pas encore livré (031).

### 4.4 Correctifs immédiats (indépendants du design V2)

Ces points relèvent des invariants déjà actés par 027 et peuvent être traités avant la refonte : P2, P3, P4, P5, P9, P10 et l'élargissement de la classification (au moins abaisser « petit côté ≥ 768 » et relever « grand côté ≤ 1279 »). Ils améliorent immédiatement l'usage réel sur tablette ; à arbitrer s'ils entrent dans 2.0.0 (non publiée) ou 2.0.x.

---

## 5. Bénéfices, contraintes, risques

- **Bénéfices** : tablette réellement utilisable en paysage dans un navigateur (cas majoritaire) ; lisibilité club/bar ; base commune pour mode TV (contrôleur), voix et personnalisation (zones stables où appliquer thème/logo) ; moins de CSS dupliquée ; tests représentatifs.
- **Contraintes** : sans appareil réel, les hauteurs de barres navigateur, le comportement WebKit et le multitâche iPad restent à valider ; l'arène doit cohabiter avec les modes Dark/Light (design system) ; budget de complexité limité (un seul layout à recettes).
- **Risques** : régression téléphone/ordinateur lors du passage aux classes de taille (mitigation : table de vérité unitaire + matrice e2e) ; appliquer `arena` aux PC change leur rendu (D3) ; changement d'orientation pendant une saisie (garder le buffer de saisie, déjà dans l'état React) ; verrou Android mal libéré (mitigation : `unlock` + sortie plein écran).
- **Coûts récurrents** : nuls (100 % client). Coût ponctuel : tests sur 2-3 appareils réels (iPad, tablette Android, petite tablette) — à prévoir hors budget logiciel.

---

## 6. Propositions de spécifications

| ID | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances |
|---|---|---|---|---|---|---|---|
| **V2-TAB-01** | Classes de taille, orientation et modalité d'entrée | Reco archi + Reco UX | Remplacer `isTablet/isSmartphone` par le résolveur §4.1 (pur, testable), attributs `data-size-*`, suppression de `isCompactBrowserMobile`, `dedicated_tablet` = forçage tactile | Corrige P1/P6/P11 ; socle de toutes les variantes | M | **P0** | — |
| **V2-TAB-02** | Correctifs paysage tablette existants | Reco UX (défauts) | Cascade du pavé X01 compact, ligne Bull Cricket, touches Killer 960×520, score X01 0 px, plancher 48 px tablette (y compris en-tête 40×48) | Lève les blocages constatés | S-M | **P0** | Idéalement avant/avec 01 |
| **V2-TAB-03** | Disposition « arène » paysage pour les écrans de jeu | Demande V2 (5.3) | `GameScreenLayout` à zones + recettes `stack/stack-wide/arena/phone-landscape`, X01 d'abord puis Cricket, Capital, Killer, Gotcha, Triathlon | Tablette « support de premier plan » | L | P1 | 01, 02, design system, mode Light |
| **V2-TAB-04** | Lisibilité à distance et hiérarchie des scores | Reco UX | Échelle typographique « jeu » (score actif, inactifs ≥ 4,5:1, Cricket/Capital/Killer/Gotcha ≥ 48 px), finish sous le score actif, signalement multi-indices du joueur actif | Clubs/bars, accessibilité | M | P1 | 03 (ou en amont sur l'existant), design system |
| **V2-TAB-05** | Orientation paysage pendant les parties sur tablette | Demande V2 (5.4) | Verrou Android best-effort (plein écran + `lock('landscape')` + `unlock`), invite non bloquante ailleurs, périmètre écrans de jeu, correction de `usePortraitLock`, AC-O1…O8 | Conforme à la demande sans bloquer | S-M | P1 | 01 ; 031 pour toute évolution manifeste |
| **V2-TAB-06** | Placement des contrôles et main dominante | Reco UX | Annuler à côté d'OK, Quitter isolé, menu secondaire, saisie à gauche/droite (réglage persistant local) | Moins d'erreurs, saisie au pouce | S-M | P2 | 03 |
| **V2-TAB-07** | Variante « contrôleur de diffusion » | Demande V2 (5.3 × 5.6) | Recette activée quand une diffusion TV est liée : zone joueurs résumée, saisie élargie, état de connexion | Synergie mode TV | M | P2 | 03 + spec mode TV (autre agent) |
| **V2-TAB-08** | Variante « voix prioritaire » | Demande V2 (5.3 × 5.1) | Proposition vocale en grand + Valider/Corriger ≥ 64 px dans la zone saisie | Synergie scoring vocal | S-M | P2 | 03 + spec voix (autre agent) |
| **V2-TAB-09** | Matrice de validation multi-appareils | Documentation / qualité | Projets Playwright réalistes **sans** `?mode=dedicated_tablet` (1080×750, 1080×810, 810×1010, 1366×950, 1024×1292, 1280×696, 1280×800, 800×1176, 960×520, 600×880, 744×1080, 1133×690), assertions : recette attendue, actions primaires dans le viewport et ≥ 48 px, 7 lignes Cricket visibles, score X01 ≥ seuil, contraste inactif ; protocole de test manuel (iPad Safari, iPad PWA, Chrome Android, PWA Android) | Évite les régressions invisibles | S-M | **P0** (avec 01/02) | 01 |
| **V2-TAB-10** | Étude : manifeste `orientation: natural` sur Android | Étude exploratoire | Mesurer le comportement réel sur tablettes 7-13", téléphones et pliables une fois le manifeste livré | Verrou « gratuit » éventuel | S | P3 | 031 |
| **V2-TAB-11** | Écrans hors jeu en tablette paysage | Reco UX | Accueil/sélection/setup en 2 colonnes (joueurs ↔ options), bouton « Lancer » collant, stats lisibles | Parcours de base plus rapide sur tablette | M | P2 | 01 |

**Traitement des specs existantes**

| Spec | Statut actuel | Proposition |
|---|---|---|
| 027 tablet display | Active, divergente (§2.7) | **Finaliser** via V2-TAB-02 (corrige ses invariants 3 et 5) puis **remplacer** (« superseded ») par V2-TAB-01/03/05 ; corriger dès maintenant l'acceptation 1280×800 incohérente et l'ajouter à `specs/README.md` |
| 028 smartphone display | Active, contredite par `1e8becd` | **Enrichir/mettre à jour** pour acter le portrait-only (ou le revoir, D4) et corriger la description de `usePortraitLock` ; à terme **fusionner** 027+028 dans une spec « présentation adaptative » portée par V2-TAB-01 |
| 021 font-scale resilience | Active | **Conserver comme invariant de non-régression** de V2-TAB-03/04 ; noter que le plafond `120cqh` produit 0 px quand la boîte score est nulle (P2) |
| 014 keypad digit scale | Active | **Clore (réalisée/dépassée)** : la taille des chiffres suit désormais la hauteur des touches (`Keypad.tsx:44-46`) ; reprendre l'intention dans les jetons du design system |
| 005 scoreboard layout consistency | Active | **Clore en l'intégrant** comme invariant de V2-TAB-03 (alignement nom/score entre colonnes) |
| 031 PWA static delivery | Planned | **Dépendance** de V2-TAB-05/10 ; ajouter à ses validations la vérification orientation/plein écran tablette |
| Backlog `007-xrepo-smartphone-vs-tablet-access-bounds` | Backlog workspace | À rapprocher de V2-TAB-01 (rôle futur de `dedicated_tablet`/`personal_phone`) |

---

## 7. Décisions à arbitrer par le product owner

- **D1 — Invite paysage tablette** : non bloquante avec « Continuer en portrait » (recommandé, WCAG 1.3.4, supports muraux portrait, multitâche) **ou** blocage strict pendant les parties ?
- **D2 — Périmètre** : écrans de jeu uniquement (recommandé) ou toute l'application ?
- **D3 — Ordinateurs** : la recette `arena` s'applique-t-elle aussi aux fenêtres bureau paysage (cohérence, un seul code) ou le rendu PC actuel est-il conservé ?
- **D4 — Téléphones portrait-only** (`1e8becd`) : maintenir le blocage (à justifier comme « essentiel ») ou le rendre dismissible comme sur tablette ? Dans tous les cas, mettre la spec 028 à jour.
- **D5 — Calendrier** : V2-TAB-02 + correctif de classification dans 2.0.0 (non publiée) ou en 2.0.x ? (recommandé : 2.0.0, ce sont des défauts observables sur les tablettes courantes).
- **D6 — Disposition X01 à 2 joueurs** en arène : cartes égales côte à côte ou actif dominant / adversaire réduit ? (prototype à valider sur appareil).
- **D7 — Réglage « main dominante »** : nouveau réglage local (ajoute un paramètre) ou côté fixe (droite) ?
- **D8 — Manifeste `natural`** : lancer l'étude V2-TAB-10 après 031 ?
- **D9 — `dedicated_tablet`** : réduire son rôle à « forcer le tactile » ou le conserver comme forçage de structure ?

---

## 8. Limites et points non vérifiés

- Émulation Chromium uniquement (pas de WebKit, pas d'appareil réel) ; les hauteurs « avec barres » sont des estimations ; DPR 1 dans l'émulation (les tailles en px CSS restent valables).
- Écrans hors jeu (accueil, setup, stats) seulement survolés : la capture du setup a montré le chargeur paresseux ; débordements vertical de l'accueil en paysage téléphone/tablette relevés (58-258 px, défilement) mais non analysés.
- Parties à 3-6 joueurs (Cricket 3, Killer/Gotcha 6, Capital 4) et doublettes non émulées ; analyse statique seulement.
- Comportement réel de `lock('landscape')` sur tablettes Android (Chrome, Samsung Internet), du plein écran iPad pendant une partie, de `pointer: coarse` sur iPad avec trackpad, de la détection multitâche iPad : **[À CONFIRMER]**.
- Règle de lisibilité (hauteur ≥ distance/150) et conversions physiques : **[HYPOTHÈSE]** d'ordre de grandeur.
- Page Apple sur le verrou de rotation non consultée (HTTP 429).
