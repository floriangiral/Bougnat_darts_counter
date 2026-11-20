---
id: 028-counter-smartphone-display
v2_id: V2-TAB-06
type: fonctionnel
statut: a-revoir
validation: en-attente
statut_reel: "Contredite : portrait imposé sur téléphone (commit 1e8becd)."
traitement_propose: "Revoir (arbitrage orientation, Révision V2), puis fusion avec 027."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 028 - Counter smartphone display

## Status

Active

## Objective

Provide a robust smartphone presentation for every scoring game, including small-height devices, virtual keyboards, PWA safe areas and landscape orientation when the user chooses it.

## Scope

- iOS and Android smartphones from 320px wide
- portrait as the default orientation, landscape allowed
- X01, Cricket, Capital, Killer, Gotcha and Triathlon
- setup, starter selection, statistics, checkout and exit dialogs
- browser and standalone PWA display modes

## Architectural decisions

- Smartphone presentation state is owned by `src/features/smartphone` and exposed by the application shell.
- The scoring domain and persisted session contracts are unchanged.
- `dedicated_tablet` never activates tablet presentation below 768px.
- `visualViewport` drives a CSS viewport-height variable when the virtual keyboard changes the visible area.
- Safe-area primitives are global and reusable by smartphone and tablet surfaces.
- Triathlon phases share one fullscreen presentation shell.

## Invariants

1. Portrait remains the default smartphone presentation.
2. Landscape is never functionally blocked.
3. Primary controls are at least 44px high.
4. The primary action remains reachable when the virtual keyboard is open.
5. Safe-area insets protect fullscreen controls and dialogs.
6. No smartphone rule changes desktop or tablet layouts.
7. `dedicated_tablet` on a smartphone keeps smartphone presentation.
8. Every game can enter without horizontal or vertical document overflow.

## Acceptance checks

- Playwright covers 320x568, 390x844 and 844x390.
- Every game is entered on every smartphone profile.
- Primary action visibility and document overflow are checked.
- Setup numeric input is checked with the virtual keyboard emulation.
- Dialogs expose a consistent modal surface and remain inside the viewport.
- Triathlon is checked at initial draw and at each scoring phase.

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Alias V2 : **V2-TAB-06** — « Affichage téléphone (028) — arbitrage portrait imposé » (P1, lot 1, difficulté S, poids 45). Le contenu historique ci-dessus (en anglais) est conservé tel quel.

### Objet de la révision
La spec 028 exige « landscape allowed » et « Landscape is never functionally blocked » (invariant 2), alors que le code impose le portrait sur téléphone depuis le commit `1e8becd`. Cette révision documente l'écart, pose l'arbitrage **WCAG 2.1 SC 1.3.4 (Orientation, AA)** et propose une cible, sans trancher à la place du product owner (compte rendu §C.4, §H.7, rapport 06 D4).

### Constats vérifiés (code, commit 508dfa6)
- [vérifié] `src/features/tablet/tabletLayout.ts:53-54` : `requiresPortrait` = pointeur grossier, non tablette, téléphone, paysage, grand côté < 960 px.
- [vérifié] `App.tsx:327` affiche `RotateToPortraitOverlay` si `requiresPortrait` ; `src/features/smartphone/RotateToPortraitOverlay.tsx:9-19` : `role="alert"`, `fixed inset-0 z-[200]`, **aucune action** (« Tourne ton téléphone … Ta partie est conservée ») → l'application est **bloquée** en paysage sur téléphone tactile.
- [vérifié] `App.tsx:220` : `usePortraitLock(layoutMode === 'smartphone')` ; `src/features/smartphone/usePortraitLock.ts:12-19` appelle `lock('portrait')` au montage, sans lien avec le plein écran, sans `unlock()`. **Effet non démontré** : d'après le code Chromium cité au rapport 06 §1.2, Android n'accepte le verrou qu'en plein écran [à confirmer sur appareil] ; le commentaire `usePortraitLock.ts:7-11` et `docs/release/v2.0.0.md:43` (« pris en compte quand elle est installée ») sont donc à corriger ou à prouver.
- [vérifié] `tests/e2e/smartphone-layout.smoke.spec.ts:34-45` **attend** l'écran de rotation en 844×390 (`playwright.config.ts:49-51`) : le test fige le blocage.
- [vérifié via `gh`] PR #203 fusionnée le 2026-11-20 dans `release/v2.0.0`, incluant `1e8becd` (portrait imposé) et `2a78c7a` (barre de raccourcis X01 téléphone) : le blocage fait partie de la 2.0.0 en préparation, **sans mise à jour de 028**.
- [vérifié] Invariant 3 (44 px) : `src/styles/tailwind.css:34-37` (`[data-layout='smartphone'] button { min-height: 2.75rem }`).
- [vérifié] Invariant 7 (`dedicated_tablet` jamais sous 768 px) : `tabletLayout.ts:36` (`width >= 768`).
- [vérifié] Décision d'architecture « état smartphone dans `src/features/smartphone` » : la classification vit en réalité dans `src/features/tablet/tabletLayout.ts` ; `src/features/smartphone/` ne contient que `RotateToPortraitOverlay.tsx`, `usePortraitLock.ts`, `useVisualViewport.ts`.
- [vérifié] 028 n'a ni `plan.md` ni `tasks.md` (créés par cette révision) et n'apparaît pas dans `specs/README.md` (correction par la gouvernance).
- [source externe, rapport 06 §1.2] WCAG 2.1 SC 1.3.4 : le contenu ne doit pas restreindre son affichage à une seule orientation, sauf si une orientation est **essentielle** (https://www.w3.org/WAI/WCAG21/Understanding/orientation.html). Un compteur de score ne relève pas a priori des exemples d'orientation essentielle (chèque bancaire, piano, projecteur) [interprétation, à valider].

### Écarts avec la spec
| Élément 028 | Code actuel | Écart |
|---|---|---|
| Scope « landscape allowed » | Paysage bloqué sur téléphone tactile | Contradiction |
| Invariant 2 « never functionally blocked » | Écran de rotation sans action | Contradiction |
| Acceptance « Playwright covers 844x390 » + « every game entered » | Le test vérifie l'écran de rotation, aucun jeu n'est joué en paysage | Contradiction |
| Architecture `src/features/smartphone` | Classification dans `src/features/tablet` | Divergence de structure |
| Invariants 1, 3, 4, 5, 6, 7, 8 | Respectés dans le code observé | — |

### Options d'arbitrage
| Option | Description | Conformité 1.3.4 | Effort | Risque |
|---|---|---|---|---|
| A. Maintenir le blocage | Documenter le portrait comme « essentiel » et mettre 028 à jour | Fragile (justification difficile) | S | Non-conformité AA, utilisateurs en support paysage bloqués |
| B. Invite non bloquante + paysage opérable (recommandée) | Le portrait reste recommandé ; en paysage, invite « Tourne ton téléphone » avec « Continuer en paysage » ; recette `phone-landscape` (V2-TAB-01) rendant chaque jeu jouable (score + saisie) | Conforme si chaque jeu est opérable en paysage | M (recette condensée) | Effort de mise en page en 390 px de haut |
| C. Paysage libre sans invite | Retour au comportement d'avant `1e8becd`, corrigé | Conforme | M | Expérience paysage moins bonne sans guidage |

Séquencement proposé pour B : conserver l'écran actuel tant que la recette `phone-landscape` n'est pas opérable, puis le rendre non bloquant ; ne pas rendre l'écran fermable vers une mise en page cassée.

### Exigences proposées (non validées)
- V2-FR-01 La décision A, B ou C est actée par le PO et reportée dans 028 (scope, invariant 2, acceptance).
- V2-FR-02 (si B ou C) Chaque jeu (X01, Cricket, Capital, Killer, Gotcha, Triathlon) est opérable en paysage téléphone 844×390 et 932×430 : score du joueur actif visible, toutes les touches de saisie atteignables, ≥ 44 px.
- V2-FR-03 (si B) L'invite est non bloquante, propose « Continuer en paysage » (mémorisé pour la partie en cours) et n'apparaît que sur les écrans de jeu (Q2).
- V2-FR-04 `usePortraitLock` est soit retiré, soit appelé après un plein écran effectif avec `unlock()` en sortie, et uniquement sur classe téléphone (cohérence avec V2-TAB-05) ; son commentaire et `docs/release/v2.0.0.md:43` décrivent le comportement réellement observé.
- V2-FR-05 Le test `tests/e2e/smartphone-layout.smoke.spec.ts` reflète la décision (A : écran de rotation ; B/C : jeux joués en paysage).
- V2-FR-06 La décision d'architecture de 028 est corrigée : la classification relève du résolveur V2-TAB-01 (070).
- V2-NFR-01 Accessibilité : conformité WCAG 1.3.4 déclarée ou dérogation justifiée par écrit (option A).

### Critères d'acceptation proposés
- V2-AC-01 La décision PO est consignée dans 028 et dans les notes de la release concernée.
- V2-AC-02 (B/C) E2E 844×390 tactile : pour chaque jeu, la partie démarre, une volée est saisie et le score affiché change.
- V2-AC-03 (B) E2E : l'invite apparaît en paysage sur un écran de jeu, « Continuer en paysage » la masque jusqu'à la fin de la partie ; aucune invite sur l'accueil et le setup si Q2 = écrans de jeu.
- V2-AC-04 Test unitaire : `lock('portrait')` n'est jamais appelé hors plein écran ni sur une classe tablette.
- V2-AC-05 Recherche dans la documentation : plus d'affirmation non démontrée sur le verrou portrait.

### Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Portrait imposé sur téléphone (§H.7, D4) | A maintenir ; B invite non bloquante ; C paysage libre | B, après livraison de la recette `phone-landscape` | À prendre |
| Q2 | Périmètre de l'invite | Écrans de jeu ; toute l'application | Écrans de jeu (cohérent avec V2-TAB-05) | À prendre |
| Q3 | Que faire pour la 2.0.0 (PR #203 fusionnée) | Publier tel quel avec 028 mise à jour ; retirer le blocage | Publier tel quel en documentant l'écart et la décision à venir (V2-REL-01) | À prendre |
| Q4 | `usePortraitLock` | Retirer ; corriger (plein écran + `unlock`) | Corriger seulement si un gain est démontré sur Android, sinon retirer | À prendre |
| Q5 | Fusion 027 + 028 | Spec « présentation adaptative » portée par 070 ; séparées | Fusion après arbitrage Q1 | À prendre |

### Dépendances
- Aucune bloquante pour la décision. Mise en œuvre B/C : V2-TAB-01 (070, recette `phone-landscape`), V2-TAB-03 (072), V2-TAB-05 (073, cohérence du verrou).
- Coordination : V2-REL-01 (033, contenu 2.0.0), V2-TAB-04 (027, fusion), V2-QA-09 (042).
- Traçabilité : rapport 06 §2.6, §2.7, §4.3, §7 (D4) ; rapport 01 (ligne 028) ; compte rendu §B.2, §C.4, §H.7 ; commits `1e8becd`, `2a78c7a` ; PR #203.
