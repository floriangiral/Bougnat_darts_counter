---
id: 071-counter-tablet-landscape-fixes
v2_id: V2-TAB-02
titre: Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé)
type: fonctionnel
statut: cloturee
validation: validee
origine: Backlog existant
famille: tablette
priorite: P0
difficulte: M
recommandation: recommande
lot: 0
poids: 50
depend_de: []
remplace: []
remplacee_par: []
issue: '#209'
verifie_au_commit: 7d90e54
transfere_a: [V2-QA-05, V2-QA-09]
derniere_revue: 2026-11-27
---

# 071 — Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé)

> **Statut : CLÔTURÉE, recette validée le 2026-11-27.** Voir la clôture en fin de document ; les constats d'implémentation antérieurs sont conservés comme historique.

## 1. Origine et contexte
Backlog existant : invariants 3 (48 px) et 5 (« compact ne masque jamais l'action ») de la spec 027, points connus de `docs/release/v2.0.0.md:74-75`. Rapport d'audit 06 (§2.2-2.3, §3 P1-P6/P10, §4.4) et compte rendu §A (faiblesse 3), §C.3, §G (Lot 0). Ces correctifs sont **indépendants du design V2** (arène, tokens) et peuvent entrer dans la 2.0.0 non publiée (question §H.1 / D5).

## 2. Problématique
Sur des tablettes courantes en paysage dans un navigateur, l'application affiche la présentation téléphone ; sur certains formats, le score X01 disparaît, des touches de jeu sont inatteignables et une ligne de Cricket est coupée. Même en présentation tablette, le pavé X01 est écrasé sous 760 px de haut et les touches passent sous 48 px.

## 3. Objectifs
- O1. Aucun profil tablette courant ne perd une information ou une action de jeu.
- O2. Plancher tactile de 48 px rétabli sur tablette pour toutes les actions primaires.
- O3. Tests E2E qui exercent la détection réelle (sans `?mode=dedicated_tablet`) sur des viewports réalistes.

## 4. État actuel vérifié dans le code
- [vérifié] Classification : `src/features/tablet/tabletLayout.ts:22-23`, `:36-44` (petit côté ≥ 768 et grand côté ≤ 1279 pour une tablette tactile). [émulation rapport 06] 1080×750, 1280×696/752 et 960×520 → `smartphone` ; 1366×950 → `default` (pas de plancher tactile).
- [vérifié] **Cascade** : `src/styles/tailwind.css:198-209` (`[data-layout='tablet'] .tablet-x01-control-area { height: auto }`, spécificité 0-2-0) est écrasée par `:535-540` (`.x01-control-area.laptop-compact-control-area { height: clamp(13.5rem, 34svh, 18rem) }`, spécificité 0-2-0, déclarée après) pour toute hauteur ≤ 760 px. [émulation] pavé ≈ 236 px de haut, touches 26-34 px, vide sous le pavé (capture rapport 06 `dt-galaxytab-land-chrome-x01.png`).
- [vérifié] **Plancher 48 px écrasé** : `tailwind.css:164-167` (`[data-layout='tablet'] button { min-height: 3rem }`) annulé pour le pavé X01 par `:508-512` (`.x01-keypad-root button { min-height: 0 }` dès 768 px), placé volontairement en fin de fichier (commentaire `:494-501`).
- [vérifié] **Score 0 px** : `tailwind.css:524-528` plafonne la taille du score à `120cqh` de sa boîte ; si la boîte a une hauteur nulle, le score est invisible (rapport 06 : 960×520 en présentation téléphone).
- [vérifié] **Killer** : `views/KillerGameView.tsx:115` racine `h-[100dvh] overflow-hidden` ; [émulation] à 960×520 les 21 touches de numéro sont hors écran et inatteignables.
- [vérifié] **Cricket** : `views/CricketGameView.tsx:320` tableau `overflow-hidden` ; [émulation] ligne Bull masquée dans les paysages classés téléphone (1024×700 à 1280×696).
- [émulation rapport 06] Boutons d'en-tête 40×48 px en Capital/Triathlon tablette ; 34-40 px sur iPad Pro (présentation bureau).
- [vérifié] Tests : `tests/e2e/tablet-layout.smoke.spec.ts:17` force `?mode=dedicated_tablet` ; aucune assertion de taille de cible ; `tests/unit/tabletLayout.test.ts:69` fige `1024×600 → isSmartphone: true`.

## 5. Comportement cible
Les tablettes tactiles en paysage sont classées tablette, même avec les barres du navigateur ; le pavé X01 occupe sa colonne ; toutes les touches primaires mesurent ≥ 48 px ; le score X01 reste lisible ; Killer et Cricket gardent toutes leurs touches et lignes visibles ou atteignables.

## 6. Périmètre
### Inclus
- Élargissement **transitoire** de la classification tablette (absorbé ensuite par V2-TAB-01).
- Correction de la cascade `:198` vs `:535`.
- Plancher 48 px du pavé X01 en tablette (grille dimensionnée sur le plancher).
- Taille minimale garantie du score X01.
- Touches Killer atteignables, ligne Bull Cricket visible.
- Boutons d'en-tête carrés 48 px en tablette.
- Tests E2E réalistes sans forçage, assertions de taille.
### Exclu
- Disposition arène (V2-TAB-03), résolveur complet (V2-TAB-01), orientation (V2-TAB-05), lisibilité à distance des jeux non-X01 (V2-TAB-03).

## 7. User stories
- En tant que joueur sur Galaxy Tab dans Chrome, je veux des touches de pavé confortables, afin de saisir sans erreur.
- En tant que joueur de Killer sur une petite tablette, je veux voir toutes les touches de numéro, afin de pouvoir jouer.
- En tant que joueur de Cricket, je veux voir la ligne Bull, afin de connaître l'état de la cible.

## 8. Règles métier
Aucune règle de jeu modifiée ; une règle de présentation : toute information et action nécessaire au jeu est visible ou atteignable.

## 9. Parcours utilisateurs
Inchangés.

## 10. Exigences fonctionnelles
- FR-01 Un viewport tactile dont le grand côté est ≥ 960 px et le petit côté ≥ 480 px, jusqu'à 1400 px de grand côté, est présenté en tablette (règle transitoire, seuils à confirmer, Q1).
- FR-02 En présentation tablette paysage, la hauteur de la zone de saisie X01 n'est jamais réduite par la règle « bureau compact » (`tailwind.css:535-540`).
- FR-03 En présentation tablette, chaque touche du pavé X01, Cricket, Capital, Killer, Gotcha et chaque bouton d'en-tête mesure ≥ 48 × 48 px.
- FR-04 Le score X01 du joueur actif n'est jamais rendu sous un seuil minimal (proposition : 48 px de corps en tablette, 28 px en téléphone, Q2).
- FR-05 Killer : les 21 touches de numéro sont visibles ou atteignables par défilement de la seule zone de saisie, quel que soit le profil supporté.
- FR-06 Cricket : les 7 lignes (15 à 20, Bull) sont visibles sans défilement en tablette ; en téléphone, visibles ou atteignables.
- FR-07 Les tests E2E tablette n'utilisent plus `?mode=dedicated_tablet` pour la détection et couvrent au moins 1080×750, 1280×696, 1280×800, 960×520 et 1366×950.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : WCAG 2.5.8 (≥ 24 px) largement dépassé ; objectif produit 48 px tablette.
- NFR-02 Aucune régression téléphone/bureau (spec 028, notes v2.0.0 « PC à fenêtre basse »).
- NFR-03 Aucune dépendance, coût 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : Galaxy Tab 1280×696 → tablette, pavé X01 pleine colonne, touches ≥ 48 px.
- Alternatif : fenêtre de bureau 1536×620 (pointeur fin) → inchangée (bureau compact).

## 13. Cas limites
- 1024×600 exact (7") : tablette compacte ; si la hauteur ne permet pas 4 rangées de 48 px + score lisible, la zone joueurs se réduit d'abord, jamais les touches.
- iPad mini portrait (744 px) : reste en présentation téléphone agrandie (acceptable, rapport 06) jusqu'à V2-TAB-01.
- Rotation pendant une partie : état conservé.

## 14. Gestion des erreurs
Sans objet (présentation).

## 15. Impacts architecturaux
`src/features/tablet/tabletLayout.ts` (seuils), `src/styles/tailwind.css` (cascade, planchers), vues Killer/Cricket/X01. Aucun impact domaine. Les seuils transitoires sont remplacés par V2-TAB-01 (070).

## 16. Impacts sur les données et les interfaces
Aucun.

## 17. Compatibilité avec l'existant
Téléphones (< 960 px de grand côté) : inchangés, `requiresPortrait` inchangé. Effet de bord positif : les tablettes ne sont plus `smartphone`, donc `usePortraitLock` (`App.tsx:220`) ne peut plus leur être appliqué.

## 18. Dépendances
- Aucune bloquante. Coordination : V2-DS-02 (064, plancher dans `Button`), V2-QA-09 (042, matrice réaliste), V2-REL-01 (033, inclusion en 2.0.0).
- Absorbée à terme par V2-TAB-01 (070) et V2-TAB-03 (072) ; corrige les invariants 3 et 5 de 027 (V2-TAB-04).

## 19. Critères d'acceptation
- AC-01 Chromium tactile 1080×750, 1280×696, 1280×800, 1366×950 sans paramètre : `data-layout="tablet"`.
- AC-02 Sur ces profils et 1024×600, X01 : toutes les touches du pavé mesurent ≥ 48 × 48 px et le pavé occupe la hauteur de sa colonne (pas de vide > 48 px sous la dernière rangée).
- AC-03 960×520 tactile, X01 : le score du joueur actif a une hauteur de glyphe > 0 et un corps ≥ seuil FR-04.
- AC-04 960×520 tactile, Killer avec 6 joueurs : chacune des 21 touches est cliquable (`toBeInViewport` après défilement éventuel de la zone de saisie).
- AC-05 1024×700 à 1280×696, Cricket : la ligne Bull est visible (`toBeInViewport`).
- AC-06 Boutons d'en-tête Capital et Triathlon en tablette : ≥ 48 × 48 px.
- AC-07 Téléphones 320×568, 390×844, 844×390 et bureau 1366×650, 1536×620 : mêmes résultats E2E qu'au commit 508dfa6.

## 20. Scénarios de tests
- Unitaires : nouvelle table de classification (mise à jour de `tests/unit/tabletLayout.test.ts:69`).
- E2E : `tablet-layout.smoke.spec.ts` sans forçage, projets réalistes, mesure des boîtes (AC-02 à AC-06).
- Terrain : iPad Safari paysage, Galaxy Tab Chrome [à confirmer selon appareils].

## 21. Exigences de non-régression
Notes v2.0.0 (pavé aligné, PC à fenêtre basse, score entier), specs 014, 021, 028 ; E2E smartphone.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Désalignement du pavé (motif historique du `min-height: 0`) | Moyen | Élevée | Grille dimensionnée sur 48 px, captures |
| Seuils transitoires inadaptés à un appareil réel | Moyen | Moyenne | Tests terrain ; remplacés par TAB-01 |
| Régression PC fenêtre basse | Moyen | Faible | AC-07 |

## 23. Décisions architecturales
Aucune nouvelle (règle transitoire) ; la décision durable est l'ADR 0007 (V2-TAB-01).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Seuils transitoires | Grand côté ≥ 960 et petit côté ≥ 480 ; attendre TAB-01 | Seuils transitoires maintenant (défauts observables) | Pas de seuils transitoires : la classification est remplacée directement par le résolveur de 070 |
| Q2 | Taille minimale du score X01 | 48 px tablette / 28 px téléphone ; autre | 48 / 28 px, ajustables après mesure | 48 px tablette / 28 px téléphone (`--x01-score-floor`), ajustables après mesure |
| Q3 | Inclusion dans 2.0.0 (§H.1, D5) | 2.0.0 ; 2.0.x | 2.0.0 (Lot 0) | Inclus dans la 2.0.0 |
| Q4 | Killer : défilement de la zone de saisie accepté | Oui ; grille compacte obligatoire | Grille compacte d'abord, défilement en dernier recours | Grille compacte d'abord ; en dernier recours, seule la zone de saisie défile |

## 25. Traçabilité
Rapport 06 §2.2, §2.3, §2.5, §3, §4.4 (captures `files/screens/` de la session d'audit) ; compte rendu §A, §C.3, §G (Lot 0), §H.1 ; spec 027 (invariants 3 et 5), `docs/release/v2.0.0.md:74-75`.

## Implémentation (2026-11-20)

- Issue #209 ; branche `feat/v2.0.0` ; vérifiée au commit `24dbbab`.
- Décisions appliquées : Q1 à Q4 selon la recommandation, Q1 étant absorbée par le résolveur de la spec 070 (aucune règle transitoire n'a été écrite).
- Correctifs :
  - Classification (FR-01, AC-01) : 1080×750, 1280×696, 1280×800, 960×520, 1024×600 et 1366×950 tactiles sont classés tablette par `resolveViewportClass` (spec 070).
  - Cascade (FR-02) : la règle « bureau à fenêtre basse » de `src/styles/games/x01.css` est limitée à `[data-layout='default']` ; elle ne réduit plus la zone de saisie d'une tablette.
  - Plancher 48 px (FR-03) : seul le bureau (pointeur fin) retire la hauteur minimale des touches du pavé X01 ; la classe `bd-touch-target` des composants de base (spec 064) donne 48 px en tablette tactile et 44 px en téléphone tactile ; boutons d'en-tête `IconButton` carrés de 48 px en tablette ; en tablette portrait, la zone de saisie X01 garde la place de quatre rangées de 48 px.
  - Score X01 (FR-04) : plancher `--x01-score-floor` (48 px tablette, 28 px téléphone) dans le calcul de taille du score.
  - Killer (FR-05) : grille compacte, défilement de la seule zone de saisie en dernier recours (`src/styles/games/killer.css`).
  - Cricket (FR-06) : le tableau grandit ou défile au lieu d'être coupé ; la ligne Bull n'est jamais masquée (`src/styles/games/cricket.css`).
- Tests unitaires : table de vérité de classification de la spec 070 (`tests/unit/layout/viewportClass.test.ts`, remplace `tests/unit/tabletLayout.test.ts`).
- Tests E2E écrits, **non exécutés localement** : projets `tablet-*` de `playwright.config.ts` (1080×750, 1366×950, 1280×696, 1280×800, 960×520, 1024×600, 810×1010), sans `?mode=dedicated_tablet` ; `tests/e2e/tablet-layout.smoke.spec.ts` mesure les boutons d'en-tête et de saisie de chaque jeu (≥ 48 × 48 px, atteignables), l'absence de débordement, le corps du score X01 (≥ 48 px) et l'absence de vide de plus de 48 px sous le pavé X01 en paysage.
- Écarts et restes :
  - AC-04 est vérifié avec la configuration par défaut de Killer, pas avec 6 joueurs ; AC-05 (ligne Bull visible) est garanti par la CSS mais pas mesuré explicitement par l'E2E.
  - AC-07 : la non-régression téléphone/bureau n'est pas comparée au commit 508dfa6 (captures V2-QA-05, spec 041).
  - Recette terrain (iPad Safari paysage, tablette Android) à faire.


## Clôture (2026-11-27)

- Périmètre livré en production `2.2.0`, vérifié dans l'arbre du commit `7d90e54` : [`src/styles/games`](../../src/styles/games) et [`tests/e2e/tablet-layout.smoke.spec.ts`](../../tests/e2e/tablet-layout.smoke.spec.ts).
- Recette validée par le product owner le 27/11/2026 : « toutes les recettes sont faites depuis la mise en prod » et « Tout a été testé ». Cette confirmation globale ne reconstitue ni une liste d'appareils ni des mesures non consignées.
- Preuves de CI et de production : [bilan de recette 2.2.0](../../docs/release/v2.2.0.md#recette-validée-le-27112026). Aucun E2E ni smoke exécuté localement.
- Reliquats transférés, non déclarés réalisés :
  - [V2-QA-05](../041-counter-qa-accessibility-visual-regression/spec.md) : captures automatisées de référence, régression visuelle et axe-core non livrés. La proposition reste `a-valider`.
  - [V2-QA-09](../042-counter-qa-real-device-matrix/spec.md) : assertions chiffrées et matrice automatisée d'appareils non livrées. La proposition reste `a-valider`.
