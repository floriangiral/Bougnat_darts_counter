# Plan — 074 Voix — corpus de référence et banc de mesure

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Parseur pur : `src/features/x01/voice/dartsSpeechParser.ts` (`parseDartsSpeechTranscript`), `voiceProposalModel.ts` (`buildVoiceScoreProposal`).
- Tests : `tests/unit/dartsSpeechParser.test.ts`, `tests/unit/x01/useDeepgramStreaming.test.tsx`, `tests/unit/x01/voiceBrowserFakes.ts`.
- E2E : `playwright.config.*` (projets Chromium, tablettes, smartphones), `tests/e2e/helpers.ts`, `scripts/run-playwright.sh`.
- Configuration Deepgram : `src/features/x01/voice/voiceConfig.ts:19-35`.

## 2. Approche retenue (et alternatives écartées)
Corpus texte dans le repo (petit, sans donnée personnelle) + audio hors repo + banc en script Node. Écartés : audio dans le repo (poids, consentement) ; télémétrie serveur (hors valeurs, décision H.27) ; banc dans le navigateur (moins reproductible).

## 3. Étapes
1. Définir le schéma `corpus.v1` (TypeScript + validateur) et rédiger les 500 énoncés texte (dont négatifs et commandes).
2. Générer les tests table-driven depuis le corpus ; consigner les écarts connus dans `tests/fixtures/voice/known-gaps.json` relié à la spec 003.
3. E2E simulé : faux `getUserMedia` (script d'init Playwright) + `page.routeWebSocket` vers un faux Deepgram scripté.
4. Banc local `scripts/voice-bench/` : lecture du manifeste, envoi temps réel, métriques, rapports hors repo.
5. Protocole d'enregistrement, consentement, session pilote (5 locuteurs), puis complément à 10.
6. Rapport de référence au commit de départ ; publication des chiffres dans l'issue.
7. (Q4) compteurs locaux opt-in dans l'application.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `tests/fixtures/voice/corpus.v1.json`, `known-gaps.json` | nouveaux |
| `tests/unit/voice/corpusSchema.test.ts`, `tests/unit/voice/corpusParser.test.ts` | nouveaux |
| `tests/e2e/voice.simulated.spec.ts`, `tests/e2e/helpers.ts` | nouveau / helpers micro et WS factices |
| `scripts/voice-bench/*.mjs` | nouveau banc |
| `package.json` | script `voice:bench` (sans nouvelle dépendance si possible) |
| `docs/technical.md` | section « Mesurer la voix » |

## 5. Impacts UI / domaine / application / infrastructure
Aucun impact domaine/UI pour le cœur ; FR-08 ajoute un petit module application (`voiceMetrics`) et une option dans les réglages.

## 6. Stratégie de migration
Aucune donnée existante. Le corpus est versionné (`v1`) ; toute modification incompatible crée `v2`.

## 7. Stratégie de test
Le banc lui-même est testé sur des cas construits (métriques connues). Couverture des nouveaux modules selon la spec 029 ; scripts du banc exclus de la couverture applicative.

## 8. Non-régression
Suite unitaire et E2E existantes inchangées ; l'E2E simulé ne tourne que sur Chromium au départ.

## 9. Rollback / désactivation
Suppression des fichiers ajoutés ; aucun effet sur l'application (hors FR-08, désactivable).

## 10. Documentation à mettre à jour avec l'implémentation
`docs/technical.md` (banc, E2E simulé), `CONTRIBUTING.md` (ajout d'énoncés au corpus), procédure de consentement.
