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
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 057 — Règles X01 uniques et commandes partagées (keypad, voix, robot, partenaire)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
- Audit V2 : rapport architecture (`reports/02-architecture.md` §2.3, §6.4, §7 T3, CA-5), rapport jeux (§3.1 « Duplication de règles »), compte rendu consolidé B.3 et C.9.
- Les règles X01 sont dispersées entre la couche application, la couche features, la vue `MatchView` et un domaine « officiel » non branché. Chaque nouvelle entrée de score (voix mains libres, robot, partenaire, futur capteur) risque d'ajouter une variante de règle.
- ADR liée : ADR-0002 (règles X01 uniques et commandes partagées).

## 2. Problématique
Une même volée X01 n'est pas qualifiée de la même façon selon qu'elle vient du keypad, du bouton « RESTE », de la voix ou du robot ; les règles existent en plusieurs copies et le moteur mute son entrée, ce qui interdit toute extraction ou diffusion fiable.

## 3. Objectifs
- O1 : une seule source de vérité pour les règles X01 (scores possibles, sorties possibles, bust, fin de manche).
- O2 : une seule commande métier par intention (`SubmitVisit`, `SubmitRemaining`, `ConfirmCheckout`, `ChooseStarter`), appelée par toutes les sources d'entrée.
- O3 : le moteur qualifie le résultat (accepté, bust, fin à confirmer, refusé) ; aucun parseur ni aucune vue ne décide d'un bust.
- O4 : immutabilité garantie des transitions (aucune mutation de l'état d'entrée).
- O5 : zéro changement de comportement visible hors corrections de règles décidées ailleurs (spec 045) et hors alignement voix = keypad (Q2).

## 4. État actuel vérifié dans le code
- [vérifié] Moteur réellement exécuté : `submitTurn` (`src/application/scoring/matchLifecycle.ts:259-291`) ; bust calculé l.264 (`remaining < 0` ou reste 1 en Double Out seulement).
- [vérifié] **Mutation** : `finishLeg` (`src/application/scoring/matchLifecycle.ts:215-232`) incrémente `nextMatch.legsWon[teamId]` (l.217) et `nextMatch.setsWon[teamId]` (l.220), puis remet `legsWon` à zéro (l.221), alors que `nextMatch` partage les objets `legsWon`/`setsWon` de l'état d'entrée (copie superficielle l.275-282) : l'état précédent est modifié.
- [vérifié] Validation de saisie : `buildScoreSubmissionResult` (`src/features/x01/scoring/matchSubmission.ts:39-88`) ; passe en `checkout_confirm` dès que `score === currentScore` (l.59) sans vérifier la finissabilité selon la règle.
- [vérifié] Quatre copies des restes non finissables en Double Out (159, 162, 163, 165, 166, 168, 169) : `src/domain/scoring/services/ScoringRules.ts:4`, `src/features/x01/scoring/checkoutEligibility.ts:3`, `src/application/scoring/matchStats.ts:4`, `src/application/x01Bot/x01BotTurn.ts:11`.
- [vérifié] Trois implémentations de « sortie possible » : `isCheckoutPossible` (`checkoutEligibility.ts:5-15`), `ScoringRules.isCheckoutPossible` (`ScoringRules.ts:25-35`), `isCheckoutCandidate` (`x01BotTurn.ts:28-34`).
- [vérifié] Deux ensembles de scores possibles : `POSSIBLE_TURN_SCORES` (`src/features/x01/scoring/possibleTurnScores.ts:1-20`) et `ScoreInput` (`src/domain/scoring/valueObjects/ScoreInput.ts`).
- [vérifié] Validation « RESTE » réimplémentée dans la vue : `handleRemainingSubmit` (`views/MatchView.tsx:388-423`) duplique `ScoreValidator.validateRemainingTarget` (`src/domain/scoring/services/ScoreValidator.ts:16-44`), qui n'est appelé que par `RecordThrow` (tests uniquement).
- [vérifié] Le robot contourne la validation de saisie : `buildX01BotTurnResult` appelle `submitTurn` directement (`src/application/x01Bot/x01BotTurn.ts:144`).
- [vérifié] La voix applique sa propre règle : `validateScoreAgainstContext` refuse un score supérieur au reste (`src/features/x01/voice/dartsSpeechParserShared.ts:126-136`) alors que le keypad accepte ce même score comme bust (« TROP ! », `matchSubmission.ts:63-79`). Contexte vocal figé à `dartsAlreadyThrown: 0` (`views/MatchView.tsx:191-198`).
- [vérifié] Raccourci de checkout : `if (!isCheckoutPossible) return;` (`views/MatchView.tsx:429`) teste la **fonction importée** (toujours définie) et non le booléen calculé l.533 : la garde est inopérante.
- [vérifié] Les use cases `RecordThrow`, `UndoThrow`, `StartGame`, `EndLeg`, `EndGame` (`src/application/scoring/*.ts`) ne sont importés que par `src/application/scoring/index.ts` et par les tests (`tests/unit/application/scoringUseCases.test.ts`, `tests/unit/x01/scoringDomain.test.ts`).
- [vérifié] `undoTurn` (`matchLifecycle.ts:293-316`) ne franchit pas une fin de manche et ne rouvre pas un match terminé ; seul `UndoThrow` l'utilise.
- [vérifié] Dépendance inversée : `src/application/x01Bot/x01BotTurn.ts:4` importe `src/features/x01/scoring/possibleTurnScores`.

## 5. Comportement cible
Un module de règles X01 pur (sans React, sans horloge, sans aléa) expose les prédicats de règles et une fonction de commande :
`applyX01Command(state, command) → { state, outcome }`, où `command` porte une `source` (`keypad`, `remaining`, `checkout_shortcut`, `voice`, `bot`, `partner`) et où `outcome` vaut `applied | bust | checkout_to_confirm | rejected(reason)`.
Le keypad, le bouton « RESTE », les raccourcis, la voix et le robot construisent une commande et l'envoient à cette fonction ; la vue n'interprète que `outcome` pour afficher un retour. Le contenu des règles (finishes impossibles, Master-Out, ouverture) reste décidé par les specs 045 et 046 et s'applique automatiquement à toutes les sources.

## 6. Périmètre
### Inclus
- Module unique de règles X01 et suppression des copies (restes non finissables, scores possibles, sortie possible, validation du reste).
- Commandes X01 typées et fonction de commande pure, avec `source`.
- Correction de l'immutabilité de `finishLeg`.
- Branchement keypad, RESTE, raccourcis, checkout direct, voix (proposition validée → commande), robot.
- Correction de la garde inopérante `views/MatchView.tsx:429`.
### Exclu
- Le contenu des règles : finishes impossibles, Master-Out, aide checkout (spec 045) ; Double/Master-In (spec 046).
- Le parseur vocal et sa grammaire (spec 003, V2-VOICE-01) ; le port de reconnaissance (spec 075, V2-VOICE-04).
- La sortie de l'état X01 hors de la vue et la persistance générique (spec 058) ; le journal (spec 059).
- La suppression du domaine non branché et des stubs (spec 056).

## 7. User stories
- En tant que joueur, je veux qu'un score annoncé à la voix soit traité exactement comme le même score tapé, afin de ne pas être surpris par un refus ou un bust différent.
- En tant que joueur contre le robot, je veux que le robot respecte les mêmes règles de sortie que moi, afin que la partie soit équitable et se termine.
- En tant que contributeur, je veux modifier une règle X01 à un seul endroit, afin d'éviter les divergences.

## 8. Règles métier
- RM-01 : le score d'une volée est un total réalisable en 3 fléchettes : 0 à 180 sauf 163, 166, 169, 172, 173, 175, 176, 178, 179 (calcul vérifié) — une seule source.
- RM-02 : la qualification bust / fin / continuation dépend uniquement de l'état, du score, du nombre de fléchettes et de la règle de sortie configurée.
- RM-03 : un score réalisable mais supérieur au reste est un **bust** (volée à 0, joueur suivant), quelle que soit la source.
- RM-04 : une fin (reste 0) n'est appliquée qu'après confirmation du nombre de fléchettes lorsque plusieurs valeurs sont possibles (comportement actuel conservé).
- RM-05 : « RESTE N » équivaut à `SubmitVisit(score = reste courant − N)` après les mêmes contrôles (N hors bornes → « SCORE RESTANT IMPOSSIBLE » ; N = reste courant → « UTILISE MISS »).

## 9. Parcours utilisateurs
Inchangés : saisie keypad → validation → retour visuel ; voix → proposition pré-remplie → validation tactile (invariant de la spec 003) → même commande ; tour du robot après 700 ms (`views/MatchView.tsx:582`) → même commande.

## 10. Exigences fonctionnelles
- FR-01 : un module unique (proposition : `src/domain/x01/rules.ts`) contient l'ensemble des scores possibles, les restes non finissables par règle de sortie, `canFinishOn(reste, règle)`, la qualification du bust et le nombre minimal de fléchettes ; toutes les autres copies sont supprimées.
- FR-02 : une fonction pure `applyX01Command(state, command)` traite `SubmitVisit{score, source}`, `SubmitRemaining{remaining, source}`, `ConfirmCheckout{darts, source}`, `ChooseStarter{playerId}` et renvoie `{state, outcome}`.
- FR-03 : l'annulation reste gérée par la pile d'états de la vue dans cette spec (sémantique inchangée) ; sa généralisation relève des specs 058 et 059.
- FR-04 : keypad, bouton RESTE, raccourcis rapides (`src/features/x01/hooks/useMatchShortcuts.ts:47`), appui long checkout, proposition vocale validée et robot passent tous par FR-02.
- FR-05 : le robot ne produit qu'un **score candidat** ; sa qualification (bust, fin) est faite par FR-02.
- FR-06 : la voix ne qualifie plus de bust ; un score annoncé supérieur au reste est transmis au moteur qui renvoie `bust` (sous réserve de Q2, coordonné avec la spec 003).
- FR-07 : l'`outcome` expose la `source` de la volée (non persistée dans cette spec) pour de futures statistiques locales sans télémétrie.
- FR-08 : la garde du raccourci checkout utilise la règle du module et non la fonction importée.
- FR-09 : aucune transition ne modifie l'état d'entrée (`finishLeg` inclus).
- FR-10 : la source `partner` est réservée dans le type mais n'a pas d'émetteur en V2 (le lien `v=1` de la spec 030 ne transmet pas de volées).

## 11. Exigences non fonctionnelles
- NFR-01 : aucune nouvelle dépendance npm ; coût récurrent 0 €.
- NFR-02 : module de règles sans import de React, `views/`, `components/`, `src/features/` ni `src/infrastructure/` (contrôlé par la règle ESLint de la spec 056).
- NFR-03 : couverture du module ≥ seuils de la spec 029 ; tests d'immutabilité par gel profond.
- NFR-04 : aucune régression de réactivité (spec 020) : la commande reste synchrone.

## 12. Cas nominaux et alternatifs
- Nominal : 501, volée 60 au keypad → `applied`, reste 441.
- Alternatif : reste 40, voix « soixante » → `bust` (« TROP ! »), comme au keypad.
- Alternatif : reste 40, « RESTE 0 » → `checkout_to_confirm` puis `ConfirmCheckout{darts}`.
- Alternatif : robot à 32 → score candidat → même qualification qu'un humain.

## 13. Cas limites
- Score 0 (MISS), 181 et plus, total non réalisable (163) → `rejected`.
- Reste 1 en Double Out ; reste 1 en Master Out (règle fixée par la spec 045, appliquée à toutes les sources).
- Fin de manche en mode Sets, fin de match ; doublettes (`buildDoublesRotation`, `matchLifecycle.ts:20`).
- Saisie pendant la transition de manche ou l'aperçu de victoire du robot (verrou clavier conservé, `views/MatchView.tsx:529`).

## 14. Gestion des erreurs
`rejected(reason)` porte un code stable (`impossible_score`, `impossible_remaining`, `same_score_use_miss`, `not_started`, `locked`) ; la vue mappe chaque code vers les libellés existants. Aucune exception n'est levée pour une saisie utilisateur.

## 15. Impacts architecturaux
- Domaine : nouveau module `src/domain/x01/` (règles + commandes), sans dépendance sortante hors noyau de types (spec 056).
- Application : `submitTurn` devient un détail interne du module (ou y est déplacé avec ré-export transitoire) ; `x01BotTurn` cesse d'importer `src/features/`.
- Features/vue : `matchSubmission.ts` se réduit au mapping `outcome → retour visuel` ; `MatchView` n'implémente plus de règle.
- Pas de port générique d'entrée de score (ADR-0009, étude 062) : le type de commande suffit.

## 16. Impacts sur les données et les interfaces
- `MatchState` inchangé : format persisté identique, aucune migration.
- Nouveaux types internes `X01Command` et `X01Outcome`, non publics et non versionnés tant qu'aucun consommateur externe n'existe.

## 17. Compatibilité avec l'existant
Sessions persistées, lien partenaire `v=1` (spec 030), robot (spec 016), voix (spec 003) : comportement identique hors corrections de règles validées (spec 045) et hors alignement du bust vocal (Q2).

## 18. Dépendances
- Prérequis : V2-QA-01 (spec 039) — golden tests X01 validés métier avant extraction.
- Coordonnées : V2-GAMES-01 (045) et V2-GAMES-02 (046) fournissent le contenu des règles ; V2-VOICE-01 (003) adapte le parseur ; V2-ARCH-01 (056) supprime le code mort après bascule.
- Débloque : V2-ARCH-11 (061), V2-ARCH-15 (062), V2-VOICE-04 (075), V2-TV-02 (084), V2-GAMES-30 (054).

## 19. Critères d'acceptation
- AC-01 : un `grep` des listes de restes non finissables et des fonctions de « sortie possible » dans `src/`, `views/`, `components/`, `utils/` ne renvoie qu'un seul fichier source de règles (preuve : sortie de commande dans la PR).
- AC-02 : X01 501, reste 40 ; saisir 60 au keypad, annuler, puis valider 60 proposé par la voix → même `outcome = bust` et même affichage « TROP ! » (test unitaire de la commande + test de composant).
- AC-03 : pour chaque fixture golden de la spec 039 (fin de manche, fin de set, fin de match), l'état d'entrée de `applyX01Command` est inchangé (gel profond, aucune exception).
- AC-04 : avec `random` injecté, le robot dont le score candidat dépasse le reste obtient un `bust` qualifié par le moteur.
- AC-05 : un appui long checkout sur un reste non finissable selon la règle ne déclenche aucune commande (test de composant `MatchView`).
- AC-06 : la suite golden X01 (spec 039) passe à l'identique avant et après la bascule, hors cas modifiés par la spec 045.
- AC-07 : `src/application/x01Bot/x01BotTurn.ts` n'importe plus rien de `src/features/`.

## 20. Scénarios de tests
- Unitaires : table de vérité du module (scores 0-180 × Open/Double/Master) ; commandes par source ; immutabilité ; RESTE (bornes, égalité, reste 1).
- Composants : `MatchView` keypad / RESTE / raccourci / voix (fakes existants `tests/unit/x01/voiceBrowserFakes.ts`).
- E2E : smoke X01 et partie liée partenaire (`tests/e2e/external-match-link.smoke.spec.ts`) inchangés.

## 21. Exigences de non-régression
Golden tests X01 (039), `tests/unit/application/matchLifecycle.test.ts`, `tests/unit/x01/matchScoring.test.ts`, `tests/unit/x01/x01BotTurn.test.ts`, `tests/unit/x01/voiceProposalModel.test.ts`, E2E partenaire.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Régression du chemin X01 principal | Élevé | Moyenne | Caractérisation préalable (039), une PR par source d'entrée |
| Changement perçu côté voix (bust au lieu de refus) | Moyen | Élevée | Décision Q2, libellé identique au keypad |
| Figer des bugs de règles dans les golden tests | Élevé | Moyenne | Fixtures validées métier (039) ; corrections via 045 |
| Recouvrement avec 056 sur `src/domain/scoring` | Faible | Moyenne | Q1 tranchée avant implémentation |

## 23. Décisions architecturales
- ADR-0002 (règles X01 uniques et commandes partagées) — décision principale.
- ADR-0001 (état sérialisable par jeu) : la fonction de commande X01 devient le reducer X01 de la spec 058.
- ADR-0008 (port de reconnaissance vocale) : les intentions vocales sont converties en commandes de cette spec.
- ADR-0009 : pas de port générique d'entrée de score.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Base du module unique | (a) rebrancher `src/domain/scoring` ; (b) partir du chemin réel et supprimer `src/domain/scoring` | (b), en reprenant `validateRemainingTarget` s'il passe les golden tests (compte rendu H.24) | — |
| Q2 | Bust annoncé à la voix | (a) bust comme au keypad ; (b) refus avec message | (a) : cohérence des sources, confirmation tactile inchangée | — |
| Q3 | Emplacement du module | `src/domain/x01/` ou `src/application/x01/` | `src/domain/x01/` (règles pures, ADR-0001) | — |
| Q4 | Saisie fléchette par fléchette | Prévoir `SubmitDart` maintenant ou non | Non ; seulement si la spec 046 retient la saisie par fléchette (H.11) | — |

## 25. Traçabilité
- Rapports : `reports/02-architecture.md` §2.3, §6.4, T2, T3, CA-5 ; `reports/03-games.md` §3.1 ; compte rendu B.3, C.9, H.24.
- Specs liées : 003, 016, 029, 030, 039, 045, 046, 054, 056, 058, 061, 062, 075, 084.
- Code vérifié au commit `508dfa6`.
