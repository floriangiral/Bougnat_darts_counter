# Plan - Counter iOS 12 Compatibility

1. Formaliser les exigences runtime/CSS/PWA iOS 12.
2. Ajouter plugin build legacy pour Safari/iOS 12.
3. Introduire un module infrastructure de detection des capacites CSS.
4. Appliquer des classes `no-*` au bootstrap app.
5. Ajouter fallbacks CSS cibles sans casser le rendu moderne.
6. Ajouter tests unitaires de detection legacy.
7. Verifier `typecheck`, tests cibles, build.

## Révision V2 — plan proposé

> Plan proposé pour l'étude de décision V2-DS-00. Il ne s'exécute qu'après validation de la Révision V2 par le product owner. Aucune modification de code n'est prévue avant la décision, hormis les PoC jetables (branche dédiée, jamais fusionnée).

### 1. Lecture de l'existant
- `vite.config.ts:29-33` (plugin legacy), `package.json` (Tailwind 4.3), `src/infrastructure/web/legacySupport.ts`, `index.tsx:35-39`, `src/styles/tailwind.css:420-490`.
- `docs/release/react-19-validation-matrix.md:34` (validation legacy `pending`), `docs/release/v1.0.2.md:25`.

### 2. Étapes de l'étude
1. PoC iOS 12 : servir le build actuel en préproduction, capturer accueil/setup/X01 sur l'iPad Air (ou simulateur) ; noter ce qui casse (`@layer`, couleurs, grilles).
2. PoC repli CSS (option A) : branche jetable ajoutant un post-traitement PostCSS (aplatissement des couches, repli `color-mix`/`lab`) générant une feuille legacy ; mesurer taille, effort, régressions.
3. PoC TV : rendu de la CSS actuelle et d'une page TV minimale « conservatrice » sur Chromium 85/87 (TV réelle ou binaire ancien).
4. Chiffrage : effort A vs C, budget appareils (Q5).
5. Note de décision (options, recommandation, coûts) soumise au PO ; ADR si la baseline est retenue comme structurante.
6. Après décision : aligner `vite.config.ts` (cibles), la chaîne CSS, la matrice de validation, la doc « navigateurs supportés » ; mettre à jour 063 (format des tokens) et 086/090.

### 3. Fichiers impactés (après décision seulement)
| Fichier | Nature du changement |
|---|---|
| `vite.config.ts`, éventuel `.browserslistrc` | Cibles uniques |
| `postcss.config.mjs` (option A) | Post-traitement legacy |
| `index.html` / `index.tsx` (options B/C) | Message de non-support |
| `docs/` (page « navigateurs supportés »), `docs/release/react-19-validation-matrix.md` | Baseline publiée |
| `tests/unit/infrastructure/legacySupport.test.ts` | Détection étendue si option A |

### 4. Tests et non-régression
Captures PoC consignées ; après décision : E2E Chromium/WebKit inchangés, test manuel sur l'appareil le plus ancien supporté.

### 5. Rollback
Les PoC ne sont pas fusionnés. Après décision, la configuration de cibles est un commit isolé, réversible.
