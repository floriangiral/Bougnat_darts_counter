---
id: ADR-0008
titre: Port de reconnaissance vocale et grammaires par jeu
statut: proposee
date: 2026-11-20
specs_liees: [003, 075, 076, 078, 079]
---

# ADR-0008 — Port de reconnaissance vocale

## Statut
Proposée.

## Contexte
`src/features/x01/voice/useDeepgramStreaming.ts` (650 lignes) mêle capture audio, WebSocket Deepgram, cycle de vie et état d'interface ; le parseur X01 applique des règles de jeu.

## Décision proposée
- Interface `SpeechRecognizer` (start, stop, événements de transcription intermédiaire/finale, erreurs) avec un adaptateur Deepgram ; d'autres moteurs (Web Speech, WASM) pourront être branchés après mesure (spec 078).
- Grammaire par jeu produisant des **intentions** (score, commande) ; les intentions sont converties en commandes métier de l'ADR-0002 ; la qualification (bust, fin) reste au moteur.
- État vocal éphémère séparé du score engagé (diffusable sur la TV).
