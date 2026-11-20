---
id: 006-counter-voice-token-provisioning-hardening
v2_id: V2-VOICE-10
type: fonctionnel
statut: en-cours
validation: en-attente
statut_reel: "Partielle : runbook absent, Origin facultatif, limite non globale."
traitement_propose: "Finaliser dans la V2 (Révision V2)."
decision_traitement: a-valider
issue: '#248'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 006 - counter voice token provisioning hardening

## Meta

- ID: `006-counter-voice-token-provisioning-hardening`
- Statut: `active`
- Milestone cible: `M3: Voice Scoring Reliability`
- Issues GitHub: `#74`

## Objectif

Durcir le provisioning de token voice pour eviter les erreurs de configuration Deepgram et rendre les erreurs explicites avant l execution utilisateur.

## Decisions

- validation bloquante de `DEEPGRAM_API_KEY` et `DEEPGRAM_PROJECT_ID` en promotion
- verification de l acces au projet Deepgram avant grant token
- normalisation defensive des variables d environnement (quotes, espaces)
- fallback manuel de score conserve en toutes circonstances

## Invariants critiques

- pas d auto-validation de score voice
- pas d exposition de secret dans le frontend
- pas de blocage du scoring manuel quand voice indisponible

## Impacted Code

- `lib/deepgramToken.ts`
- `functions/api/deepgram/token.ts`
- `.github/workflows/promote-preprod.yml`
- `.github/workflows/promote-production.yml`

## Canonical Entry Points

- `grantDeepgramToken`
- `functions/api/deepgram/token`

## Key Tests

- `tests/unit/lib/deepgramToken.test.ts`
- `npm run test:unit`
- verification de workflow preprod/prod

## Validation

- scenario config valide: token genere
- scenario project id invalide: erreur explicite 502 cote token route
- scenario voice down: scoring manuel intact

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Alias V2 : **V2-VOICE-10** (famille voix, P1 — P0 si le mode mains libres de la spec 076 est retenu —, difficulté M, lot 2, poids 23, sans dépendance). Le contenu historique ci-dessus est conservé tel quel.

### R1. Constats vérifiés dans le code (commit `508dfa6`)

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C-01 | Une requête **sans en-tête `Origin`** est acceptée (CORS strict seulement si `Origin` est présent) : un script hors navigateur obtient un jeton. | `functions/api/deepgram/token.ts:97-101` | [vérifié] |
| C-02 | Limite de débit de 20 requêtes/min/IP stockée dans une `Map` de module : propre à chaque isolat Cloudflare, non partagée entre isolats ni POP (« best-effort »). | `token.ts:14-17`, `:122-153` ; `docs/audit-security-hosting-performance-2026-04-24.md:13` | [vérifié] |
| C-03 | Chaque jeton coûte **deux** appels Deepgram : `GET /v1/projects/{id}` puis `POST /v1/auth/grant`. | `lib/deepgramToken.ts:13-37` | [vérifié] |
| C-04 | `ttl_seconds: 55` demandé ; la documentation Deepgram indique un TTL par défaut de 30 s, la prise en compte du paramètre n'est pas documentée sur la page consultée. | `lib/deepgramToken.ts:26` | [vérifié] code ; [à confirmer] fournisseur |
| C-05 | Le TTL ne borne que l'ouverture de connexion : une session WebSocket ouverte n'est pas limitée côté serveur par l'application. | — | [hypothèse] à confirmer auprès de Deepgram |
| C-06 | Aucun plafond de dépense, aucune coupure d'urgence (« kill-switch ») hors redéploiement avec `VITE_ENABLE_VOICE_SCORING=false` (variable de build). | `token.ts:3-7` (env limité à 3 variables) ; `src/lib/env.ts:47` | [vérifié] |
| C-07 | La tâche « Compléter le runbook d'incident voice » reste ouverte : aucun runbook dans `docs/release/`. | `tasks.md` ; recherche « runbook » dans `docs/release` : 0 | [vérifié] |
| C-08 | Le client met le jeton en cache jusqu'à `expires_in − 10 s` et déduplique les requêtes concurrentes. | `src/features/x01/voice/deepgramClient.ts:12-40` | [vérifié] |
| C-09 | La clé de limitation privilégie `cf-connecting-ip` (non falsifiable derrière Cloudflare). | `token.ts:148-153` | [vérifié] (point fort) |

### R2. Écarts avec la présente spec

- **E-01** — L'objectif « rendre les erreurs explicites » est atteint pour la configuration, mais pas pour l'**exposition financière** (C-01, C-02, C-06), devenue le risque principal (compte rendu C.1).
- **E-02** — Runbook non livré (C-07).
- **E-03** — « Key Tests » cite `npm run test:unit` et la vérification des workflows, mais pas `tests/unit/api/deepgramTokenRoute.test.ts`, qui couvre la route.

### R3. Exigences proposées

- **V2-FR-01** — Toute requête de jeton sans `Origin` autorisé est refusée (403) en preview et production ; le proxy local de développement (`vite.config.ts`) reste utilisable.
- **V2-FR-02** — Une limite **globale** (toutes IP confondues) du nombre de jetons émis par fenêtre est appliquée par un mécanisme partagé (option à trancher, Q2).
- **V2-FR-03** — Un **plafond de dépense mensuel** configurable côté serveur est appliqué : au-delà, la route répond 503 avec la cause `budget` et aucun appel Deepgram n'est effectué.
- **V2-FR-04** — Une **coupure d'urgence** côté serveur, activable sans reconstruire le client, fait répondre 503 (cause `disabled`) sans appel Deepgram.
- **V2-FR-05** — Le client distingue les causes `budget` et `disabled` (`voiceSessionModel.ts`) : message français (« Assistance vocale indisponible pour le moment, saisie manuelle active »), bouton désactivé pour la durée du match, aucune nouvelle tentative automatique.
- **V2-FR-06** — La vérification d'accès au projet est mise en cache (par isolat, 10 min proposées) : un seul appel Deepgram par jeton en régime établi.
- **V2-FR-07** — La durée maximale d'une session côté client est bornée (plafond de fenêtre de la spec 003 ; plafond par match de la spec 076) et documentée comme hypothèse de calcul du budget.
- **V2-FR-08** — Un compteur agrégé (jetons émis par jour, refus par cause) est consultable par le mainteneur, sans conserver d'adresse IP ni de contenu.
- **V2-FR-09** — Un **runbook d'incident voix** est publié dans `docs/release/` : fuite ou rotation de clé, explosion des coûts, panne Deepgram, activation/désactivation de la coupure, vérification post-incident.
- **V2-FR-10** — Une alerte de consommation est configurée côté Deepgram si la console le permet [à confirmer], sinon un contrôle hebdomadaire manuel figure au runbook.

**Non fonctionnelles**

- **V2-NFR-01** — Sécurité : aucun secret côté client ; aucune donnée personnelle persistée par la route.
- **V2-NFR-02** — Latence ajoutée par les contrôles ≤ 50 ms p95 sur la route [à mesurer].
- **V2-NFR-03** — Coût du dispositif de contrôle : 0 € dans les quotas gratuits Cloudflare, sinon chiffré avant adoption (Q2, Q3).
- **V2-NFR-04** — La voix indisponible ne bloque jamais la saisie manuelle (invariant historique conservé).

**Repères de coût** (tarifs Deepgram relevés le 2026-11-20 [EXT], hypothèses d'usage du rapport 04) : Nova-3 streaming 0,0048 $/min (promotion ; 0,0077 $ hors promotion) + keyterm 0,0013 $/min ≈ **0,0061 $/min** ; mode « annonce » actuel ≈ 0,012 $ par 501 à deux joueurs ; mode mains libres avec détection locale de parole visé ≤ 0,02 $/match, soit **600 $/mois pour 1 000 parties vocales/jour** (0,02 × 1 000 × 30) ; crédit initial de 200 $ ≈ 32 800 min.

### R4. Critères d'acceptation proposés

- **V2-AC-01** — `POST` sans `Origin` en configuration production → 403 (test de route).
- **V2-AC-02** — Au-delà de la limite globale configurée (simulée), la route répond 429 quelle que soit l'IP.
- **V2-AC-03** — Plafond atteint (simulé) → 503 cause `budget`, zéro appel `fetch` vers Deepgram (test avec `fetch` espionné).
- **V2-AC-04** — Coupure activée → 503 cause `disabled` en moins d'une minute après le changement de réglage, sans redéploiement du client [mécanisme à confirmer, Q3].
- **V2-AC-05** — Côté client, une réponse `budget`/`disabled` affiche le message français et laisse le keypad pleinement fonctionnel (test composant).
- **V2-AC-06** — Deux jetons successifs dans la fenêtre de cache → un seul `GET /v1/projects/{id}`.
- **V2-AC-07** — Le runbook existe, est référencé depuis `docs/release/` et a été déroulé une fois en preview (preuve dans l'issue).

### R5. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Plafond mensuel | 0 $ (crédit gratuit seulement) ; 10-30 $/mois ; plus | 20 $/mois au démarrage, alerte à 80 %, révision après 3 mois de mesures (compte rendu H.5) | — |
| Q2 | Mécanisme de limite globale | Règle de limitation Cloudflare (WAF) ; compteur Durable Object ; Turnstile (défi, script tiers dans la CSP) | Règle WAF si disponible sur le plan actuel [à confirmer], sinon compteur Durable Object ; Turnstile seulement en cas d'abus avéré | — |
| Q3 | Support de la coupure et du plafond | Variable d'environnement (redéploiement) ; KV lu à l'exécution ; Durable Object | KV (lecture à chaque requête, quota gratuit [à confirmer]) | — |
| Q4 | Mesure de la dépense | Estimation interne (jetons × durée plafond) ; API d'usage Deepgram [à confirmer] | Estimation interne conservatrice + rapprochement mensuel manuel | — |
| Q5 | Comportement au dépassement | Retour au manuel ; bascule vers un moteur gratuit (spec 078) | Retour au manuel en V2 ; bascule seulement si la spec 078 conclut | — |

### R6. Dépendances

- Aucune dépendance bloquante. Liens : **V2-VOICE-05 / spec 076** (le mode mains libres exige ce durcissement), **V2-VOICE-01 / spec 003** (plafond de fenêtre), **V2-VOICE-09 / spec 080** (région UE : la route de jeton peut devoir viser l'endpoint UE), **V2-REL-03 / spec 009** (contrat d'environnement : nouvelles variables serveur).

## Révision DevSecOps (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue du chantier DevSecOps (audit `docs/v2/audit/11-devsecops.md`) ; aucune exigence ci-dessous n'est validée. Le contenu ci-dessus est conservé tel quel.

### Articulation

- Le runbook de rotation et d'incident des secrets est commun à tout le dépôt : **V2-SEC-03 (spec 118 FR-05)**. La tâche « Compléter le runbook d'incident voice » de cette spec y renvoie pour la rotation de `DEEPGRAM_API_KEY` (GitHub `preprod`/`Production` et Cloudflare Pages) et ne garde que les aspects propres à la voix (plafond, coupure d'urgence).
- `DEEPGRAM_PROJECT_ID` (identifiant public, `wrangler.jsonc:11, 23`) est ignoré par Gitleaks via deux empreintes non justifiées (`.gitleaksignore:1-2`) : la justification est portée par 118 FR-02.
- Si l'observabilité des erreurs (V2-OBS-01, étude 125) est retenue, le jeton éphémère et les URL Deepgram ne doivent jamais figurer dans un événement d'erreur (nettoyage `beforeSend`).
- Les promotions affichent la réponse brute de l'API Deepgram en cas d'échec (`promote-preprod.yml:90`, `promote-production.yml:91`) : suppression proposée par 115 FR-07 / 118 FR-06.

### Dépendances

V2-SEC-03 (118), V2-SEC-01 (115), V2-OBS-01 (125).
