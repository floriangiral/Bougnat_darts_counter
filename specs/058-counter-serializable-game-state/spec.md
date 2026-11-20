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
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 058 — État de partie sérialisable et reducer pur par jeu

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
- Audit V2 : rapport architecture (§2.2, §4.2, §4.6, §6.1, CA-1, T1), rapport TV (§2.1, §5.2), rapport jeux (§5.1, §6.1), compte rendu C.9 (« problème central : la vérité métier n'est pas dans le domaine »).
- Cette fondation conditionne la reprise de toutes les parties (spec 010), la TV multi-jeux (spec 089), la voix multi-jeux (spec 079), le cadre de jeu commun (spec 049) et le futur contrat avec `Bougnat_Darts_Tournaments` (spec 109).
- ADR liée : ADR-0001.

## 2. Problématique
Hors X01, l'état d'une partie vit éclaté dans des `useState` de vues React : il n'est ni sérialisable d'un bloc, ni observable par le shell, ni testable sans rendu, ce qui provoque la perte silencieuse des parties au rechargement et bloque la diffusion.

## 3. Objectifs
- O1 : chaque jeu possède un état JSON-sérialisable unique et un reducer pur `(état, commande) → état`.
- O2 : les vues de jeu ne détiennent plus que de l'état d'interface (modales, saisie en cours, animations).
- O3 : le shell reçoit un instantané de partie (`GameRuntimeSnapshot`) après chaque transition métier, pour tous les jeux, sur le modèle de X01.
- O4 : une sémantique d'annulation unique (commande `Undo`) pour tous les jeux.
- O5 : comportement visible inchangé pour l'utilisateur, jeu par jeu.

## 4. État actuel vérifié dans le code
- [vérifié] X01 : `useState<MatchState>` (`views/MatchView.tsx:81`), remonté via `onStateChange` (`views/MatchView.tsx:211-217`) vers `setMatchRuntime` (`App.tsx:360`).
- [vérifié] Cricket : état métier réparti dans `orderedPlayers`, `states`, `aggregateStats`, `currentThrowerIdx`, `turnDartsThrown`, `history`, `winnerId`, `hasGameStarted`, `startingCompetitorId` (`views/CricketGameView.tsx:47-65`) ; enchaînements dans `handleHit` (l.110), `handleMisses` (l.140), `handleUndo` (l.200).
- [vérifié] Capital : `useReducer(capitalGameReducer)` (`views/CapitalGameView.tsx:50`) ; reducer pur `src/features/capital/capitalGameModel.ts:147`.
- [vérifié] Killer : `useState<KillerState>` + pile `history` bornée à 20 (`views/KillerGameView.tsx:31-34`, l.63) ; transitions pures `src/domain/killer/killer.ts:61,127`.
- [vérifié] Gotcha : `useState<GotchaState>` + pile bornée à 30 (`views/GotchaGameView.tsx:69-72`, l.117) ; transition pure `src/domain/gotcha/gotcha.ts:60`.
- [vérifié] Triathlon : `useReducer(triathlonFlowReducer)` (`views/TriathlonGameView.tsx:31`) qui embarque `CapitalGameView`, `CricketGameView` et deux `MatchView` **sans** `onStateChange` (`views/TriathlonGameView.tsx:302-320`).
- [vérifié] Les vues non-X01 ne reçoivent que `players`, `config`, `onExit`, `onFinish` (`App.tsx:364-422`) : aucun état n'est remonté.
- [vérifié] Tous les jeux sont lancés avec un `MatchState` X01 « porteur » (`createMatch`, `src/app/useGameLifecycle.ts:69-75`) qui ne sert qu'à transmettre `players` et `config`.
- [vérifié] Chrono ré-implémenté par `setInterval` dans chaque vue (`CricketGameView.tsx:232`, `CapitalGameView.tsx:81`, `KillerGameView.tsx:45`, `GotchaGameView.tsx:98`, `TriathlonGameView.tsx:55`) et `useMatchTimer` pour X01 (`src/features/x01/hooks/useMatchTimer.ts:27-32`).
- [vérifié] Les 7 vues de jeu sont exclues de la couverture (`sonar-project.properties:9`) et aucun test unitaire ne rend `MatchView`, `CricketGameView`, `KillerGameView`, `GotchaGameView`, `CapitalGameView` ou `TriathlonGameView`.
- [hypothèse] Le rejeu déterministe de `submitTurn` est plausible (ni horloge ni aléa) mais non prouvé par test.

## 5. Comportement cible
Pour chaque jeu `G`, un module pur `src/domain/<g>/` expose `create<G>Session(setup)`, `reduce<G>(state, command)`, `is<G>Finished(state)`, `get<G>Result(state)` et un type d'état JSON-sérialisable. Un hook mince générique `useGameSession(module, setup, restored?)` héberge le `useReducer`, applique `Undo` via une pile d'états bornée et publie au shell un `GameRuntimeSnapshot { gameType, state }` après chaque commande. Les vues dispatchent des commandes et rendent l'état ; elles n'enchaînent plus les règles.

## 6. Périmètre
### Inclus
- Modules d'état et reducers pour Gotcha, Killer, Capital, Cricket, X01 (réutilise la commande de la spec 057) et Triathlon (composition des sous-états).
- Hook `useGameSession` générique ; remontée du snapshot au shell pour tous les jeux.
- Remplacement du `MatchState` porteur par un `GameSetup { gameType, players, config }`.
- Commande `Undo` unifiée (pile bornée en mémoire).
- Tests de caractérisation par jeu rejoués sur le reducer.
### Exclu
- Format persisté, validation, migration et chrono horodaté (spec 010, ADR-0003).
- Journal append-only, annulation persistante, correction d'une volée passée (spec 059).
- Projection spectateur (spec 084) et diffusion (specs 085, 087).
- Registre de jeux (spec 060) ; cadre de jeu commun visuel (spec 049).
- Corrections de règles (specs 045, 046, 047, 048).

## 7. User stories
- En tant que joueur de Cricket, je veux que ma partie survive à un rechargement (via la spec 010), ce qui exige un état restaurable.
- En tant qu'organisateur, je veux afficher n'importe quel jeu sur une TV sans que la TV recalcule les règles.
- En tant que contributeur, je veux tester l'enchaînement complet d'une partie sans rendre de composant React.

## 8. Règles métier
- RM-01 : les règles de chaque jeu restent celles d'aujourd'hui (aucune règle modifiée par cette spec).
- RM-02 : une commande refusée renvoie l'état inchangé (même référence) et un motif.
- RM-03 : `Undo` restaure l'état précédent la dernière commande validée ; la profondeur actuelle est conservée (illimitée X01/Cricket, 20 Killer, 30 Gotcha, reducer Capital) sauf décision Q2.

## 9. Parcours utilisateurs
Inchangés pour les six jeux (setup → choix du premier joueur → partie → fin → statistiques).

## 10. Exigences fonctionnelles
- FR-01 : chaque jeu expose un état unique JSON-sérialisable (pas de `Date`, `Map`, `Set`, fonction ni référence cyclique).
- FR-02 : chaque jeu expose un reducer pur ; aucune lecture d'horloge ni d'aléa dans le reducer (l'aléa du robot est fourni dans la commande).
- FR-03 : un hook générique `useGameSession` fournit `state`, `dispatch`, `canUndo`, `undo` et publie `GameRuntimeSnapshot` via un callback unique fourni par le shell.
- FR-04 : `App` reçoit un snapshot pour **chaque** jeu (pas seulement X01) ; le stockage de ce snapshot est défini par la spec 010.
- FR-05 : les vues de jeu ne contiennent plus d'état métier ; seul l'état d'interface reste local.
- FR-06 : `useGameLifecycle` crée un `GameSetup` au lieu d'un `MatchState` porteur pour les jeux non-X01.
- FR-07 : Triathlon expose un état composite (phase + sous-état du jeu en cours + résultats des phases terminées) ; ses sous-jeux utilisent les mêmes modules.
- FR-08 : la migration se fait jeu par jeu dans l'ordre Gotcha → Killer → Capital → Cricket → X01 → Triathlon ; chaque étape est livrable seule.
- FR-09 : un module peut fournir un instantané initial restauré (`restored`) ; s'il est absent, la session démarre à l'état initial.

## 11. Exigences non fonctionnelles
- NFR-01 : aucune nouvelle dépendance (pas de Redux/Zustand) ; coût récurrent 0 €.
- NFR-02 : modules de jeu conformes aux frontières de la spec 056 (aucun import React, `views/`, `components/`, `infrastructure/`).
- NFR-03 : à chaque jeu migré, sa vue sort de `sonar.coverage.exclusions` si son reducer est couvert (coordination spec 029, V2-QA-11).
- NFR-04 : temps de traitement d'une commande imperceptible (synchronisme conservé, spec 020).

## 12. Cas nominaux et alternatifs
- Nominal : Gotcha, 3 joueurs, volée 60 → commande `SubmitVisit` → nouvel état → snapshot publié.
- Alternatif : commande refusée (total impossible) → état inchangé, motif affiché.
- Alternatif : Triathlon en phase Cricket → snapshot composite publié.

## 13. Cas limites
Doublettes (rotation), égalité, partie terminée puis `Undo`, robot X01 (aléa injecté), Triathlon au départage 501, partie de 30 tours de Cricket (taille de l'historique).

## 14. Gestion des erreurs
Une commande incohérente avec l'état (ex. lancer après la fin) est refusée sans exception. Une erreur inattendue dans un reducer est capturée par le hook, journalisée en développement et laisse l'état précédent intact.

## 15. Impacts architecturaux
- Domaine : `src/domain/{gotcha,killer,capital,cricket,x01,triathlon}/` hébergent état + reducer ; `utils/cricketLogic.ts`, `utils/capitalLogic.ts`, `utils/triathlonScoring.ts` y migrent (spec 056).
- Application : `useGameSession` (proposition `src/app/useGameSession.ts`) ; callback de snapshot dans `App`.
- Vues : réduites à la composition.
- Pas de bus d'événements, pas de store global.

## 16. Impacts sur les données et les interfaces
- Nouveau type `GameRuntimeSnapshot = { gameType, state }` (union discriminée par jeu) consommé par la spec 010 (persistance) et la spec 084 (projection).
- `PersistedAppSession.currentMatch` cesse d'être utilisé comme porteur hors X01 (migration décrite par la spec 010).

## 17. Compatibilité avec l'existant
Comportement visible identique ; format X01 inchangé ; lien partenaire `v=1` (spec 030) non affecté.

## 18. Dépendances
- Prérequis : V2-QA-01 (039) — caractérisation validée métier de chaque jeu avant extraction.
- Ordonnancement : la migration X01 suit V2-ARCH-03 (057).
- Débloque : V2-ARCH-06 (010, reprise hors X01), V2-ARCH-05 (059), V2-ARCH-09 (060), V2-GAMES-06 (049), V2-GAMES-12 (051), V2-TV-08 (089), V2-VOICE-08 (079), V2-QA-11 (029).

## 19. Critères d'acceptation
- AC-01 : pour chaque jeu migré, `JSON.parse(JSON.stringify(state))` est structurellement égal à `state` sur toutes les fixtures de la spec 039 (test unitaire).
- AC-02 : pour chaque jeu migré, la suite de caractérisation (spec 039) passe sur le reducer seul, sans rendu React.
- AC-03 : pour chaque jeu migré, la vue ne contient plus d'appel `useState`/`useReducer` portant un état métier (revue + test de composant qui rend la vue avec un état fourni).
- AC-04 : en partie de Cricket, après chaque fléchette, le shell reçoit un `GameRuntimeSnapshot` dont `gameType = CRICKET` (test d'intégration `App` avec callback espionné).
- AC-05 : la commande `Undo` après une fin de partie Killer ou Gotcha restaure la partie en cours (test unitaire).
- AC-06 : test de gel profond : aucun reducer ne modifie son état d'entrée.
- AC-07 : `useGameLifecycle` ne crée plus de `MatchState` pour Cricket, Capital, Killer, Gotcha, Triathlon.

## 20. Scénarios de tests
- Unitaires : par jeu, partie complète depuis les fixtures 039 ; sérialisation ; immutabilité ; refus.
- Composants : chaque vue rendue avec un état fourni (début, milieu, fin).
- E2E : partie complète par jeu (spec 040, V2-QA-04) une fois la reprise (010) livrée.

## 21. Exigences de non-régression
Tests existants `tests/unit/cricketGameModel.test.ts`, `capitalGameModel.test.ts`, `killerLogic.test.ts`, `gotchaLogic.test.ts`, `triathlonFlow.test.ts`, `application/matchLifecycle.test.ts` ; E2E `gameplay-entry.smoke.spec.ts`.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Régression dans Cricket (enchaînements dans les handlers) | Élevé | Moyenne | Caractérisation préalable, PR dédiée |
| Triathlon (composition de trois jeux) | Élevé | Moyenne | Dernier de la file, après stabilisation des autres |
| Figer des bugs de règles connus | Moyen | Élevée | Fixtures validées métier (039) ; corrections dans 045-048 |
| Effet tunnel (L) | Moyen | Moyenne | Livraison jeu par jeu, chaque étape utile seule |

## 23. Décisions architecturales
- ADR-0001 (état sérialisable par jeu) — décision principale.
- ADR-0002 : le reducer X01 réutilise la commande de la spec 057.
- ADR-0003 : persistance de l'instantané (spec 010).
- ADR-0004 : le journal (spec 059) se branche sur ces reducers.
- ADR-0005 : la projection spectateur (spec 084) se calcule depuis cet état.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Reprise multi-jeux en P0 | P0 / P1 | P0 (compte rendu H.9) : cette spec en est le prérequis | — |
| Q2 | Profondeur d'annulation | Conserver les profondeurs actuelles / harmoniser (ex. 50) | Harmoniser à une borne commune documentée, sans changement perçu en partie normale | — |
| Q3 | Annulation après rechargement | Dans cette spec (pile persistée bornée) / spec 059 | Spec 059 ; en repli si 059 est rejetée, persister une pile bornée via 010 | — |
| Q4 | Emplacement des reducers | `src/domain/<jeu>` / `src/features/<jeu>` | `src/domain/<jeu>` (ADR-0001) | — |
| Q5 | Ordre de migration | Gotcha → … → Triathlon / Cricket en premier (valeur) | Ordre proposé (risque croissant) ; Cricket peut être avancé si 047 l'exige | — |

## 25. Traçabilité
- Rapports : `reports/02-architecture.md` §2.2, §4, §6.1, CA-1 ; `reports/07-tv-mode.md` §2.1, §5.2 ; `reports/03-games.md` §5.1, §6.1 ; compte rendu B.3, C.9, H.9.
- Specs liées : 010, 029, 039, 040, 047, 049, 051, 056, 057, 059, 060, 079, 084, 089, 109.
- Code vérifié au commit `508dfa6`.
