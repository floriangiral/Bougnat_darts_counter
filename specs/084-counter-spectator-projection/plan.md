# Plan — 084 Projection spectateur versionnée

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `types.ts:6-55` (Player, Turn, LegState, MatchState).
- `App.tsx:110,355-360` (`matchRuntime`, `onStateChange`), `views/MatchView.tsx:211-217`.
- `src/features/x01/hooks/useMatchTimer.ts:25-34` (tic d'une seconde).
- `src/application/scoring/matchLifecycle.ts:215-231,259-290` (mutation `finishLeg`).
- `src/features/x01/scoring/matchPlayerScore.ts:20-60`, `matchPresentation.ts:3,36`, `checkoutEligibility.ts:5`, `src/application/scoring/matchStats.ts:330`.
- `src/features/x01/session/useSharedX01Session.ts`, `src/application/scoring/ports.ts:9-10`.

## 2. Approche retenue (et alternatives écartées)

Projection pure par jeu + enveloppe commune + port de publication branché dans le shell. Écartés : diffuser `MatchState` brut (contrat = état interne, règles côté TV) ; rendre la TV avec les composants de la tablette (aucun contrat, CSS Tailwind 4 incompatible avec les TV anciennes) ; rejeu d'événements (moteur identique exigé côté TV).

## 3. Étapes

1. Créer `src/shared/broadcast/contract.ts` (types v1) et `validateSpectatorEnvelope.ts` (taille, version, monotonicité).
2. Créer `src/features/x01/broadcast/x01SpectatorProjection.ts` (projection, minimisation des noms, troncature si taille dépassée).
3. Créer `spectatorFingerprint.ts` (projection hors `clock`), `deriveX01Highlights.ts`, `inferX01Cause.ts`.
4. Créer `src/application/broadcast/ports.ts` (`SpectatorPublisher`) et `src/infrastructure/broadcast/NoopSpectatorPublisher.ts`.
5. Créer `src/app/useSpectatorBroadcast.ts` : déclenché par la référence `matchRuntime.match` et `hasGameStarted` (pas par `elapsedSeconds`), coalescence 150 ms, plafond 2 msg/s, conservation de la dernière projection **sérialisée**.
6. Brancher le hook dans `App.tsx` avec l'adaptateur `Noop` (aucun effet visible).
7. Retirer `useSharedX01Session` (et ses appels `MatchView.tsx:273,344,371`) et `SyncRepository` si V2-ARCH-01 (056) ne l'a pas fait.
8. Documenter le contrat (statut expérimental) dans `docs/architecture.md` et l'ADR 0005.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/shared/broadcast/contract.ts`, `validateSpectatorEnvelope.ts` | Création |
| `src/features/x01/broadcast/*.ts` | Création (pur) |
| `src/application/broadcast/ports.ts` | Création |
| `src/infrastructure/broadcast/NoopSpectatorPublisher.ts` | Création |
| `src/app/useSpectatorBroadcast.ts` | Création |
| `App.tsx` | Branchement du hook (quelques lignes) |
| `views/MatchView.tsx`, `src/features/x01/session/useSharedX01Session.ts`, `src/application/scoring/ports.ts` | Retrait du bouchon |
| `tests/unit/broadcast/*.test.ts` | Création |

## 5. Impacts UI / domaine / application / infrastructure

UI : aucun. Domaine : aucun. Application : un port. Infrastructure : adaptateur nul. Shell : un hook.

## 6. Stratégie de migration

Aucune donnée persistée. Le contrat démarre en `v: 1`, `schema: 1` ; toute évolution est additive ou passe à `schema: 2` avec écran « Mettez à jour ».

## 7. Stratégie de test

Unitaires purs sur fixtures produites par le vrai `submitTurn` (y compris fin de leg et de set) ; horloge simulée pour la coalescence et l'absence d'émission au tic ; test de taille. Couverture : nouveaux modules inclus dans le périmètre Sonar (spec 029).

## 8. Non-régression

`npm run test:unit`, `npm run lint`, `npm run typecheck` ; E2E X01 existants inchangés ; vérifier que la persistance (`persistAppSession`) n'est pas modifiée.

## 9. Rollback / désactivation

Le hook n'a aucun effet tant que l'adaptateur est `Noop` ; rollback = retrait du branchement dans `App.tsx`.

## 10. Documentation à mettre à jour avec l'implémentation

`docs/architecture.md` (section diffusion), ADR 0005, `specs/README.md` (statut), guide développeur du contrat.
