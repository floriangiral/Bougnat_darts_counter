> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 07 — Mode TV : diffusion multi-écrans, casting et synchronisation temps réel

Agent : « Diffusion multiscreen, casting et synchronisation temps réel »
Chantier : mission §5.6 (Mode TV), avec §5.1 dernier paragraphe (voix + TV), §5.7 (transmission du thème au TV), §6 (vision) et §7 (Clean Architecture).
Date de l'analyse : 2026-11-20. Branche analysée : `feat/v2.0.0` (HEAD `508dfa6`).
Mode : lecture seule sur le repository. Aucun fichier du repo n'a été modifié. Les pages web ont été récupérées dans le dossier de session, pas dans le repo.

Légende : **[VÉRIFIÉ code]**, **[VÉRIFIÉ source externe + URL]**, **[HYPOTHÈSE]**, **[À CONFIRMER]**.

---

## 0. Synthèse

1. **Aucune brique de diffusion n'existe dans le code** [VÉRIFIÉ code]. Aucun usage de WebSocket hors Deepgram, ni de `BroadcastChannel`, `navigator.presentation`, `getScreenDetails` ou Wake Lock. Le hook `useSharedX01Session` est un bouchon qui ne fait rien (`src/features/x01/session/useSharedX01Session.ts:11-21`). Le port `SyncRepository` est un type vide (`src/application/scoring/ports.ts:9-10`).
2. **L'état X01 se prête à la diffusion.** `MatchState` (`types.ts:43-55`) est un objet JSON simple, sans classe ni fonction. Il est immuable, produit par des fonctions pures (`src/application/scoring/matchLifecycle.ts`). Il remonte déjà à `App.tsx` à chaque changement via `onStateChange` (`views/MatchView.tsx:211-217` vers `App.tsx:360`). Des view-models purs réutilisables existent aussi (`buildPlayerScoreViewModel`, `getWinnerDisplayName`, `calculateDetailedStatsForTeam`).
3. **Les cinq autres jeux ne sont pas diffusables en l'état** [VÉRIFIÉ code]. Leur état vivant (Cricket, Capital, Killer, Gotcha, Triathlon) n'existe que dans l'état local React de la vue, réparti sur plusieurs `useState`/`useReducer` (`views/CricketGameView.tsx:47-67`, etc.). `App.tsx:365-422` ne leur passe que `players`/`config`, sans `onStateChange` ni état restauré. Conséquences :
   - ces parties ne peuvent être ni diffusées ni reprises après un rechargement ;
   - cela contredit la spec 010 (« pas de perte silencieuse d'état critique ») et le README (« Une pause n'efface pas la partie »).
   Remonter cet état est un **prérequis commun** au mode TV et à la reprise locale.
4. **Le modèle n'est pas événementiel.** Les annulations reposent sur des piles de snapshots complets (`MatchView.tsx:298-344`, `CricketHistorySnapshot`, `history: KillerState[]`). C'est un argument fort pour une **diffusion par snapshot de projection versionné**, et contre le rejeu d'événements sur l'écran TV : une correction n'est alors qu'un nouveau snapshot.
5. **Recommandation principale.**
   - Une **projection « spectateur » pure** est calculée sur l'appareil de contrôle, seule source de vérité.
   - Elle est envoyée en **snapshot complet versionné** (`schema`, `epoch`, `seq` monotone), à travers un **port de transport** qui a trois adaptateurs :
     - (a) `BroadcastChannel` : fenêtre secondaire sur le même appareil (HDMI, écran étendu), **hors ligne, sans infrastructure** ;
     - (b) **relais WebSocket sur Cloudflare Durable Objects avec hibernation** : écran distant (navigateur de Smart TV, PC, clé Fire TV, téléphone des spectateurs), appairé par **code court affiché sur la TV** ou par **QR/lien lecture seule** ;
     - (c) plus tard, Presentation API ou Google Cast.
   - L'écran TV ne contient **aucune règle de jeu**.
6. **Coût.** Pour le scénario imposé (1000 parties/j × 2 h × 1 msg/5 s), le relais Durable Objects consomme environ **97 000 requêtes facturées/j**, pour une limite gratuite de 100 000/j. C'est **à la limite**. En émettant uniquement à chaque changement d'état (environ 1 message par volée), on descend à environ 45 000/j. Le plan Workers Paid coûte **environ 5,3 $/mois** pour ce scénario et **environ 18 $/mois** pour un volume 10 fois supérieur. Les SaaS tiers coûteraient entre 29 et 99 $/mois ou plus, et ajoutent un compte et un sous-traitant de données.
7. **Point de gouvernance bloquant.** Le relais est un service serveur, certes sans logique métier ni persistance. Il va contre la position actuelle « pas de backend » (`CONTRIBUTING.md:9,28`, spec 030 « Result integrity », `docs/architecture.md:172`). Il faut un **arbitrage PO et un ADR d'amendement de la frontière**. Sans relais, le mode TV se limite au même appareil (fenêtre secondaire) et à la recopie d'écran native.
8. **Risque de compatibilité TV.** Tailwind CSS v4 exige Chrome 111+ / Safari 16.4+. Les TV LG et Samsung de 2022 à 2024 embarquent Chromium 85 à 108 (sources §4.4). L'écran TV doit avoir une **feuille de style conservatrice** et une **matrice de tests sur appareils réels**.

---

## 1. Périmètre et fichiers analysés

### 1.1 Code (lecture intégrale ou ciblée)
| Zone | Fichiers |
|---|---|
| Modèle d'état | `types.ts` ; `src/shared/session/persistedAppSession.ts` |
| Domaine / application | `src/application/scoring/matchLifecycle.ts`, `RecordThrow.ts`, `ports.ts`, `index.ts`, `matchStats.ts` (exports) ; `src/domain/scoring/valueObjects/Checkout.ts` ; `src/domain/killer/killer.ts`, `src/domain/gotcha/gotcha.ts` (exports) |
| Modèles de features | `src/features/x01/scoring/{matchSubmission,matchPlayerScore,matchPresentation,checkoutEligibility,matchFeedback}.ts` ; `src/features/x01/session/useSharedX01Session.ts` ; `src/features/cricket/cricketGameModel.ts` ; `src/features/capital/capitalGameModel.ts` ; `src/features/triathlon/triathlonFlow.ts` (exports) ; `src/features/x01/voice/voiceProposalModel.ts` |
| Shell | `App.tsx` ; `src/app/useGameLifecycle.ts` ; `src/app/appShell.ts` |
| Vues | `views/MatchView.tsx` ; `views/{Cricket,Capital,Killer,Gotcha,Triathlon}GameView.tsx` (gestion d'état) ; `views/HomeView.tsx` (QR) |
| Composants | `components/game/{CheckoutHint,MatchPlayerArea,PlayerScore,CricketScoreboard}.tsx` ; `components/match/MatchStatusPill.tsx` ; `constants.ts` (`CHECKOUT_GUIDE`) |
| Persistance | `src/infrastructure/local/IndexedDBSessionRepository.ts` ; `src/infrastructure/local/sessionPersistence.ts` ; `src/shared/ids/createId.ts` |
| Infra / déploiement | `functions/api/deepgram/token.ts` ; `wrangler.jsonc` ; `public/_headers` ; `public/_routes.json` ; `sw.js` ; `vite.config.ts` ; `postcss.config.mjs` ; `src/styles/tailwind.css` ; `src/infrastructure/web/legacySupport.ts` ; `utils/uiUtils.ts` ; `package.json` ; `scripts/generate-app-qr.mjs` |
| Gouvernance / specs | `CONTRIBUTING.md` ; `.specify/memory/constitution.md` ; `../.specify-workspace/constitution.transverse.md` ; `../.specify-workspace/backlog/next-specs.md` ; `specs/README.md` ; specs 010, 030, 031 (spec.md) ; `docs/product-scope.md` ; `docs/architecture.md` (extraits) ; `README.md` (extrait) |
| Repo voisin | `Bougnat_Darts_Tournaments` : recherche de WebSocket/SSE dans `internal/` (aucun trouvé), `fly.toml` |

### 1.2 Sources externes consultées le 2026-11-20
- Durable Objects, tarifs : https://developers.cloudflare.com/durable-objects/platform/pricing/
- Durable Objects, WebSockets et hibernation : https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Durable Objects, limites : https://developers.cloudflare.com/durable-objects/platform/limits/
- Durable Objects, `setWebSocketAutoResponse` : https://developers.cloudflare.com/durable-objects/api/state/
- Bindings Pages Functions vers Durable Objects : https://developers.cloudflare.com/pages/functions/bindings/
- Workers, tarifs : https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Realtime (SFU/TURN), tarifs : https://developers.cloudflare.com/realtime/sfu/platform/pricing/ et https://developers.cloudflare.com/realtime/turn/
- PartyKit, migration vers PartyServer et fermeture : https://docs.partykit.io/guides/migrate-to-partyserver/
- Ably : https://ably.com/pricing ; Pusher : https://pusher.com/channels/pricing/
- Supabase Realtime, limites : https://supabase.com/docs/guides/realtime/limits ; tarifs : https://supabase.com/pricing
- Firebase RTDB, limites : https://firebase.google.com/docs/database/usage/limits (la page tarifs n'a pas pu être chargée, DNS)
- MDN : Presentation API, Window Management API, BroadcastChannel, CSP. Données de compatibilité MDN : https://bcd.developer.mozilla.org/bcd/api/v0/current/{api.Presentation,api.Window.getScreenDetails,api.BroadcastChannel,api.Navigator.presentation}.json
- Chrome, présentation sur écran secondaire attaché : https://developer.chrome.com/blog/present-web-pages-to-secondary-attached-displays
- Google Cast Web Sender : https://developers.google.com/cast/docs/web_sender ; enregistrement : https://developers.google.com/cast/docs/registration
- Moteurs web LG webOS : https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
- Moteurs web Samsung Tizen : https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html
- AirPlay : https://support.apple.com/en-us/102661
- Compatibilité Tailwind v4 : https://tailwindcss.com/docs/compatibility

---

## 2. Constats sur le code

### 2.1 Modèle d'état des parties

| Jeu | Où vit l'état vivant | Sérialisable ? | Remonté à `App` ? | Persisté pour reprise ? | Undo |
|---|---|---|---|---|---|
| X01 | `MatchView` `useState<MatchState>` (`views/MatchView.tsx:81`) + `hasGameStarted`, `elapsedSeconds` | **Oui**, JSON simple (`types.ts:36-55`) | **Oui**, `onStateChange` (`MatchView.tsx:211-217`) → `setMatchRuntime` (`App.tsx:360`) | **Oui**, `PersistedAppSession.matchRuntime` (`persistedAppSession.ts:33-37,51`), écriture différée de 300 ms (`appShell.ts:130-149`) | Pile de snapshots `MatchUndoSnapshot[]` (`MatchView.tsx:123,298-344`), **non persistée** |
| Cricket | 8 `useState` dans la vue (`CricketGameView.tsx:47-67`) : `states`, `aggregateStats`, `currentThrowerIdx`, `turnDartsThrown`, `history`, `winnerId`… | Oui en pratique (objets simples, `cloneCricketStates`) mais **dispersé** | **Non** (`App.tsx:365-370` : `players`, `config`, `onExit`, `onFinish`) | **Non** : un rechargement relance la partie de zéro | `CricketHistorySnapshot[]` |
| Capital | `useReducer(capitalGameReducer)` (`CapitalGameView.tsx:50`) | Oui (`CapitalGameState`) | Non | Non | snapshots dans le reducer |
| Killer | `useState<KillerState>` + `history: KillerState[]` (`KillerGameView.tsx:31-34`) | Oui (domaine pur `src/domain/killer/killer.ts`) | Non | Non | pile d'états |
| Gotcha | `useState<GotchaState>` + `history` (`GotchaGameView.tsx:69-72`) | Oui (domaine pur `src/domain/gotcha/gotcha.ts`) | Non | Non | pile d'états |
| Triathlon | `useReducer(triathlonFlowReducer)` (`TriathlonGameView.tsx:31`) | Oui en apparence, à vérifier finement | Non | Non | reducer |

Conclusions :
- **[VÉRIFIÉ code]** Seul X01 expose un état vivant unique, sérialisable et observable. C'est le seul candidat diffusable sans refactoring préalable.
- **[VÉRIFIÉ code]** Aucun modèle d'événements de domaine. Les « événements » remarquables (bust, leg gagné, victoire) sont déduits dans la couche feature ou dans la vue :
  - `buildScoreSubmissionResult` produit un retour `TROP !` (`matchSubmission.ts`) ;
  - la transition de leg est calculée dans `MatchView.tsx:452` (`setLegTransition`) ;
  - le cas d'usage `RecordThrow` renvoie `isBust/finishedLeg/finishedGame` (`RecordThrow.ts:21-30`), mais **aucune vue ne l'utilise** : seuls `tests/unit/application/scoringUseCases.test.ts` l'appellent.
- **[VÉRIFIÉ code]** Projections et view-models purs réutilisables pour l'écran TV X01 :
  - `buildPlayerScoreViewModel` (`src/features/x01/scoring/matchPlayerScore.ts:20-60`) : nom, joueur actif, score restant, legs, sets, moyennes match et leg, fléchettes du leg, dernier score ;
  - `getMatchFormatText`, `getWinnerDisplayName` (`matchPresentation.ts`) ;
  - `isCheckoutPossible` (`checkoutEligibility.ts:5-15`), `CHECKOUT_GUIDE` (`constants.ts:3`) ;
  - `calculateDetailedStatsForTeam` (`matchStats.ts:330`).
  Ce sont précisément les briques d'une **projection spectateur sans duplication de règles**.
- **[VÉRIFIÉ code]** Côté Cricket : `buildCricketCompetitors` et `CricketScoreboard` (`components/game/CricketScoreboard.tsx`) consomment `CricketPlayerState[]`, ce qui est projetable. Les règles de fermeture (`isNumberClosedGlobally`, `utils/cricketLogic.ts:20`) sont pures et peuvent servir à la projection côté contrôleur.

### 2.2 Persistance
- **[VÉRIFIÉ code]** IndexedDB `bougnat-counter-local` v1 avec trois stores, dont `app_sessions`, et un repli localStorage écrit en synchrone (`IndexedDBSessionRepository.ts:10-17,52-58`). Rien n'est prévu pour un état de diffusion (jetons, écrans appairés).
- Le `SessionRepository` (`ports.ts:3-7`) ne manipule que `MatchState` : il est spécifique à X01.
- Pour le TV, il faudra persister localement, côté contrôleur, `broadcastSession { sessionId, publisherToken, viewerToken, epoch, seq, pairedScreens[] }`. Les jetons ne doivent pas aller dans le localStorage de repli lisible par d'autres scripts de même origine : risque faible (pas de script tiers hors Cloudflare Insights), mais à documenter.

### 2.3 Infrastructure serveur existante
- **[VÉRIFIÉ code]** Une seule Pages Function, `functions/api/deepgram/token.ts`. Elle contrôle l'Origin, limite le débit **en mémoire par isolat** (`rateLimitBuckets = new Map`, l.17), donc sans garantie globale, et plafonne la taille du corps. `public/_routes.json` limite les Functions à `/api/*`.
- **[VÉRIFIÉ code]** `wrangler.jsonc` déclare un projet **Pages** (`pages_build_output_dir`), sans binding (KV, DO, D1). **[VÉRIFIÉ source externe]** On ne peut pas créer de Durable Object dans un projet Pages : il faut un Worker séparé lié par binding (https://developers.cloudflare.com/pages/functions/bindings/, section « Durable Objects »).
- **[VÉRIFIÉ code]** CSP (`public/_headers`) : `connect-src 'self' https://api.deepgram.com wss://api.deepgram.com https://cloudflareinsights.com`. Un relais sur le **même hôte** (`/api/tv/*`) entre en principe dans `'self'`. **[À CONFIRMER]** Le traitement de `wss:` par `'self'` sur une page `https:` varie selon les anciens moteurs. Recommandation : ajouter explicitement `wss://<hôte>`. Un relais sur un autre domaine imposerait de modifier la CSP. `frame-ancestors 'none'` et `X-Frame-Options: DENY` interdisent l'intégration de la page TV en iframe, ce qui convient au besoin.
- **[VÉRIFIÉ code]** Le Service Worker (`sw.js`) sert la navigation en network-first avec repli sur `/index.html` (l.42-54). D'après la spec 031, il n'est pas encore servi en production. Une route `/tv` serait couverte par le repli SPA.
- **[VÉRIFIÉ code]** Le backend `Bougnat_Darts_Tournaments` (Go, Fly.io) n'expose aucun WebSocket ni SSE. Il ne fournit aucune brique « live » réutilisable aujourd'hui.

### 2.4 QR code
- **[VÉRIFIÉ code]** La lib `qrcode` (`package.json:34`, dépendance de production) n'est utilisée **qu'au build** (`scripts/generate-app-qr.mjs`) pour produire `public/app-qr.svg`, l'URL de l'app, affichée par `HomeView.tsx:44`. Aucune génération de QR à l'exécution.
- Un QR de diffusion contient un jeton dynamique. Il faudra soit charger `qrcode` à la demande (import dynamique dans le panneau « Diffuser » ; taille du chunk **[À CONFIRMER]**), soit générer le SVG côté relais.

### 2.5 Accès plein écran, modes, routage
- **[VÉRIFIÉ code]** Il n'y a pas de routeur : l'écran courant est un état (`AppScreen`, `appShell.ts:10-25`), avec un paramètre `?mode=` pour les modes d'accès (`getAppAccessMode`, `appShell.ts:93-107`). Un écran TV demandera un point d'entrée dédié, détecté **avant** la restauration de session, pour ne pas charger les chunks du contrôleur (Deepgram, clavier) sur un navigateur de TV peu puissant.
- **[VÉRIFIÉ code]** `enterFullScreen` existe déjà (`utils/uiUtils.ts`), avec les préfixes webkit, moz et ms. Le plein écran exige un geste utilisateur, et donc sur TV un clic de télécommande.
- **[VÉRIFIÉ code]** Build legacy (`vite.config.ts` : `legacy({ targets: ['ios >= 12', 'safari >= 12'] })`) : le JS est transpilé assez bas pour d'anciens Chromium de TV **[HYPOTHÈSE, non testé]**. En revanche, le CSS est produit par Tailwind v4 (`postcss.config.mjs`) sans cible legacy.

### 2.6 Specs concernées
- **Spec 010** (reprise de session) : son invariant « pas de perte silencieuse d'état critique pendant une partie en cours » n'est **pas tenu hors X01** (voir 2.1). Ses « Canonical Entry Points `saveSession` / `loadSession` » **n'existent pas**. Les méthodes réelles s'appellent `loadAppSession` / `saveAppSession` (`IndexedDBSessionRepository.ts:44-52`). Divergence documentaire.
- **Spec 030** (lien de match externe) : elle a **refusé** une Function serveur de signature au nom de la frontière open source (« Result integrity »). Le mode TV avec relais est donc un précédent à arbitrer explicitement.
- **Spec 031** (PWA) : le SW n'est pas encore actif en production. Le TV devra être pris en compte dans la politique de mise à jour : une TV peut se recharger entre deux parties, mais pas pendant une partie diffusée.
- **Spec 001** (modes d'accès) : `isScreenAllowedForAccessMode` limite les écrans au scoring (`appShell.ts:109-112`). Un mode ou écran « affichage » est à ajouter.
- **Spec 018** (iOS 12) : elle promet une compatibilité legacy alors que Tailwind v4 cible Safari 16.4+. Cette tension rejaillit sur les TV.

---

## 3. Problèmes, dettes et incohérences

| # | Constat | Gravité pour le TV | Réf. |
|---|---|---|---|
| P1 | L'état vivant des jeux non-X01 est confiné aux vues : il n'est ni diffusable ni repris après rechargement. Écart avec la spec 010 et le README l.22 | **Bloquant hors X01** | `App.tsx:365-422`, vues |
| P2 | Pas de modèle d'événements ni de calcul pur des « temps forts » (180, checkout, bust, leg ou set gagné) : ils sont calculés dans `MatchView` (retours visuels, `legTransition`) | Élevée (animations TV) | `MatchView.tsx:452`, `matchSubmission.ts` |
| P3 | Deux chemins de validation X01 : les cas d'usage `RecordThrow` (`ScoreValidator`), inutilisés par l'UI, et `buildScoreSubmissionResult` (`POSSIBLE_TURN_SCORES`), utilisé par l'UI. Le TV doit se brancher sur l'état réel, pas sur les cas d'usage | Moyenne | `RecordThrow.ts`, `matchSubmission.ts` |
| P4 | Abstractions mortes : `useSharedX01Session` (bouchon) et `SyncRepository = Record<string, never>`. À supprimer ou à remplacer par le port de diffusion, pour ne pas laisser deux pistes de synchronisation | Faible | `useSharedX01Session.ts`, `ports.ts:9-10` |
| P5 | `CheckoutHint` affiche `CHECKOUT_GUIDE` (« Simplified checkout table (Double Out) ») quelle que soit la règle de sortie. En Open ou Master Out, la suggestion peut être fausse. Le TV doit la conditionner à `checkOut === 'Double'` ou utiliser un calcul de checkout dépendant de la règle (sujet de l'agent « jeux ») | Moyenne | `constants.ts:1-3`, `CheckoutHint.tsx:8-11`, `MatchStatusPill.tsx:47` |
| P6 | Baseline Tailwind v4 (Chrome 111+, Safari 16.4+) au-dessus des moteurs des TV 2022-2024 (Chromium 85 à 108) | **Élevée** pour la cible « navigateur de Smart TV » | §4.4 |
| P7 | Limitation de débit en mémoire par isolat sur l'unique Function existante. Le même schéma serait insuffisant pour un relais | Moyenne | `token.ts:14-17` |
| P8 | Le projet Pages ne peut pas héberger de DO : il faut un Worker séparé (ou une migration de Pages vers Workers + static assets). Impact sur CI et `wrangler:check` | Moyenne (architecture) | `wrangler.jsonc` |
| P9 | Frontière de gouvernance : « ne pas réintroduire de dépendance runtime à un backend » (`CONTRIBUTING.md:9`) ; spec 030 « backend-free » ; constitution transverse : « supervision/live » portés par le backend Tournois | **Bloquant de décision** | §7 |
| P10 | La spec 010 cite des points d'entrée inexistants (`saveSession`/`loadSession`) | Faible (doc) | spec 010 |
| P11 | La pile d'undo X01 n'est pas persistée : après rechargement, impossible d'annuler la dernière volée. Le TV n'est pas directement concerné | Faible | `MatchView.tsx:123` |

---

## 4. Étude comparative des solutions techniques

### 4.1 Duplication d'écran ou écran de diffusion indépendant

| Catégorie | Solutions | Ce que voit la TV |
|---|---|---|
| **Duplication (miroir)** | AirPlay « Recopie de l'écran » (iPhone/iPad), Cast d'écran Android, HDMI en mode miroir, Miracast, « Caster l'écran » de Chrome | L'UI de contrôle (clavier, boutons). Pas d'interface dédiée |
| **Écran indépendant, même appareil** | Fenêtre secondaire sur écran étendu (HDMI) + `BroadcastChannel` ; Window Management API (placement auto) ; Presentation API vers écran attaché ; onglet TV « casté » depuis Chrome desktop | Une page TV dédiée |
| **Écran indépendant, autre appareil** | URL spectateur + relais temps réel (navigateur de Smart TV, PC/mini-PC, clé Fire TV, tablette, téléphone) ; Google Cast Custom Receiver ; WebRTC P2P | Une page TV dédiée |

### 4.2 Relais temps réel distants

| Critère | **Cloudflare DO + WebSocket Hibernation** | PartyKit (hébergé) | Ably | Pusher Channels | Supabase Realtime | Firebase RTDB | Cloudflare Realtime SFU (DataChannels) |
|---|---|---|---|---|---|---|---|
| État en novembre 2026 | Disponible sur les plans Free et Paid, **backend SQLite seulement en Free** [VÉRIFIÉ : DO pricing] | **Plateforme hébergée fermée le 23/10/2026**, déploiements coupés le 16/10. Reste la lib PartyServer à déployer sur son propre compte Cloudflare, c'est-à-dire des DO [VÉRIFIÉ : docs.partykit.io/guides/migrate-to-partyserver] | Actif | Actif | Actif | Actif | Actif |
| Free tier | 100 000 req/j (messages WS entrants comptés **1 pour 20**, sortants **gratuits**), 13 000 GB-s/j, 5 GB SQLite ; dépassement = erreur jusqu'à 00:00 UTC [VÉRIFIÉ] | — | 500 MAU [VÉRIFIÉ ably.com/pricing] | Sandbox : 200k msg/j, 100 connexions simultanées ; un message diffusé à N abonnés compte N+1 [VÉRIFIÉ pusher.com] | 200 connexions, 100 msg/s, 2M msg/mois ; projet en pause après 1 semaine d'inactivité [VÉRIFIÉ supabase.com] | 200 000 connexions par base sur Blaze [VÉRIFIÉ : limits] ; Spark limité à 100 connexions simultanées [À CONFIRMER : page tarifs inaccessible] | 1000 GB/mois gratuits (SFU+TURN), puis 0,05 $/GB [VÉRIFIÉ] |
| Payant | Workers Paid **5 $/mois** : 1M req DO/mois inclus, puis 0,15 $/M ; 400k GB-s inclus, puis 12,5 $/M GB-s [VÉRIFIÉ] | — | dès 29 $/mois | 49 $ (1M msg/j), 99 $ (4M msg/j) | Pro 25 $/mois + dépassements [À CONFIRMER] | paiement à l'usage, facturé au GB téléchargé [À CONFIRMER] | — |
| Compte utilisateur final | Non | — | Non | Non | Non | Non | Non |
| Sous-traitant de données | Cloudflare (déjà hébergeur) | — | **Nouveau** | **Nouveau** | **Nouveau** | **Nouveau** (Google) | Cloudflare |
| Nouvelle dépendance client | Aucune (WebSocket natif) | — | SDK (lourd) | SDK | `supabase-js` | SDK Firebase (lourd) | Pile WebRTC + signalisation |
| CSP | `'self'` si même hôte | — | domaines Ably | domaines Pusher | domaine Supabase | domaines Google | TURN/STUN + signalisation |
| Hors ligne / LAN | Non (Internet requis aux deux bouts) | — | Non | Non | Non | Non | Non (signalisation requise) |
| Latence | Faible, DO localisé près du créateur [HYPOTHÈSE : quelques dizaines de ms en France] | — | ~6,5 ms annoncés dans une région | Faible | Faible | Faible | Faible |
| Complexité | Moyenne : 1 Worker + 1 classe DO (~300 lignes) + tests | — | Faible côté serveur, mais clés et jetons à émettre côté serveur pour éviter d'exposer une clé publique | idem | idem + RLS | idem + règles | **Élevée** |
| Cohérence avec l'existant | **Forte** (Cloudflare Pages déjà utilisé) | — | Faible | Faible | Faible | Faible | Moyenne |

**Points d'architecture Durable Objects vérifiés** :
- Avec l'API Hibernation, les clients restent connectés pendant que l'objet est évincé de la mémoire. La durée n'est pas facturée pendant l'hibernation. La mémoire est réinitialisée au réveil [VÉRIFIÉ : DO websockets].
- `serializeAttachment` permet de stocker jusqu'à **16 384 octets par WebSocket**, conservés à travers l'hibernation [VÉRIFIÉ]. Le **dernier snapshot** (environ 1 à 3 Ko) peut donc vivre dans l'attachement de la socket émettrice, **sans écriture de stockage** : rien n'est persisté côté serveur et les lignes écrites ne sont pas facturées. Absence de facturation de cette opération **[À CONFIRMER]**.
- Les pings de protocole entrants reçoivent un pong automatique sans réveiller l'objet [VÉRIFIÉ]. En revanche, un navigateur ne peut pas émettre de ping de protocole. Les battements applicatifs peuvent passer par `setWebSocketAutoResponse` sans durée facturée [VÉRIFIÉ : State API]. Leur décompte en requêtes est **[À CONFIRMER]**.
- Une mise à jour forcée du code déconnecte les WebSockets [VÉRIFIÉ]. La reconnexion automatique est donc obligatoire.
- Taille maximale d'un message reçu : 32 MiB [VÉRIFIÉ : limits]. Le contrat imposera un plafond de 16 Ko.

### 4.3 Solutions locales ou natives

| Solution | Indépendant ? | Support (BCD MDN, sauf mention) | App / compte | Hors ligne | Étapes | Limites |
|---|---|---|---|---|---|---|
| **BroadcastChannel** (même navigateur, multi-fenêtres) | Oui | Chrome 54+, Firefox 38+, **Safari 15.4+** ; « Baseline widely available » depuis mars 2022 [VÉRIFIÉ] | Non | **Oui** | 3 : « Ouvrir l'écran TV » → glisser la fenêtre sur la TV → plein écran | Même appareil et même profil. Usage desktop/laptop + HDMI. Sur tablette, utile seulement avec un écran étendu (voir HDMI) |
| **Window Management API** (`getScreenDetails`, plein écran sur un écran ciblé) | Oui | Chrome/Edge 100+ ; **pas Firefox ni Safari** ; expérimental [VÉRIFIÉ] | Non | Oui | 2 (avec une invite de permission) | Amélioration progressive pour Chrome desktop seulement |
| **Presentation API** (`navigator.presentation`) | Oui (2 contextes) | Chrome/Edge 47/79+, Android Chrome 47+, Samsung Internet 5+ ; **pas Firefox ni Safari ni iOS** ; expérimental [VÉRIFIÉ BCD]. Écrans secondaires attachés : Chrome 66+ sur ChromeOS, Linux, Windows (« Mac support will come later ») [VÉRIFIÉ : blog Chrome 66] | Non | Oui pour un écran attaché | 2-3 | Le contexte receveur a un stockage isolé (spécification W3C) : il faut utiliser `PresentationConnection`, pas `BroadcastChannel`. Vers Chromecast depuis Chrome desktop, rendu « 1-UA » hors écran puis streamé **[À CONFIRMER par PoC]**. Sur Android, URL https vers Cast **[À CONFIRMER]** |
| **Google Cast Web Sender + Custom Receiver** | Oui | Sender : navigateurs compatibles Cast sur Mac, Windows, Linux, ChromeOS, Android. **« Casting is not supported on the iOS Chrome browser »** [VÉRIFIÉ developers.google.com/cast/docs/web_sender]. Safari et Firefox non supportés **[À CONFIRMER : non listés]** | Compte Google Cast Developer, **5 $ non remboursables**, receveur enregistré, HTTPS en publication, appareil de test à enregistrer [VÉRIFIÉ : registration] | Non (Chromecast en ligne + relais) | 2 : bouton Cast → choisir la TV | Script `gstatic` dans la CSP (+ confidentialité Google). Le receveur CAF est notre page TV qui se connecte au relais. **Ne supprime pas le besoin de relais** ni le contrôle d'iOS |
| **« Caster l'onglet » Chrome desktop** sur une fenêtre `/tv` | Oui (l'onglet TV est casté) | Chrome desktop + Chromecast/Google TV | Non | Réseau local pour le Cast ; données par BroadcastChannel | 3-4 | Le laptop doit rester allumé. Qualité de streaming vidéo. Aucun développement spécifique |
| **AirPlay** | **Non** pour une page web : recopie de l'écran via le Centre de contrôle [VÉRIFIÉ support.apple.com/en-us/102661] ; seule la vidéo peut être streamée | iPhone/iPad/Mac → Apple TV ou TV compatible AirPlay | Non | Réseau local | 3 | Duplication. Pas de navigateur sur tvOS **[À CONFIRMER]** |
| **HDMI + second écran** | Laptop : **oui** en écran étendu ; iPhone/iPad : miroir par défaut ; iPad M1+ avec Stage Manager : écran étendu possible, une fenêtre Safari peut y être déplacée **[À CONFIRMER]** ; Android : miroir, sauf DeX ou mode bureau **[À CONFIRMER]** | Matériel (câble, adaptateur USB-C) | Non | **Oui** avec BroadcastChannel | 3 | Câble entre la cible et la TV |
| **Recopie native** (Cast d'écran Android, Miracast) | Non | Variable | Non | Réseau local | 2-3 | L'UI contrôleur apparaît sur la TV |
| **WebRTC DataChannel P2P** | Oui | Large | Non | **Non** : la signalisation exige un serveur, donc la même infrastructure que le relais | 3 | Serveur STUN/TURN (Cloudflare TURN 0,05 $/GB au-delà du quota, gratuit avec le SFU) [VÉRIFIÉ]. Support WebRTC inégal sur les TV **[À CONFIRMER]**. Complexité élevée pour quelques Ko/min. **Rejeté** |
| **Relais LAN local** (Raspberry Pi, Docker) | Oui | — | **Installation** | Oui en LAN | Nombreuses | Une page `https:` ne peut pas joindre un `ws://` du LAN (contenu mixte), il faut donc un TLS local. Hors périmètre V2 |

### 4.4 Navigateurs des Smart TV et boîtiers

| Plateforme | Moteur web (apps web) par millésime | Source |
|---|---|---|
| LG webOS | 2026 : Chromium 132 · 2025 : 120 · 2024 : 108 · 2023 : 94 · 2022 : 87 · 2021 : 79 · 2020 : 68 · 2018-19 : 53 | [VÉRIFIÉ webostv.developer.lge.com] |
| Samsung Tizen | 2026 : M130 · 2025 : M120 · 2024 : M108 · 2023 : M94 · 2022 : M85 · 2021 : M76 · 2020 : M69 · 2019 : M63 · 2018 : M56 · 2017 : M47 | [VÉRIFIÉ developer.samsung.com] |
| Android TV / Google TV | En général pas de navigateur préinstallé. Chrome n'est pas proposé officiellement, il faut un navigateur tiers | [À CONFIRMER] |
| Fire TV | Navigateur Amazon Silk installable | [À CONFIRMER] |
| Apple TV | Pas de navigateur | [À CONFIRMER] |

**Remarques** :
- Ces versions sont celles du moteur des **apps web** (packagées ou hébergées). Celles de l'**app navigateur** intégrée peuvent différer **[À CONFIRMER sur appareils]**.
- **Tailwind v4** : « Chrome 111, Safari 16.4, Firefox 128 » pour les fonctionnalités cœur [VÉRIFIÉ tailwindcss.com/docs/compatibility]. Les TV 2022 à 2024 (Chromium 85 à 108) sont **sous la baseline**. Les utilitaires d'opacité, de couleur et de cascade peuvent mal s'afficher **[À CONFIRMER par test]**.
- Recommandation : l'écran TV doit avoir une **feuille de style dédiée et conservatrice** :
  - variables CSS ;
  - couleurs hex ou rgb, sans `oklch` ni `color-mix` ;
  - flexbox ou grid simples, sans dépendre de `gap` en flex sous Chromium 84 ;
  - unités `vh`/`vw` plutôt que `dvh`.
  Elle doit être testée sur **Chromium 87 / 94 / 108**.
- Saisie : la télécommande rend la frappe d'URL pénible. D'où le parcours « ouvrir une URL courte une fois, mise en favori, puis code affiché sur la TV ».
- Veille et économiseur d'écran : comportement des navigateurs TV inconnu. Wake Lock API et anti-marquage (léger déplacement des éléments statiques) **[À CONFIRMER]**.

### 4.5 Grille d'évaluation synthétique (5 = meilleur)

| Solution | Simplicité | Étapes | Compat matériel | Compat navigateurs | Sans app | Sans compte | Sans infra | LAN | Hors ligne | Latence | Fiabilité | Sécurité | Confidentialité | Coût | Complexité (5 = simple) | **Indép.** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **A. URL spectateur + relais DO** | 4 | 4 (3 étapes) | **5** | 4 (TV récentes ; 3 sur TV 2022-24) | 5 | 5 | 2 | 2 | 1 | 4 | 4 | 4 (jetons) | 3 (prénoms via Cloudflare) | 4 (0-5 $/mois) | 3 | **Oui** |
| **B. Fenêtre secondaire + BroadcastChannel** | 4 | 4 | 3 (laptop/HDMI) | 5 | 5 | 5 | **5** | 5 | **5** | 5 | 5 | 5 | **5** | **5** | **5** | **Oui** |
| C. B + Window Management API | 5 (Chrome) | 5 | 3 | 2 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | Oui |
| D. Presentation API | 4 | 4 | 3 | 2 | 5 | 5 | 5 (attaché) | 4 | 4 | 4 | 3 [À CONFIRMER] | 5 | 5 | 5 | 3 | Oui |
| E. Google Cast Custom Receiver | 4 | 5 | 3 (Chromecast) | **1** (pas iOS/Safari) | 5 | **3** (compte dev 5 $) | 2 (+ relais) | 3 | 1 | 4 | 3 | 4 | 2 (Google) | 4 | 2 | Oui |
| F. Onglet TV casté (Chrome desktop) | 3 | 3 | 3 | 2 | 5 | 5 | 5 | 4 | 3 | 3 | 3 | 5 | 5 | 5 | **5** (aucun dev) | Oui |
| G. AirPlay / Cast d'écran / HDMI miroir | 5 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | **5** (aucun dev) | **Non** |
| H. SaaS (Ably, Pusher…) | 4 | 4 | 5 | 4 | 5 | 5 | 1 | 2 | 1 | 4 | 4 | 3 | **2** | **1-2** | 3 | Oui |
| I. WebRTC P2P | 3 | 4 | 4 | 3 | 5 | 5 | 1 | 3 | 1 | 5 | 3 | 4 | 4 | 4 | **1** | Oui |

---

## 5. Recommandation

### 5.1 Solution principale, compléments, replis
1. **Principale (deux transports, une seule projection)** :
   - **B, « Écran TV sur ce même appareil »** (fenêtre secondaire + `BroadcastChannel`). Hors ligne, sans infrastructure ni coût. À livrer **en premier comme MVP** : il valide la projection, le contrat et l'UI TV sans attendre la décision serveur. Le complément C (Window Management API sur Chrome desktop) place la fenêtre automatiquement en plein écran sur l'écran externe.
   - **A, « Écran TV par code »** (URL spectateur + relais DO). Couvre tous les autres cas : Smart TV, mini-PC, clé Fire TV, tablette ou téléphone des spectateurs, multi-écrans. **Conditionné à l'arbitrage PO** (frontière backend).
2. **Compléments** :
   - **F** : documenter « Caster l'onglet TV » (Chrome desktop vers Chromecast), sans développement ;
   - **D** : Presentation API en P3 après PoC ;
   - **E** : Google Cast Custom Receiver en P3 exploratoire, utile pour les bars équipés de Chromecast sans navigateur.
3. **Repli** : **G**, la recopie native (AirPlay, Cast d'écran, HDMI miroir), documentée comme « mode miroir » quand rien d'autre n'est possible : iPhone vers Apple TV, ou A refusé et pas de laptop.

### 5.2 Architecture cible (Clean Architecture)

```
                         ┌─────────────────────────────── Appareil de CONTRÔLE (source de vérité) ─────────────────────────────┐
 Domaine (inchangé)      │ matchLifecycle / killer / gotcha / cricketLogic / capital… (fonctions pures)                         │
 Application             │ GameRuntime (état vivant sérialisable par jeu)  ──►  projectSpectatorView(gameRuntime, ctx) (pure)  │
                         │                                         ──►  deriveHighlights(prevProjection, nextProjection) (pure)   │
                         │ Port: BroadcastPublisher { publish(snapshot), end(reason), status$ }                                 │
 Infrastructure          │ LocalChannelPublisher (BroadcastChannel) | RelayWebSocketPublisher | PresentationPublisher | Noop  │
                         └───────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                                                         │ TvSnapshot v1 (JSON ≤ 16 Ko, epoch+seq)
                     ┌───────────────── Relais (optionnel) ──────────────┴────────────┐
                     │ Worker « bougnat-darts-broadcast » + DO BroadcastRoom (SQLite)  │  valide l'ENVELOPPE seulement,
                     │ hibernation, dernier snapshot en attachment, aucun stockage     │  payload opaque, quotas, TTL
                     └───────────────────────────────────┬─────────────────────────────┘
                                                         ▼
                     ┌────────────── Écran de DIFFUSION (lecture seule) ───────────────┐
                     │ Port: BroadcastSubscriber ; TvView (lazy, CSS conservatrice)    │  AUCUNE règle de jeu :
                     │ rend `kind: x01|cricket|…` + animations depuis `highlights`     │  rendu de la projection
                     └─────────────────────────────────────────────────────────────────┘
```

**Pourquoi des snapshots de projection plutôt que des événements rejoués** :
- Les règles restent dans le seul moteur du contrôleur (§7 de la mission). L'écran TV n'embarque **aucun** moteur.
- Le TV peut tourner une **version de bundle différente**, en cache SW ou sur un vieux navigateur. Un contrat de données versionné tolère ce décalage, alors que le rejeu exigerait un moteur identique au bit près.
- Les undo et corrections existants restaurent un état complet (§2.1). Un snapshot n'a besoin d'aucune « compensation ».
- Les messages sont petits (environ 1 à 3 Ko). Le coût des snapshots complets est négligeable devant la robustesse obtenue : idempotence, resynchronisation triviale.
- Conformité avec la constitution transverse : « Le scoring critique ne doit pas reposer sur la synchronisation libre d'un document mutable » (`constitution.transverse.md:32`). Ici, **aucune écriture** ne remonte du TV. La diffusion est une projection en lecture seule, pas une synchronisation de scoring.

**Points d'accroche dans le code existant [VÉRIFIÉ code]** :
- X01 : `App.tsx` reçoit déjà chaque `MatchRuntimeSnapshot` (`App.tsx:360`). Un hook `useBroadcast(runtime)` au niveau du shell suffit, **sans toucher `MatchView`**. Les états éphémères (fin de leg, victoire) se déduisent par comparaison de projections (`completedLegs.length`, `status`). Le retour « TROP ! » se déduit de `isBust` sur la dernière `Turn`.
- Autres jeux : prérequis **V2-TV-03**. Il faut remonter un `GameRuntimeSnapshot` sérialisable par jeu via `onStateChange`, sur le modèle de X01. Cela corrige en même temps l'écart avec la spec 010 (reprise). Sujet partagé avec l'agent « revue des jeux » (5.5).
- `useSharedX01Session` et `SyncRepository` : à retirer, ou à remplacer explicitement par le port `BroadcastPublisher`.

### 5.3 Protocole (contrat `TvSnapshot` v1, proposition)

```jsonc
// Contrôleur → relais/canal (seul émetteur autorisé)
{ "t": "snapshot", "v": 1, "sessionId": "…", "epoch": "c0ffee12", "seq": 42,
  "sentAt": 1763629123456,
  "cause": "turn" | "undo" | "edit" | "leg" | "match_end" | "pause" | "resume" | "sync",
  "view": { "kind": "x01", "schema": 1, /* projection spectateur, voir §6.3 */ },
  "highlights": [ { "id": "c0ffee12:42:0", "type": "180" | "ton_plus" | "bust" | "checkout" | "leg_won" | "set_won" | "match_won", "teamId": "team1", "value": 121 } ],
  "branding": { "hash": "sha256-…" } }          // référence au thème, envoyé à part
{ "t": "branding", "hash": "…", "theme": { /* tokens */ }, "clubName": "…", "logo": "data:image/webp;base64,…" } // ≤ 12 Ko, rare
{ "t": "end", "reason": "stopped" | "expired" | "match_closed" }

// Relais → écran
{ "t": "snapshot", … }  // le dernier, à la connexion puis à chaque nouveauté
{ "t": "status", "publisher": "online" | "offline", "since": 1763629000000 }
{ "t": "end", … }

// Écran → relais (uniquement)
{ "t": "hello", "role": "viewer", "token": "<viewerToken>", "lastEpoch": "…", "lastSeq": 41 }
"ping"  // auto-réponse « pong » (setWebSocketAutoResponse)
```

Règles :
1. **Monotonicité** :
   - `epoch` est un aléa régénéré à chaque démarrage de l'émetteur (rechargement de l'onglet) ;
   - `seq` est strictement croissant dans un epoch ;
   - l'écran ignore tout `(epoch, seq)` déjà vu ou plus ancien dans le même epoch ;
   - un nouvel epoch remplace l'état affiché (resynchronisation complète).
   Alternative : persister `seq` avec `matchRuntime`, mais l'epoch est plus simple et sûr.
2. **Idempotence** : un snapshot étant complet, sa réception multiple est sans effet. Les animations ne se déclenchent que sur un `highlight.id` jamais vu, ce qui évite de rejouer un « 180 » à la reconnexion. Si `cause: "undo"`, pas d'animation, mais un badge discret « Correction ».
3. **Resynchronisation** : à chaque (re)connexion, le relais envoie le dernier snapshot conservé dans l'attachement de la socket émettrice. Si l'émetteur est absent et qu'aucun snapshot n'existe, l'écran affiche « En attente de la tablette » et le relais demande `{t:"sync"}` à l'émetteur dès son retour.
4. **Coalescence côté contrôleur** : un délai de 100 à 150 ms après le commit React, envoi hors du chemin d'interaction (spec 020, INP). Au plus 2 messages/s (plafond côté relais). Pas d'envoi périodique : seulement à chaque changement, plus un `sync` à la reconnexion.
5. **Plafonds** : snapshot ≤ 16 Ko (contrat) ; écrans par session ≤ 20 (contre les abus) ; sessions actives par IP limitées (rate limiting Cloudflare ou compteur DO) **[À CONFIRMER : outil exact]**.
6. **Jamais bloquant** : une panne du relais **ne doit jamais** retarder ni empêcher la saisie. Envoi de type « fire-and-forget » et indicateur d'état seulement (invariant de spec).

### 5.4 Droits, jetons, sessions sans compte
| Élément | Génération | Détenteur | Usage | Durée de vie |
|---|---|---|---|---|
| `sessionId` | aléa 128 bits (`createId`) | contrôleur | identifie la salle DO (`idFromName(sessionId)`) | ≤ 12 h glissantes (aligné sur `EXTERNAL_MATCH_CONTEXT_TTL_MS`) |
| `publisherToken` | aléa 128 bits, **jamais dans une URL** | contrôleur seulement (IndexedDB) | seul droit d'émettre ; le DO garde son **hash** en attachement | durée de la session |
| `viewerToken` | aléa 128 bits **distinct** | QR/lien spectateur, écrans appairés | lecture seule ; **renouvelable** (« Changer le lien »), ce qui coupe les anciens spectateurs | durée de la session ou jusqu'au renouvellement |
| `pairingCode` (affiché sur la TV) | 6 caractères sans ambiguïté (base 31 sans 0/O/1/I/L, environ 29 bits) | TV, en attente | le contrôleur saisit le code, et le relais remet un `viewerToken` à la TV | **10 min, usage unique**, tentatives limitées |

- Le lien spectateur porte le jeton dans le **fragment** (`/tv#v=…`). Le fragment n'est pas envoyé au serveur ni journalisé. Le client le transmet dans `hello`, pas dans l'URL du WebSocket.
- Le DO **ignore et ferme** toute socket de rôle `viewer` qui émet autre chose que `hello` ou `ping`. Un spectateur **ne peut pas** modifier les scores : il n'existe aucune commande d'écriture, et l'état fait foi sur le contrôleur seulement.
- Contrôle de l'en-tête `Origin` à l'upgrade WebSocket (origines autorisées par environnement, comme `isAllowedOrigin` dans `token.ts`).
- **Fin de diffusion** : « Arrêter la diffusion » → `end` → le DO ferme toutes les sockets et oublie la salle. Fin automatique 30 min après `match_end` sans nouvelle partie, ou après 12 h. Le TV revient à l'écran d'attente avec un nouveau code.
- **Station persistante (club)** : le contrôleur mémorise les écrans appairés (`screenId` stable dans le localStorage de la TV). Revanche et nouvelle partie **continuent sur la même TV sans nouvel appairage** pendant la session (soirée).
- **Confidentialité** :
  - les prénoms transitent en mémoire chez Cloudflare (déjà hébergeur) ; **aucune persistance côté serveur** (pas de stockage DO), aucun journal applicatif contenant des noms ;
  - option « Afficher les initiales » sur la TV (bars) ;
  - mention dans la politique de confidentialité et dans la doc ;
  - pas d'analytics de diffusion.

### 5.5 Charge et coût estimés (calculs à partir des tarifs vérifiés §4.2)
Hypothèses : 1 contrôleur et 1 TV par partie ; 5 (re)connexions par client et par partie ; battement applicatif toutes les 60 s par client (si nécessaire, **[À CONFIRMER]**) ; environ 3 requêtes HTTP d'appairage par partie ; 20 ms d'activité DO par message (réveil compris) **[HYPOTHÈSE]**.

| Scénario | Msgs entrants/j | Req DO facturées/j (WS 1/20 + connexions + battements + HTTP) | GB-s/j | Plan Free (100k req/j, 13k GB-s/j) | Plan Paid (5 $ + dépassements) |
|---|---|---|---|---|---|
| **Mission** : 1000 parties × 2 h × 1 msg/5 s | 1 440 000 | 72 000 + 10 000 + 12 000 + 3 000 ≈ **97 000** | ≈ 3 700 | **Limite** (3 % de marge), échec de toute diffusion en cas de dépassement jusqu'à 00:00 UTC | 2,9M req/mois → 0,29 $ ; GB-s inclus → **≈ 5,3 $/mois** |
| **Réaliste, émission au changement** (environ 1 msg par volée, ≈ 400 par partie) | 400 000 | 20 000 + 10 000 + 12 000 + 3 000 ≈ **45 000** | ≈ 1 000 | OK (marge ≈ 55 %) | ≈ 5 $/mois |
| ×10 (10 000 parties/j, émission 1/5 s) | 14 400 000 | ≈ 970 000 | ≈ 37 000 | Hors free | DO 29M req → 4,2 $ ; 1,1M GB-s → 8,8 $ ; total **≈ 18 $/mois** |

Pour comparaison (scénario mission) :
- **Pusher** : 2,88M msg/j (entrants + livrés), soit le plan Pro à 99 $/mois ;
- **Ably** : plus de 500 MAU, donc dès 29 $/mois et une croissance au MAU ;
- **Supabase** : 2M msg/mois gratuits contre environ 86M nécessaires, donc Pro avec dépassements **[À CONFIRMER]**.

Sans hibernation (DO gardé en mémoire 2 h par partie), on aurait environ 900 000 GB-s/j, soit **≈ 340 $/mois**. **L'hibernation et l'absence de minuterie dans le DO sont des exigences de spec.**

Recommandation coût : démarrer sur le plan Free avec émission au changement, quotas par session et kill switch (`VITE_ENABLE_TV_BROADCAST`). Prévoir, sur décision PO, le **plan Workers Paid (5 $/mois)** comme assurance, avec un **plafond de dépenses DO** (fonction « spending limit » documentée par Cloudflare).

### 5.6 Hors ligne et réseau local
- Le transport **B** (même appareil) fonctionne **totalement hors ligne**. C'est la réponse au principe offline-first.
- Le transport **A** exige Internet sur le contrôleur et sur la TV. Si la connexion tombe, le contrôleur continue de scorer ; la TV affiche « Connexion perdue, dernier score connu » avec l'heure ; puis resynchronisation automatique.
- Pas de relais LAN en V2 (contenu mixte et TLS local, §4.3).

### 5.7 Déploiement
- Option 1 (moins invasive) : **Worker séparé** `bougnat-darts-broadcast` portant la classe DO, plus un binding DO dans le projet Pages. La Function `functions/api/tv/[[path]].ts` relaie l'upgrade vers le DO : **même origine**, CSP `'self'`, pas de CORS. Impacts : `wrangler.jsonc` (binding), `scripts/validate-wrangler-config.mjs`, CI de déploiement du Worker.
- Option 2 : migrer le projet de Pages vers Workers + static assets (un seul déploiement). Plus structurant, à traiter dans l'ADR et avec l'agent « structure projet » (5.9).
- Dans les deux cas, le DO ne contient **aucune règle de jeu**. Il valide l'**enveloppe** (type, taille, rôle, monotonicité) avec un schéma partagé `src/shared/broadcast/contract.ts`, importable par le Worker.

---

## 6. UX du mode TV

### 6.1 Parcours d'appairage (≤ 3 étapes)
**Parcours « TV d'abord »** (salon, club, bar) :
1. Sur la TV, ouvrir `play.bougnatdarts.fr/tv`, à mettre en favori ou en page d'accueil pour une TV fixe. La TV affiche l'**écran d'attente** : logo Bougnat Darts (et club), **code `K7M-4QX`**, consigne « Sur la tablette : Diffuser → saisir ce code ».
2. Sur la tablette, en partie ou au setup, bouton **« Diffuser sur un écran »** (icône TV dans la `MatchTopBar`).
3. Saisir le code, puis « Connecté à l'écran : Salon » ; la TV bascule sur la partie.
→ Ensuite, revanche ou nouvelle partie : **aucune** nouvelle étape.

Le parcours inverse « QR d'abord » (le QR affiché par le contrôleur est scanné par la TV) est déconseillé : une TV ne scanne pas. De plus, sur la tablette, le scan d'un QR ouvre un **nouvel onglet** et non la partie en cours (constat de la spec 030 sur iOS : stockage séparé entre la PWA et Safari).

**Parcours « Même appareil »** (laptop + HDMI) : « Diffuser » → « Sur cet appareil (2e écran) ». Une fenêtre `/tv?local=1` s'ouvre. Sur Chrome desktop, elle se place automatiquement en plein écran sur l'écran externe après accord de permission. Ailleurs, la consigne est « glissez cette fenêtre sur la TV puis appuyez sur F11 ».

**Spectateurs mobiles** (option, P2) : sur la TV ou la tablette, un QR « Suivre la partie sur mon téléphone » donne le lien lecture seule. Levier d'adoption, sans publicité.

### 6.2 États et transitions
| Situation | Contrôleur | TV |
|---|---|---|
| Diffusion active | pastille « TV ● » verte dans la barre | partie |
| Relais en reconnexion | pastille orange « TV … », **saisie jamais bloquée** | dernier état + bandeau discret « Reconnexion… » après 5 s |
| Contrôleur hors ligne > 30 s | — | « En attente de la tablette » sous les scores figés + heure de la dernière mise à jour |
| Correction ou annulation | — | état corrigé sans animation + badge « Correction » 2 s |
| Pause (nouvelle commande, publisher seulement) | « Mettre la TV en pause » | écran « Pause » (branding club, scores réduits) |
| Fin de leg | — | interstitiel 3 s « Leg pour Alice », miroir de `legTransition` (`MatchView.tsx:452`) |
| Victoire | — | écran vainqueur + stats clés ; reste affiché jusqu'à la revanche ou 30 min |
| Fin de diffusion | « Arrêter la diffusion » | retour à l'écran d'attente avec un nouveau code |
| TV redémarrée | — | reconnexion automatique avec le `viewerToken` stocké ; sinon écran d'attente |
| Reprise d'une partie (rechargement du contrôleur) | session de diffusion restaurée depuis IndexedDB, nouvel `epoch` | resynchronisation complète transparente |

Reconnexion : backoff exponentiel avec gigue (1, 2, 4, 8 s, puis plafond 30 s) ; reprise immédiate sur `online` et `visibilitychange`.

### 6.3 Contenu par jeu, sans modèle unique imposé
- **X01** (`kind: "x01"`) :
  - format (« Premier à 3 legs », « 2 sets de 3 legs ») ;
  - par camp : nom (et coéquipiers en doublette), **score restant en très grand**, legs et sets, moyenne 3 fléchettes (match), fléchettes du leg, 3 dernières volées, badge d'engagement, indicateur du joueur actif ;
  - **suggestion de checkout** uniquement si `checkOut === 'Double'` et `isCheckoutPossible` (voir P5) ;
  - chrono ; niveau du bot s'il y a un bot ;
  - de 3 à 4 joueurs ou en doublette : disposition en lignes.
  Temps forts :
  - 180 (animation plein écran 2 s) ;
  - 140+ et 100+ (bandeau) ;
  - « TROP ! » ;
  - « CHECKOUT 121 » ;
  - leg, set, match.
- **Cricket** :
  - grille cibles 20 à 15 + Bull × joueurs, marques `/ X Ⓧ` ;
  - cibles fermées par tous grisées (projection calculée via `isNumberClosedGlobally` **sur le contrôleur**) ;
  - points ; tour `7/20` (`cricketRounds`) ;
  - fléchettes de la volée en cours (●●○), joueur actif.
- **Capital** :
  - **cible courante en très grand** (« Côte à côte ») ;
  - progression 1 à 17 ;
  - scores ;
  - échec (« ÷2 ») ou réussite de la dernière volée.
- **Killer** : joueurs avec numéro, vies, statut « Killer », éliminés grisés, dernier fait (« Alice élimine Bob »).
- **Gotcha** : distance à la cible (301 exact), classement, remises à zéro mises en évidence.
- **Triathlon** : phase en cours (bull, Capital, Cricket, X01, barrage) + classement général + vue de la sous-épreuve (réutilise les projections ci-dessus).
- **Voix + TV** (§5.1) :
  - aujourd'hui, la proposition vocale **préremplit** le champ et attend une validation (`proposal.prefillScore` → `setInputBuffer`, `MatchView.tsx:203-206`) [VÉRIFIÉ code] ;
  - option P2 : afficher sur la TV « Annoncé : 140 ? » en attente, puis valider. Le score n'est officiel qu'après validation sur le contrôleur ;
  - le scénario « sans toucher la tablette » exige une décision de **validation vocale explicite** (« valide »), du ressort de l'agent voix. Le TV n'en est que l'afficheur.

### 6.4 Lisibilité à 3-5 m, format 16:9
- Disposition en `vh`/`vw` et zone sûre de 5 % (overscan TV). Sur une TV 55" (environ 68 cm de haut) vue à 4 m : chiffres du score restant ≥ 20 % de la hauteur (environ 14 cm), noms ≥ 6 %, informations secondaires ≥ 3,5 % **[HYPOTHÈSE à valider par test terrain à 3 m et 5 m]**.
- Contraste élevé (thème sombre par défaut, AA renforcé pour les infos secondaires). Chiffres tabulaires. Aucune information portée par la seule couleur (joueur actif = couleur + flèche + texte « À Alice »).
- Animations courtes (≤ 2 s), sans clignotement rapide (épilepsie). Respect de `prefers-reduced-motion` quand c'est disponible.
- Plein écran au premier clic de télécommande. Curseur masqué après inactivité. Wake Lock si disponible. Léger déplacement périodique des éléments statiques (anti-marquage) **[À CONFIRMER : utilité]**.
- Rendu testé en 1280×720, 1920×1080 et 3840×2160 (DPR variable sur TV).

### 6.5 Thème et co-branding (lien §5.7)
- Le message `branding` (tokens de thème + nom du club + logo ≤ 12 Ko, déjà validé et compressé par l'éditeur de thème) est envoyé une fois, puis référencé par hash.
- La TV applique les tokens dans **sa feuille conservatrice** (variables CSS).
- **« Powered by Bougnat Darts » non désactivable** dans une zone fixe de l'écran TV, y compris en écran d'attente.
- Écran d'attente aux couleurs du club : vitrine pour les bars et les clubs, levier d'adoption sans publicité.

### 6.6 Scénarios
1. **Salon** : TV LG 2023 (navigateur), smartphone contrôleur. Code saisi une fois. Sinon, laptop en HDMI et transport local hors ligne.
2. **Club** : tablette fixée près de la cible + TV avec mini-PC ou clé Fire TV en page d'accueil `/tv`. Appairage une fois par soirée, revanches enchaînées. Option voix.
3. **Bar** : TV en kiosque, branding du bar, initiales seulement, QR « Suivre sur mon téléphone » (option).
4. **Voix + TV** : le joueur annonce « cent quarante », la tablette propose, il valide d'un geste (ou par la voix si la spec voix le permet), la TV anime « 140 ! ».
5. **Rencontre associative multi-écrans** :
   - N cibles, chacune avec sa tablette et sa TV, chaque paire étant indépendante ;
   - un écran « mur » regroupant plusieurs cibles serait une **projection agrégée multi-sessions**, à réserver en P3. En contexte tournoi, elle relève du backend Tournois (constitution transverse : « supervision/live »).

---

## 7. Bénéfices, contraintes, risques

**Bénéfices** :
- fonctionnalité signature, utilisable sans compte ni application ;
- zéro coût en mode local ;
- coût marginal en mode relais (0 à 5 $/mois au départ) ;
- remontée de l'état de jeu bénéfique aussi pour la reprise (spec 010) ;
- vitrine pour clubs et bars (co-branding) ;
- synergie avec la voix et avec l'interopérabilité (le contrat de projection pourrait être consommé par des partenaires ou par le backend Tournois).

**Contraintes** :
- frontière « pas de backend » à amender ;
- Worker séparé (ou migration) ;
- CSS spécifique TV ;
- matrice d'appareils réels ;
- prérequis de refactoring de l'état des jeux non-X01.

**Risques** :
| Risque | Prob. | Impact | Mitigation |
|---|---|---|---|
| Rendu dégradé sur TV 2022-2024 (Tailwind v4) | Haute | Haut | CSS TV conservatrice + tests Chromium 87/94/108 |
| Dépassement du free tier → diffusion coupée jusqu'à 00:00 UTC | Moyenne (si succès) | Moyen | Émission au changement, quotas, message clair, plan Paid à 5 $ |
| Fuite d'un lien spectateur (prénoms) | Moyenne | Faible à moyen | Jeton renouvelable, TTL, initiales, pas de persistance |
| Code d'appairage deviné ou squatté | Faible | Faible | 10 min, usage unique, limite de tentatives, confirmation visuelle sur le contrôleur |
| Régression INP du contrôleur | Faible | Moyen | Envoi après commit, coalescence, mesure (spec 020) |
| Le relais devient un « backend métier » par glissement | Moyenne | Haut (gouvernance) | ADR : payload opaque, pas de stockage, pas de règles, pas de comptes |
| Décalage de version contrôleur/TV | Moyenne | Moyen | `v` et `schema` ; écran « mettez à jour » si le schéma n'est pas supporté ; rechargement automatique du TV entre deux parties |
| Veille TV, onglet suspendu | Moyenne | Moyen | Wake Lock, reconnexion sur `visibilitychange`, doc |

---

## 8. Propositions de spécifications

| ID provisoire | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances |
|---|---|---|---|---|---|---|---|
| **V2-TV-00** | ADR « Frontière : relais de diffusion optionnel non métier » | Reco archi | Amende `CONTRIBUTING.md`, `docs/product-scope.md` et `docs/architecture.md` : un relais de transport sans règles, sans stockage, sans compte, désactivable et auto-hébergeable est permis. Trace le précédent de la spec 030 | Débloque A | S | **P0** | Arbitrage PO |
| **V2-TV-01** | Étude et ADR « Architecture de diffusion » | Étude exploratoire / Reco archi | Valide : source de vérité contrôleur, projection snapshot, port `BroadcastPublisher/Subscriber`, choix DO et hibernation, Worker séparé ou migration Workers, modèle de jetons. Inclut 3 PoC : DO + hibernation + attachement ; Presentation API vers Cast ; rendu TV sur Chromium 87/94/108 | Réduit les risques | M | **P0** | V2-TV-00 |
| **V2-TV-02** | Contrat `TvSnapshot` v1 et projection spectateur X01 | Reco archi | Types partagés `src/shared/broadcast/`, `projectX01SpectatorView` (réutilise `buildPlayerScoreViewModel` et `calculateDetailedStatsForTeam`), `deriveHighlights` pur, tests unitaires sans DOM | Cœur sans duplication | M | **P1** | V2-TV-01 |
| **V2-TV-03** | État runtime sérialisable pour Cricket, Capital, Killer, Gotcha, Triathlon | Reco archi (+ corrige spec 010) | Extraire un `GameRuntimeSnapshot` par jeu avec `onStateChange` et restauration (modèle X01). **Enrichit la spec 010** (reprise de tous les jeux) | Prérequis TV + reprise | L | **P1** | Agent jeux 5.5 |
| **V2-TV-04** | Écran TV sur le même appareil (BroadcastChannel + Window Management API) | Demande V2 | Bouton « Diffuser → sur cet appareil », route `/tv?local=1` chargée à la demande, placement automatique sur Chrome desktop, hors ligne | **MVP sans infrastructure** | M | **P1** | V2-TV-02, V2-TV-06 |
| **V2-TV-05** | Relais de diffusion Cloudflare | Demande V2 | Worker + DO `BroadcastRoom` (SQLite, hibernation, attachement), enveloppe validée, quotas, TTL, contrôle d'Origin, kill switch, CSP, `wrangler:check`, tests Miniflare | Écrans distants | L | P1 | V2-TV-00/01/02 |
| **V2-TV-06** | UI écran TV X01 (16:9, 3-5 m, animations, victoire, pause, attente) | Reco UX/UI | `TvView` chargée à la demande, CSS conservatrice, états §6.2, accessibilité | Signature | L | **P1** | V2-TV-02, design system |
| **V2-TV-07** | Appairage par code TV, lien et QR lecture seule, reconnexion, fin de diffusion, station persistante | Demande V2 | Parcours §6.1, jetons §5.4, mémorisation des écrans appairés, QR à l'exécution (import dynamique de `qrcode`) | ≤ 3 étapes | M | P1 | V2-TV-05 |
| **V2-TV-08** | Écrans TV Cricket, Capital, Killer, Gotcha, Triathlon | Demande V2 | Projections et dispositions par jeu (§6.3) | Couverture des jeux | L | P2 | V2-TV-03, V2-TV-06 |
| **V2-TV-09** | Thème et co-branding transmis au TV | Demande V2 (5.7) | Message `branding`, mention Bougnat non désactivable, écran d'attente club | Adoption clubs et bars | M | P2 | Spec thèmes (5.7) |
| **V2-TV-10** | Multi-écrans et spectateurs mobiles, confidentialité (initiales) | Demande V2 | Plusieurs écrans par session, QR « suivre », renouvellement du lien, plafond d'écrans | Bars, événements | M | P2 | V2-TV-05/07 |
| **V2-TV-11** | Matrice de compatibilité TV et protocole de test terrain | Étude exploratoire | Tizen 2022-26, webOS 22-26, Fire TV Silk, Chrome desktop + Cast, iPad Stage Manager ; lisibilité à 3 et 5 m | Fiabilité | S | P1 | — |
| **V2-TV-12** | Voix + TV | Innovation (5.1) | Affichage de la proposition en attente, retour de validation, scénario mains libres (dépend de la décision de validation vocale) | Différenciation | M | P2 | Spec voix |
| **V2-TV-13** | Presentation API (écran attaché, Cast 1-UA) | Étude exploratoire | Adaptateur `PresentationPublisher` après PoC | Confort Chrome | S | P3 | V2-TV-04 |
| **V2-TV-14** | Google Cast Custom Receiver | Étude exploratoire | Receveur = page TV ; coût de 5 $ ; CSP `gstatic` ; pas d'iOS | Bars avec Chromecast | M | P3 | V2-TV-05 |
| **V2-TV-15** | Documentation « Diffuser sur un grand écran » + confidentialité | Documentation | Guide utilisateur (salon, club, bar, miroir AirPlay en repli), mise à jour de la politique de confidentialité, mise à jour d'architecture | Adoption | S | P1 | V2-TV-04/05 |
| **V2-TV-16** | Écran « mur » multi-cibles | Innovation | Projection agrégée de plusieurs sessions ; en tournoi, à arbitrer avec le backend Tournois | Événements | L | P3 | Interop 5.10 |

**Specs existantes concernées** :
- **010** : à enrichir (tous les jeux ; corriger les points d'entrée cités) ;
- **001** : ajouter une surface « affichage » (TV) aux modes d'accès ;
- **031** : politique de mise à jour SW pour la route TV (recharge autorisée hors partie) ;
- **020** (INP) : critère « publication hors chemin d'interaction » ;
- **029** : stratégie de couverture des nouvelles couches (shared, feature pure, Worker) ;
- **018** : clarifier la cible CSS legacy ;
- **030** : pas de changement de contrat. Le précédent « backend-free » est à traiter dans V2-TV-00.

### ADR proposés
1. **ADR-TV-1** : l'appareil de contrôle est la seule source de vérité. La diffusion est une projection en snapshot unidirectionnelle, sans rejeu d'événements sur l'écran.
2. **ADR-TV-2** : un port de transport avec adaptateurs (BroadcastChannel, relais WebSocket, Presentation). Un seul contrat `TvSnapshot` versionné.
3. **ADR-TV-3** : relais Cloudflare DO avec hibernation, sans stockage serveur (dernier snapshot en attachement), plutôt qu'un SaaS tiers. Mode de déploiement : Worker séparé ou migration vers Workers.
4. **ADR-TV-4** : modèle de jetons (publisher, viewer, code d'appairage), TTL et révocation.
5. **ADR-TV-5** : amendement de la frontière open source (= V2-TV-00).
6. **ADR-TV-6** : feuille de style TV conservatrice et baseline de compatibilité TV (proposition : Chromium ≥ 87, soit les TV de 2022 et plus récentes).

---

## 9. Décisions à arbitrer par le product owner
1. **Accepter un relais serveur optionnel**, sans logique métier ni stockage (A), malgré la position « backend-free » (CONTRIBUTING, spec 030) ? Sinon, le mode TV se limite au même appareil et à la recopie.
2. **Budget** : plan Cloudflare Free (risque de coupure en cas de succès) ou **Workers Paid 5 $/mois** avec plafond de dépenses ?
3. **Périmètre du MVP** : (a) X01 en local seulement, (b) X01 en local + relais, (c) tous les jeux (exige V2-TV-03) ?
4. **Ordre de livraison** : transport local d'abord (sans infrastructure, recommandé) ou relais d'abord ?
5. **Appairage** : code affiché sur la TV en mode principal (recommandé), avec QR et lien pour les spectateurs mobiles ?
6. **Spectateurs publics** (QR « suivre sur mon téléphone ») autorisés ? **Prénoms complets ou initiales par défaut** ?
7. **Durées de vie** : session 12 h ? fin automatique 30 min après la victoire ? appairage par soirée ?
8. **Baseline de compatibilité TV** (Chromium ≥ 87 proposé) et **budget d'appareils de test** (clé Fire TV, accès à une TV LG ou Samsung de 2022-23) ?
9. **Google Cast Custom Receiver** (5 $, dépendance Google, pas d'iOS) : à reporter (P3) ?
10. **Voix + TV** : faut-il viser le « sans toucher la tablette », ce qui implique une validation vocale (décision de la spec voix) ?
11. **Tournois** : la diffusion en contexte tournoi reste-t-elle du ressort du backend Tournois (constitution transverse), le relais du compteur servant aux usages libres (salon, club, bar) ?
12. **Pause** : introduire une notion de pause côté contrôleur (aujourd'hui inexistante, aucune occurrence dans `src`, `views` ni `components`) ?

## 10. Limites de l'analyse et points non vérifiés
- **Aucun test sur appareils réels** (TV, Chromecast, iPad Stage Manager, Fire TV). Toutes les compatibilités runtime de TV sont **[À CONFIRMER]**.
- Les versions de moteur LG et Samsung concernent les apps web. Celles du **navigateur intégré** peuvent différer.
- Non vérifiés : Presentation API vers Chromecast (mode 1-UA desktop, comportement Android) ; Spark Firebase (100 connexions) ; dépassements Supabase ; facturation de `serializeAttachment` et des auto-réponses ; nécessité réelle d'un battement applicatif (délai d'inactivité des WebSockets).
- Les coûts reposent sur des **hypothèses de charge** (durée d'activité DO par message, nombre de reconnexions) à mesurer en PoC.
- Les tests unitaires n'ont pas été lancés, pour préserver la lecture seule. Le constat P1 (perte de l'état non-X01 au rechargement) est déduit du code (`App.tsx:365-422`, vues sans prop d'état restauré), **pas reproduit à l'exécution**.
- La lisibilité à distance (tailles) est une hypothèse de conception à valider en test terrain.
- Certaines pages externes étaient inaccessibles (DNS intermittent) : tarifs Firebase, PartyKit sur GitHub, articles Chrome sur Presentation vers Cast.
