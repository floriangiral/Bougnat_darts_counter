---
id: 049-counter-common-game-frame
v2_id: V2-GAMES-06
titre: Cadre de jeu commun (barre de partie, fin, revanche, undo, sortie)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation UX/UI
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [V2-ARCH-04]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 049 — Cadre de jeu commun (barre de partie, fin, revanche, undo, sortie)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Rapport `03-games.md` §4 (tableau des incohérences), §5.2-5.5, §5.9-5.10 ; compte rendu §C.5 « Transverse » : chaque jeu a sa propre barre, sa propre fin de partie, sa propre sémantique d'annulation. Cette spec regroupe les propositions V2-GAMES-06/07/08 du rapport en un **cadre** commun, sans toucher aux règles ni aux keypads propres à chaque jeu.

## 2. Problématique

Un joueur qui passe d'un jeu à l'autre rencontre 4 libellés de retour au menu, des fins de partie différentes, « C » qui efface ici et annule là, et deux jeux (Killer, Gotcha) qui se quittent sans confirmation et enregistrent le résultat avant toute correction possible.

## 3. Objectifs

- Mêmes comportements de cadre dans les 6 jeux : barre de partie, sortie confirmée, fin de partie, revanche, annulation, choix du premier joueur, règles consultables.
- Résultat enregistré uniquement à la validation de l'écran de fin, dans tous les jeux.
- Spécificités conservées : keypads, tableaux de score, aperçus propres à chaque jeu.

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | Killer et Gotcha quittent la partie sans confirmation | `views/KillerGameView.tsx:123`, `views/GotchaGameView.tsx:171-178` | [vérifié] |
| C2 | Killer et Gotcha enregistrent le résultat par effet dès la fin, sans annulation possible | `views/KillerGameView.tsx:52-60`, `views/GotchaGameView.tsx:105-114`, historique `src/app/useGameLifecycle.ts:148-180` | [vérifié] |
| C3 | Fin de partie X01 sans annulation ; Cricket inatteignable (spec 047) ; Capital correcte (annulation + validation au clic) | `views/MatchView.tsx:771-786`, `views/CricketGameView.tsx:95-104`, `views/CapitalGameView.tsx:140-150` | [vérifié] |
| C4 | Écrans `KILLER_STATS` / `GOTCHA_STATS` déclarés, jamais rendus ; fin Killer/Gotcha = « Retour aux jeux » seul | `src/app/appShell.ts:21,23` ; `views/KillerGameView.tsx:107`, `views/GotchaGameView.tsx:157` | [vérifié] |
| C5 | Revanche : même configuration, aucune alternance du premier joueur | `src/app/useGameLifecycle.ts:195-202` | [vérifié] |
| C6 | « C » = annuler la dernière fléchette au Cricket ; effacer la saisie ailleurs | `components/game/CricketKeypad.tsx:117-125` | [vérifié] |
| C7 | Piles d'annulation hétérogènes : illimitée (X01, Cricket), 20 états (Killer), 30 (Gotcha), reducer (Capital) | `views/KillerGameView.tsx:63`, `views/GotchaGameView.tsx:117` | [vérifié] |
| C8 | Killer : le joueur 1 commence toujours après l'attribution ; aucun choix du lanceur Killer/Gotcha | `src/domain/killer/killer.ts:71-72` ; pas de `StartingPlayerOverlay` dans `KillerGameView`/`GotchaGameView` | [vérifié] |
| C9 | Doublettes Cricket/Triathlon : « Équipe 1 / Équipe 2 » au lieu des prénoms | `views/CricketGameView.tsx:81-86`, `src/features/cricket/cricketGameModel.ts:62`, `src/features/triathlon/triathlonFlow.ts:27` | [vérifié] |
| C10 | Statistiques X01 : retour automatique à l'accueil après 2 min, minuterie non réinitialisée par l'interaction | `views/StatsView.tsx:28-36` | [vérifié] |
| C11 | Barres de partie distinctes : `MatchTopBar`, en-têtes maison Cricket/Capital, `TriathlonGameHeader`, bouton isolé Killer/Gotcha | `components/match/MatchTopBar.tsx`, `views/CricketGameView.tsx:283-317`, `components/triathlon/TriathlonGameHeader.tsx` | [vérifié] |
| C12 | Libellés de fin : « REVANCHE/SORTIE », « Rejouer/Menu Principal », « Revanche/Menu Principal », « Retour aux jeux » | `src/presentation/stats/statsLabels.fr.ts:31-32,40-41,64-65,75-76` | [vérifié] |
| C13 | Règles consultables uniquement au setup | `src/features/game-setup/setupPresentation.ts:97-140` | [vérifié] |

## 5. Comportement cible

Chaque jeu est rendu dans un cadre composé de : `GameTopBar` (identité, horloge, chrono, tour/manche, Règles, Statistiques si disponibles, Options si disponibles, Quitter), `ExitConfirmDialog`, `GameEndScreen`, `StartingPlayerOverlay` commun. Les actions de fin sont, dans cet ordre : « Annuler la dernière action », « Statistiques », « Revanche », « Changer de jeu ». La revanche alterne le premier joueur (Q1).

## 6. Périmètre

### Inclus
Composants de cadre, intégration dans les 6 vues de jeu, sémantique « Effacer » / « Annuler », moment d'enregistrement du résultat, revanche, choix du premier joueur, règles en partie, prénoms en doublettes, retour automatique des statistiques.

### Exclu
Règles de jeu ; keypads ; persistance (spec 010) ; tokens de thème (V2-DS-01/03, specs 063/065) ; disposition « arène » (V2-TAB-03, spec 072) ; statistiques détaillées Killer/Gotcha (spec 053) ; support clavier physique et touche « TROP » (à rattacher à une spec ultérieure si validé).

## 7. User stories

- En tant que joueur, je veux que « Quitter » me demande confirmation dans tous les jeux, afin de ne pas perdre une partie par erreur.
- En tant que marqueur, je veux annuler la dernière action depuis l'écran de fin, afin de corriger une erreur avant que le résultat soit enregistré.
- En tant que groupe d'amis, je veux enchaîner une revanche où l'autre joueur commence, afin de rejouer vite et équitablement.

## 8. Règles métier

- RM-01 « Effacer » (⌫) agit uniquement sur la saisie non validée ; « Annuler » (↶) annule la dernière action validée (visite, fléchette, attribution).
- RM-02 L'annulation reste possible depuis l'écran de fin tant que le résultat n'est pas validé.
- RM-03 Le résultat (historique local, lien externe) est enregistré une seule fois, à la validation de l'écran de fin.
- RM-04 Revanche : mêmes joueurs et configuration ; premier joueur selon Q1.
- RM-05 Ex æquo affichés comme tels (rang partagé), selon la règle de chaque jeu.

## 9. Parcours utilisateurs

Parcours de base inchangé (ouvrir → jeu → prénoms → jouer). Fin : écran commun → Statistiques (si le jeu en a) → Revanche ou Changer de jeu.

## 10. Exigences fonctionnelles

- FR-01 `ExitConfirmDialog` unique (élément `dialog`), texte adapté selon que la partie est reprise ou non (spec 010).
- FR-02 `GameEndScreen` commun (vainqueur(s), durée, score final, 4 actions ordonnées) dans les 6 jeux.
- FR-03 Killer et Gotcha n'appellent plus `onFinish` par effet ; RM-03 partout.
- FR-04 Sémantique RM-01 avec libellés et icônes uniques ; « C » du Cricket renommé « Annuler ↶ ».
- FR-05 Pile d'annulation sans borne arbitraire différente par jeu (borne commune documentée, ≥ 100 actions).
- FR-06 `StartingPlayerOverlay` dans Killer (après attribution, ordre conservé) et Gotcha ; prénoms des équipiers en doublettes.
- FR-07 Bouton « Règles » dans `GameTopBar` réutilisant `getRulesContent` avec la configuration réelle.
- FR-08 Revanche avec alternance du premier joueur (Q1) dans tous les jeux qui ont une revanche.
- FR-09 Retour automatique des statistiques : selon Q2.
- FR-10 Libellés de fin identiques dans tous les jeux (centralisés dans `statsLabels.fr.ts`).

## 11. Exigences non fonctionnelles

- NFR-01 Les composants de cadre ne connaissent aucune règle de jeu ; ils reçoivent un état et des callbacks.
- NFR-02 Accessibilité : focus piégé dans les dialogues, cibles ≥ 48 px, `aria-label` en français.
- NFR-03 Aucun coût récurrent, aucune dépendance.

## 12. Cas nominaux et alternatifs

Nominal : fin → validation → statistiques. Alternatifs : annulation depuis la fin ; quitter confirmé ; quitter annulé ; match lié (spec 030) dont l'action « Envoyer le résultat » remplace « Changer de jeu ».

## 13. Cas limites

Triathlon (fin d'épreuve vs fin de Triathlon) ; robot X01 (aperçu de victoire, `botVictoryPreview`) ; partie à 1 joueur (X01) ; ex æquo Capital ; double appui sur « Revanche ».

## 14. Gestion des erreurs

Aucune perte silencieuse : si la validation échoue à enregistrer l'historique, l'écran de fin reste affiché avec un message.

## 15. Impacts architecturaux

Nouveaux composants dans `components/game-frame/` (nom à confirmer) ; ils s'appuient sur le contrat d'état de partie de V2-ARCH-04 (spec 058 : `isFinished`, `winner`, `undo`) — d'où la dépendance.

## 16. Impacts sur les données et les interfaces

Le moment d'enregistrement change pour Killer et Gotcha (RM-03) ; format des entrées d'historique inchangé.

## 17. Compatibilité avec l'existant

Changements visibles mais parcours de base inchangé ; tests E2E existants à adapter (sélecteurs `winner-view-stats`).

## 18. Dépendances

- V2-ARCH-04 (spec 058) : état sérialisable et undo uniformes.
- Liées : V2-GAMES-04 (spec 047), V2-ARCH-06 (spec 010), V2-GAMES-10 (spec 013, libellés), V2-GAMES-13 (spec 053), V2-TAB-03 (spec 072), V2-DS-03 (spec 065), mode Découverte (spec 055).

## 19. Critères d'acceptation

- AC-01 Dans les 6 jeux, « Quitter » ouvre une confirmation ; « Non » laisse la partie intacte.
- AC-02 Killer et Gotcha : aucune entrée d'historique avant validation de l'écran de fin ; « Annuler » depuis la fin restaure la partie.
- AC-03 X01 : annulation de la visite gagnante depuis l'écran de fin.
- AC-04 Revanche dans un jeu à 2 joueurs : le premier joueur est l'autre joueur (si Q1 = alternance).
- AC-05 Aucun bouton nommé « C » ne déclenche d'annulation.
- AC-06 Killer et Gotcha proposent le choix du premier joueur ; Killer conserve l'ordre choisi après attribution.
- AC-07 Le bouton « Règles » affiche les règles de la configuration en cours dans les 6 jeux.
- AC-08 Libellés de fin identiques dans les 6 jeux (test sur `statsLabels.fr.ts`).

## 20. Scénarios de tests

Tests de composants du cadre ; un test de vue par jeu (fin, annulation, validation unique) ; E2E « partie complète + annulation depuis la fin + revanche » par jeu (coordination V2-QA-04, spec 040).

## 21. Exigences de non-régression

Règles et keypads de chaque jeu ; lien externe (spec 030) ; robot ; voix X01 ; Triathlon.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Uniformisation qui gomme une spécificité utile | Moyen | Moyenne | Cadre seulement, keypads intacts |
| Régression sur des vues sans tests | Élevé | Moyenne | Tests de caractérisation avant refactor (spec 039) |
| Écran supplémentaire jugé lent en bar | Faible | Faible | Actions en un appui |

## 23. Décisions architecturales

S'appuie sur l'ADR « l'état d'une partie n'appartient pas aux vues » (rapport 02, ADR-0002, porté par la spec 058).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Revanche : premier joueur (H, rapport 03 §9.8) | a) alternance automatique ; b) redemander ; c) inchangé | a) avec possibilité de changer dans l'overlay | — |
| Q2 | Retour automatique des statistiques après 2 min (H) | a) supprimer ; b) vraie inactivité réinitialisée ; c) option « mode bar » | b) | — |
| Q3 | Statistiques Killer/Gotcha dans ce cadre ou dans la spec 053 ? | a) 053 ; b) ici | a) — le cadre prévoit seulement l'emplacement | — |
| Q4 | Borne de la pile d'annulation | a) illimitée ; b) 100 actions ; c) inchangé | b) | — |

## 25. Traçabilité

Rapport `03-games.md` §4, §5, §9.8-9.9 ; rapport `02-architecture.md` (ADR-0002) ; compte rendu §C.5, §F.2, §H ; specs 010, 047, 053, 055, 058.
