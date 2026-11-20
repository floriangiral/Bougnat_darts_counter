---
id: 050-counter-games-rules-reference
v2_id: V2-GAMES-26
titre: Rétro-spécifications des règles (X01, Cricket, Capital, Triathlon)
type: doc
statut: a-valider
validation: en-attente
origine: Documentation
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 23
depend_de: [V2-SDD-01]
remplace: []
remplacee_par: []
issue: '#234'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 050 — Rétro-spécifications des règles (X01, Cricket, Capital, Triathlon)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Les règles des jeux ne sont écrites nulle part ailleurs que dans le code et dans quelques lignes de règles affichées au setup (`src/features/game-setup/setupPresentation.ts:59-140`). Les specs historiques (015, 016, 023) ne couvrent que des points isolés ; Killer et Gotcha ont leurs specs (017, 019) et sont traités par la spec 053. Le compte rendu V2 (§C.5, §F.2 « V2-GAMES-26..29 ») demande des règles de référence pour servir de base aux golden tests (V2-QA-01, spec 039) **avant** toute extraction de moteur (V2-ARCH-03/04, specs 057/058).

## 2. Problématique

Sans référence écrite, un test de caractérisation fige aussi bien une règle voulue qu'un bug, et une variante maison ne peut pas être distinguée d'un écart.

## 3. Objectifs

- Décrire les règles **réellement implémentées** au commit `508dfa6`, avec référence de code.
- Les comparer aux règles usuelles, sources citées, et classer chaque règle : **conforme**, **variante maison** ou **écart** (bug connu, renvoyé à sa spec).
- Donner à chaque règle un identifiant stable réutilisé par les golden tests.

## 4. État actuel vérifié dans le code

- Règles affichées : X01 et Cricket générées (`setupPresentation.ts:97-127`), Capital et Triathlon statiques (`:59-78`) ; la mention « ouverture valide » du X01 est fausse (spec 046).
- `docs/specifications.md:76-121` (« Current Functional Rules ») liste les règles en quelques puces (détail seulement pour « 3 à côté » et « Moins de 21 » du Capital) et signale déjà les écarts des specs 045 et 046 ; aucune référence détaillée, sourcée et identifiée par règle n'existe [vérifié].
- Sources externes consultées le 2026-11-20 (§8.0). PDC et WDF : pages inaccessibles depuis l'environnement d'audit → [non vérifié].

## 5. Comportement cible

Un document de référence en français, par jeu, publié dans `docs/` (emplacement à fixer avec V2-DOC-02), reprenant le contenu validé du §8, maintenu à chaque changement de règle, et référencé par les golden tests (identifiant de règle dans le nom du test).

## 6. Périmètre

### Inclus
X01 (simple, doublettes, manches/sets, robot pour ce qui touche aux règles), Cricket, Capital, Triathlon.

### Exclu
Killer et Gotcha (spec 053) ; statistiques (spec 023, 013) ; ergonomie (spec 049) ; corrections de bugs (renvoyées aux specs citées).

## 7. User stories

- En tant que mainteneur, je veux une règle de référence par comportement, afin d'écrire des golden tests qui ne figent pas les bugs.
- En tant que joueur ou organisateur, je veux savoir quelles règles maison le compteur applique, afin de les annoncer avant une partie.

## 8. Règles métier — rétro-spécification au commit 508dfa6

### 8.0 Légende et sources

Statut : **C** conforme à la règle usuelle ; **M** variante maison assumée (à valider) ; **E** écart = bug connu, **ce n'est pas une règle** (spec de correction indiquée).
Sources (consultées le 2026-11-20) :
- [S1] Wikipedia EN « Darts » — https://en.wikipedia.org/wiki/Darts (bust « below zero, to exactly one, or to zero but not ending with a double » ; double bull compté comme double ; « doubling in » ; Northern Bust).
- [S2] Wikipedia DE « Darts » — https://de.wikipedia.org/wiki/Darts (Master Out = double ou triple ; reste 1 = trop en Double/Master Out ; Double In avec le double compté ; bogeys 159-169).
- [S3] Wikipedia EN « Cricket (darts) » — https://en.wikipedia.org/wiki/Cricket_(darts) (fermeture, surplus compté, victoire à score égal ou supérieur, cut-throat, variante sans points, « diddle »).
- [S4] Wikipédia FR « Fléchettes » — https://fr.wikipedia.org/wiki/Fl%C3%A9chettes (501 double out, « plus possible de gagner à 1 » ; Cricket et Cut throat ; règles officielles Cricket 20 tours, égalité = manche rejouée ; Capital en 15 objectifs, division par 2 arrondie au supérieur).

### 8.1 X01

| ID | Règle implémentée | Code | Règle usuelle | Statut |
|---|---|---|---|---|
| X01-R01 | Départ 301/501/701 ou personnalisé ≥ 2, sans borne haute | `views/SetupView.tsx:213` | 301/501 [S4] | C (borne haute absente : M) |
| X01-R02 | Saisie d'un total de visite ; seuls les totaux réalisables en 3 fléchettes sont acceptés (refus de 163, 166, 169, 172, 173, 175, 176, 178, 179 et > 180) | `src/features/x01/scoring/matchSubmission.ts:52`, `possibleTurnScores.ts:1-20` | — | C |
| X01-R03 | Le total est soustrait ; victoire à 0 exact | `src/application/scoring/matchLifecycle.ts:259-291` | [S1][S4] | C |
| X01-R04 | Trop si reste < 0 : visite enregistrée à 0, reste de début de visite conservé (pas de Northern Bust) | `matchLifecycle.ts:263-272` | [S1] | C |
| X01-R05 | Trop si reste = 1 en Double-Out | `matchLifecycle.ts:264` | [S1][S2][S4] | C |
| X01-R06 | Reste = 1 en Master-Out **accepté** | `matchLifecycle.ts:264` | trop [S2] | **E** → spec 045 |
| X01-R07 | Total = reste → confirmation « fléchettes utilisées » ; la règle de fermeture n'est pas vérifiée ; une sortie sur un simple en Double-Out doit être saisie « 0 » par le joueur | `matchSubmission.ts:59-61`, `views/MatchView.tsx:836-856` | — | M (attestation implicite de la sortie) |
| X01-R08 | En Double-Out, 159, 162, 165, 168, 171, 174, 177, 180 acceptés comme sorties | `matchSubmission.ts:52-61` | impossibles [S2] | **E** → spec 045 |
| X01-R09 | Nombre minimal de fléchettes de sortie : heuristique par seuils (Open ≤ 60 = 1 ; Master inclut 25) | `src/application/scoring/matchStats.ts:282-315` | — | **E** → spec 045 |
| X01-R10 | Ouverture Double/Master-In réglable mais sans effet | `checkIn` non lu par `src/application/scoring/` | « doubling in » [S1][S2] | **E** → spec 046 |
| X01-R11 | Manches : premier à N (1-5 ou personnalisé ≥ 1). Sets : premier à S sets (1/3/5/7), set gagné à L manches (3/5) ; manches remises à 0 à chaque set | `matchLifecycle.ts:215-232`, `components/game-setup/SetupMatchSection.tsx:56-110` | usage | C (en Sets, L peut hériter d'une valeur non affichée : M non voulu, rapport 03) |
| X01-R12 | Lanceur choisi au début ; alternance à chaque manche (simple : joueur suivant ; doublettes : équipe suivante, avec son premier lanceur) ; pas de règle particulière au changement de set | `matchLifecycle.ts:51-80,244-256` | WDF § 9.03, § 12.02 | **E** (sets) → **décision PO du 2026-11-20 : suivre le règlement WDF** ; le camp qui ouvre le match ouvre les sets impairs, l'autre les sets pairs ; correction sur `fix/x01-doubles-rotation` (`resolveSetOpeningStarterIndex`) |
| X01-R13 | Doublettes : rotation A1-B1-A2-B2 en manche 1, score par équipe ; **à partir de la manche 2, l'ordre global est conservé et seul l'index de départ est décalé** (`matchLifecycle.ts:62-69`, `287`) : l'équipe qui a ouvert le match lance A2 avant A1 dans les manches ouvertes par B | `matchLifecycle.ts:20-69,287` | WDF World Cup § 9.01/9.03 | **E** → correction sur la branche `fix/x01-doubles-rotation` (rotation centralisée `x01Rotation.ts`, ordre interne figé) ; ordre intra-équipe figé (WDF § 9.01, décision PO du 2026-11-20) |
| X01-R14 | Bouton RESTE : saisie du reste visé ; refus si reste > score, = score (« UTILISE MISS »), = 1 en Double-Out, ou écart > 180 | `views/MatchView.tsx:388-423` | — | M (aide de saisie) ; reste 1 en Master accepté : **E** → 045 |
| X01-R15 | Appui long 1/2/3 : sortie directe en n fléchettes si le reste est finissable | `views/MatchView.tsx:425-480`, `components/game/Keypad.tsx:59-71` | — | M |
| X01-R16 | Aide de sortie = table Double-Out quelle que soit la règle | `components/game/CheckoutHint.tsx:8-9` | — | **E** → 045 |
| X01-R17 | Robot : vise une sortie atteignable, sinon un placement ; en Master-Out laisse 1 et bloque | `src/application/x01Bot/x01BotTurn.ts:83-126` | — | **E** (Master) → 045 |

### 8.2 Cricket

| ID | Règle implémentée | Code | Règle usuelle | Statut |
|---|---|---|---|---|
| CRK-R01 | Cibles 15 à 20 et Bull | `utils/cricketLogic.ts:4` | [S3][S4] | C |
| CRK-R02 | Marques : simple 1, double 2, triple 3, simple bull 1, double bull 2 ; pas de triple bull | `cricketLogic.ts:25-65`, `components/game/CricketKeypad.tsx` | [S3] | C |
| CRK-R03 | Fermeture à 3 marques ; le surplus de la fléchette fermante compte en points | `cricketLogic.ts:50-56,70-77` | [S3] | C |
| CRK-R04 | Points = marques en surplus × valeur (bull = 25) tant qu'au moins un adversaire n'a pas fermé ; numéro fermé par tous = mort | `cricketLogic.ts:20-23,70-77` | [S3] | C |
| CRK-R05 | Victoire dès qu'un joueur a tout fermé avec un score ≥ chaque adversaire (contrôle après chaque fléchette) | `cricketLogic.ts:90-109`, `views/CricketGameView.tsx:123-127` | [S3] | C |
| CRK-R06 | Limite de 10/20/30 tours (défaut 20) par joueur ou équipe | `cricketLogic.ts:117-121`, `setupModel.ts:152-158` | 20 tours en compétition sur machine [S4] | M |
| CRK-R07 | À la limite : score, puis numéros fermés, puis marques | `cricketLogic.ts:123-135` | égalité = manche rejouée [S4] | M |
| CRK-R08 | Égalité persistante départagée par ordre alphabétique du nom | `cricketLogic.ts:136` | — | **E** → spec 047 |
| CRK-R09 | Une seule manche ; `legsToWin: 3` du setup ignoré | `views/CricketGameView.tsx:106-108` | manches multiples (usage) | M (config morte : **E** → spec 051) |
| CRK-R10 | 2-3 joueurs ou 2 équipes de 2 (rotation A1-B1-A2-B2) ; lanceur choisi à l'écran (pas de tir au bull saisi) | `setupModel.ts:63`, `CricketGameView.tsx:81-86,213-225` | « diddle » [S3] | M |
| CRK-R11 | Saisie par fléchette ; MISS ; « 3 MISS » borné aux fléchettes restantes du tour | `CricketGameView.tsx:140-189` | — | C |
| CRK-R12 | Résultat transmis dès la fin, sans annulation possible | `CricketGameView.tsx:95-104` | — | **E** → spec 047 |
| CRK-R13 | Variantes Cut-throat et sans points absentes | — | [S3][S4] | variante manquante → spec 051 |

### 8.3 Capital

| ID | Règle implémentée | Code | Règle usuelle | Statut |
|---|---|---|---|---|
| CAP-R01 | 1 à 4 joueurs, pas de doublettes ; une visite par objectif puis joueur suivant | `src/features/game-setup/setupModel.ts:65`, `src/features/capital/capitalGameModel.ts:101-136` | [S4] | C |
| CAP-R02 | 17 objectifs : Capital, 20, Suite, 19, 3 à côté, 18, 57, 17, Couleur, 16, Triple, 15, Double, 14, Moins de 21, 13, Centre | `utils/capitalLogic.ts:3-5` | 15 objectifs, autre ordre (capital, 20, côte à côte, 19, suite, 18, couleur, 17, double, 16, triple, 15, 57, 14, centre) [S4] | M (ordre, + 13, + Moins de 21) |
| CAP-R03 | Départ à 0 ; l'objectif Capital ajoute le total de la visite (0-180), toujours réussi | `capitalLogic.ts:73-76`, `components/game/CapitalKeypad.tsx:66-75` | « score de départ (le capital) » [S4] | C |
| CAP-R04 | Totaux impossibles (179…) acceptés pour le Capital | `CapitalKeypad.tsx:72`, `views/CapitalGameView.tsx:97` | — | **E** → spec 054 |
| CAP-R05 | Réussite : + points de l'objectif ; échec : score ÷ 2 arrondi au supérieur | `capitalLogic.ts:254-262` | [S4] | C |
| CAP-R06 | Numéros 20…13 : au moins une fléchette dans le numéro (S/D/T) ; + somme de ces fléchettes | `capitalLogic.ts:47-53,78-84` | [S4] | C |
| CAP-R07 | Suite : 3 valeurs consécutives distinctes (bull exclu, pas de 20→1) ; + somme des 3 | `capitalLogic.ts:86-100` | [S4] | C |
| CAP-R08 | 3 à côté : 3 secteurs voisins sur la cible (circulaire) **ou** simple bull + 2 secteurs voisins ; double bull invalide | `capitalLogic.ts:102-111,118-170` | 3 secteurs voisins [S4] | C + M (bull) |
| CAP-R09 | 57 : total exact en 1 à 3 fléchettes ; résolution dès que le total ≥ 57 ; + 57 | `capitalLogic.ts:71,177-186` | [S4] | C |
| CAP-R10 | Couleur : 3 couleurs différentes (simples noir/blanc, doubles/triples rouge/vert, bull vert, double bull rouge) ; une fléchette ratée = échec | `capitalLogic.ts:55-67,200-216` | [S4] | C |
| CAP-R11 | Triple : au moins un triple ; + somme des triples. Double : au moins un double (double bull compris) ; + somme des doubles | `capitalLogic.ts:113-116,172-175` | [S4] (« on additionne le résultat » : somme des doubles/triples ou de la visite [à confirmer]) | C |
| CAP-R12 | Moins de 21 : 3 fléchettes non ratées, total < 21 (identifiant technique `21_OU_MOINS` contradictoire) | `capitalLogic.ts:188-198` | absent de [S4] | M |
| CAP-R13 | Centre : au moins une fléchette dans le bull (25 ou 50) ; + somme des bulls | `capitalLogic.ts:218-221` | « demi-bulle comprise » [S4] | C |
| CAP-R14 | Fin quand tous ont joué les 17 objectifs ; vainqueur = meilleur score ; égalité → premier dans l'ordre de jeu (tri stable), pas d'ex æquo | `capitalGameModel.ts:189-191`, `views/CapitalGameView.tsx:140-142`, `src/app/useGameLifecycle.ts:138` | plus haut score [S4] | **E** (ex æquo non gérés) → spec 049 (RM-05) |
| CAP-R15 | Couleurs des boutons D/T différentes selon l'objectif | `CapitalKeypad.tsx:82-86,307,335,424-426` | — | **E** (UI) → spec 054 |

### 8.4 Triathlon (jeu propre à Bougnat Darts)

| ID | Règle implémentée | Code | Statut |
|---|---|---|---|
| TRI-R01 | 2 compétiteurs : 2 joueurs ou 2 équipes de 2 | `setupModel.ts:62` | M |
| TRI-R02 | Épreuves dans l'ordre Capital → Cricket → 501 | `setupPresentation.ts:69`, `src/features/triathlon/triathlonFlow.ts` | M |
| TRI-R03 | Premier compétiteur désigné à l'écran ; la règle affichée parle d'un tir à la bulle non saisi | `views/TriathlonGameView.tsx:210-215`, `setupPresentation.ts:73` | M (texte à aligner) |
| TRI-R04 | Capital individuel même en doublettes ; score d'équipe = somme | `TriathlonGameView.tsx:118-126`, `utils/triathlonScoring.ts:336-350` | M |
| TRI-R05 | Cricket par équipe, 1 manche, limite de tours de la configuration | `TriathlonGameView.tsx:108-116` | M |
| TRI-R06 | 501 Open-In / Double-Out, 1 manche | `TriathlonGameView.tsx:74-89` | M |
| TRI-R07 | Barème v1 : 501 20/14/10 + checkout 4, moyenne 5, fléchettes 5 ; Cricket rang 20/14 + MPR 5, « différence » 4, fermés 4 ; Capital rang 20/16 + score 5, régularité 4, pénalités 4 ; rangs denses | `src/domain/triathlon/triathlonScoringRules.ts:13-84`, `triathlonScoring.ts:106-121` | M |
| TRI-R08 | Bonus à tous les ex æquo ; aucun si la meilleure valeur ≤ 0 ; « plus bas » pour fléchettes (> 0) et pénalités | `triathlonScoring.ts:57-104` | M |
| TRI-R09 | Égalité au total → 501 de départage commencé par le premier compétiteur initial | `triathlonFlow.ts:144-166`, `TriathlonGameView.tsx:91-106` | M |
| TRI-R10 | Défaite serrée 501 toujours vraie ; rang Cricket sans le vainqueur réel ; bonus « moins de fléchettes » dépendant du lanceur ; doubles comptages | `triathlonScoring.ts:182-235,269-293,370-385` | **E** → spec 048 |

## 9. Parcours utilisateurs

Mainteneur : écrit un golden test `X01-R05 …` en lisant la règle et sa source. Joueur : ouvre « Règles » (setup, puis en partie via spec 049) et lit un résumé cohérent avec la référence.

## 10. Exigences fonctionnelles

- FR-01 Publier, après validation, un document de référence par jeu reprenant le §8, en distinguant C / M / E.
- FR-02 Chaque règle porte un identifiant stable (`X01-Rnn`, `CRK-Rnn`, `CAP-Rnn`, `TRI-Rnn`) ; un identifiant n'est jamais réutilisé.
- FR-03 Un écart (E) n'est jamais présenté comme une règle ; il renvoie à sa spec et disparaît du document à la correction (remplacé par la règle corrigée).
- FR-04 Chaque variante maison (M) est soit validée par le product owner, soit transformée en écart.
- FR-05 Les règles affichées dans l'application (`getRulesContent`) sont cohérentes avec la référence.
- FR-06 Les golden tests (spec 039) citent l'identifiant de règle couvert.

## 11. Exigences non fonctionnelles

- NFR-01 Français accentué, tableaux lisibles sans connaître le code.
- NFR-02 Chaque source externe est datée ; une règle sans source vérifiable est marquée [à confirmer].

## 12. Cas nominaux et alternatifs

Sans objet : spec documentaire (pas de parcours applicatif).

## 13. Cas limites

Règle modifiée par une spec en cours (045, 046, 047, 048) : la référence décrit l'état livré, avec mention « modifiée par la spec NNN ».

## 14. Gestion des erreurs

Sans objet : aucune exécution applicative.

## 15. Impacts architecturaux

Aucun code. Indirect : la référence fixe les règles que les specs 057/058 doivent préserver.

## 16. Impacts sur les données et les interfaces

Sans objet : aucune donnée ni interface modifiée.

## 17. Compatibilité avec l'existant

Les règles affichées au setup restent la vue courte ; la référence est la vue complète.

## 18. Dépendances

- V2-SDD-01 (spec 032) : conventions et gabarits.
- Alimente : V2-QA-01 (spec 039), V2-ARCH-03 (057), V2-ARCH-04 (058). Écarts traités par 045, 046, 047, 048, 049, 051, 054.

## 19. Critères d'acceptation

- AC-01 Le product owner a statué sur chaque règle M du §8 (validée ou requalifiée en E).
- AC-02 Le document publié contient 100 % des identifiants du §8 (ou leur remplacement tracé).
- AC-03 Chaque règle C ou M a au moins un golden test qui cite son identifiant (spec 039).
- AC-04 Aucune règle E n'apparaît dans les règles affichées de l'application comme comportement voulu.
- AC-05 Les 4 sources sont citées avec date de consultation.

## 20. Scénarios de tests

Relecture croisée code ↔ référence ; contrôle CI optionnel (V2-QA-10) : chaque identifiant cité dans `tests/` existe dans la référence.

## 21. Exigences de non-régression

Toute PR modifiant une règle met à jour la référence (case de la définition de terminé, spec 032).

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Référence obsolète | Moyen | Moyenne | Identifiants cités par les tests + DoD |
| Variante maison prise pour un bug (ou l'inverse) | Moyen | Moyenne | AC-01 |
| Sources officielles (PDC/WDF) non consultées | Faible | Élevée | Mention [non vérifié], relecture par un joueur licencié |

## 23. Décisions architecturales

Aucune ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Emplacement du document | a) `docs/regles/` (un fichier par jeu) ; b) un seul fichier ; c) dans les specs | a), selon l'organisation V2-DOC-02 | — |
| Q2 | Capital : garder la version maison (17 objectifs) par défaut ? (H.10) | a) maison par défaut + variante FR (15) en option ; b) FR par défaut ; c) maison seule, documentée | c) en V2, a) plus tard | — |
| Q3 | Cricket : critères maison « fermés » puis « marques » à la limite de tours | valider / remplacer par « manche rejouée » | valider (cf. spec 047) | — |
| Q4 | Faire relire la référence par un joueur licencié ? | oui / non | oui, avant publication | — |

## 25. Traçabilité

Rapports `03-games.md` §3.1-3.4, §2 ; `04-voice.md` (bust vocal, spec 003) ; compte rendu §C.5, §F.2, §H.10 ; specs 015, 016, 023, 032, 039, 045-049, 051, 053, 054, 057, 058.
