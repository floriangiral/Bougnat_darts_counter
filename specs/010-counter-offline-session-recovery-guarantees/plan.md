# Plan

1. Definir la notion d etat minimal restaurable
2. Cartographier les points de persistence et restauration
3. Ajouter les garde-fous de lecture pour donnees invalides
4. Verifier la reprise via unit + e2e smoke

## Révision V2 — plan proposé

> Plan proposé, à exécuter seulement après validation de la Révision V2 de la spec. Le plan historique ci-dessus est conservé.

### Approche
- Enveloppe versionnée par partie en cours + validateur manuel + migration explicite (ADR-0003), sans nouvelle dépendance.
- Livraison en deux temps : **X01 d'abord** (indépendant de la spec 058), puis chaque jeu au fil de sa migration par la spec 058.
- Écriture sur changement métier ; chrono par horodatages.

### Étapes
1. Écrire la grille de corruption et les fixtures de sessions réelles (format actuel, X01 en cours, Cricket en cours) en tests unitaires.
2. Introduire `schemaVersion` et l'enveloppe `{ schemaVersion, gameType, savedAt, setup, state, timing }` dans `src/shared/session/persistedAppSession.ts` ; écrire le validateur et la migration depuis le format sans version.
3. Restauration : valider l'écran (`isAppScreen`) et l'enveloppe dans `App.tsx` (lecture synchrone et asynchrone) ; message non bloquant en cas d'abandon.
4. Chrono : remplacer `elapsedSeconds` persisté par `timing` ; `useMatchTimer` ne fait plus que dériver l'affichage ; sortir le chrono des dépendances de l'effet de persistance.
5. Persistance : écrire sur changement métier et sur `visibilitychange`/`pagehide` ; supprimer l'écriture déclenchée par le chrono.
6. Purge : `current_matches` limité à la partie en cours, purge des orphelins à la migration ; incrément de `DB_VERSION` avec `onupgradeneeded` explicite.
7. Erreurs : remonter les échecs d'écriture du dépôt vers une alerte non bloquante (une fois par session).
8. Jeux non-X01 : brancher `GameRuntimeSnapshot` (spec 058) jeu par jeu ; Triathlon en dernier.
9. Verrou mono-onglet selon la décision Q5.

### Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/shared/session/persistedAppSession.ts` | Enveloppe versionnée, types de migration |
| `src/shared/session/sessionValidation.ts` (nouveau) | Validateur et migrations |
| `src/infrastructure/local/IndexedDBSessionRepository.ts` | `DB_VERSION`, purge, remontée d'erreurs |
| `src/infrastructure/local/sessionPersistence.ts` | Ne réécrit plus `current_matches` à chaque sauvegarde |
| `src/app/appShell.ts` | Validation de l'écran restauré, déclencheurs d'écriture |
| `App.tsx` | Restauration validée, message, dépendances de l'effet de persistance |
| `src/features/x01/hooks/useMatchTimer.ts`, `views/MatchView.tsx` | Chrono horodaté |
| Vues de jeu non-X01 | Via la spec 058 |

### Migration
- Format sans `schemaVersion` : X01 en cours migré au mieux (Q1) ; autres jeux et entrées `current_matches` orphelines purgés ; message affiché si une partie non-X01 était en cours.
- Contexte partenaire (spec 030) migré à l'identique (TTL 12 h conservé).

### Tests
- Unitaires : validateur (grille de corruption), migrations, purge (`fake-indexeddb`), espions d'écriture avec horloge simulée.
- Composants : message d'abandon, alerte de stockage saturé.
- E2E : rechargement en partie pour chaque jeu (spec 040) et Triathlon en étape 501.

### Rollback / désactivation
- Le validateur accepte la version N-1 pendant une release ; en cas de régression, revert de la PR sans perte (l'ancien format reste lisible par la migration).
- Pas de feature flag sur la validation (sécurité) ; l'écriture sur changement métier peut être désactivée par un flag temporaire si un défaut de sauvegarde est constaté.

### Documentation
`README.md` (promesse de reprise par jeu), `docs/architecture.md` (persistance), statut de l'ADR-0003, `docs/technical.md` (stockage local).
