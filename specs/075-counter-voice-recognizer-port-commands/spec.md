---
id: 075-counter-voice-recognizer-port-commands
v2_id: V2-VOICE-04
titre: Voix — port de reconnaissance et commandes vocales
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: voix
priorite: P1
difficulte: M
recommandation: recommande
lot: 3
poids: 23
depend_de: [V2-ARCH-03]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 075 — Voix — port de reconnaissance et commandes vocales

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Recommandation architecturale du rapport d'audit 04 (§6.3, §6.8, §8 V2-VOICE-04), reprise au compte rendu (§C.1, §F.4, fondation clé n° 5 « commandes métier partagées »). La décision d'architecture associée est l'**ADR 0008 — port de reconnaissance vocale et grammaires par jeu** (`docs/adr/0008-port-de-reconnaissance-vocale.md`, proposée), articulée avec l'**ADR 0002** (règles X01 uniques et commandes partagées). Cette spec ne recouvre pas la spec 003 : 003 fiabilise le pipeline et le parseur X01 existants ; 075 les place derrière un port et ajoute les commandes de contrôle.

## 2. Problématique
La voix est un hook React de 650 lignes couplé à Deepgram et à `MatchView` ; elle ne sait que proposer un score. Impossible d'ajouter un moteur, un jeu, un mode mains libres ou un affichage TV sans dupliquer, et impossible de dire « annule » ou « valide ».

## 3. Objectifs
- O1 — Un port `SpeechRecognizer` indépendant du moteur, de React et du jeu.
- O2 — Un contrôleur de session vocale pur (machine d'états testable sans navigateur).
- O3 — Des grammaires par jeu produisant des **intentions**, converties en commandes métier de l'ADR 0002 — les mêmes que le keypad.
- O4 — Les commandes vocales **annule, valide, corrige, suivant, reste** en X01.

## 4. État actuel vérifié dans le code
- [vérifié] `src/features/x01/voice/useDeepgramStreaming.ts` (650 l.) mêle capture, jeton, WebSocket, fenêtre, tentatives et état d'interface.
- [vérifié] L'intégration vit dans `views/MatchView.tsx:170-223` (clé de session, `onUtterance` → `buildVoiceScoreProposal` → pré-remplissage) et `:377-386` (soumission).
- [vérifié] Le parseur produit trois intentions de score (`turn_score`, `remaining_score`, `darts_sequence`) ; aucune commande : « annule », « valide », « suivant » → « Aucune annonce darts reconnue » (exécution hors repo, rapport 04 §2.6).
- [vérifié] L'undo est une pile en mémoire de `MatchView` (`views/MatchView.tsx:309-345`) ; il annule d'abord la saisie en cours, puis la proposition vocale, puis la dernière volée.
- [vérifié] Les keyterms Deepgram sont une liste statique de 14 termes (`voiceConfig.ts:2-17`) transmise en paramètres d'URL du WebSocket ; ni nombres, ni commandes.
- [vérifié] `src/application/` contient `scoring` et `x01Bot` ; aucun module voix. `src/infrastructure/` existe.
- [vérifié] `CricketKeypad` expose déjà `onHit(target, multiplier)` / `onMiss` (`components/game/CricketKeypad.tsx:6-7`), base de la spec 079.

## 5. Comportement cible
```
presentation/  useVoiceSession (liaison React mince), VoiceButton, VoiceProposalBanner
application/   voice/VoiceSessionController (idle → connecting → listening → proposing → committed | cancelled | error)
               voice/VoiceIntent (ScoreTotal | Darts | Remaining | Confirm | Cancel | Correct | Next | UndoLastTurn | QueryRemaining)
               ports: SpeechRecognizerPort (+ fake de test)
features/x01/voice/  grammaire X01 : transcript → VoiceIntent[] + confiance + couverture
infrastructure/voice/ DeepgramRecognizer (reprend le pipeline fiabilisé par la spec 003)
domaine        inchangé ; les intentions deviennent des commandes ADR 0002 (spec 057)
```
Le contrôleur reçoit des intentions, tient la proposition en attente, et n'émet une commande métier qu'après une confirmation explicite (tap ou « valide »).

## 6. Périmètre
### Inclus
Port, contrôleur, liaison React, adaptateur Deepgram, faux adaptateur de test, grammaire X01 avec commandes, migration de `MatchView`.
### Exclu
Écoute continue (spec 076), synthèse vocale (077), autres moteurs (078), autres jeux (079), affichage TV (081).

## 7. User stories
- En tant que joueur, je veux dire « valide » pour confirmer la proposition sans toucher l'écran.
- En tant que joueur, je veux dire « non, quarante-cinq » pour corriger la proposition.
- En tant que joueur, je veux dire « annule la dernière volée » pour revenir en arrière.
- En tant que contributeur, je veux tester la voix sans navigateur ni Deepgram.

## 8. Règles métier
- RM-01 — La voix ne modifie jamais l'état de partie directement : elle émet les **mêmes commandes** que le keypad (ADR 0002).
- RM-02 — **Le parseur et le contrôleur ne qualifient ni bust, ni fin de manche, ni possibilité d'un score** : le moteur le fait.
- RM-03 — « valide » est une **confirmation explicite** : elle respecte l'invariant de la spec 003 (ce n'est pas une auto-validation).
- RM-04 — Une commande ne s'applique qu'au joueur et à la volée courants (clé de session existante) ; toute intention obsolète est ignorée.
- RM-05 — Toute action keypad pendant une proposition vocale l'annule (le keypad reste maître).
- RM-06 — « annule » seul annule la **proposition en attente** ; l'annulation d'une volée engagée exige « annule la dernière volée » ou « retour ».
- RM-07 — Précision limitée : « double seize » seul n'indique pas la fléchette ; aucune inférence de position (cf. spec 003 V2-FR-10).

## 9. Parcours utilisateurs
1. Tap micro → « 60 » → proposition affichée → « valide » → volée engagée, joueur suivant.
2. « 60 » → « non, 45 » → proposition remplacée → tap Valider.
3. Aucune proposition → « annule la dernière volée » → bandeau « Annuler la volée de Paul (60) ? » → « valide » → undo.
4. « il reste combien ? » → mise en évidence visuelle du reste (réponse vocale si la spec 077 est livrée).

## 10. Exigences fonctionnelles
- FR-01 — Port `SpeechRecognizerPort` : `capabilities()`, `start(options)`, `stop()`, flux d'événements `state`, `interim`, `final {transcript, confidence, alternatives?}`, `error {cause}` ; options : langue, indices de vocabulaire, plafond de durée.
- FR-02 — `DeepgramRecognizer` implémente le port en reprenant le pipeline de la spec 003 ; aucun type Deepgram ne traverse le port.
- FR-03 — `VoiceSessionController` est une fonction de transition pure (état, événement) → (état, effets), sans React ni `window`.
- FR-04 — `useVoiceSession` relie le contrôleur à React ; `MatchView` n'importe plus `useDeepgramStreaming`.
- FR-05 — Grammaire X01 : transcript → liste d'intentions avec confiance et couverture ; intentions de score existantes + `Confirm` (« valide », « oui », « c'est bon »), `Cancel` (« non », « annule »), `Correct` (« non, N », « corrige N »), `Next` (Q2), `UndoLastTurn` (« annule la dernière volée », « retour »), `QueryRemaining` (« il reste combien »), `Remaining` (« il me reste N », existant).
- FR-06 — Les intentions de score deviennent les commandes de la spec 057 ; la proposition affichée provient de l'aperçu du moteur (bust, impossible).
- FR-07 — `UndoLastTurn` passe par la même commande d'annulation que le bouton, avec confirmation.
- FR-08 — Les indices de vocabulaire envoyés au moteur incluent nombres en lettres et commandes ; **aucun prénom** n'est envoyé (Q3).
- FR-09 — Un faux adaptateur (`FakeSpeechRecognizer`) permet de rejouer des transcripts en test unitaire et E2E.

## 11. Exigences non fonctionnelles
- NFR-01 — Comportement visible identique à l'existant tant qu'aucune commande n'est utilisée (tests de caractérisation préalables).
- NFR-02 — Contrôleur et grammaire couverts ≥ 90 % lignes (spec 029).
- NFR-03 — Aucun surcoût Deepgram : mêmes durées d'écoute ; keyterms bornés à 100 (limite fournisseur [EXT]).
- NFR-04 — Aucune dépendance d'exécution nouvelle.

## 12. Cas nominaux et alternatifs
Nominal : parcours 1. Alternatifs : correction (2), undo (3), interrogation (4), tap au lieu de « valide ».

## 13. Cas limites
« valide » sans proposition (ignoré, indice visuel) ; « valide » sur proposition ambiguë (Q1) ; « non » isolé ; commande et score dans la même phrase (« 60 valide ») ; changement de joueur pendant l'écoute ; bot qui joue ; partie partagée (`isKeyboardLocked`, `views/MatchView.tsx:529`).

## 14. Gestion des erreurs
Causes typées (`microphone`, `token`, `connection`, `timeout`, `transcript`, `audio`, + `budget`/`disabled` de la spec 006) ; retour au manuel sans perte de la saisie en cours.

## 15. Impacts architecturaux
Nouvelles couches `src/application/voice/` et `src/infrastructure/voice/` ; `src/features/x01/voice/` ne garde que la grammaire X01. Direction des dépendances : présentation → application → domaine ; infrastructure implémente le port. Abstraction justifiée : au moins deux implémentations (Deepgram + faux adaptateur ; moteurs de la spec 078 ensuite). Coordination avec la spec 061 (découpage de `MatchView`).

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée. Nouveau contrat interne `VoiceIntent` (versionné dans le code). L'état vocal éphémère est exposé pour la spec 081.

## 17. Compatibilité avec l'existant
Bouton micro, réglage « Assistance vocale », undo et raccourcis inchangés ; voix du 501 Triathlon conservée.

## 18. Dépendances
**V2-ARCH-03 / spec 057** (commandes partagées, bust au moteur) — bloquante. Fortement liée : V2-VOICE-01 / spec 003 (pipeline fiabilisé), V2-ARCH-11 / spec 061 (découpage `MatchView`). Débloque 076, 077, 079, 081.

## 19. Critères d'acceptation
- AC-01 — Le contrôleur est testé sans DOM : toutes les transitions de FR-03, y compris intentions obsolètes ignorées.
- AC-02 — `MatchView` n'importe plus `useDeepgramStreaming` ; tests de caractérisation existants verts.
- AC-03 — Reste 301 : « 60 » puis « valide » → volée 60 engagée par la même commande que le keypad (espion sur la commande).
- AC-04 — Reste 40 : « 60 » puis « valide » → bust qualifié par le moteur (« TROP ! »), identique au keypad.
- AC-05 — « non, 45 » remplace la proposition 60 par 45 sans engagement.
- AC-06 — « annule la dernière volée » puis « valide » → même effet que le bouton d'annulation ; « annule » seul n'annule que la proposition.
- AC-07 — Toute frappe keypad pendant une proposition l'annule.
- AC-08 — La configuration d'écoute ne contient aucun prénom.
- AC-09 — E2E simulé (spec 074) : parcours 1 à 3 sans réseau.

## 20. Scénarios de tests
Unitaires : contrôleur, grammaire (corpus texte de la spec 074), adaptateur Deepgram avec faux WebSocket. Composants : bannière et bouton. E2E : faux adaptateur. Terrain : 20 volées avec commandes en club.

## 21. Exigences de non-régression
Suite voix existante (migrée, pas supprimée), parcours keypad, robot, partie partagée, lien partenaire (spec 030).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Régression du chemin X01 en migrant `MatchView` | Élevé | Moyenne | Caractérisation (spec 039) avant, migration incrémentale |
| Faux positifs « valide » (conversation) | Engagement erroné | Moyenne | Confirmation limitée aux propositions valides ; undo vocal |
| Ambiguïté « annule » | Undo involontaire | Moyenne | RM-06 + confirmation de l'undo |
| Dépendance à 057 retardée | Blocage | Moyenne | Port et contrôleur livrables avant, branchement commandes après |

## 23. Décisions architecturales
ADR 0008 (port de reconnaissance vocale, proposée) ; ADR 0002 (commandes partagées, proposée).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | « valide » sur une proposition ambiguë | Accepté ; refusé (tap ou répétition) | Refusé : « valide » seulement pour une proposition valide | — |
| Q2 | Sens de « suivant » en X01 | Synonyme de « valide » ; sans effet en X01 (réservé aux jeux par fléchette) | Synonyme de « valide » s'il y a une proposition, sinon sans effet | — |
| Q3 | Prénoms dans les indices du moteur (commandes nominatives) | Jamais ; opt-in | Jamais en V2 (les prénoms partiraient dans l'URL du fournisseur) | — |
| Q4 | Confirmation de l'undo vocal | Toujours ; jamais | Toujours (« valide » ou tap) | — |
| Q5 | Langue des commandes | FR ; FR + « ok/next » | FR + « ok » | — |

## 25. Traçabilité
Rapport 04 (§6.3, §6.5, §6.8) ; compte rendu §C.1, §F.4, §G (fondation 5), §H.6 ; ADR 0002, 0008 ; specs 003, 057, 061, 074, 076, 077, 079, 081.
