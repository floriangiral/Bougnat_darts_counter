---
id: 069-counter-theme-preference
v2_id: V2-THEME-02
titre: Préférence de thème (système, sombre, clair)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande V2
famille: design-system
priorite: P1
difficulte: S
recommandation: recommande
lot: 2
poids: 45
depend_de: [V2-DS-01]
remplace: []
remplacee_par: []
issue: '#237'
verifie_au_commit: à renseigner
derniere_revue: 2026-11-20
---

# 069 — Préférence de thème (système, sombre, clair)

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #237, branche `feat/v2.0.0`, chantier « refonte tablette et thèmes »). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la recette terrain et l'exécution des tests E2E dans la CI de la PR restent à faire (`validation: en-attente`).

## 1. Origine et contexte
Demande V2 (chantier 5.2), rapport d'audit 05 (§2.6, §2.8, §4.3), compte rendu §C.2 et §F.3. Cette spec porte le **mécanisme** (préférence, persistance, application sans flash, méta navigateur) ; la palette claire elle-même est V2-THEME-01 (068). Elle peut être livrée avant le Light, avec le seul thème sombre et le sélecteur masqué.

## 2. Problématique
Aucune préférence d'apparence n'existe ; la couleur de la barre du navigateur est statique et incohérente avec le manifeste ; activer un thème clair sans mécanisme d'application précoce provoquerait un flash sombre/clair au chargement.

## 3. Objectifs
- O1. Préférence `system` | `dark` | `light`, `system` par défaut, sans question au démarrage.
- O2. Thème effectif appliqué avant le premier rendu (aucun flash).
- O3. `theme-color`, `color-scheme` et barre d'état cohérents avec le thème effectif.
- O4. Parcours de base inchangé : aucune étape ajoutée.

## 4. État actuel vérifié dans le code
- [vérifié] `index.html:7` : `<meta name="theme-color" content="#1a1a1a">` statique ; `manifest.json` : `theme_color #ea580c`, `background_color #1a1a1a` → incohérence méta/manifeste et avec les fonds réels des écrans (`#06080d`, `#05070b`, noir).
- [vérifié] `index.html:10` : `apple-mobile-web-app-status-bar-style` = `black-translucent`.
- [vérifié] Aucune préférence d'apparence persistée ; `utils/appPersistence.ts:1-3` ne connaît que la session et les drapeaux de mise à jour (`bougnat-app-session-v1`, `bougnat-live-update-*`).
- [vérifié] 0 usage de `prefers-color-scheme` ; aucune propriété `color-scheme`.
- [vérifié] CSP `public/_headers:2` : `script-src 'self' 'unsafe-inline'` → un script inline dans `index.html` est autorisé sans changement de CSP.
- [vérifié] Points d'accès possibles : pied de page de l'accueil (`views/HomeView.tsx:132-167`), `components/match/MatchSettingsModal.tsx` (options en cours de partie). Il n'existe pas d'écran « Réglages » global.
- [vérifié] `manifest.json` et `sw.js` ne sont pas livrés à la racine du build (`docs/release/v2.0.0.md:71`) : toute évolution du manifeste se coordonne avec la spec 031 (V2-REL-02).

## 5. Comportement cible
Un script inline minimal (≤ 1 Ko, ES5) dans `<head>` lit la préférence en `localStorage`, résout le thème effectif (`system` → `matchMedia('(prefers-color-scheme: light)')`), pose `data-theme` et `color-scheme` sur `<html>` et met à jour `theme-color`. Un module d'infrastructure maintient ensuite ces valeurs (écoute du changement système, choix manuel). Un sélecteur à trois états (Auto / Sombre / Clair) est accessible depuis l'accueil et depuis les options de partie, **uniquement quand le Light est activé** (V2-THEME-01).

## 6. Périmètre
### Inclus
- Modèle de préférence (`{ mode: 'system' | 'dark' | 'light' }`, schéma versionné) et clé `localStorage` dédiée (ex. `bougnat-theme-v1`).
- Script anti-flash dans `index.html`.
- Module d'application (`data-theme`, `color-scheme`, `theme-color`) et écoute de `prefers-color-scheme`.
- Sélecteur dans le pied de page de l'accueil et dans `MatchSettingsModal`.
- Deux balises `theme-color` statiques avec `media` pour le premier rendu.
### Exclu
- Valeurs de la palette claire (V2-THEME-01) ; thème club (V2-BRAND-*) ; thème TV (V2-TV-06 : sombre par défaut, indépendant).
- Modification du manifeste (coordonnée avec 031 / V2-REL-02).

## 7. User stories
- En tant que joueur, je veux que l'application suive le thème de mon appareil, afin de ne rien régler.
- En tant que joueur en salle éclairée, je veux forcer le thème clair en cours de partie, afin de mieux lire les scores.
- En tant que joueur, je ne veux jamais voir un flash de couleur au démarrage.

## 8. Règles métier
- RM-01 Valeur par défaut : `system`.
- RM-02 La préférence est locale à l'appareil, sans compte.
- RM-03 Tant que le Light n'est pas activé, le thème effectif est toujours `dark` et le sélecteur est masqué.

## 9. Parcours utilisateurs
1. Premier lancement : aucun écran supplémentaire ; thème effectif = système (ou sombre si Light inactif).
2. Accueil → pied de page → « Apparence : Auto / Sombre / Clair » → effet immédiat.
3. En partie → Options → même sélecteur → effet immédiat, partie inchangée.

## 10. Exigences fonctionnelles
- FR-01 La préférence est lue et appliquée avant le premier rendu de l'application (script inline synchrone).
- FR-02 En mode `system`, un changement de thème système pendant l'utilisation est appliqué sans rechargement.
- FR-03 Le choix manuel est persisté et restauré au lancement suivant.
- FR-04 `theme-color` reflète la couleur `canvas` du thème effectif ; `color-scheme` vaut `dark` ou `light`.
- FR-05 Une préférence illisible ou invalide est ignorée (retour à `system`) sans message bloquant.
- FR-06 Le sélecteur n'apparaît que si le Light est activé (drapeau de build ou constante, Q3).
- FR-07 Le style inline du `body` n'est plus nécessaire (supprimé par V2-DS-01).

## 11. Exigences non fonctionnelles
- NFR-01 Script inline ≤ 1 Ko, ES5, sans logique métier ni appel réseau ; compatible baseline V2-DS-00.
- NFR-02 Aucun re-render React lors d'un changement de thème (CSS seulement).
- NFR-03 Confidentialité : aucune donnée de thème transmise.
- NFR-04 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : système clair + préférence `system` → Light appliqué dès le premier rendu.
- Alternatif : `localStorage` indisponible (navigation privée stricte) → thème système, choix non persisté.

## 13. Cas limites
- Navigateur sans `matchMedia('(prefers-color-scheme)')` : sombre.
- Restauration d'une partie (rechargement) : thème appliqué avant la vue de jeu.
- Barre d'état iOS : `black-translucent` avec fond clair [à confirmer sur appareil] (Q2).

## 14. Gestion des erreurs
`try/catch` sur l'accès au stockage (modèle de `utils/appPersistence.ts`) ; jamais d'exception visible.

## 15. Impacts architecturaux
Fonction pure de résolution (préférence + préférence système → thème effectif) dans `src/features/theming/` ; application DOM dans `src/infrastructure/web/` ; stockage dans `src/infrastructure/local/` ; sélecteur en présentation. Aucune dépendance du domaine.

## 16. Impacts sur les données et les interfaces
Nouvelle clé `localStorage` versionnée (< 100 octets). Pas de migration (absence = `system`).

## 17. Compatibilité avec l'existant
Aucun changement visuel tant que le Light n'est pas activé. Les clés `localStorage` existantes ne sont pas touchées.

## 18. Dépendances
- V2-DS-01 (063) : attribut `data-theme` et rôles.
- Débloque V2-THEME-01 (068). Coordination : 031 / V2-REL-02 (manifeste), V2-BRAND-01 (093, thème club appliqué par-dessus).

## 19. Critères d'acceptation
- AC-01 Appareil en thème clair, préférence absente, Light activé : au chargement, la première capture (Playwright `colorScheme: 'light'`, capture avant hydratation) montre déjà `data-theme="light"` sur `<html>`.
- AC-02 Préférence `dark` enregistrée, système clair : rechargement → `data-theme="dark"`, aucune frame claire (trace de performance ou capture avant hydratation).
- AC-03 Mode `system` : `page.emulateMedia({ colorScheme })` change le thème sans rechargement.
- AC-04 `meta[name="theme-color"]` vaut la couleur `canvas` du thème effectif.
- AC-05 Light désactivé : le sélecteur est absent de l'accueil et des options ; le thème reste `dark`.
- AC-06 Valeur corrompue dans la clé : application lancée en `system`, aucune erreur console.

## 20. Scénarios de tests
- Unitaires : résolution du thème effectif (table de vérité), validation de la préférence, script inline (exécuté en jsdom).
- E2E : AC-01 à AC-06 sur Chromium et WebKit.
- Terrain : iPhone/iPad (barre d'état), Android (barre d'adresse) [à confirmer].

## 21. Exigences de non-régression
Parcours de base sans étape ajoutée ; reprise X01 après rechargement (spec 010) ; spec 011 (installation).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Flash si le script est déplacé ou différé | Moyen | Faible | Test AC-02, commentaire dans `index.html` |
| Barre d'état iOS illisible en clair | Faible | Moyenne | Test appareil, Q2 |
| Incohérence avec le manifeste non livré | Faible | Élevée | Coordination 031 |

## 23. Décisions architecturales
S'appuie sur ADR 0006. Pas d'ADR propre.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Points d'accès du sélecteur | Accueil + options de partie ; accueil seul | Accueil + options de partie | Accueil + options de partie X01 |
| Q2 | Barre d'état iOS | `default` en clair ; `black-translucent` partout | Dynamique selon le thème, à vérifier sur appareil | Dynamique : `default` en clair, `black-translucent` en sombre ; à vérifier sur appareil |
| Q3 | Livrer le mécanisme avant le Light | Oui (sélecteur masqué) ; avec le Light | Oui, mécanisme d'abord | Livré avec le Light (068), dans le même chantier |
| Q4 | `theme_color` du manifeste | Aligner sur `canvas` sombre ; garder l'orange | Aligner (coordination 031) | Aligné sur le canvas sombre `#06080d` (`theme_color` et `background_color`) |

## 25. Traçabilité
Rapport 05 §2.6, §2.7 (CSP), §2.8, §4.3 ; compte rendu §C.2, §F.3, §G (Lot 2) ; specs 010, 011, 031.

## Implémentation (2026-11-20)

- Issue #237 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation ; Q3 sans objet, le Light étant livré en même temps.
- Fichiers principaux :
  - `src/features/theming/themePreference.ts` : module pur (modes `system` | `dark` | `light`, clé `bougnat-theme-v1` au format `{"v":1,"mode":…}`, valeur absente, corrompue ou d'un autre schéma → `system`, résolution du thème effectif, couleurs `theme-color`, style de barre d'état).
  - `src/infrastructure/local/themePreferenceStore.ts` (lecture/écriture protégées, stockage indisponible non bloquant) ; `src/infrastructure/web/themeDocument.ts` (`data-theme`, `theme-color`, barre d'état iOS, écoute de `prefers-color-scheme`) ; `color-scheme` porté par `themes.css` selon `data-theme`.
  - `src/app/themeController.ts` (unique point d'écriture, démarré par `index.tsx`) et `src/app/useThemeMode.ts`.
  - `index.html` : script inline synchrone ES5 qui applique `data-theme`, `theme-color` et la barre d'état avant le premier rendu ; il reproduit la clé, le schéma et les couleurs du module TypeScript (test de cohérence).
  - `components/ui/ThemeSelector.tsx` (« Apparence : Auto / Sombre / Clair », effet immédiat) dans le pied de page de l'accueil et dans les options de partie X01 (`MatchSettingsModal`), masqué si le Light est désactivé.
  - `public/manifest.json` : `theme_color` et `background_color` = `#06080d`.
- Tests unitaires : `tests/unit/designSystem/themePreference.test.tsx` (table de vérité, valeurs corrompues, script anti-flash minimal et aligné, repli sans `matchMedia`, stockage, document, contrôleur en mode Auto, sélecteur), `homeAndSelection.test.tsx` et `matchSettingsModal.test.tsx` (présence du sélecteur).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/theme.smoke.spec.ts` (système clair au premier rendu, AC-01/AC-04 ; choix Sombre prioritaire, AC-02 ; changement système sans rechargement, AC-03 ; sélecteur de l'accueil mémorisé ; valeur corrompue sans erreur, AC-06 ; parcours en clair).
- Écarts et restes :
  - AC-05 (sélecteur absent quand le Light est désactivé) : couvert par le code et la cohérence du script, pas par un E2E (le Light étant activé).
  - L'absence de frame claire (AC-02) est vérifiée par l'attribut au chargement, pas par une trace de performance.
  - Vérification terrain iOS/Android (barre d'état, barre d'adresse) à faire.
