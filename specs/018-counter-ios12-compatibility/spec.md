---
id: 018-counter-ios12-compatibility
v2_id: V2-DS-00
type: fonctionnel
statut: a-revoir
validation: en-attente
statut_reel: "Très probablement cassée : Tailwind 4 cible Safari 16.4+."
traitement_propose: "Revoir intégralement (décision de baseline navigateurs, Révision V2)."
decision_traitement: a-valider
issue: '#220'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 018 - Counter iOS 12 Compatibility

## Contexte

Le compteur doit rester utilisable sur iPad Air sous iOS 12.x, sans ecran blanc ni interface degradee bloquante.

## Objectif

Fournir une compatibilite runtime + rendu + PWA minimale pour iOS 12.x, en gardant l'architecture claire entre bootstrap, infrastructure web et presentation CSS.

## Portee

- Build legacy JS pour Safari/iOS 12.
- Fallbacks CSS pour fonctions modernes non garanties:
  - `flex-gap`
  - `clamp()`
  - `backdrop-filter`
- Renforcement du bootstrap SW/PWA pour limiter les cas de cache stale.

## Exigences

### E1 - Runtime legacy

- Le build produit une variante compatible iOS 12 via pipeline legacy.
- Le chargement principal ne doit pas dependre uniquement de modules modernes non transpiles.

### E2 - Fallback CSS

- Si `flex-gap` est absent, l'espacement en layout flex reste lisible via fallback.
- Si `clamp()` est absent, les tailles critiques du branding restent proportionnees.
- Si `backdrop-filter` est absent, les surfaces lisibles conservent un fond opaque/semi-opaque.

### E3 - PWA bootstrap

- L'enregistrement SW en production force une verification d'update non bloquee par cache intermediaire.
- Les metas iOS principales restent presentes pour le mode standalone.

## Invariants

1. La detection de compatibilite web legacy est isolee dans une couche infrastructure.
2. Le bootstrap app n'embarque que l'orchestration, sans logique CSS embarquee.
3. Les fallbacks CSS s'activent via classes de capacites (`no-*`) appliquees au root document.
4. Les modifications ne cassent pas le comportement moderne existant.

## Traceabilite

- Infra web: `src/infrastructure/web/legacySupport.ts`
- Bootstrap: `index.tsx`
- Presentation fallback: `src/styles/tailwind.css`
- Build: `vite.config.ts`, `package.json`
- Tests: `tests/unit/infrastructure/legacySupport.test.ts`

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Alias V2 : **V2-DS-00** — « Baseline navigateurs (iOS 12, navigateurs TV) — décision ». Nature : **étude de décision** (P0, lot 1, difficulté M, recommandation `etude`, poids 40). Le contenu historique ci-dessus est conservé tel quel.

### Pourquoi cette révision
Le compte rendu V2 (§B.2, §G « Lot 1 : décision 018 », §H.3) et la revue croisée imposent **une baseline navigateurs commune, décidée avant les design tokens** (V2-DS-01, spec 063) : le format des tokens (hex/rgb ou oklch, `color-mix`, `@layer`), la feuille TV (V2-TV-06) et la qualification TV (V2-TV-11) en dépendent. Cette révision transforme 018 en décision explicite : maintenir, dégrader ou abandonner iOS 12, et fixer la cible des navigateurs TV.

### Constats vérifiés (code, commit 508dfa6)
- [vérifié] `vite.config.ts:29-33` : `@vitejs/plugin-legacy` avec `targets: ['ios >= 12', 'safari >= 12']`, `modernPolyfills: true`, `renderLegacyChunks: true` → **seul le JavaScript** est traité pour iOS 12.
- [vérifié] `package.json` : `tailwindcss ^4.3.5`, `@tailwindcss/vite ^4.3.5`. [source externe, https://tailwindcss.com/docs/compatibility, consultée le 20/11/2026 par l'audit] Tailwind 4 cible **Safari 16.4, Chrome 111, Firefox 128**.
- [vérifié] CSS du build local `dist/assets/index-C2qto8R6.css` (19/11, possiblement antérieur au HEAD) : 5 couches `@layer` (`properties`, `theme`, `base`, `components`, `utilities`), 418 occurrences de `color-mix`, 90 de `lab(`, 63 `@property`.
- [hypothèse forte, à confirmer sur appareil] Safari < 15.4 ignore les blocs `@layer` : sur iOS 12, la quasi-totalité des utilitaires Tailwind ne s'appliquerait pas.
- [vérifié] Chronologie : passage à Tailwind 4 au commit `b57b9c8` (2026-03-27) ; travail iOS 12 au commit `a53e173` (2026-04-27, « Legacy iOS12 pour iPad Air », un utilisateur identifié) avec `tailwindcss ^4.2.2` déjà en place. La spec 018 a donc été implémentée **après** Tailwind 4 ; le résultat réel sur l'iPad Air n'est documenté nulle part.
- [vérifié] `docs/release/v1.0.2.md:25` annonce « compatibilité legacy iOS 12 rétablie » ; `docs/release/react-19-validation-matrix.md:34` laisse la ligne « Legacy Safari/iOS » à `pending`.
- [vérifié] Fallbacks présents : `src/infrastructure/web/legacySupport.ts:11-28` (classes `no-flex-gap`, `no-css-clamp`, `no-backdrop-filter`), branchés dans `index.tsx:35-39` ; règles `src/styles/tailwind.css:420-490` (hors `@layer`) ; tests `tests/unit/infrastructure/legacySupport.test.ts`.
- [vérifié] E3 (bootstrap SW/PWA) : `index.tsx:43-58` enregistre `/sw.js`, mais `sw.js` et `manifest.json` racine ne sont pas livrés par le build (`docs/release/v2.0.0.md:71`) et `sw.js:3-8` précache `/logo.svg` absent du build (échec d'installation du SW) → E3 inopérant en production, traité par 031 (V2-REL-02).
- [source externe, rapport 07 §4.4, consultée le 20/11/2026] Moteurs des apps web TV : Samsung Tizen 2022 = **Chromium 85**, 2023 = 94, 2024 = 108 ; LG webOS 2022 = **Chromium 87**, 2023 = 94, 2024 = 108. Toutes ces générations sont **sous** la cible Tailwind 4 (Chrome 111). Le navigateur intégré peut différer du moteur des apps web [à confirmer sur appareil].

### Écarts avec la spec historique
| Exigence 018 | Constat | Écart |
|---|---|---|
| E1 runtime legacy | Chunks legacy produits | Non validé sur appareil (matrice `pending`) |
| E2 fallbacks CSS | `gap`, `clamp`, `backdrop-filter` seulement | Ne couvre ni `@layer`, ni `color-mix`, ni `lab()`/`oklch`, ni `@property` introduits par Tailwind 4 |
| E3 bootstrap SW/PWA | SW non livré, précache cassé | Inopérant (031) |
| Invariant 4 « ne casse pas le moderne » | Respecté | — |
| Portée « iPad Air iOS 12 utilisable » | Non démontrée | Probablement non tenue [à confirmer] |

### Questions à trancher (étude)
- Q1 iOS 12 (iPad Air) : maintien complet, mode dégradé « jouable », ou abandon documenté ?
- Q2 Navigateurs TV : quelle génération minimale (Chromium 85 = Samsung 2022 ; 87 = LG 2022 ; 94 = 2023) ?
- Q3 Baseline de l'application contrôleur (téléphone, tablette, PC) : cible Tailwind 4 (Safari 16.4 / Chrome 111 / Firefox 128) ou plus basse ?
- Q4 Format des tokens V2-DS-01 en conséquence (hex/rgb sans `color-mix` pour les tokens critiques ?).
- Q5 Budget d'appareils de test (iPad iOS 12, TV 2022/2023) ou service de test distant ?

### Options étudiées
| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Maintien complet iOS 12 | Feuille CSS de repli générée au build (aplatissement des `@layer`, repli de `color-mix`/`lab`) par des plugins PostCSS (ex. `@csstools/postcss-cascade-layers`, repli `color-mix`) [à confirmer par PoC], chargée sur détection | Conserve l'utilisateur iPad Air | Double CSS à tester à chaque release, maintenance continue, risque de divergence | 0 € (temps de maintenance) | L |
| B. Baseline moderne + abandon documenté | Cible = Tailwind 4 ; page d'information « navigateur non pris en charge » sur iOS < 16.4 | Simple, aligné sur l'outillage | Perte de l'iPad Air ; TV 2022-2024 hors cible | 0 € | S |
| C. Deux niveaux (recommandée) | Contrôleur = baseline moderne ; **écran TV** = feuille dédiée conservatrice (variables CSS, hex/rgb, sans `@layer`/`color-mix`), cible Chromium ≥ 85 ou 87 ; iOS 12 = « meilleur effort » selon PoC (A si coût ≤ M, sinon B) | Protège la TV (signature V2) sans freiner le contrôleur | Deux feuilles à maintenir (TV limitée) | 0 € | M |
| D. Retour à Tailwind 3 | Rétrograder l'outillage | CSS plus ancienne | Régression d'outillage, réécriture | 0 € | L |

### Exigences proposées (non validées)
- V2-FR-01 Une **baseline navigateurs** écrite (navigateurs, versions minimales, niveau de support : complet / dégradé / non supporté) est publiée dans la documentation et référencée par 063, 086 et 090 **avant** le démarrage de V2-DS-01.
- V2-FR-02 Le build déclare une seule source de cibles (ex. `browserslist` partagé par `plugin-legacy` et la chaîne CSS) cohérente avec la baseline.
- V2-FR-03 Un navigateur sous la baseline « dégradé » reçoit une interface jouable (scores, pavé, navigation) même si le rendu est simplifié ; sous « non supporté », un message clair en français remplace l'écran blanc.
- V2-FR-04 Si l'écran TV est retenu (V2-TV-*), sa feuille de style n'utilise ni `@layer`, ni `color-mix()`, ni `oklch()/lab()`, ni `@property` (contrôle automatisé).
- V2-FR-05 La ligne « Legacy Safari/iOS » de la matrice de validation est soit validée sur appareil, soit retirée avec la décision correspondante.
- V2-NFR-01 Aucun coût récurrent ; le budget ponctuel d'appareils ou de service de test est chiffré avant décision (Q5).
- V2-NFR-02 La détection de capacités reste isolée en infrastructure (invariant 1 historique conservé).

### Critères d'acceptation proposés
- V2-AC-01 Un PoC sur iPad Air iOS 12 (ou simulateur iOS 12 [à confirmer disponibilité]) produit des captures de l'accueil, du setup et d'une partie X01 avec la CSS actuelle, puis avec le repli de l'option A : résultat consigné.
- V2-AC-02 Un PoC du rendu de la CSS actuelle sur Chromium 85/87 (TV réelle ou binaire Chromium ancien) produit des captures consignées [à confirmer : moyen de test].
- V2-AC-03 La décision (options A/B/C/D) et la baseline sont actées par le PO et publiées (doc + ADR si structurante).
- V2-AC-04 Après décision, la configuration de build (`vite.config.ts`, cibles CSS) et la matrice de validation sont alignées sur la baseline (vérification en revue).
- V2-AC-05 Si l'option B ou C (abandon iOS 12) est retenue : un navigateur iOS < baseline affiche le message de non-support au lieu d'une interface cassée (test manuel).

### Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | iOS 12 (§H.3) | Maintien complet ; dégradé ; abandon documenté | PoC d'abord ; maintien seulement si le repli coûte ≤ M, sinon abandon documenté avec message | À prendre |
| Q2 | Génération TV minimale (§H.3) | Chromium 85 ; 87 ; 94 | Chromium 85 (Samsung 2022) pour la seule feuille TV | À prendre |
| Q3 | Baseline contrôleur | Tailwind 4 ; plus basse | Tailwind 4 (Safari 16.4 / Chrome 111 / Firefox 128) | À prendre |
| Q4 | Format des tokens (063) | hex/rgb ; oklch | hex/rgb (sert aussi la TV et un éventuel repli iOS) | À prendre |
| Q5 | Budget de test (§H.3) | Achat d'appareils ; service distant ; prêt | Prêt/achat d'occasion d'une TV 2022 et usage de l'iPad Air existant ; chiffrer avant achat | À prendre |
| Q6 | Avenir de 018 | Réviser ; remplacer par une spec « baseline navigateurs » | Réviser 018 (numéro conservé) puis clôturer après décision | À prendre |

### Dépendances
- Aucune dépendance amont. **Bloque** V2-DS-01 (063) ; conditionne V2-TV-06 (086), V2-TV-11 (090), V2-THEME-02 (069, script anti-flash ES5).
- Coordination : 031 / V2-REL-02 (E3 PWA), V2-QA-09 (042, matrice d'appareils), V2-REL-01 (033, matrice de validation 2.0.0).
- Traçabilité : rapport 05 §2.7, §3 P13 ; rapport 07 §4.4 ; rapport 01 (ligne 018) ; compte rendu §B.2, §C.6, §G, §H.3.
