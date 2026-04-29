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
- `api/deepgram/token.ts`

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
