> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 04 — Scoring vocal et reconnaissance vocale (chantier 5.1)

- Agent : « Scoring vocal et reconnaissance vocale »
- Date d'analyse : 2026-11-20
- Repo : `Bougnat_darts_counter`, branche `feat/v2.0.0`, HEAD `508dfa6` (arbre propre, aucune modification effectuée)
- Convention de marquage : **[VÉRIFIÉ code]**, **[VÉRIFIÉ test exécuté]** (parseur exécuté hors repo, voir §1.3), **[VÉRIFIÉ source externe + URL, consultée le 2026-11-20]**, **[HYPOTHÈSE]**, **[À CONFIRMER]**.

---

## 0. Synthèse exécutive

1. **L'existant est propre techniquement, mais ce n'est pas un « game changer »** : c'est un *assistant de proposition* à la demande, borné à X01, un tour à la fois. Le parcours actuel est : toucher le micro → parler → toucher « Valider ». Soit **2 contacts écran par volée**, alors qu'un score fréquent (60, 45, 26…) se saisit au keypad en 3 touches ou en **1 touche** avec les raccourcis existants. Le gain d'interaction est donc faible sur les scores simples [VÉRIFIÉ code `views/MatchView.tsx:377-386`, `:509-526`].
2. **Plusieurs défauts concrets dégradent la fiabilité perçue** (tous vérifiés dans le code) : perte de l'audio prononcé avant l'ouverture du WebSocket alors que l'UI affiche déjà « Écoute en cours » ; fenêtre d'écoute fixe de 6,5 s non prolongée par la parole ; `UtteranceEnd` jamais émis par Deepgram (paramètre `utterance_end_ms` absent) ; un *bust* annoncé est rejeté comme « invalide » ; les nombres français en toutes lettres à plusieurs mots (« cent quarante », « quarante-cinq ») sont rejetés si Deepgram ne les convertit pas ; « un triple vingt » donne 61 ; toute phrase contenant « a »/« à » bascule en intention « score restant ».
3. **Aucune commande vocale complémentaire** (annuler, valider, corriger, joueur suivant, « il reste combien ») et **aucun retour sonore/TTS** [VÉRIFIÉ test exécuté].
4. **Coût Deepgram actuel faible** (session courte par tour) : ~0,0061 $/min (Nova-3 0,0048 $ promo + keyterm 0,0013 $) [VÉRIFIÉ https://deepgram.com/pricing]. Un mode « mains libres » en écoute continue multiplierait le temps facturé par ~10 ; sans *gating* VAD local, ce n'est pas compatible avec la gratuité à grande échelle.
5. **Le paysage technique a bougé en 2026** : Web Speech API désormais avec reconnaissance *on-device* (Chrome desktop 139+, **Firefox 160 desktop, sortie le 10/11/2026**), biais contextuel `phrases` (Chrome 142+) ; modèles WASM/ONNX français légers (Moonshine-tiny-fr ≈ 28 Mo int8, Whisper-tiny ≈ 41 Mo int8) ; Silero VAD web maintenu. Picovoice est **incompatible** (B2B, pas d'offre gratuite/perso).
6. **Recommandation** : refonte **progressive** et non big-bang — (a) fiabiliser le pipeline Deepgram et réécrire le parseur FR (P0) ; (b) poser un port `SpeechRecognizer` + un contrôleur de session vocale indépendant de React + des **commandes métier partagées keypad/voix** (P1) ; (c) livrer un **« mode partie » mains libres** avec confirmation temporisée annulable par la voix, TTS, changement de joueur automatique, et **gating VAD** pour maîtriser le coût (P1) ; (d) étudier par POC mesuré un moteur on-device/hybride (P1 étude) ; (e) étendre au Cricket (P2) et au mode TV (P2).
7. **Arbitrage clé** : l'invariant de la spec 003 « aucun score vocal ne doit être validé sans confirmation explicite » est **incompatible** avec le « jouer sans toucher l'écran ». Proposition : confirmation **implicite temporisée** (ex. 2 s, annulable par « non/annule » ou un tap), réservée au mode partie et aux propositions non ambiguës.

---

## 1. Périmètre et fichiers analysés

### 1.1 Code source (lu intégralement)
| Fichier | Lignes | Rôle |
|---|---|---|
| `src/features/x01/voice/useDeepgramStreaming.ts` | 650 | Hook React : orchestration micro + token + WebSocket + timeout + tentatives |
| `src/features/x01/voice/audioContextManager.ts` | 152 | Graphe Web Audio (source → AudioWorklet → gain 0 → destination) |
| `public/pcmCaptureWorklet.js` | 22 | Worklet : `postMessage` de chaque quantum de rendu (128 frames) |
| `src/features/x01/voice/voicePcm.ts` | 40 | Sous-échantillonnage moyenne → Int16 |
| `src/features/x01/voice/deepgramClient.ts` | 85 | Fetch + cache mémoire du token |
| `src/features/x01/voice/deepgramConnectionManager.ts` | 46 | `DeepgramClient.listen.v1.connect` |
| `src/features/x01/voice/deepgramLiveTypes.ts` | 45 | Contrat messages Deepgram |
| `src/features/x01/voice/voiceConfig.ts` | 35 | Paramètres Deepgram + timeout |
| `src/features/x01/voice/voiceSessionModel.ts` | 80 | Tentatives, causes d'erreur, libellés |
| `src/features/x01/voice/voiceStreamingModel.ts` | 51 | Buffer PCM borné, assemblage de l'utterance |
| `src/features/x01/voice/voiceStreamingLogger.ts` | 12 | Logs |
| `src/features/x01/voice/voiceProposalModel.ts` | 70 | Arbitrage proposition / pré-remplissage |
| `src/features/x01/voice/VoiceScoringControl.tsx` | 68 | Bouton micro |
| `src/features/x01/voice/dartsSpeech*.ts` (8 fichiers) | ~1 050 | Normaliseur, lexique, tokenisation, intention, parsing |
| `functions/api/deepgram/token.ts` | 199 | Pages Function de provisioning |
| `lib/deepgramToken.ts` | 69 | Grant Deepgram + vérification projet |
| `views/MatchView.tsx` (sections voix) | 869 | Intégration |
| `components/match/MatchInputBar.tsx`, `MatchSettingsModal.tsx`, `components/game/Keypad.tsx` | — | Affichage proposition, toggle, slot du bouton |
| `src/features/x01/scoring/matchSubmission.ts` | — | Use case de soumission partagé avec le keypad |
| `vite.config.ts` (route locale token), `src/lib/env.ts`, `wrangler.jsonc`, `.env.local.example` | — | Configuration |
| `node_modules/@deepgram/sdk` v5.20.0 (`dist/esm/CustomClient.mjs`) | — | Vérification de la sérialisation des paramètres et de l'auth navigateur |

### 1.2 Tests, specs, docs
- Tests : `tests/unit/dartsSpeechParser.test.ts` (285 l.), `tests/unit/x01/useDeepgramStreaming.test.tsx` (506 l.), `voiceProposalModel`, `voiceSessionModel`, `voiceStreamingModel`, `voicePcm`, `voiceConfig`, `deepgramClient`, `deepgramConnectionManager`, `audioContextManager`, `VoiceScoringControl`, `tests/unit/lib/deepgramToken.test.ts`, `tests/unit/api/deepgramTokenRoute.test.ts`. **Aucun test E2E voix** (`tests/e2e/*` : 0 occurrence) et **aucun test d'intégration MatchView ↔ voix** [VÉRIFIÉ grep].
- Specs : `specs/003-counter-voice-scoring-reliability/{spec,plan,tasks}.md`, `specs/006-counter-voice-token-provisioning-hardening/{spec,plan,tasks}.md`, `specs/README.md`, specs 018 (iOS 12), 031 (PWA).
- Docs : `docs/technical.md`, `docs/specifications.md` (§ Voice Architecture), `docs/architecture.md`, `docs/product-scope.md`, `docs/audit-security-hosting-performance-2026-04-24.md`, `SECURITY.md`, `README.md`, `CONTRIBUTING.md`, `docs/release/*`.
- Backlog workspace `.specify-workspace/backlog/next-specs.md` : **aucune entrée voix** [VÉRIFIÉ grep].

### 1.3 Méthode d'exécution du parseur (sans écrire dans le repo)
Le parseur (`parseDartsSpeechTranscript`) a été bundlé avec l'`esbuild` du repo **vers le dossier de session** (`files/scratch-voice/parser.mjs`), puis exécuté sur ~100 formulations. `git status` reste propre. Les résultats cités « [VÉRIFIÉ test exécuté] » en proviennent. Ils testent le **parseur seul**, pas la transcription Deepgram réelle.

---

## 2. Constats — description précise de l'existant

### 2.1 Activation et périmètre
- Feature flag build-time `VITE_ENABLE_VOICE_SCORING` (défaut `false` en local, `true` en preview/production dans `wrangler.jsonc`) [VÉRIFIÉ `src/lib/env.ts:47`, `wrangler.jsonc:16,28`].
- Toggle par match « Assistance vocale IA », **actif par défaut**, non persisté (réinitialisé à chaque match) [VÉRIFIÉ `views/MatchView.tsx:108,162`, `components/match/MatchSettingsModal.tsx:86-103`].
- **X01 uniquement** : aucun autre jeu (Cricket, Killer, Gotcha, Capital, Triathlon) n'importe le module voix [VÉRIFIÉ grep]. Conforme à `docs/specifications.md` (« uniquement X01 »).

### 2.2 Pipeline audio
1. **Pré-chauffage à l'activation** (montage d'un match X01) : création d'un `AudioContext` (suspendu, sans geste utilisateur) et **prefetch du token** — même si l'utilisateur n'utilise jamais la voix [VÉRIFIÉ `useDeepgramStreaming.ts:83-108`].
2. **Au tap micro** (`start`, l.335) : passage en `processing`, en parallèle `getUserMedia({echoCancellation, noiseSuppression, autoGainControl: true, channelCount: 1})` (l.370) et fetch du token.
3. Dès que le micro est obtenu : `ensureAudioCaptureReady` charge le worklet `/pcmCaptureWorklet.js` (une fois par AudioContext), construit `source → AudioWorkletNode → gain(0) → gain(0) → destination` et **appelle `onReady()` → état `listening`** [VÉRIFIÉ `audioContextManager.ts:111-152`, `useDeepgramStreaming.ts:304-311`].
4. **Worklet** : à chaque quantum (128 frames), `postMessage(inputChannel.slice())` vers le thread principal [VÉRIFIÉ `public/pcmCaptureWorklet.js:14-16`] → à 48 kHz, **375 messages/s**.
5. **Encodage sur le thread principal** : `downsampleToLinear16` (moyenne par fenêtre, pas de filtre anti-repliement) puis `Int16Array` [VÉRIFIÉ `voicePcm.ts`]. Le calcul de longueur est arrondi **par bloc** : 128 échantillons à 48 kHz → `round(42,67)=43` échantillons, soit un débit effectif ≈ **16 125 Hz** déclaré 16 000 Hz (+0,8 %) ; à 44,1 kHz → 46 échantillons ≈ 15 848 Hz (−0,95 %) [VÉRIFIÉ code, calcul].
6. **Envoi** : chaque bloc (~86 octets) est envoyé immédiatement en trame WebSocket si le socket est ouvert, sinon mis en tampon **borné à 24 blocs ≈ 64 ms à 48 kHz** (`MAX_BUFFERED_PCM_CHUNKS = 24`) [VÉRIFIÉ `useDeepgramStreaming.ts:37,175-186`, `voiceStreamingModel.ts:8-19`].
7. **WebSocket** : SDK `@deepgram/sdk` 5.20.0, `listen.v1.connect` ; en navigateur, le token est passé en sous-protocole `Sec-WebSocket-Protocol: bearer,<JWT>` (pas dans l'URL) ; `keyterm` (tableau) est sérialisé en paramètres répétés (`arrayFormat: "repeat"`) — donc **le keyterm prompting est bien transmis correctement** [VÉRIFIÉ `node_modules/@deepgram/sdk/dist/esm/CustomClient.mjs:38-49, 311-325, 358-361, 787-830`]. Le SDK active par défaut une **reconnexion automatique (30 tentatives)**, non désactivée par l'app [VÉRIFIÉ `CustomClient.mjs:1188-1196`, `deepgramConnectionManager.ts:32-35`].
8. Endpoint : `api.deepgram.com` (par défaut, région US). L'endpoint UE `api.eu.deepgram.com` existe [VÉRIFIÉ https://deepgram.com/pricing, section GDPR] mais **n'est pas utilisé** [VÉRIFIÉ code].

### 2.3 Modèle Deepgram et paramètres
`buildDeepgramListenConfig` [VÉRIFIÉ `voiceConfig.ts:19-35`] :

| Paramètre | Valeur | Commentaire |
|---|---|---|
| `model` | `nova-3` | Monolingue |
| `language` | `fr` | |
| `encoding` / `sample_rate` | `linear16` / 16000 | voir dérive §2.2.5 |
| `interim_results` | `true` | affichage du transcript en direct |
| `endpointing` | 300 ms | `speech_final` après 300 ms de silence détecté par le VAD Deepgram |
| `vad_events` | `true` | `SpeechStarted` |
| `utterance_end_ms` | **absent** | ⇒ **Deepgram n'envoie jamais `UtteranceEnd`** ; la branche `payload.type === 'UtteranceEnd'` (l.438) est du code mort en production [VÉRIFIÉ https://developers.deepgram.com/docs/utterance-end.md : « To enable this feature, add `utterance_end_ms=1000` »] |
| `numerals` | `true` | Français supporté (`fr`, `fr-CA`) [VÉRIFIÉ https://developers.deepgram.com/docs/numerals.md] |
| `keyterm` | 14 termes : single, double, triple, simple, bulle, bull, bullseye, outer bull, demie bulle, demi bulle, manque, miss, rate, ratee | Nova-3 supporte keyterm en mono/multilingue [VÉRIFIÉ https://developers.deepgram.com/docs/keyterm.md] ; facturé en add-on 0,0013 $/min [VÉRIFIÉ pricing]. Ni nombres, ni commandes, ni prénoms des joueurs. |
| `punctuate`, `smart_format`, `diarize` | `false` | |
| `mip_opt_out` | **absent** | ⇒ requêtes potentiellement incluses dans le *Model Improvement Program* de Deepgram [VÉRIFIÉ https://developers.deepgram.com/docs/the-deepgram-model-improvement-partnership-program.md : « Add `mip_opt_out=true` … to be excluded »] |

### 2.4 Cycle de vie d'une écoute
- **Fenêtre fixe de 6,5 s** (`VOICE_SCORING_TIMEOUT_MS = 6500`) armée une fois le client WebSocket créé, **jamais prolongée** par `SpeechStarted` ni par les résultats intermédiaires [VÉRIFIÉ `useDeepgramStreaming.ts:534-567`].
- Émission d'une utterance sur `speech_final` (l.478) : concaténation des segments `is_final`, confiance = moyenne [VÉRIFIÉ `voiceStreamingModel.ts:21-48`]. Le socket **reste ouvert** jusqu'au timeout : si l'utilisateur reparle (« non, 45 »), une nouvelle proposition remplace la précédente — c'est la seule « correction vocale » possible, implicite.
- À l'expiration : si un transcript est en attente il est émis, **puis** l'état passe en `error/timeout` avec « Aucune annonce détectée, repasse en saisie manuelle… », **même si une proposition vient d'être faite** [VÉRIFIÉ `useDeepgramStreaming.ts:540-566` + test `useDeepgramStreaming.test.tsx:358-377`].
- Toute soumission/annulation/changement de joueur appelle `resetVoiceStreaming()` : **micro libéré (tracks stoppées) à chaque tour** ; le tour suivant refait `getUserMedia` + token + WebSocket [VÉRIFIÉ `MatchView.tsx:219-223, 341-343`, `audioContextManager.ts:61-66`].
- Robustesse anti-« stale » solide : identifiant de tentative + `sessionKey` = `matchId:legs:historyLength:playerIndex:playerId` ; tous les callbacks tardifs sont ignorés ; bien testé (races, abort token, unmount) [VÉRIFIÉ `voiceSessionModel.ts`, `MatchView.tsx:170-176`, tests l.391-506].

### 2.5 Provisioning du token
- Route `POST /api/deepgram/token` (Pages Function) : CORS strict si `Origin` présent ; **requête sans `Origin` acceptée** (l.99-101) ; validation de corps JSON ≤ 1 Ko ; rate-limit **20 req/min/IP en mémoire d'isolate** (`Map` module-level) — non partagé entre isolats/POP Cloudflare, donc « best-effort » (le reconnaît d'ailleurs `docs/audit-security-hosting-performance-2026-04-24.md:13`) ; en-têtes de sécurité, erreurs génériques [VÉRIFIÉ `functions/api/deepgram/token.ts`].
- `grantDeepgramToken` : si `DEEPGRAM_PROJECT_ID` est défini (c'est le cas en preview/prod), **un `GET /v1/projects/{id}` est fait avant chaque grant**, puis `POST /v1/auth/grant` avec `ttl_seconds: 55` [VÉRIFIÉ `lib/deepgramToken.ts:12-37`]. Deepgram documente un TTL par défaut de 30 s [VÉRIFIÉ https://developers.deepgram.com/guides/fundamentals/token-based-authentication.md] ; la prise en compte de `ttl_seconds` n'est pas documentée sur cette page [À CONFIRMER].
- Client : cache mémoire jusqu'à `expires_in − 10 s` (≈ 45 s), déduplication des requêtes concurrentes [VÉRIFIÉ `deepgramClient.ts`].
- Le JWT donne accès à l'API du projet Deepgram ; **une fois le WebSocket ouvert, la session n'est pas bornée côté serveur par l'app** [HYPOTHÈSE : le TTL du JWT ne s'applique qu'à l'ouverture de connexion]. Un script peut donc obtenir des tokens (pas d'`Origin` requis, rate-limit contournable) et streamer de l'audio facturé au compte du projet → **exposition financière**, non couverte par un plafond applicatif.

### 2.6 Parsing (grammaire actuelle)
Pipeline : `normalizeDartsTranscript` (minuscules, suppression des accents, remplacements de tournures) → seuil de confiance (`< 0,65` ⇒ invalide ; `0,65–0,85` ⇒ « ambigu ») → détection d'intention (`remaining_score` si un mot-indice « reste/laisse/suis/a/jouer » ; `darts_sequence` si multiplicateur/bull/miss ; `turn_score` si indice « je fais/ça fait/score/points » ou nombre seul) → parsing [VÉRIFIÉ `dartsSpeechParser*.ts`].

Résultats d'exécution (contexte : reste 301 ou indiqué, confiance 0,95) [VÉRIFIÉ test exécuté] :

| Énoncé | Résultat | Évaluation |
|---|---|---|
| `180`, `60`, `140`, `45`, `ça fait cent`, `je fais 26`, `zéro` | valide (total) | OK (dépend de `numerals` Deepgram) |
| `triple vingt triple vingt triple vingt` | valide 180 (T20×3) | OK |
| `simple 20 simple 1 simple 5` | valide 26 | OK |
| `triple 20`, `double 16`, `bull`, `demi bulle` | ambigu (« annonce partielle ») | Proposé, Valider soumet le total |
| `il me reste 32` (reste 100) | valide, score 68 | OK |
| `reste 32` (reste 301) | invalide « > 180 » | Correct |
| **`cent quarante`, `cent quatre-vingts`, `quarante-cinq`, `quatre-vingt-dix`, `soixante et onze`, `cent un`** | **invalide** (« Valeur darts invalide : 100/40/80/60 ») | ❌ Nombres composés en lettres non combinés hors cas « nombre seul » |
| `vingt-six`, `vingt-cinq`, `vingt et un` | ambigu, S20+S6 = 26 etc. | Juste par coïncidence de somme |
| **`un triple vingt`, `j'ai fait un triple vingt`** | ambigu **61** (S1 + T20) | ❌ L'article « un » devient une fléchette |
| **`trois fois vingt`** | ambigu **23** | ❌ |
| **`il a fait 60`, `il a fait vingt-six`** | invalide (intention « reste ») | ❌ « a » est un mot-indice de reste (`dartsSpeechParserLexicon.ts:88`) et « à » devient « a » après suppression des accents |
| **`60` alors qu'il reste 40** | **invalide** « supérieur au score restant » | ❌ Le domaine accepte et marque *bust* (« TROP ! ») au keypad (`matchSubmission.ts`) — **divergence voix/keypad** |
| `bust`, `trop`, `rien`, `pas de score` | invalide | ❌ Vocabulaire de bust/zéro incomplet (seul « zéro » et miss×3 marchent) |
| `treble 20`, `T20`, `D16` | invalide ou S20 | ❌ Jargon anglais/abréviations |
| `annule`, `valide`, `oui`, `non`, `suivant`, `joueur suivant`, `corrige`, `next` | invalide « Aucune annonce darts reconnue » | ❌ Aucune commande |
| `cinq euros`, `trois fléchettes` | ambigu 5 / 3 | ⚠️ Faux positif conversationnel (proposé, nécessite Valider) |
| `on boit un coup`, `deux bières s'il vous plaît` | ambigu « trop bruité » | Filtré (score null) |
| `179` (impossible) | valide côté parseur | ⚠️ Rejeté plus tard par `POSSIBLE_TURN_SCORES` (« SCORE IMPOSSIBLE ») |

Défauts de normalisation (code mort / ordre) [VÉRIFIÉ `dartsSpeechNormalizer.ts`] : règles avec accents (`ça fait`, `à jouer`, `je suis à`) inatteignables car les accents sont supprimés avant ; `quatre vingt dix` jamais atteint car `quatre vingt` est remplacé avant ; doublons (`ratee`, `manquee`, `exterieur bull`) ; règles anglaises `to→2`, `for→4`, `won→1` peu pertinentes en français.

### 2.7 Confirmation, correction, annulation, joueur
- **Pas d'auto-validation** : la proposition pré-remplit le buffer (scores totaux/restants et séquences complètes valides) ou s'affiche comme « score proposé » ; la soumission exige le bouton Entrée/Valider [VÉRIFIÉ `MatchView.tsx:190-208, 377-386`, `voiceProposalModel.ts:34-44`]. Conforme à l'invariant de la spec 003.
- **Attention** : une proposition « ambiguë » (ex. 61 pour « un triple vingt ») est **soumise telle quelle** si l'utilisateur appuie sur Valider (seul `invalid` est bloqué, l.383) : la « confirmation explicite » se résume à un tap sur un chiffre affiché en petit.
- **Affichage** : texte de guidage/transcript en 11–14 px tronqué dans `MatchInputBar`, badge « AI Scoring » (anglais) [VÉRIFIÉ `MatchInputBar.tsx:23-40`]. Aucun retour sonore, aucune vibration, aucune synthèse vocale [VÉRIFIÉ grep `speechSynthesis` : 0].
- **Correction** : par re-parole dans la fenêtre de 6,5 s, ou bouton Undo (efface buffer/proposition puis annule la dernière volée) [VÉRIFIÉ `MatchView.tsx:304-345`].
- **Checkout** : score = reste ⇒ modale « nombre de fléchettes » obligatoirement tactile, même si la séquence vocale (« triple 20, double 20 ») permettrait de l'inférer [VÉRIFIÉ `matchSubmission.ts`, `MatchView.tsx:494-502`].
- **Joueur** : le contexte est toujours le joueur courant ; `dartsAlreadyThrown: 0` codé en dur [VÉRIFIÉ `MatchView.tsx:193-197`] ; pas de reconnaissance de prénom ; changement de joueur = effet du domaine après soumission.
- Bot X01 / partie partagée : bouton désactivé si clavier verrouillé (`isKeyboardLocked`) ; `ensureCurrentPlayerCanAct` vérifié [VÉRIFIÉ `MatchView.tsx:509-526, 757-764`].

### 2.8 Erreurs, permissions, compatibilité, hors ligne
- Causes typées : `microphone | token | connection | timeout | transcript | audio` avec messages FR [VÉRIFIÉ `voiceSessionModel.ts:19-64`]. Les erreurs Deepgram de type `Error` sont affichées **brutes** (`payload.error`, potentiellement en anglais) [VÉRIFIÉ l.444-453].
- **Pas de détection de capacité** avant affichage du bouton : sur un navigateur sans `AudioWorklet` (ex. iOS 12 visé par la spec 018), l'utilisateur ne découvre l'échec qu'après le tap [VÉRIFIÉ `audioContextManager.ts:101-103`, `MatchView.tsx:130-131`].
- **Pas de détection hors ligne** : en PWA hors ligne (spec 031), le bouton reste actif et échoue en « Jeton vocal indisponible » [VÉRIFIÉ code ; pas de `navigator.onLine`].
- Permission micro : redemandée via `getUserMedia` à chaque tour ; sur Safari iOS, des re-prompts sont possibles [À CONFIRMER sur appareil].
- **Confidentialité** : aucune mention dans l'UI, le README, `SECURITY.md` ou `docs/` du fait que l'audio est envoyé à un sous-traitant (Deepgram, US par défaut) [VÉRIFIÉ grep `rgpd|gdpr|confidentialit|privacy` : 0 résultat pertinent].
- **Télémétrie** : aucune mesure d'usage/latence/taux de succès vocal en production (logs de timing seulement en `DEV`) [VÉRIFIÉ `voiceStreamingLogger.ts`, grep analytics].

### 2.9 Coûts actuels (estimation)
- Tarif Deepgram PAYG au 2026-11-20 : Nova-3 monolingue streaming **0,0048 $/min (promo, « was 0,0077 »)** + Keyterm **0,0013 $/min** ⇒ **0,0061 $/min** (0,0090 $/min hors promo) ; 200 $ de crédit gratuit sans expiration ; 150 connexions streaming simultanées en PAYG [VÉRIFIÉ https://deepgram.com/pricing].
- Mode actuel : ~3–6,5 s de flux par volée [HYPOTHÈSE d'usage] ⇒ ~0,0004 $/volée ; un 501 à 2 joueurs (~30 volées) ≈ 2 min ≈ **0,012 $**. 1 000 matchs/mois entièrement à la voix ≈ **12 $/mois**. Le crédit de 200 $ ≈ 32 800 min.
- Le volume réel est **inconnu** (aucune télémétrie).

---

## 3. Problèmes, dettes, incohérences (avec gravité)

| # | Problème | Réf. | Gravité |
|---|---|---|---|
| P1 | **Perte du début de l'annonce** : l'état `listening` est affiché dès que le graphe audio est prêt, avant token + ouverture WebSocket ; seuls ~64 ms d'audio sont mis en tampon ⇒ les premières syllabes (« triple… ») sont perdues si l'utilisateur parle tout de suite. | `useDeepgramStreaming.ts:37,304-311,391-398` ; `audioContextManager.ts:152` | **Haute** |
| P2 | `utterance_end_ms` absent ⇒ pas d'`UtteranceEnd` ; en bruit continu (bar), l'endpointing VAD peut ne pas détecter de silence ⇒ l'utterance n'est livrée qu'au timeout (6,5 s) avec un message d'erreur. | `voiceConfig.ts:19-35` ; doc Deepgram | **Haute** |
| P3 | Fenêtre fixe 6,5 s non prolongée par la parole ; état `error/timeout` posé même après une proposition réussie (incohérence UI). | l.534-567 ; test l.358-377 | Moyenne |
| P4 | Bust vocal rejeté (« supérieur au score restant ») alors que le keypad l'accepte : **divergence de règles métier** entre parseur et domaine. | `dartsSpeechParserShared.ts:131` vs `matchSubmission.ts` | **Haute** (cohérence Clean Architecture) |
| P5 | Nombres FR composés en lettres non agrégés en séquence ; « un » article ; « a/à » ⇒ intention « reste » ; « trois fois vingt ». | lexique/intent | **Haute** si `numerals` ne convertit pas systématiquement [À CONFIRMER sur transcripts réels] ; Moyenne sinon |
| P6 | Aucune commande vocale (annuler, valider, suivant, corriger, reste ?) ⇒ impossible de jouer sans toucher l'écran. | — | **Haute** (objectif produit) |
| P7 | Gain d'interaction quasi nul vs keypad+raccourcis (2 taps/volée). | `MatchView.tsx` | **Haute** (valeur produit) |
| P8 | Aucun retour sonore / TTS ; texte de confirmation petit ; badge « AI Scoring » en anglais. | `MatchInputBar.tsx` | Moyenne |
| P9 | Micro ré-acquis à chaque tour (latence, indicateur micro qui clignote, re-prompts possibles iOS). | `MatchView.tsx:219-223` | Moyenne |
| P10 | 375 trames WS/s de ~86 octets et sous-échantillonnage sur le thread principal (surcharge réseau/CPU sur tablette d'entrée de gamme) ; dérive de fréquence ±1 %. | worklet, `voicePcm.ts` | Moyenne/Basse [impact réel À CONFIRMER] |
| P11 | Endpoint token : `Origin` absent accepté, rate-limit par isolat, aucun plafond budgétaire ni kill-switch distant ; 2 appels Deepgram par token (vérif projet + grant). | `token.ts:99`, `deepgramToken.ts:14-16` | **Haute** (risque financier) |
| P12 | Prefetch token + AudioContext à **chaque** match X01, même sans usage voix. | l.83-108 | Basse |
| P13 | Reconnexion SDK par défaut (30 tentatives) non désactivée — comportement après coupure réseau non maîtrisé (token expiré). | `deepgramConnectionManager.ts` | Basse [HYPOTHÈSE d'impact] |
| P14 | Pas de détection de capacité (AudioWorklet/getUserMedia/online). | — | Moyenne |
| P15 | Confidentialité : pas d'information utilisateur, pas de `mip_opt_out`, pas d'endpoint UE. | — | **Haute** (RGPD) |
| P16 | Pas de télémétrie ⇒ aucun critère de succès mesurable aujourd'hui. | — | Moyenne |
| P17 | Normaliseur : règles mortes/doublons ; lexique anglais non pertinent. | `dartsSpeechNormalizer.ts` | Basse |
| P18 | Architecture : le parseur, l'arbitrage et la session vivent dans `src/features/x01/voice` couplés à X01 ; l'appel au use case se fait dans `MatchView` (vue de 869 lignes) ; aucun port `SpeechRecognizer` ; impossible de réutiliser pour Cricket/TV sans duplication. | `docs/architecture.md:129,142` | Moyenne |

**Divergences doc/spec ↔ code**
- D1 — Spec 003, tâche non cochée « Couvrir start/stop/timeout/reset/navigation » : **largement couverte** par `useDeepgramStreaming.test.tsx` (timeout l.358, reset/races l.391-506) ; seul le volet « navigation MatchView » n'a pas de test d'intégration. La case devrait être cochée ou reformulée.
- D2 — Spec 003 affirme « une couche d'arbitrage métier » (tâche cochée) : elle existe (`voiceProposalModel.ts`) mais **dans `features/`, pas dans `application/`** et ne connaît pas la règle de bust (P4).
- D3 — Spec 006, tâche « Compléter le runbook d'incident voice » non faite : **aucun runbook** dans `docs/release/*` [VÉRIFIÉ grep].
- D4 — Spec 003 « Key Tests » cite `tests/unit/x01/matchScoring.test.ts`, qui ne contient aucune occurrence de `voice|vocal|speech` [VÉRIFIÉ grep] ; inversement, les tests voix principaux (`useDeepgramStreaming.test.tsx`, `voiceProposalModel.test.ts`, `voiceSessionModel.test.ts`) n'y sont pas listés.
- D5 — `docs/release/react-19-validation-matrix.md:30` : validation « Voice scoring … pending » toujours ouverte.
- D6 — `docs/specifications.md` § Voice Architecture « 4 couches » : exact, mais ne mentionne ni le token, ni la fenêtre de 6,5 s, ni le traitement des données.

---

## 4. Limitations constatées (fiabilité, latence, environnement)

- **Fiabilité** : non mesurée (pas de corpus, pas de télémétrie). Les défauts P1, P2, P5 laissent penser qu'une part significative des échecs ressentis vient du pipeline et du parseur, pas du modèle STT [HYPOTHÈSE à valider par V2-VOICE-03].
- **Latence** : démarrage = `getUserMedia` (+ prompt la 1ʳᵉ fois) ∥ token (cache ≤45 s, sinon CF Function → 2 appels Deepgram séquentiels) → handshake WSS US. Estimation 400–1 200 ms à chaud, 1,5–3 s à froid [HYPOTHÈSE, logs `timing` disponibles en DEV pour mesurer]. Fin de parole → proposition : endpointing 300 ms + réseau ⇒ ~400–700 ms en calme [HYPOTHÈSE] ; en bruit, jusqu'au timeout 6,5 s (P2).
- **Bruit de bar** : `noiseSuppression/echoCancellation/AGC` navigateur activés (bien) ; mais Nova-3 généraliste + seuil de confiance fixe 0,65 ⇒ rejets « confiance trop faible » probables en bruit [HYPOTHÈSE]. Pas d'usage des alternatives n-best.
- **Faux positifs conversationnels** : atténués par l'écoute à la demande (6,5 s) et la confirmation ; deviendraient le risque n°1 en écoute continue (ex. « cinq euros » ⇒ 5).
- **Pas de wake word** ni de grammaire fermée côté STT (dictée libre + parseur a posteriori).
- **Dépendance réseau et service payant** : aucune voie hors ligne ; aucune alternative gratuite.
- **Compatibilité** (pipeline actuel = `getUserMedia` + `AudioWorklet` + WebSocket) : Chrome/Edge/Firefox/Safari récents OK ; iOS 12 (spec 018) KO (pas d'AudioWorklet, introduit dans Safari 14.1 [À CONFIRMER via BCD]) ; navigateurs Smart TV : généralement sans micro — la voix doit vivre sur l'appareil de contrôle.

---

## 5. Étude comparative des approches

Sources consultées le 2026-11-20 (prix en USD, hors taxes).

### 5.1 Moteurs de reconnaissance

| Option | Fiabilité FR / domaine | Latence | Hors ligne | Confidentialité | Poids | Coût récurrent | Compatibilité | Maintenance |
|---|---|---|---|---|---|---|---|---|
| **Deepgram Nova-3 (actuel)** | Bonne en dictée ; keyterm (≤100 termes), `numerals` FR, `Configure` à chaud des keyterms [VÉRIFIÉ docs keyterm/numerals/configure] | Streaming, endpointing réglable | ❌ | Audio chez un tiers US (UE possible), MIP opt-out possible | 0 (SDK ~ déjà présent) | 0,0061 $/min (promo) ; 0,009 hors promo [VÉRIFIÉ pricing] | Tous navigateurs modernes | Déjà en place, testé |
| Deepgram **Flux STT Multilingual** | Fin de tour « conversationnelle » native, numerals FR [VÉRIFIÉ docs numerals/flux] | Optimisé tours de parole | ❌ | idem | 0 | 0,0078 $/min [VÉRIFIÉ pricing] | idem | Migration v2/listen |
| **Web Speech API (mode serveur)** — Chrome desktop/Android (Google), Safari macOS/iOS (Apple, préfixe `webkit`, dès 14.1), Edge | Bonne en dictée ; pas de biais sauf `phrases` (Chrome 142+ desktop) | Bonne | ❌ | Audio chez Google/Apple, hors contrat de l'app | 0 | **0 $** pour l'app | Chrome Android : `continuous` sans effet ; Firefox Android : ❌ [VÉRIFIÉ BCD https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json] | Comportements hétérogènes, pas de SLA [HYPOTHÈSE] |
| **Web Speech API on-device** (`processLocally`, `available()/install()`) — Chrome desktop 139+, **Firefox desktop 160** (40 langues, pas Android) | Qualité niveau « command/dictation » [VÉRIFIÉ MDN `available_static`] ; FR on-device [À CONFIRMER] | Bonne | ✅ après téléchargement du pack | ✅ local | Pack géré par le navigateur | 0 $ | **Desktop uniquement** ; ❌ Chrome Android, ❌ Safari [VÉRIFIÉ BCD ; Firefox 160 release notes https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/160] | API standard |
| **Vosk WASM** (`vosk-browser`) + grammaire fermée | Modèle FR small 41 Mo, WER 24 % général (cv-test) [VÉRIFIÉ https://alphacephei.com/vosk/models] ; avec grammaire restreinte nettement meilleur [HYPOTHÈSE] | Streaming local | ✅ | ✅ | 41 Mo | 0 $ | WASM partout ; perf tablette [À CONFIRMER] | ⚠️ npm `vosk-browser` 0.0.8, dernière publication **2022-12** (repo poussé 2025-12) [VÉRIFIÉ npm/GitHub] |
| **Moonshine-tiny-fr / Whisper (transformers.js)** | Moonshine-tiny-fr (MIT, fine-tune communautaire) ; Whisper-tiny multilingue | Non streaming natif (segments VAD) ; WebGPU/WASM | ✅ | ✅ | Moonshine-tiny-fr int8 ≈ **28 Mo** ; Whisper-tiny int8 ≈ **41 Mo** ; Whisper-base int8 ≈ **77 Mo** [VÉRIFIÉ API Hugging Face `onnx-community/*`] | 0 $ | Lourd sur tablettes anciennes [HYPOTHÈSE] | `@huggingface/transformers` 4.3.2 (2026-10) actif |
| **Picovoice** (Rhino, Cheetah, Porcupine) | Excellente sur grammaire (Rhino) | Très bonne | ✅ | ✅ | Faible | **Incompatible** : « Picovoice is a B2B company… no dedicated free or paid plans for personal or non-commercial use », essai gratuit unique [VÉRIFIÉ https://picovoice.ai/docs/faq/general/] ; AccessKey à embarquer côté client | — | — |
| Google Cloud STT v2 | Bonne | Bonne | ❌ | Tiers | 0 | 0,016 $/min (60 min/mois gratuites, avec data logging) ; 0,024 $ sans logging [VÉRIFIÉ https://cloud.google.com/speech-to-text/pricing] | Nécessite proxy | — |
| Azure Speech | Bonne | Bonne | ❌ (sauf conteneurs) | Tiers | 0 | F0 : 5 h/mois gratuites ; prix payant non affiché statiquement [VÉRIFIÉ partiel https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/] | SDK JS | — |
| AssemblyAI Realtime (STT-3.7-Realtime) | Keyterm intégré, 32 langues | Bonne | ❌ | Tiers | 0 | 0,30 $/h = **0,005 $/min** [VÉRIFIÉ https://www.assemblyai.com/pricing] | WebSocket | — |
| OpenAI `gpt-live-transcribe` | Bonne | Bonne | ❌ | Tiers | 0 | **0,017 $/min** [VÉRIFIÉ https://platform.openai.com/docs/pricing] | — | — |
| Speechmatics, Gladia | — | — | — | — | — | Pages non récupérables [À CONFIRMER] | — | — |

### 5.2 Briques complémentaires
- **VAD local Silero** (`@ricky0123/vad-web` 0.0.31, ISC, publié 2026-09) : détecte la parole côté client pour **n'ouvrir/streamer vers le cloud que pendant la parole** ⇒ réduit le temps facturé et filtre une partie du bruit [VÉRIFIÉ npm ; gain chiffré HYPOTHÈSE : 70–90 % de réduction en mode partie, la parole ne représentant qu'une fraction du temps de jeu].
- **Wake word** : Porcupine exclu (licence). Alternatives open source (ex. openWakeWord via onnxruntime-web, `onnxruntime-web` 1.31.1 MIT) [HYPOTHÈSE de faisabilité navigateur, À CONFIRMER]. **Recommandation : pas de wake word en V2** — la grammaire fermée + mode partie borné au joueur actif + confirmation temporisée filtrent mieux à moindre coût ; un mot-clé optionnel (« Bougnat… ») peut être évalué en POC.
- **Push-to-talk** : bouton plein écran « maintenir pour parler », barre d'espace, ou **télécommande Bluetooth/presenter** générant des `keydown` (PageDown/Entrée) — solution matérielle à ~10 € pour jouer sans toucher la tablette [HYPOTHÈSE de compatibilité, À CONFIRMER : les touches volume ne sont pas exposées au web].
- **Synthèse vocale (TTS)** : `speechSynthesis` supporté Chrome 33+, Firefox 49+ (Android 62+), Safari 7+ [VÉRIFIÉ BCD SpeechSynthesis.json] ⇒ **0 $**, hors ligne si voix locales ; Deepgram Aura-2 0,030 $/1k caractères [VÉRIFIÉ pricing] non nécessaire.

### 5.3 Grammaire fermée vs dictée libre
- **Dictée libre + parseur** (actuel) : flexible, robuste aux tournures, mais sujet aux faux positifs et aux variations de formatage (lettres/chiffres).
- **Grammaire fermée** (Vosk grammar, Rhino, ou biais `phrases`/keyterm) : précision très élevée sur un vocabulaire de ~250 formes (0–180, S/D/T 1–20, bull, miss, ~15 commandes, prénoms) et rejet naturel des conversations [HYPOTHÈSE, à mesurer].
- **Recommandation** : conserver la dictée côté STT (cloud ou Web Speech) **mais** faire du parseur une **grammaire stricte avec score de couverture** (tout mot non reconnu ⇒ rejet en mode partie), et alimenter le STT en biais (keyterms Deepgram, `phrases` Web Speech) incluant **prénoms des joueurs, nombres en lettres et commandes**.

### 5.4 Recommandation de stratégie moteur
**Architecture multi-moteurs derrière un port unique**, avec ordre de préférence configurable [Reco archi, à valider par POC V2-VOICE-07] :
1. **Deepgram Nova-3** conservé comme moteur par défaut (qualité homogène multi-plateformes, déjà intégré), **avec VAD local** pour le mode partie et un **plafond budgétaire + kill-switch**.
2. **Web Speech on-device** comme moteur gratuit/privé quand `SpeechRecognition.available({langs:['fr-FR'], processLocally:true})` = `available` (desktop Chrome/Firefox) — utile pour « TV + PC » et clubs.
3. Repli **manuel** toujours.
4. **Différer** le moteur WASM embarqué (Vosk/Moonshine) : prometteur pour l'offline et la confidentialité, mais poids (28–41 Mo, > limite de 25 Mio/fichier de Cloudflare Pages [À CONFIRMER] ⇒ hébergement R2/HF), maintenance `vosk-browser` incertaine, performances tablette inconnues ⇒ **étude exploratoire** avant toute décision.
5. Web Speech **mode serveur** (Google/Apple) : envisageable comme repli gratuit mobile, mais l'audio part chez Google/Apple sans contrat de l'app et `continuous` est inopérant sur Chrome Android ⇒ **décision PO** (confidentialité).

---

## 6. Vision cible (« Bougnat Voice »)

### 6.1 Promesse
« **Annonce, c'est marqué.** » Le joueur annonce sa volée en revenant de la cible ; l'écran (et la TV) affichent immédiatement le score, la voix confirme « 60 — reste 241 », le joueur suivant est appelé. Il ne touche l'écran que pour corriger — et même là, « non, 45 » suffit.

### 6.2 Deux modes complémentaires
- **Mode « Annonce »** (défaut, amélioration de l'actuel) : tap (ou télécommande) → parole → **validation par la voix** (« valide/oui ») ou tap ; aucune écoute en dehors.
- **Mode « Partie » mains libres** (opt-in par match) : micro ouvert pendant la partie, VAD local, écoute **bornée au joueur actif**, grammaire stricte, **confirmation implicite temporisée** (anneau de 2 s, annulable par « non/annule/attends » ou tap), TTS de retour, changement de joueur automatique ; pause auto après N minutes sans annonce ; indicateur micro permanent.

### 6.3 Commandes vocales (FR, extensibles)
| Catégorie | Exemples | Effet (use case) |
|---|---|---|
| Score total | « 60 », « cent quarante », « ça fait 85 », « j'ai fait 26 » | `SubmitTurnTotal` |
| Séquence | « triple 20, triple 20, double 10 », « 20, 1, 5 », « bull », « demi-bulle », « raté » | `SubmitDarts` (le total + **nombre de fléchettes au checkout** inféré) |
| Reste | « il me reste 32 », « je laisse 40 » | `SubmitRemaining` |
| Bust / zéro | « bust », « trop », « crevé », « rien », « zéro », « trois ratées » | `SubmitTurnTotal(0)` ou score > reste ⇒ bust par le domaine |
| Contrôle | « valide/oui/c'est bon », « non/annule », « corrige : 45 », « retour/annule la dernière volée » | `Confirm`, `Cancel`, `Correct`, `UndoLastTurn` |
| Navigation | « joueur suivant », « à Paul » | `NextPlayer` (si règle le permet), contrôle d'identité |
| Information | « il reste combien ? », « quel checkout ? », « moyenne ? » | Lecture TTS (`QueryRemaining`, suggestion de finish existante) |
| Session | « pause », « reprends », « stop micro » | Contrôle du recognizer |

### 6.4 Confirmation visuelle et sonore
- Grand bandeau de proposition lisible à 2–3 m (chiffre ≥ 25 % de la hauteur de la barre), couleur selon confiance, **anneau de compte à rebours** en mode partie.
- Sons courts distincts (écoute, accepté, refusé) + vibration (Android) ; TTS optionnelle (« soixante, reste deux cent quarante et un », « Paul, à toi », « cent quatre-vingts ! »).
- Les annonces TTS sont **suspendues pendant l'écoute** (éviter l'auto-captation ; `echoCancellation` aide mais ne suffit pas toujours [HYPOTHÈSE]).

### 6.5 Coexistence manuel/vocal
Le keypad reste toujours actif ; toute frappe annule la proposition vocale en cours ; la voix et le keypad produisent **les mêmes commandes métier** ; l'undo est commun (pile unique).

### 6.6 Parcours utilisateurs
1. **Joueur seul (entraînement, salon)** : active « mode partie » une fois ; enchaîne 20 volées sans toucher la tablette ; « il reste combien ? » ⇒ TTS « 32, double 16 ».
2. **Deux joueurs à domicile** : annonce par le joueur actif ; confirmation temporisée ; « non, 45 » corrige ; changement de joueur annoncé ; checkout « double 16 » ⇒ manche gagnée sans modale (fléchettes inférées) ou question vocale « en combien de fléchettes ? » ⇒ « deux ».
3. **Bar bruyant** : mode « Annonce » avec **push-to-talk** (maintien du bouton ou télécommande) plutôt que l'écoute continue ; seuil de confiance plus strict ; validation explicite par « valide » ou tap ; repli instantané au keypad.
4. **Tablette + TV** : la tablette (contrôle) capte la voix ; la TV affiche le pictogramme micro, la proposition en attente (« 60 ? »), puis le score validé et l'animation ; jamais de micro côté TV ; les corrections vocales se propagent comme toute correction.
5. **Club (desktop + écran)** : Web Speech on-device (Chrome/Firefox desktop) ⇒ gratuit et privé, fonctionne sans Internet après installation du pack.

### 6.7 Extension aux autres jeux
- **Cricket** (prioritaire) : « triple 20, double 19, raté », « trois ratées », « bull » ⇒ `onHit(target, multiplier)`/`onMiss` déjà exposés par `CricketKeypad` [VÉRIFIÉ `components/game/CricketKeypad.tsx:5-9`] ; grammaire réduite (15–20, bull) ⇒ excellente fiabilité attendue [HYPOTHÈSE].
- Capital, Killer, Gotcha, Triathlon : P3, après mesure de l'usage.

### 6.8 Architecture cible (Clean Architecture)
```
presentation/   VoiceButton, VoiceProposalBanner, VoiceModeToggle, useVoiceSession (binding React mince)
application/    voice/VoiceSessionController (machine d'états pure : idle→arming→listening→proposing(countdown)→committed|cancelled)
                voice/VoiceCommand (union : SubmitTurnTotal | SubmitDarts | SubmitRemaining | Confirm | Cancel | Correct | Undo | NextPlayer | Query…)
                x01/X01InputHandler (UN SEUL point d'entrée appelé par keypad, voix, futur remote/partenaire)
                ports : SpeechRecognizerPort, SpeechSynthesizerPort, VoiceActivityPort, VoiceTelemetryPort, Clock
features/<jeu>/voice/  grammaire + parseur par jeu (X01, Cricket) → VoiceCommand[] avec confiance/couverture
                shared/voice/lexicon-fr (nombres 0–180 en lettres, multiplicateurs, commandes, prénoms dynamiques)
infrastructure/voice/  DeepgramRecognizer (token, VAD gating, EU endpoint, mip_opt_out), WebSpeechRecognizer,
                (futur) WasmRecognizer ; WebSpeechSynthesizer ; SileroVad ; AudioCapture (worklet 20–40 ms)
domain/         inchangé — aucune dépendance voix ; les règles (bust, scores possibles, checkout) restent la référence
```
Justification : (1) supprime la divergence bust (P4) en faisant valider par le domaine ; (2) permet Cricket/TV sans duplication ; (3) rend la session testable sans React ni navigateur ; (4) l'ajout d'un moteur = un adapter. Le seul nouvel abstrait indispensable est `SpeechRecognizerPort` (2 implémentations réelles prévues) ; `X01InputHandler` est un **déplacement** de logique aujourd'hui dans `MatchView`, à coordonner avec l'agent Architecture.

### 6.9 Critères mesurables de réussite
| Critère | Cible V2 | Mesure |
|---|---|---|
| Exactitude de commande (volée correcte sans correction) | ≥ 97 % calme ; ≥ 92 % bruit bar (65–75 dBA) | Corpus de référence ≥ 500 énoncés, ≥ 10 locuteurs (V2-VOICE-03) |
| Rejet des conversations (faux engagement) en mode partie | ≤ 1 score erroné engagé / 200 volées ; ≤ 2 % de propositions parasites | Corpus « conversation de bar » + télémétrie |
| Latence fin de parole → proposition affichée | p50 ≤ 500 ms, p95 ≤ 1 000 ms (cloud) | Télémétrie locale opt-in |
| Latence tap → prêt à écouter | p95 ≤ 300 ms à chaud (micro conservé), ≤ 2 s à froid ; **aucune perte d'audio** | Télémétrie + test unitaire pré-roll |
| Mains libres | ≥ 80 % des volées sans toucher l'écran en mode partie | Télémétrie |
| Correction vocale | « non, 45 » appliqué en ≤ 2 s | Test E2E simulé |
| Coût | ≤ 0,02 $ par match voix (mode partie, VAD) ; budget mensuel plafonné (valeur PO) | Usage Deepgram |
| Compatibilité | Matrice publiée : Chrome/Edge/Firefox desktop, Chrome Android, Safari iOS/iPadOS ≥ 16 [À CONFIRMER plancher] | Recette manuelle |

---

## 7. Bénéfices, contraintes, risques

- **Bénéfices** : fonctionnalité signature crédible (mains libres + TTS + TV) ; parité de règles voix/keypad ; base réutilisable Cricket/TV/partenaires ; maîtrise des coûts ; conformité RGPD explicite.
- **Contraintes** : gratuité ⇒ plafonds, VAD, moteurs gratuits quand disponibles ; navigateurs hétérogènes ; pas de backend métier (le seul serveur reste la Function de token).
- **Risques** : (R1) faux positifs en écoute continue — mitigé par grammaire stricte, joueur actif, temporisation, undo vocal ; (R2) dérive de coût / abus du token — plafond + Turnstile + kill-switch ; (R3) iOS/Safari (permissions, audio session, veille d'écran) — `Screen Wake Lock` et tests réels ; (R4) auto-captation TTS ; (R5) fin de la promo Deepgram (+47 %) ; (R6) dépendance à un fournisseur — atténuée par le port multi-moteurs ; (R7) complexification du parcours de base — tout reste **opt-in**, le bouton actuel demeure.

---

## 8. Propositions de spécifications

| ID | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances |
|---|---|---|---|---|---|---|---|
| **V2-VOICE-01** | Fiabilisation du pipeline vocal existant | Backlog existant (003) + Reco archi | État `connecting` distinct ; pré-roll ≥ 1,5 s (ring buffer) ; trames 20–40 ms (agrégation dans le worklet) et rééchantillonnage hors thread principal ; `utterance_end_ms=1000` ; fenêtre prolongée par la parole, pas d'erreur après une proposition ; micro conservé pendant le match (option) ; `reconnectAttempts:0` ; détection de capacité et hors ligne ; messages FR ; prefetch à la première interaction | Fiabilité/latence perçues | M | **P0** | — |
| **V2-VOICE-02** | Parseur FR v2 et parité de règles avec le domaine | Reco archi | Lexique nombres FR 0–180 en lettres ; articles ; suppression de « a » comme indice ; bust/zéro/« trop » ; jargon (« treble », T20/D16) ; validation des scores via `POSSIBLE_TURN_SCORES` et règles du domaine (bust accepté) ; inférence du nombre de fléchettes au checkout ; nettoyage du normaliseur ; tests table-driven | Exactitude | M | **P0** | 03 (corpus) |
| **V2-VOICE-03** | Banc de mesure vocal et corpus de référence | Étude exploratoire / outillage | Corpus audio+transcripts (consentement), script d'évaluation hors ligne (Deepgram vs Web Speech vs WASM), métriques §6.9, télémétrie locale **opt-in** et agrégée (aucune donnée audio) | Décisions objectivées | M | **P0** | — |
| **V2-VOICE-04** | Port `SpeechRecognizer`, `VoiceSessionController` et commandes métier partagées | Reco archi | Machine d'états pure, `VoiceCommand`, `X01InputHandler` unique keypad/voix, adapters Deepgram & Web Speech, migration de `useDeepgramStreaming` | Réutilisabilité, testabilité | L | **P1** | 01, 02 ; coordination agent Archi (extraction MatchView) |
| **V2-VOICE-05** | Mode « Partie » mains libres | Demande V2 / Innovation | Écoute continue opt-in, VAD local (Silero), joueur actif, confirmation temporisée annulable, commandes (valide/non/corrige/annule/suivant/reste ?), pause auto, Wake Lock, indicateur micro | Différenciation majeure | L | **P1** | 04, 06, 09, 10 ; **décision PO invariant 003** |
| **V2-VOICE-06** | Retour sonore et synthèse vocale (caller) | Reco UX/Innovation | Sons d'état, TTS `speechSynthesis` (score, reste, checkout, joueur suivant, 180), réglages volume/voix, mutage pendant l'écoute | Confiance, mains libres | M | **P1** | 04 (port synthétiseur) |
| **V2-VOICE-07** | POC moteurs on-device et hybrides | Étude exploratoire | Web Speech `processLocally`+`phrases` (Chrome/Firefox desktop), Vosk grammaire, Moonshine-tiny-fr ; perf tablette, poids, hébergement modèles (R2/HF), licence ; recommandation chiffrée | Gratuité, offline, vie privée | M | **P1** | 03 |
| **V2-VOICE-08** | Voix pour le Cricket | Demande V2 | Grammaire Cricket, mapping `onHit/onMiss`, undo vocal, tests | Extension signature | M | **P2** | 04 |
| **V2-VOICE-09** | Confidentialité et information « voix » | Documentation / conformité | Notice in-app au 1ᵉʳ usage, page doc, `mip_opt_out=true`, endpoint UE (`api.eu.deepgram.com`), durée de rétention, mention `SECURITY.md`/README | RGPD, confiance | S | **P0** | — |
| **V2-VOICE-10** | Durcissement économique du provisioning | Backlog existant (006) | `Origin` obligatoire, Turnstile (gratuit) ou règle WAF rate-limit, plafond mensuel + kill-switch (variable d'env / flag distant), cache de la vérification projet, runbook incident (tâche 006 restante), alertes budget Deepgram [À CONFIRMER disponibilité] | Gratuité soutenable | S/M | **P1** (P0 si mode partie) | — |
| **V2-VOICE-11** | Voix × mode TV | Demande V2 (5.6) | Diffusion de l'état vocal éphémère (écoute, proposition en attente, confirmé/annulé) vers l'écran spectateur ; aucun micro côté TV | Scénario vitrine | S | **P2** | 04, spec TV |
| **V2-VOICE-12** | Déclencheurs alternatifs (push-to-talk, télécommande BT, grand bouton) | Innovation | Maintenir-pour-parler plein écran, raccourcis clavier/presenter, documentation matériel | Mains libres en bar | S | **P2** | 04 |
| V2-VOICE-13 | Voix pour Killer/Gotcha/Capital/Triathlon | Demande V2 | Après mesure d'usage | Couverture | M | P3 | 08 |

**Traitement des specs existantes**
- **003 `voice-scoring-reliability`** : *clôturer* le périmètre v1 (cocher la dernière tâche, couverte par `useDeepgramStreaming.test.tsx`, ou la reformuler en « test d'intégration MatchView ») et la déclarer **remplacée** par V2-VOICE-01/02/04/05. L'invariant « aucun score vocal ne doit être validé sans confirmation explicite » doit être **réécrit** selon la décision PO (§9-1). Corriger la liste « Key Tests » (D4).
- **006 `voice-token-provisioning-hardening`** : *finaliser* (seule tâche ouverte : runbook) **dans** V2-VOICE-10, puis clôturer.
- **018 iOS 12** : à compléter par une exigence « voix masquée si capacité absente » (V2-VOICE-01) plutôt qu'un support.
- **031 PWA** : ajouter un critère « voix désactivée proprement hors ligne » (V2-VOICE-01) et exclure `/api/deepgram/token` du cache SW [À CONFIRMER dans l'implémentation 031].
- `docs/release/react-19-validation-matrix.md` : la ligne « Voice scoring … pending » est à solder ou à reporter explicitement.

---

## 9. Décisions nécessitant l'arbitrage du product owner

1. **Invariant de confirmation** : autoriser une *confirmation implicite temporisée annulable* en mode partie (recommandé) ou maintenir la confirmation explicite (validation par la voix « valide » acceptable ?).
2. **Budget STT** : plafond mensuel accepté (ex. 0 $ = crédit gratuit uniquement, ou 10–30 $/mois) et comportement au dépassement (bascule Web Speech/manuel, message).
3. **Moteurs** : Deepgram reste-t-il le moteur par défaut ? Accepte-t-on Web Speech *mode serveur* (audio chez Google/Apple) comme repli gratuit, ou uniquement on-device ?
4. **Confidentialité** : activer `mip_opt_out` et l'endpoint UE (impact tarifaire éventuel [À CONFIRMER]) ; texte d'information.
5. **Wake word** : écarté en V2 (recommandé) ou POC exploratoire ?
6. **Langues** : FR seul, ou FR + EN (jargon « treble », joueurs anglophones) ?
7. **Voix activée par défaut** (aujourd'hui oui) vs opt-in, et persistance du choix entre matchs.
8. **TTS/caller** activé par défaut ou non.
9. **Télémétrie locale opt-in** pour mesurer les critères (aucune donnée audio).
10. **Ordre** : Cricket vocal en V2 (P2) ou report V2.x.

---

## 10. Limites de l'analyse / points non vérifiés

- Aucun test sur appareil réel, aucun enregistrement audio, aucune session Deepgram réelle : le comportement de `numerals` sur les transcripts français réels (lettres vs chiffres, notamment en *interim*) et la qualité en bruit de bar sont **non vérifiés**.
- Le parseur a été exécuté hors repo sur des transcripts *synthétiques* ; les latences sont des estimations.
- Prix relevés le 2026-11-20 ; la promo Deepgram peut prendre fin ; prix Azure payant, Speechmatics, Gladia non récupérés ; l'effet tarifaire de `mip_opt_out` n'a pas été vérifié.
- Disponibilité du français en on-device pour Chrome et Firefox, comportement de `webkitSpeechRecognition` en PWA iOS, re-prompts de permission iOS, limite de 25 Mio/fichier Cloudflare Pages, support `ttl_seconds` du grant Deepgram : **[À CONFIRMER]**.
- La faisabilité d'un wake word open source en navigateur et les gains du VAD sur le coût sont des **hypothèses** à mesurer (V2-VOICE-03/07).
- L'analyse concurrentielle (DartCounter, etc.) n'a pas été menée ici.
- Fichiers de travail (bundle du parseur, scripts de sonde, pages de prix) : `files/scratch-voice/` (hors repo).
