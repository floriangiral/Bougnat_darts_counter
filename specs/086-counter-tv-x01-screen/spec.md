---
id: 086-counter-tv-x01-screen
v2_id: V2-TV-06
titre: Interface TV X01
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: tv
priorite: P1
difficulte: M
recommandation: recommande
lot: 3
poids: 38
depend_de: [V2-TV-02, V2-DS-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 086 — Interface TV X01

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La mission (§5.6) demande une interface « spécifiquement conçue pour être consultée à distance, sans keypad ni boutons de saisie », lisible à plusieurs mètres, en 16:9, avec joueur actif, scores, sets/legs, statistiques, suggestion de finish, animations des performances, écrans de victoire. Le rapport `07-tv-mode.md` (§6.2-6.5) et le rapport `05-design-system.md` (§4.4-4.5) en donnent les principes. Cette spec définit l'écran TV X01, rendu à partir de la projection 084, quel que soit le transport (085 local, 087 relais).

## 2. Problématique

L'interface de contrôle X01 est pensée pour être touchée à 50 cm : clavier, petits libellés, contrastes faibles sur les états atténués (score inactif 2,04:1 selon `05-design-system.md` §2.5). Recopiée sur une TV, elle est illisible et encombrée. Par ailleurs, la feuille Tailwind 4 vise Chrome 111+ alors que les TV 2022 embarquent Chromium 85 (Samsung) ou 87 (LG).

## 3. Objectifs

- Lecture du score restant de chaque camp à 5 m sur une TV 55" [à valider en test terrain, spec 090].
- Identification du joueur actif sans dépendre de la couleur.
- Rendu correct sur Chromium ≥ 85 (baseline à confirmer par 018) et sur navigateurs desktop récents.
- Aucune règle de jeu dans l'écran.

## 4. État actuel vérifié dans le code

- [vérifié] Aucun écran TV ni feuille dédiée ; la barre de partie affiche heure et chrono en petit (`components/match/MatchTopBar.tsx`).
- [vérifié] La transition de leg (3 s, compte à rebours) est calculée dans la vue (`views/MatchView.tsx:438-452`) ; l'équivalent TV sera déduit de la projection (`leg_won`, 084).
- [vérifié] `CheckoutHint` affiche `CHECKOUT_GUIDE` (table Double Out, `constants.ts:1-3`) sans tenir compte de la règle (`components/game/CheckoutHint.tsx:9`) : la TV n'affiche que `checkoutHint` fourni par la projection.
- [vérifié] Styles : Tailwind 4 (`package.json:41-42,58`), feuille unique `src/styles/tailwind.css` importée par `index.tsx:3` ; aucune variable de thème (V2-DS-01, 063).
- [vérifié] `enterFullScreen` existe (`utils/uiUtils.ts:17-30`).
- [EXT] Moteurs web : Samsung Tizen 2022 M85, 2023 M94, 2024 M108 ; LG webOS 2022 Chromium 87, 2023 94, 2024 108 ; Tailwind 4 : Chrome 111, Safari 16.4.

## 5. Comportement cible

Écran 16:9 plein cadre, zone sûre de 5 % sur chaque bord. En-tête : format (« Premier à 3 legs »), leg/set courant, heure, chrono. Corps : un panneau par camp avec nom (et coéquipiers en doublette), **score restant en très grand**, legs/sets, moyenne 3 fléchettes, fléchettes du leg, 3 dernières volées, badge du lanceur du match ; le camp actif est signalé par une couleur réservée **et** une flèche **et** le texte « À Alice ». Sous le camp actif : suggestion de checkout quand la projection la fournit. Temps forts animés, écran de victoire, badge « Correction » après une annulation. Mention Bougnat Darts permanente.

## 6. Périmètre

### Inclus
- Composants TV X01 (panneaux, en-tête, temps forts, interstitiel de leg, victoire, états de connexion).
- Feuille de style TV conservatrice fondée sur les tokens de V2-DS-01 (063) exportés en valeurs hex/rgb.
- Plein écran, curseur masqué, maintien d'éveil si disponible.

### Exclu
- Transport (085, 087), appairage (088), autres jeux (089), thème club et logo (098, V2-BRAND-06), mention co-brandée définitive (097, V2-BRAND-05), état vocal (081), pause côté contrôleur (décision H.19).

## 7. User stories

- En tant que spectateur au fond d'un bar, je veux lire les scores et savoir qui joue.
- En tant que joueur, je veux voir ma finition suggérée sur le grand écran sans regarder la tablette.
- En tant que club, je veux qu'un 180 soit célébré à l'écran.

## 8. Règles métier

- RM-01 L'écran affiche exclusivement les données de la projection ; il ne calcule ni bust, ni checkout, ni fin de leg.
- RM-02 Un temps fort n'est animé qu'une fois (identifiant non encore vu) ; jamais à la reconnexion, ni sur `undo`, `correction`, `sync`.
- RM-03 Le chrono est incrémenté localement à partir de `clock` ; l'heure est celle de l'écran.

## 9. Parcours utilisateurs

Aucun geste requis en cours de partie. Premier affichage : bouton « Plein écran » (clic de télécommande ou de souris). Victoire : l'écran reste affiché jusqu'à la partie suivante ou 30 min, puis revient à l'attente.

## 10. Exigences fonctionnelles

- FR-01 Disposition 1 contre 1 et 2 équipes de doublette : deux panneaux côte à côte ; 3-4 camps (si spec 015 les autorise) : lignes empilées.
- FR-02 Tailles relatives à la hauteur d'écran : score restant ≥ 20 %, noms ≥ 6 %, informations secondaires ≥ 3,5 % [hypothèse à valider à 3 et 5 m].
- FR-03 Joueur actif : couleur réservée (V2-DS-04, 066) + flèche + libellé « À <nom> ».
- FR-04 Checkout : affiché uniquement si `checkoutHint` non nul, sous le camp actif, en grand.
- FR-05 Temps forts : `180` plein écran 2 s ; `ton_forty` et `ton_plus` en bandeau 1,5 s ; `bust` « TROP ! » 1,5 s ; `checkout` « CHECKOUT 121 » 2 s ; `leg_won` interstitiel 3 s « Leg pour <nom> » ; `set_won` 3 s ; `match_won` écran de victoire avec moyenne, meilleure volée, checkout le plus haut, durée.
- FR-06 `cause: undo` ou `correction` : état corrigé sans animation, badge « Correction » 2 s.
- FR-07 États de connexion fournis par le transport : « En attente de la tablette », « Reconnexion… » (après 5 s), « Contrôleur absent depuis HH:MM » (scores figés visibles), « Diffusion terminée ».
- FR-08 Écran « Mettez à jour cet écran » si `v` ou `schema` non supporté, avec rechargement automatique hors partie.
- FR-09 Plein écran via `enterFullScreen` au premier geste ; curseur masqué après 3 s ; Wake Lock si disponible [à confirmer sur TV].
- FR-10 Emplacement réservé et non masquable pour la mention « Powered by Bougnat Darts » (contenu définitif par 097).
- FR-11 Zone réservée (désactivée par défaut) pour l'état vocal éphémère de 081, visuellement distincte du score engagé.

## 11. Exigences non fonctionnelles

- NFR-01 CSS TV : variables CSS, couleurs hex/rgb, flexbox/grid simples, unités `vh`/`vw` ; **interdits** : `oklch`, `color-mix`, `@layer`, `@property`, `:has`, requêtes de conteneur, imbrication CSS, `dvh` ; contrôle automatisé par lint de la feuille.
- NFR-02 Contraste ≥ 7:1 pour les scores, ≥ 4,5:1 pour le reste du texte (y compris états inactifs) ; thème sombre par défaut (question H.17).
- NFR-03 Mouvement : animations ≤ 2 s, aucun clignotement > 3 par seconde (WCAG 2.3.1), `prefers-reduced-motion` respecté (V2-DS-05, 067).
- NFR-04 Chiffres tabulaires (`font-variant-numeric: tabular-nums`) ; police système ; une police de chiffres auto-hébergée reste une option P3 du rapport 05, hors catalogue.
- NFR-05 Rendu vérifié en 1280×720, 1920×1080, 3840×2160 et sur Chromium 85, 87, 94, 108 (émulation en CI, appareils via 090).
- NFR-06 Rendu d'un snapshot < 50 ms sur Chromium 85 émulé avec CPU ×4 [à confirmer].

## 12. Cas nominaux et alternatifs

501 double out 1 contre 1 ; doublette ; partie en sets ; partie contre le bot (niveau affiché) ; règle Open (pas de checkout affiché).

## 13. Cas limites

- Noms longs (32 caractères) ou initiales : troncature avec ellipse, aucune coupure du score.
- Deux temps forts successifs rapides : file d'attente, le plus récent prioritaire, durée totale ≤ 4 s.
- Annulation pendant l'animation d'un 180 : animation interrompue, badge « Correction ».
- Écran 4:3 ou 21:9 : bandes neutres, ratio 16:9 conservé.
- Surbalayage (overscan) de la TV : zone sûre de 5 %.

## 14. Gestion des erreurs

Snapshot invalide : ignoré, dernier état valide conservé. Exception de rendu : limite d'erreur React affichant « Écran TV — rechargement » puis rechargement automatique après 10 s.

## 15. Impacts architecturaux

Composants dans `src/tv/x01/` ; ils n'importent que `src/shared/broadcast` et la feuille TV. Aucune dépendance vers `domain`, `application`, `views` ni `components/game`.

## 16. Impacts sur les données et les interfaces

Aucune donnée persistée. Consomme `SpectatorSnapshot` v1, vue `x01` schéma 1 (084).

## 17. Compatibilité avec l'existant

Aucune modification de l'interface de contrôle. Les tokens de 063 sont consommés en lecture ; aucune classe Tailwind dans l'écran TV.

## 18. Dépendances

- V2-TV-02 (084) : projection X01.
- V2-DS-01 (063) : tokens (couleurs réservées via V2-DS-04, 066).
- Liens : 085 et 087 (transports), 018 (V2-DS-00, baseline), 097 (mention), 098 (thème), 081 (voix), 090 (qualification).

## 19. Critères d'acceptation

- AC-01 Snapshot de référence 501 à 2 joueurs, rendu 1920×1080 → score restant de hauteur ≥ 216 px, noms ≥ 65 px (mesure DOM).
- AC-02 Joueur actif identifiable en niveaux de gris (capture désaturée) grâce à la flèche et au libellé.
- AC-03 Snapshot `180` → animation 2 s ; même snapshot renvoyé (`sync`) → aucune animation.
- AC-04 `cause: undo` → badge « Correction » 2 s, aucune animation.
- AC-05 `checkOut: 'Open'` → aucune suggestion affichée.
- AC-06 Rendu Chromium 85 émulé : aucune propriété interdite dans la feuille TV (lint) et capture conforme à la référence.
- AC-07 `prefers-reduced-motion: reduce` → temps forts sans mouvement (fondu ou statique).
- AC-08 Contrastes mesurés ≥ 7:1 (scores) et ≥ 4,5:1 (textes) sur le thème TV par défaut.
- AC-09 Mention Bougnat présente sur les écrans d'attente, partie, victoire.

## 20. Scénarios de tests

- Composants (Vitest + Testing Library) : panneaux, temps forts, file d'animations, badge correction.
- Régression visuelle (Playwright, V2-QA-05, 041) : captures 720p/1080p/2160p, émulation Chromium ancien [à confirmer : image Docker].
- Accessibilité : axe sur l'écran TV, contrastes calculés.
- Terrain (090) : lisibilité à 3 m et 5 m.

## 21. Exigences de non-régression

Interface de contrôle inchangée ; aucune classe Tailwind ajoutée dans le bundle contrôleur ; tests X01 verts.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Rendu cassé sur TV 2022-2024 | Élevé | Haute sans CSS dédiée | NFR-01, lint, 090 |
| Tailles insuffisantes à 5 m | Moyen | Moyenne | Hypothèses validées en terrain |
| Animations gênantes en bar | Faible | Moyenne | Durées courtes, option de réduction |
| Divergence avec les tokens | Moyen | Moyenne | Export automatique des tokens 063 |

## 23. Décisions architecturales

ADR 0005 (écran lecteur pur, aucune règle) ; ADR proposé « Thèmes par design tokens » (063) pour l'export de valeurs hex destinées à la TV ; baseline TV fixée par 018.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Thème TV (H.17) | Sombre par défaut / hérité de la tablette | Sombre par défaut | — |
| 2 | Baseline (H.3) | Chromium ≥ 85 / ≥ 87 / ≥ 94 | ≥ 85 (Samsung 2022), tranché en 018 | — |
| 3 | Durée de l'écran de victoire | Jusqu'à la revanche / 30 min / 5 min | Jusqu'à la revanche, 30 min maximum | — |
| 4 | Pause (H.19) | Écran « Pause » / non | Reporter, contrat prêt | — |
| 5 | Anti-marquage OLED | Léger déplacement périodique / non | Étudier en 090 avant d'exiger | — |

## 25. Traçabilité

Rapports : `07-tv-mode.md` §4.4, §6.2-6.5, P5, P6 ; `05-design-system.md` §2.5, §4.4-4.5 ; compte rendu C.6, C.7, H.3, H.17, H.19. Revue croisée : Samsung 2022 = Chromium 85, LG = 87. Specs : 084, 063, 066, 067, 085, 087, 018, 097, 098, 081, 090, 041, 045.
