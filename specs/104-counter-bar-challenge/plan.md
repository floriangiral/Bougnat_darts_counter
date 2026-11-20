# Plan — 104 Défi du comptoir

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Validation des totaux : `src/domain/scoring/valueObjects/ScoreInput.ts:9-22`, `:49-51`.
- Persistance : `src/infrastructure/local/IndexedDBSessionRepository.ts:10-17` (constantes), `:244-267` (ouverture et création des stores).
- Écrans : `src/app/appShell.ts`, `App.tsx:329-440` ; accueil `views/HomeView.tsx:132-160`.
- Clavier de total X01 : `components/game/Keypad.tsx` [à confirmer : réutilisation hors `MatchView`].
- Frontière : `docs/product-scope.md:17-26`, `CONTRIBUTING.md:26-33`.

## 2. Approche retenue (et alternatives écartées)

- Retenue : domaine pur `challenge` (définition, tentative, classement), port de dépôt, store IndexedDB dédié, écrans dédiés derrière une entrée secondaire.
- Écartée : réutiliser `MatchView` en X01 « 0 départ » (détournement du moteur X01, règles mêlées).
- Écartée : classement partagé via un service tiers (contraire à la frontière produit et à la gratuité sans serveur).

## 3. Étapes

1. Vérifier la livraison de 058 (contrat d'état) et de la validation unique des totaux (057/054).
2. Domaine `src/domain/challenge/` : types, reducer de tentative, classement, expiration ; tests.
3. Port `ChallengeRepository` + cas d'usage ; implémentation IndexedDB (store `challenges`, base v2) + repli localStorage ; test de migration.
4. Écrans : création, défi (tableau), tentative (clavier de total) ; entrée secondaire.
5. Purge automatique au démarrage (`purgeExpiredChallenges`).
6. Pilote terrain sur autorisation.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/domain/challenge/*` (nouveau) | Règles pures |
| `src/application/challenge/*` (nouveau) | Port et cas d'usage |
| `src/infrastructure/local/IndexedDBSessionRepository.ts` (ou nouveau dépôt) | Store `challenges`, montée de version |
| `views/ChallengeView.tsx`, `components/challenge/*` (nouveaux) | Écrans |
| `src/app/appShell.ts`, `App.tsx`, `views/HomeView.tsx` | Écrans et entrée secondaire |
| `tests/unit/challenge/*`, `tests/unit/application/indexedDbMigration.test.ts`, `tests/e2e/challenge.spec.ts` (nouveaux) | Tests |

## 5. Impacts UI / domaine / application / infrastructure

- UI : 3 écrans, 1 entrée. Domaine : module `challenge`. Application : 4 cas d'usage. Infrastructure : nouveau store.

## 6. Stratégie de migration (données, sessions persistées, contrats)

- Base IndexedDB v1 → v2 : création additive du store `challenges` dans `onupgradeneeded` ; stores existants intacts (AC-09). À fusionner avec toute autre migration prévue (010, 101).
- Ancienne version de l'application ouvrant une base v2 : échec d'ouverture IndexedDB → repli localStorage (comportement actuel `:244-267`) [à vérifier].

## 7. Stratégie de test

- Unitaires : reducer, classement, expiration, pseudos, totaux impossibles.
- Migration : base v1 avec données → v2.
- Composants et E2E : AC-01, AC-02, AC-05, AC-07, AC-08.

## 8. Non-régression

- Persistance existante, parcours de base, jeux existants.

## 9. Rollback / désactivation (feature flag le cas échéant)

- Drapeau de build masquant l'entrée ; le store `challenges` reste présent mais inutilisé (la base ne redescend pas de version).

## 10. Documentation à mettre à jour avec l'implémentation

- Guide utilisateur lieux (V2-DOC-05, 037), `README.md`, `docs/product-scope.md` (mention « classement local »), notes de release.
