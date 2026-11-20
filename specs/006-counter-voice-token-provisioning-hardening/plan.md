# Plan

1. Fixer le contrat de variables Deepgram par environnement
2. Harmoniser les checks entre runtime et workflows de promotion
3. Couvrir les cas nominaux et erreurs de parsing/config
4. Documenter les attentes de runbook pour preprod/prod

## Révision V2 — plan proposé

> Plan proposé par l'audit V2 du 2026-11-20 (V2-VOICE-10). Il ne s'exécute qu'après validation de la « Révision V2 » de `spec.md`.

### Lecture de l'existant
`functions/api/deepgram/token.ts` (route, CORS l.97-120, limite l.122-153), `lib/deepgramToken.ts` (vérification + grant), `src/features/x01/voice/deepgramClient.ts`, `voiceSessionModel.ts`, `vite.config.ts` (proxy local), `wrangler.jsonc`, workflows `.github/workflows/promote-*.yml`.

### Approche
Contrôles en tête de route, du moins coûteux au plus coûteux : coupure → `Origin` → limite IP → limite globale → plafond → vérification projet (cache) → grant. Écarté : proxy audio serveur (coût et latence, hors « pas de backend métier »).

### Étapes
1. `Origin` obligatoire hors développement (`isAllowedOrigin`).
2. Coupure et plafond lus depuis le support retenu (Q3) ; nouvelles variables dans `RuntimeEnv`, `wrangler.jsonc` et le contrat d'environnement (spec 009).
3. Limite globale (Q2) ; compteur agrégé (V2-FR-08).
4. Cache de la vérification projet dans `lib/deepgramToken.ts`.
5. Causes `budget`/`disabled` côté client (`deepgramClient.ts` → `voiceSessionModel.ts`), message et désactivation du bouton.
6. Runbook `docs/release/voice-incident-runbook.md` et alerte de consommation.

### Fichiers impactés
| Fichier | Nature |
|---|---|
| `functions/api/deepgram/token.ts` | contrôles, codes 403/429/503 |
| `lib/deepgramToken.ts` | cache de vérification |
| `src/features/x01/voice/deepgramClient.ts`, `voiceSessionModel.ts`, `VoiceScoringControl.tsx` | causes et message |
| `wrangler.jsonc`, `.env.local.example`, `scripts/deployment-check.mjs` | variables |
| `docs/release/voice-incident-runbook.md` (nouveau) | runbook |

### Migration
Aucune donnée. Déploiement : publier d'abord la route tolérante (journalise les refus `Origin` sans bloquer pendant 48 h), puis bloquer.

### Tests
`tests/unit/api/deepgramTokenRoute.test.ts` (Origin, 429 global, 503 budget/disabled, zéro appel Deepgram), `tests/unit/lib/deepgramToken.test.ts` (cache), test composant du message client.

### Rollback
Désactivation des contrôles par variable ; revert du commit ; la coupure elle-même sert de rollback fonctionnel de la voix.

### Documentation
Runbook, `SECURITY.md` (surface de la route), `docs/architecture.md` (contrôles de la route).
