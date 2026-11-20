---
id: 078-counter-voice-on-device-study
v2_id: V2-VOICE-07
titre: Étude — moteurs vocaux sur l'appareil
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: voix
priorite: P2
difficulte: M
recommandation: etude
lot: 5
poids: 15
depend_de: [V2-VOICE-03]
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 078 — Étude : moteurs vocaux sur l'appareil

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Une étude ne crée aucune exigence : elle produit une recommandation et, si elle est retenue, une spec fonctionnelle et/ou un amendement de l'ADR 0008.

## 1. Contexte et origine
Rapport d'audit 04 (§5.1, §5.4, §8 V2-VOICE-07) et compte rendu §D.1. La voix repose sur Deepgram Nova-3 (`src/features/x01/voice/voiceConfig.ts:19-35`), service payant (≈ 0,0061 $/min en tarif promotionnel relevé le 2026-11-20) qui envoie l'audio hors de l'appareil et ne fonctionne pas hors ligne. Le paysage a évolué en 2026 : reconnaissance Web Speech **sur l'appareil** (Chrome desktop 139+, Firefox desktop 160), modèles WASM/ONNX français légers. L'ADR 0008 prévoit que d'autres moteurs se branchent derrière le port de reconnaissance « après mesure ».

## 2. Questions à trancher
- Q1 — Un moteur sur l'appareil atteint-il, sur le corpus de la spec 074, une exactitude par volée proche de Deepgram (écart ≤ 3 points) ?
- Q2 — Quelles plateformes en bénéficient réellement (desktop seulement ? tablettes ?) et avec quelle latence et quelle charge CPU/batterie ?
- Q3 — Quel poids de téléchargement, quel hébergement des modèles, quelles licences ?
- Q4 — Le mode « serveur » de Web Speech (audio envoyé à Google ou Apple) est-il acceptable comme repli gratuit ?
- Q5 — Faut-il un moteur hybride (local d'abord, Deepgram en repli) et selon quelles règles ?

## 3. État actuel vérifié dans le code
- [vérifié] Moteur unique Deepgram via `@deepgram/sdk` `^5.20.0` (`package.json:32`) ; CSP limitée à `api.deepgram.com` (`public/_headers:2`).
- [vérifié] Capture AudioWorklet 16 kHz mono (`src/features/x01/voice/audioContextManager.ts`, `voicePcm.ts`) réutilisable par un moteur WASM.
- [vérifié] Aucun port de reconnaissance (prévu par la spec 075 / ADR 0008).
- [vérifié] Aucune mesure d'exactitude ni de latence (spec 074).

## 4. Contraintes
Gratuité et absence de publicité ; aucun compte ; fonctionnement dans le navigateur (PWA, spec 031) ; Clean Architecture (adaptateur derrière le port de l'ADR 0008, aucune règle de jeu dans le moteur) ; coût récurrent nul visé ; poids de bundle (le modèle doit être chargé à la demande, jamais dans le parcours de base) ; baseline navigateurs (spec 018).

## 5. Options étudiées
| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| O1 Web Speech sur l'appareil | `SpeechRecognition` avec `processLocally`, biais `phrases` (Chrome 142+) | 0 $, privé, hors ligne après pack | Desktop uniquement (pas Chrome Android ni Safari) [EXT] ; FR sur l'appareil [à confirmer] | 0 $ | S |
| O2 Web Speech « serveur » | Reconnaissance du navigateur via Google/Apple | 0 $, mobile | Audio chez un tiers hors contrat ; `continuous` inopérant sur Chrome Android [EXT] | 0 $ | S |
| O3 Moonshine-tiny-fr (transformers.js) | Modèle ONNX ≈ 28 Mo int8, WASM/WebGPU | Privé, hors ligne, multi-plateforme | Non streaming natif ; CPU tablette ; modèle communautaire [licence à confirmer] | 0 $ (+ hébergement) | M |
| O4 Whisper-tiny/base (transformers.js) | ≈ 41 Mo / 77 Mo int8 | Multilingue, robuste | Lourd ; latence ; hallucinations sur silence [hypothèse] | 0 $ (+ hébergement) | M |
| O5 Vosk WASM + grammaire fermée | Modèle FR small 41 Mo | Grammaire fermée | Paquet `vosk-browser` non publié depuis 2022-12 [EXT] — **déconseillé** | 0 $ | M |
| O6 Picovoice | Rhino/Cheetah | Excellente grammaire | Offre B2B sans plan gratuit [EXT] — **incompatible** | — | — |
| O0 Statu quo Deepgram | Moteur actuel fiabilisé (003) | Qualité homogène | Payant, audio hors appareil, en ligne | ≈ 0,0061 $/min | — |

## 6. Critères d'évaluation et analyse
Critères : exactitude par volée (corpus 074, calme/bruit), faux engagements, latence fin de parole → transcript (p50/p95), CPU et batterie sur la tablette de référence, poids et temps de premier chargement, disponibilité par plateforme, confidentialité, licence, maintenance du projet, coût d'hébergement des modèles.

Sources (consultées le 2026-11-20, à re-vérifier au lancement de l'étude) : MDN et BCD `SpeechRecognition` [confirmé] ; notes de version Firefox 160 [confirmé] ; API Hugging Face `onnx-community/*` (tailles) [confirmé] ; page Vosk models (WER 24 % FR small) [confirmé] ; FAQ Picovoice [confirmé] ; limite de taille de fichier Cloudflare Pages (25 Mio) [à confirmer] ; FR sur l'appareil pour Chrome et Firefox [non documenté].

## 7. Recommandation (non validée)
Conserver Deepgram comme moteur par défaut. Mener des PoC mesurés de **O1** (desktop, cas « club + PC + TV ») et **O3** (multi-plateforme hors ligne) derrière le port de la spec 075. Écarter O5 et O6. Soumettre O2 à une décision de confidentialité explicite (compte rendu H.5) : ne pas l'activer par défaut.

## 8. Protocole de vérification (PoC, mesures, terrain)
1. Branche de PoC hors `main` ; adaptateurs O1 et O3 implémentant le port de reconnaissance.
2. Passage du banc de la spec 074 (jeux calme, bruit, négatif) ; O1 via périphérique audio virtuel si nécessaire.
3. Mesures sur trois appareils : PC Chrome/Firefox récents, tablette Android d'entrée de gamme, iPad (Safari) — CPU, mémoire, batterie sur 30 min.
4. Mesure du premier chargement (réseau 4G simulé) et du cache (service worker, spec 031).
5. Revue des licences des modèles et du coût d'hébergement (R2 ou CDN tiers, impact CSP).

## 9. Livrables attendus de l'étude
Rapport chiffré (tableau par option et plateforme), recommandation argumentée, amendement proposé de l'ADR 0008 (liste des adaptateurs), et si retenu une spec fonctionnelle « moteur X » avec règles de sélection et de repli.

## 10. Risques
Résultats non représentatifs (corpus trop petit) ; évolution rapide des API navigateur ; poids des modèles incompatible avec les tablettes visées ; dérive vers une maintenance de modèles.

## 11. Questions ouvertes et décisions à prendre
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| D1 | Lancer l'étude en V2 ou V2.x | V2 (lot 5) ; plus tard | Lot 5, après le corpus 074 | — |
| D2 | Web Speech « serveur » | Interdit ; opt-in ; repli par défaut | Interdit par défaut, opt-in éventuel après information (spec 080) | — |
| D3 | Hébergement des modèles | Même origine ; R2 ; CDN Hugging Face | R2 ou même origine (CSP inchangée hors domaine propre) | — |
| D4 | Seuil de bascule hybride | Exactitude ; plateforme ; budget épuisé | Plateforme + budget (spec 006) | — |

## 12. Traçabilité
Rapport 04 (§5.1-§5.4, §10) ; compte rendu §C.1, §D.1, §H.5 ; specs 003, 006, 018, 031, 074, 075, 080 ; ADR 0008.
