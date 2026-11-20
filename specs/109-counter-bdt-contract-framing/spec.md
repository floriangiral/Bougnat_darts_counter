---
id: 109-counter-bdt-contract-framing
v2_id: V2-INT-07
titre: Étude — cadrage du contrat compteur ↔ Bougnat_Darts_Tournaments
type: etude
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: integrations
priorite: P2
difficulte: M
recommandation: etude
lot: 5
poids: 15
depend_de: [V2-TV-02]
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 109 — Étude : cadrage du contrat compteur ↔ Bougnat_Darts_Tournaments

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
> Une étude ne crée aucune exigence. Le contrat lui-même sera spécifié dans le workspace (`001-xrepo-scoring-contract-v1`), pas dans ce dépôt.

## 1. Contexte et origine

Le backlog du workspace place en tête `001-xrepo-scoring-contract-v1` (« commandes/événements/snapshots entre backend tournoi et client scoring », `.specify-workspace/backlog/next-specs.md:5-6`). La constitution transverse fait de Bougnat_Darts_Tournaments (BDT) la source de vérité des matchs, du scoring critique et du live (§1) et exige que tout flux inter-dépôts passe par un contrat spécifié : commande, événement, snapshot, projection, erreur, autorisation (§5). Le contrat `v=1` (spec 030) est un contrat léger pour partenaires tiers non authentifiés ; il ne répond pas aux attentes de BDT (rapport 08 §2.8). Compte rendu V2 : §C.10, §F.7, question H.22.

## 2. Questions à trancher

- **Q1 Coexistence** — Comment `v=1` (public, sans réseau) et le contrat BDT (en ligne) coexistent-ils sans deux vérités ?
- **Q2 Ouverture de session** — Comment le compteur reçoit-il une session de cible : jeton QR signé par BDT, durée, portée (cible, match), révocation ?
- **Q3 Commandes et événements** — Quelles commandes le compteur émet-il (volée, correction, fin de manche, abandon) et quels événements reçoit-il ?
- **Q4 Idempotence et ordre** — Usage de `client_event_id`, `client_sequence`, `session_version` ; arbitrage des conflits.
- **Q5 Hors ligne** — File locale d'opérations, reprise, arbitrage (workspace `005-counter-offline-scoring-session-store`).
- **Q6 Projection** — La projection spectateur V2-TV-02 (084) est-elle la source des volées envoyées et du live ?
- **Q7 Autorité** — L'affichage du compteur est-il « provisoire » tant que BDT n'a pas validé (H.22) ?
- **Q8 Frontière** — Quels changements côté compteur (CSP `connect-src`, nouvel adaptateur réseau) et quelle décision d'architecture (ADR-0009) ?

## 3. État actuel vérifié dans le code

| Point | Constat | Référence |
|---|---|---|
| Compteur, réseau | Aucun appel réseau métier ; CSP `connect-src 'self'` + Deepgram + Insights | `public/_headers:2` |
| Compteur, volées | `Turn { playerId, score, isBust, remainingAfter, dartsThrown }` ; pas de détail par fléchette | `types.ts:28-34` |
| Compteur, état | Logique de jeu largement dans les vues ; X01 sérialisable et remonté au shell | compte rendu V2 §A ; `App.tsx:353-361` (`onStateChange={setMatchRuntime}`) |
| Compteur, sync | `useSharedX01Session` sans effet, port `SyncRepository` vide | compte rendu V2 §B.1 |
| BDT, config | `CounterConfig{AppURL, APIBaseURL, LaunchTokenTTLDays (14 j par défaut), MatchLockTTLMin (180 min)}` | `Bougnat_Darts_Tournaments/internal/platform/config/config.go:82-87`, `:189-193` |
| BDT, soumission | Session active + `client_event_id`, `client_sequence`, `session_version` (GF-06) ; reprises idempotentes (GF-07) ; versions obsolètes rejetées pour arbitrage (GF-08) | `Bougnat_Darts_Tournaments/specs/042-bdt-runtime-scoring-live/spec.md:46-49` |
| BDT, résultat | `ScorePayload{version, winner_participant_id, sets[], legs[], visits[], checkout, summary}` ; `ScoreVisit{participant_id, set_number, leg_number, visit_number, points_scored, remaining_points, checkout_attempt, darts[], client_event_id}` | `Bougnat_Darts_Tournaments/internal/modules/runtimeops/domain/runtime.go:196-250` |
| BDT, live | Snapshot live versionné, public sans données d'arbitrage (E4, GF-09) ; pas de WebSocket ni SSE | spec 042 l. 50, 76-79 ; rapport 07 |
| BDT, lien `v=1` | Aucune construction de lien `v=1` dans BDT | rapport 08 §2.8 [vérifié par recherche] |

## 4. Contraintes

- Le compteur reste utilisable sans BDT, sans compte et sans réseau ; le parcours de base est inchangé.
- **Une API authentifiée n'implique pas un compte joueur obligatoire** : l'authentification envisagée porte sur une session de cible (jeton émis par BDT, scanné sur la tablette), pas sur les joueurs.
- Aucun secret durable dans le client : un jeton de session porté par la tablette est une capacité de portée et de durée limitées, révocable par BDT, pas un secret protégé.
- Aucune logique métier de tournoi dans le compteur (constitution transverse §4) ; aucune règle de jeu dans l'adaptateur (le résultat dérive du moteur).
- Coût récurrent côté compteur : 0 € ; hébergement BDT (Fly.io, PostgreSQL) hors périmètre de ce dépôt.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. BDT construit un lien `v=1` | BDT agit comme partenaire tiers | Aucun changement compteur | Ni session, ni idempotence par volée, ni live (ne satisfait pas GF-06) | 0 € | S |
| B. Adaptateur en ligne fin de match | Le compteur soumet un `ScorePayload` à la fin, avec session | Simple | Pas de live ; hors ligne limité | 0 € compteur | M |
| C. Adaptateur événementiel | Chaque volée validée produit un événement idempotent envoyé à BDT, file locale hors ligne, snapshot de reprise | Satisfait GF-06/07/08, live et wallboard | Dépend de 057, 058 (et 059 optionnel) ; CSP élargie | 0 € compteur | L |
| D. Synchronisation de document | Envoi de l'état complet mutable | Facile | **Interdit** par la constitution transverse §2 | — | — |

## 6. Critères d'évaluation et analyse

- Conformité constitution transverse §1-5 : C seule complète ; B partielle ; A non ; D exclue.
- Clean Architecture : C n'est saine que si les volées proviennent des commandes partagées (V2-ARCH-03 / 057) et d'un état sérialisable (V2-ARCH-04 / 058) ; la projection 084 fournit la vue lecture seule, pas la source des commandes.
- Correspondance de modèle [vérifié] : `points_scored` ← `score`, `remaining_points` ← `remainingAfter`, `participant_id` ← correspondance `playerId` → participant fournie par la session, `visit_number` ← rang dans `history`, `set_number`/`leg_number` ← historique des manches. `checkout_attempt` et `darts[]` n'existent pas en saisie par volée [à décider : omis ou dérivés].
- Durées : le TTL de 12 h du contexte `v=1` n'a pas de rapport avec `LaunchTokenTTLDays` (14 j) de BDT ; la durée de session de cible reste à fixer côté BDT.
- Un jeton signé par BDT **corrèle** la tablette à un match et à une cible ; il ne certifie pas la véracité du score saisi : la validation staff (spec 042 E2) reste nécessaire.

## 7. Recommandation (non validée)

Retenir **C** comme cible, à spécifier dans le workspace (`001-xrepo-scoring-contract-v1`, en lien avec `004-xrepo-device-board-session-model` et `005-counter-offline-scoring-session-store`), et **A** comme solution transitoire possible pour un tournoi BDT sans live. Côté compteur : un adaptateur réseau isolé, activé seulement par une session de cible scannée, jamais au démarrage ordinaire. Décision de frontière à porter par [ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée). Implémentation conditionnée à 057, 058 et 084.

## 8. Protocole de vérification

1. Atelier de cadrage (compteur + BDT) sur Q1 à Q8, consigné dans le workspace.
2. Maquette de messages (commande « volée validée », événement d'acceptation ou de rejet, snapshot de reprise) contre `ScorePayload`/`ScoreVisit`.
3. Scénarios de conformité : reprise idempotente, séquence obsolète, coupure réseau de 10 min, correction de volée.
4. Revue de la CSP cible et de l'impact sur le mode sans BDT.

## 9. Livrables attendus de l'étude

- Note de cadrage pour `001-xrepo-scoring-contract-v1` (workspace).
- Table de correspondance `Turn` → `ScoreVisit`.
- Liste des prérequis compteur (057, 058, 084, 059 optionnel) et projet de spec fonctionnelle « adaptateur BDT ».
- Proposition d'amendement ou de complément à ADR-0009.

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Deux vérités (compteur et BDT) | Élevé | Moyenne | BDT fait foi ; affichage « provisoire » |
| Couplage du compteur à BDT | Moyen | Moyenne | Adaptateur isolé, inactif sans session |
| Démarrage avant l'état sérialisable | Élevé | Moyenne | Prérequis 058 bloquant |
| Confusion `v=1` / BDT | Moyen | Faible | Deux contrats documentés séparément |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| D1 | Autorité en tournoi BDT (H.22) | compteur / BDT | BDT fait foi, compteur provisoire | — |
| D2 | Option cible | A / B / C | C, A en transitoire | — |
| D3 | Lieu du contrat | ce dépôt / workspace | Workspace | — |
| D4 | `darts[]` et `checkout_attempt` | omis / dérivés / saisie par fléchette | Omis en V1 du contrat | — |
| D5 | Calendrier | V2 / V2.x | V2.x, après 058 et 084 | — |

## 12. Traçabilité

Rapport 08 §2.8, §5.1 (F), §5.2 ; rapport 07 ; rapport 02 §6.3 ; compte rendu V2 §C.6, §C.10, §H.22 ; constitution transverse §1-5 ; spec BDT 042 ; specs 030, 084, 057, 058, 059, 111.
