---
id: 027-counter-tablet-display
v2_id: V2-TAB-04
type: fonctionnel
statut: a-revoir
validation: en-attente
statut_reel: "Partielle ; invariants violés (48 px, 1280×800)."
traitement_propose: "Revoir intégralement (Révision V2, succession V2-TAB-01/02/03/05)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 027 - Counter tablet display

## Status

Active

## Objective

Provide a dedicated tablet presentation for every scoring game while preserving the existing phone and desktop experiences. Portrait is the default orientation, but landscape must remain fully supported when the device or user prefers it.

## Scope

- X01
- Cricket
- Capital
- Killer
- Gotcha
- Triathlon
- setup, starter overlays, statistics and exit dialogs used by scoring flows
- installed PWA orientation and safe-area behavior

## Architectural decisions

- Scoring rules and game state remain in domain/application layers.
- Tablet detection and responsive state live in `src/features/tablet`.
- Tablet presentation is exposed by the application shell through data attributes.
- A tablet is a coarse-pointer viewport from 768px to 1279px, or an explicit `dedicated_tablet` access mode.
- Portrait is the default layout; landscape uses available width for a scoreboard/control split.
- Compact density is selected below 700px viewport height.
- No tablet CSS selector may affect phone or desktop layouts.

## Invariants

1. `orientation: any` is allowed by the PWA manifest.
2. No game is functionally blocked by landscape orientation.
3. Critical controls have a 48px touch target on tablet.
4. Scoreboard and primary input remain simultaneously reachable in landscape.
5. A compact-height tablet never hides the primary action behind `overflow: hidden`.
6. Safe-area insets are applied to fullscreen scoring surfaces and modals.
7. The same scoring use cases and persisted session contracts are used in every layout.

## Acceptance checks

- Playwright projects cover 768x1024, 1024x768, 1280x800 and 1024x600.
- Every game is entered in portrait and landscape.
- Horizontal overflow is absent.
- Primary keypad/action controls are visible and at least 48px high.
- Stats, setup rules, starter selection and exit confirmation remain usable.
- The complete Triathlon flow is checked through all phases.

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Alias V2 : **V2-TAB-04** — « Affichage tablette (027) — révision et succession » (P1, lot 1, difficulté S, poids 30). Le contenu historique ci-dessus (en anglais) est conservé tel quel.

### Objet de la révision
Constater les invariants violés de 027, corriger ses incohérences internes et organiser sa **succession** par les specs V2 : V2-TAB-01 (070, résolveur), V2-TAB-02 (071, correctifs), V2-TAB-03 (072, arène), V2-TAB-05 (073, orientation). 027 garde son numéro ; ses invariants encore valables deviennent des exigences de non-régression des successeurs.

### Constats vérifiés (code, commit 508dfa6)
- [vérifié] Détection (« coarse-pointer viewport from 768px to 1279px ») : `src/features/tablet/tabletLayout.ts:22-23`, `:36-40`. [émulation rapport 06, Chromium] iPad 10,2" Safari paysage 1080×750, Galaxy Tab 1280×696/752, petite tablette 960×520 → présentation **téléphone** ; iPad Pro 12,9" 1366×950 → présentation **bureau**. Les barres du navigateur font passer le petit côté sous 768 px.
- [vérifié] **Invariant 3 (48 px) violé** : `src/styles/tailwind.css:164-167` impose `min-height: 3rem` aux boutons en tablette, mais `:508-512` remet `min-height: 0` au pavé X01 dès 768 px (choix volontaire d'alignement, commentaire `:494-501`) ; [émulation] touches de 26 à 34 px en paysage compact.
- [vérifié] **Cascade** : `tailwind.css:198-209` (`height: auto` de la zone de saisie X01 en tablette paysage) est écrasée par `:535-540` (bureau compact, même spécificité, déclarée après) sous 760 px de haut → pavé ≈ 236 px.
- [émulation] **Invariant 5 violé de fait** : ligne Bull du Cricket coupée (`views/CricketGameView.tsx:320`, `overflow-hidden`) et touches Killer inatteignables à 960×520 (`views/KillerGameView.tsx:115`), sur des tablettes classées téléphone.
- [vérifié] **Acceptation incohérente** : « Playwright projects cover … 1280x800 » alors que `TABLET_MAX_WIDTH = 1279` exclut 1280 px et que `playwright.config.ts:24-36` ne déclare que 768×1024, 1024×768, 1024×600.
- [vérifié] « Primary keypad/action controls are … at least 48px high » : `tests/e2e/tablet-layout.smoke.spec.ts` ne mesure que le débordement du document ; il force `/?mode=dedicated_tablet` (l.17), ce qui court-circuite la détection réelle.
- [vérifié] `tests/unit/tabletLayout.test.ts:69` fige `1024×600 → isSmartphone: true`.
- [vérifié] Invariant 1 (`orientation: any` du manifeste) : vrai dans `manifest.json`, mais le manifeste n'est pas livré à la racine du build (`docs/release/v2.0.0.md:71`, spec 031).
- [vérifié] Invariants 4, 6, 7 et « aucun sélecteur tablette n'affecte téléphone/bureau » : respectés dans le code observé (safe areas `tailwind.css:113-140`, mêmes use cases).
- [vérifié] 027 n'a ni `plan.md` ni `tasks.md` (créés par cette révision) et n'apparaît pas dans `specs/README.md` (correction hors de cette révision, par la gouvernance).

### Écarts avec la spec
| Élément 027 | Écart | Successeur proposé |
|---|---|---|
| Définition de la tablette (768-1279, pointeur grossier) | Tablettes réelles mal classées | V2-TAB-01 (070), transitoire V2-TAB-02 (071) |
| Invariant 3 (48 px) | Violé (pavé X01, en-têtes) | V2-TAB-02 (071), V2-DS-02 (064) |
| Invariant 5 (compact ne masque rien) | Violé de fait (Bull, Killer) | V2-TAB-02 (071) |
| « Portrait is the default » | Contraire à la demande V2 « paysage pendant les parties » | V2-TAB-05 (073), V2-TAB-03 (072) |
| Acceptation 1280×800 | Incohérente avec le code et la config | V2-TAB-02 / V2-QA-09 (042) |
| Tests e2e « ≥ 48 px » | Non mesurés, détection contournée | V2-TAB-02, V2-QA-09 |

### Exigences proposées (non validées)
- V2-FR-01 La définition « tablette = 768-1279 px » est retirée au profit des classes de taille de V2-TAB-01 (070) dès sa livraison.
- V2-FR-02 Les invariants 2, 4, 6, 7 et « aucun sélecteur tablette n'affecte téléphone/bureau » sont repris comme exigences de non-régression de 070 et 072.
- V2-FR-03 L'invariant 3 (48 px) est conservé et **mesuré** par E2E sur des viewports réalistes, sans `?mode=dedicated_tablet`.
- V2-FR-04 L'invariant 5 est conservé et vérifié jeu par jeu (7 lignes Cricket, 21 touches Killer, score X01 visible).
- V2-FR-05 « Portrait is the default » est remplacé par : « en partie, le paysage (recette `arena`) est la présentation recommandée sur tablette ; le portrait reste supporté » (décision V2-TAB-05).
- V2-FR-06 L'acceptation « 1280×800 » est maintenue (profil Galaxy Tab réel) et rendue cohérente avec la classification.
- V2-NFR-01 Aucune régression téléphone/bureau (captures V2-QA-05).

### Critères d'acceptation proposés
- V2-AC-01 Les critères AC-01 à AC-07 de 071 sont verts (corrige les invariants 3 et 5).
- V2-AC-02 La table de vérité de 070 classe 1280×800 et 1080×750 tactiles en recette `arena`.
- V2-AC-03 Aucun test E2E tablette n'utilise `?mode=dedicated_tablet` pour obtenir la présentation tablette (sauf test dédié au mode d'accès).
- V2-AC-04 À la livraison de 070, 071, 072 et 073 : 027 passe au statut convenu (Q1) avec `remplacee_par` renseigné par le PO.

### Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Statut final de 027 | `retiree` avec `remplacee_par` 070-073 ; conservée enrichie | Retirée et remplacée après livraison des successeurs (fiche conservée) | À prendre |
| Q2 | Fusion 027 + 028 dans une spec « présentation adaptative » | Fusion portée par 070 ; specs séparées | Fusion portée par 070 après arbitrage de 028 | À prendre |
| Q3 | Portrait tablette par défaut (§H.7) | Paysage recommandé en partie, portrait supporté ; portrait par défaut | Paysage recommandé en partie, portrait supporté | À prendre |
| Q4 | Correctifs 071 dans la 2.0.0 (§H.1, D5) | 2.0.0 ; 2.0.x | 2.0.0 | À prendre |

### Dépendances
- V2-TAB-01 (070) ; successeurs V2-TAB-02 (071), V2-TAB-03 (072), V2-TAB-05 (073) ; coordination V2-TAB-06 (028), V2-QA-09 (042), 031 (manifeste).
- Traçabilité : rapport 06 §2.2, §2.3, §2.7, §6 ; rapport 01 (ligne 027) ; compte rendu §B.2, §C.3, §F.3.
