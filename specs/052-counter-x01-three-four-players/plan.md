# Plan — 052 X01 : 3 à 4 joueurs en simple

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`, révision de la spec 015 et livraison de la spec 072.

## 1. Lecture de l'existant

- Setup : `src/features/game-setup/setupModel.ts:59-66,98-110`, `components/game-setup/SetupPlayersSection.tsx`.
- Match : `views/MatchView.tsx:168,691-703`, `components/game/MatchPlayerArea.tsx`, `components/game/PlayerScore.tsx`, `components/match/MatchInputBar.tsx`.
- Stats : `components/stats/StatsModal.tsx:19-41`, `views/StatsView.tsx`.
- Moteur : `src/application/scoring/matchLifecycle.ts:215-291`.

## 2. Approche retenue (et alternatives écartées)

Réutiliser la disposition « arène » (spec 072) pour un affichage à N blocs ; aucun changement de moteur. Écartée : 3-4 colonnes ajoutées à `MatchView` actuel sans la spec 072 (illisible sur téléphone, double travail).

## 3. Étapes

1. Révision de la spec 015 (invariant) validée par le PO.
2. Bornes setup et désactivation du robot au-delà de 2.
3. Liste des joueurs dérivée de `match.players` (plus de `teams[0]/teams[1]`).
4. Blocs joueurs via le composant de la spec 072.
5. Statistiques N colonnes (défilement horizontal sur téléphone).
6. Écran de victoire et classement.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/features/game-setup/setupModel.ts` | Bornes, robot |
| `components/game-setup/SetupPlayersSection.tsx` | Ajout de joueurs |
| `views/MatchView.tsx`, `components/game/MatchPlayerArea.tsx`, `components/match/MatchInputBar.tsx` | N blocs |
| `components/stats/StatsModal.tsx`, `views/StatsView.tsx` | N colonnes, classement |
| `specs/015-…/spec.md` | Révision (hors de cette spec, par décision PO) |
| `tests/unit/gameSetup/setupModel.test.ts`, `tests/unit/application/matchLifecycle.test.ts`, `tests/e2e/*` | Tests |

## 5. Impacts UI / domaine / application / infrastructure

UI uniquement (setup, match, statistiques) ; domaine et infrastructure inchangés.

## 6. Stratégie de migration

Aucune : `MatchState` gère déjà N joueurs ; sessions existantes à 1-2 joueurs inchangées.

## 7. Stratégie de test

Unitaires setup et rotation ; composant N blocs ; E2E 4 joueurs ; régression visuelle 2 joueurs (spec 041).

## 8. Non-régression

X01 1-2 joueurs, doublettes, robot, voix, lien externe.

## 9. Rollback / désactivation

Borne maximale paramétrée (constante) : revenir à 2 sans autre changement.

## 10. Documentation à mettre à jour avec l'implémentation

README (nombre de joueurs), `docs/specifications.md`, spec 015, notes de version.
