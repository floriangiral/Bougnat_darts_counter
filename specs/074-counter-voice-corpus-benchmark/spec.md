---
id: 074-counter-voice-corpus-benchmark
v2_id: V2-VOICE-03
titre: Voix — corpus de référence et banc de mesure
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: voix
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 30
depend_de: []
remplace: []
remplacee_par: []
issue: '#225'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 074 — Voix — corpus de référence et banc de mesure

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 (chantier 5.1 « scoring vocal »), rapport d'audit 04 (§4, §6.9) et compte rendu consolidé (§C.1, §D.1). Toutes les décisions voix à venir — fiabilisation (spec 003), mode mains libres (076), choix de moteur (078), seuils de confirmation — supposent de **mesurer** l'exactitude, la latence, les faux positifs et le coût. Aujourd'hui, rien n'est mesuré.

## 2. Problématique
Sans corpus ni banc de mesure, la qualité de la voix est jugée « au ressenti » ; on ne peut ni prouver qu'un correctif améliore la situation, ni comparer deux moteurs, ni fixer un seuil de confirmation défendable.

## 3. Objectifs
- O1 — Disposer d'un **corpus texte** versionné (transcripts attendus) exécutable en CI, à coût nul.
- O2 — Disposer d'un **corpus audio** (avec consentement) et d'un banc hors CI rejouant l'audio vers un moteur, produisant un rapport chiffré.
- O3 — Disposer d'un **E2E simulé** (micro et WebSocket factices) couvrant le parcours vocal dans l'application.
- O4 — Publier des métriques comparables : exactitude par volée, rejets, faux engagements, latences p50/p95, coût par volée.

## 4. État actuel vérifié dans le code
- [vérifié] Tests unitaires voix nombreux mais sur transcripts synthétiques : `tests/unit/dartsSpeechParser.test.ts`, `tests/unit/x01/useDeepgramStreaming.test.tsx`, faux navigateurs `tests/unit/x01/voiceBrowserFakes.ts`.
- [vérifié] Aucun test E2E voix : `tests/e2e/*.spec.ts` ne contient aucune occurrence de `voice`/`deepgram`.
- [vérifié] Journalisation de minutage uniquement en développement : `src/features/x01/voice/voiceStreamingLogger.ts:3-9` (`import.meta.env.DEV`).
- [vérifié] Aucune télémétrie produit (`src/lib/env.ts:46` ; compte rendu H.27).
- [vérifié] Playwright `^1.65.1` (`package.json:40`) : interception WebSocket (`page.routeWebSocket`) disponible depuis la 1.48 [EXT, à confirmer à l'implémentation].
- [hypothèse] Une part significative des échecs ressentis vient du pipeline et du parseur plutôt que du modèle (rapport 04 §4).

## 5. Comportement cible
Un mainteneur lance `npm run voice:bench -- --engine deepgram --set calme` (nom indicatif) sur son poste : le banc lit le corpus audio, l'envoie au moteur, passe les transcripts au parseur et produit un rapport JSON + Markdown. En CI, le corpus texte alimente des tests table-driven du parseur et un E2E simulé vérifie le parcours « micro → proposition → validation » sans réseau.

## 6. Périmètre
### Inclus
- Format de corpus versionné (texte + métadonnées), protocole d'enregistrement, consentement.
- Banc local multi-moteurs (adaptateur Deepgram ; autres moteurs via la spec 078).
- Métriques et rapport ; E2E simulé.
- Mesures locales opt-in dans l'application (sans réseau), si Q4 est acceptée.
### Exclu
- Télémétrie envoyée à un serveur (décision produit, compte rendu H.27).
- Choix d'un moteur (spec 078) ; corrections du parseur (spec 003).

## 7. User stories
- En tant que mainteneur, je veux mesurer l'effet d'un correctif du parseur sur 500 énoncés afin de ne pas régresser.
- En tant que product owner, je veux des chiffres de coût et de faux positifs afin de décider du mode mains libres et du budget.
- En tant que contributeur, je veux un E2E voix sans clé Deepgram afin de tester en CI.

## 8. Règles métier
- RM-01 — Un énoncé du corpus porte : texte attendu, intention attendue (`turn_score`, `darts_sequence`, `remaining_score`, commande, **négatif** = conversation à ignorer), contexte de jeu (reste, joueur), résultat attendu.
- RM-02 — Une volée est « correcte » si la commande engagée après confirmation est identique à l'attendu, sans correction.
- RM-03 — Un « faux engagement » est une proposition sur un énoncé négatif ; en mode mains libres, une proposition engagée à tort.
- RM-04 — Le corpus ne contient aucune donnée identifiante : prénoms fictifs, locuteurs pseudonymisés (`L01`…).
- RM-05 — Le résultat attendu respecte la règle unique du moteur (bust qualifié par le moteur, jamais par l'énoncé).

## 9. Parcours utilisateurs
1. Enregistrement : un volontaire signe le consentement, lit une liste d'énoncés (calme, puis bruit de bar diffusé à 65-75 dBA), les fichiers sont nommés selon le schéma.
2. Mesure : le mainteneur lance le banc sur un jeu (calme/bruit/négatif), obtient le rapport, l'archive avec la version du commit.
3. CI : les tests table-driven et l'E2E simulé tournent à chaque PR.

## 10. Exigences fonctionnelles
- FR-01 — Corpus texte `tests/fixtures/voice/corpus.v1.json` : ≥ 500 énoncés, dont ≥ 15 % négatifs (conversations de bar), ≥ 60 commandes (spec 075), nombres en lettres et en chiffres, séquences, restes, volées nulles, jargon.
- FR-02 — Schéma JSON versionné et validé (`schemaVersion`), avec tests de validité du fichier.
- FR-03 — Corpus audio : ≥ 10 locuteurs (dont accents régionaux), conditions calme / bruit de bar / musique ou TV ; fichiers WAV 16 kHz mono ; stockés **hors du repo** (Q1) avec un manifeste de sommes de contrôle versionné.
- FR-04 — Banc local (`scripts/voice-bench/`) : lit le manifeste, envoie l'audio en temps réel simulé au moteur via le même adaptateur que l'application (port de la spec 075 quand il existe), applique le parseur, calcule les métriques, écrit `voice-bench-report.json` et un résumé Markdown hors du repo.
- FR-05 — Métriques : exactitude par volée, taux de rejet, taux de faux engagement, latence fin de parole → transcript final et → proposition (p50/p95), durée facturée par énoncé et coût estimé, WER indicatif.
- FR-06 — E2E simulé Playwright : `getUserMedia` factice (fichier audio ou flux synthétique) et WebSocket Deepgram intercepté renvoyant des messages scriptés ; parcours micro → proposition → validation → score affiché ; aucune clé requise.
- FR-07 — Les tests table-driven du parseur sont générés depuis le corpus texte (un cas par énoncé, attendu = résultat du moteur).
- FR-08 — Option (Q4) : compteurs locaux en mémoire/IndexedDB (volées vocales, corrections, rejets, latences), exportables en JSON par l'utilisateur, jamais envoyés.

## 11. Exigences non fonctionnelles
- NFR-01 Coût : un passage complet du banc Deepgram (≈ 500 énoncés × 3 s ≈ 25 min) coûte ≈ 0,15 $ au tarif relevé le 2026-11-20 (0,0061 $/min) ; la CI ne consomme jamais de crédit Deepgram.
- NFR-02 Confidentialité : consentement écrit, droit de retrait, aucun audio dans le repo public, aucune donnée de joueur réel.
- NFR-03 Reproductibilité : rapport horodaté avec commit, moteur, paramètres, version du corpus.
- NFR-04 Durée de l'E2E simulé ≤ 30 s par projet Playwright.

## 12. Cas nominaux et alternatifs
- Nominal : banc calme Deepgram → rapport ; comparaison avec le rapport précédent.
- Alternatif : moteur sans entrée fichier (Web Speech) → passage par un périphérique audio virtuel ou exclusion documentée (spec 078).

## 13. Cas limites
Énoncés très longs (> 10 s), silence total, saturation, deux locuteurs simultanés, annonce coupée au début (vérifie le pré-roll de la spec 003), prénoms prononcés (si commandes nominatives).

## 14. Gestion des erreurs
Fichier audio manquant ou somme invalide → énoncé ignoré et signalé ; moteur indisponible → rapport partiel marqué « incomplet » ; quota de crédit atteint → arrêt propre.

## 15. Impacts architecturaux
Aucun impact sur le domaine. Le banc réutilise le parseur pur et, à terme, le port `SpeechRecognizer` (ADR 0008) : il valide aussi la séparation moteur / grammaire. Le code du banc vit dans `scripts/`, hors bundle.

## 16. Impacts sur les données et les interfaces
Nouveau fichier de corpus versionné ; manifeste audio ; aucun changement de données persistées de l'application sauf FR-08 (clé IndexedDB dédiée, purgeable).

## 17. Compatibilité avec l'existant
Les tests existants restent ; les nouveaux cas complètent `tests/unit/dartsSpeechParser.test.ts`. L'E2E simulé s'ajoute aux projets Playwright existants (Chromium d'abord).

## 18. Dépendances
Aucune dépendance bloquante. Alimente V2-VOICE-01 (003), V2-VOICE-05 (076), V2-VOICE-07 (078), V2-VOICE-08 (079). Lien : V2-QA-08 (spec 008, E2E autonomes).

## 19. Critères d'acceptation
- AC-01 — Le corpus texte contient ≥ 500 énoncés valides selon le schéma ; test de validité vert.
- AC-02 — Les tests générés depuis le corpus s'exécutent en CI ; les échecs connus sont listés dans un fichier d'écarts lié à la spec 003 (pas de figement de bug).
- AC-03 — Un passage du banc Deepgram sur le jeu « calme » produit un rapport contenant toutes les métriques de FR-05.
- AC-04 — L'E2E simulé passe sans réseau ni clé, sur Chromium, en ≤ 30 s.
- AC-05 — Un rapport de référence (« baseline » au commit de départ) est archivé et cité par les specs 003 et 078.
- AC-06 — Formulaire de consentement et procédure de retrait documentés.

## 20. Scénarios de tests
Unitaires : validité du corpus, calcul des métriques (cas construits). E2E : parcours simulé, timeout, erreur jeton. Terrain : session d'enregistrement en club (bruit réel) [à organiser].

## 21. Exigences de non-régression
Aucun test existant modifié sans justification ; la CI ne dépend d'aucun service externe.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Recrutement de locuteurs insuffisant | Mesures biaisées | Moyenne | Club partenaire, sessions courtes, objectif progressif (5 puis 10) |
| Corpus non représentatif du bar | Surestimation | Moyenne | Bruit réel enregistré en bar, jeu dédié |
| Fuite d'audio | Atteinte à la vie privée | Faible | Stockage privé, consentement, pseudonymisation |
| Banc qui diverge de l'application | Mesures fausses | Moyenne | Réutiliser parseur et adaptateur réels |

## 23. Décisions architecturales
ADR 0008 (port de reconnaissance vocale) : le banc en est le premier consommateur hors UI. Aucun nouvel ADR.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Stockage du corpus audio | Repo (Git LFS) ; stockage privé (R2, disque) ; pas d'audio | Stockage privé hors repo + manifeste versionné | — |
| Q2 | Taille et cibles | 500 énoncés / 10 locuteurs ; 1 000 / 20 | 500 / 10 pour la V2, extension si écarts | — |
| Q3 | Cibles de réussite | ≥ 97 % calme, ≥ 92 % bruit, ≤ 1 faux engagement / 200 volées | Adopter comme cibles provisoires | — |
| Q4 | Mesures locales opt-in dans l'app | Oui (local, exportable) ; non | Oui, local uniquement, désactivé par défaut (compte rendu H.27) | — |
| Q5 | Accents régionaux / langue | FR seul ; FR + jargon EN | FR + jargon minimal (aligné spec 003 Q6) | — |

## 25. Traçabilité
Rapport 04 (§4, §6.9, §8 V2-VOICE-03) ; compte rendu §C.1, §D.1, §F.4 ; specs 003, 006, 075, 076, 078 ; ADR 0008.
