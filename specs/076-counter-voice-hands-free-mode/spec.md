---
id: 076-counter-voice-hands-free-mode
v2_id: V2-VOICE-05
titre: Voix — mode partie mains libres
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: voix
priorite: P1
difficulte: L
recommandation: recommande
lot: 3
poids: 25
depend_de: [V2-VOICE-01, V2-VOICE-03, V2-VOICE-04, V2-VOICE-10]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 076 — Voix — mode partie mains libres

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 (chantier 5.1 : « jouer sans toucher l'écran ») et proposition d'innovation n° 1 « Parle, Bougnat compte » (rapport 09, INNO-01 ; compte rendu §E rang 1). Rapport 04 §6.2 (mode « Partie ») et §9 ; compte rendu §C.1 et §H.5/H.6. Cette spec est distincte de la spec 003 (qui fiabilise le mode « annonce » à la demande) : elle introduit un **mode** nouveau dont un des choix possibles (validation temporisée) modifierait l'invariant de 003.

## 2. Problématique
Aujourd'hui, une volée vocale demande deux contacts (micro puis Valider) : le gain face au keypad et à ses raccourcis est faible, et le joueur regarde encore l'écran.

## 3. Objectifs
- O1 — En mode partie, ≥ 80 % des volées enregistrées sans toucher l'écran (mesuré sur le terrain, spec 074).
- O2 — ≤ 1 volée engagée à tort pour 200 volées (corpus « conversation de bar »).
- O3 — Coût ≤ 0,02 $ par match vocal grâce à la détection locale de parole.
- O4 — Parcours de base inchangé : le mode est une option, jamais une étape.

## 4. État actuel vérifié dans le code
- [vérifié] Écoute à la demande, fenêtre fixe de 6,5 s (`src/features/x01/voice/voiceConfig.ts:1`), micro libéré à chaque volée (`views/MatchView.tsx:219-223`).
- [vérifié] Validation tactile obligatoire (`views/MatchView.tsx:377-386`) ; invariant « aucun score vocal validé sans confirmation explicite » (spec 003).
- [vérifié] Aucune commande vocale, aucune sortie audio (`speechSynthesis` : 0 occurrence), aucun Wake Lock (recherche `wakeLock` : 0).
- [vérifié] Réglage « Assistance vocale IA » par match, non persisté (`components/match/MatchSettingsModal.tsx:86-103`, `views/MatchView.tsx:108,162`).
- [vérifié] Coût fournisseur ≈ 0,0061 $/min (tarif promotionnel relevé le 2026-11-20 [EXT]).

## 5. Comportement cible
Le joueur active « Mode partie mains libres » dans les réglages du match. Après une information explicite (spec 080), le micro reste ouvert pendant la partie ; une détection de parole **sur l'appareil** n'ouvre le flux vers le moteur que pendant la parole (avec un pré-roll). L'annonce du joueur actif produit une proposition, confirmée selon le **mode de confirmation choisi** ; la volée est engagée par la commande commune, le joueur suivant est appelé (visuel, et vocal si la spec 077 est livrée), l'écoute se réarme.

**Modes de confirmation (décision PO, Q1)** :
- **A — vocale explicite** : « valide » (ou tap). Compatible avec l'invariant de la spec 003. *Recommandé par défaut.*
- **B — tactile** : tap sur Valider (mains libres partiel).
- **C — temporisée annulable** : la proposition s'engage seule après un compte à rebours (2 s proposées) sauf « non/annule » ou tap. **Contredit l'invariant de la spec 003** : ne peut être livrée qu'après décision du product owner et amendement explicite de 003 ; restreinte aux propositions valides et non ambiguës.

## 6. Périmètre
### Inclus
Réglage par match, écoute continue avec détection locale de parole, réarmement, modes A et B, mode C conditionnel, pause automatique, Wake Lock, indicateur micro permanent, plafond de durée par match, coordination avec la sortie audio.
### Exclu
Mot d'activation (« wake word », déconseillé en V2 — compte rendu §D.1), autres jeux (079), affichage TV (081), autres moteurs (078).

## 7. User stories
- En tant que joueur seul à l'entraînement, je veux enchaîner mes volées en les annonçant, sans revenir à la tablette.
- En tant que joueur entre amis, je veux corriger « non, 45 » sans toucher l'écran.
- En tant que product owner, je veux que le coût reste plafonné et que la voix se coupe proprement au-delà.

## 8. Règles métier
- RM-01 — Seules les annonces pendant la volée du joueur actif sont prises en compte ; la clé de session invalide toute intention obsolète.
- RM-02 — Le moteur qualifie bust, checkout et fin ; la voix n'émet que des commandes communes (ADR 0002, spec 057).
- RM-03 — Le keypad reste actif ; toute frappe annule la proposition en cours.
- RM-04 — En mode C, aucune proposition `ambiguous` ni de checkout n'est engagée sans confirmation explicite.
- RM-05 — Checkout : le nombre de fléchettes n'est inféré que d'une séquence complète ; sinon question visuelle (et vocale si 077) — « double seize » seul n'indique pas la fléchette.
- RM-06 — Pendant une annonce de la sortie audio (spec 077), les transcriptions sont ignorées (semi-duplex) ; le propriétaire audio unique coordonne micro et haut-parleur.
- RM-07 — Plafond de durée facturée par match (proposition : 10 min) ; au-delà, retour au mode « annonce » à la demande avec message.

## 9. Parcours utilisateurs
1. Réglages du match → « Mode partie mains libres » → information (1ʳᵉ fois) → autorisation micro → indicateur « Micro ouvert ».
2. Paul lance, dit « soixante » → proposition 60 → « valide » (mode A) → volée engagée → « Léa, à toi » (visuel/vocal).
3. Léa dit « cent quarante » puis « non, cent » → proposition 100 → « valide ».
4. Trois minutes sans parole → pause automatique, micro fermé, bandeau « Reprendre l'écoute » (tap).
5. Plafond atteint → message « Mode mains libres suspendu pour ce match » → bouton micro à la demande.

## 10. Exigences fonctionnelles
- FR-01 — Option « Mode partie mains libres » dans les réglages du match, désactivée par défaut ; persistance du choix selon Q4.
- FR-02 — Le micro est obtenu une fois pour le match et conservé tant que le mode est actif (pas de réacquisition par volée).
- FR-03 — Détection locale de parole (VAD) : flux vers le moteur ouvert uniquement pendant la parole + pré-roll ≥ 300 ms + fin de parole ; aucune donnée audio envoyée hors parole.
- FR-04 — Réarmement automatique après engagement, annulation ou rejet.
- FR-05 — Modes de confirmation A et B livrés ; mode C livré seulement si Q1 = C validée, et alors anneau de compte à rebours visible, annulable par voix ou tap.
- FR-06 — Commandes de la spec 075 disponibles (valide, non, corrige, annule la dernière volée, il reste combien).
- FR-07 — Pause automatique après N minutes sans parole (proposition : 3) et à la mise en arrière-plan ; reprise par tap.
- FR-08 — Écran maintenu allumé (Screen Wake Lock) pendant le mode, libéré à la sortie ; absence d'API sans erreur bloquante.
- FR-09 — Indicateur permanent « micro ouvert » et bouton de coupure toujours accessible.
- FR-10 — Plafond de durée facturée par match (RM-07) et respect des refus `budget`/`disabled` de la spec 006.
- FR-11 — Compteurs locaux (volées vocales, sans contact, corrections) pour mesurer O1, conformes à la décision Q4 de la spec 074.

## 11. Exigences non fonctionnelles
- NFR-01 Coût : sans VAD, une partie de 40 min ≈ 0,24 $ ; avec VAD, cible ≤ 0,02 $/match. À 1 000 parties vocales/jour, 0,02 $ × 1 000 × 30 = **600 $/mois** : incompatible avec la gratuité sans plafond global (spec 006) — décision PO (H.5).
- NFR-02 Latence fin de parole → proposition p95 ≤ 1 000 ms ; reprise d'écoute après engagement ≤ 300 ms.
- NFR-03 Batterie et CPU : VAD ≤ 10 % CPU sur la tablette de référence [à mesurer].
- NFR-04 Confidentialité : information préalable obligatoire (spec 080) ; aucun audio hors parole.
- NFR-05 Accessibilité : indicateurs non uniquement colorés ; annonces visuelles lisibles à 2-3 m.

## 12. Cas nominaux et alternatifs
Nominal : parcours 1-3. Alternatifs : mode B ; bar bruyant → recommandation d'utiliser le mode « annonce » (push-to-talk) ; robot adversaire (écoute suspendue pendant son tour).

## 13. Cas limites
Deux joueurs parlent en même temps ; annonce du joueur non actif ; TV ou musique fortes ; écran verrouillé (iOS coupe le micro [à confirmer]) ; appel entrant ; perte réseau pendant la parole ; Bluetooth casque/haut-parleur.

## 14. Gestion des erreurs
Toute erreur moteur → pause du mode, message français par cause, keypad intact. Perte de permission micro → sortie du mode.

## 15. Impacts architecturaux
S'appuie sur le contrôleur et le port de la spec 075 (ADR 0008) ; nouveau port `VoiceActivityPort` (VAD) dans `src/application/voice/`, adaptateur dans `src/infrastructure/voice/`. Coordination avec le service audio unique de la spec 077. Domaine inchangé.

## 16. Impacts sur les données et les interfaces
Préférence éventuelle (Q4) en stockage local ; compteurs locaux ; état vocal éphémère exposé à la spec 081.

## 17. Compatibilité avec l'existant
Mode « annonce » actuel conservé et par défaut ; aucun changement du parcours ouvrir → jeu → prénoms → jouer.

## 18. Dépendances
V2-VOICE-01 / 003 (pipeline fiable), V2-VOICE-03 / 074 (mesures), V2-VOICE-04 / 075 (port, commandes), V2-VOICE-10 / 006 (budget). Recommandées : V2-VOICE-09 / 080 (information avant écoute continue), V2-VOICE-06 / 077 (retour sonore). Suites : 081 (TV), 082 (accessibilité audio), V2-TRAIN-01 / 103.

## 19. Critères d'acceptation
- AC-01 — Option absente du setup ; présente dans les réglages du match ; désactivée par défaut.
- AC-02 — Mode A : 20 volées consécutives enregistrées sans contact en salle calme (terrain, tablette de référence).
- AC-03 — Terrain (spec 074) : ≥ 80 % de volées sans contact en mode partie sur ≥ 5 parties.
- AC-04 — Corpus négatif : ≤ 1 engagement erroné pour 200 volées.
- AC-05 — Hors parole, aucun octet audio n'est envoyé (test avec VAD factice et WebSocket espionné).
- AC-06 — Coût mesuré ≤ 0,02 $/match sur 5 parties de 501 à deux joueurs.
- AC-07 — Plafond par match atteint (simulé) → retour au mode annonce, message, keypad intact.
- AC-08 — Pause après 3 min sans parole ; Wake Lock acquis puis libéré.
- AC-09 — Pendant une annonce de la spec 077, aucune transcription n'est prise en compte.
- AC-10 — Mode C non activable tant que Q1 n'est pas tranchée (garde de configuration testée).

## 20. Scénarios de tests
Unitaires : contrôleur en mode continu, VAD factice, plafond. E2E simulé : 3 volées enchaînées sans clic. Terrain : salon, club calme, bar (matrice spec 042).

## 21. Exigences de non-régression
Mode annonce, keypad, robot, partie partagée, Triathlon, suite voix.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Faux engagements (conversations) | Score faux | Moyenne | Mode A par défaut, joueur actif seul, grammaire stricte, undo vocal |
| Dérive de coût | Gratuité menacée | Moyenne | VAD, plafonds par match et global (006), coupure |
| iOS : micro coupé, veille | Mode inutilisable | Élevée [à confirmer] | Wake Lock, détection, message |
| Auto-captation du caller | Faux transcripts | Moyenne | Semi-duplex (RM-06) |
| Bar trop bruyant | Rejets | Élevée | Recommander le mode annonce |

## 23. Décisions architecturales
ADR 0008 (port, état vocal éphémère). Décision PO requise sur l'invariant de 003 si le mode C est retenu (amendement de 003 tracé).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Mode de confirmation | A vocale explicite ; B tactile ; C temporisée (amende 003) | A par défaut ; C seulement après mesure (spec 074) et décision PO (H.6) | — |
| Q2 | Moteur de VAD | Silero (`@ricky0123/vad-web`, dépendance) ; VAD énergétique maison ; VAD du fournisseur | Silero après mesure CPU ; repli énergétique | — |
| Q3 | Budget | Plafond par match (10 min) + global (006) ; sans plafond | Plafonds obligatoires | — |
| Q4 | Persistance du choix | Par match ; mémorisé sur l'appareil | Mémorisé sur l'appareil, désactivé par défaut | — |
| Q5 | Bar | Mode partie autorisé ; déconseillé (message) | Autorisé, avec conseil d'utiliser le mode annonce | — |

## 25. Traçabilité
Rapport 04 (§6.2, §6.6, §6.9, §9) ; rapport 09 (INNO-01) ; compte rendu §C.1, §D.1, §E, §H.5, §H.6 ; specs 003, 006, 074, 075, 077, 080, 081, 082 ; ADR 0008.
