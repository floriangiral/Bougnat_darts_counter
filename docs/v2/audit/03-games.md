> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 03 — Revue fonctionnelle et métier de chaque jeu (chantier 5.5)

Agent : « Analyse fonctionnelle et métier des fléchettes » — préparation V2 Bougnat Darts
Date : 2026-11-20 — Repository analysé en lecture seule : `Bougnat_darts_counter` (branche `feat/v2.0.0`, HEAD `508dfa6`).

Légende des niveaux de preuve :
- **[VÉRIFIÉ code]** : constaté dans le code (chemin:ligne).
- **[VÉRIFIÉ exécution]** : reproduit en exécutant le code du repo via `esbuild` → `node` en mémoire (aucun fichier écrit dans le repo, script passé par stdin).
- **[VÉRIFIÉ source externe + URL]** : règle confirmée par une source publique.
- **[HYPOTHÈSE]** / **[À CONFIRMER]** : non vérifié, à valider.

Gravité : **G1 bloquant/règle fausse**, **G2 majeur (perte de données, incohérence forte)**, **G3 modéré (UX/texte)**, **G4 mineur**.

---

## 0. Synthèse exécutive

Bougnat Darts propose **6 jeux** (X01, Cricket, Capital, Triathlon, Killer, Gotcha). Le X01 est nettement le plus abouti (moteur sérialisé, reprise après rechargement, robot, voix, statistiques détaillées, lien de match externe). Les 5 autres jeux sont fonctionnels mais **hétérogènes** : chacun a son propre écran de jeu, son propre keypad, sa propre fin de partie et son propre modèle d'état, souvent enfermé dans des `useState` React.

Constats majeurs :
1. **Règles X01 non conformes** : l'option **Double In / Master In est configurable mais n'est appliquée nulle part** ; en **Double Out**, un joueur à 180, 168, 165, 162 ou 159 peut « finir » (checkout impossible accepté) ; en **Master Out**, un reste de 1 n'est pas un bust et le **robot peut rester bloqué à 1** (191 cas sur 200 simulations à 4 points restants). [VÉRIFIÉ exécution]
2. **Perte silencieuse de partie au rechargement pour Cricket, Capital, Killer, Gotcha et Triathlon** : seul le X01 persiste son état en cours. Contradiction avec la spec 010 (« pas de perte silencieuse d'état critique ») et le README (« Une pause n'efface pas la partie »). [VÉRIFIÉ code]
3. **Cricket : l'écran de victoire (avec bouton « Retour » pour annuler la fléchette gagnante) est inatteignable** : `onFinish` est appelé dans le même tick que `setWinnerId`, l'application bascule immédiatement sur les statistiques. [VÉRIFIÉ code]
4. **Barème Triathlon biaisé** : en 501 à 2 compétiteurs, le critère « défaite serrée » (écart ≤ 3 fléchettes) est **toujours vrai** → le perdant reçoit 14 pts même à 461 restants contre un 9-darter ; au Cricket, le classement ignore le vainqueur réel (deux joueurs à 0 point reçoivent tous deux 20 pts). [VÉRIFIÉ exécution]
5. **Incohérences ergonomiques fortes** entre jeux : quitter sans confirmation (Killer, Gotcha), pas de revanche ni de statistiques (Killer, Gotcha), « C » signifie « effacer » en X01/Gotcha mais « annuler la fléchette » au Cricket, libellés anglais résiduels, choix du premier joueur absent pour Killer/Gotcha, fins de partie toutes différentes.
6. **Le scoring vocal n'existe que pour le X01** (et le 501 du Triathlon), alors que le parseur sait déjà reconnaître des fléchettes unitaires (« triple vingt ») réutilisables pour Cricket/Capital/Killer.
7. **Thème** : ~1 100 classes de couleur Tailwind codées en dur dans les écrans de jeu, aucun token sémantique → mode Light et personnalisation impossibles sans reprise systématique.

Recommandation principale : un **lot P0 « conformité et fiabilité des jeux »** (règles X01, Double-In, reprise de tous les jeux, fin de partie Cricket, barème Triathlon) puis un **socle commun de partie** (contrat d'état sérialisable par jeu + composants `GameTopBar`, `GameEndScreen`, `ExitConfirm`, sémantique d'annulation unique) qui sert à la fois la reprise, le futur mode TV, le vocal multi-jeux et le design system — sans backend ni dépendance nouvelle.

---

## 1. Périmètre et fichiers analysés

### 1.1 Code
- Inventaire / sélection / setup : `types.ts`, `constants.ts` (`CHECKOUT_GUIDE`), `utils/arenaFlow.ts`, `views/GameSelectionView.tsx`, `views/SetupView.tsx`, `src/features/game-setup/{setupModel,setupPresentation,setupViewModel}.ts`, `components/game-setup/*` (dont `SetupRulesModal.tsx`, `SetupPlayersSection.tsx`, `SetupMatchSection.tsx`, `SetupX01RulesSection.tsx`, `SetupTargetScoreSection.tsx`).
- Cycle de vie / persistance : `App.tsx`, `src/app/{appShell,useGameLifecycle}.ts`, `src/shared/session/persistedAppSession.ts`.
- X01 : `src/domain/scoring/**`, `src/application/scoring/{matchLifecycle,matchStats,RecordThrow,UndoThrow,EndGame,EndLeg,StartGame}.ts`, `src/features/x01/scoring/*`, `views/MatchView.tsx`, `components/game/{Keypad,PlayerScore,MatchPlayerArea,CheckoutHint,StartingPlayerOverlay}.tsx`, `components/match/*`, `components/stats/StatsModal.tsx`, `views/StatsView.tsx`, `src/presentation/stats/*`.
- Robot X01 : `src/domain/x01Bot/x01Bot.ts`, `src/application/x01Bot/x01BotTurn.ts`, `src/features/x01/scoring/botVictoryPreview.ts`.
- Vocal : `src/features/x01/voice/*` (survol : `voiceProposalModel.ts`, `dartsSpeechTypes.ts`, `voiceConfig.ts`).
- Cricket : `utils/cricketLogic.ts`, `src/features/cricket/cricketGameModel.ts`, `views/CricketGameView.tsx`, `components/game/{CricketKeypad,CricketScoreboard}.tsx`, `components/stats/CricketStatsModal.tsx`, `views/CricketStatsView.tsx`.
- Capital : `utils/capitalLogic.ts`, `src/features/capital/capitalGameModel.ts`, `views/CapitalGameView.tsx`, `components/game/CapitalKeypad.tsx`, `views/CapitalStatsView.tsx`.
- Triathlon : `src/features/triathlon/triathlonFlow.ts`, `src/domain/triathlon/*`, `utils/triathlonScoring.ts`, `views/TriathlonGameView.tsx`, `components/triathlon/*`, `views/TriathlonStatsView.tsx`.
- Killer : `src/domain/killer/killer.ts`, `views/KillerGameView.tsx`.
- Gotcha : `src/domain/gotcha/gotcha.ts`, `views/GotchaGameView.tsx`.
- Styles : `src/styles/tailwind.css` (classes `tablet-*`, `legacy-*`, variables).

### 1.2 Tests
`tests/unit/{cricketLogic,cricketGameModel,capitalLogic,capitalGameModel,killerLogic,gotchaLogic,triathlonScoring,triathlonFlow,gameLogic}.test.ts`, `tests/unit/x01/*`, `tests/unit/application/*`, `tests/unit/components/*`, `tests/e2e/*.spec.ts` (inventaire, pas d'exécution).

### 1.3 Spécifications et documentation
`specs/005, 010, 015, 016, 017, 019, 023` (lues), `specs/README.md`, `README.md`, `docs/specifications.md`, `docs/product-scope.md`, `docs/technical.md` (extraits), backlog workspace `next-specs.md` (aucun item « jeux »).

### 1.4 Sources externes (règles)
- Wikipedia EN « Darts » (501, bust, double in, Killer, Halve-it) : https://en.wikipedia.org/wiki/Darts [VÉRIFIÉ source externe]
- Wikipedia EN « Cricket (darts) » (fermeture, score, victoire, cut-throat) : https://en.wikipedia.org/wiki/Cricket_(darts) [VÉRIFIÉ source externe]
- Wikipédia FR « Fléchettes » (Capital, Killer, Cricket FR) : https://fr.wikipedia.org/wiki/Fl%C3%A9chettes [VÉRIFIÉ source externe]
- Sites WDF/PDC, mastersofgames, dartsnutz : **inaccessibles** depuis l'environnement (403 / DNS / 404). Aucune source vérifiée pour « Gotcha » → règles marquées [HYPOTHÈSE].

### 1.5 Méthode de vérification dynamique
Des cas limites ont été rejoués en exécutant les fonctions réelles du repo (bundle `esbuild` lu depuis stdin, sortie vers `node`, **aucune écriture disque**) : checkout double-out impossible, Double-In, Master-Out reste 1, robot Master-Out, barème Triathlon 501 et Cricket, valeurs impossibles Capital/Gotcha.

---

## 2. Inventaire exhaustif des jeux, variantes et options

| Jeu | Joueurs (simple) | Doublettes | Options de setup | Saisie | Vocal | Robot | Reprise après reload | Stats fin | Revanche |
|---|---|---|---|---|---|---|---|---|---|
| **X01** (« Match X01 ») | 1–2 (`setupModel.ts` `getSimplePlayerBounds`) | 2v2 | Score 301/501/701/perso ≥ 2 ; Manches 1–5/perso ≥ 1 ou Sets (1/3/5/7 sets, 3/5 manches par set) ; Ouverture Open/Double/Master ; Fermeture Open/Double/Master ; robot 5 niveaux (simple uniquement) | Total de visite (keypad 0-9, OK, RESTE, appui long 1/2/3 = checkout, raccourcis personnalisables) | Oui (Deepgram, flag `VITE_ENABLE_VOICE_SCORING`) | Oui | **Oui** (`matchRuntime`) | Oui (`StatsView` + `StatsModal`) | Oui |
| **Cricket** | 2–3 | 2v2 | Nombre de tours 10/20/30 | Par fléchette (S/D/T 15-20, Bull, D-Bull, MISS, 3 MISS) | Non | Non | **Non** | Oui (`CricketStatsView`) | Oui |
| **Capital** | 1–4 | Non | Aucune | Par fléchette, keypad contextuel selon l'objectif ; total de visite pour l'objectif « Capital » | Non | Non | **Non** | Oui (`CapitalStatsView`) | Oui |
| **Triathlon** | 2 | 2v2 | Simple/Doublettes uniquement | Délégation aux vues Capital → Cricket → X01 (501 DO, 1 manche) + tie-break 501 | Oui (phase 501 seulement, via `MatchView`) | Non | **Non** | Oui (`TriathlonStatsView`) | Oui |
| **Killer** | 2–6 | Non | Aucune (3 vies fixes) | Attribution de numéro puis « double touché sur joueur X » / Raté / Passer | Non | Non | **Non** | **Non** (écran vainqueur seul) | **Non** |
| **Gotcha** | 2–6 | Non | Score cible 301/501/701/perso | Total de visite | Non | Non | **Non** | **Non** | **Non** |

Variantes **absentes** mais attendues par les pratiquants [VÉRIFIÉ code : aucune trace] : Cricket Cut-throat et Cricket « sans points » ; Cricket en plusieurs manches (le `legsToWin: 3` posé par `applyGameTypeDefaults` pour CRICKET est ignoré) ; Killer 5 vies / « 3 marques pour devenir Killer » ; X01 à 3–4 joueurs en simple (exclu volontairement par spec 015) ; Northern Bust ; Shanghai, Round the Clock, Halve-It anglais, 121, Bob's 27 (jeux d'entraînement absents).

Éléments de catalogue morts/inutilisés : `GameCard.chip` (« Most Played », « Endgame »… en anglais) et `showChip`/`active` jamais affichés/false (`views/GameSelectionView.tsx:15-18,40`) ; écrans `KILLER_STATS`/`GOTCHA_STATS` déclarés (`src/app/appShell.ts`) mais jamais rendus ; types `BullAttempt`, `starter_attempts_updated`, `INITIAL_STARTER_DRAW_MESSAGE` (tir à la bulle Triathlon) déclarés mais non utilisés par la vue.

---

## 3. Fiches par jeu

### 3.1 X01 (301 / 501 / 701 / personnalisé, simple, doublettes, robot)

#### Règles métier et conformité
| Règle | Référence réelle | Implémentation | Verdict |
|---|---|---|---|
| Soustraction, victoire à 0 exact | Wikipedia « Darts » §501 | `submitTurn` (`src/application/scoring/matchLifecycle.ts:259-291`) | Conforme |
| Bust < 0 | idem | `matchLifecycle.ts:264` | Conforme |
| Bust à 1 en Double Out | idem (« to exactly one ») | `matchLifecycle.ts:264` | Conforme |
| **Bust à 1 en Master Out** | Master Out = fin sur double ou triple → 1 n'est pas finissable | non traité (`matchLifecycle.ts:264`, `ScoringRules.ts:16`) | **G1 non conforme** — [VÉRIFIÉ exécution] : à 4 pts, saisie 3 → reste 1, `isBust=false` |
| **Fin impossible en Double Out (171–180, bogeys 159/162/163/165/166/168/169)** | Max checkout DO = 170 | `buildScoreSubmissionResult` passe en `checkout_confirm` dès que `score === currentScore` sans vérifier la finissabilité (`src/features/x01/scoring/matchSubmission.ts:59`) ; `getMinDartsForScore(180,'Double')` renvoie 3 | **G1** — [VÉRIFIÉ exécution] : 180, 168, 165, 162, 159 → `checkout_confirm` (victoire possible) ; 169 refusé uniquement parce que ce n'est pas un total de 3 fléchettes possible |
| **Double In / Master In** | « doubling in » : les fléchettes avant le premier double ne comptent pas (Wikipedia « Darts » §501) | `checkIn` n'est lu **nulle part** hors setup/résumé/lien externe (grep exhaustif) | **G1** — [VÉRIFIÉ exécution] : Double In, première visite 60 → score 441 |
| Fin « sur un simple » en Double Out = bust | idem | Saisie par total : l'utilisateur doit saisir 0. Aucune touche « BUST » | Acceptable mais non expliqué (G3) |
| Legs / Sets | usage | `finishLeg` (`matchLifecycle.ts:215-257`), alternance du lanceur par manche | Conforme ; en Sets, l'alternance est globale par manche (pas de règle « le lanceur alterne aussi par set ») — [À CONFIRMER] attente PO |
| Doublettes | rotation A1-B1-A2-B2 | `buildDoublesRotation` (`matchLifecycle.ts:20-49`) | Conforme |
| Checkout hints | table DO standard | `CHECKOUT_GUIDE` (`constants.ts`) : **162 entrées, toutes arithmétiquement justes et finissant sur double/bull ; seuls les 7 bogeys manquent** [VÉRIFIÉ exécution] | Conforme pour DO ; **affiché aussi en Open/Master** (`CheckoutHint.tsx` ne reçoit que le score) → G3 |
| Nb min. de fléchettes du checkout | — | `getMinDartsForScore` (`matchStats.ts`) : Open « ≤ 60 = 1 fléchette » (faux pour 59, 58, 56…) ; Master accepte 25 (simple bull) comme fin | G4 (affecte boutons de confirmation et stats) |

Duplication de règles (risque de divergence, déjà réalisé ci-dessus) [VÉRIFIÉ code] :
- Les **use cases** `RecordThrow`, `UndoThrow`, `EndGame`, `EndLeg`, `StartGame` et le domaine `ScoringRules`/`ScoreValidator` ne sont **utilisés que par les tests** ; l'UI passe par `features/x01/scoring/matchSubmission.ts` et re-valide dans la vue (`views/MatchView.tsx:388-423` réimplémente `ScoreValidator.validateRemainingTarget`).
- Ensemble des scores possibles dupliqué : `ScoreInput.ts` et `features/x01/scoring/possibleTurnScores.ts` ; bogeys DO dupliqués 4 fois (`ScoringRules.ts`, `checkoutEligibility.ts`, `matchStats.ts`, `x01BotTurn.ts`).
- `application/x01Bot/x01BotTurn.ts:4` importe depuis `features/` (inversion de dépendance violée).

#### Robot (spec 016)
- 5 niveaux ; **divergence spec ↔ code** : spec 016 « Pro 100-120 », code `averageMin: 86` affiché « + de 85 » (`src/domain/x01Bot/x01Bot.ts:16`). [VÉRIFIÉ code]
- **Blocage Master Out** : le robot vise au plus `reste − 1` (`x01BotTurn.ts:83-86`) → laisse 1 ; à 1, `isCheckoutCandidate` faux et `maxScore=0` → le robot joue 0 indéfiniment. [VÉRIFIÉ exécution : 191/200 tirages à 4 pts laissent 1 ; à 1 → `{score:0}`] **G1** (partie potentiellement infinie si l'humain ne finit pas).
- Réalisme : jamais de bust, probabilité de checkout indépendante de la distance (Pro 72 % y compris sur 170), ignore `checkIn`. G4/évolution.
- Choix du niveau via des `checkbox` utilisés comme radio (`SetupPlayersSection.tsx`) → accessibilité G4.

#### Configuration
- Parcours court et clair. Résumé du match lisible.
- **Sets** : boutons « Manches pour gagner un set » limités à 3/5 mais `legsToWin` conserve la valeur du mode Manches (ex. 2) → aucun bouton actif et le match se joue en 2 manches par set sans que l'UI le montre (`SetupMatchSection.tsx`, pas de normalisation au changement de mode). G3 [VÉRIFIÉ code]
- Score personnalisé sans borne haute (ex. 100000) → risque d'affichage [HYPOTHÈSE visuelle].
- Pas de choix du premier joueur au setup (choix en jeu via `StartingPlayerOverlay`) — cohérent avec Cricket/Capital, pas avec Killer/Gotcha.

#### Présentation des règles
`getRulesContent('X01')` : 5 lignes génériques ; annonce « Check-in actuel : Double… le score ne commence qu'après une ouverture valide » alors que ce n'est pas implémenté → **message trompeur** (G1 couplé au bug Double-In). Termes « Check-in/Check-out » alors que l'UI dit « Ouverture/Fermeture ».

#### Affichage scores / joueurs / infos utiles
- Grand score, nom auto-ajusté, badge « D » (a commencé), moyennes manche/match, fléchettes, dernier score (`PlayerScore.tsx`) ; aperçu du reste pendant la saisie (`deriveRemainingPreview`). Très bon.
- Libellés anglais : « Leg Avg », « Match Avg », « Darts », « Last » (`PlayerScore.tsx:138-156`), « darts to finish » (`Keypad.tsx:117`), feedback « Turn », « Bust » (`matchFeedback.ts:6,17`), « WAIT », « SYNC KO » (`MatchView.tsx`). G3.
- Format en en-tête « Premier à 3 Legs » vs compact « Premier à 3 Manches » (`matchPresentation.ts:3-11`) → mélange FR/EN. G3.
- Hints de checkout désactivés par défaut et cachés dans « Options de jeu » ; ils montrent la table DO quelle que soit la règle et ne suivent pas l'aperçu de saisie.
- Limité à 2 colonnes (`MatchView` n'affiche que `teams[0]` et `teams[1]`) — cause technique de la limite spec 015.

#### Keypad et saisie
- Riche : RESTE, appui long 1/2/3 pour checkout direct (geste **non découvrable**, seul un `title` et le micro-libellé anglais l'indiquent), raccourcis latéraux/mobile personnalisables.
- Raccourcis déclenchés sur `pointerDown` → **soumission immédiate** d'un score au moindre effleurement (G3, atténué par l'undo).
- Pas de saisie fléchette par fléchette (impossible donc de gérer Double-In, Northern Bust, stats par double).
- Pas de support clavier physique (seul `HomeView` écoute `keydown`) → G3 pour usage desktop/club.

#### Scoring vocal
Disponible ici uniquement (et dans le 501 du Triathlon). Contexte envoyé : `dartsAlreadyThrown: 0` → total de visite ou séquence complète. Proposition pré-remplie, validation manuelle (pas d'auto-validation) — conforme spec 003. Détails : rapport du chantier 5.1.

#### Erreurs, correction, undo
- Messages : « SCORE IMPOSSIBLE », « SCORE RESTANT IMPOSSIBLE », « UTILISE MISS », « TROP ! » (bust). Bon niveau.
- « Retour » multi-usage : efface un chiffre → annule la confirmation de checkout → rejette la proposition vocale → annule la dernière visite. Pile d'undo illimitée, inter-manches.
- **Pas d'annulation possible depuis l'écran « VAINQUEUR »** (`MatchView.tsx:771-786` : seul « Voir les Stats ») → un checkout mal saisi en fin de match ne peut pas être corrigé. G2.
- La pile d'undo n'est pas persistée : après rechargement, impossible d'annuler la visite précédente. G3.

#### Progression, victoire, fin, rejouer
- Transition de manche 3 s, aperçu de victoire du robot 2 s. Écran « VAINQUEUR » plein écran puis `StatsView`.
- `StatsView` **revient automatiquement à la sélection au bout de 2 minutes**, que l'utilisateur interagisse ou non (`views/StatsView.tsx:30-36`, timer unique non réinitialisé ; le commentaire parle d'inactivité). G3.
- Revanche : mêmes joueurs, même configuration, nouveau choix du lanceur. Pas d'alternance automatique du lanceur.

#### Statistiques (spec 023)
- Moyenne 3 fléchettes, « Jusqu'à 170 », taux de checkout (définition spec 023 : seules les visites finies ou en bust comptent comme tentatives — **plus généreux que la définition usuelle « fléchettes au double »** ; un placement manqué depuis 32 n'est pas une tentative) → libellé « Taux de checkout » trompeur pour un joueur de club [VÉRIFIÉ code, définition usuelle À CONFIRMER].
- **First-9 calculée mais jamais affichée** (`firstNineAverage`, aucun usage UI). G4.
- Tranches « 180s / 171s » : `c180` compte tout score ≥ 171 (`matchStats.ts:252`, `StatsModal.tsx:154`) → un 171 est compté comme un « 180 ». G3.
- Doublettes : stats par équipe seulement (pas par joueur). StatsModal limité à 2 colonnes.

#### Mobile / tablette / desktop
Travail important de responsive (spec 014, 021, 027, 028 : `--x01-control-h`, `--x01-score-fs`, classes `tablet-x01-*`, `legacy-*`). Non vérifié visuellement par cet agent.

#### Mode TV (préparation)
`MatchState` est sérialisable et persisté → **meilleur candidat** pour une vue spectateur. Manquent : état d'interaction (saisie en cours, transition de manche, vainqueur) hors `MatchState`, et stats déjà calculables côté lecteur via `calculateDetailedStats`.

#### Thème
`MatchView` + composants X01 : couleurs Tailwind codées en dur (`bg-gray-900`, `text-orange-500`, dégradés), cf. §5.6.

#### Tests
Bonne couverture domaine/application/features (`tests/unit/x01/*`, `application/*`) mais **aucun test de `MatchView`** ; les tests figent le comportement actuel (ex. `scoringDomain.test.ts` ne couvre pas Master-Out/1 ni checkout > 170).

#### Recommandations X01
- **Bugs de règles (P0)** : refuser une « fin » non finissable selon la règle de sortie (`isCheckoutPossible` avant `checkout_confirm`, sinon bust) ; bust à 1 en Master Out (domaine + bot + `RESTE`) ; implémenter Double/Master In **ou** masquer l'option (décision PO, §7).
- **Architecture (P1)** : un seul point d'entrée métier (`RecordThrow`/`ScoringRules`) utilisé par l'UI, le bot, le vocal et le lien externe ; supprimer les duplications (scores possibles, bogeys).
- **UX (P1)** : annulation depuis l'écran vainqueur ; libellés FR ; touche « BUST » explicite ; aide de checkout par règle et sur l'aperçu ; découvrabilité de l'appui long ; support clavier physique ; normalisation Sets.
- **Stats (P2)** : afficher First-9, tranche 180 exacte, renommer/expliciter le taux de checkout, stats individuelles en doublettes.
- **Évolutions (P2/P3)** : 3–4 joueurs (remet en cause spec 015), saisie fléchette par fléchette optionnelle, robot plus réaliste.

---

### 3.2 Cricket

#### Règles et conformité
| Règle | Référence | Implémentation | Verdict |
|---|---|---|---|
| Cibles 15–20 + Bull, 3 marques pour fermer, D=2, T=3, Bull ext. 1 / int. 2 | https://en.wikipedia.org/wiki/Cricket_(darts) | `CRICKET_TARGETS`, `processCricketHit` (`utils/cricketLogic.ts:25-88`) | Conforme |
| Points sur numéro fermé tant qu'un adversaire ne l'a pas fermé, surplus de la fléchette fermante compris | idem | `cricketLogic.ts:50-77` | Conforme |
| Bull 25 / D-Bull 50 en points | idem | `marksToAdd * target` | Conforme |
| Victoire : tout fermé et score ≥ adversaires | idem | `checkCricketWin` | Conforme |
| Pas de triple bull | — | keypad sans T-Bull | Conforme |
| Cut-throat (points donnés aux adversaires, plus bas score gagne) | idem (variante) | absent | Variante manquante |
| Limite de tours (10/20/30) | usage club/ligue courant [À CONFIRMER] | `haveAllPlayersReachedCricketRoundLimit`, `resolveCricketWinnerOnRounds` | Départage : score → numéros fermés → marques → **ordre alphabétique du nom** (`cricketLogic.ts:136`) → **G2 injuste** ; une égalité devrait être déclarée ou départagée par une règle sportive |
| Manches | — | **toujours 1 manche** (`handleLegWin` passe `{[winner]:1}`), `legsToWin=3` du setup ignoré | Variante manquante + config morte |

#### Configuration et règles affichées
- Choix 10/20/30 tours, 2–3 joueurs ou 2v2. Résumé correct. Pas de choix de variante.
- Règles : 5 lignes correctes ; README promet « Les cases encore ouvertes peuvent rapporter gros — ou faire très mal » (laisse penser au Cut-throat).

#### Affichage
- Tableau de marques « / », « X », « Ⓧ », numéros barrés quand fermés par tous, colonne par joueur, progression de tour, pastilles des 3 fléchettes. Bonne lisibilité.
- Doublettes : compétiteurs nommés « Équipe 1 / Équipe 2 » (`cricketGameModel.ts:200-204`) et choix du lanceur « Équipe 1 / Équipe 2 » au lieu des prénoms (G3).
- Infos manquantes : points d'écart, numéros encore « ouverts à scorer », indicateur « peut encore gagner ».

#### Keypad et saisie
Par fléchette : 3 colonnes S/D/T × 6 numéros + BULL + D-BULL + MISS + 3 MISS + **« C » = annuler la dernière fléchette** (`CricketKeypad.tsx:117-125`). En X01 et Gotcha, « C » efface la saisie → **même libellé, deux sémantiques** (G2 ergonomique). Couleur D-BULL en style inline `#d90416`.

#### Vocal
Absent. Le parseur X01 reconnaît déjà des fléchettes unitaires (`ParsedDart{multiplier,value}`) → réutilisable.

#### Correction / fin de partie
- Undo par fléchette illimité en cours de partie.
- **Écran « VAINQUEUR » + bouton « Retour » inatteignable** : `finishMatch` fait `setWinnerId` puis `onFinish(...)` immédiatement (`views/CricketGameView.tsx:102-103`) ; `App.handleCricketFinish` bascule sur `CRICKET_STATS` et la vue est démontée ; dans le Triathlon, la phase passe à `TRANSITION_X01`. → **impossible d'annuler une fléchette gagnante mal saisie** et le code de l'écran vainqueur (`:241-270`) est mort. **G2** [VÉRIFIÉ code]. Texte « Match remporte » sans accent (`:255`).

#### Statistiques
- `CricketStatsView` : rang, points, MPR, marques totales, fléchettes, « précision des points ». Classement trié par score, pas par vainqueur (en cas d'égalité de points le badge n°1 peut aller au perdant). G4.
- MPR : les marques sur numéros « morts » (fermés par tous) sont comptées (`appendAggregateCricketHit` additionne le multiplicateur brut) → MPR gonflé selon la définition usuelle [À CONFIRMER définition].
- `CricketStatsModal` (en partie) plus riche (singles/doubles/triples, marques bonus).

#### Persistance / TV / thème
- **État 100 % dans des `useState` du composant** → perdu au rechargement (G2) et non diffusable vers une vue TV sans refactor.
- Couleurs codées en dur (scoreboard `#0b1019`, `#101827`, slate/orange).

#### Recommandations Cricket
- P0 : corriger le flux de fin (afficher l'écran vainqueur, `onFinish` seulement à la validation, undo possible) ; persister l'état.
- P1 : départage à la limite de tours sans critère alphabétique (égalité déclarée ou MPR / premier à fermer — décision PO) ; prénoms en doublettes ; « Annuler » distinct de « Effacer ».
- P2 : variantes Cut-throat et « sans points » ; plusieurs manches ; indicateurs d'écart ; vocal par fléchette.

---

### 3.3 Capital

#### Règles et conformité
Source FR : https://fr.wikipedia.org/wiki/Fl%C3%A9chettes (section Capital) : 15 objectifs (capital, 20, côte à côte, 19, suite, 18, couleur, 17, double, 16, triple, 15, 57, 14, centre), échec = score divisé par 2 **arrondi au supérieur**. [VÉRIFIÉ source externe]

| Élément | Implémentation | Verdict |
|---|---|---|
| Liste/ordre des objectifs | **17 objectifs**, ordre différent : Capital, 20, Suite, 19, 3 à côté, 18, 57, 17, Couleur, 16, Triple, 15, Double, 14, Moins de 21, 13, Centre (`utils/capitalLogic.ts:3-5`) | Variante « maison » (ajout 13 et « Moins de 21 ») — non documentée comme telle (G3 doc) |
| Halving arrondi supérieur | `Math.ceil(currentScore / 2)` | Conforme à la source FR |
| Objectifs numérotés : au moins une fléchette dans le secteur, on ajoute la somme des touches | `scoreMatchingDarts` | Conforme |
| Côte à côte | 3 secteurs voisins sur la roue (`BOARD_ORDER` correct) **ou** bull simple + 2 voisins | Conforme + extension maison |
| Suite | 3 valeurs consécutives (multiplicateurs comptés) | Conforme |
| Couleur | 3 couleurs différentes parmi noir/blanc/rouge/vert ; table des secteurs noirs correcte | Conforme |
| 57 | exact, résolution anticipée dès ≥ 57 | Conforme |
| Moins de 21 | strictement < 21, 3 fléchettes non ratées | ID technique `21_OU_MOINS` contradictoire avec la règle « < 21 » (G4) ; règle maison [À CONFIRMER] |
| Capital initial | total de visite saisi 0–180 | **valeurs impossibles acceptées (179, 178…)** (`CapitalKeypad.tsx:72`, `CapitalGameView.tsx:97`) [VÉRIFIÉ exécution : 179 accepté] G3 |
| Égalité finale | `sortCapitalResults` + `winner = sorted[0]` | **pas d'ex æquo** : le premier dans l'ordre l'emporte (G3) |

#### Configuration / règles affichées
Aucune option (pas de choix de variante ni de nombre d'objectifs). Règles affichées complètes et exactes vis-à-vis du code (6 items). Bon.

#### Affichage / infos utiles
- Objectif courant + progression « Challenge n/17 », liste des joueurs avec score, 3 emplacements de fléchettes. Pas d'aperçu « si tu rates, tu tombes à X » ni d'historique visible des objectifs en cours de partie (seulement en stats de fin).
- Pas d'indication du score potentiel pendant la visite.

#### Keypad
**Contextuel par objectif** (Capital = pavé numérique ; numéro = S/D/T du numéro + MISS ; Double/Triple = 20 boutons ; Centre = B/DB ; objectifs libres = cible complète avec multiplicateur) → excellente idée ergonomique, **unique dans l'app**. Libellé undo « Retour ↶ ».

#### Correction / fin
Undo par fléchette avec résolution différée de 500 ms ; écran « VAINQUEUR / Score Final » avec « Retour » fonctionnel (onFinish seulement au clic « Voir les Stats ») → **le meilleur flux de fin de l'app**, à généraliser.

#### Stats
`CapitalStatsView` riche (taux de réussite, pénalités, meilleure manche, détail des challenges « DIVISÉ PAR 2 »). Modal en partie très pauvre (score + objectifs validés). Bouton « Rejouer » (ailleurs « Revanche »).

#### Persistance / TV / thème
Reducer pur dans `features/capital/capitalGameModel.ts` (bonne base sérialisable) mais état non persisté (G2). Couleurs en dur (128 classes dans `CapitalKeypad.tsx`).

#### Recommandations Capital
- P0 : persistance (reducer déjà sérialisable → effort faible).
- P1 : validation des totaux possibles pour l'objectif Capital ; gestion des ex æquo ; aperçu « réussite / échec → score » ; historique en partie.
- P2 : variante « Capital officiel (15 objectifs) » vs « Capital Bougnat (17) » (décision PO) ; documentation explicite de la variante.

---

### 3.4 Triathlon

#### Règles et conformité
Jeu **propre à Bougnat Darts** (aucune règle officielle) : Capital → Cricket → 501 DO 1 manche, barème sur 100 (34 X01 + 33 Cricket + 33 Capital, cohérent avec `TRIATHLON_SCORING_RULES`), tie-break 501. La conformité s'évalue donc vis-à-vis des règles affichées et de l'équité.

Constats [VÉRIFIÉ exécution] :
1. **501 — « défaite serrée » toujours vraie à 2 compétiteurs** : `isCloseLoss = dartsGap <= 3 || avgGap <= 6` (`utils/triathlonScoring.ts:192-194`). Dans un leg, le perdant a lancé au plus 3 fléchettes de moins (ou 2 de plus) que le vainqueur → `dartsGap ≤ 3` **systématiquement**. Exemple rejoué : vainqueur en 9 fléchettes, perdant à 461 → perdant 14 pts (au lieu de 10). La base « défaite standard » (10) est **inatteignable**. **G2**.
2. **Cricket — classement sur les points seulement** (`applyRankPoints` sur `score`, `triathlonScoring.ts:269`), `summary.winnerId` ignoré : vainqueur ayant tout fermé à 0–0 → les deux reçoivent 20 pts (rejoué). **G2**.
3. **Double comptage** : le bonus « meilleur score » (Cricket +4, Capital +5) récompense le même critère que le classement ; le libellé Cricket « Différence de score » ne correspond pas au calcul (score max). G3.
4. Bonus attribués à tous les ex æquo (y compris « moins de pénalités » à 0 pour tous) : choix acceptable mais non documenté. G4.

#### Parcours et affichage
- Départ : simple écran « Qui commence ? » — la règle annonce « une fléchette à la bulle », la vue ne saisit pas le résultat (types `BullAttempt` inutilisés). Acceptable, mais le texte devrait dire « désignez le joueur le plus proche de la bulle ».
- Doublettes : compétiteurs « Équipe 1 / Équipe 2 » (pas de prénoms).
- Transitions : récap de l'épreuve + classement + « Suivant » — bon.
- **Pendant les épreuves, le classement Triathlon n'est pas consultable** (le bouton Stats de chaque sous-vue ouvre les stats de l'épreuve). G3.
- Phase tie-break : bandeau `pointer-events-none` en haut qui recouvre la barre du `MatchView` ; `showExitConfirm`/`showStats` de cette branche ne peuvent jamais devenir vrais (code mort, `TriathlonGameView.tsx:333-351`).
- Fin du 501 : l'écran X01 « VAINQUEUR — Voir les Stats » s'affiche alors que ce n'est que le vainqueur de l'épreuve → confusion (G3).

#### Correction / persistance
- Les flux de fin hérités : Capital (écran vainqueur + Retour), Cricket (bug §3.2, pas de retour), X01 (pas de retour).
- **Aucune persistance** : un rechargement pendant le Cricket fait perdre aussi le Capital terminé. **G2** (partie de 45–90 min [HYPOTHÈSE durée]).

#### Vocal / TV / thème
Vocal disponible uniquement pendant le 501. Pour la TV, il faudra un état agrégé (phase + scorecards + sous-état) aujourd'hui dispersé entre le reducer Triathlon et les `useState` des sous-vues.

#### Recommandations Triathlon
- P0/P1 : corriger le barème (critère de défaite serrée basé sur le **reste du perdant** ou un ratio de moyenne — proposition à arbitrer ; classement Cricket = vainqueur d'abord) ; persistance multi-phase.
- P1 : classement accessible pendant toute la partie ; prénoms en doublettes ; écran de fin d'épreuve non ambigu ; supprimer le code mort.
- P2 : documenter le barème dans les règles (tableau), éventuellement le rendre paramétrable.

---

### 3.5 Killer

#### Règles et conformité
Sources : Wikipedia EN (devenir killer en touchant 5 fois son numéro, doubles ×2, triples ×3 ; retirer des points aux autres ; max 5) et Wikipédia FR (3 points sur son numéro ; « une variante existe où seuls les doubles comptent » ; un killer qui perd un point perd son statut). https://en.wikipedia.org/wiki/Darts , https://fr.wikipedia.org/wiki/Fl%C3%A9chettes [VÉRIFIÉ source externe]

Implémentation (`src/domain/killer/killer.ts`) : 3 vies au départ ; **un seul double sur son numéro → Killer** ; un Killer retire 1 vie par double adverse ; un Killer qui touche son propre double perd 1 vie ; le statut Killer n'est jamais perdu ; triples ignorés.
- C'est une **variante « doubles uniquement » à vies décroissantes**, cohérente en soi et conforme à la spec 017, mais différente des deux règles de référence. À présenter comme telle (G3 doc).
- La règle « un joueur non Killer qui touche son double récupère une vie, sans dépasser 3 » (spec 017 E3, `killer.ts:101`) est **sans effet** puisque tout le monde démarre à 3 vies (G4, règle morte).
- Bull comme numéro (D-Bull à viser) accepté : très difficile, à signaler ou exclure par option.

#### Parcours / affichage / saisie
- Phase 1 : grille 1–20 + Bull, numéros pris grisés. Phase 2 : boutons « double de X » pour chaque joueur vivant + Raté / Passer / Annuler. Tableau joueurs/numéro/rang/vies (cœurs fixés à 3 : `Array.from({length:3})`).
- **Ordre de jeu** : le joueur 1 commence toujours ; après l'attribution, `currentPlayerIndex` est forcé à 0 (`killer.ts:72`) ; aucun choix du lanceur. G3.
- **Journal (`state.log`) produit par le domaine mais jamais affiché** : pas de retour « X n'est pas encore Killer », « X touche Y » (G3).
- Libellés : « Numero » sans accent (`KillerGameView.tsx:241`), « Rate » (bouton) au lieu de « Raté ».

#### Erreurs / correction / fin
- **« Quitter » sans confirmation** (`KillerGameView.tsx:123`) → un appui accidentel détruit la partie (G2).
- Undo limité à 20 états ; **pas d'undo depuis l'écran vainqueur**, `onFinish` est déclenché par effet dès la fin → résultat déjà enregistré dans l'historique local même si la dernière fléchette était une erreur (G2).
- Écran de fin minimal « Dernier survivant — Retour aux jeux » : **ni revanche, ni statistiques** (écran `KILLER_STATS` prévu mais jamais rendu).
- Pas d'horloge, pas de bouton stats en partie.

#### Persistance / TV / thème
Domaine pur et sérialisable (bonne base), état dans `useState` non persisté (G2). Couleurs en dur.

#### Recommandations Killer
- P0 : confirmation de sortie ; persistance ; undo de la dernière action depuis l'écran de fin (avant validation).
- P1 : choix du lanceur, ordre conservé après attribution ; journal visible ; revanche ; stats simples (vies retirées, doubles réussis, suicides).
- P2 : variantes paramétrables (3/5 vies, devenir Killer par N marques sur le numéro avec S/D/T, perte du statut, triples ×3) ; vocal (« double seize »).

---

### 3.6 Gotcha

#### Règles et conformité
Aucune source officielle accessible → [HYPOTHÈSE] règle usuelle : course de 0 vers la cible, score exact requis, dépassement = tour annulé, atteindre exactement le score d'un adversaire le renvoie à 0. L'implémentation (`src/domain/gotcha/gotcha.ts`) est **conforme à la spec 019** et à cette description.
- Variante possible non gérée [HYPOTHÈSE] : vérification de l'égalité **fléchette par fléchette** (et non en fin de visite) ; le bust sur la fléchette en dépassement.
- **Totaux impossibles acceptés** (179, 178, 176…) : seule la plage 0–180 est contrôlée (`gotcha.ts:63`) [VÉRIFIÉ exécution : 179 accepté]. G3. Le domaine X01 possède déjà `isPossibleThreeDartTurnScore` (à réutiliser).

#### Parcours / affichage / saisie
- Tableau joueur/score/reste ; zone de visite avec **aperçu « Après le tour », « Bust », « Gotcha possible sur … », « victoire »** → très bonne aide à la décision, à généraliser au X01 (aperçu) et au Cricket.
- Keypad dédié (3×4 + Valider) différent de celui du X01 (pas de raccourcis, pas de RESTE).
- Premier joueur toujours le joueur 1 (pas d'overlay).
- Journal `state.log` non affiché (G3).

#### Erreurs / correction / fin
- **Quitter sans confirmation** (`GotchaGameView.tsx:173`) (G2).
- Undo 30 états ; pas d'undo après victoire ; `onFinish` par effet.
- Fin minimale « Score exact — Retour aux jeux » : ni revanche ni statistiques.

#### Persistance / TV / thème
Domaine pur sérialisable, état non persisté (G2). 11 couleurs hex + 70 classes palette en dur.

#### Recommandations Gotcha
- P0 : confirmation de sortie, persistance.
- P1 : validation des totaux possibles (réutiliser le domaine X01), revanche, stats (gotchas infligés/subis, busts, moyenne), choix du lanceur, journal visible.
- P2 : variante « gotcha fléchette par fléchette » (nécessite saisie par fléchette) ; vocal par total.

---

## 4. Incohérences ergonomiques entre jeux

| Comportement | X01 | Cricket | Capital | Triathlon | Killer | Gotcha |
|---|---|---|---|---|---|---|
| Barre de partie (logo, horloge, chrono, stats, quitter) | `MatchTopBar` + options | En-tête maison | En-tête maison | `TriathlonGameHeader` (transitions) | Bouton Quitter + chrono | Bouton Quitter + chrono + cible |
| Confirmation de sortie | Oui (`dialog`) | Oui | Oui (div, pas `dialog`) | Oui (transitions) | **Non** | **Non** |
| Choix du premier joueur | Overlay | Overlay (équipes non nommées) | Overlay | Overlay (bulle non saisie) | **Non (joueur 1)** | **Non (joueur 1)** |
| Unité de saisie | Visite | Fléchette | Fléchette (visite pour Capital) | selon épreuve | Fléchette (double/raté) | Visite |
| Libellé « C » | Effacer la saisie | **Annuler la fléchette** | — | — | — | Effacer la saisie |
| Libellé d'annulation | « Retour ↶ » | « C » | « Retour ↶ » | — | « Annuler » | « Retour » |
| Undo depuis l'écran de fin | **Non** | Prévu mais **inatteignable** | Oui | Selon épreuve | **Non** | **Non** |
| Enregistrement du résultat | Au clic « Voir les Stats » | Immédiat | Au clic | Fin de 501/tie-break | Immédiat (effet) | Immédiat (effet) |
| Écran de fin | VAINQUEUR → Stats | (Stats directes) | VAINQUEUR → Stats | Stats Triathlon | Écran simple | Écran simple |
| Revanche | « REVANCHE » | « REVANCHE » | « Rejouer » | « Revanche » | **Absente** | **Absente** |
| Retour au menu | « SORTIE » | « SORTIE » | « Menu Principal » | « Menu Principal » | « Retour aux jeux » | « Retour aux jeux » |
| Ordre des boutons de fin | Revanche / Sortie | Revanche / Sortie | Menu / Rejouer | Menu / Revanche | — | — |
| Stats en partie | Modal riche | Modal riche | Modal minimal | Classement (transitions) | **Aucune** | **Aucune** |
| Persistance en cours | **Oui** | Non | Non | Non | Non | Non |
| Aperçu de l'effet de la saisie | Reste projeté | Non | Non | — | Non | **Oui (très bon)** |
| Règles accessibles en partie | Non | Non | Non | Non | Non | Non |
| Vocal | Oui | Non | Non | 501 seulement | Non | Non |
| Gestion ex æquo | n/a | Alphabétique (limite tours) | Premier trié | Tie-break 501 | n/a | n/a |

Les textes mélangent FR/EN (« Leg Avg », « Darts », « Turn », « Bust », « darts to finish », « WAIT », « SYNC KO », chips « Most Played »…) et des majuscules aléatoires (« Lancer La Partie », « Ordre Des Jeux », « Manches Par Set », « Début De Partie »).

---

## 5. Composants et comportements communs proposés

Principe : **mutualiser le cadre, pas les règles**. Chaque jeu garde son domaine pur et son keypad spécifique ; on unifie ce qui entoure la partie.

### 5.1 Contrat d'état de partie sérialisable (fondation)
Constat : X01 (`MatchState`), Capital (reducer), Killer et Gotcha (domaine pur) sont déjà presque sérialisables ; Cricket et Triathlon ne le sont pas (état éclaté en `useState`).
Proposition minimale (pas de framework) : pour chaque jeu, un module domaine/feature exposant `createState(players, config)`, `apply(state, input)`, `isFinished(state)`, `winner(state)` et un type d'état **JSON-sérialisable** ; une pile d'historique d'états (déjà le pattern utilisé partout). Le composant React devient un simple `useReducer` sur ce module, et l'application persiste `{gameType, state, history?}` dans la session existante (`PersistedAppSession` gagne un champ générique `gameRuntime`).
Justification : corrige la perte de données (spec 010), rend possibles la vue TV (rapport 5.6), le vocal multi-jeux (5.1) et les tests de composants. Pas de nouvelle dépendance, coût récurrent nul.

### 5.2 `GameTopBar`
Logo/identité (personnalisable plus tard), horloge, chrono, indicateur de tour/manche, boutons Statistiques, Règles, Options, Quitter. Remplace 5 en-têtes différents.

### 5.3 `ExitConfirmDialog`
Unique, basé sur `<dialog>`, texte « Quitter la partie ? La partie en cours sera perdue / conservée » selon la persistance. Obligatoire pour tous les jeux.

### 5.4 Sémantique d'annulation unique
- « Effacer » (⌫) : agit sur la saisie en cours uniquement.
- « Annuler » (↶) : annule la dernière action validée (visite ou fléchette), y compris **depuis l'écran de fin** tant que le résultat n'est pas validé.
- Le résultat est enregistré (historique local, lien externe) **uniquement à la validation de l'écran de fin**, comme le fait déjà Capital.

### 5.5 `GameEndScreen`
Vainqueur(s) avec gestion des ex æquo, résumé (durée, score final), actions homogènes et ordonnées : « Annuler la dernière action », « Statistiques », « Revanche » (option : alterner le premier joueur), « Changer de jeu ». Supprime le retour automatique non désiré de `StatsView` (ou le transforme en vrai timer d'inactivité réinitialisé par interaction, utile en mode bar).

### 5.6 Tokens de thème pour les écrans de jeu
Remplacer les couleurs codées en dur par des tokens sémantiques (`--game-surface`, `--game-active`, `--game-accent`, `--mark-closed`, `--danger`, couleurs de segments S/D/T…). Volume constaté : ≈ 1 100 classes de palette et ≈ 100 couleurs hex/rgba dans les seuls fichiers de jeu (comptage grep). Dépend du design system (chantier 5.2/5.7).

### 5.7 Saisie partagée
- `VisitTotalKeypad` (X01, Gotcha, objectif Capital) avec validation `isPossibleThreeDartTurnScore` partagée.
- `DartKeypad` (S/D/T, bull, miss) paramétrable par cibles autorisées (Cricket, Capital, futur Killer variante, futurs jeux d'entraînement).
- Les deux exposent la même interface d'entrée que le vocal (`ParsedDart[]` / total), pour que manuel, vocal et intégrations passent par les mêmes cas d'utilisation.

### 5.8 Aperçu de l'effet (« preview ») généralisé
Pattern Gotcha (« après le tour », bust, gotcha possible, victoire) à porter au X01 (bust prévisible, reste, checkout), Cricket (points marqués, numéro fermé), Capital (réussite/échec → nouveau score).

### 5.9 Règles consultables en partie
Bouton « Règles » dans `GameTopBar` réutilisant `getRulesContent`, avec règles **générées à partir de la configuration réelle** (variante, vies, tours…).

### 5.10 Choix du premier joueur uniforme
`StartingPlayerOverlay` pour tous les jeux, avec prénoms (y compris doublettes), option « tirage à la bulle » (texte d'aide) et option « aléatoire ».

---

## 6. Solutions comparées (points structurants)

### 6.1 Reprise des parties non-X01
| Option | Description | Avantages | Inconvénients | Coût récurrent |
|---|---|---|---|---|
| A. Snapshot par jeu dans la session existante (recommandée) | Extraire l'état en modules purs (§5.1), persister via `persistAppSession` (IndexedDB + fallback localStorage déjà en place) | Réutilise l'infra spec 010, prépare TV/vocal, testable | Refactor de `CricketGameView` et `TriathlonGameView` (état éclaté) | 0 € |
| B. Persister les `useState` tels quels par composant | Ajout de `useEffect` de sauvegarde dans chaque vue | Rapide | Duplication, état React ≠ modèle métier, inutilisable pour TV | 0 € |
| C. Avertir seulement (« partie non sauvegardée ») | Bannière + confirmation à la fermeture | Très rapide | Ne règle pas le problème ; contredit README/spec 010 | 0 € |
Recommandation : **A**, avec C en mesure transitoire si A est planifié après la 2.0.0.

### 6.2 Double In / Master In
| Option | Description | Avantages | Inconvénients |
|---|---|---|---|
| A. Masquer l'option (Open seulement) | Retirer la ligne « Ouverture » du setup, du lien externe (`externalMatchLink.ts` accepte `in=`) et de la doc | Immédiat, supprime une promesse fausse | Perte d'une variante (PDC World Grand Prix) ; impact contrat lien externe (spec 030) |
| B. Confirmation d'ouverture par visite | Tant que l'équipe n'est pas ouverte : la visite saisie demande « Ouverture réussie ? » + points comptés à partir de la fléchette d'ouverture (le joueur saisit le total compté) | Compatible saisie par total, voix | Une question supplémentaire par visite tant que non ouvert |
| C. Saisie par fléchette en mode Double In | Bascule du keypad en S/D/T avant ouverture | Exact | Plus complexe, deux keypads dans un même jeu |
Recommandation : **B** (règle respectée, coût UX limité aux premières visites), ou **A** si la V2 doit rester minimale. Décision PO.

### 6.3 Fin de partie Cricket/Killer/Gotcha
Généraliser le flux Capital (écran vainqueur local, `onFinish` à la validation). Option alternative « toast d'annulation 5 s » rejetée : moins explicite en bar/club bruyant.

---

## 7. Bénéfices, contraintes, risques

- **Bénéfices** : règles fiables (crédibilité auprès des clubs), aucune perte de partie, apprentissage unique entre jeux (moins de friction), fondation directe pour mode TV, vocal multi-jeux, thème Light/personnalisé et intégrations partenaires (un seul cas d'usage par action).
- **Contraintes** : refactor de vues volumineuses (`MatchView` 869 lignes, `CricketGameView` 364) ; tests de composants quasi inexistants pour les vues de jeu (aucun test ne référence `MatchView`, `CricketGameView`, `KillerGameView`, `GotchaGameView`, `TriathlonGameView`, `CapitalGameView`) → filet de sécurité à construire **avant** refactor.
- **Risques** : régressions sur le flux X01 éprouvé (robot, vocal, lien externe spec 030) ; changement de barème Triathlon modifiant des résultats historiques (historique local seulement) ; changement du contrat du lien externe si Double-In est retiré ; migration de la session persistée (ajouter un champ versionné, tolérer l'ancien format — cf. spec 010).
- **Coûts récurrents** : aucun pour ce rapport (tout est client) ; le vocal multi-jeux augmenterait l'usage Deepgram (chiffrage dans le rapport 5.1).

---

## 8. Propositions de spécifications (provisoires)

| ID provisoire | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances / specs existantes |
|---|---|---|---|---|---|---|---|
| V2-GAMES-01 | Conformité des règles de sortie X01 | Reco UX/UI (bug règles) | Refuser une fin non finissable selon la règle (DO > 170 et bogeys → bust) ; bust à 1 en Master Out (domaine, `RESTE`, robot) ; robot sans blocage ; `getMinDartsForScore` exact (Open/Master) ; normalisation Sets | Crédibilité, parties non bloquées | S | **P0** | Enrichit 016 (bot) et 023 (stats) ; tests `scoringDomain`, `x01BotTurn` |
| V2-GAMES-02 | Ouverture Double In / Master In | Reco (bug règles) | Implémenter (option B §6.2) ou retirer l'option (option A) partout (setup, règles, lien externe, docs) | Fin d'une promesse fausse | S (A) / M (B) | **P0** | Spec 030 (paramètre `in`), `docs/specifications.md` |
| V2-GAMES-03 | Reprise de partie pour tous les jeux | Reco archi + spec 010 | Persister l'état en cours de Cricket, Capital, Killer, Gotcha, Triathlon (multi-phase) + pile d'annulation ; migration tolérante de la session | Pas de perte silencieuse | M–L | **P0** | **Enrichir 010** ; dépend de V2-GAMES-18 |
| V2-GAMES-04 | Fin de partie Cricket réparée | Reco (bug) | Écran vainqueur visible, annulation de la dernière fléchette, `onFinish` à la validation, aussi dans le Triathlon | Correction d'erreur de saisie | S | **P0** | — |
| V2-GAMES-05 | Barème Triathlon équitable | Reco (bug barème) | Critère de défaite serrée pertinent (ex. reste du perdant ≤ seuil), classement Cricket vainqueur d'abord, bonus sans double comptage, libellés exacts, barème affiché dans les règles | Équité | S–M | P1 | Décision PO sur le barème |
| V2-GAMES-06 | Socle de fin de partie commun | Reco UX/UI | `GameEndScreen` : ex æquo, annuler, stats, revanche (alternance option), changer de jeu ; résultat enregistré à la validation ; timer d'inactivité réel ou supprimé | Cohérence, rejouer vite | M | P1 | V2-GAMES-03/04 ; rapport mode bar |
| V2-GAMES-07 | Cadre de partie commun | Reco UX/UI | `GameTopBar`, `ExitConfirmDialog` obligatoire, règles consultables en partie, choix du premier joueur uniforme (prénoms en doublettes) | Cohérence, sécurité | M | P1 | Design system (5.2/5.7) |
| V2-GAMES-08 | Sémantique de saisie et d'annulation unifiée | Reco UX/UI | « Effacer » vs « Annuler » ; libellés et icônes uniques ; support clavier physique ; raccourcis X01 non déclenchés au simple contact (pointerUp ou confirmation) | Moins d'erreurs | S–M | P1 | Spec 014, 020 (INP) |
| V2-GAMES-09 | Validation de visite partagée | Reco archi | `isPossibleThreeDartTurnScore` unique pour X01/Gotcha/Capital ; suppression des duplications (scores possibles, bogeys ×4) ; UI X01 branchée sur les use cases `RecordThrow`/`ScoringRules` | Une règle = un endroit | S | P1 | Spec 022 |
| V2-GAMES-10 | Textes FR et lexique des jeux | Documentation / UX | Glossaire (manche, set, visite, fléchette, bust « Trop », checkout « finish »…) ; suppression EN résiduel ; casse homogène ; accents | Qualité perçue | S | P1 | Spec 013 (stats FR) |
| V2-GAMES-11 | Statistiques X01 complètes | Reco UX/UI | First-9 affichée, tranche 180 exacte, taux de checkout renommé/expliqué, stats individuelles en doublettes | Valeur joueurs club | S–M | P2 | **Enrichir 023** |
| V2-GAMES-12 | Cricket : variantes et départage | Demande V2 (revue jeux) | Cut-throat, « sans points », manches/sets, départage limite de tours non alphabétique, MPR défini, indicateurs d'écart | Profondeur de jeu | M | P2 | V2-GAMES-03 |
| V2-GAMES-13 | Killer : variantes, journal, stats | Demande V2 | Vies 3/5, devenir Killer par N marques (S/D/T), perte du statut, journal visible, stats, revanche, ordre de jeu conservé | Fidélité aux usages | M | P2 | **Enrichir 017** |
| V2-GAMES-14 | Gotcha : validation, stats, revanche | Demande V2 | Totaux possibles, journal visible, stats, revanche, choix du lanceur ; étude variante « par fléchette » | Qualité | S | P2 | **Enrichir 019** |
| V2-GAMES-15 | Capital : variante officielle et ex æquo | Demande V2 | Choix « Capital FR (15 objectifs) » / « Capital Bougnat (17) », ex æquo, aperçu réussite/échec, historique en partie, validation du capital initial | Clarté | S–M | P2 | Décision PO |
| V2-GAMES-16 | X01 à 3–4 joueurs en simple | Demande V2 / backlog implicite | Lever la limite spec 015 : `MatchView` multi-colonnes, stats N joueurs | Usage bar/famille | L | P2 | **Remet en cause 015** ; tablette (5.3) |
| V2-GAMES-17 | Aide de checkout contextuelle | Innovation | Hints par règle (Open/Double/Master), sur l'aperçu de saisie, après 1–2 fléchettes (si saisie par fléchette) | Aide débutants | S–M | P3 | V2-GAMES-01 |
| V2-GAMES-18 | ADR — Contrat d'état de partie sérialisable | Reco archi (décision préalable) | Formaliser le pattern `createState/apply/isFinished/winner` + historique, par jeu, sans framework ; emplacement en couches (`src/domain/<jeu>`) | Fondation persistance/TV/vocal | M | **P0 (décision)** | Rapports archi (5.9), TV (5.6), vocal (5.1) |
| V2-GAMES-19 | Saisie vocale multi-jeux | Demande V2 (5.1) | Réutiliser le parseur (`ParsedDart`) pour Cricket, Capital, Killer ; total pour Gotcha | Différenciation | L | P2 | Rapport 5.1, V2-GAMES-18, coût Deepgram |
| V2-GAMES-20 | Tokens de thème des écrans de jeu | Reco UX/UI (5.2/5.7) | Migration des ≈1 100 classes palette des jeux vers des tokens | Light/thèmes | L | P1 (avec 5.2) | Design system |
| V2-GAMES-21 | Filet de tests des parcours de jeu | Reco archi | Tests de composants des 6 vues + E2E « partie complète, annulation, reprise » par jeu | Sécuriser les refactors | M | **P1 (avant refactor)** | Spec 008, 029 |
| V2-GAMES-22 | Jeux d'entraînement (étude) | Étude exploratoire | Round the Clock, Bob's 27, 121, Shanghai : intérêt, réutilisation du `DartKeypad` | Usage solo/club | M | P3 | V2-GAMES-18 |

Specs existantes concernées : **010** (enrichir : tous les jeux), **015** (à réviser si V2-GAMES-16 retenue), **016** (corriger divergence niveau Pro 100-120 vs 86+ et blocage Master), **017** et **019** (enrichir : variantes, fin de partie, sortie confirmée), **023** (préciser libellé et définition, éventuellement ajouter tentative « placement manqué »), **030** (paramètre `in` si Double-In retiré ou implémenté), **005** (cohérence layout scoreboard : à rattacher à V2-GAMES-07).

---

## 9. Décisions nécessitant l'arbitrage du product owner

1. **Double In / Master In** : implémenter (confirmation d'ouverture) ou retirer l'option (impact lien externe spec 030) ?
2. **Règles « maison » vs règles de référence** : Capital 17 objectifs vs 15 (FR), Killer « doubles + 3 vies » vs 3/5 marques : garder la variante Bougnat par défaut et proposer la variante de référence en option, ou l'inverse ?
3. **Barème Triathlon** : critère de « défaite serrée » (reste du perdant ? écart de moyenne ?), classement Cricket au vainqueur, suppression des doubles comptages — accepte-t-on un changement de résultats par rapport à la v1 ?
4. **Départage Cricket à la limite de tours** : égalité déclarée, ou critère sportif (MPR, premier à fermer) ?
5. **X01 à 3–4 joueurs en simple** : lever la limite de la spec 015 en V2 ou reporter ?
6. **Saisie par fléchette en X01** (option) : souhaitée pour Double-In, stats de doubles, Northern Bust ? Impact simplicité.
7. **Variantes Cricket** (Cut-throat, sans points, manches) : périmètre V2 ou ultérieur ?
8. **Revanche** : alterner automatiquement le premier joueur ou reposer la question ?
9. **Retour automatique à l'accueil depuis les stats** (2 min actuellement) : supprimer, ou garder comme option « mode bar/club » avec vraie détection d'inactivité ?
10. **Taux de checkout** : conserver la définition spec 023 (visites finies/bust) en la renommant, ou viser la définition usuelle (nécessite saisie par fléchette) ?

---

## 10. Limites de l'analyse

- Aucun rendu visuel ni test sur appareil réel (mobile/tablette/desktop/TV) : les constats d'affichage reposent sur le code et les classes CSS. [NON VÉRIFIÉ visuellement]
- Le module vocal n'a été que survolé (contexte, contrat de proposition) ; l'analyse approfondie relève du rapport 5.1.
- Sources officielles WDF/PDC et sites de règles spécialisés inaccessibles depuis l'environnement ; règles confirmées via Wikipédia EN/FR uniquement ; Gotcha sans source vérifiée.
- Les tests du repo n'ont pas été exécutés (risque d'écriture de cache/coverage) ; les vérifications dynamiques ont été faites par exécution en mémoire des fonctions métier.
- Le comptage des couleurs codées en dur est un ordre de grandeur (grep), pas un inventaire exact.
- Les durées de partie et la fréquence d'usage des jeux ne sont pas mesurées (pas de télémétrie) : les priorités P1/P2 entre jeux sont des [HYPOTHÈSE] à confronter aux usages réels.
- Les comportements iOS 12 (spec 018, classes `legacy-*` absentes de Killer/Gotcha) n'ont pas été évalués [À CONFIRMER].
