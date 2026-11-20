---
id: 068-counter-light-mode
v2_id: V2-THEME-01
titre: Mode Light
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande V2
famille: design-system
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [V2-DS-03, V2-THEME-02]
remplace: []
remplacee_par: []
issue: '#242'
verifie_au_commit: 24dbbab
derniere_revue: 2026-11-20
---

# 068 — Mode Light

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #242, branche `feat/v2.0.0`, chantier « refonte tablette et thèmes »). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la recette terrain et l'exécution des tests E2E dans la CI de la PR restent à faire (`validation: en-attente`).

## 1. Origine et contexte
Demande V2 (chantier 5.2), rapport d'audit 05 (§5), compte rendu §C.2, §F.3 et §G (Lot 2 : « V2-THEME-02 puis V2-THEME-01 à 100 % »). La revue croisée a retenu que **le Light n'est activé en production que lorsque 100 % des écrans sont migrés** vers les tokens (V2-DS-03) : pas de Light partiel.

## 2. Problématique
L'application n'existe qu'en sombre. En plein jour, en salle éclairée ou sur une tablette posée près de la cible, un thème clair améliore la lisibilité ; mais une simple inversion des couleurs actuelles produirait des contrastes insuffisants (orange de marque à 2,82:1 sur blanc) et des lueurs invisibles.

## 3. Objectifs
- O1. Une palette claire **conçue** (« Craie », nom à valider), pas une inversion.
- O2. Tous les couples texte/fond déclarés conformes WCAG 2.x AA (4,5:1 texte, 3:1 grand texte et non-texte) ; scores ≥ 7:1 visés.
- O3. Même géométrie, mêmes composants, mêmes significations de couleurs de jeu qu'en Dark.
- O4. Activation à 100 % des écrans migrés, sans exception.

## 4. État actuel vérifié dans le code
- [vérifié] Aucun thème clair, 0 `dark:`, aucune détection `prefers-color-scheme` (voir 063 et 069).
- [vérifié] 167 transparences `*-white/x` (élévation par voile blanc) et 100 valeurs arbitraires (lueurs `shadow-[0_0_…rgba(234,88,12,…)]`, ex. `components/game/PlayerScore.tsx:78`, `components/ui/Button.tsx:19`) qui ne fonctionnent que sur fond sombre (rapport 05 §2.2).
- [calcul rapport 05] `orange-500` sur blanc = 2,82:1 → interdit pour du texte en clair ; blanc sur `orange-600` = 3,57:1.
- [vérifié] `index.html:10` `apple-mobile-web-app-status-bar-style: black-translucent` : texte blanc de barre d'état, à revoir en clair [à confirmer sur iOS].
- [vérifié] Aucun test de contraste ni capture de référence aujourd'hui (pris en charge par V2-QA-05).

## 5. Comportement cible
Le thème `light` fournit des valeurs pour tous les rôles de V2-DS-01 et V2-DS-04. Principes : fond chaud cassé (proposition `#f5f3ef`), surfaces blanches, élévation par ombre douce et bordure ; orange de marque assombri pour le texte (`brand-fg` ≈ `#b93a00`) ; dégradé « feu » assombri pour les aplats ; lueurs remplacées par anneaux/barres et fonds teintés ; couleurs de jeu recalibrées avec la même teinte et le même sens. Valeurs proposées au rapport 05 §5.2 : **points de départ calculés, à valider sur maquette**.

## 6. Périmètre
### Inclus
- Valeurs `[data-theme='light']` pour tous les rôles sémantiques et `game-*`.
- Matrice de contraste des paires déclarées (Dark et Light) testée automatiquement.
- Remplacement des lueurs par des indices compatibles clair dans les composants migrés (si non déjà fait en V2-DS-03).
- Activation du sélecteur V2-THEME-02 une fois le registre de migration V2-DS-03 complet.
- Barre d'état iOS et `theme-color` en clair.
### Exclu
- Mécanisme de préférence (V2-THEME-02), migration des écrans (V2-DS-03), TV (sombre par défaut, V2-TV-06), thème club (V2-BRAND-*), `prefers-contrast: more` (option, Q4).

## 7. User stories
- En tant que joueur dans un bar lumineux, je veux un affichage clair lisible, afin de suivre les scores sans reflet gênant.
- En tant que joueur, je veux retrouver les mêmes repères (couleurs de multiplicateurs, joueur actif) en clair et en sombre.

## 8. Règles métier
- RM-01 Les couleurs de jeu gardent leur sens et leur teinte dans les deux modes (V2-DS-04).
- RM-02 Aucune information n'est portée par une lueur seule.

## 9. Parcours utilisateurs
Accueil ou options de partie → Apparence → Clair (ou Auto avec système clair) → tous les écrans passent en clair immédiatement ; la partie en cours n'est pas affectée.

## 10. Exigences fonctionnelles
- FR-01 Chaque rôle sémantique et chaque rôle `game-*` a une valeur `light`.
- FR-02 Toutes les paires déclarées (fg/canvas, fg-muted/surface, fg-subtle/surface-raised, on-brand/brand, brand-fg/canvas, game-score-inactive/canvas, focus-ring/canvas…) respectent les seuils WCAG AA ; le score actif ≥ 7:1.
- FR-03 Aucun écran n'affiche de lueur comme seul indice d'état en clair.
- FR-04 Le Light n'est proposé à l'utilisateur que lorsque le registre V2-DS-03 indique 100 % des écrans « prêt Light » ; en développement, un drapeau permet de le prévisualiser.
- FR-05 `theme-color` et la barre d'état iOS sont adaptés au clair.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : WCAG 2.2 AA (1.4.3, 1.4.11, 1.4.1).
- NFR-02 Aucune régression du Dark (captures V2-QA-05).
- NFR-03 Aucun coût JS supplémentaire (valeurs CSS).

## 12. Cas nominaux et alternatifs
- Nominal : système clair + `system` → Light partout.
- Alternatif : écran oublié non migré détecté en recette → l'activation est bloquée (FR-04).

## 13. Cas limites
- Modales et superpositions (`scrim`) : voile adapté au clair.
- Captures/partages d'écran éventuels : sans objet aujourd'hui.
- Écran de rotation téléphone (`src/features/smartphone/RotateToPortraitOverlay.tsx:12`, fond `#030508`) : à migrer comme les autres.

## 14. Gestion des erreurs
Sans objet (CSS). Une valeur manquante doit faire échouer le test de matrice (FR-01).

## 15. Impacts architecturaux
Valeurs CSS dans `src/styles/tokens/themes.css`. Aucune logique nouvelle ; aucun impact domaine.

## 16. Impacts sur les données et les interfaces
Aucun.

## 17. Compatibilité avec l'existant
Dark inchangé. Le manifeste (`background_color`) reste sombre ; coordination 031.

## 18. Dépendances
- V2-DS-03 (065) : 100 % des écrans migrés (condition d'activation).
- V2-THEME-02 (069) : mécanisme de préférence.
- Recommandées : V2-DS-04 (066) pour les couleurs de jeu, V2-QA-05 (041) pour captures et contrastes.
- Consommée par : V2-BRAND-01 (093), V2-DOC-05 (037).

## 19. Critères d'acceptation
- AC-01 Test unitaire de matrice de contraste : toutes les paires déclarées passent les seuils en `light` et en `dark`.
- AC-02 axe-core (V2-QA-05) en `colorScheme: 'light'` sur accueil, setup et chaque écran de jeu : 0 violation de contraste.
- AC-03 Captures de référence Light (téléphone, tablette paysage, bureau) validées par le PO.
- AC-04 Registre V2-DS-03 à 100 % avant activation ; sinon le sélecteur reste masqué en production.
- AC-05 Recherche : aucune lueur (`shadow-[0_0_`…) seule pour signaler un état dans les écrans migrés.
- AC-06 Captures Dark inchangées.

## 20. Scénarios de tests
- Unitaires : lecture de `themes.css` et calcul de contraste (fonction pure, sans dépendance).
- E2E : axe-core et captures Light ; bascule Dark/Light en partie.
- Terrain : tablette en salle éclairée et en extérieur [à confirmer] ; iPhone barre d'état.

## 21. Exigences de non-régression
Dark (captures), specs 005, 021 ; parcours de base.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Palette calculée jugée fade ou froide | Moyen | Moyenne | Maquette validée avant implémentation |
| Écran non migré découvert tard | Moyen | Moyenne | Registre + AC-04 |
| Reflets sur tablette en clair | Faible | Moyenne | Test terrain ; le choix reste à l'utilisateur |

## 23. Décisions architecturales
ADR 0006 (tokens). Décision PO « Light activé à 100 % » à acter (Q1).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Activation du Light | À 100 % des écrans ; progressive derrière drapeau | À 100 % (pas de Light partiel en production) | Activé à 100 % des écrans (`LIGHT_THEME_ENABLED = true`) ; pas de Light partiel |
| Q2 | Noms des thèmes officiels | « Braise » / « Craie » ; « Sombre » / « Clair » | Libellés UI « Sombre » / « Clair », noms internes libres | Libellés « Sombre » / « Clair » (et « Auto » pour le mode système) |
| Q3 | Validation visuelle | Maquette avant implémentation ; directement en code | Maquette (captures de prototype) | Validation visuelle sur les captures de la PR ; maquette préalable non produite (écart) |
| Q4 | `prefers-contrast: more` | Avec le Light ; plus tard | Plus tard | Plus tard |

## 25. Traçabilité
Rapport 05 §2.5, §5.1-5.3 ; compte rendu §C.2, §F.3, §G (Lot 2), §H.25 ; specs 063, 065, 066, 069.

## Implémentation (2026-11-20)

- Issue #242 ; branche `feat/v2.0.0` ; vérifiée au commit `24dbbab`.
- Décisions appliquées : Q1 à Q4 selon la recommandation, avec un écart sur Q3 : pas de maquette avant implémentation, la validation visuelle se fait sur les captures de la PR.
- Fichiers principaux :
  - `src/styles/tokens/themes.css` : valeurs `[data-theme='light']` de tous les rôles et de tous les `game-*` (fond `#f5f3ef`, neutres chauds `--bd-chalk-*`, texte de marque assombri, ombres douces) ; en clair, les lueurs (`shadow-glow-*`) deviennent des anneaux de 2 px (FR-03, AC-05 : 0 `shadow-[0_0_…]` dans le code).
  - `src/features/theming/themePreference.ts` : `LIGHT_THEME_ENABLED = true` (registre de la spec 065 à 100 %), libellés `Auto` / `Sombre` / `Clair`.
  - `theme-color` (`#f5f3ef` en clair) et barre d'état iOS (`default` en clair) : voir spec 069 (FR-05).
- Tests unitaires : `tests/unit/designSystem/themeContrast.test.ts` (matrice de contraste des paires déclarées en Dark et en Light : 4,5:1 texte, 7:1 score actif, 3:1 indicateurs, AC-01).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/theme.smoke.spec.ts` (parcours de base en clair jusqu'au pavé X01, fond `canvas` clair).
- Écarts et restes :
  - AC-02 (axe-core en `colorScheme: 'light'`) : non écrit (V2-QA-05).
  - AC-03 / AC-06 : captures Light de référence à valider par le PO, captures Dark de référence à produire (spec 041).
  - Test terrain en salle éclairée à faire ; `prefers-contrast: more` reporté (Q4).
