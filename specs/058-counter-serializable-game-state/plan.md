# Plan proposé — 058 État de partie et transitions par jeu

> Actualisé le 2026-11-26 sur `7b454d3`. La spec est `a-valider` : ce plan n'autorise aucune implémentation et ses options restent à arbitrer.

## 1. Lecture de l'existant

- Contrats et reprise : `src/shared/session/persistedAppSession.ts` distingue `MatchRuntimeSnapshot` et `GameRuntimeSnapshot` ; `src/app/sessionRecovery.ts`, `src/features/game-session/{gameRuntime,storedSessionCodec,gameTiming}.ts`, `src/features/x01/session/x01RuntimeValidation.ts`, `src/app/appShell.ts` et `src/infrastructure/local/` valident, restaurent et stockent déjà les sessions.
- Jeux : reducers `src/features/{cricket/cricketGameModel,capital/capitalGameModel,triathlon/triathlonFlow}.ts`, transitions `src/domain/{gotcha/gotcha,killer/killer,atc180/atc180}.ts`, X01 dans `src/application/scoring/matchLifecycle.ts` et `src/features/x01/scoring/`.
- Orchestration : `App.tsx`, `src/app/useGameLifecycle.ts`, les sept vues de jeu et les quatre instances d'épreuve embarquées dans `views/TriathlonGameView.tsx`.
- Filet existant : `tests/unit/session/gameReload.test.tsx`, `gameRuntimeValidation.test.ts`, `appSessionRecovery.test.tsx`, `persistedSize.test.tsx`, `tests/unit/atc180/`, tests de modèles et de vues X01 cités dans la spec.

## 2. Approches à arbitrer

Comparer des adaptateurs par jeu aux deux contrats actuels avec une éventuelle union/commande commune et un hook mince. Réutiliser les reducers déjà en place ; ne pas supposer qu'un déplacement physique vers `domain` ou une pile générique est utile. La suppression du `MatchState` porteur et l'inclusion d'ATC180 sont également soumises aux questions ouvertes. Pas de nouveau store ou dépendance sans justification.

## 3. Étapes proposées après validation

1. Trancher Q1 à Q8 et les interfaces communes avec 057/061 ; compléter la caractérisation métier 039 pour les jeux concernés et inventorier les tests déjà disponibles.
2. Construire, à partir de sessions réelles, les fixtures de compatibilité : ancien X01 non versionné, format v2 de chaque jeu, piles compactées, erreurs, chronos et Triathlon en phase/transition. Caractériser la taille et la sémantique d'annulation avant toute extraction.
3. Selon le périmètre retenu, isoler progressivement les transitions encore couplées à une vue, en réutilisant les modèles existants. Pour chaque jeu, conserver les unités d'annulation, la publication et la reprise avant de passer au suivant ; ne pas remplacer ATC180 sans arbitrage.
4. Pour X01 seulement, intégrer la solution de 057 et coordonner le contrat et les effets avec 061 : entrée clavier/voix, robot, bull, places, sortie, annulation et fin partenaire.
5. Vérifier la composition Triathlon : phase, résultat des épreuves terminées, épreuve active et ses chronos/annulations, transitions, 501 et départage.
6. Si un format ou le porteur change, adapter ensemble lecteurs, validateurs, codec, `App` et cycle de vie ; choisir une migration/version et une stratégie de retour arrière avant écriture du nouveau format.

## 4. Fichiers potentiellement impactés

| Fichiers | Travail éventuel |
|---|---|
| `src/features/{cricket,capital,triathlon}/`, `src/domain/{gotcha,killer,atc180}/` | Réutilisation ou adaptation ciblée des transitions existantes |
| `src/application/scoring/`, `src/features/x01/`, `views/MatchView.tsx` | Interface X01 coordonnée avec 057 et 061 |
| `views/*GameView.tsx`, `App.tsx`, `src/app/useGameLifecycle.ts` | Hébergement, publication et restauration, sans changement de parcours |
| `src/shared/session/persistedAppSession.ts`, `src/app/sessionRecovery.ts`, `src/features/game-session/`, `src/features/x01/session/x01RuntimeValidation.ts` | Compatibilité, codec et validation si les données changent |
| `tests/unit/session/`, `tests/unit/atc180/`, tests de modèles, vues et partenaire | Fixtures et non-régression ciblées |

Une éventuelle évolution des exclusions de couverture est traitée séparément selon 029, avec PR dédiée ; elle ne découle pas mécaniquement de l'extraction d'un reducer.

## 5. Impacts UI / domaine / application / infrastructure

UI inchangée, y compris les annulations actuellement accessibles. Les transitions extraites ne lisent ni horloge, ni aléa, ni stockage ; la vue ou l'orchestrateur gère les effets. L'infrastructure de session est déjà active et doit être adaptée si son format évolue.

## 6. Migration et compatibilité

Le format réel est une session v2 avec `currentMatch`, `matchRuntime` et/ou `gameRuntime`, et non une enveloppe uniforme par jeu. Préserver les données existantes, les 20 dernières étapes des piles concernées, toutes les volées ATC180, les résultats Triathlon, le contexte partenaire et le temps jusqu'à la dernière écriture. Tester aussi la lecture de l'ancien X01 sans version. Une modification incompatible nécessite une migration/version explicite, une décision sur le comportement de l'ancienne application et un test de retour arrière ; une simple réversion du code ne garantit pas la lisibilité de données déjà écrites.

## 7. Stratégie de test

Comparer anciens et nouveaux comportements sur des scénarios caractérisés, avec gel des entrées et valeurs de temps/aléa contrôlées. Faire passer les snapshots par le vrai codec, JSON, la validation et la reprise ; couvrir toutes les variantes retenues, les changements de phase Triathlon, résultats déjà signalés, parties longues et refus de données corrompues. Compléter les tests existants sans les affaiblir.

## 8. Non-régression

Conserver notamment les suites `gameReload`, `gameRuntimeValidation`, `sessionRecovery`, `appSessionRecovery`, `persistedSize`, ATC180, modèles Cricket/Capital/Killer/Gotcha/Triathlon, X01, robot, voix et contrat partenaire. E2E et smoke uniquement en CI : aucun serveur ni navigateur local.

## 9. Retour arrière

Préférer des changements cohérents par jeu, mais ne pas promettre qu'une PR est réversible indépendamment si elle change une donnée persistée ou une interface partagée. Avant déploiement, vérifier lecture ascendante/descendante ou prévoir une migration inverse et une conduite explicite pour les sessions incompatibles.

## 10. Documentation future

Après implémentation validée : mettre à jour les contrats et la carte dans `docs/architecture.md`, les ADR concernées et la spec 058 ; actualiser `AGENTS.md` si les responsabilités ou commandes changent. Notes de release et changelog uniquement si un comportement visible est décidé.
