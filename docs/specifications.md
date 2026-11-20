# Bougnat Darts Counter - Product And Technical Specifications

## 1. Product Scope

Bougnat Darts Counter est une application de scorage de flechettes orientee usage terrain.

Le produit est pense pour :

- les joueurs qui veulent une interface claire et rapide
- les scoreurs qui ont besoin d une saisie fiable sous pression
- les clubs ou structures qui cherchent une base de scorage serieuse et reusable

Le scope courant couvre :

- ecran d accueil
- demarrage rapide de partie
- configuration d arena
- matchs locaux multi-modes
- statistiques de fin de partie
- reprise locale de session
- historique local
- assistance vocale `X01`
- lien de match externe `X01` optionnel (`v2.0.0`, [spec 030](../specs/030-counter-external-match-link/spec.md))

Les fonctions sociales, cloud et backend metier sont hors perimetre de `v2.0`.
Elles ne font plus partie du runtime supporte de l application open source.

## 1.bis Specification Discipline

Le projet adopte une approche spec-driven.

Cela signifie que :

- le perimetre produit est formule explicitement avant les refactors importants
- les responsabilites de chaque partie du systeme sont documentees
- les changements de comportement attendus doivent etre lisibles dans la documentation avant ou en meme temps que le code
- les migrations architecturales se font par phases, avec livrables clairs

## 2. User Journeys

### Quick game

1. Arrivee sur l accueil
2. Choix d un mode de jeu
3. Configuration des joueurs et des regles
4. Lancement du match
5. Saisie des scores
6. Consultation des statistiques
7. Rematch ou retour au menu

### Scoreur en match

1. Ouvre une partie en quelques actions
2. Suit les scores et les manches
3. Saisit les visites ou les scores restants selon le contexte
4. Utilise les aides visuelles et les raccourcis
5. Termine la partie sans sortir du flux de jeu

### Joueur

1. Lit le score a distance
2. Suit les fermetures et la progression de manche
3. Consulte les statistiques finales

## 3. Supported Game Modes

- `X01`
- `501 Double Out`
- `Cricket`
- `Capital`
- `Killer`
- `Gotcha`
- `Triathlon`

## 4. Current Functional Rules

### X01

- bust rule
- open / double / master in
- open / double / master out
- format legs / sets
- mode doubles selon la configuration
- assistance vocale optionnelle
- calcul du score restant pendant la volee

Fonctionnement de l assistance vocale `X01` :

- capture micro navigateur
- transcription temps reel
- parsing darts / X01 dedie
- proposition de score dans la barre de scoring
- validation finale par l utilisateur via le flux de score existant

Contraintes volontaires :

- uniquement `X01`
- pas d auto-validation
- fallback manuel permanent
- interpretation bornee au vocabulaire darts / score restant / score du tour

### Rotation des joueurs X01 (simple et doubles)

Source unique : `src/application/scoring/x01Rotation.ts` (fonctions pures), appelée par `submitTurn` / `finishLeg` (`src/application/scoring/matchLifecycle.ts`) et par l'affichage du prochain lanceur de chaque équipe (`getDisplayedThrowerForTeam`, `src/features/x01/scoring/matchPreview.ts`).

Vocabulaire (à ne pas confondre) :

- **lanceur de départ de la manche** : `currentLeg.startingPlayerIndex` (index dans `players`) ; **équipe de départ** : son `teamId` ;
- **joueur actif** : `currentPlayerIndex` (index dans `players`) ;
- **finisseur** : auteur de la dernière volée de la manche (`history.at(-1)`), son équipe est le vainqueur (`winnerId`) ;
- **premier lanceur désigné d'une équipe** : `config.teamStarterIds[teamId]` (choisi au setup), à défaut le premier joueur de l'équipe dans `players` ;
- **ordre interne d'une équipe** : premier lanceur désigné puis son partenaire, figé pour tout le match ;
- **ordre global d'une manche** (2 contre 2) : `E1, R1, E2, R2` où `E` est l'équipe de départ de la manche et `R` l'autre équipe.

Règles (référence : règlement WDF, décision du product owner du 2026-11-20) :

1. Le lanceur (simple) ou l'équipe (doubles) qui commence le match est choisi avant la première fléchette (écran « Qui commence ? », `resolveMatchStart`). Ce choix n'est plus modifiable dès qu'une volée a été jouée ou qu'une manche est terminée.
2. Simple : les joueurs lancent à tour de rôle dans l'ordre de `players`. Dans un set (ou dans un match en manches), la manche suivante est ouverte par le joueur qui suit celui qui a **ouvert** la manche terminée (WDF § 9.03 / 12.02).
3. Doubles : chaque volée passe à l'autre équipe ; dans cette équipe lance le partenaire du dernier joueur de l'équipe ayant lancé dans la manche, ou son premier lanceur désigné si l'équipe n'a pas encore lancé dans la manche. Le calcul ne dépend que de l'historique de la manche en cours (une partie restaurée reprend exactement au bon joueur).
4. Doubles : dans un set (ou dans un match en manches), la manche suivante est ouverte par l'**autre équipe** que celle qui a **ouvert** la manche terminée, avec son premier lanceur désigné (WDF § 9.03). L'ordre interne de chaque équipe ne change jamais (WDF § 9.01) : J1 lance toujours avant J2, J3 toujours avant J4. Exemple (A = J1, J2 ; B = J3, J4 ; J1 et J3 premiers lanceurs) : manche 1 `J1, J3, J2, J4`, manche 2 `J3, J1, J4, J2`, manche 3 `J1, J3, J2, J4`…
5. Le finisseur, le vainqueur de la manche, un trop ou une volée à zéro n'ont **aucune** influence sur le lanceur suivant ni sur le départ de la manche suivante.
6. Sets (WDF § 12.02) : le camp (joueur en simple, équipe en doubles) qui a **ouvert le match** ouvre **chaque set impair** (1er, 3e, 5e…) ; l'autre camp ouvre les sets pairs. Le départ d'un set ne dépend ni du nombre de manches jouées dans le set précédent, ni de son vainqueur ; à l'intérieur du set, les manches alternent ensuite selon les règles 2 et 4. Exemple en doubles (A ouvre le match) : set 1 `A, B, A…`, set 2 `B, A, B…`, set 3 `A, B…`. Implémentation : `resolveSetOpeningStarterIndex`, appelée par `finishLeg` quand un set se termine.
7. `players` n'est réordonné qu'une fois, au choix du départ ; il reste stable ensuite (côtés des panneaux, `completedLegs[].startingPlayerIndex`, statistiques).
8. Une fin de manche ne modifie jamais l'état reçu (`legsWon` / `setsWon` copiés) : l'annulation d'une fin de manche restaure exactement l'état précédent.
9. Fin de match : aucune nouvelle manche n'est créée ; le joueur actif et `players` restent ceux de la dernière volée.

Parties sauvegardées : aucun champ n'a été ajouté. Une partie enregistrée par une version antérieure (ancien algorithme) termine sa manche en cours sans incohérence, car le lanceur suivant est recalculé à partir de l'historique, puis la manche suivante applique les règles ci-dessus. Sans `teamStarterIds`, chaque équipe commence par son premier joueur dans `players`.

Sources et arbitrages :

- WDF World Cup Format and Playing Rules, 28e édition (12 août 2025), § 9.01 « The order of throw shall remain unchanged during the entirety of these events » et § 9.03 « The player, pair or team that throws first in the first leg, will throw first in alternate legs thereafter » (texte lu) : alternance des équipes à chaque manche, ordre interne figé.
- WDF Playing and Tournament Rules, 20e édition (28 février 2018), § 12.02 (le gagnant du bull commence les manches impaires et, en sets, les sets impairs) et § 12.05 (ordre de passage affiché avant le match) (texte lu) : à l'origine de l'écart de la règle 6.
- Spec 050, X01-R12 et X01-R13 (« doublettes : équipe suivante, avec son premier lanceur » ; « rotation A1-B1-A2-B2 ») : la règle est conforme ; avant la correction, le code ne l'était pas pour l'équipe ayant commencé le match (manches paires `B1, A2, B2, A1`).
- Décision du product owner (2026-11-20) : **le règlement WDF est à suivre.** Conséquences :
  - ordre interne de chaque équipe figé (§ 9.01) : chaque équipe lance toujours son premier lanceur désigné puis son partenaire, dans chaque manche ;
  - alternance stricte de l'équipe (ou du joueur) qui ouvre chaque manche (§ 9.03) : ni le finisseur ni le vainqueur n'interviennent ;
  - au changement de set, le camp qui a ouvert le match ouvre les sets impairs, l'autre camp les sets pairs (§ 12.02) — ce point remplace l'ancienne règle maison « alternance continue entre les sets ».
- Le « gagnant du bull » de la WDF correspond, dans Bougnat Darts, au joueur ou à l'équipe choisi sur l'écran « Qui commence ? » (pas de tirage au bull intégré en X01 ; le Triathlon a son propre tirage).
- L'écran « Qui commence ? » n'est plus proposé dès qu'une manche a été jouée, y compris pour une partie restaurée sans instantané d'exécution (`hasMatchProgress`, `views/MatchView.tsx`).

Anomalie corrigée (novembre 2026) : la manche suivante conservait l'ordre cyclique des quatre joueurs et ne déplaçait que l'index de départ, ce qui inversait l'ordre interne de l'équipe ayant commencé le match (`J3, J2, J4, J1` au lieu de `J3, J1, J4, J2`) ; l'annulation d'une fin de manche conservait la manche gagnée, car `finishLeg` modifiait `legsWon` / `setsWon` de l'état précédent.

Tests de référence : `tests/unit/x01/doublesRotation.test.ts` (matrice des 16 cas lanceur × finisseur, multi-manches, multi-sets selon WDF § 12.02 en simple et en doubles, trops, modes de sortie, annulation, reprise, fin de match, non-régression simple/robot/Triathlon), `tests/unit/application/x01Rotation.test.ts`, `tests/unit/x01/matchViewDoublesRotation.test.tsx` (parcours `MatchView` : annulation d'une fin de manche et rafraîchissement).

### Cricket

- fermeture progressive des segments
- score en surplus sur segments fermes
- statistiques specifiques de fin de partie

Fin de partie (spec 047, V2-GAMES-04) :

1. Victoire : un joueur (ou une équipe) a fermé les sept cibles et a un score supérieur ou égal à celui de chaque adversaire ; contrôle après chaque fléchette (`checkCricketWin`).
2. Limite de tours (10, 20 ou 30, réglée à la configuration) atteinte par tous : classement par score, puis par nombre de numéros fermés, puis par nombre de marques plafonnées à 3 par cible (`compareCricketStandings`, `utils/cricketLogic.ts`). Ces deux critères après le score sont une **variante maison** : les règles officielles françaises (machine, 20 tours) font rejouer la manche en cas d'égalité.
3. Égalité parfaite après ces critères : l'**égalité est déclarée** (`resolveCricketWinnerOnRounds` renvoie `null`, `CricketMatchSummary.winnerId` vaut `null`, `legsWon` est vide). L'ancien départage par ordre alphabétique des noms est supprimé. Tour supplémentaire décisif et manche rejouée relèvent des variantes (spec 051).
4. La fléchette gagnante (ou la dernière fléchette du dernier tour) fige la partie et affiche l'écran de fin : vainqueur et « Match remporté », ou « Égalité » et « Limite de tours atteinte », avec le score final de chacun. Le chronomètre s'arrête.
5. « Annuler la dernière fléchette » revient au tableau avec les marques, le score, le lanceur et la fléchette du tour restaurés ; le chronomètre reprend.
6. Le résultat n'est transmis (historique local, écran de statistiques, épreuve suivante du Triathlon) qu'au clic sur l'action de validation, une seule fois même en cas de double clic : « Voir les statistiques » en partie simple, « Épreuve suivante » dans le Triathlon.
7. Écran de statistiques : le vainqueur est classé premier ; les autres suivent selon les critères de la règle 2, avec des rangs ex æquo (1, 1, 3…) ; en cas d'égalité déclarée, le titre affiche « Égalité : » suivi des joueurs à égalité.
8. Triathlon : le barème de l'épreuve Cricket classe les compétiteurs par score et ignore `winnerId` ; une égalité déclarée n'a donc pas d'effet propre sur les points d'épreuve.
9. Limite connue : la partie Cricket en cours n'est pas persistée ; un rechargement pendant l'écran de fin perd la partie (spec 010).

### Capital

- enchainement des cibles et progression par objectif
- historique des rounds
- statistiques de reussite et de regularite
- `3 a cotes` est reussi avec trois secteurs numeriques distincts et consecutifs sur la roue, ou avec une bulle simple `25` et exactement deux secteurs numeriques distincts adjacents entre eux
- une D-Bulle `50` sans bulle simple ne valide pas `3 a cotes`; les misses et les valeurs hors board ne peuvent pas constituer une adjacence
- `Moins de 21` exige trois flechettes non miss et un total strictement inferieur a 21

### Triathlon

- enchaînement multi-épreuves
- agrégat final des performances
- écran de résultat dédié

## 5. Frontend Structure

Principales zones frontend :

- `views/` : ecrans applicatifs
- `components/` : UI partagee et blocs metier
- `src/app/` : garde-fous d’environnement, session locale et cycle de vie des jeux
  - `appShell.ts` : session persistence, screen guards
  - `useAppScreenHistory.ts` : historique des écrans pour le bouton retour
  - `useGameLifecycle.ts` : handlers de fin de partie, rematch et sortie de jeu [v1.1]
- `src/application/` : use cases et ports
- `src/infrastructure/` : persistence locale et adapters
- `src/features/game-setup/` : reducer de configuration, factories joueurs/config
  - `setupModel.ts` : reducer, état, factories
  - `setupPresentation.ts` : labels, descriptions de règles, noms de jeux [v1.1]
- `src/features/x01/voice/` : moteur vocal `X01`
- `src/features/x01/hooks/` : hooks métier extraits des vues [v1.1]
  - `useMatchTimer.ts` : chronomètre et horloge
  - `useMatchShortcuts.ts` : raccourcis score personnalisables (colonnes laterales sur tablette/PC, barre de 6 scores masquable sur telephone [v2.0])
- `src/features/smartphone/` : adaptation telephone (hauteur du viewport, verrouillage portrait et ecran « Tourne ton telephone » [v2.0])
- `src/lib/` : utilitaires application
  - `env.ts` : variables d’environnement typées
- `src/shared/` : types et utilitaires transverses

## 5.ter Traceabilite v2.0

Specification ajoutee :

- `spec:counter/external-match-link` ([spec 030](../specs/030-counter-external-match-link/spec.md))

Points d entree :

- `src/features/external-match/externalMatchLink.ts`
- `src/features/external-match/externalMatchStartup.ts`
- `src/features/external-match/externalMatchAddressBar.ts`
- `components/external-match/ExternalMatchDialogs.tsx`
- `components/game-setup/SetupExternalMatchBanner.tsx`
- `src/presentation/externalMatch/externalMatchLabels.fr.ts`
- `scripts/lib/externalReturnOrigins.mjs`
- `docs/integration/external-match-link.md` et `docs/integration/partner-simulator/index.html`

Release : [notes v2.0.0](release/v2.0.0.md), [coverage map v2.0.0](release/v2.0.0-coverage-map.md).

## 5.bis Traceabilite v1.1.x

Specifications locales actives :

- `spec:counter/scoring-access-modes`
- `spec:counter/offline-scoring-terminal-foundation`
- `spec:counter/voice-scoring-reliability`
- `spec:counter/voice-token-provisioning-hardening`
- `spec:counter/release-governance-v1.0.x`
- `spec:counter/score-layout-font-scale-resilience`
- `spec:counter/inp-phase1-quick-wins`
- `spec:counter/gotcha-game`
- `spec:counter/killer-game`
- `spec:counter/arch-single-responsibility-split`
- `spec:counter/x01-double-out-checkout-rate`
- `spec:counter/react-19-migration`
- `spec:counter/release-v1.1-stabilization`

Points d entree canoniques :

- `src/app/appShell.ts`
- `src/app/useGameLifecycle.ts` [v1.0.2]
- `src/application/scoring/*`
- `src/features/game-setup/setupModel.ts`
- `src/features/game-setup/setupPresentation.ts` [v1.1]
- `src/features/x01/hooks/useMatchTimer.ts` [v1.1]
- `src/features/x01/hooks/useMatchShortcuts.ts` [v1.1]
- `src/features/x01/voice/voiceSessionModel.ts` [v1.1]
- `src/features/x01/voice/voiceProposalModel.ts` [v1.1]
- `src/domain/triathlon/triathlonScoringRules.ts` [v1.1]
- `src/features/capital/capitalGameModel.ts` [v1.1]
- `src/features/cricket/cricketGameModel.ts` [v1.1]
- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/features/x01/voice/*`
- `App.tsx`
- `views/HomeView.tsx`
- `views/MatchView.tsx`

Jeux de tests clefs :

- `tests/unit/app/appShell.test.ts`
- `tests/unit/application/matchLifecycle.test.ts`
- `tests/unit/application/matchStats.test.ts`
- `tests/unit/application/indexedDbSessionRepository.test.ts`
- `tests/unit/dartsSpeechParser.test.ts`
- `tests/unit/x01/matchScoring.test.ts`
- `tests/unit/x01/voiceSessionModel.test.ts`
- `tests/unit/x01/voiceProposalModel.test.ts`
- `tests/unit/gameSetup/setupViewModel.test.ts`
- `tests/unit/capitalGameModel.test.ts`
- `tests/unit/cricketGameModel.test.ts`
- `tests/e2e/app.smoke.spec.ts`
- `tests/e2e/gameplay-entry.smoke.spec.ts`

## 6. Main Data Model

Les objets metier majeurs du coeur de scorage sont :

- `Game`
- `Leg`
- `Turn`
- `Throw`
- `Score`
- `ScoreInput`
- `Checkout`

Les objets applicatifs utiles au produit incluent aussi :

- session locale de jeu
- snapshot de match en cours
- historique local de parties
- etats de statistiques

## 7. Local Persistence Purpose

La persistence locale doit permettre :

- reprise d une partie apres reload
- restauration de l etat de jeu
- historique recent sur le device
- resilience offline

## 8. Architecture Direction

Le projet evolue vers une architecture :

- clean
- testable
- offline-first
- decouplee du backend

Principes :

- le domaine de scorage ne depend pas de React
- les use cases orchestrent la logique de partie
- la persistence locale est geree en infrastructure
- les integrations distantes futures passent par des ports explicites
- chaque fichier cible une responsabilite metier identifiable (principe Single Responsibility)
- les helpers de presentation (labels, descriptions) ne vivent pas dans les reducers d etat
- les handlers de lifecycle ne vivent pas dans le composant racine
- les effects secondaires isolables (timer, listeners) sortent dans des hooks dedies

Fichiers cibles du prochain cycle de decoupe :

- `views/SetupView.tsx` : extractions UI additionnelles uniquement si le flux setup regrossit
- `src/features/x01/voice/useDeepgramStreaming.ts` : callbacks supplementaires seulement si le protocole voix s'elargit
- `views/CapitalGameView.tsx` : rendu winner/stats si une nouvelle variante le justifie
- `views/CricketGameView.tsx` : hook d orchestration de tour si le flux cricket s enrichit encore

## 9. Environment Model

### Local development

- application lancee avec Vite
- variables locales dans `.env.local`
- persistence locale sur le device

### Voice support

- option activee par configuration
- cle privee conservee hors frontend
- experience de scoring manuel toujours disponible

## 10. Voice Architecture

Le scoring vocal `X01` repose sur quatre couches :

- capture audio navigateur
- client de transcription temps reel
- parser darts / X01 contextualise
- integration UI dans `MatchView`

Principes :

- la cle privee reste hors frontend
- seul le resultat confirme est soumis comme score
- la logique metier darts reste separee des composants React
