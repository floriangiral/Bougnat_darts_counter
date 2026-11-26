# Plan proposé — 061 Découpage de MatchView

> Actualisé le 2026-11-26 sur `7b454d3`. La spec reste `a-valider` ; aucune extraction n'est autorisée par ce cadrage.

## 1. Lecture de l'existant

- `views/MatchView.tsx` : hébergement de la session, callbacks, entrées/confirmations, voix, robot, transitions, ordre/places et composition ; modules déjà extraits dans `src/features/x01/` et `components/match/`.
- `src/features/x01/hooks/useMatchTimer.ts` et `src/features/x01/session/useSharedX01Session.ts` : tic local et stub dont la fonction de persistance est recréée au rendu.
- `App.tsx`, `src/app/{appShell,sessionRecovery,useGameLifecycle}.ts` et `src/features/external-match/` : orchestration déjà partiellement déléguée, stockage, reprise et parcours partenaire.
- `views/SetupView.tsx` et `src/features/game-setup/` : préparation et verrouillage ; reliquat transféré à 056 par 022. `views/TriathlonGameView.tsx` : épreuves imbriquées et second chrono.
- Tests existants : `tests/unit/x01/matchView*.test.tsx`, `tests/unit/session/{gameReload,appSessionRecovery,externalLinkRecovery}.test.tsx`, `tests/unit/components/setupView*.test.tsx`, `tests/unit/x01/x01BotTurn.test.ts` et `tests/unit/externalMatch/`.

## 2. Approches à arbitrer

Préférer une extraction progressive autour de responsabilités et tests démontrés ; comparer fonctions, hooks et composants aux modules déjà présents. Ne pas imposer une table de rendu d'`App`, une limite de lignes ou la découpe de Deepgram avant les réponses aux questions ouvertes. Une réécriture complète et une nouvelle source de règles X01 sont hors proposition.

## 3. Étapes proposées après validation

1. Après livraison de l'interface X01 de 057, convenir avec 058 des contrats et de l'ordre des travaux ; délimiter le périmètre d'`App` selon Q4.
2. S'appuyer sur les tests de composants déjà en place, puis compléter les comportements non protégés : robot et rerendus/tics, transition et démontage, voix et confirmation, reprise et partenaires, X01 dans Triathlon.
3. Mesurer les rendus X01 seul et imbriqué, les tics et les écritures ; choisir des critères chiffrés seulement après Q5.
4. Isoler les effets retenus (robot, transition, voix), en conservant les nettoyages et en contrôlant toutes les dépendances instables, notamment `persistSharedState`, pas seulement `elapsedSeconds`.
5. Si utile, déplacer des portions de présentation encore dans `MatchView` en réutilisant `MatchInputBar`, `MatchPlayersBoard`, `MatchEndOverlay` et les modales existantes ; conserver les interfaces `App` et Triathlon.
6. Selon Q4, simplifier les coordinations d'`App` sans dupliquer `appShell`, `sessionRecovery`, `useGameLifecycle` ou le traitement partenaire ; préserver le geste d'ouverture de l'onglet et les reprises.
7. Vérifier non-régression et mesures ; tout changement d'exclusions Sonar exige une PR dédiée et la gouvernance 029.

## 4. Fichiers potentiellement impactés

| Fichiers | Travail éventuel |
|---|---|
| `views/MatchView.tsx`, `src/features/x01/hooks/`, `src/features/x01/voice/` | Responsabilités et effets ciblés après arbitrage |
| `components/match/`, `components/game/controls/` | Composition et rendu sans évolution visuelle |
| `App.tsx`, `src/app/`, `src/features/external-match/` | Coordination de session et partenaire selon Q4 |
| `views/TriathlonGameView.tsx`, `views/SetupView.tsx` | Interfaces et tests d'intégration ; pas de découpe globale du setup ici |
| `tests/unit/x01/`, `tests/unit/session/`, `tests/unit/components/`, `tests/unit/externalMatch/` | Compléments ciblés |

## 5. Impacts UI / domaine / application / infrastructure

UI et règles inchangées ; les modules applicatifs existants restent la source de vérité tant que 057/058 n'ont pas livré leurs choix. Pas de nouvelle couche, dépendance runtime ou backend.

## 6. Migration et compatibilité

Ne pas changer le format de session par simple découpage. Si une interface ou un snapshot doit changer, coordonner 058 et adapter lecteurs, validateurs et codec ; tester la reprise de l'ancien format, les deux phases X01 du Triathlon et le contexte partenaire. Prévoir lecture compatible ou migration et retour arrière avant écriture du nouveau format.

## 7. Stratégie de test

Réutiliser les tests `MatchView` déjà présents. Ajouter des tests ciblés avec horloges et aléa contrôlés : rerendus répétés pendant les 700 ms du robot, arrêt/changement de tour, compte à rebours, consentement et proposition vocale, snapshots sans tic, fin partenaire et reprise d'un Triathlon. Ne pas prétendre qu'un test moteur seul protège les effets de vue.

## 8. Non-régression

Conserver tests unitaires/composants X01, session, partenaire, setup et Triathlon ; comparer les mesures de rendu si une optimisation est retenue. Les parcours E2E/smoke existants sont exécutés uniquement en CI, jamais en local.

## 9. Retour arrière

Préférer des étapes petites et cohérentes. Une extraction seule peut être réversible ; un changement de contrat, de session persistée ou d'interface partagée impose d'abord une stratégie compatible et testée.

## 10. Documentation future

Mettre à jour `docs/architecture.md` et `AGENTS.md` si les responsabilités changent, puis les tâches/statut de 061 après vérification. La spec 022 est déjà clôturée : ne pas la reclôturer. Notes de release et changelog seulement si un changement visible est décidé.
