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

### Règles de sortie X01 (spec 045, issue #204)

Source unique : `src/domain/scoring/x01CheckoutRules.ts` (fonctions pures, tables calculées au chargement à partir des segments de la cible, aucune liste de « bogeys » saisie à la main). Consommateurs : moteur (`submitTurn`), soumission (`matchSubmission.ts`), aperçu du reste, bouton RESTE et appui long (`views/MatchView.tsx`), robot (`x01BotTurn.ts`), statistiques (`getMinDartsForScore`, opportunités de sortie), aide de sortie (`CheckoutHint`), domaine de test (`ScoringRules`, `ScoreValidator`).

Règles appliquées :

1. Fléchette finale autorisée : Open = n’importe quelle fléchette ; Double-Out = un double ou le double bull (50) ; Master-Out = un double, un triple ou le double bull. **Le simple bull (25) ne termine pas en Master-Out** (décision Q1 a).
2. Un reste est finissable s’il peut être ramené à 0 en une visite de 3 fléchettes avec une fléchette finale autorisée. Calcul exhaustif : non finissables en Double-Out 1, 159, 162, 163, 165, 166, 168, 169 et > 170 ; en Master-Out 1, 163, 166, 169, 172, 173, 175, 176, 178, 179 ; en Open 163, 166, 169, 172, 173, 175, 176, 178, 179 (totaux de visite eux-mêmes impossibles).
3. Trop (visite enregistrée à 0, reste de début de visite conservé) : reste négatif ; reste de 1 en Double-Out **et** en Master-Out ; total égal au reste mais reste non finissable selon la règle. En Double-Out, les seuls totaux de visite valides concernés sont 159, 162, 165, 168, 171, 174, 177 et 180 (liste vérifiée par calcul exhaustif dans les tests).
4. Sortie impossible : trop direct, sans confirmation, avec le retour « SORTIE IMPOSSIBLE » (distinct de « SCORE IMPOSSIBLE », total irréalisable en 3 fléchettes) ; « Retour ↶ » annule la visite (décision Q2 a). L’aperçu du reste ne s’affiche pas pour une saisie qui serait un trop.
5. Bouton RESTE : un reste visé de 1 est refusé (« SCORE RESTANT IMPOSSIBLE ») en Double-Out et en Master-Out. Appui long 1/2/3 et confirmation « Fléchettes utilisées » : seulement si le reste est finissable, avec le nombre minimal **exact** de fléchettes pour la règle active (ex. 170 en Double-Out : 3 seulement ; 25 en Master-Out : 2).
6. Robot : il ne tente une sortie que sur un reste finissable, annonce le nombre minimal de fléchettes et, en placement, ne laisse jamais 1 en Double-Out ni en Master-Out (une manche Master-Out se termine toujours).
7. Aide de sortie (« Sortie conseillée », désactivée par défaut — décision Q5 a) : en Double-Out, table `CHECKOUT_GUIDE` ; en Master-Out et en Open, route la plus courte calculée (ex. Master 180 : « T20 T20 T20 » ; Master 25 : « 9 D8 ») ; rien sur un reste non finissable (décision Q3 a).
8. Partie restaurée (décision Q4 a) : à la lecture de la session (`getRestoredAppSession` / `getRestoredAppSessionAsync`, `src/app/appShell.ts`), une équipe bloquée à 1 en Master-Out par une version antérieure voit la visite qui a laissé 1 convertie en trop (`normalizeRestoredX01Match`, fonction pure) ; aucun champ n’est ajouté.
9. Triathlon : le 501 (Double-Out) utilise le même moteur et hérite de ces règles sans configuration particulière. Le contrat de lien partenaire `v=1` est inchangé : seuls des résultats conformes peuvent être renvoyés.

Sources : Wikipedia EN « Darts » (§ Bust) et Wikipedia DE « Darts » (Double Out, Master Out = Double Out + Triple, bogeys), spec 050 (X01-R05 à X01-R09, X01-R14 à X01-R17). Les statistiques de l’historique local ne sont pas recalculées.

Tests de référence : `tests/unit/x01/checkoutBruteForce.ts` (référence indépendante par énumération des fléchettes), `tests/unit/x01/matchScoring.test.ts`, `tests/unit/application/matchLifecycle.test.ts`, `tests/unit/application/matchStats.test.ts`, `tests/unit/x01/x01BotTurn.test.ts` (10 000 tirages à graine fixe × 5 niveaux en Master-Out), `tests/unit/x01/matchViewCheckoutRules.test.tsx`, `tests/unit/components/matchPresentation.test.tsx`, `tests/unit/app/restoredX01Session.test.ts`.

### Ouverture Double-In / Master-In (spec 046, issue #213)

Option retenue : **B, attestation d’ouverture** (décision Q1). La saisie reste un total de visite ; aucun champ n’est persisté.

Source unique : `src/domain/scoring/x01OpeningRules.ts` (`isOpeningTotalPossible`, `isX01TeamOpened`), appelée par la soumission (`buildScoreSubmissionResult`, `src/features/x01/scoring/matchSubmission.ts`), la vue (`views/MatchView.tsx`) et le bandeau joueur (`buildPlayerScoreViewModel`).

Règles appliquées :

1. Double-In : les points ne comptent qu’à partir de la première fléchette dans un double (double bull compris), fléchette incluse ; Master-In : un double, un triple ou le double bull (décision Q5 a : convention symétrique du Master-Out, sans source officielle publique). Open : le score commence immédiatement (comportement inchangé, cas par défaut et cas des partenaires actuels).
2. L’état « ouvert » est **dérivé** de l’historique de la manche en cours : une équipe est ouverte dès qu’elle a une visite non « trop » de score positif. Chaque nouvelle manche demande une nouvelle ouverture ; annuler la visite d’ouverture referme l’équipe ; une partie restaurée applique la règle à partir de son historique.
3. Tant que l’équipe n’est pas ouverte, le joueur saisit les points comptés **à partir de la fléchette d’ouverture incluse** (0 s’il n’a pas ouvert). Le premier total non nul déclenche une confirmation unique : « Ouverture réussie sur un double : 60 points comptés ? » (« sur un double ou un triple » en Master-In). « Oui » enregistre le total, « Non » enregistre une visite à 0 ; « Retour ↶ » ferme la question sans rien enregistrer.
4. Un total d’ouverture impossible est refusé sans enregistrer la visite (« OUVERTURE IMPOSSIBLE ») : en Double-In 1, 159, 162, 163, 165, 166, 168, 169 et > 170 ; en Master-In 1, 163, 166, 169, 172, 173, 175, 176, 178, 179. Les fléchettes d’une visite s’additionnant dans n’importe quel ordre, ces ensembles sont exactement ceux des sorties de même règle (vérifié par énumération indépendante dans les tests).
5. Une visite qui ouvrirait mais dépasse le reste (ou laisse 1, ou finit sur un total non finissable) est un trop enregistré sans confirmation : l’équipe reste fermée. Ouverture et sortie dans la même visite (score de départ ≤ 170) : la confirmation d’ouverture est suivie de la confirmation « Fléchettes utilisées » (règles de sortie de la spec 045).
6. Le bouton RESTE est refusé tant que l’équipe n’est pas ouverte (« OUVERTURE REQUISE ») ; l’appui long de sortie directe est désactivé avant l’ouverture.
7. Bandeau joueur : « Ouverture : double requis » (ou « double ou triple requis ») tant que l’équipe n’a pas ouvert dans la manche.
8. Voix : la proposition vocale remplit la saisie puis passe par la même soumission que le clavier ; elle déclenche donc la même confirmation d’ouverture.
9. Doublettes : l’ouverture est **par équipe**. Le score étant commun à l’équipe, dès qu’un équipier a ouvert, les visites de son partenaire comptent normalement (Wikipedia EN « Darts » : en équipes « the rules remain the same », score commun). Aucune source officielle consultée ne traite explicitement l’ouverture en doublettes ; les variantes locales « chaque joueur doit ouvrir » ne sont pas prises en charge.
10. Robot (décision Q4 a) : indisponible avec une ouverture Double ou Master. Au setup, la case « Jouer contre un robot » est désactivée avec un message explicatif, et choisir une ouverture Double/Master retire le robot.
11. Lien partenaire `v=1` : contrat inchangé ; `in=double` et `in=master` sont désormais appliqués au match joué (les matchs liés n’ont pas de robot). Le Triathlon reste en ouverture Open.

Compatibilité : un match en cours restauré avec une ouverture Double/Master voit la règle s’appliquer aux visites suivantes ; les visites passées ne sont pas recalculées.

Sources : Wikipedia EN « Darts » (« doubling in », le bull intérieur compte comme un double), Wikipedia DE « Darts » (Double In : le double d’ouverture est compté), spec 050 (X01-R10).

Tests de référence : `tests/unit/x01/matchScoring.test.ts` (ouverture, refus, une confirmation par équipe et par manche, annulation, nouvelle manche, trop, doublettes, Open inchangé), `tests/unit/x01/scoringDomain.test.ts` (totaux d’ouverture par énumération indépendante, état dérivé), `tests/unit/x01/matchViewOpening.test.tsx` (dialogue, RESTE, bandeau, voix), `tests/unit/gameSetup/setupModel.test.ts`, `tests/unit/components/setupPlayers.test.tsx` (robot bloqué).

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
8. Triathlon : le barème v2 de l'épreuve Cricket s'appuie sur le vainqueur réel (`winnerId`) : vainqueur 20 pts, perdant 14 pts, et 17 pts chacun en cas d'égalité déclarée (voir la section Triathlon).
9. Reprise : la partie Cricket en cours (écran de fin compris) est persistée et reprise après rechargement, pile d'annulation incluse (voir §7, spec 010).

### Capital

- enchainement des cibles et progression par objectif
- historique des rounds
- statistiques de reussite et de regularite
- `3 a cotes` est reussi avec trois secteurs numeriques distincts et consecutifs sur la roue, ou avec une bulle simple `25` et exactement deux secteurs numeriques distincts adjacents entre eux
- une D-Bulle `50` sans bulle simple ne valide pas `3 a cotes`; les misses et les valeurs hors board ne peuvent pas constituer une adjacence
- `Moins de 21` exige trois flechettes non miss et un total strictement inferieur a 21
- objectif `Capital` : le total saisi doit être réalisable en 3 fléchettes (0 à 180 hors 163, 166, 169, 172, 173, 175, 176, 178 et 179) ; « OK » sur un total irréalisable affiche « SCORE IMPOSSIBLE » et laisse la saisie modifiable, le modèle (`src/features/capital/capitalGameModel.ts`) refuse aussi ce total
- couleurs des multiplicateurs, identiques dans tous les modes du keypad et alignées sur le Cricket (convention provisoire, `components/game/multiplierStyles.ts`) : simple neutre, double cyan, triple orange, bulle verte, double bulle rouge

Anomalie corrigée (novembre 2026, spec 054) : l'objectif `Capital` acceptait tout total de 0 à 180, dont 179 ; les doubles étaient verts et les triples rouges en mode cible complète, alors que l'objectif numéroté les affichait en cyan et orange.

### Gotcha

- total de visite saisi au clavier, de 0 à 180, et réalisable en 3 fléchettes : les totaux 163, 166, 169, 172, 173, 175, 176, 178 et 179 sont refusés par `recordGotchaTurn` (journal « Visite refusée : score impossible en 3 fléchettes. », score et joueur courant inchangés), y compris s'ils atteignent exactement la cible
- dès la frappe d'un total irréalisable, l'aperçu affiche « Score impossible » et le bouton « Valider » est inactif ; « C » efface la saisie

Règle partagée : `isReachableTotal(total, nombreDeFléchettes)` (`src/domain/scoring/reachableTotals.ts`) est l'unique calcul des totaux réalisables du domaine, utilisé par Gotcha, Capital et `ScoreInput` ; le X01 exécuté utilise encore `src/features/x01/scoring/possibleTurnScores.ts`, dont l'unification relève de la spec 057.

Tests de référence : `tests/unit/reachableTotals.test.ts`, `tests/unit/gotchaLogic.test.ts`, `tests/unit/capitalGameModel.test.ts`, `tests/unit/components/capitalKeypad.test.tsx`, `tests/unit/components/gotchaGameView.test.tsx`.

### Triathlon

- enchaînement multi-épreuves
- agrégat final des performances
- écran de résultat dédié

#### Barème v2 (spec 048, issue #246)

Source unique : `src/domain/triathlon/triathlonScoringRules.ts` (`TRIATHLON_SCORING_RULES`, `version: 2`) ; calcul pur dans `utils/triathlonScoring.ts`. Score sur 100 : 501 sur 34, Cricket sur 33, Capital sur 33.

| Épreuve | Points de résultat | Bonus |
|---|---|---|
| 501 (Double-Out, 1 manche) | victoire 20 ; défaite en position de sortie 14 ; autre défaite 10 | meilleure moyenne des 9 premières fléchettes +4 ; meilleure moyenne +5 ; plus de visites à 100 ou plus (hors trop) +5 |
| Cricket | vainqueur réel (`winnerId`) 20 ; perdant 14 ; égalité déclarée (`winnerId: null` ou inconnu) 17 chacun | meilleur MPR +5 ; fermeture complète des 7 cibles +4 ; plus de numéros fermés +4 |
| Capital | rang dense sur le score : 20 / 16 (12 / 8 au-delà), mêmes points à égalité | meilleur challenge (plus de points marqués sur un challenge réussi ; en doublettes, meilleur des deux équipiers) +5 ; régularité (plus de challenges réussis) +4 ; peu de pénalités (moins de challenges ratés) +4 |

Règles appliquées :

- **Position de sortie** : à la fin du 501, le reste du perdant est finissable en une seule visite selon la règle de sortie du match (`isCheckoutPossible`, `src/features/x01/scoring/checkoutEligibility.ts`). Pour le 501 Double-Out du Triathlon : reste de 2 à 170, sauf 159, 162, 163, 165, 166, 168 et 169 (bogeys). Un reste de 1 est impossible en Double-Out (trop).
- **Vainqueur 501** : seul `matchWinnerId` donne les 20 points ; sans vainqueur, aucun compétiteur ne les reçoit (plus de vainqueur par défaut).
- **Bonus (RM-02)** : attribué au(x) meilleur(s) seulement si la meilleure valeur est strictement meilleure que celle d'au moins un autre compétiteur, et (bonus « plus grand ») strictement positive. Valeurs toutes égales → personne ne reçoit le bonus.
- Aucun critère ne dépend de l'ordre de jeu : le bonus « Moins de fléchettes » v1, qui revenait au perdant quand le vainqueur avait commencé, est remplacé par les visites à 100 ou plus.
- **Version** : `finalizeTriathlonResults` enregistre `scoringVersion: 2` dans le résultat (donc dans `payload.results` de l'historique local). Un résultat sans version est un résultat v1, affiché tel quel (non recalculé) avec la mention « Barème v1 » et un avertissement de non-comparabilité ; l'écran de statistiques affiche « Barème v2 ».
- Un Triathlon en cours est repris après rechargement (§7), mais son tableau des points est toujours recalculé depuis les épreuves terminées avec le barème courant : une reprise ne mélange jamais deux barèmes (Q3 a).
- Le détail du barème est affiché dans les règles du setup (`src/features/game-setup/setupPresentation.ts`, généré depuis la table de règles).
- Golden tests : `tests/unit/triathlonScoringGolden.test.ts` (valeurs v1 « avant » en commentaire, v2 « après » en assertion).

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

### Reprise de session (spec 010, V2-ARCH-06)

Ce qui est réellement implémenté :

- **Jeux repris** : X01, Cricket, Capital, Killer, Gotcha et Triathlon (y compris l'épreuve embarquée en cours : Capital, Cricket, 501 ou départage). Après rechargement, fermeture d'onglet ou mise en veille, la partie reprend automatiquement (sans étape ajoutée, décision Q3) avec scores, joueur courant, fléchettes du tour, phase et pile d'annulation. Une partie Killer ou Gotcha terminée reprend sur l'écran du vainqueur sans renvoyer son résultat.
- **Instantané par jeu** : chaque vue publie après chaque action validée un instantané JSON (`MatchRuntimeSnapshot` pour X01, `GameRuntimeSnapshot` `{ gameType, state, timing }` pour les autres, `src/shared/session/persistedAppSession.ts`). Cricket est piloté par un état unique et un reducer pur (`cricketGameReducer`, `src/features/cricket/cricketGameModel.ts`) ; Capital et Triathlon gardent leurs reducers ; Killer et Gotcha gardent les transitions pures du domaine.
- **Pile d'annulation** : les 50 dernières étapes sont persistées (`PERSISTED_UNDO_LIMIT`) ; la profondeur en mémoire est inchangée (illimitée X01, Cricket et Capital ; 20 Killer ; 30 Gotcha). Après une reprise, on peut donc annuler au plus 50 actions.
- **Enveloppe versionnée** : la session porte `schemaVersion` (2) et `savedAt`, estampillés à chaque écriture. Le format sans version (1) est migré : une partie X01 en cours est reprise ; un autre jeu en cours (qui n'était pas sauvegardé) est écarté avec message (décision Q1).
- **Validation** : la session est validée à la main avant usage (`src/app/sessionRecovery.ts`, `src/features/game-session/gameRuntime.ts`, `src/features/x01/session/x01RuntimeValidation.ts`) : écran connu, type de jeu, structure, bornes d'index, joueurs uniques, cohérence de l'instantané avec le jeu sélectionné. JSON illisible, champ invalide, version inconnue ou future : la donnée est supprimée, l'application démarre à l'accueil et affiche « La partie précédente n’a pas pu être reprise. » (message non bloquant). Un écran de statistiques sans données renvoie à la sélection des jeux.
- **Durée de validité** : une session de plus de 7 jours est purgée au démarrage, sans message (décision Q6).
- **Écritures** : la session est écrite sur changement métier (action validée, changement d'écran, fin de partie), avec l'anti-rebond de 300 ms, et immédiatement au passage en arrière-plan (`pagehide`, `visibilitychange`). Le chronomètre n'en déclenche aucune : il est persisté comme « secondes écoulées mesurées à un instant » et reprend jusqu'à la dernière écriture ; le temps passé application fermée n'est pas compté (décision Q4).
- **Stockage** : IndexedDB (`bougnat-counter-local`, version 2) et repli `localStorage` conservé pour la restauration synchrone au premier rendu (décision Q7). `current_matches` et `bougnat-current-match-v1` ne contiennent plus que la partie X01 en cours ; ils sont vidés en fin de partie, à l'abandon et pour les autres jeux ; les entrées orphelines sont purgées à la mise à niveau de la base.
- **Échec d'écriture** : si la session ne peut être écrite ni dans `localStorage` ni dans IndexedDB, un message non bloquant s'affiche une fois (« Sauvegarde locale impossible… ») et la partie continue. Si seul `localStorage` échoue, sa copie périmée est supprimée pour que la reprise lise IndexedDB.
- **Lien partenaire** (spec 030) : le contexte externe est conservé tel quel dans la session et revalidé à la lecture comme avant (durée de vie de 12 h inchangée).

Limites connues :

- **Plusieurs onglets** : aucun verrou ; le dernier onglet qui écrit gagne (décision Q5 non implémentée, question ouverte).
- Le `MatchState` X01 « porteur » des joueurs et de la configuration est encore persisté pour tous les jeux (`currentMatch`) ; son remplacement par un `GameSetup` relève de la spec 058.
- Aucun test E2E de rechargement par jeu (spec 040) : la reprise est couverte par des tests unitaires et de composants (`tests/unit/session/`).

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
