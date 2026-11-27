---
id: 070-counter-size-class-resolver
v2_id: V2-TAB-01
titre: Résolveur unique classes de taille et orientation
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande V2
famille: tablette
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 40
depend_de: []
remplace: []
remplacee_par: []
issue: '#221'
verifie_au_commit: f4341ed
derniere_revue: 2026-11-27
---

# 070 — Résolveur unique classes de taille et orientation

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #221, branche `feat/v2.0.0`, chantier « refonte tablette et thèmes »). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la recette terrain et l'exécution des tests E2E dans la CI de la PR restent à faire (`validation: en-attente`).

## 1. Origine et contexte
Demande V2 (chantier 5.3 « tablette support de premier plan »), rapport d'audit 06 (§2.1-2.2, §4.1), compte rendu §C.3, §F.3 et §G (« fondation clé : résolveur de taille unique — téléphone + tablette + TV contrôleur »). La décision d'architecture est portée par l'**ADR 0007 — classes de taille** (à rédiger dans `docs/adr/`). Cette spec succède à la partie « détection » des specs 027 (V2-TAB-04) et 028 (V2-TAB-06).

## 2. Problématique
La détection actuelle raisonne en « type d'appareil » avec des seuils qui supposent un viewport sans barres de navigateur : en pratique, une tablette en paysage dans un onglet tombe dans la présentation téléphone, et une seconde détection indépendante vit dans `MatchView`.

## 3. Objectifs
- O1. Une seule source de vérité pour la présentation : classes de largeur et de hauteur, orientation, modalité d'entrée.
- O2. Classification correcte des profils réels (iPad Safari paysage, Galaxy Tab 1280×800, petites tablettes, iPad Pro) par table de vérité testée.
- O3. Suppression de la détection parallèle de `MatchView`.
- O4. Une base stable pour l'arène (V2-TAB-03), l'orientation (V2-TAB-05), la voix et le contrôleur TV.

## 4. État actuel vérifié dans le code
- [vérifié] `src/features/tablet/tabletLayout.ts:22-26` : seuils `TABLET_MIN_WIDTH = 768`, `TABLET_MAX_WIDTH = 1279`, `COMPACT_HEIGHT = 700`, `PHONE_MAX_LONG_SIDE = 960`.
- [vérifié] `tabletLayout.ts:36-44` : tablette = (`dedicated_tablet` et largeur ≥ 768) ou (pointeur grossier, petit côté ≥ 768, grand côté ≤ 1279) ; téléphone = petit côté < 768 et (pointeur grossier ou largeur < 768).
- [vérifié] `tabletLayout.ts:53-54` : `requiresPortrait` (téléphone tactile en paysage, grand côté < 960).
- [vérifié] `tabletLayout.ts:58-62` : `TABLET_BREAKPOINTS` exporté, jamais importé.
- [vérifié] `src/features/tablet/useTabletLayout.ts:10-15` : entrées `innerWidth`, `innerHeight`, `matchMedia('(pointer: coarse)')`, mode d'accès.
- [vérifié] `App.tsx:213-220` : `layoutMode` = `tablet` | `smartphone` | `default` ; `App.tsx:322-325` pose `data-layout`, `data-tablet-orientation`, `data-tablet-density` sur la racine.
- [vérifié] Détection parallèle : `views/MatchView.tsx:246-266` (`isCompactBrowserMobile` = `max-width: 767px` et non standalone), consommée l.691, 694, 715.
- [vérifié] `tests/unit/tabletLayout.test.ts:69` fige `1024×600 → isSmartphone: true`.
- [vérifié] `tests/e2e/tablet-layout.smoke.spec.ts:17` force `/?mode=dedicated_tablet`, ce qui court-circuite la détection ; `playwright.config.ts:24-36` n'utilise que 768×1024, 1024×768, 1024×600.
- [émulation rapport 06, Chromium] iPad 10,2" Safari paysage 1080×750 → `smartphone` ; Galaxy Tab 1280×696/752 → `smartphone` ; 960×520 → `smartphone` ; iPad Pro 12,9" 1366×950 → `default` ; iPad mini (744 px de petit côté) → `smartphone` par calcul statique. Hauteurs « avec barres » = [hypothèse].

## 5. Comportement cible
Une fonction pure `resolveViewportClass(input)` renvoie : classe de largeur (`compact` < 600, `medium` 600-839, `expanded` 840-1199, `large` ≥ 1200), classe de hauteur (`compact` < 480, `medium` 480-899, `expanded` ≥ 900), orientation (`landscape` si largeur ≥ hauteur), modalité (`touch` si `any-pointer: coarse` ou forçage), densité (`tight` 480-599, `compact` 600-759, `comfortable` 760-899, `spacious` ≥ 900) et une **recette** de mise en page :

| Recette | Condition | Exemples |
|---|---|---|
| `stack` | portrait, largeur `compact`/`medium` | téléphones portrait, iPad 10,2" portrait, Galaxy Tab portrait |
| `stack-wide` | portrait, largeur ≥ `expanded` | iPad Pro 12,9" portrait |
| `arena` | paysage, largeur ≥ `expanded`, hauteur ≥ `medium` | 1080×750, 1280×696, 1366×950, 960×520 |
| `phone-landscape` | paysage, hauteur `compact` | 844×390, 932×430 |

Les valeurs sont exposées sur la racine par des attributs (`data-size-w`, `data-size-h`, `data-orientation`, `data-input`, `data-density`, `data-recipe`) et par un hook unique.

## 6. Périmètre
### Inclus
- Fonction pure, hook unique, attributs racine.
- Table de vérité unitaire couvrant au moins les 12 profils du rapport 06 et les profils téléphone/bureau existants.
- Suppression de `isCompactBrowserMobile` dans `MatchView` (remplacé par la densité/la recette).
- Rôle de `dedicated_tablet` redéfini (Q1).
- Compatibilité transitoire : `data-layout` continue d'être posé, dérivé de la recette, tant que la CSS n'est pas migrée.
### Exclu
- Nouvelle mise en page arène (V2-TAB-03) ; correctifs CSS immédiats (V2-TAB-02) ; invite d'orientation tablette (V2-TAB-05) ; décision portrait téléphone (V2-TAB-06) ; projets Playwright réalistes (V2-QA-09, réutilise la table).

## 7. User stories
- En tant que joueur sur iPad dans Safari, je veux obtenir la présentation tablette en paysage, afin d'avoir des touches et un score adaptés.
- En tant que mainteneur, je veux une table de vérité unique, afin de prédire la présentation de n'importe quel viewport.

## 8. Règles métier
Sans objet (présentation) ; les règles de jeu et les contrats de session sont identiques dans toutes les recettes.

## 9. Parcours utilisateurs
Inchangés ; seule la présentation obtenue change sur les profils mal classés aujourd'hui.

## 10. Exigences fonctionnelles
- FR-01 Une seule fonction de classification est utilisée par toute l'application ; aucune autre lecture de `matchMedia` de taille dans les vues.
- FR-02 Seuils : largeur 600/840/1200, hauteur 480/900 ; densité dérivée de la hauteur. Les seuils sont des constantes nommées testées.
- FR-03 La modalité `touch` ne change que les planchers de cibles et les états de survol, jamais la structure.
- FR-04 La recette est recalculée sur `resize`, `orientationchange` et changement de `any-pointer`, sans perte d'état de partie ni de saisie en cours.
- FR-05 `requiresPortrait` (ou son successeur) est conservé tel que décidé par V2-TAB-06 et ne s'applique jamais à une classe tablette.
- FR-06 `data-layout` reste disponible (dérivé) jusqu'à la fin de la migration CSS, puis est retiré.
- FR-07 `TABLET_BREAKPOINTS` inutilisé est supprimé ou remplacé par les nouvelles constantes exportées.
- FR-08 Sur smartphone, la barre de raccourcis X01 est proposée à partir de 600 px de hauteur (densité `compact` ou supérieure) si elle est activée ; en dessous, elle est masquée pour préserver le pavé et le score. Entre 600 et 719 px, la barre mesure 36 px et les touches sont compactées à 36 px ; à partir de 720 px, la hauteur historique de 44 px est conservée.

## 11. Exigences non fonctionnelles
- NFR-01 Pas de détection par user-agent.
- NFR-02 Fonction pure couverte à 100 % (spec 029).
- NFR-03 Coût récurrent 0 € (client seul) ; aucune dépendance.

## 12. Cas nominaux et alternatifs
- Nominal : iPad 1080×750 tactile → `arena`, `touch`, densité `tight`/`compact`.
- Alternatif : fenêtre de bureau 1536×620, pointeur fin → `arena` si D3 l'accepte pour le PC, sinon recette bureau actuelle (Q2).

## 13. Cas limites
- iPad en multitâche (fenêtre portrait sur écran paysage) : recette `stack` selon la fenêtre [à confirmer sur appareil].
- iPad avec trackpad : `any-pointer: coarse` reste vrai [à confirmer].
- Pliables et fenêtres redimensionnées en continu : recalcul sans boucle de rendu.
- Clavier virtuel ouvert (hauteur réduite) : la recette ne doit pas basculer pendant la saisie des prénoms (stabilisation par `visualViewport`, Q4).

## 14. Gestion des erreurs
Valeurs nulles ou `matchMedia` indisponible : recette `stack`, modalité `touch` (choix sûr).

## 15. Impacts architecturaux
Module pur dans `src/features/layout/` (ou renommage de `src/features/tablet/`), hook en présentation, lecture unique dans `App`. `MatchView` reçoit la recette/densité au lieu de détecter. ADR 0007.

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée. Contrat d'attributs racine documenté (consommé par la CSS et les tests E2E).

## 17. Compatibilité avec l'existant
Téléphones portrait et bureau : même présentation qu'aujourd'hui (table de vérité de non-régression). Les profils tablette mal classés changent volontairement. Spec 001 (V2-ARCH-12) : `dedicated_tablet` est redéfini en coordination.

## 18. Dépendances
- Aucune dépendance bloquante.
- Débloque : V2-TAB-03 (072), V2-TAB-04 (027), V2-TAB-05 (073), V2-ARCH-12 (001), V2-QA-09 (042).
- Coordination : V2-TAB-02 (071) peut précéder avec un élargissement minimal des seuils, absorbé ici.

## 19. Critères d'acceptation
- AC-01 Table de vérité unitaire : pour chaque profil (1080×750, 1080×810, 810×1010, 1366×950, 1024×1292, 1280×696, 1280×752, 1280×800, 800×1176, 960×520, 600×880, 744×1133, 390×844, 844×390, 320×568, 1536×620 fin, 1440×900 fin), la recette attendue est obtenue.
- AC-02 Recherche dans le code : plus aucun `matchMedia('(max-width: 767px)')` dans `views/` ; `isCompactBrowserMobile` supprimé.
- AC-03 E2E sans `?mode=dedicated_tablet` sur 1080×750 tactile : la racine porte `data-recipe="arena"`.
- AC-04 E2E : rotation 810×1010 → 1080×750 pendant une partie X01 avec une saisie en cours : saisie et scores inchangés.
- AC-05 E2E de non-régression : téléphones 390×844 et bureau 1440×900 obtiennent la même présentation qu'au commit 508dfa6 (captures V2-QA-05).
- AC-06 Tests unitaires de `MatchView` : les raccourcis mobiles sont masqués à 599 px et proposés à 600 px, 719 px et 720 px. Les règles CSS prévoient une barre de 36 px de 600 à 719 px, puis 44 px dès 720 px ; les dimensions effectives restent à recetter sur appareil.

### Décision complémentaire du product owner (2026-11-27)

Pour corriger l’écart entre l’application installée et le navigateur, abaisser à 600 px le seuil d’affichage de la barre mobile X01, en cohérence avec la densité compacte du résolveur. Entre 600 et 719 px, compacter la rangée et les touches à 36 px ; sous 600 px, garder la barre masquée et l’expliquer dans les réglages. L’application installée offre souvent davantage de hauteur disponible qu’un onglet de navigateur. Implémentation `f4341ed`, prévue en 2.2.0 ; recette sur appareil suivie dans #354 et #361.

## 20. Scénarios de tests
- Unitaires : table de vérité (AC-01), cas limites (valeurs nulles, forçage).
- E2E : projets réalistes de V2-QA-09 ; rotation en partie.
- Terrain : iPad Safari, iPad PWA, Galaxy Tab Chrome, petite tablette Android [à confirmer selon appareils disponibles].

## 21. Exigences de non-régression
Specs 021 (score), 027/028 (invariants conservés : safe areas, mêmes cas d'usage, aucun sélecteur tablette ne touche téléphone/bureau), spec 010 (reprise).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Régression téléphone/bureau | Élevé | Moyenne | Table de vérité + captures |
| Seuils mal calibrés pour des barres réelles | Moyen | Moyenne | Tests terrain, seuils en constantes |
| Double source pendant la transition | Faible | Moyenne | `data-layout` dérivé, retrait planifié |

## 23. Décisions architecturales
ADR 0007 — classes de taille (option « classes de taille + orientation + modalité » retenue contre « ajuster les seuils » et « user-agent », rapport 06 §4.1).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Rôle de `dedicated_tablet` (D9) | Forçage de structure ; forçage `touch` seulement | Forçage `touch` (et densité), pas de structure | Forçage `touch` seulement : `dedicated_tablet` ne change jamais la structure |
| Q2 | Recette `arena` pour le bureau (D3) | Oui ; conserver le rendu PC | Oui, après validation de TAB-03 sur tablette | Rendu PC conservé pour l'instant : la recette `arena` est calculée mais la CSS ne l'applique qu'avec `data-input="touch"` ; arène sur PC après validation sur tablette |
| Q3 | Nom du module | `src/features/layout/` ; garder `tablet/` | `src/features/layout/` | `src/features/layout/` (`src/features/tablet/` supprimé) |
| Q4 | Stabilisation clavier virtuel | Ignorer les variations `visualViewport` pour la recette ; recalcul brut | Ignorer pour la recette, garder `--app-viewport-height` | Hauteur de fenêtre (`innerHeight`), pas `visualViewport`, pour la recette ; `--app-viewport-height` inchangé |

## 25. Traçabilité
Rapport 06 §2.1, §2.2, §3 (P1, P6, P10, P11), §4.1 ; compte rendu §A (faiblesse 3), §C.3, §F.3, §G (Lot 1) ; ADR 0007 ; specs 001, 021, 027, 028.

## Implémentation (2026-11-20)

- Issue #221 ; branche `feat/v2.0.0` ; vérifiée au commit `24dbbab`.
- Décisions appliquées : Q1 à Q4 selon la recommandation (colonne « Décision »). L'[ADR 0007](../../docs/adr/0007-classes-de-taille-et-orientation.md) est acceptée.
- Fichiers principaux :
  - `src/features/layout/viewportClass.ts` : fonction pure `resolveViewportClass` (classes de largeur 600/840/1200, de hauteur 480/900, densité 600/760/900, orientation, modalité, recette `stack` / `stack-wide` / `arena` / `phone-landscape`), constantes nommées exportées ; repli sûr (`stack`, tactile) pour des dimensions nulles ou invalides ; `matchMedia` indisponible → tactile. Une fenêtre de bureau (pointeur fin) de moins de 768 px garde la présentation téléphone (`DESKTOP_NARROW_WIDTH`, comportement antérieur conservé).
  - `src/features/layout/useViewportClass.ts` : hook unique lu par `App` (`resize`, `orientationchange`, changement de `any-pointer: coarse`), sans nouveau rendu quand la classe ne change pas ; `ViewportContext` / `useViewport()` pour les vues.
  - `App.tsx` : attributs racine `data-size-w`, `data-size-h`, `data-orientation`, `data-input`, `data-density`, `data-recipe` et `data-layout` **dérivé** (FR-06 : conservé tant que la CSS le lit, retrait ultérieur).
  - `views/MatchView.tsx` : plus aucune détection locale ; `isCompactPhone` vient du contexte (présentation téléphone et densité `tight`/`compact`). `isCompactBrowserMobile` est supprimé.
  - Supprimés : `src/features/tablet/` (dont `TABLET_BREAKPOINTS`) et `tests/unit/tabletLayout.test.ts`.
- Tests unitaires : `tests/unit/layout/viewportClass.test.ts` (table de vérité des profils d'AC-01, plus 1024×600, 932×430 et une fenêtre de bureau étroite ; seuils ; forçage `dedicated_tablet` ; repli ; contrat d'attributs), `tests/unit/layout/useViewportClass.test.tsx` (lecture, absence de `matchMedia`, recalcul à la rotation sans rendu inutile, contexte).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/tablet-layout.smoke.spec.ts` (détection réelle sans `?mode=dedicated_tablet`, AC-03 ; rotation 810×1010 → 1080×750 avec une saisie en cours, AC-04) sur les sept profils tablette de `playwright.config.ts` ; `tests/e2e/smartphone-layout.smoke.spec.ts` (recettes `stack` et `phone-landscape`).
- Écarts et restes :
  - AC-05 : captures de non-régression téléphone/bureau non produites (dépend de V2-QA-05, spec 041).
  - `data-layout` est toujours posé et lu par la CSS : son retrait reste à planifier (FR-06).
  - FR-03 : tant que l'arène n'est pas validée sur PC (Q2), la CSS n'applique les recettes `arena` et `phone-landscape` qu'avec `data-input="touch"` ; la modalité conditionne donc aussi la structure (écart temporaire assumé).
  - Cas limites §13 (multitâche iPad, iPad avec trackpad) et recette terrain (iPad Safari, iPad écran d'accueil, Galaxy Tab Chrome, petite tablette Android) à faire.
  - Coordination avec V2-ARCH-12 (spec 001) : le rôle de `dedicated_tablet` est redéfini dans le code, la spec 001 n'a pas été modifiée.
