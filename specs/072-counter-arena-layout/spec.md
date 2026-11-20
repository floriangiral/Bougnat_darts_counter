---
id: 072-counter-arena-layout
v2_id: V2-TAB-03
titre: Disposition « arène » tablette paysage
type: fonctionnel
statut: a-valider
validation: en-attente
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
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 072 — Disposition « arène » tablette paysage

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

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
| Q1 | Arène aussi sur PC (D3) | Oui ; rendu PC conservé | Oui après validation tablette | À prendre |
| Q2 | X01 2 joueurs (D6) | Cartes égales ; actif dominant | Actif dominant, prototype avant décision | À prendre |
| Q3 | Main dominante (D7) | Réglage local ; côté fixe droit | Côté fixe droit en V2, réglage ensuite si demandé | À prendre |
| Q4 | Finish X01 dans la zone de saisie | Oui ; modale actuelle | Oui | À prendre |
| Q5 | Transitions de manche limitées à la zone joueurs | Oui ; plein écran | Oui | À prendre |

## 25. Traçabilité
Rapport 06 §2.3-2.5, §4.2, §7 (D3, D6, D7) ; compte rendu §C.3, §F.3, §G (Lot 2) ; specs 005, 014, 021, 027, 028 ; ADR 0006, 0007.
