---
id: 066-counter-reserved-game-colors
v2_id: V2-DS-04
titre: Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Recommandation UX/UI
famille: design-system
priorite: P1
difficulte: S
recommandation: recommande
lot: 1
poids: 45
depend_de: [V2-DS-01]
remplace: []
remplacee_par: []
issue: '#228'
verifie_au_commit: 24dbbab
derniere_revue: 2026-11-20
---

# 066 — Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif)

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #228, branche `feat/v2.0.0`, chantier « refonte tablette et thèmes »). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la recette terrain et l'exécution des tests E2E dans la CI de la PR restent à faire (`validation: en-attente`).

## 1. Origine et contexte
Rapport d'audit 05 (§2.3, §3 P3/P4/P6, §4.5, §5.2), compte rendu §C.2, §C.7 (« couleurs de jeu non personnalisables ») et §F.3. Prérequis de la personnalisation club (V2-BRAND-01) et de la TV (V2-TV-06) : un thème club ne doit jamais modifier le sens d'une couleur de jeu.

## 2. Problématique
L'orange est surchargé (marque, joueur actif, triple, victoire, vies, minuteur) et les multiplicateurs n'ont pas la même couleur d'un jeu à l'autre, ni au sein de Capital. Un club rouge ou vert entrerait en collision avec « bust » ou « fermé ».

## 3. Objectifs
- O1. Une convention unique de couleurs métier, commune à tous les jeux, distincte de la couleur de marque.
- O2. Des rôles `game-*` réservés, non personnalisables, recalibrés par mode (Dark, Light) avec la même signification.
- O3. Aucune information de jeu portée par la seule couleur (WCAG 1.4.1).
- O4. Score du joueur inactif lisible (≥ 3:1 obligatoire, 4,5:1 visé).

## 4. État actuel vérifié dans le code
- [vérifié] Cricket (`components/game/CricketKeypad.tsx`) : doubles cyan (l.47-54), triples orange (l.63-70), Bull émeraude (l.84), D-Bull rouge `#d90416` en classe **et** en style inline (l.91-93).
- [vérifié] Capital, mode plateau (`components/game/CapitalKeypad.tsx:83-85`) : simple sky/bleu, double émeraude, triple rouge ; Bull (l.104-107) émeraude/rouge ; boutons fixes (l.424-426) : simple gris, double cyan, triple orange → **deux conventions dans le même jeu**.
- [vérifié] X01 (`components/game/Keypad.tsx:144,174`) : raccourcis cyan/orange.
- [vérifié] Joueur actif X01 : barre dégradée orange (`components/game/PlayerScore.tsx:78`), nom orange vs `gray-600` inactif (l.86), score blanc vs `text-gray-700` inactif (l.125, ≈ 2,04:1 sur noir, calcul rapport 05).
- [vérifié] Cricket : cible fermée `text-green-500` + lueur (`components/game/CricketScoreboard.tsx:52`), fermée par tous `text-gray-700` barré (l.50, l.154).
- [vérifié] Killer : vies orange (`views/KillerGameView.tsx:260`), éliminé `text-red-300/70 line-through` (l.250).
- [vérifié] Gotcha : bust projeté rouge / orange (`views/GotchaGameView.tsx:47-60`).
- [vérifié] Feedback X01 : `src/features/x01/scoring/matchFeedback.ts:3-12` renvoie des classes (bust rouge) depuis la couche `features`.
- [vérifié] Couleurs d'identité des jeux : dégradés codés en dur `views/GameSelectionView.tsx:38-83`.
- [vérifié, positif] Le joueur actif X01 est signalé par plusieurs indices (fond, barre, nom, badge du lanceur `PlayerScore.tsx:71-113`) ; Cricket double « fermé par tous » par le barré.

## 5. Comportement cible
Convention proposée, identique dans tous les jeux et les deux modes : **simple = neutre, double = cyan, triple = orange, Bull = vert, D-Bull = rouge** (convention de la cible, déjà utilisée par Cricket). États : `game-bust` (rouge), `game-closed` (vert), `game-dead` (atténué + barré), `game-eliminated` (atténué + barré + icône), `game-win`, `game-active` (indice de joueur actif), `game-score`, `game-score-inactive`. Identité de jeu : `game-x01`, `game-cricket`, `game-capital`, `game-gotcha`, `game-killer`, `game-triathlon`.

## 6. Périmètre
### Inclus
- Définition des rôles `game-*` (valeurs Dark ; valeurs Light fournies par V2-THEME-01).
- Alignement de Capital sur la convention commune (décision PO, Q1).
- Doublage par la forme obligatoire pour chaque état (barre, anneau, icône, barré, libellé).
- `matchFeedback.ts` renvoie un ton ; la présentation le traduit.
- Contraste du score inactif relevé.
- Règle documentée : `game-*` non personnalisables ; seul `game-active` peut suivre la marque sous garde-fou (défini par V2-BRAND-01).
### Exclu
- Migration complète des écrans (V2-DS-03) ; moteur de distance perceptuelle (V2-BRAND-01) ; palette Light (V2-THEME-01).

## 7. User stories
- En tant que joueur passant du Cricket au Capital, je veux que « triple » ait la même couleur, afin de ne pas me tromper de touche.
- En tant que joueur daltonien, je veux que « fermé » ou « bust » soient aussi signalés par une forme, afin de les distinguer.
- En tant que responsable de club, je veux appliquer mes couleurs sans changer le sens des indicateurs de jeu.

## 8. Règles métier
- RM-01 La signification d'une couleur métier est identique dans tous les jeux.
- RM-02 Une couleur métier n'est jamais utilisée pour la marque ni pour la décoration.
- RM-03 Chaque état de jeu porte au moins un indice non coloré.

## 9. Parcours utilisateurs
Inchangés ; seules les couleurs de Capital changent si Q1 est validée (information dans les notes de version).

## 10. Exigences fonctionnelles
- FR-01 Les rôles `game-*` listés au §5 existent dans les tokens (V2-DS-01) pour le mode Dark.
- FR-02 Les pavés X01, Cricket, Capital et le Bull de Capital utilisent la convention commune (sous réserve de Q1).
- FR-03 Le style inline `background: '#d90416'` de `CricketKeypad.tsx:93` est supprimé (doublon de la classe).
- FR-04 Chaque état de jeu (actif, bust, fermé, fermé par tous, éliminé, victoire) a un indice non coloré documenté.
- FR-05 Le score du joueur inactif X01 atteint au moins 3:1 sur son fond (objectif 4,5:1).
- FR-06 `getFeedbackStyles` est remplacé par une fonction pure renvoyant `tone: 'bust' | 'miss' | 'notice' | 'info'`.
- FR-07 Les composants exposent `data-tone`/`data-multiplier`/`data-state` pour les tests.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : WCAG 1.4.1, 1.4.3 (texte), 1.4.11 (non-texte) sur les paires `game-*` déclarées.
- NFR-02 Lisibilité à distance (tablette, TV) : contrastes des scores ≥ 7:1 visés pour le joueur actif.

## 12. Cas nominaux et alternatifs
- Nominal : un triple saisi en Cricket ou en Capital s'affiche dans le même ton orange.
- Alternatif : si Q1 est refusée, Capital garde sa convention, documentée comme exception.

## 13. Cas limites
- Joueur actif et triple tous deux orange : distinction par la forme (barre/badge vs libellé « T »).
- Thème club rouge : `game-bust` reste officiel ; `game-active` ne suit plus la marque (V2-BRAND-01).

## 14. Gestion des erreurs
Sans objet.

## 15. Impacts architecturaux
Les couches `src/features/*` ne renvoient plus de classes CSS ; la présentation traduit les intentions. Domaine inchangé.

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée. Contrat des rôles `game-*` partagé avec V2-TV-06 et V2-BRAND-01.

## 17. Compatibilité avec l'existant
Rendu Dark inchangé hors Capital (Q1) et score inactif (FR-05). Spec 005 enrichie par cette convention.

## 18. Dépendances
- V2-DS-01 (063). Consommée par V2-DS-02 (064, tons), V2-DS-03 (065), V2-THEME-01 (068), V2-BRAND-01 (093), V2-TV-06 (086).

## 19. Critères d'acceptation
- AC-01 Cricket et Capital : la touche « triple » (T20) a le même `data-tone="triple"` et la même couleur calculée (test unitaire + capture).
- AC-02 Recherche dans le code : plus de `#d90416` en style inline ; `matchFeedback.ts` ne contient plus de classe Tailwind.
- AC-03 X01 2 joueurs : le score inactif mesure ≥ 3:1 sur son fond (axe-core ou calcul sur la couleur calculée).
- AC-04 Pour chaque état de jeu listé (FR-04), une capture en niveaux de gris permet de l'identifier (revue visuelle documentée).
- AC-05 Documentation de la convention publiée (tableau couleur → sens → indice de forme).

## 20. Scénarios de tests
- Unitaires : tons des touches par jeu ; fonction de ton du feedback.
- E2E : capture des pavés X01/Cricket/Capital ; axe-core contraste.
- Terrain : test rapide avec un joueur daltonien [à confirmer, volontaire].

## 21. Exigences de non-régression
Tests de pavés et de scoreboard ; spec 005 ; spec 017 (Killer), 019 (Gotcha).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Habitudes des joueurs Capital bousculées | Faible | Moyenne | Note de version, décision PO |
| Orange encore partagé marque/triple | Moyen | Moyenne | Indices de forme, `brand` distinct de `game-triple` en valeur |

## 23. Décisions architecturales
ADR 0006 (tokens) : rôles `game-*` réservés. Pas d'ADR propre.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Aligner Capital sur la convention Cricket | Aligner ; garder l'habitude | Aligner (cohérence, apprentissage) | Capital aligné sur la convention commune (y compris le mode plateau) |
| Q2 | Le joueur actif peut-il suivre la couleur du club (§H.16) | Oui sous garde-fou ; jamais | Oui sous garde-fou (V2-BRAND-01) | Oui sous garde-fou (V2-BRAND-01, spec 093) ; non implémenté ici : `game-active` reste un rôle réservé |
| Q3 | Objectif de contraste du score inactif | 3:1 ; 4,5:1 | 4,5:1 visé, 3:1 minimum | 4,5:1 visé et atteint (matrice de contraste, Dark et Light) |

## 25. Traçabilité
Rapport 05 §2.3, §2.5, §4.5, §5.2 ; rapport 06 §2.4 ; compte rendu §C.2, §C.7, §F.3, §H.16 ; specs 005, 017, 019.

## Implémentation (2026-11-20)

- Issue #228 ; branche `feat/v2.0.0` ; vérifiée au commit `24dbbab`.
- Décisions appliquées : Q1 à Q3 selon la recommandation ; Q2 attend V2-BRAND-01 pour sa mise en œuvre.
- Fichiers principaux :
  - Rôles `game-*` dans `src/styles/tokens/themes.css` (Dark et Light) et `bridge.css` : simple, double (cyan), triple (orange), Bull (vert — émeraude 700 en Dark), double bull (rouge), `on-game`, bust, fermé, fermé par tous, éliminé, victoire, joueur actif, scores actif et inactif, identités des six jeux. Convention publiée dans [docs/design-system.md](../../docs/design-system.md) §3 (AC-05).
  - `components/ui/buttonStyles.ts` (`KEYPAD_TONES`) ; pavés X01, Cricket et Capital (tous modes, y compris le plateau) sur la convention commune, avec `data-tone` et `data-multiplier` sur chaque touche ; style inline `#d90416` supprimé (AC-02).
  - Libellés au clavier : « BULL (25) » et « D-BULL (50) » au Cricket, alignés au Capital qui affichait « BULLE (25) » / « D-BULLE (50) » (`components/game/multiplierStyles.ts`, demande du PO).
  - `src/features/x01/scoring/matchFeedback.ts` : fonction pure renvoyant `tone` ∈ `bust`, `miss`, `notice`, `info`, sans classe Tailwind (FR-06).
  - Indices non colorés : joueur actif X01 et Cricket (fond, bordure ou barre, ▶), Cricket fermé (X cerclé, `data-state="closed"`) et fermé par tous (barré, `data-state="dead"`), libellés « TROP ! », « S » / « D » / « T ».
- Tests unitaires : `tests/unit/components/capitalKeypad.test.tsx` (convention sur tous les modes Capital ; T20 avec le même ton et les mêmes classes métier en Cricket et en Capital, AC-01), `keypads.test.tsx` (convention partagée), `tests/unit/x01/matchScoring.test.ts` (ton du feedback, AC-02), `tests/unit/designSystem/themeContrast.test.ts` (paires `game-*`, dont `game-score-inactive` ≥ 4,5:1 sur `canvas` et `surface`, AC-03 par calcul).
- Écarts et restes :
  - AC-03 : contraste vérifié par calcul sur les tokens ; E2E axe-core non écrit (V2-QA-05).
  - AC-04 : revue des captures en niveaux de gris non réalisée.
  - Q2 : couleur de club pour le joueur actif à traiter par V2-BRAND-01.
