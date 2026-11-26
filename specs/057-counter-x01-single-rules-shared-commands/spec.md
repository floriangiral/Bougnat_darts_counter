---
id: 057-counter-x01-single-rules-shared-commands
v2_id: V2-ARCH-03
titre: Règles X01 uniques et commandes partagées (keypad, voix, robot, partenaire)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: archi
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 40
depend_de: [V2-QA-01]
remplace: []
remplacee_par: []
issue: '#219'
verifie_au_commit: 7b454d3
derniere_revue: 2026-11-26
---

# 057 — Règles X01 uniques et commandes partagées (keypad, voix, robot, partenaire)

> **Statut : À VALIDER.** Cadrage seulement : aucune proposition ci-dessous n'est validée et aucune implémentation de la spec 057 n'est autorisée avant les décisions du product owner. Les constats datés du 2026-11-20 sont conservés comme historique, pas comme description du code actuel.

## 1. Origine et contexte
- Audit V2 : `reports/02-architecture.md` §2.3, §6.4, §7 T3, CA-5 ; rapport jeux §3.1 ; compte rendu B.3 et C.9. Les constats d'origine étaient vérifiés au commit `508dfa6`.
- Une partie des règles est déjà partagée depuis les specs 045, 046 et 054. La qualification des intentions et les contrôles d'interface restent répartis entre `MatchView`, les features, l'application et le domaine.
- ADR-0002 est une **proposition**, pas la preuve d'une décision ni d'une livraison de 057.

## 2. Problématique
Les entrées n'empruntent pas toutes la même chaîne de validation : notamment le parseur vocal peut refuser un trop accepté au keypad, le RESTE vocal est converti en total avant validation, et le robot appelle directement le moteur. Cela crée des divergences observables et rend une future extraction risquée ; cela ne prouve pas que toutes les règles sont dupliquées ni que le moteur mute encore son entrée.

## 3. Objectifs proposés
- O1 : une source de vérité par règle X01 et par intention, en réutilisant les règles déjà partagées.
- O2 : examiner une commande commune aux saisies pertinentes, sans inventer d'émetteur de volées partenaire.
- O3 : rendre explicites les qualifications, attestations et refus, sans confondre validation linguistique et règle de jeu.
- O4 : préserver et démontrer l'immutabilité des transitions, y compris les fins et départages.
- O5 : ne changer aucun comportement visible ni format persisté sans arbitrage explicite ; les écarts vocaux sont soumis à Q2 et Q5.

## 4. État actuel vérifié au commit `7b454d3`

### 4.1 Parcours réellement exécutés
| Entrée | Chemin et comportement actuel | Preuves |
|---|---|---|
| Keypad et scores rapides | `Keypad` → `handleSubmitScore` ou `handleQuickScore` → `processScoreSubmission` → `buildScoreSubmissionResult` → `submitTurn`. Le total `0` est accepté comme visite sans points ; les totaux irréalisables sont refusés. Les contrôles de démarrage et de verrouillage sont dans la vue. | `components/game/Keypad.tsx` ; `views/MatchView.tsx:635-680,807-812` ; `src/features/x01/scoring/matchSubmission.ts:58-115` ; `tests/unit/x01/matchScoring.test.ts` |
| RESTE au keypad | `handleRemainingSubmit` refuse avant ouverture, une cible hors bornes, égale au score courant (« UTILISE MISS »), ou `1` en Double/Master-Out ; un écart > 180 est refusé. Sinon il soumet la différence à la validation ordinaire, qui refuse notamment `163` avec « SCORE IMPOSSIBLE ». Le tampon manuel est limité à trois chiffres. | `views/MatchView.tsx:683-723,1104-1108` ; `tests/unit/x01/matchViewOpening.test.tsx`, `matchViewCheckoutRules.test.tsx` |
| Sortie manuelle / appui long | Une sortie réalisable ouvre toujours le choix de fléchettes, même si seule la valeur 3 est possible ; le minimum dépend de la règle. L'appui long 1/2/3 (450 ms) ferme directement si l'équipe est ouverte, la sortie possible et le minimum respecté. La garde actuelle teste bien `checkoutIsPossible`, non la référence de fonction. | `matchSubmission.ts:95-98,127-151` ; `views/MatchView.tsx:756-786,835-846,900-902,1130-1150` ; `components/game/Keypad.tsx` ; `tests/unit/components/keypads.test.tsx`, `tests/unit/x01/matchViewCheckoutRules.test.tsx` |
| TROP explicite | Le bouton a un chemin distinct : `canSubmitBustTurn` / `canX01VisitBust` vérifient si une suite physique de trois fléchettes au plus peut faire trop, selon l'ouverture et la sortie ; `submitBustTurn` enregistre un trop à 0 en trois fléchettes. `handleBust` ne déclenche pas l'overlay « TROP ! » du total calculé. | `views/MatchView.tsx:814-825,894-897` ; `src/domain/scoring/x01DeclaredBust.ts` ; `src/application/scoring/matchLifecycle.ts:408-417` ; `tests/unit/x01/x01DeclaredBust.test.ts`, `matchViewCheckoutRules.test.tsx` |
| Voix | `onUtterance` construit une proposition avec le reste courant et `dartsAlreadyThrown: 0` ; le parseur refuse un total supérieur au reste. Après confirmation tactile par OK, la proposition non invalide est soumise comme un **total**, via `processScoreSubmission`, pas automatiquement. Les séquences partielles ne sont pas préremplies, mais une proposition non invalide portant un score peut être confirmée par OK. | `views/MatchView.tsx:486-507,672-680` ; `src/features/x01/voice/dartsSpeechParserShared.ts:126-136`, `voiceProposalModel.ts` ; `tests/unit/dartsSpeechParser.test.ts`, `tests/unit/x01/voiceProposalModel.test.ts`, `matchViewOpening.test.tsx` |
| Robot | `generateX01BotTurn` choisit un candidat à partir des totaux réalisables et d'une probabilité de sortie, puis `buildX01BotTurnResult` appelle directement `submitTurn` ; le candidat actuel ne dépasse pas le reste et, depuis un reste jouable d'au moins 2, ne laisse pas 1 en Double/Master. L'aléa est injectable et le tour est planifié après 700 ms. Le setup n'autorise le robot qu'en simple à deux joueurs et Open-In ; une ancienne partie robot restaurée en Double/Master-In est normalisée en Open-In. | `src/application/x01Bot/x01BotTurn.ts:36-103` ; `views/MatchView.tsx:953-1039` ; `src/features/game-setup/setupModel.ts:84-88,123-140` ; `matchLifecycle.ts:463-468` ; `tests/unit/x01/x01BotTurn.test.ts`, `tests/unit/app/restoredX01Session.test.ts` |
| Lien partenaire | `v=1` transmet des noms et une configuration X01, pas de volées ; le setup est verrouillé et la saisie emprunte les chemins humains ci-dessus. Le retour vérifie identité/configuration et sérialise vainqueur, manches, sets éventuels, statistiques optionnelles et classement à 3/4 camps. Une action humaine de fin appelle le retour synchronement, ce qui compte pour l'ouverture de l'onglet partenaire. | `src/features/external-match/externalMatchLink.ts:53-56,170-179,221-257,395-418,468-499` ; `views/SetupView.tsx:287-291,350-363` ; `App.tsx:414-440,510-530` ; `tests/unit/externalMatch/externalMatchContract.golden.test.ts`, `tests/unit/components/setupViewExternalMatch.test.tsx` |

### 4.2 Règles, cycle et état
- `src/domain/scoring/reachableTotals.ts` calcule les totaux réalisables, y compris 0 ; X01, robot, Gotcha et Capital l'utilisent. `possibleTurnScores.ts` et `ScoreInput.ts` sont des accès à cette même source, pas deux ensembles indépendants.
- `x01CheckoutRules.ts` fournit finissabilité, nombre minimal de fléchettes, aide et trop : reste négatif, reste 1 en Double **ou** Master, ou score égal au reste mais non finissable. Une sortie impossible est enregistrée comme trop avec « SORTIE IMPOSSIBLE ». Les statistiques, le robot et la façade de la vue consomment ces règles ; `ScoringRules` délègue lui aussi à ce module.
- `x01OpeningRules.ts` dérive l'ouverture par équipe et par manche depuis une visite positive non trop. Avant ouverture Double/Master, un total non nul impossible à ouvrir est refusé ; sinon une confirmation est demandée, sauf pour un trop. « Non » enregistre 0 ; une ouverture et une sortie dans la même visite enchaînent les deux confirmations. L'ordre des contrôles compte : Double-In, reste 40, total réalisable 171 → « OUVERTURE IMPOSSIBLE », pas un trop. Preuves : `matchSubmission.ts:66-98`, `views/MatchView.tsx:828-833`, `tests/unit/x01/matchScoring.test.ts`, `matchViewOpening.test.tsx`.
- `submitTurn` calcule le trop et bloque à la limite de volées, mais ne vérifie pas lui-même la réalisabilité du total, l'ouverture ou le nombre de fléchettes : ces garanties viennent de `buildScoreSubmissionResult`, des contrôles de la vue ou du candidat robot. `buildCheckoutConfirmResult` appelle directement `submitTurn` ; la modale filtre les nombres inférieurs au minimum et le raccourci vérifie ce minimum (`matchLifecycle.ts:362-406`, `matchSubmission.ts:58-115,127-151`, `views/MatchView.tsx:756-766,1141-1149`).
- `recordTurn` / `finishLeg` gèrent scores, historique, manches/sets et rotation ; la limite de volées, le bull et les places jouées ont des transitions distinctes (`matchLifecycle.ts:217-260,277-417`, `x01Rotation.ts`). À 3/4 camps, l'ordre est imposé avant de jouer et les places peuvent se jouer dans la manche en cours ; les volées et classements influencent statistiques et retour partenaire (spec 132).
- `finishLeg` copie désormais `legsWon` et `setsWon` avant écriture (`matchLifecycle.ts:277-280`, correction `029048b`). `tests/unit/x01/doublesRotation.test.ts` compare l'état précédent en fin de set ; `tests/unit/application/matchLifecycle.test.ts` vérifie le score de manches précédent après bull. Un sondage en mémoire avec gel profond de l'entrée a aussi réussi pour fin de manche, de set et de match ; ce sondage n'est pas une suite de non-régression pérenne.
- L'interface annule avec une pile d'instantanés `cloneMatchState`, pas avec `undoTurn` (`views/MatchView.tsx:581-634`). Cette copie ne clone pas `config` : ne pas la qualifier de copie profonde générale. `MatchRuntimeSnapshot` publie `match`, démarrage, temps et pile ; la session versionnée conserve les **20** derniers pas sous forme compacte et les valide à la reprise (`src/shared/session/persistedAppSession.ts:45-81`, `src/features/game-session/storedSessionCodec.ts:21-32`, `src/features/x01/session/x01RuntimeValidation.ts:66-79`). Les confirmations en attente sont locales à la vue et réinitialisées à la restauration. Le Triathlon embarque aussi `MatchView` et son instantané (`views/TriathlonGameView.tsx:90-104,340-365`).

### 4.3 Voix : écarts de chemin et confiance
- En Open-In, reste 40, voix « 60 » : le parseur refuse ; keypad `60` : trop à 0. En revanche, avant ouverture, le contrôle d'ouverture peut refuser un total pourtant supérieur au reste : toute équivalence doit conserver cette priorité ou être décidée explicitement.
- L'annonce « reste N » est d'abord convertie en `score = reste courant − N` (`dartsSpeechParserScoring.ts:51-110`, `voiceProposalModel.ts:13-41`), puis OK soumet ce total. Un sondage en mémoire de ces fonctions a donné : équipe ouverte, reste 40 / « reste 40 » → total 0 appliqué, alors que RESTE manuel demande « UTILISE MISS » ; équipe ouverte, reste 4 en Master-Out / « reste 1 » → total 3, trop, alors que RESTE manuel refuse ; Double-In non ouvert, reste 501 / « reste 441 » → demande d'attestation, alors que RESTE manuel refuse. Ce sont des divergences de chemin, pas des corrections décidées ; aucun test de composant ne caractérise ces trois comparaisons ici.
- Le `ScoreValidator.validateRemainingTarget` historique n'est pas interchangeable à l'aveugle : pour 501 → 338 (total implicite 163), il renvoie `impossible_remaining`, tandis que le chemin réel affiche « SCORE IMPOSSIBLE ». Il ne gère pas non plus la garde d'ouverture de la vue (`src/domain/scoring/services/ScoreValidator.ts:16-42`, `views/MatchView.tsx:697-723`).
- La confiance de l'utterance reçue par `buildVoiceScoreProposal` est ignorée (`_confidence`) ; le contexte fourni par `MatchView` ne la contient pas. En sondage mémoire, « 60 » avec une confiance de 0,1 produit une proposition valide, alors que l'appel direct au parseur avec cette confiance est invalide. Cela ne supprime pas la confirmation tactile ; le traitement de la confiance relève de 003, à coordonner sans le modifier implicitement ici (`voiceProposalModel.ts:13-19`, `dartsSpeechParser.ts:35-50`, `tests/unit/dartsSpeechParser.test.ts`).

### 4.4 Historique corrigé et filet actuel
| Constat au `508dfa6` | Vérification au `7b454d3` |
|---|---|
| `finishLeg` mutait `legsWon` / `setsWon` ; preuve historique : `git show 508dfa6:src/application/scoring/matchLifecycle.ts`. | Corrigé depuis `029048b` ; conserver les tests d'immutabilité, ne pas annoncer un correctif encore à faire. |
| Quatre listes de bogeys, trois calculs de finissabilité, deux ensembles de scores, sortie impossible confirmée, Master-Out à 1 non bust, garde de raccourci inopérante. | Constats devenus obsolètes : règles calculées partagées, garde booléenne et tests actuels ci-dessus ; specs 045 et 054 `implementee`, validation terrain en attente. |
| Le robot importait `features/possibleTurnScores`. | Il importe maintenant `domain/scoring/reachableTotals` et `x01CheckoutRules`, pas cette feature. |
| `src/domain/scoring` était décrit globalement comme non branché. | Les anciens `ScoreValidator` / `ScoringRules` et les use cases `RecordThrow`, `UndoThrow`, `StartGame`, `EndLeg`, `EndGame` ne sont pas le chemin de l'interface ; **les modules de règles actuels dans le même dossier sont utilisés par les chemins d'exécution de l'application à ce commit**. `undoTurn` est utilisé par le use case historique et les tests, pas par l'annulation de `MatchView`. |

Tests existants : `tests/unit/reachableTotals.test.ts` ; `tests/unit/x01/{matchScoring,matchViewCheckoutRules,matchViewOpening,doublesRotation,x01DeclaredBust,x01BotTurn,voiceProposalModel}.test.*` ; `tests/unit/application/{matchLifecycle,matchStats,x01OrderAndPlacements}.test.ts` ; tests de reprise et contrat partenaire cités ci-dessus. La suite de fixtures X01 métier proposée par 039 n'est pas pour autant livrée ni validée : les tests dorés `externalMatchContract.golden.test.ts` vérifient des URL `v=1`, pas la caractérisation complète demandée par 039.

## 5. Comportement cible proposé — non validé
Réutiliser les prédicats déjà actifs et étudier une entrée de commande pure, par exemple `applyX01Command(état, commande) → { état, résultat }`. Le résultat distinguerait au moins refus, attestation d'ouverture à demander, sortie à confirmer, visite appliquée et trop. Les noms, l'emplacement, le contexte de démarrage/verrouillage et le périmètre des commandes restent à décider (Q1, Q3, Q6).

La commande ne peut pas se limiter naïvement au seul `MatchState` : `hasGameStarted`, les confirmations en attente, les overlays et le temps sont aujourd'hui hors de celui-ci. L'aléa du robot et l'horloge doivent rester hors d'une transition déterministe, ou être fournis explicitement. Les changements vocaux éventuels dépendent de Q2/Q5 et de la spec 003 ; le lien partenaire ne devient pas une entrée de volées par cette proposition.

## 6. Périmètre proposé
### Inclus, si validé
- Règles et qualification des saisies X01 : total, RESTE, raccourcis, confirmations d'ouverture et de sortie, TROP explicite ; branchement de la voix confirmée et du robot.
- Tests de non-régression de l'immutabilité déjà corrigée, des manches/sets, des doublettes, de la limite et du bull, des places, du Triathlon et de la reprise.
- Adaptation ciblée des contrôles métier vocaux seulement si Q2/Q5 sont tranchées ; aucune télémétrie ni persistance de la source présupposée.
### Exclu
- Redéfinition des règles livrées par 045/046/054, grammaire ou transport de reconnaissance (003/075), saisie fléchette par fléchette sauf décision ultérieure.
- Refonte générique de l'état et du journal (058/059), suppression des seuls éléments historiques non branchés (056), nouveau protocole de volées partenaire.
- Refaire la correction de `finishLeg`, les tables déjà partagées ou la garde d'appui long déjà corrigée.

## 7. User stories proposées
- Joueur : comprendre pourquoi une annonce vocale ou un RESTE est refusé ou enregistré en trop ; l'alignement entre sources reste soumis à Q2/Q5.
- Joueur contre le robot : conserver des sorties valides et une partie jouable avec les règles actuellement permises.
- Contributeur : modifier une règle à sa source et vérifier les transitions sans dépendre de React.

## 8. Règles métier à préserver, sous réserve d'arbitrage
- RM-01 : total réalisable en trois fléchettes, de 0 à 180 sauf 163, 166, 169, 172, 173, 175, 176, 178 et 179 ; 0 est une visite valide, **pas** un refus.
- RM-02 : conserver l'ouverture Open/Double/Master, l'attestation par équipe et manche, ses priorités de validation et l'enchaînement ouverture puis sortie ; le robot reste limité à Open-In sans décision contraire.
- RM-03 : conserver le trop calculé par la règle de sortie et le TROP déclaré, distinct d'un total à 0. Une ouverture impossible peut être refusée avant le calcul du trop (§4.2).
- RM-04 : une sortie manuelle réalisable demande le nombre de fléchettes, même si une seule valeur est proposée ; l'appui long éligible reste une confirmation directe.
- RM-05 : pour RESTE **manuel**, conserver les contrôles et les messages du §4.1 ; l'équivalence avec RESTE vocal est à arbitrer (Q5).
- RM-06 : conserver l'ordre et la rotation, les manches/sets, la limite de volées, le bull, les places jouées et les statistiques associées (030/132).

## 9. Parcours utilisateurs
Référence actuelle : score tapé → OK → retour ou confirmations ; voix → proposition → confirmation tactile explicite (003) → soumission ; robot → candidat après 700 ms. Les changements de traitement d'une annonce et les effets sur RESTE sont des **options**, pas des parcours déjà validés.

## 10. Exigences fonctionnelles proposées
- FR-01 : conserver une source de référence par règle, notamment `reachableTotals.ts` partagé avec d'autres jeux et `x01CheckoutRules.ts` ; déplacer ou supprimer un fichier seulement après migration de tous ses consommateurs.
- FR-02 : étudier une commande typée et une qualification communes ; expliciter les données nécessaires aux confirmations et aux gardes, ainsi que l'absence de mutation de l'entrée (Q1/Q3/Q6).
- FR-03 : préserver l'annulation actuelle, sa pile et ses 20 derniers pas persistés ; toute évolution de format ou de sémantique relève d'un arbitrage coordonné avec 010/058/059 (Q7).
- FR-04 : relier les saisies humaines, la proposition vocale confirmée et le robot à la qualification retenue ; ne pas effacer les contraintes propres au bouton TROP, au bull, aux places ou à l'appui long (Q6).
- FR-05 : produire le candidat robot hors de la transition déterministe et conserver les bornes, probabilités, fléchettes et restrictions du setup. Un candidat généré avec l'algorithme actuel ne dépasse pas le reste.
- FR-06 : si Q2 retient l'alignement, faire traiter une annonce de total comme le keypad **après** les mêmes contrôles d'ouverture ; sinon conserver le refus vocal. Si Q5 retient l'alignement de RESTE, en spécifier les conséquences et messages.
- FR-07 : une éventuelle métadonnée de source est interne et non persistée par défaut ; le traitement de `partner`, qui n'émet aucune volée, est à décider (Q8).
- FR-08 : préserver la garde d'appui long déjà correcte, le minimum de fléchettes et le comportement de la confirmation simple.
- FR-09 : les transitions n'altèrent pas leur état d'entrée ; couvrir les fins déjà corrigées, les départages et les placements.
- FR-10 : conserver le résultat `v=1`, les statistiques, les reprises et l'appel synchrone depuis une action humaine de fin pour le retour partenaire, sauf décision contractuelle séparée.

## 11. Exigences non fonctionnelles proposées
- NFR-01 : aucune nouvelle dépendance npm ni coût récurrent.
- NFR-02 : règles sans React, vues, composants, features ni infrastructure ; la règle de lint envisagée par 056 n'existe pas encore et n'est pas un contrôle acquis.
- NFR-03 : seuils de la spec 029 respectés ; gel profond et comparaison de l'état précédent sur les transitions pertinentes.
- NFR-04 : qualification synchrone, sans lecture implicite d'horloge ni aléa, sans régression de réactivité (020).

## 12. Cas nominaux et alternatifs proposés
- 501, Open-In, total 60 → visite appliquée, reste 441.
- Open-In, reste 40, voix « 60 » → refus actuel ; trop seulement si Q2 est validée, après contrôle d'ouverture.
- Reste 40, RESTE manuel 0 → choix du nombre de fléchettes ; un appui long éligible ferme directement.
- Robot à 32 → candidat déterministe avec aléa injecté ; sortie autorisée ou placement inférieur au reste.

## 13. Cas limites à caractériser
- `0` accepté ; 181 et 163 refusés ; reste 1 en Double/Master-Out ; total égal au reste mais sortie impossible ; ouverture et sortie dans la même visite.
- RESTE égal au score, cible 1, total implicite impossible et équipe non ouverte ; comparaison avec les annonces vocales correspondantes selon Q5.
- Fin de manche, set, match ou place, doublettes, 3/4 camps, bull après limite, annulation et restauration ; X01 du Triathlon et retour partenaire.
- Saisie et confirmations pendant les états d'interface de transition, aperçu robot et bull : les gardes actuelles ne sont pas toutes contenues dans `MatchState`.

## 14. Gestion des erreurs proposée
Étudier des motifs internes stables pour les refus, puis les mapper aux messages existants ; les libellés RESTE et voix ne sont pas interchangeables sans Q2/Q5. Une confirmation en attente ou un refus ne doit pas enregistrer de visite ; aucune exception ne doit être nécessaire pour une saisie utilisateur.

## 15. Impacts architecturaux envisagés
- Les règles génériques de totaux restent partageables par Gotcha et Capital ; les prédicats X01 actifs peuvent rester dans leurs fichiers ou être déplacés (Q1/Q3). Un seul fichier physique n'est pas nécessaire pour avoir une source unique par règle.
- Le chemin réel pourrait exposer des intentions et des résultats typés ; les classes historiques ne constituent pas une base substituable sans caractérisation (§4.3). Le robot n'a déjà plus d'import `features/`.
- L'adaptation React conserve les confirmations, minuteries, retours, annulation et effets de navigation. Un reducer commun à 058 reste une hypothèse, non une décision acquise.

## 16. Impacts sur les données et les interfaces
Objectif proposé : format existant `MatchState` / `MatchRuntimeSnapshot` et contrat partenaire inchangés. C'est une contrainte à démontrer, non une garantie déjà acquise pour une future architecture ; si un nouveau champ métier ou une migration est nécessaire, coordonner versionnement, codec, validation et reprise avec 010/058 (Q7). Les types de commande envisagés seraient internes.

## 17. Compatibilité avec l'existant
Préserver les comportements livrés en 045/046/054, les parties simples, doublettes, 3/4 camps, Triathlon et robot ; reprendre les sessions antérieures et les 20 pas persistés ; préserver les résultats partenaire `v=1`. Les seules modifications visibles envisagées sont les options vocales Q2/Q5, si le PO les accepte explicitement.

## 18. Dépendances et ordre proposé
- **039 / V2-QA-01** : prérequis déclaré dans l'en-tête ; toujours `a-valider` au commit de référence. Les tests existants ne remplacent pas automatiquement ses fixtures métier. Pas d'extraction avant un filet caractérisé et validé selon la décision sur 039.
- **056 / V2-ARCH-01** : `a-valider`. Son ancien FR-08 au `7b454d3` envisageait la suppression de `src/domain/scoring` après 057 ; le dossier contient aussi des modules actifs, dont `reachableTotals.ts` consommé par Gotcha/Capital. La 056 actualisée distingue les classes historiques des règles actives (FR-07) ; leur sort reste à arbitrer, sans suppression en bloc. L'ordre « socle 056 → bascule 057 → éventuel nettoyage dans 056 » est une recommandation ouverte, ni un prérequis formel supplémentaire ni une condition réciproque de clôture. L'outillage des frontières reste proposé.
- **058 / V2-ARCH-04** : `a-valider`. Son ordonnancement propose que la migration X01 suive 057 ; la compatibilité des commandes, de l'instantané déjà sérialisable, de l'undo persisté et du reducer envisagé doit être convenue avant de déplacer l'état. 057 ne présuppose pas que 058 soit déjà livrée.
- **061 / V2-ARCH-11** : `a-valider`, son en-tête dépend de V2-ARCH-03 (057). Le découpage de `MatchView` est en aval de la commande envisagée et ne doit pas redéfinir les règles ; coordonner séparément avec 058 pour éviter deux extractions concurrentes.
- **045, 046, 054** : `implementee`, validation terrain en attente ; leurs règles et le total partagé sont des contraintes actuelles, pas des corrections à refaire. **003** : invariant de confirmation tactile existant, révision V2 encore à valider ; coordonner Q2/Q5. **010, 030, 132** : protections actuelles de la reprise, du contrat et des places. 054 n'est plus un travail futur débloqué par 057.
- Les études 062/075/084 peuvent consommer le résultat si elles sont validées ; elles ne créent pas d'émetteur partenaire aujourd'hui.

## 19. Critères d'acceptation proposés — après décisions
- AC-01 : les règles utilisées par X01, statistiques, robot et autres jeux conservent une source par concept, sans copie divergente ; une revue des imports et des tests de comportement remplace l'exigence trompeuse « un seul fichier ».
- AC-02 : total 0 accepté ; 163/181 refusés ; Double/Master-Out à 1 et sortie impossible donnent le résultat et les messages actuels ; Double-In non ouvert, reste 40, total 171 est refusé avant le trop.
- AC-03 : score voix supérieur au reste et les trois divergences RESTE de §4.3 suivent les décisions Q2/Q5, avec tests unitaires **et** de composant ; aucune validation vocale automatique.
- AC-04 : gel profond avant chaque transition caractérisée : continuation, trop calculé/déclaré, ouverture et sortie, fin de manche/set/match, bull et place ; l'état d'entrée est inchangé.
- AC-05 : robot avec aléa injecté : sorties jouables, placements bornés et même résultat métier pour une intention équivalente. Ne pas exiger d'obtenir un candidat dépassant le reste par `random` : le générateur actuel le borne. Si une interface de candidat artificiel est retenue, tester séparément sa qualification.
- AC-06 : appui long impossible ou avant ouverture sans fermeture ; minimum respecté ; confirmation classique et TROP explicite conservés, ainsi que l'ordre et les gardes d'interface.
- AC-07 : doublettes, ordre et places 3/4 camps, limite/bull, statistiques, Triathlon, undo et reprise de session gardent leurs résultats ; les URL dorées existantes du partenaire restent identiques, les rangs 3/4 sont préservés et le retour reste synchrone.
- AC-08 : les scénarios métier X01 retenus par 039 sont validés puis rejoués avant/après, hors changements explicitement décidés ; les tests E2E/smoke existants sont exécutés **uniquement en CI**.

## 20. Scénarios de tests proposés
- Unitaires : tables Open/Double/Master, ouverture et sorties combinées, RESTE et TROP déclaré, transitions gelées, candidats robot à aléa fixé, limite/bull/places, statistiques et contrat.
- Composants jsdom : `MatchView` keypad, RESTE, appui long, confirmations, voix simulée et restauration ; fakes existants dans `tests/unit/x01/voiceBrowserFakes.ts`.
- E2E : X01, Triathlon et partenaire existants en CI seulement ; ne pas lancer de smoke/E2E, serveur ou navigateur local.

## 21. Non-régression et preuves de cadrage
Le 2026-11-26, au code `7b454d3`, **15 fichiers / 223 tests unitaires** ciblés ont réussi : score, sorties, ouverture, ordre/places, robot, TROP, parseur et proposition vocale, lifecycle, partenaire, keypad et reprise. **5 fichiers / 121 tests** supplémentaires ont réussi : doublettes, totaux, statistiques et validation/reprise. Commandes et limites détaillées dans `plan.md` ; Node local `26.13.0`, npm `11.20.0` (références du dépôt : Node `26.13.1`, npm `12.2.3`). Ce résultat n'est ni une validation métier de 039 ni une recette E2E.

## 22. Risques
| Risque | Impact | Mitigation proposée |
|---|---|---|
| Refactoriser les anciens use cases au lieu du chemin réel, ou supprimer les règles actives avec 056 | Élevé | Cartographier les consommateurs, migrer avant suppression ; tests X01, Gotcha et Capital. |
| Changer silencieusement les priorités d'ouverture, les messages RESTE ou les annonces vocales | Élevé | Décisions Q2/Q5 ; tableaux de cas et tests de composant avant bascule. |
| Modifier implicitement le traitement de la confiance vocale en rebranchant le parseur | Moyen | Caractériser la proposition actuelle et coordonner toute évolution avec 003 ; conserver la confirmation tactile. |
| Oublier TROP déclaré, limite/bull, places, rotation et statistiques | Élevé | Scénarios dédiés, y compris doublettes et 3/4 camps ; comparer les résultats partenaire. |
| Corrompre l'undo, les sessions ou le Triathlon en changeant la forme de l'état | Élevé | Gels, codec/validateur, restauration de formats antérieurs et pile de 20 ; coordination 010/058. |
| Perdre l'ouverture synchrone du retour partenaire, ou ses valeurs `v=1` | Élevé | Test de la chaîne de fin utilisateur et contrats dorés ; recette navigateur en CI. |
| Figer des incohérences actuelles comme règles validées | Moyen | Distinguer caractérisation et verdict métier (039), sans traiter les observations anciennes comme des défauts actuels. |

## 23. Décisions architecturales
ADR-0001, 0002, 0008 et 0009 sont **proposées** (`docs/adr/README.md`). Leur application à cette spec, un éventuel reducer commun à 058 et l'absence de port générique restent à décider ; aucun statut d'ADR n'est modifié par ce cadrage.

## 24. Questions ouvertes — aucune décision prise
| # | Arbitrage PO / mainteneur | Options | Recommandation non validée | Décision |
|---|---|---|---|---|
| Q1 | Base des règles et sort du domaine historique, avec 056 | Réutiliser les classes historiques après caractérisation / partir du chemin réel et conserver ou déplacer les modules de règles actifs | Partir du chemin réel ; ne supprimer que les classes effectivement devenues inutiles après migration des consommateurs | — |
| Q2 | Total vocal supérieur au reste | Conserver le refus / appliquer les mêmes contrôles et, si éligible, le trop du keypad | Alignement après contrôle d'ouverture, sans supprimer la confirmation tactile ; coordonner 003 | — |
| Q3 | Emplacement et frontière de la commande | `domain/x01`, application ou autre découpage ; règles génériques à part | Règles pures partagées, placement selon la frontière retenue avec 056/058 | — |
| Q4 | Granularité fléchette par fléchette | Ajouter une intention par fléchette maintenant / conserver les totaux de visite | Conserver les totaux ; 046 est livrée par attestation, sans saisie par fléchette | — |
| Q5 | « RESTE N » vocal | Garder la conversion en total actuelle / appliquer les mêmes contrôles et messages que RESTE manuel | Étudier l'alignement, notamment égalité, cible 1 et ouverture ; changement visible à valider | — |
| Q6 | Portée des commandes et contexte de garde | Centraliser TROP, choix d'ordre, bull et places / conserver certaines transitions dédiées ; expliciter état et confirmations hors `MatchState` | Préserver toutes les transitions, puis décider leur point d'entrée commun avec 058/061 | — |
| Q7 | État, confirmation et undo | Conserver format et pile actuels / migrer avec 010/058/059 | Conserver le format, la reprise et 20 pas persistés ; aucune migration implicite | — |
| Q8 | Métadonnée `source` et partenaire | Réserver `partner` sans émetteur / ne pas prévoir de source partenaire avant besoin ; persistance ou non | Métadonnée interne non persistée si utile, sans télémétrie ni nouveau contrat | — |

## 25. Traçabilité
- Audit d'origine : `reports/02-architecture.md` §2.3, §6.4, T2, T3, CA-5 ; `reports/03-games.md` §3.1 ; compte rendu B.3, C.9, H.24 ; code historique `508dfa6`.
- Relecture du code : `7b454d3`, 2026-11-26 ; constats et preuves actuelles en §4. Le SHA renseigne l'état examiné, pas une implémentation ni une validation de 057.
- Specs liées : 003, 010, 016, 029, 030, 039, 045, 046, 054, 056, 058, 059, 061, 062, 075, 084, 132.
