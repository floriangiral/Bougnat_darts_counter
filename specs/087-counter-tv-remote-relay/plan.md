# Plan — 087 Relais TV distant (Worker + Durable Object)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` **et** décision favorable de l'étude 083.

## 1. Lecture de l'existant

- `wrangler.jsonc` (projet Pages, variables par environnement), `scripts/validate-wrangler-config.mjs`.
- `functions/api/deepgram/token.ts:15-17,28,97,125-133` (origine, débit en mémoire).
- `public/_headers:2` (CSP), `public/_routes.json`.
- `src/infrastructure/local/IndexedDBSessionRepository.ts:10-12,39,53-70` (repli localStorage).
- `src/shared/ids/createId.ts:15`.

## 2. Approche retenue (et alternatives écartées)

Worker séparé `bougnat-darts-broadcast` portant `BroadcastRoom` (SQLite, hibernation) ; binding DO dans le projet Pages (`script_name`) ; Function `functions/api/tv/[[path]].ts` relayant l'upgrade (même origine). Écartés : migration complète vers Workers (trop invasive pour ce lot), SaaS (coût, sous-traitant), stockage DO du dernier état (écritures facturées, principe « aucun stockage »).

## 3. Étapes

1. Créer `workers/broadcast/` : `wrangler.jsonc` (migration `new_sqlite_classes: ["BroadcastRoom"]`), `src/index.ts`, `src/BroadcastRoom.ts`.
2. Implémenter le DO : `acceptWebSocket` avec étiquettes de rôle, `webSocketMessage`, `webSocketClose`, attachements (rôle, génération, empreintes, dernier snapshot), `setWebSocketAutoResponse`, alarme d'expiration unique.
3. Réutiliser `src/shared/broadcast/validateSpectatorEnvelope.ts` (084) dans le Worker.
4. Ajouter le binding `durable_objects` dans `wrangler.jsonc` (production, préproduction) et adapter `validate-wrangler-config.mjs`.
5. Créer `functions/api/tv/[[path]].ts` : contrôle d'origine, kill switch, `env.BROADCAST_ROOM.get(idFromName(roomKey)).fetch(request)`.
6. Clients : `src/infrastructure/broadcast/RelayWebSocketPublisher.ts`, `RelayWebSocketSubscriber.ts` (reconnexion, gigue, `online`, `visibilitychange`).
7. Stockage des jetons : clé IndexedDB dédiée sans repli localStorage.
8. CSP : `wss://<hôte>` par environnement dans `public/_headers` (ou génération au build).
9. CI : job de déploiement du Worker (préproduction puis production), `wrangler:check` étendu (V2-QA-10, 043).
10. Amender `CONTRIBUTING.md:9,28`, `docs/product-scope.md:19,26`, `docs/architecture.md:165` selon l'ADR 0005.
11. Runbook : kill switch, alerte de quota, rotation.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `workers/broadcast/**` | Création (Worker + DO) |
| `functions/api/tv/[[path]].ts` | Création |
| `wrangler.jsonc`, `scripts/validate-wrangler-config.mjs` | Binding DO, validation |
| `public/_headers` | `connect-src` |
| `src/infrastructure/broadcast/Relay*.ts` | Création |
| `src/infrastructure/local/` | Clé IndexedDB des jetons, sans repli |
| `.github/workflows/*` | Déploiement du Worker |
| `CONTRIBUTING.md`, `docs/product-scope.md`, `docs/architecture.md` | Amendement de frontière |
| `tests/unit/broadcast/relay*.test.ts`, `workers/broadcast/test/*` | Création |

## 5. Impacts UI / domaine / application / infrastructure

UI : indicateur d'état (partagé avec 085). Domaine/application : aucun. Infrastructure : Worker, Function, adaptateurs.

## 6. Stratégie de migration

Aucune donnée existante migrée. Si la clé IndexedDB nécessite un nouveau store, incrémenter `DB_VERSION` avec une migration additive testée (ouverture d'une base v1 existante).

## 7. Stratégie de test

Miniflare pour le DO (rôles, génération, quotas, attachements, TTL) ; E2E contre `wrangler dev` ; simulateur de charge (100 salles, 2 h) pour vérifier le nombre de requêtes ; tests de CSP. Couverture du Worker intégrée à Sonar (spec 029).

## 8. Non-régression

Function Deepgram et ses tests ; parcours X01 hors ligne ; mode local 085.

## 9. Rollback / désactivation

`TV_RELAY_ENABLED=false` (immédiat, sans redéploiement de l'app) ; `VITE_ENABLE_TV_REMOTE=false` ; retrait du binding puis suppression du Worker.

## 10. Documentation à mettre à jour avec l'implémentation

ADR 0005, `docs/architecture.md` (déploiement à deux composants), runbook d'exploitation, guide utilisateur (V2-DOC-05, 037), mention de confidentialité, contrat d'environnement (spec 009).
