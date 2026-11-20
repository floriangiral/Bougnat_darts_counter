---
id: 087-counter-tv-remote-relay
v2_id: V2-TV-05
titre: Relais TV distant (Worker + Durable Object)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: tv
priorite: P2
difficulte: L
recommandation: recommande
lot: 3
poids: 17
depend_de: [V2-TV-01, V2-TV-02]
remplace: []
remplacee_par: []
issue: '#263'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 087 — Relais TV distant (Worker + Durable Object)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
>
> Cette spec est **conditionnée** à la décision de l'étude 083 (V2-TV-01) autorisant un relais optionnel. Sans cette décision, elle passe en `rejetee` ou `reportee` et le mode TV reste local (085).

## 1. Origine et contexte

Pour afficher une partie sur un écran **qui n'est pas l'appareil de contrôle** (navigateur de Smart TV, mini-PC, clé Fire TV, téléphones de spectateurs), un relais réseau est indispensable (`07-tv-mode.md` §4.2, §5.3-5.7 ; compte rendu C.6, D.2). La solution recommandée est un **Worker Cloudflare séparé** hébergeant un **Durable Object** par session, avec l'API d'hibernation des WebSockets, consommé par le projet Pages existant via un binding. Le relais transporte des snapshots opaques (084) et n'a aucune logique de jeu.

## 2. Problématique

`BroadcastChannel` ne franchit pas les limites d'un navigateur sur un appareil. Sans relais, une Smart TV ne peut pas afficher un écran spectateur dédié.

## 3. Objectifs

- Écran distant en lecture seule mis à jour en < 1 s p95 après une saisie [à confirmer par PoC].
- Un seul émetteur par session, impossible à usurper par un spectateur.
- Aucun stockage durable, aucun compte, aucun prénom dans les journaux.
- Coût maîtrisé : 0 € en plan Free au volume de lancement ; plafond et coupure contrôlée.

## 4. État actuel vérifié dans le code

- [vérifié] Projet **Pages** sans binding (`wrangler.jsonc`) ; une seule Function `functions/api/deepgram/token.ts` ; routes Functions `/api/*` (`public/_routes.json`).
- [vérifié] Contrôle d'origine (`token.ts:28,97`) et limitation de débit **en mémoire par isolat** (`token.ts:15-17,125-133`), sans garantie globale : schéma insuffisant pour le relais.
- [vérifié] CSP `connect-src 'self' https://api.deepgram.com wss://api.deepgram.com https://cloudflareinsights.com` (`public/_headers:2`).
- [vérifié] Identifiants aléatoires disponibles (`src/shared/ids/createId.ts:15`) ; TTL de référence 12 h (`src/features/external-match/externalMatchLink.ts:61`).
- [vérifié] Persistance : IndexedDB `bougnat-counter-local` avec repli **localStorage** synchrone (`src/infrastructure/local/IndexedDBSessionRepository.ts:10-12,39,53-70`) : un jeton d'émission ne doit pas y être recopié.
- [vérifié] Frontière : `CONTRIBUTING.md:9,28`, `docs/architecture.md:165`, spec 030 « Result integrity » (`specs/030-counter-external-match-link/spec.md:110-114`).
- [EXT, consulté le 2026-11-20] Pages consomme un DO **hébergé par un Worker séparé** ; attachement WebSocket ≤ 16 384 octets, conservé à travers l'hibernation mais **perdu à la fermeture de la socket** ; Free : 100 000 requêtes DO/j, messages WebSocket entrants comptés 1 pour 20, dépassement = erreur jusqu'à 00:00 UTC ; Paid : 5 $/mois.

## 5. Comportement cible

Le contrôleur ouvre une WebSocket « émetteur » vers `/api/tv/rooms/<roomKey>` (même origine) ; la Function relaie l'upgrade vers le DO `BroadcastRoom`. Les écrans ouvrent une WebSocket « spectateur » vers la même salle avec un jeton de lecture. Le DO valide l'**enveloppe** (rôle, type, taille, débit, génération), mémorise le dernier snapshot dans les attachements des sockets ouvertes et le diffuse. Il hiberne entre deux messages.

## 6. Périmètre

### Inclus
- Worker `bougnat-darts-broadcast`, classe DO `BroadcastRoom` (backend SQLite, hibernation), Function `functions/api/tv/[[path]].ts`, binding dans `wrangler.jsonc`.
- Adaptateurs `RelayWebSocketPublisher` (contrôleur) et `RelayWebSocketSubscriber` (écran) sur les ports de 084.
- Jetons, génération mono-écrivain, quotas, TTL, kill switch, CSP, observabilité sans données personnelles.
- Amendement de la frontière (`CONTRIBUTING.md`, `docs/product-scope.md`, `docs/architecture.md`) selon l'ADR 0005.

### Exclu
- Parcours d'appairage par code et QR (088), multi-écrans publics (091), Presentation API/Cast (091), thème (098), qualification TV (090).

## 7. User stories

- En tant que club, je veux afficher la partie sur la Smart TV de la salle sans ordinateur.
- En tant que joueur, je veux que la saisie ne ralentisse jamais, même si le réseau tombe.
- En tant que spectateur avec le lien, je ne dois pas pouvoir modifier les scores.

## 8. Règles métier

- RM-01 Le relais ne contient aucune règle de jeu et traite le contenu de `view` comme opaque.
- RM-02 Seul le détenteur du jeton d'émission peut publier ; un spectateur ne peut envoyer que `hello` et `ping`.
- RM-03 Mono-écrivain : le relais attribue la génération (`max(maintenant en ms, précédente + 1)`) à chaque émetteur authentifié, ferme l'émetteur de génération inférieure (code 4001 « diffusion reprise ailleurs ») et rejette tout message d'une génération ancienne.
- RM-04 Aucune écriture dans le stockage du DO ; aucune minuterie active ; une seule alarme d'expiration éventuelle par salle.
- RM-05 Les prénoms sont minimisés **avant** envoi par la projection (084) ; le relais ne journalise jamais `view`.
- RM-06 Une panne du relais ne retarde ni n'empêche jamais la saisie.

## 9. Parcours utilisateurs

Le relais est invisible ; il est déclenché par l'appairage (088). Côté contrôleur : indicateur « TV ● » (connecté), « TV … » (reconnexion), « TV ! » (relais indisponible ou quota atteint).

## 10. Exigences fonctionnelles

- FR-01 Jetons générés sur le contrôleur (128 bits, `createId`) : `publisherToken` (jamais dans une URL), `viewerToken` (renouvelable). `roomKey` = empreinte SHA-256 du `publisherToken` : le DO vérifie l'émetteur sans rien stocker.
- FR-02 Le contrôleur transmet au DO, dans son `hello` émetteur, les empreintes des jetons de lecture autorisés ; le DO les garde dans l'attachement de la socket émettrice.
- FR-03 Messages émetteur : `hello`, `snapshot`, `end`, `branding` (≤ 12 288 octets, profil d'asset TV borné défini par 098), `voice` (éphémère, 081 ; relayé mais jamais conservé comme dernier état). Messages spectateur : `hello { token }`, `ping`. Messages relais : `welcome { generation }`, `snapshot`, `status { publisher: online|offline, since }`, `end`, `error { code }`.
- FR-04 Dernier snapshot conservé dans l'attachement de l'émetteur **et** de chaque spectateur (≤ 16 384 octets avec métadonnées) ; envoyé à toute (re)connexion ; perdu si toutes les sockets se ferment → l'écran affiche « En attente de la tablette » et le relais demande `sync` au retour de l'émetteur. Le message `branding` n'est pas conservé (budget d'attachement insuffisant pour snapshot + branding) : le relais signale chaque nouvel écran à l'émetteur, qui renvoie `branding` (098) ; en l'absence de l'émetteur, un nouvel écran affiche le thème officiel.
- FR-05 Quotas : snapshot ≤ 12 288 octets ; ≤ 2 messages/s par émetteur (au-delà : ignoré + `error throttled`) ; ≤ 20 spectateurs par salle ; message entrant > 16 Ko → fermeture 1009.
- FR-06 Contrôle de l'en-tête `Origin` à l'upgrade (liste par environnement, comme `isAllowedOrigin`) ; refus 403 sinon.
- FR-07 TTL : salle expirée 12 h après sa création (glissant à chaque partie) ou 30 min après `match_end` sans nouvelle partie ; vérification paresseuse à chaque message + alarme unique.
- FR-08 Battement : `setWebSocketAutoResponse('ping', 'pong')` ; client toutes les 30 s [à confirmer : décompte en requêtes].
- FR-09 Reconnexion client : délais 1, 2, 4, 8, 16, 30 s avec gigue ; reprise immédiate sur `online` et `visibilitychange`.
- FR-10 Stockage côté contrôleur des jetons en IndexedDB **sans** recopie dans le repli localStorage ; à défaut, en mémoire seulement.
- FR-11 Kill switch serveur (`TV_RELAY_ENABLED`) → 503 + message « Diffusion distante indisponible » ; drapeau client `VITE_ENABLE_TV_REMOTE`.
- FR-12 CSP : ajout explicite de `wss://<hôte>` par environnement dans `connect-src` [à confirmer : traitement de `'self'` pour `wss:` sur Chromium 85].
- FR-13 Observabilité : compteurs agrégés (salles, messages, rejets par code) sans identifiant ni prénom.

## 11. Exigences non fonctionnelles

- NFR-01 Coût : émission au changement uniquement (jamais au chrono : ≈ 385 000 req/j contre ≈ 45 000 au scénario de la mission) ; Free tant que < 70 000 req/j mesurées ; Paid ≈ 5,3 $/mois nominal, ≈ 21,85 $/mois à ×10 (sur décision PO).
- NFR-02 Hibernation obligatoire (sans elle ≈ 340 $/mois).
- NFR-03 Latence p95 < 1 s saisie → écran en France [à confirmer par PoC].
- NFR-04 Sécurité : jetons 128 bits, comparaison en temps constant des empreintes, aucun jeton dans les journaux ni dans les URL d'upgrade.
- NFR-05 Confidentialité : aucune persistance serveur ; mention dans la documentation utilisateur (aucune politique de confidentialité n'existe aujourd'hui dans `docs/` ni `public/`).
- NFR-06 Tests du DO en environnement Workers local (Miniflare) [nouvelle dépendance de développement à valider].

## 12. Cas nominaux et alternatifs

Diffusion nominale ; perte réseau du contrôleur (TV : dernier état + « Reconnexion… ») ; perte réseau de la TV (reconnexion, dernier snapshot) ; redéploiement du Worker (toutes les sockets se reconnectent) ; fin de diffusion (`end`, sockets fermées).

## 13. Cas limites

- Deux contrôleurs restaurés avec le même jeton : le plus récent gagne (RM-03).
- Spectateur se connectant pendant l'absence de l'émetteur avec un jeton non encore vérifiable : mis en attente, accepté ou refusé au retour de l'émetteur.
- Quota Free atteint : erreurs jusqu'à 00:00 UTC ; contrôleur « TV ! Diffusion distante saturée », saisie intacte, suggestion du mode local.
- Renouvellement du lien : nouveau `viewerToken`, anciens spectateurs déconnectés (code 4003).
- Match lié (spec 030) : diffusion autorisée, affichage « provisoire » en contexte tournoi (question 3).

## 14. Gestion des erreurs

Codes de fermeture documentés (4001 remplacé, 4003 révoqué, 4004 salle expirée, 4029 débit, 1008 violation de rôle, 1009 taille). Le client n'affiche jamais d'erreur bloquante au joueur.

## 15. Impacts architecturaux

Nouveau déploiement `workers/broadcast/` (Worker + DO) ; la Function Pages ne fait que relayer. Le Worker importe uniquement `src/shared/broadcast` (contrat, validateur). Aucune dépendance de `domain`/`application` vers le réseau.

## 16. Impacts sur les données et les interfaces

Contrat réseau `/api/tv/rooms/<roomKey>` (WebSocket) versionné avec 084. Côté contrôleur : enregistrement IndexedDB `broadcastSession { roomKey, publisherToken, viewerTokens[], createdAt, lastMatchEndAt? }`.

## 17. Compatibilité avec l'existant

Function Deepgram inchangée ; `_routes.json` couvre déjà `/api/*`. Le mode local (085) reste disponible sans relais. Spec 030 inchangée.

## 18. Dépendances

- V2-TV-01 (083) : décision et ADR 0005 — **bloquant**.
- V2-TV-02 (084) : contrat et validateur.
- Liens : 088 (appairage), 090 (qualification), 098 (branding borné), 043 (V2-QA-10, `wrangler:check`), 009 (contrat d'environnement), 037 (guide).

## 19. Critères d'acceptation

- AC-01 Miniflare : un spectateur envoie `snapshot` → socket fermée 1008, aucun relais du message.
- AC-02 Deux émetteurs successifs → le premier reçoit 4001, ses messages ultérieurs sont rejetés.
- AC-03 Spectateur connecté après 10 snapshots → reçoit immédiatement le dernier.
- AC-04 Émetteur fermé, un spectateur reste → un nouveau spectateur reçoit le dernier snapshot ; toutes sockets fermées → `status offline` sans snapshot.
- AC-05 Snapshot de 13 000 octets → rejeté ; 3 messages en 1 s → le 3ᵉ ignoré avec `throttled`.
- AC-06 Origine non autorisée → 403 à l'upgrade.
- AC-07 Simulation 2 h, émission au changement → requêtes DO facturées ≤ 50 par partie [à confirmer par PoC], 0 écriture de stockage.
- AC-08 Relais coupé (kill switch) → saisie X01 inchangée (E2E), indicateur « TV ! ».
- AC-09 `rg publisherToken` dans les journaux du Worker et le localStorage → aucun résultat.

## 20. Scénarios de tests

Unitaires du DO (Miniflare) : rôles, génération, quotas, attachements, TTL ; adaptateurs clients avec WebSocket simulée ; E2E Playwright contre `wrangler dev` (deux contextes) ; charge : simulateur de 100 salles ; terrain : 090.

## 21. Exigences de non-régression

`npm run ci:check` (dont `wrangler:check`) ; Function Deepgram inchangée ; CSP vérifiée par test.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Glissement vers un backend métier | Élevé | Moyenne | ADR 0005, payload opaque, revue |
| Quota Free dépassé | Moyen | Moyenne | Émission au changement, quotas, Paid |
| Jeton de lecture diffusé | Faible | Moyenne | Renouvellement, TTL, noms minimisés |
| Perte du dernier état | Faible | Moyenne | Copie dans chaque attachement, `sync` |
| Exploitation d'un second déploiement | Moyen | Moyenne | CI dédiée, runbook, kill switch |

## 23. Décisions architecturales

ADR 0005 « Projection spectateur et transport » (relais optionnel, sans stockage, mono-écrivain) ; amendement de la frontière open source issu de 083.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Plan Cloudflare (H.4) | Free / Paid plafonné | Free au lancement, Paid avant ouverture large | — |
| 2 | Dernier état sans socket | Attachements seuls / stockage DO avec TTL | Attachements seuls | — |
| 3 | Affichage en match lié ou tournoi (H.22) | Mention « provisoire » / aucune | Mention « provisoire », BDT fait foi | — |
| 4 | Dépendance de test Miniflare | `@cloudflare/vitest-pool-workers` / tests manuels | Ajouter (dev seulement) | — |
| 5 | Hébergement | Worker séparé / migration Workers | Worker séparé | — |

## 25. Traçabilité

Rapports : `07-tv-mode.md` §2.3, §4.2, §5.3-5.7 ; compte rendu C.6, D.2, H.4, H.18, H.22. Revue croisée : Pages consomme un DO d'un Worker séparé ; attachements perdus à la fermeture (16 384 octets) ; chrono ×4 ; coût ≈ 5,3 $ et ≈ 21,85 $ ; mono-écrivain contrôlé par le relais. Specs : 083, 084, 085, 088, 090, 091, 098, 030, 043, 009, 037.
