---
id: 003-counter-voice-scoring-reliability
v2_id: V2-VOICE-01
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Largement implémentée ; défauts de fiabilité (pipeline, parseur)."
traitement_propose: "Enrichir (Révision V2)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 003 - counter voice scoring reliability

## Meta

- ID: `003-counter-voice-scoring-reliability`
- Statut: `active`
- Milestone cible: `M3: Voice Scoring Reliability`
- Issues GitHub: `#74`

## Objectif

Garantir que l assistance vocale `X01` reste une aide de scorage fiable, optionnelle et bornee au vocabulaire darts, sans jamais court-circuiter la validation manuelle du scoreur.

Cette spec couvre aussi la prochaine passe d optimisation Deepgram/voice runtime. Aucun doublon de spec ne doit etre cree pour ce sujet tant que le perimetre reste borne au scoring vocal optionnel `X01`.

## Decisions

- la transcription vocale propose un score, elle ne l applique jamais seule
- le fallback manuel reste toujours disponible
- le parsing s appuie sur des seuils et des garde-fous explicites
- la connexion Deepgram reste encapsulee dans une couche dédiée
- les optimisations Deepgram doivent prioriser la fiabilite de tour, la lisibilite des etats runtime et la reduction des re-listens inutiles pour le scoreur
- la logique metier de proposition vocale doit rester separable du transport Deepgram et des details Web Audio

## Invariants critiques

- aucun score vocal ne doit être validé sans confirmation explicite
- le mode vocal ne doit pas casser la saisie manuelle
- les erreurs réseau ou de transcription doivent dégrader gracieusement vers le manuel
- aucune utterance stale ne doit survivre a un changement de tour, de joueur, d ecran ou de partie
- le scoreur doit comprendre pourquoi la voix est indisponible: micro, token, websocket, timeout ou transcription ambiguë

## Impacted Code

- `src/features/x01/voice/dartsSpeechParser.ts`
- `src/features/x01/voice/dartsSpeechParserScoring.ts`
- `src/features/x01/voice/dartsSpeechParserShared.ts`
- `src/features/x01/voice/useDeepgramStreaming.ts`
- `src/features/x01/voice/voiceStreamingModel.ts`
- `src/features/x01/voice/audioContextManager.ts`
- `src/features/x01/voice/deepgramConnectionManager.ts`
- `src/features/x01/voice/deepgramClient.ts`
- `src/features/x01/voice/VoiceScoringControl.tsx`
- `src/features/x01/voice/voiceConfig.ts`
- `views/MatchView.tsx`
- `functions/api/deepgram/token.ts`

## Canonical Entry Points

- `parseDartsSpeechTranscript`
- `normalizeDartsTranscript`
- `useDeepgramStreaming`
- `buildDeepgramListenConfig`
- `fetchDeepgramAccessToken`
- `VoiceScoringControl`

## Key Tests

- `tests/unit/dartsSpeechParser.test.ts`
- `tests/unit/x01/matchScoring.test.ts`
- `tests/unit/x01/voicePcm.test.ts`
- `tests/unit/x01/voiceStreamingModel.test.ts`
- `tests/unit/lib/deepgramToken.test.ts`
- `tests/unit/api/deepgramTokenRoute.test.ts`

## Validation

- parsing des annonces de score
- robustesse face aux confidences faibles
- dégradation propre vers la saisie manuelle
- start / stop / timeout / navigation sans resurrection d une session vocale stale
- statut UI vocal explicite pour les erreurs runtime principales
- budget de latence vocal acceptable pour un tour local en conditions reseau normales

## Analyse de l implementation actuelle

Forces confirmees:

- le fallback manuel est deja protege et prioritaire
- le parsing couvre les intentions metier utiles (`turn_score`, `remaining_score`, `darts_sequence`) avec validations darts explicites
- le provisioning token est deja durci cote serveur
- la chaine audio / socket a ete recemment decoupee en managers plus testables

Faiblesses restantes a traiter:

- le runtime voice n a pas encore de notion explicite de session de tour ou d identite de tentative; un demarrage asynchrone peut finir alors que le contexte match a deja bouge
- la proposition vocale reste basee sur une seule utterance a la fois; il manque un arbitrage metier plus riche entre transcript final, contexte checkout/restant et ambiguite utilisateur
- la couverture de tests ne protege pas encore assez le flux complet `start -> ecoute -> timeout -> reset -> navigation`

## 3 axes d amelioration proposes

1. Session vocale bornee au tour

- Introduire une notion de `voice attempt` / `turn voice session` cote application pour invalider toute utterance, timeout ou ouverture websocket qui ne correspond plus au tour courant.
- Benefice metier: eviter qu un score vocal d un joueur ou d un tour precedent pollue le tour en cours, surtout en navigation rapide ou en match partage.

2. Arbitration metier de proposition vocale

- Ajouter une couche d application qui arbitre entre score total, score restant et sequence de flechettes selon le contexte de tour, le checkout visé et le niveau d ambiguite.
- Benefice metier: moins de confirmations inutiles sur les cas simples et moins de mauvaises propositions sur les cas critiques (`reste 32`, `double 16`, tours partiels).

3. Readiness et observabilite Deepgram orientees scoreur

- Formaliser des etats de readiness et d erreur (micro, token, socket, timeout, ambiguite transcript) et borner la latence de demarrage via prewarm/rotation de token et strategie de retry limitee.
- Benefice metier: demarrage plus rapide au pupitre et comprehension immediate du mode degrade quand la voix ne peut pas aider.

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Alias V2 : **V2-VOICE-01** (famille voix, P0, difficulté M, lot 0 pour les correctifs rapides puis lot 3, poids 50, dépend de V2-ARCH-03 / spec 057). Cette révision absorbe la proposition d'audit « V2-VOICE-02 — parseur FR v2 » afin de respecter la clause « aucun doublon » de la présente spec. Le contenu historique ci-dessus est conservé tel quel.

### R1. Constats vérifiés dans le code (commit `508dfa6`)

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C-01 | `utterance_end_ms` absent de la configuration : Deepgram n'émet jamais `UtteranceEnd`, la branche prévue est inatteignable en production. `mip_opt_out` absent également (traité par la spec 080). | `src/features/x01/voice/voiceConfig.ts:19-35`, `src/features/x01/voice/useDeepgramStreaming.ts:438` | [vérifié] code ; doc Deepgram « utterance-end » [EXT 2026-11-20] |
| C-02 | L'état `listening` (« Écoute en cours ») est posé dès que le graphe audio est prêt, avant l'obtention du jeton et l'ouverture du WebSocket ; le tampon d'attente est borné à 24 blocs de 128 échantillons (≈ 64 ms à 48 kHz) : le début d'une annonce prononcée immédiatement est perdu. | `useDeepgramStreaming.ts:37`, `:304-310`, `:391-392` ; `voiceStreamingModel.ts:8-19` | [vérifié] |
| C-03 | Fenêtre d'écoute fixe de 6,5 s armée à la création du client WebSocket, jamais prolongée par la parole ; à expiration, l'utterance en attente est émise **puis** l'état passe en `error`/`timeout`, même après une proposition réussie. | `voiceConfig.ts:1` ; `useDeepgramStreaming.ts:534-567` | [vérifié] |
| C-04 | Le parseur rejette un score supérieur au reste (« Score annoncé supérieur au score restant ») alors que le keypad soumet ce score et laisse `submitTurn` qualifier le bust (« TROP ! ») : règle métier dupliquée et divergente. | `dartsSpeechParserShared.ts:126-136` vs `src/features/x01/scoring/matchSubmission.ts:52-82` | [vérifié] |
| C-05 | « a » est un indice d'intention « reste » ; les accents sont supprimés **avant** les remplacements, si bien que les règles accentuées (`ça fait`, `je suis à`, `à jouer`) sont mortes et que « il a fait 60 » est lu comme un reste. | `dartsSpeechParserLexicon.ts:84-91` ; `dartsSpeechNormalizer.ts:5,8,13,15` vs `:80-86` | [vérifié] |
| C-06 | Nombres composés en lettres rejetés (« cent quarante », « quarante-cinq »), « un triple vingt » → 61, « trois fois vingt » → 23. | Exécution hors repo du parseur, rapport d'audit 04 §2.6 | [vérifié] par exécution ; dépend de `numerals` sur transcripts réels [à confirmer] |
| C-07 | `dartsAlreadyThrown: 0` codé en dur dans le contexte de parsing. | `views/MatchView.tsx:192-197` | [vérifié] |
| C-08 | Une proposition `ambiguous` (ex. 61) est soumise telle quelle par « Valider » : seul `invalid` est bloqué. | `views/MatchView.tsx:383-385` ; `voiceProposalModel.ts:34-44` | [vérifié] |
| C-09 | Micro libéré à chaque changement de volée ou de joueur (`getUserMedia` + jeton + WebSocket refaits au tour suivant). | `views/MatchView.tsx:219-223` ; `audioContextManager.ts:61-63` | [vérifié] |
| C-10 | Pré-chargement du jeton et création d'un `AudioContext` au montage de tout match X01 voix activée, même si la voix n'est jamais utilisée. | `useDeepgramStreaming.ts:83-107` | [vérifié] |
| C-11 | Aucune détection de capacité ni d'état hors ligne avant d'activer le bouton : l'absence d'`AudioWorklet` n'est découverte qu'au tap ; aucune occurrence de `navigator.onLine`. | `audioContextManager.ts:101-103` ; recherche `onLine` : 0 | [vérifié] |
| C-12 | Les erreurs Deepgram sont affichées brutes (texte fournisseur potentiellement en anglais). | `useDeepgramStreaming.ts:444-448` | [vérifié] |
| C-13 | Badge « AI Scoring » en anglais ; texte de proposition 11-14 px tronqué. | `components/match/MatchInputBar.tsx:35-37` | [vérifié] |
| C-14 | Le worklet poste chaque quantum (128 échantillons, ≈ 375 messages/s à 48 kHz) au thread principal, qui rééchantillonne. | `public/pcmCaptureWorklet.js:14-16` ; `src/features/x01/voice/voicePcm.ts` | [vérifié] ; impact CPU sur tablette [à confirmer] |
| C-15 | La reconnexion automatique du SDK n'est pas désactivée. | `deepgramConnectionManager.ts:27-43` | [vérifié] ; nombre de tentatives par défaut du SDK 5.20 [à confirmer] |
| C-16 | La voix est aussi active dans le 501 du Triathlon (réutilisation de `MatchView`). | `views/TriathlonGameView.tsx:302,315` | [vérifié] |

Forces confirmées : invalidation des tentatives obsolètes par identifiant + clé de session (`voiceSessionModel.ts:15-17`, `views/MatchView.tsx:170-176`) ; causes d'erreur typées ; tests unitaires riches (`tests/unit/x01/useDeepgramStreaming.test.tsx`, `tests/unit/dartsSpeechParser.test.ts`, faux navigateurs `tests/unit/x01/voiceBrowserFakes.ts`).

### R2. Écarts avec la présente spec

- **E-01** — La tâche ouverte « Couvrir start/stop/timeout/reset/navigation » est largement couverte par `tests/unit/x01/useDeepgramStreaming.test.tsx` (démarrage, tampon, arrêt, timeout, courses) ; seule manque l'intégration `MatchView` (navigation pendant l'écoute).
- **E-02** — « Key Tests » cite `tests/unit/x01/matchScoring.test.ts`, qui ne contient aucune occurrence de `voice|vocal|speech`, et omet `useDeepgramStreaming.test.tsx`, `voiceProposalModel.test.ts`, `voiceSessionModel.test.ts`, `audioContextManager.test.ts`.
- **E-03** — La « couche d'arbitrage métier » (tâche cochée) existe (`voiceProposalModel.ts`) mais vit dans `src/features/x01/voice/` et embarque une règle de jeu (C-04), contraire à l'ADR 0002.
- **E-04** — L'invariant « aucun score vocal validé sans confirmation explicite » est respecté, mais la confirmation d'une proposition ambiguë se fait par le même bouton que la saisie manuelle (C-08).
- **E-05** — « Budget de latence acceptable » n'est ni chiffré ni mesuré ; aucune métrique d'exactitude.
- **E-06** — `docs/release/react-19-validation-matrix.md:30` : la validation « Voice scoring » est toujours `pending`.
- **E-07** — La clause « aucun doublon » coexiste désormais avec les specs 075 (port et commandes), 076 (mode mains libres) et 077 (caller) : leur périmètre doit être explicitement distingué (question Q2).

### R3. Exigences proposées

**Fonctionnelles**

- **V2-FR-01** — Le cycle vocal expose un état `connecting` distinct ; « Écoute » n'est affiché que lorsque l'audio capté sera effectivement transmis (WebSocket ouvert ou pré-roll actif, V2-FR-02).
- **V2-FR-02** — Pré-roll : tout l'audio capté entre l'obtention du micro et l'ouverture du WebSocket est conservé dans un tampon circulaire d'au moins 1,5 s et transmis dans l'ordre à l'ouverture.
- **V2-FR-03** — La configuration d'écoute active `utterance_end_ms` (valeur initiale 1 000 ms, à ajuster d'après la spec 074) ; un `UtteranceEnd` émet l'utterance en attente une seule fois.
- **V2-FR-04** — La fenêtre d'écoute est prolongée par `SpeechStarted` et les résultats intermédiaires, dans un plafond total (proposition : 12 s) ; aucune erreur `timeout` n'est affichée après l'émission d'une proposition.
- **V2-FR-05** — Le parseur reconnaît les nombres français de 0 à 180 écrits en lettres, simples ou composés (« cent quarante », « quatre-vingt-dix », « soixante et onze », « cent un »), y compris répartis en plusieurs jetons.
- **V2-FR-06** — Un article (« un », « une ») suivi d'un multiplicateur n'est pas compté comme une fléchette ; « trois fois vingt » vaut T20 ; « a »/« à » ne sont plus des indices de reste, hors locutions « à jouer », « je suis à », « il me reste », « je laisse ».
- **V2-FR-07** — Vocabulaire de volée nulle : « zéro », « rien », « pas de score », « trois ratées » proposent 0. Le traitement de « trop »/« bust » suit la décision Q3.
- **V2-FR-08** — **Le parseur ne qualifie pas le bust.** La vérification « score supérieur au reste » est supprimée du parseur ; un score annoncé supérieur au reste est proposé, et c'est le moteur (`submitTurn` aujourd'hui, commande unique de la spec 057 / ADR 0002 demain) qui qualifie le bust. L'aperçu affiché provient du moteur.
- **V2-FR-09** — La possibilité d'un score (ex. 179) est vérifiée par la règle unique (`src/features/x01/scoring/possibleTurnScores.ts` aujourd'hui, module de règles de la spec 057 demain) avant affichage : un score impossible n'est jamais proposé.
- **V2-FR-10** — **Précision limitée assumée** : une annonce d'une seule fléchette (« double seize ») n'indique pas de quelle fléchette il s'agit ; le parseur ne déduit jamais le nombre de fléchettes au checkout d'une annonce partielle. L'inférence n'est envisagée que pour une séquence complète annoncée dans l'ordre (décision Q4) ; sinon la modale actuelle « nombre de fléchettes » est conservée.
- **V2-FR-11** — Une proposition `ambiguous` est affichée dans un état distinct (« À vérifier ») et n'est jamais pré-remplie ; la confirmation reste explicite.
- **V2-FR-12** — Détection de capacité (`getUserMedia`, `AudioWorklet`, `WebSocket`) avant l'activation du bouton : en cas d'absence, le bouton est désactivé avec une raison en français.
- **V2-FR-13** — Hors ligne (`navigator.onLine === false` ou événement `offline`) : bouton désactivé avec message ; aucune requête vers `/api/deepgram/token`.
- **V2-FR-14** — Les messages d'erreur affichés sont exclusivement ceux de `voiceSessionModel.ts` (français, par cause) ; le texte fournisseur n'est jamais affiché. Le badge « AI Scoring » devient « Assistance vocale ».
- **V2-FR-15** — Le pré-chargement du jeton et de l'`AudioContext` a lieu au premier appui sur le micro du match (puis reste chaud), et non au montage (décision Q5).
- **V2-FR-16** — La reconnexion automatique du SDK est désactivée : une coupure produit la cause `connection` et le retour au manuel.
- **V2-FR-17** — Le worklet agrège des trames de 20 à 40 ms ; le rééchantillonnage conserve un compte d'échantillons cumulatif (aucune dérive de fréquence).

**Non fonctionnelles**

- **V2-NFR-01** — Aucune perte d'audio entre l'appui et l'ouverture du socket, quel que soit le délai (vérifié par test unitaire avec socket retardé).
- **V2-NFR-02** — Latence fin de parole → proposition affichée : p95 ≤ 1 000 ms au calme (mesure spec 074).
- **V2-NFR-03** — Exactitude par volée sur le corpus de la spec 074 : ≥ 97 % au calme, ≥ 92 % en bruit de bar (cibles proposées, à valider).
- **V2-NFR-04** — Coût : la durée facturée moyenne par volée ne dépasse pas la référence mesurée de plus de 10 % (référence actuelle ≈ 0,0061 $/min en tarif promotionnel, ≈ 0,012 $ par 501 à deux joueurs [EXT 2026-11-20, hypothèse d'usage]).
- **V2-NFR-05** — Le parseur reste une fonction pure sans règle X01 dupliquée ; aucune nouvelle dépendance d'exécution.

### R4. Critères d'acceptation proposés

- **V2-AC-01** — Socket factice ouvert 1 s après le micro, parole immédiate : les 1,5 s initiales sont transmises dans l'ordre (test unitaire avec `voiceBrowserFakes.ts`).
- **V2-AC-02** — L'interface affiche « Connexion… » jusqu'à l'ouverture, puis « Écoute ».
- **V2-AC-03** — La configuration contient `utterance_end_ms` ; un message `UtteranceEnd` émet une seule utterance.
- **V2-AC-04** — Après une proposition, l'expiration de la fenêtre ne pose ni `error` ni message de timeout.
- **V2-AC-05** — Reste 40, annonce « soixante » : la proposition 60 est affichée ; sa validation produit « TROP ! » exactement comme la saisie 60 au keypad (test de parité voix/keypad).
- **V2-AC-06** — Tests table-driven : « cent quarante » → 140 ; « quarante-cinq » → 45 ; « un triple vingt » → T20 seule (annonce partielle) ; « il a fait 60 » → volée 60 ; « trois fois vingt » → 60 ; « rien » → 0 ; « 179 » → aucune proposition.
- **V2-AC-07** — Hors ligne simulé : bouton désactivé avec message, aucun appel réseau au jeton.
- **V2-AC-08** — Navigateur sans `AudioWorklet` simulé : bouton désactivé avec explication avant tout appui.
- **V2-AC-09** — Une erreur Deepgram factice en anglais n'apparaît jamais à l'écran.
- **V2-AC-10** — Corpus de la spec 074 : cibles V2-NFR-02 et V2-NFR-03 atteintes ou écart documenté et arbitré.
- **V2-AC-11** — Non-régression : tous les tests voix existants passent ; saisie keypad, raccourcis et undo inchangés ; la voix du 501 Triathlon fonctionne.

### R5. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Invariant « aucun score vocal validé sans confirmation explicite » | (a) maintenu : confirmation tactile **ou vocale explicite** (« valide ») ; (b) amendé pour une validation temporisée opt-in | (a) dans 003. La confirmation vocale explicite n'est pas une auto-validation et respecte l'invariant ; seule la validation temporisée le contredit : elle est instruite dans la spec 076 et n'amende 003 qu'après décision PO (compte rendu H.6) | — |
| Q2 | Clause « aucun doublon » | Maintenir telle quelle ; reformuler | Reformuler : 003 = fiabilité du pipeline et du parseur X01 ; 075 = port et commandes ; 076 = mode mains libres ; 077 = sortie audio | — |
| Q3 | « trop »/« bust » annoncé | Commande explicite du moteur (spec 057) ; équivalent 0 ; non supporté | Commande moteur via 057 ; d'ici là, message « dis le score annoncé » (le parseur ne décide pas du bust) | — |
| Q4 | Nombre de fléchettes au checkout | Jamais inféré ; séquence complète seulement ; question vocale | Séquence complète annoncée seulement ; sinon modale | — |
| Q5 | Voix activée par défaut et pré-chargement | Actuel (actif, pré-chargement au montage) ; actif sans pré-chargement ; opt-in | Actif, pré-chargement au premier appui (compte rendu H, « voix activée par défaut ? ») | — |
| Q6 | Langue | FR seul ; FR + jargon anglais (« treble », « bust », T20) | FR + jargon anglais minimal, sans mode anglais complet | — |
| Q7 | Correctifs rapides en lot 0 avant la spec 057 | Attendre 057 ; livrer `utterance_end_ms` + retrait de la vérification de reste maintenant | Livrer maintenant : le moteur actuel qualifie déjà le bust via `submitTurn` | — |

### R6. Dépendances

- **V2-ARCH-03 / spec 057** (règles X01 uniques, commande partagée ; ADR 0002) : prérequis de V2-FR-08/09 complets et de Q3.
- **V2-VOICE-03 / spec 074** (corpus et banc) : prérequis de V2-AC-10.
- **V2-VOICE-09 / spec 080** (confidentialité) et **V2-VOICE-10 / spec 006** (jeton, budget) : indépendantes, à livrer dans le même lot que les correctifs.
- **V2-VOICE-04 / spec 075** (ADR 0008) : la migration vers le port réutilisera ce pipeline fiabilisé.
- **V2-DS-00 / spec 018** (baseline navigateurs) pour V2-FR-12 ; **V2-REL-02 / spec 031** : exclure `/api/deepgram/token` du cache du service worker.
