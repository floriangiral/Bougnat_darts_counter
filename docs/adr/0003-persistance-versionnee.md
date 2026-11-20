---
id: ADR-0003
titre: Persistance de session versionnée, validée et purgée
statut: proposee
date: 2026-11-20
specs_liees: [010, 058]
---

# ADR-0003 — Persistance de session versionnée

## Statut
Proposée.

## Contexte
- Restauration par simple cast après `JSON.parse` (`utils/appPersistence.ts:12`, `App.tsx:105-110`), sans version de schéma.
- Réécriture de la session chaque seconde à cause du chrono (`src/features/x01/hooks/useMatchTimer.ts:27-32` → `views/MatchView.tsx:211-217` → `App.tsx:170-199`).
- `current_matches` (IndexedDB et localStorage) n'est jamais purgé (`src/infrastructure/local/IndexedDBSessionRepository.ts:107-127`).

## Décision proposée
- Enveloppe `{ schemaVersion, gameType, savedAt, state }` validée à la lecture (validateur écrit à la main, pas de nouvelle dépendance) ; migration explicite ou abandon signalé à l'utilisateur.
- Chrono stocké en horodatages (`startedAt`, `pausedDuration`), jamais déclencheur d'écriture.
- Purge bornée (N dernières parties) et erreurs de stockage visibles.

## Conséquences
Reprise fiable de tous les jeux, moins d'écritures, pas de saturation. Décision à prendre : migration au mieux des sessions X01 existantes ou purge annoncée.
