---
id: 089-counter-tv-other-games
v2_id: V2-TV-08
titre: Interfaces TV des autres jeux
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: tv
priorite: P2
difficulte: L
recommandation: recommande
lot: 4
poids: 13
depend_de: [V2-ARCH-04, V2-TV-06]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 089 — Interfaces TV des autres jeux

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La mission (§5.6) précise : « Le contenu affiché doit être pertinent pour chaque jeu. Ne force pas un modèle d'affichage identique lorsque les règles nécessitent une présentation différente. » Le rapport `07-tv-mode.md` (§6.3) décrit le contenu attendu pour Cricket, Capital, Killer, Gotcha et Triathlon. Ces jeux ne sont pas diffusables aujourd'hui : leur état vit dans les vues (`07-tv-mode.md` §2.1, `02-architecture.md` §6.1). Cette spec définit leurs projections spectateur (extension du contrat 084) et leurs écrans TV (sur le socle de 086).

## 2. Problématique

Sans état de partie sérialisable remonté au shell, toute diffusion de ces jeux obligerait à réécrire leurs règles côté TV. Leur présentation diffère fortement de X01 (grille Cricket, vies Killer, distance à la cible Gotcha, phases Triathlon).

## 3. Objectifs

- Une projection pure et un écran TV par jeu, sans règle côté TV.
- Même transport, même enveloppe, mêmes états de connexion que X01.
- Lisibilité à 3-5 m identique à 086.

## 4. État actuel vérifié dans le code

- [vérifié] `App.tsx:364-422` ne passe que `players`, `config`, `onExit`, `onFinish` aux vues Cricket, Capital, Killer, Gotcha, Triathlon : aucun `onStateChange`, aucun état restauré.
- [vérifié] Cricket : état éclaté en plusieurs `useState` (`views/CricketGameView.tsx:47-65` : `states`, `aggregateStats`, `currentThrowerIdx`, `turnDartsThrown`, `history`, `winnerId`…) ; limite de tours `config.cricketRounds` (`CricketGameView.tsx:69`) ; règle pure `isNumberClosedGlobally` (`utils/cricketLogic.ts:20`).
- [vérifié] Capital : `useReducer(capitalGameReducer)` (`views/CapitalGameView.tsx:50`, `src/features/capital/capitalGameModel.ts:147`), cibles `CAPITAL_TARGETS` (`utils/capitalLogic.ts:3`).
- [vérifié] Killer : `KillerState` pur (`src/domain/killer/killer.ts:16-23` : phase, joueurs avec cible, vies, statut Killer, éliminé, `log: string[]`) tenu dans la vue (`views/KillerGameView.tsx:31-34`).
- [vérifié] Gotcha : `GotchaState` pur (`src/domain/gotcha/gotcha.ts:19-26`, tours avec `gotchaVictimIds`) tenu dans la vue (`views/GotchaGameView.tsx:69-72`).
- [vérifié] Triathlon : `useReducer(triathlonFlowReducer)` (`views/TriathlonGameView.tsx:31`), phases `STARTING_DRAW`, `CAPITAL`, `TRANSITION_CRICKET`, `CRICKET`, `TRANSITION_X01`, `X01`, `TIE_BREAK_X01` (`src/features/triathlon/triathlonFlow.ts:4-11`).
- [vérifié] Les journaux `log: string[]` de Killer et Gotcha contiennent du texte libre : ils ne doivent pas être diffusés tels quels (prénoms non minimisés).

## 5. Comportement cible

Quand V2-ARCH-04 (058) expose pour chaque jeu un état sérialisable et observable, le shell calcule la projection du jeu actif (`kind` propre, `schema: 1`) et la publie par le même port (084). L'écran TV choisit la présentation selon `kind`.

## 6. Périmètre

### Inclus
- Vues de projection `cricket`, `capital`, `killer`, `gotcha`, `triathlon` (schéma 1) et temps forts propres à chaque jeu.
- Écrans TV correspondants, sur la CSS conservatrice et les composants communs de 086 (en-tête, bannières, mention, victoire).
- Activation de la commande « Diffuser » pour ces jeux.

### Exclu
- Extraction de l'état sérialisable (058), corrections de règles (047 fin de partie Cricket, 048 barème Triathlon), variantes de jeux, voix multi-jeux.

## 7. User stories

- En tant que club, je veux diffuser un Cricket avec la grille des marques lisible de loin.
- En tant que bar, je veux un Killer où l'on voit les vies et les éliminations.
- En tant que joueur de Triathlon, je veux savoir quelle épreuve est en cours et le classement général.

## 8. Règles métier

- RM-01 Toute donnée dérivée (cible fermée par tous, cible Capital courante, statut Killer, distance Gotcha) est calculée côté contrôleur par les fonctions de règles existantes.
- RM-02 Aucun texte libre de journal n'est diffusé ; les « derniers faits » sont des structures typées dont les noms sont minimisés (084, FR-05).
- RM-03 Une annulation produit un nouvel état sans animation, badge « Correction ».

## 9. Parcours utilisateurs

Identique à X01 : « Diffuser » dans la barre de partie du jeu ; l'écran déjà appairé ou ouvert bascule automatiquement d'un jeu à l'autre.

## 10. Exigences fonctionnelles

- FR-01 **Cricket** (`kind: 'cricket'`) : grille cibles 20 à 15 + Bull × joueurs, marques `/`, `X`, `Ⓧ` ; cibles fermées par tous grisées **et** barrées ; points ; tour `n/limite` ; fléchettes de la volée (●●○) ; joueur actif. Temps forts : `triple`, `target_closed`, `all_closed`, `match_won`.
- FR-02 **Capital** (`kind: 'capital'`) : cible courante en très grand ; progression 1 à 17 ; scores ; résultat de la dernière volée (réussite ou « ÷2 »). Temps forts : `capital_halved`, `capital_hit`, `match_won`.
- FR-03 **Killer** (`kind: 'killer'`) : phase (attribution des cibles / jeu) ; joueurs avec numéro, vies, statut « Killer », éliminés grisés ; dernier fait typé (« A. élimine B. »). Temps forts : `became_killer`, `life_lost`, `eliminated`, `match_won`.
- FR-04 **Gotcha** (`kind: 'gotcha'`) : cible (301 par défaut), score et distance de chaque joueur, classement, remises à zéro mises en évidence. Temps forts : `gotcha` (victimes), `bust`, `match_won`.
- FR-05 **Triathlon** (`kind: 'triathlon'`) : phase en cours, classement général, vue de la sous-épreuve (réutilise les projections Capital, Cricket, X01 en sous-vue), écrans de transition. Temps forts de la sous-épreuve + `stage_won`.
- FR-06 Chaque projection respecte la taille ≤ 12 288 octets (084) pour 6 joueurs aux noms de 32 caractères.
- FR-07 Dispositions adaptées au nombre de joueurs (jusqu'à 6 pour Killer et Gotcha).
- FR-08 La commande « Diffuser » est proposée pour un jeu seulement si sa projection est livrée.

## 11. Exigences non fonctionnelles

- NFR-01 Mêmes contraintes CSS, contrastes, mouvement et tailles que 086 (NFR-01 à NFR-05).
- NFR-02 L'information « fermé » ou « éliminé » n'est jamais portée par la seule couleur (barré, icône, texte).
- NFR-03 Projections pures, couvertes à 100 % des branches (spec 029).

## 12. Cas nominaux et alternatifs

Cricket 2 joueurs 20 tours ; Cricket doublette ; Capital 4 joueurs ; Killer 6 joueurs ; Gotcha 3 joueurs ; Triathlon complet avec barrage X01.

## 13. Cas limites

- Cricket : départage aux tours (dépend de 047) ; noms longs dans la grille.
- Killer : attribution des cibles en cours (aucun score), dernier survivant.
- Gotcha : plusieurs victimes sur une même volée.
- Triathlon : transition entre épreuves pendant une reconnexion (snapshot complet suffisant).

## 14. Gestion des erreurs

Projection en échec : diffusion suspendue pour ce jeu, indicateur « TV ! », saisie intacte. Vue `kind` inconnue côté écran : « Ce jeu n'est pas encore pris en charge par cet écran ».

## 15. Impacts architecturaux

Projections dans le module de chaque jeu (emplacement fixé par 058) ; écrans dans `src/tv/<jeu>/`. Aucune dépendance des écrans vers les règles.

## 16. Impacts sur les données et les interfaces

Extension additive du contrat 084 (nouveaux `kind`). Aucune donnée persistée nouvelle.

## 17. Compatibilité avec l'existant

Écrans de contrôle inchangés ; un écran TV d'ancienne version affiche le message de jeu non pris en charge.

## 18. Dépendances

- V2-ARCH-04 (058) : état sérialisable et reducer pur par jeu — **bloquant**.
- V2-TV-06 (086) : socle d'écran TV.
- Liens : 084 (contrat), 047 (V2-GAMES-04, fin Cricket), 048 (V2-GAMES-05, barème Triathlon), 010 (reprise multi-jeux), 090 (qualification).

## 19. Critères d'acceptation

- AC-01 Cricket : une cible fermée par tous apparaît grisée et barrée sur la TV en < 1 s (transport local).
- AC-02 Killer : un joueur éliminé est grisé avec la mention « Éliminé » ; aucun texte de `log` brut dans le JSON diffusé.
- AC-03 Capital : un échec affiche « ÷2 » et le nouveau score.
- AC-04 Gotcha : une remise à zéro de deux joueurs produit un temps fort listant deux victimes.
- AC-05 Triathlon : le passage de Capital à Cricket affiche l'écran de transition puis la grille.
- AC-06 Projections de 6 joueurs aux noms de 32 caractères ≤ 12 288 octets.
- AC-07 Annulation dans chaque jeu → badge « Correction », aucune animation.

## 20. Scénarios de tests

Unitaires des projections et temps forts sur fixtures issues des reducers de 058 ; composants TV par jeu ; captures de référence ; E2E local (085) pour chaque jeu.

## 21. Exigences de non-régression

Tests de règles existants (`tests/unit/cricketLogic.test.ts`, `capitalGameModel.test.ts`…) et golden tests de V2-QA-01 (039) ; écrans X01 TV inchangés.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| 058 retardée | Élevé | Moyenne | X01 seul diffusable entre-temps |
| Grille Cricket illisible à 6 joueurs | Moyen | Moyenne | Disposition dédiée, test terrain |
| Règles corrigées après coup (047, 048) | Moyen | Moyenne | Projections branchées sur les reducers, pas de logique dupliquée |

## 23. Décisions architecturales

ADR 0005 ; ADR proposé « L'état d'une partie n'appartient pas aux vues » (058).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Ordre de livraison | Suivre l'ordre de 058 / priorité Cricket | Suivre 058 (Gotcha → Killer → Capital → Cricket → Triathlon) | — |
| 2 | Triathlon : vue de sous-épreuve | Réutiliser les vues Capital/Cricket/X01 / vue dédiée | Réutiliser | — |
| 3 | Temps forts par jeu | Liste FR-01 à FR-05 / réduite | Liste proposée, à valider par le PO | — |

## 25. Traçabilité

Rapports : `07-tv-mode.md` §2.1, §6.3, P1 ; `02-architecture.md` §6.1, T1 ; `03-games.md` (règles) ; compte rendu C.5, C.6, F.5. Specs : 058, 086, 084, 047, 048, 010, 039, 090.
