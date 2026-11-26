---
id: 058-counter-serializable-game-state
v2_id: V2-ARCH-04
titre: État de partie sérialisable et reducer pur par jeu
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: archi
priorite: P0
difficulte: L
recommandation: recommande
lot: 1
poids: 27
depend_de: [V2-QA-01]
remplace: []
remplacee_par: []
issue: '#226'
verifie_au_commit: 7b454d3
derniere_revue: 2026-11-26
---

# 058 — État de partie sérialisable et reducer pur par jeu

> **Statut : À VALIDER.** Cadrage actualisé le 2026-11-26 sur le code `7b454d3` ; les cibles et recommandations restent des propositions, sans décision ni autorisation d'implémenter.

## 1. Origine et contexte

- L'audit V2 du 2026-11-20 proposait une vérité métier sérialisable et testable hors React par jeu (rapports architecture, TV et jeux ; ADR-0001 proposée).
- Depuis, la reprise multi-jeux de la spec 010 est implémentée, avec validation terrain encore en attente ; le 180 Around the Clock (ATC180, spec 130) est un septième jeu. La reprise n'attend donc **pas** cette spec.
- L'enjeu résiduel est l'hétérogénéité des transitions, de l'annulation et des contrats de session, sans refaire les acquis de 010 ni présenter l'unification comme livrée.

## 2. Problématique

Les sept jeux publient déjà un instantané restaurable au shell, mais ils ne partagent pas un même modèle de session ni une même interface de commande. Certains utilisent déjà un reducer métier ; ailleurs, la vue combine transitions pures, piles d'annulation et état d'interface. X01 possède un contrat distinct des autres jeux. Une extraction sans migration des sessions existantes ou sans caractérisation des différences d'annulation pourrait casser une reprise qui fonctionne aujourd'hui.

## 3. Objectifs proposés

- O1 : caractériser les états, transitions et effets de chaque jeu, puis réduire la dispersion métier encore présente ; conserver les reducers et fonctions pures déjà utilisés.
- O2 : distinguer état métier/restaurable, saisie et présentation transitoires, horloge et effets externes ; rendre les transitions pertinentes testables sans montage React.
- O3 : étudier un contrat de session commun pour les sept jeux, X01 et Triathlon compris, sans confondre ce contrat cible avec les deux contrats existants.
- O4 : préserver l'annulation propre à chaque jeu, sa persistance et la compatibilité des sessions ; toute harmonisation visible reste à arbitrer.
- O5 : conserver les règles et parcours livrés, notamment robot, voix, lien partenaire, doublettes, places et reprise Triathlon.

## 4. État actuel vérifié — 2026-11-26, commit `7b454d3`

### Instantanés et transitions par jeu

| Jeu | État, transitions et publication existants | Annulation existante |
|---|---|---|
| X01 | `MatchView` héberge `MatchState` dans un `useState` ; `matchSubmission` appelle `submitTurn` de `src/application/scoring/matchLifecycle.ts`. La vue publie `MatchRuntimeSnapshot` : match, démarrage, temps, horodatage et pile ; ce type est **séparé** de `GameRuntimeSnapshot` (`views/MatchView.tsx`, `src/shared/session/persistedAppSession.ts`). La qualification et l'orchestration restent réparties entre application, features et vue ; l'unification relève de 057. | La vue efface d'abord la saisie en cours, puis restaure une volée depuis `undoStack`, y compris au-delà d'une fin de manche ; la pile est non bornée en mémoire et les 20 dernières étapes sont persistées. Le résultat final et l'accès à l'annulation dépendent du parcours d'écran. |
| Cricket | `cricketGameReducer` porte déjà scores, rotation, démarrage, fin et historique dans un `CricketGameState` ; la vue dispatch et publie ce state avec le chrono (`src/features/cricket/cricketGameModel.ts`, `views/CricketGameView.tsx`). | Une entrée par action : une fléchette ou un groupe de ratés. Pile non bornée en mémoire, 20 étapes persistées ; l'écran de fin permet de revenir avant confirmation. |
| Capital | `capitalGameReducer` porte déjà la partie, l'historique et `pendingResolution` ; `hasGameStarted` et les temporisations restent dans la vue, qui publie l'ensemble avec le chrono (`src/features/capital/capitalGameModel.ts`, `views/CapitalGameView.tsx`). | Une étape par saisie ; pile non bornée en mémoire, 20 étapes persistées. La résolution différée est reprogrammée depuis l'état en attente ; la fin peut être annulée avant confirmation des statistiques. |
| Killer | `assignKillerTarget` et `recordKillerDart` sont des transitions de domaine ; la vue conserve l'état et une pile séparée et publie les deux (`src/domain/killer/killer.ts`, `views/KillerGameView.tsx`). | 20 étapes en mémoire et au plus 20 persistées ; « Passer » peut regrouper plusieurs ratés en une action. L'écran du vainqueur n'expose actuellement que le retour aux jeux. |
| Gotcha | `recordGotchaTurn` est une transition de domaine ; la vue conserve état, pile et saisie et publie les deux premiers avec le chrono (`src/domain/gotcha/gotcha.ts`, `views/GotchaGameView.tsx`). | 30 étapes en mémoire, 20 persistées ; une étape correspond à une volée. L'écran du vainqueur n'expose actuellement que le retour aux jeux. |
| ATC180 | Les transitions `recordAtc180Dart`, `passAtc180Turn` et `undoAtc180` opèrent sur `Atc180State` ; la vue héberge l'état et publie état, démarrage et chrono (`src/domain/atc180/atc180.ts`, `views/Atc180GameView.tsx`). | Pas de pile d'instantanés : les volées et fléchettes courantes permettent de déduire l'annulation, y compris « Passer » et après la fin ; toutes les volées sont conservées au stockage, sans plafonnement à 20 étapes. |
| Triathlon | `triathlonFlowReducer` porte phase et résultats ; `TriathlonGameView` garde séparément l'instantané de l'épreuve courante et publie `flow` + `stage` + chrono. Capital, Cricket, 501 et départage 501 reçoivent **déjà** `restoredState` et `onStateChange` ; les tableaux sont recalculés depuis les résultats (`src/features/triathlon/triathlonFlow.ts`, `views/TriathlonGameView.tsx`). | L'annulation est celle de l'épreuve embarquée ; le flux n'expose pas une annulation générale entre épreuves. L'encodage borne la pile de l'épreuve courante selon son jeu. |

`App.tsx` transmet `onStateChange` et `restoredState` aux sept vues : `matchRuntime` pour X01, `gameRuntime` pour les six autres. `GameRuntimeSnapshot` est déjà une union discriminée **sans X01** ; les deux contrats ne sont pas unifiés (`src/shared/session/persistedAppSession.ts`). `useGameLifecycle` appelle toujours `createMatch(players, config)` pour tous les jeux ; hors X01, `currentMatch` sert notamment de porteur des joueurs et de la configuration (`src/app/useGameLifecycle.ts`, `App.tsx`). Supprimer ce porteur touche donc aussi la reprise, les résultats et la revanche.

En X01, `finishLeg` copie désormais `legsWon` et `setsWon` avant de les modifier (`src/application/scoring/matchLifecycle.ts`) ; `tests/unit/x01/doublesRotation.test.ts` protège notamment l'état d'entrée et l'annulation d'une fin de manche. Cela corrige un constat de l'audit, sans prouver à lui seul l'unification ou l'immutabilité de toutes les transitions.

En ATC180, `onFinish` est signalé au plus une fois par montage : `handleUndo` ne réinitialise pas `hasReportedFinish` (`views/Atc180GameView.tsx`). Le premier signal écrit un résultat dans l'historique local (`src/app/useGameLifecycle.ts`) ; après fin → annulation → nouvelle fin dans la même vue, cet historique peut donc conserver un classement différent du résultat affiché. Les tests existants couvrent l'annulation après fin et la restauration d'une fin, mais pas cette séquence complète (`tests/unit/atc180/atc180GameView.test.tsx`) : à caractériser sans présumer du correctif ni de son périmètre.

### Persistance, validation et chrono déjà livrés

- `PersistedAppSession` est au schéma **2** ; `sessionRecovery.ts` décode puis valide le contenu par jeu (`gameRuntime.ts`, `x01RuntimeValidation.ts`). Un X01 ancien sans version est repris au mieux ; les anciennes parties non-X01 en cours, une version inconnue ou des données invalides sont écartées avec avis. Une session de plus de sept jours expire silencieusement ; un instantané d'un autre jeu est écarté sans supprimer le reste.
- `appShell.ts` et `IndexedDBSessionRepository.ts` écrivent la session en localStorage et IndexedDB ; la restauration tente d'abord le repli local synchrone puis IndexedDB si nécessaire. L'écriture est regroupée sur 300 ms, forcée lors de `pagehide` ou du passage en arrière-plan ; un échec des deux stockages est signalé sans bloquer le jeu. Le dernier onglet qui écrit gagne (spec 010), pas de verrou multi-onglet.
- `storedSessionCodec.ts` compacte et restitue les piles X01, Cricket, Capital et Gotcha, borne aussi Killer et traite l'épreuve Triathlon imbriquée. La limite persistée de **20** est une décision déjà prise dans la spec 010 ; elle ne réduit pas les piles en mémoire et ne s'applique pas aux volées complètes d'ATC180.
- Les vues comptent encore le temps avec des intervalles. Elles capturent la valeur courante par référence lors d'un changement d'état, pas à chaque tic ; `gameTiming.ts` reprend le temps jusqu'à la dernière écriture, sans compter la période application fermée. Il existe un chrono Triathlon et un chrono pour son épreuve.

### Tests déjà présents

- Modèles et règles : `tests/unit/cricketGameModel.test.ts`, `tests/unit/capitalGameModel.test.ts`, `tests/unit/killerLogic.test.ts`, `tests/unit/gotchaLogic.test.ts`, `tests/unit/triathlonFlow.test.ts`, `tests/unit/application/matchLifecycle.test.ts` et `tests/unit/atc180/atc180Domain.test.ts`. Le reducer Cricket a déjà des tests de sérialisation, d'immuabilité et d'annulation ; cela ne prouve pas une interface commune pour tous les jeux.
- Reprise : `tests/unit/session/gameReload.test.tsx` monte les vues X01, Cricket, Capital, Killer, Gotcha et Triathlon, y compris les trois épreuves Triathlon et le départage ; `tests/unit/atc180/atc180GameView.test.tsx` et `tests/unit/atc180/atc180Session.test.ts` couvrent ATC180. Les tests `tests/unit/session/gameRuntimeValidation.test.ts`, `sessionRecovery.test.ts`, `appSessionRecovery.test.tsx`, `gameTiming.test.ts` et `persistedSize.test.tsx` couvrent validation, migration, codec, chronos et tailles représentatives.
- X01 et intégrations : `tests/unit/x01/matchViewDoublesRotation.test.tsx`, `matchViewCheckoutRules.test.tsx`, `matchViewOrderAndPlacements.test.tsx`, `matchViewVoicePrivacy.test.tsx`, `x01BotTurn.test.ts` dans le même dossier et `tests/unit/externalMatch/externalMatchContract.golden.test.ts`. Ces tests existent ; ils ne constituent pas à eux seuls les fixtures métier complètes proposées par 039.

## 5. Comportement cible proposé

Après arbitrage, définir pour les jeux retenus une frontière explicite entre état de partie, commandes/transitions, effets et présentation. Une union/adaptateur commun, voire un hook mince partagé, est une **option** à comparer à des contrats par jeu ; elle ne doit pas introduire une seconde vérité métier. L'horloge, l'identifiant et l'aléa sont fournis ou traités hors des transitions déterministes : `createMatch` utilise aujourd'hui `createId`, et le robot accepte une source `random` (`src/application/x01Bot/x01BotTurn.ts`).

La publication et la reprise existantes restent opérationnelles pendant chaque étape. Un nouveau format commun ne peut remplacer les deux formats actuels sans stratégie de compatibilité et mise à jour des validateurs et du codec.

## 6. Périmètre résiduel proposé

### Inclus, sous réserve d'arbitrage

- Inventaire des sept jeux ; clarification des états métier, actions, effets et données réellement restaurées.
- Réutilisation des reducers Cricket/Capital et des transitions existantes ; extraction ciblée des responsabilités encore dans les vues, sans déplacer mécaniquement tout le code.
- Interface de session et éventuelle orchestration communes ; traitement du porteur `MatchState` non-X01 si son remplacement est retenu.
- Adaptation coordonnée du contrat persisté, de son codec et de sa validation **si** un état ou son enveloppe change ; tests de migration et de non-régression.
- Composition Triathlon, y compris transitions et départage ; intégration X01 coordonnée avec 057 et découpage de vue avec 061.

### Exclu

- Réimplémenter la reprise, le versionnement, les horodatages ou l'annulation persistée déjà livrés par 010.
- Changer les règles de jeu ou les modes de saisie (057 et specs métier concernées), ajouter un journal/correction historique (059), un registre (060), une diffusion TV ou un port vocal.
- Découper `MatchView`/`App` pour leur seule composition (061), ou modifier politiques de couverture et CI sans PR dédiée.

## 7. User stories

- En tant que joueur, je retrouve après mise à jour la partie et les possibilités d'annulation déjà conservées aujourd'hui.
- En tant que contributeur, je teste une suite de transitions métier sans dépendre de l'interface et je sais quelle représentation est publiée.
- En tant que mainteneur, je peux faire évoluer une vue ou une intégration sans créer une seconde source de règles.

## 8. Règles métier

- RM-01 : aucune règle de jeu ni aucun parcours visible ne change sans décision spécifique.
- RM-02 : préserver les unités d'annulation, profondeurs en mémoire et accès actuels à la fin ; une commande refusée ne doit pas créer de volée. Le contrat précis d'un éventuel motif de refus reste à définir.
- RM-03 : préserver les 20 étapes **persistées** décidées par 010 pour les piles concernées, ainsi que l'historique complet servant à l'annulation ATC180 ; ne pas confondre cette borne avec les limites en mémoire.
- RM-04 : une éventuelle ouverture de l'annulation après victoire Killer/Gotcha ou entre épreuves Triathlon est un changement de comportement à arbitrer, pas une capacité déjà livrée.

## 9. Parcours utilisateurs

Inchangés : préparation → démarrage/ordre de passage → partie → résultat/statistiques ou revanche. La reprise est automatique selon 010. ATC180 accepte aussi l'entraînement seul ; Triathlon compose plusieurs épreuves.

## 10. Exigences fonctionnelles proposées

- FR-01 : inventorier les sept contrats d'état et identifier, pour chacun, ce qui doit survivre au rechargement et ce qui reste transitoire.
- FR-02 : pour les transitions extraites, garantir déterminisme et absence de mutation de l'entrée ; horloge, génération d'identifiant, aléa du robot, stockage et navigation restent hors du cœur pur.
- FR-03 : si un contrat commun est retenu, décrire ses variantes et ses résultats/refus, avec un adaptateur unique par jeu et sans réimplémenter les reducers existants.
- FR-04 : conserver la publication au shell à l'initialisation et sur changements pertinents, sans émission ni écriture provoquée par un seul tic du chrono.
- FR-05 : préserver les sémantiques d'annulation du §4, la reprise des piles, les fins de manche et les fins de partie propres à chaque jeu.
- FR-06 : si le `MatchState` porteur est remplacé, prévoir la lecture des sessions existantes et adapter tous les consommateurs de joueurs/configuration, résultats et revanche.
- FR-07 : préserver le snapshot composite Triathlon, ses résultats terminés, ses épreuves et leurs chronos ; caractériser la reprise sur les transitions et le départage 501.
- FR-08 : coordonner la partie X01 avec la commande de 057 et les extractions de 061 ; ne pas créer trois moteurs ou trois piles concurrents.
- FR-09 : tenir à jour validation, codec, version/migration si nécessaire et tests pour toute modification d'un instantané ; conserver les avis de données invalides et d'échec de stockage.

## 11. Exigences non fonctionnelles proposées

- NFR-01 : aucune nouvelle dépendance runtime ni backend ; frontières du nouveau code conformes à `AGENTS.md`, sans prétendre que la spec 056 est livrée.
- NFR-02 : pas de régression de réactivité, de volume stocké ni d'écritures au tic ; mesurer sur des parties représentatives plutôt que présumer un gain.
- NFR-03 : appliquer la gouvernance de couverture de 029 ; la couverture d'un reducer ne justifie pas automatiquement le retrait de sa vue des exclusions Sonar.

## 12. Cas nominaux et alternatifs

- Cricket : une fléchette ou plusieurs ratés groupés → transition → snapshot existant → reprise et annulation de la même action.
- X01 : une volée, une fin de manche puis une reprise conservent ordre, scores et annulation ; robot et voix respectent leurs parcours actuels.
- Triathlon : reprise de Capital, Cricket, 501 ou départage avec résultats antérieurs et snapshot de l'épreuve correspondante.

## 13. Cas limites

Doublettes et rotation, X01 à 3/4 joueurs et places jouées, limite de volées et départage au bull, saisie ou confirmation non validée au rechargement, Capital en attente de résolution, ATC180 après « Passer » ou fin puis annulation et nouvelle fin, parties longues, résultat déjà signalé, horloge arrêtée ou système modifié.

## 14. Gestion des erreurs

Conserver la validation et les avis actuels : une session corrompue ou de version inconnue est écartée, une panne d'écriture est signalée sans empêcher de jouer. Ne pas masquer une exception inattendue comme une commande refusée ; le traitement des erreurs d'une éventuelle interface commune est à définir.

## 15. Impacts architecturaux envisagés

Transitions pures dans les couches appropriées, effets et chronos à la périphérie, façades `src/features/*` pour les nouveaux imports depuis les vues. L'emplacement et l'éventuel hook générique restent ouverts (Q4 et Q7) ; aucun store global ou bus n'est présumé nécessaire.

## 16. Impacts sur les données et les interfaces

Les contrats actuels sont `matchRuntime` et `gameRuntime` dans `PersistedAppSession`, non une enveloppe uniforme `{ gameType, state }` pour X01. Une modification doit préserver ou migrer les sessions v2 et l'ancien X01 sans version, les historiques compactés, `currentMatch`, l'état des écrans et le contexte partenaire. Versionner seulement selon la compatibilité réelle ; documenter également la stratégie de retour arrière.

## 17. Compatibilité avec l'existant

Préserver reprises et annulations du §4, chronos et durée du résultat, confirmation vocale et confidentialité, temporisations du robot, format partenaire `v=1`, scores et places dans l'ordre attendu, ainsi que l'écran composite Triathlon. Ne pas supposer que le lien partenaire fournit des volées : il prépare un match et récupère son résultat.

## 18. Dépendances et séquencement

- **039 / V2-QA-01** : dépendance déclarée en métadonnées, encore `a-valider` ; compléter et faire arbitrer la caractérisation métier avant les extractions concernées, sans ignorer les tests déjà présents.
- **057 / V2-ARCH-03** : encore `a-valider` ; la convergence des commandes et règles X01 relève de 057. L'étape X01 de 058 doit utiliser le résultat retenu de 057 ; les autres jeux n'en dépendent pas automatiquement.
- **061 / V2-ARCH-11** : encore `a-valider` ; coordonner les interfaces X01, chronos et effets avec le découpage de `MatchView`, sans faire de 058 un prérequis global implicite de 061 ni bloquer 057 sur 061.
- **010** est implémentée, validation terrain en attente : ses contrats et décisions sont une base à préserver, pas un chantier futur bloqué par 058. **056** et les ADR 0001/0002/0003 restent proposées ; **070/072** sont implémentées.
- 059, 060, 079, 084, 089 et 109 sont des consommateurs ou chantiers possibles, pas des livraisons promises par cette spec.

## 19. Critères d'acceptation proposés

- AC-01 : pour chaque jeu retenu, des fixtures de début, milieu, fin et annulation survivent au cycle réel encodage → JSON → décodage → validation → reprise, avec équivalence métier et traitement explicite des champs optionnels.
- AC-02 : les transitions extraites sont testées sans React, avec état d'entrée gelé et mêmes données d'entrée → même résultat ; les effets, l'horloge et l'aléa ne s'exécutent pas dans ces transitions.
- AC-03 : les tests protègent les unités et profondeurs d'annulation du §4, dont les 20 étapes persistées et l'exception ATC180 ; une évolution visible exige l'arbitrage correspondant.
- AC-04 : les vues publient et restaurent le bon instantané, sans écriture sur un tic seul ; une session v2 et un X01 ancien représentatifs restent reprenables ou suivent une migration explicitement validée.
- AC-05 : Triathlon reprend chaque épreuve et son départage avec résultats antérieurs et chrono cohérents, y compris les transitions et l'annulation offerte dans l'épreuve.
- AC-06 : non-régression X01, robot, voix, partenaire `v=1`, places, limite de volées et doublettes ; pas de double envoi de résultat lors d'une reprise.
- AC-07 : si le porteur est remplacé, les parcours de lancement, reprise, résultats et revanche de chaque jeu fonctionnent avec les sessions antérieures.

## 20. Scénarios de tests

Réutiliser les suites citées au §4 et compléter les cas réellement manquants après caractérisation 039 : gel et déterminisme, migration/retour arrière, données corrompues, limites de piles, reprise pendant résolution/transition, non-duplication de résultat et parties longues. Les E2E/smoke existants sont exécutés **uniquement en CI**, jamais localement.

## 21. Exigences de non-régression

Conserver les suites existantes de moteurs, vues, sessions, X01 et partenaire citées au §4 ; vérifier également `tests/unit/session/gameReload.test.tsx`, `tests/unit/atc180/` et les tests de configuration `tests/unit/components/setupViewExternalMatch.test.tsx`.

## 22. Risques

| Risque | Impact | Mitigation proposée |
|---|---|---|
| Régression ou rejet des sessions v2 et de leurs piles compactées | Perte de partie | Fixtures réelles, validation, migration testée et plan de retour arrière avant changement de format |
| Confondre annulation d'une fléchette, d'une volée ou d'un groupe de ratés | Changement visible | Caractériser chaque jeu, préserver les limites actuelles et arbitrer tout changement |
| ATC180 : annulation puis nouvelle fin après signalement | Résultat affiché potentiellement différent de l'historique local | Caractériser la séquence et décider séparément du traitement, sans le masquer dans une extraction |
| Désynchroniser phase et épreuve Triathlon ou rejouer une fin | Résultats/chrono erronés | Tests par phase et à la frontière de transition, y compris départage et effet de fin |
| Divergence 057/058/061, robot ou voix | Règles dupliquées et régression | Une commande X01 coordonnée, aléa/effets à la périphérie, PRs ordonnées |
| Accroissement des snapshots ou des rendus | Stockage ou réactivité dégradés | Tests de taille représentatifs, écritures hors tics et mesures ciblées |

## 23. Décisions architecturales

ADR-0001 (état par jeu), 0002 (commandes X01), 0003 (persistance), 0004 (journal) et 0005 (projection) sont **proposées**, non acceptées par cette mise à jour. La spec 010 et son comportement effectivement livré constituent néanmoins la base de compatibilité.

## 24. Questions ouvertes au product owner

| # | Question | Options / recommandation non validée | Décision |
|---|---|---|---|
| Q1 | Priorité et valeur du reliquat maintenant que la reprise est livrée ? | Maintenir P0 / reclasser ; réévaluer séparément l'unification et ses consommateurs | — |
| Q2 | Harmoniser les profondeurs ou unités d'annulation en mémoire ? | Conserver les différences du §4 / harmoniser après étude d'impact ; ne pas modifier la borne persistée 010 sans nouvelle décision | — |
| Q3 | Étendre l'annulation après victoire Killer/Gotcha ou entre épreuves Triathlon ? | Conserver les écrans et frontières actuels / proposer un changement visible distinct | — |
| Q4 | Où placer les transitions métier extraites ? | `src/domain/<jeu>` / modules `src/features/<jeu>` existants ; respecter la façade des vues et coordonner 056 | — |
| Q5 | Ordre et livraisons ? | Migrer par jeu avec caractérisation préalable ; coordonner l'étape X01 après le choix de 057 et avec 061 | — |
| Q6 | Inclure ATC180 dans l'éventuelle unification ? | Oui, en préservant son annulation dérivée / le laisser sur son contrat déjà opérationnel | — |
| Q7 | Quelle interface de session pour X01 et les autres jeux ? | Conserver des contrats/adaptateurs distincts / union ou hook commun ; étudier la compatibilité des formats | — |
| Q8 | Retirer le `MatchState` porteur des jeux non-X01 ? | Le conserver / migrer joueurs et configuration avec compatibilité démontrée | — |

La question historique d'une première persistance de l'annulation est dépassée : 010 conserve déjà 20 étapes pour les piles concernées. Une extension au-delà, ou un journal en 059, reste à arbitrer.

## 25. Traçabilité

- Audit historique : `docs/v2/audit/02-architecture.md` §2.2, §4, §6.1 ; `docs/v2/audit/07-tv-mode.md` §2.1 ; `docs/v2/audit/03-games.md` §5.1 ; compte rendu B.3, C.9, H.9. Ses constats du 2026-11-20 ne décrivent plus tous le code.
- Specs liées : 010, 022, 029, 039, 056, 057, 059, 060, 061, 070, 072, 079, 084, 089, 109, 130.
- Vérification documentaire du code au commit `7b454d3`, le 2026-11-26 ; aucune implémentation de 058 n'est déclarée.
