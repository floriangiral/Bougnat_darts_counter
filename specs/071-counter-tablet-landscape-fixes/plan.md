# Plan — 071 Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `src/features/tablet/tabletLayout.ts:22-44` (seuils de classification).
- `src/styles/tailwind.css:164-167`, `:175-209`, `:494-512`, `:524-540` (planchers, grille paysage, exception pavé, plafond du score, bureau compact).
- `views/MatchView.tsx:715` (zone de saisie X01), `views/KillerGameView.tsx:115-135`, `views/CricketGameView.tsx:279`, `:320`.
- `components/match/MatchTopBar.tsx` (boutons d'en-tête), `tailwind.css:547-549` (largeur 3 rem).
- `tests/e2e/tablet-layout.smoke.spec.ts:17`, `playwright.config.ts:24-36`, `tests/unit/tabletLayout.test.ts:69`.

## 2. Approche retenue (et alternatives écartées)
Correctifs ciblés + règle de classification transitoire. Écartée : attendre l'arène (défauts observables aujourd'hui sur des tablettes courantes).

## 3. Étapes
1. Ajouter les projets/tests E2E réalistes sans forçage (rouges) : 1080×750, 1280×696, 1280×800, 960×520, 1366×950, assertions AC-01 à AC-06.
2. Élargir la classification dans `tabletLayout.ts` ; mettre à jour la table unitaire.
3. Cascade : restreindre la règle `:535-540` aux présentations non tablette (`:not([data-layout='tablet']) …` ou sélecteur `[data-layout='default']`) ; vérifier le bureau compact.
4. Plancher : en tablette, dimensionner la grille du pavé (`grid-template-rows` à `minmax(3rem, 1fr)`) et retirer l'exception `min-height: 0` pour `[data-layout='tablet']`.
5. Score : garantir une hauteur minimale de la boîte du score (`min-height`) pour que `120cqh` ne descende pas sous le seuil.
6. Killer : remplacer `overflow-hidden` racine par une zone de saisie défilante ou une grille 7×3 adaptée à la hauteur.
7. Cricket : rangées `minmax(…, 1fr)` sans `overflow-hidden` sur le tableau en tablette.
8. En-tête : boutons carrés 48 px en Capital/Triathlon.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/tablet/tabletLayout.ts` | Seuils transitoires |
| `src/styles/tailwind.css` | Cascade, planchers, score minimal |
| `views/KillerGameView.tsx`, `views/CricketGameView.tsx`, `views/MatchView.tsx` | Débordements |
| `views/CapitalGameView.tsx`, `components/triathlon/*` (en-têtes) | Boutons 48 px |
| `tests/unit/tabletLayout.test.ts` | Table mise à jour |
| `tests/e2e/tablet-layout.smoke.spec.ts`, `playwright.config.ts` | Profils réalistes, mesures |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Une partie restaurée après mise à jour s'affiche dans la nouvelle présentation sans perte.

## 7. Stratégie de test
E2E réalistes (mesures de boîtes), unitaires de classification, captures avant/après, test terrain sur au moins une tablette Android et un iPad.

## 8. Non-régression
E2E téléphone et bureau (AC-07), notes v2.0.0, specs 014/021/028.

## 9. Rollback / désactivation
Commits séparés par correctif ; revert individuel possible (classification, cascade, plancher, Killer, Cricket).

## 10. Documentation à mettre à jour avec l'implémentation
`docs/release/v2.0.0.md` (points connus 74-75 levés), spec 027 (Révision V2), notes de release.
