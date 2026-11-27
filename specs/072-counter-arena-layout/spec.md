---
id: 072-counter-arena-layout
v2_id: V2-TAB-03
titre: Disposition « arène » tablette paysage
type: fonctionnel
statut: cloturee
validation: validee
origine: Demande V2
famille: tablette
priorite: P1
difficulte: L
recommandation: recommande
lot: 2
poids: 25
depend_de: [V2-TAB-01, V2-DS-01]
remplace: []
remplacee_par: []
issue: '#244'
verifie_au_commit: 7d90e54
transfere_a: [V2-QA-09, V2-QA-05, V2-DOC-05]
derniere_revue: 2026-11-27
---

# 072 — Disposition « arène » tablette paysage

> **Statut : CLÔTURÉE, recette validée le 2026-11-27.** Voir la clôture en fin de document ; les constats d'implémentation antérieurs sont conservés comme historique.

## 1. Origine et contexte
Demande V2 (chantier 5.3 : « la tablette en paysage devient un support de premier plan »), rapport d'audit 06 (§2.3-2.5, §4.2), compte rendu §C.3, §F.3, §G (Lot 2 : « par écran, tokens + arène dans les mêmes PR »). La revue croisée a retenu que **la migration vers les tokens (V2-DS-03) et la disposition arène se font dans les mêmes lots, écran par écran**.

## 2. Problématique
Seul X01 a été pensé pour une lecture à distance ; Cricket, Capital, Killer et Gotcha sont des interfaces de saisie à 50 cm. Chaque vue réimplémente sa racine, son en-tête, sa zone de score et sa zone de saisie, et la CSS duplique les crochets par jeu : chaque nouvelle variante (voix, contrôleur TV) multiplierait ces sélecteurs.

## 3. Objectifs
- O1. Une structure à zones unique pour tous les écrans de jeu en recette `arena` (V2-TAB-01).
- O2. Joueur actif dominant et lisible à 2-3 m sur une tablette 10-13" ; adversaires lisibles (contraste ≥ 4,5:1).
- O3. Saisie au pouce : Annuler à côté de Valider, actions dangereuses isolées.
- O4. Points d'extension prévus pour les variantes « voix prioritaire » et « contrôleur TV », sans les implémenter ici.

## 4. État actuel vérifié dans le code
- [vérifié] Grille tablette paysage `src/styles/tailwind.css:175-236` : colonne score `1fr` / saisie `minmax(22rem, 42%)` pour X01, Cricket, Capital ; Killer/Gotcha en 2 colonnes ; crochets par jeu `.tablet-x01-*`, `.tablet-cricket-*`, `.tablet-capital-*`, `.tablet-killer-*`, `.tablet-gotcha-*` (`:120-259`).
- [vérifié] Triathlon réutilise les vues Capital → Cricket → X01 (`views/TriathlonGameView.tsx`).
- [vérifié] Cricket : points `text-sm … md:text-lg` (≤ 18 px, `components/game/CricketScoreboard.tsx:129`) ; cibles `text-base … md:text-xl` (l.154).
- [vérifié] Killer : tableau en `text-[15px] sm:text-base` (`views/KillerGameView.tsx:249`).
- [vérifié] X01 : score inactif `text-gray-700` (`components/game/PlayerScore.tsx:125`, ≈ 2:1) ; pastille Manches/Sets centrale (`components/match/MatchStatusPill.tsx`).
- [vérifié] Annuler (« Retour ») `h-8`/`sm:h-9` en haut de la barre de saisie (`components/match/MatchInputBar.tsx:56-60`), loin de Valider.
- [vérifié] Choix des fléchettes au finish dans une modale plein écran (`views/MatchView.tsx:835-857`, `data-testid="checkout-confirm-modal"`).
- [émulation rapport 06] 1080×810 : score actif 129,6 px, touches 53×146 px ; 1024×768 : touches de 47 px de large.
- [hypothèse rapport 06] Lisibilité confortable si hauteur de chiffre ≥ distance/150 (3 m → ~145 px de corps sur iPad).

## 5. Comportement cible
Un composant de présentation `GameScreenLayout` à zones (`header`, `players`, `active`, `input`, `controls`) placé par CSS grid selon la recette (`stack`, `stack-wide`, `arena`, `phone-landscape`). En `arena` : bandeau 56-64 px ; zone joueurs ≈ 58 % ; zone de saisie ≈ 42 % (côté configurable si Q3) ; carte du joueur actif dominante (nom 40-56 px, score 160-260 px, finish sous le score) ; adversaires 96-140 px ; Annuler et Valider sur la même rangée en bas de la zone de saisie. Chaque jeu remplit les zones avec son contenu, sans règle de jeu dans le composant.

## 6. Périmètre
### Inclus
- `GameScreenLayout` et recettes CSS (grid areas), remplaçant progressivement les crochets par jeu.
- Règles par jeu (§10) : X01, Cricket, Capital, Killer, Gotcha, Triathlon.
- Échelle typographique « jeu » (tokens de taille) et contrastes des scores (avec V2-DS-04).
- Placement des contrôles : Annuler près de Valider, Quitter isolé et confirmé, Stats/Config dans un menu secondaire si le bandeau déborde.
- Choix des fléchettes au finish intégré à la zone de saisie (X01).
- Emplacements réservés : bandeau d'état voix, voyant TV.
- Livraison par écran, dans les mêmes PR que V2-DS-03.
### Exclu
- Fonctionnement voix (V2-VOICE-*), diffusion TV (V2-TV-*), réglage persistant de main dominante si Q3 = non, X01 3-4 joueurs (V2-GAMES-16), écrans hors jeu en paysage (proposition ultérieure).

## 7. User stories
- En tant que joueur au club, je veux lire le score du joueur actif à 3 m, afin de suivre la partie sans m'approcher.
- En tant que saisisseur, je veux Annuler à côté de Valider, afin de corriger d'un geste du pouce.
- En tant que joueur de Cricket, je veux voir les points et les marques de loin, afin de choisir ma cible.

## 8. Règles métier
- RM-01 Le composant ne contient aucune règle de jeu ; il ne reçoit que des données de présentation.
- RM-02 Le joueur actif est signalé par au moins trois indices (fond, bordure/barre, symbole ▶), jamais par la couleur seule.
- RM-03 La ligne Bull du Cricket et toute action primaire ne sont jamais masquées.

## 9. Parcours utilisateurs
Parcours de base inchangé (ouvrir → jeu → prénoms → jouer). En partie : lecture des scores à distance, saisie au pouce dans la zone de saisie, finish X01 confirmé dans la zone de saisie au lieu d'une modale.

## 10. Exigences fonctionnelles
- FR-01 Tous les écrans de jeu utilisent `GameScreenLayout` en recette `arena` ; les crochets CSS par jeu correspondants sont supprimés au fil des lots.
- FR-02 X01 : score actif ≥ 160 px de corps sur 1080×810 ; score adverse ≥ 96 px et ≥ 4,5:1 ; finish suggéré sous le score actif ; Legs/Sets affichés par carte.
- FR-03 Cricket (2-3 joueurs) : points ≥ 48 px, marques ≥ 40 px, colonne de cibles centrale, 7 lignes toujours visibles.
- FR-04 Capital (1-4) : objectif courant ≥ 40 px, scores ≥ 56 px, pas de zone vide > 25 % de la zone joueurs.
- FR-05 Killer / Gotcha (2-6) : carte du joueur actif + grille de cartes (numéro, vies ou score) lisibles ≥ 32 px ; grille de saisie 1-20/Bull dans la zone de saisie.
- FR-06 Triathlon : hérite des recettes de ses phases + bandeau de progression de phase.
- FR-07 Annuler et Valider sont adjacents, ≥ 64 px de haut en `arena` (≥ 48 px en densité `tight`) ; Quitter est séparé des autres actions et confirmé.
- FR-08 Le choix des fléchettes au finish X01 s'affiche dans la zone de saisie sans masquer les scores.
- FR-09 Le composant expose deux emplacements optionnels : `voiceStatus` et `broadcastStatus` (vides par défaut).
- FR-10 Un changement de recette (rotation) conserve la saisie en cours et l'état de partie.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : ordre de focus = ordre visuel ; contrastes V2-DS-04 ; cibles V2-DS-02.
- NFR-02 Performance : aucun re-render du tableau de scores à chaque frappe sur le pavé (spec 020).
- NFR-03 Aucune dépendance ; coût récurrent 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : iPad 1080×810, X01 2 joueurs → actif dominant, pavé à droite.
- Alternatif : recette `stack` (portrait) → mêmes zones empilées ; lisibilité réduite assumée.

## 13. Cas limites
- Densité `tight` (480-599 px de haut) : la zone joueurs se réduit (adversaires condensés) avant toute réduction des touches.
- Noms très longs : troncature avec nom complet accessible (spec 005).
- 2v2 X01 : carte d'équipe avec joueur courant mis en évidence.

## 14. Gestion des erreurs
Sans objet (présentation) ; une zone vide ne casse pas la grille.

## 15. Impacts architecturaux
Nouveau composant de présentation (`components/layout/GameScreenLayout.tsx` ou `src/presentation/`). Les vues restent propriétaires de leur contenu ; aucune dépendance vers le domaine dans le composant. Coordination avec V2-GAMES-06 (cadre de jeu commun : bandeau, fin, sortie) et V2-ARCH-11 (découpage de `MatchView`).

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée (sauf réglage de main dominante si Q3 = oui : préférence locale versionnée). Contrat de slots documenté pour V2-VOICE-05 et V2-TV-04/06.

## 17. Compatibilité avec l'existant
Recettes `stack` et `phone-landscape` : rendu téléphone actuel conservé (sauf décision V2-TAB-06). Bureau : selon Q1.

## 18. Dépendances
- V2-TAB-01 (070) : recettes ; V2-DS-01 (063) : tokens.
- Recommandées : V2-TAB-02 (071), V2-DS-02 (064), V2-DS-04 (066).
- Mêmes lots que V2-DS-03 (065). Coordination : V2-GAMES-06 (049), V2-ARCH-11 (061).
- Débloque : V2-GAMES-16 (052), variantes voix (V2-VOICE-05, 076) et contrôleur TV (V2-TV-04, 085).

## 19. Critères d'acceptation
- AC-01 1080×810 tactile, X01 2 joueurs : corps du score actif ≥ 160 px, score adverse ≥ 96 px et contraste ≥ 4,5:1 (mesure E2E + axe-core).
- AC-02 1080×750, Cricket 3 joueurs : points ≥ 48 px, 7 lignes visibles.
- AC-03 1280×800, Killer 6 joueurs : les 6 cartes et les 21 touches sont visibles ; textes des cartes ≥ 32 px.
- AC-04 Sur tous les jeux en `arena` : Annuler et Valider sont dans la même rangée, ≥ 64 px de haut (≥ 48 px en `tight`).
- AC-05 X01 finish : la confirmation des fléchettes apparaît dans la zone de saisie, les scores restent visibles.
- AC-06 Rotation 1080×810 → 810×1080 en cours de saisie : saisie et scores conservés.
- AC-07 Recherche CSS : plus de sélecteurs `.tablet-<jeu>-*` pour les jeux migrés.
- AC-08 Test terrain : trois personnes lisent le score actif X01 et les points Cricket à 3 m sur un iPad 10,2" [à confirmer, protocole V2-QA-09].

## 20. Scénarios de tests
- Unitaires : rendu de `GameScreenLayout` par recette (zones présentes, slots optionnels).
- E2E : mesures AC-01 à AC-07 sur projets V2-QA-09 ; captures V2-QA-05.
- Terrain : lisibilité à distance, saisie au pouce, tablette posée et murale.

## 21. Exigences de non-régression
Specs 005 (alignement nom/score), 014, 021 (résilience police), 027/028 (invariants conservés : safe areas, mêmes cas d'usage) ; E2E téléphone.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Effort L sous-estimé (6 jeux) | Moyen | Moyenne | Livraison par écran, X01 d'abord |
| Conflits avec DS-03/ARCH-11/GAMES-06 | Moyen | Élevée | Même PR par écran, planning commun |
| Disposition X01 2 joueurs contestée | Moyen | Moyenne | Prototype sur appareil (Q2) |

## 23. Décisions architecturales
S'appuie sur ADR 0007 (classes de taille) et ADR 0006 (tokens). Décision « un seul composant à zones » à acter.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Arène aussi sur PC (D3) | Oui ; rendu PC conservé | Oui après validation tablette | Rendu PC conservé pour l'instant (arène limitée à `data-input="touch"`) ; arène sur PC après validation sur tablette |
| Q2 | X01 2 joueurs (D6) | Cartes égales ; actif dominant | Actif dominant, prototype avant décision | Actif dominant (prototype sur appareil non réalisé, validation sur captures et en recette) |
| Q3 | Main dominante (D7) | Réglage local ; côté fixe droit | Côté fixe droit en V2, réglage ensuite si demandé | Saisie à droite, côté fixe ; réglage de main dominante plus tard si demandé |
| Q4 | Finish X01 dans la zone de saisie | Oui ; modale actuelle | Oui | Oui : finish dans la zone de saisie en arène et en paysage téléphone ; modale plein écran conservée en pile |
| Q5 | Transitions de manche limitées à la zone joueurs | Oui ; plein écran | Oui | Oui : transition de manche limitée à la zone joueurs |

## 25. Traçabilité
Rapport 06 §2.3-2.5, §4.2, §7 (D3, D6, D7) ; compte rendu §C.3, §F.3, §G (Lot 2) ; specs 005, 014, 021, 027, 028 ; ADR 0006, 0007.

## Implémentation (2026-11-20)

- Issue #244 ; branche `feat/v2.0.0` ; vérifiée au commit `24dbbab`.
- Décisions appliquées : Q1 à Q5 selon la recommandation (colonne « Décision »).
- Structure commune :
  - `components/layout/GameScreenLayout.tsx` : zones `header`, `band` (optionnelle : bandeau de phase), `players`, `input`, superpositions en enfants ; emplacements `voiceStatus` et `broadcastStatus` vides par défaut (FR-09) ; aucune règle de jeu (RM-01). Écart avec le §5 : pas de zones `active` et `controls` séparées, la carte du joueur actif vit dans `players` et les commandes dans `header` / `input`.
  - `src/styles/layout/game-screen.css` : zones empilées en `stack` / `stack-wide` (et au bureau) ; en `arena` et `phone-landscape` tactiles, grille joueurs (~58 %) | saisie (~42 %, 50/50 en paysage téléphone), saisie à droite (Q3), en-tête et bandeau sur toute la largeur.
  - Les six écrans de jeu utilisent `GameScreenLayout` : `views/MatchView.tsx`, `CricketGameView.tsx`, `CapitalGameView.tsx`, `KillerGameView.tsx`, `GotchaGameView.tsx`, `TriathlonGameView.tsx` (bandeau de phase `components/triathlon/TriathlonPhaseBand.tsx`, FR-06). Règles propres à chaque jeu : `src/styles/games/{x01,cricket,capital,killer,gotcha,triathlon}.css`.
- Par jeu :
  - X01 : `components/match/MatchPlayersBoard.tsx` (joueur actif dominant, compteurs par carte), joueur actif signalé par fond, barre et ▶ (RM-02) ; Retour posé à côté de OK sur la dernière rangée du pavé (≥ 64 px, ≥ 48 px en densité `tight`, FR-07) ; Quitter séparé et confirmé ; choix des fléchettes au finish limité à la zone de saisie (Q4, FR-08) ; transition de manche limitée à la zone joueurs (Q5).
  - Cricket : colonne des cibles au centre, 7 lignes toujours affichées (le tableau défile au lieu d'être coupé), états `data-state` fermé (X cerclé) et fermé par tous (barré), joueur actif ▶ + bordure + fond ; pas de touche Valider : « C » (annuler) est placé dans la rangée du bas avec MISS et 3 MISS.
  - Capital : objectif courant ≥ 40 px, scores ≥ 56 px, grille 2 × 2 à 4 joueurs, Retour et OK côte à côte en bas de la zone de saisie.
  - Killer et Gotcha : cartes et textes agrandis en arène (≥ 32 px visés), grille de saisie dans la zone de saisie.
- Grille legacy (AC-07) : les vues n'utilisent plus les classes `.tablet-<jeu>-*` et la feuille `src/styles/layout/legacy-tablet-grid.css` a été supprimée en clôture du chantier.
- Tests unitaires : `tests/unit/layout/gameScreenLayout.test.tsx` (ordre des zones, bandeau absent par défaut, emplacements voix et TV), `tests/unit/components/keypads.test.tsx` (touche Retour d'arène juste avant OK).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/tablet-layout.smoke.spec.ts` (tous les jeux : actions atteignables et cibles ≥ 48 px ; X01 : Annuler et Valider sur la même rangée en paysage ; rotation en cours de saisie, AC-06).
- Écarts et restes :
  - Tailles calculées par la CSS, **non mesurées** : AC-01 (score actif ≥ 160 px, adverse ≥ 96 px à 1080×810), AC-02 (points Cricket ≥ 48 px), AC-03 (Killer à 6 joueurs, textes ≥ 32 px) et la hauteur ≥ 64 px d'AC-04 (l'E2E vérifie un plancher de 48 px) ; contrôle axe-core non écrit (V2-QA-05).
  - AC-08 (lecture à 3 m par trois personnes) et prototype sur appareil (Q2) : recette terrain à faire.
  - Guide utilisateur tablette : inexistant, non créé.

### Révision PO : arène portrait (2026-11-20)

- Décision du product owner : sur tablette, **le portrait devient la présentation de référence** et reçoit une refonte « arène portrait » pour les six jeux ; la spec 073 (invite et verrou paysage) est rejetée. **L'arène paysage décrite ci-dessus reste** : le paysage tactile est toujours supporté en recette `arena`, sans aucune incitation à tourner la tablette.
- Cible : joueur actif dominant en haut, grand pavé en bas (environ 46 % de la hauteur), touches d'au moins 64 px, Annuler à côté de Valider.
- Socle CSS : `src/styles/layout/game-screen.css`, sélecteur `[data-layout='tablet'][data-input='touch']:not([data-recipe='arena'])` (recettes `stack` / `stack-wide` en présentation tablette tactile) : zone de saisie en bas, `height: clamp(20rem, 46%, 60rem)` (sans plafond bas pour les grandes tablettes type Galaxy Tab S9+ ou 1200×1920), zone joueurs qui prend le reste ; règles fines par jeu dans `src/styles/games/<jeu>.css`.
- État : **livré** sur `feat/v2.0.0`. Tailles calculées puis contrôlées sur captures (Chromium sans interface, 780×1240 et 1200×1920, Dark et Light) : X01 score actif ≈ 254 px à 780×1240 et ≈ 408 px à 1200×1920 ; touches X01 ≈ 88 px puis ≈ 139 px de haut ; Cricket touches ≈ 104 px à 780×1240 ; Killer et Gotcha touches ≈ 99-117 px. Les tailles grandissent avec l'écran (clamp vw/vh/cqh).
- Demandes complémentaires du PO intégrées au chantier (2026-11-20) :
  - pavé X01 tablette refondu sur le modèle du téléphone : bandeau de saisie (grand affichage, « Reste », « Sortie possible »), rangée de 8 raccourcis agrandis, pavé à 4 colonnes `1 2 3 RESTE / 4-9 + « Annonce ton score » / Annuler 0 OK` ; touches « C » et « Retour » fusionnées en une touche « Annuler » (efface la saisie en cours, sinon annule la dernière volée), même règle au Gotcha et au mode chiffré du Capital ;
  - commandes unifiées dans les six jeux (`components/game/controls/*`) : un seul bandeau d'en-tête `GameHeader` (lisible à distance en tablette : chrono 28-40 px, boutons 56-64 px), un seul dialogue `ConfirmExitDialog` (agrandi en tablette), claviers sur `KeypadGrid`/`KeypadKey`/`KeypadActionRow` dans le langage du pavé X01, « Raté » → « MISS » au Killer ;
  - noms de joueurs jamais tronqués (`components/ui/FitText.tsx`, taille mesurée, deux lignes en dernier recours) ;
  - X01 sur téléphone : le score domine le nom (`src/styles/games/x01-phone.css`) ;
  - Cricket : colonne des cibles au centre seulement en duel ; à 3 joueurs et plus, elle suit tous les joueurs (jamais entre le 2e et le 3e) ;
  - pages hors jeu optimisées en tablette (`src/styles/screens/tablet-pages.css`) : configuration, statistiques, options X01 (bug de positionnement des modales corrigé), Réglages, « Qui commence ? » ; page de choix des jeux refondue (X01 en vedette, description et repères par jeu, `src/styles/screens/game-selection.css`).
- Restent : E2E (CI de la PR), recette sur appareils réels, lecture à 3 m.


## Clôture (2026-11-27)

- Périmètre livré en production `2.2.0`, vérifié dans l'arbre du commit `7d90e54` : [`components/layout/GameScreenLayout.tsx`](../../components/layout/GameScreenLayout.tsx) et [`tests/unit/layout/gameScreenLayout.test.tsx`](../../tests/unit/layout/gameScreenLayout.test.tsx).
- Recette validée par le product owner le 27/11/2026 : « toutes les recettes sont faites depuis la mise en prod » et « Tout a été testé ». Cette confirmation globale ne reconstitue ni une liste d'appareils ni des mesures non consignées.
- Preuves de CI et de production : [bilan de recette 2.2.0](../../docs/release/v2.2.0.md#recette-validée-le-27112026). Aucun E2E ni smoke exécuté localement.
- Reliquats transférés, non déclarés réalisés :
  - [V2-QA-09](../042-counter-qa-real-device-matrix/spec.md) : assertions chiffrées et matrice automatisée d'appareils non livrées. La proposition reste `a-valider`.
  - [V2-QA-05](../041-counter-qa-accessibility-visual-regression/spec.md) : captures automatisées de référence, régression visuelle et axe-core non livrés. La proposition reste `a-valider`.
  - [V2-DOC-05](../037-counter-doc-user-guides-v2/spec.md) : guide utilisateur tablette non rédigé. La proposition reste `a-valider`.
