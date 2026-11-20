---
id: 064-counter-accessible-base-components
v2_id: V2-DS-02
titre: Composants de base accessibles (focus visible, états, cibles 48 px)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation UX/UI
famille: design-system
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 30
depend_de: [V2-DS-01]
remplace: []
remplacee_par: []
issue: '#231'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 064 — Composants de base accessibles (focus visible, états, cibles 48 px)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Rapport d'audit 05 (§2.4, §3 P5/P9) et 06 (§2.5), compte rendu §A (faiblesse 4 : « focus clavier invisible »), §C.2 et §F.3. Le compte rendu classe le focus visible en **quick win du Lot 0** (avec V2-TAB-02) ; le reste de la spec s'appuie sur les tokens V2-DS-01.

## 2. Problématique
Le seul composant partagé (`Button`) supprime le focus, n'offre pas les variantes nécessaires aux pavés de saisie (contournées par des utilitaires `!important`) et ne garantit pas les cibles tactiles : les planchers sont imposés par des règles CSS globales qui se neutralisent entre elles.

## 3. Objectifs
- O1. Focus clavier visible sur 100 % des éléments interactifs (WCAG 2.2 SC 2.4.7).
- O2. États homogènes : repos, survol, pressé, désactivé, sélectionné, focus.
- O3. Supprimer les utilitaires `!important` de couleur/taille dans les pavés.
- O4. Cibles tactiles garanties par le composant : 48 px sur tablette/tactile large, 44 px sur téléphone.

## 4. État actuel vérifié dans le code
- [vérifié] `components/ui/Button.tsx:15` : `focus:outline-none` dans les styles de base ; 4 variantes (`primary`, `secondary`, `danger`, `ghost`, l.17-23), 3 tailles (`min-h-10/12/14`, l.25-29), désactivé `opacity-60`.
- [vérifié] 0 `focus-visible:` dans `components/`, `views/`, `src/`, `App.tsx` ; 6 `focus:outline-none` supplémentaires ; `components/game/CricketKeypad.tsx:21` (`releaseButtonFocus`) retire le focus après appui.
- [vérifié] Raccourcis clavier existants : `src/features/x01/hooks/useMatchShortcuts.ts` → des utilisateurs clavier existent.
- [vérifié] 47 utilitaires `!` (préfixe important) relevés au commit 508dfa6 (51 selon le motif du rapport 05) dans `components/game/Keypad.tsx` (6), `CricketKeypad.tsx` (7), `CapitalKeypad.tsx` (12), `src/features/x01/voice/VoiceScoringControl.tsx` (22).
- [vérifié] Planchers tactiles globaux : `src/styles/tailwind.css:34` (`[data-layout='smartphone'] button`), `:164-167` (`[data-layout='tablet'] button { min-height: 3rem }`) **annulé** pour le pavé X01 par `:508-512` (`.x01-keypad-root button { min-height: 0 }` à partir de 768 px, placé en fin de fichier volontairement, commentaire l.494-501).
- [vérifié] `disabled:opacity-*` : valeurs hétérogènes (40/50/60/80/100) selon les fichiers.
- [vérifié] Mot-symbole « BOUGNAT DARTS » dupliqué (ex. `views/GameSelectionView.tsx:118-121`, rapport 05 §2.1 : 6 emplacements).
- [vérifié] Contraste du dégradé primaire : blanc sur `orange-600` ≈ 3,57:1 (calcul rapport 05 §2.5) pour un texte de 14 px.

## 5. Comportement cible
`Button` (et un `IconButton`) deviennent les seuls points d'entrée des boutons, construits sur les tokens : anneau `focus-visible` contrasté (`focus-ring` ≥ 3:1 sur `canvas` et `surface`), variantes `keypad` (avec `tone` : neutre, double, triple, bull, d-bull, danger, success), états unifiés et plancher tactile porté par une prop de taille plutôt que par des règles globales.

## 6. Périmètre
### Inclus
- `Button` v2 (variantes `primary`, `secondary`, `danger`, `ghost`, `keypad`, `success` ; prop `tone` ; états).
- `IconButton` (en-têtes de jeu : statistiques, réglages, quitter), `Surface`/`Card` minimal.
- Remplacement des `!important` des 4 fichiers cités.
- Suppression de `focus:outline-none` et de `releaseButtonFocus` au profit de `focus-visible`.
- Plancher tactile défini dans le composant, coordonné avec V2-TAB-02.
- `BrandMark` unique (mot-symbole) réutilisable par V2-BRAND-05.
### Exclu
- Migration des écrans (V2-DS-03), couleurs métier (V2-DS-04, dont les tons consommés ici), mise en page arène (V2-TAB-03).

## 7. User stories
- En tant que joueur au clavier, je veux voir quel bouton a le focus, afin de saisir sans erreur.
- En tant que joueur sur tablette, je veux des touches d'au moins 48 px, afin de ne pas rater un appui.
- En tant que mainteneur, je veux une API de variantes suffisante, afin de ne plus écrire de `!important`.

## 8. Règles métier
Sans objet : aucune règle de jeu ; les tons de multiplicateurs sont définis par V2-DS-04.

## 9. Parcours utilisateurs
Inchangés. Navigation clavier : Tab parcourt les boutons dans l'ordre visuel, l'anneau est visible, Entrée/Espace actionnent.

## 10. Exigences fonctionnelles
- FR-01 Tout bouton interactif affiche un indicateur `focus-visible` d'au moins 2 px, contrasté ≥ 3:1 avec les couleurs adjacentes ; aucun `focus:outline-none` sans remplacement.
- FR-02 Le focus n'est pas retiré programmatiquement après un appui tactile ; l'affichage repose sur `:focus-visible`.
- FR-03 `Button` expose `variant` ∈ {primary, secondary, danger, ghost, keypad, success} et `tone` (pour `keypad`) sans recours à `!important`.
- FR-04 États homogènes : désactivé = une seule règle (opacité et curseur) ; pressé = un retour visuel unique ; sélectionné = `aria-pressed`/`data-state`.
- FR-05 Taille minimale de cible garantie par le composant : 48 × 48 px en présentation tablette/tactile large, 44 × 44 px en présentation téléphone ; le pavé X01 respecte ce plancher sans règle `min-height: 0` globale.
- FR-06 `IconButton` impose un libellé accessible (`aria-label`) et une cible carrée au plancher.
- FR-07 `BrandMark` remplace les duplications du mot-symbole.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : WCAG 2.2 AA (2.4.7, 2.5.8 cible ≥ 24 px minimum légal, objectif produit 44/48 px), 1.4.11 contrastes non textuels.
- NFR-02 Performance : pas de régression INP mesurable sur le pavé (`pointerdown` conservé, `Keypad.tsx:103-108`).
- NFR-03 Aucune dépendance nouvelle.

## 12. Cas nominaux et alternatifs
- Nominal : Tab sur l'écran X01 → anneau visible sur chaque touche.
- Alternatif : appui tactile → pas d'anneau persistant (`:focus-visible` non déclenché).

## 13. Cas limites
- Hauteur de fenêtre très faible (≤ 520 px) : le plancher prime ; la zone de saisie défile ou la recette de mise en page change (V2-TAB-01/02), jamais de touche sous le plancher.
- Thème club (futur) : `focus-ring` reste dérivé et non personnalisable.

## 14. Gestion des erreurs
Sans objet (composants de présentation).

## 15. Impacts architecturaux
Couche présentation (`components/ui/`). Les tons sont des intentions (`'double' | 'triple' | …`) traduites en classes dans le composant ; aucune classe de couleur ne remonte dans `src/features/`.

## 16. Impacts sur les données et les interfaces
API de composant modifiée (props `variant`, `tone`, `size`). Aucune donnée persistée.

## 17. Compatibilité avec l'existant
Les variantes existantes gardent leur nom et leur rendu Dark ; seules les classes forcées disparaissent. Les tests couplés aux classes (`tests/unit/components/keypads.test.tsx:106`) passent à `data-state`/`data-tone`.

## 18. Dépendances
- V2-DS-01 (063) : rôles `focus-ring`, `brand`, `surface`.
- Coordination : V2-TAB-02 (071) pour le plancher du pavé X01 ; V2-DS-04 (066) pour les tons ; V2-QA-05 (041) pour les tests axe-core.
- Le correctif « focus visible » seul (FR-01/FR-02) peut être livré en Lot 0 sans les tokens, à décider (Q1).

## 19. Critères d'acceptation
- AC-01 Écran X01 (bureau, clavier) : Tab sur chaque touche du pavé → un anneau d'au moins 2 px est visible et mesuré ≥ 3:1 (capture + axe-core V2-QA-05).
- AC-02 Recherche dans le code : 0 `focus:outline-none` sans `focus-visible:` associé ; `releaseButtonFocus` supprimé.
- AC-03 Recherche dans le code : 0 utilitaire `!` de couleur/taille dans `Keypad.tsx`, `CricketKeypad.tsx`, `CapitalKeypad.tsx`, `VoiceScoringControl.tsx`.
- AC-04 Tablette 1080×750 et 1280×696 (sans `?mode=dedicated_tablet`) : toutes les touches du pavé X01, Cricket, Capital et les boutons d'en-tête mesurent ≥ 48 px de haut et de large (test E2E de mesure de boîtes).
- AC-05 Téléphone 390×844 : boutons ≥ 44 px.
- AC-06 Captures Dark V2-QA-05 inchangées hors anneau de focus.

## 20. Scénarios de tests
- Unitaires : rendu de `Button` par variante/ton (attributs `data-tone`, `aria-pressed`), `IconButton` sans libellé → erreur de type.
- E2E : navigation clavier X01 ; mesure des cibles par profil ; axe-core (règles focus et contraste).
- Terrain : iPad Safari avec clavier externe [à confirmer].

## 21. Exigences de non-régression
Spec 014 (taille des chiffres du pavé), 021 (résilience police), 005 ; saisie `pointerdown` du pavé X01 ; tous les tests unitaires de pavés.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Plancher 48 px qui casse l'alignement du pavé (motif du `min-height: 0`) | Moyen | Élevée | Grille dimensionnée sur le plancher (V2-TAB-02), tests de mesure |
| Anneau de focus parasite au tactile | Faible | Faible | `:focus-visible` uniquement |
| Refonte de `VoiceScoringControl` en conflit avec V2-VOICE-* | Moyen | Moyenne | Lot coordonné avec la voix |

## 23. Décisions architecturales
Appui sur ADR 0006 (tokens). Pas d'ADR propre.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Livrer le focus visible seul dès le Lot 0 (2.0.0) | Oui ; avec la spec complète | Oui, quick win indépendant des tokens | À prendre |
| Q2 | Plancher tablette | 48 px ; 44 px partout | 48 px tablette, 44 px téléphone | À prendre |
| Q3 | `BrandMark` ici ou dans V2-BRAND-05 | Ici ; BRAND-05 | Ici (composant de base), réutilisé par BRAND-05 | À prendre |

## 25. Traçabilité
Rapport 05 §2.4, §2.5, §3 (P5, P9, P10) ; rapport 06 §2.3, §2.5 ; compte rendu §A, §C.2, §F.3, §G (Lot 0 « focus visible », Lot 1) ; specs 005, 014, 021, 027, 028.
