---
id: 077-counter-voice-caller
v2_id: V2-VOICE-06
titre: Caller « Bougnat » — annonces vocales en français
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Innovation produit
famille: voix
priorite: P1
difficulte: M
recommandation: recommande
lot: 3
poids: 38
depend_de: [V2-VOICE-04]
remplace: []
remplacee_par: []
issue: '#254'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 077 — Caller « Bougnat » — annonces vocales en français

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Innovation produit INNO-02 du rapport 09 (« Le Caller Bougnat », lot A annonces ; lot B moments forts) et rapport 04 §5.2/§6.4 (retour sonore, synthèse vocale). Compte rendu §E rang 1 (« Parle, Bougnat compte » = boucle vocale + caller), §C.1 et §H.14. Le caller est une **sortie** audio : il n'entre pas dans le périmètre « scoring vocal » de la spec 003.

## 2. Problématique
L'application est muette : aucune confirmation sonore, aucune ambiance « TV ». Le caller est un standard du marché (DartCounter, Autodarts, Scolia, My Dart Training, DartSociety en français [EXT 2026-11-20]) ; son absence se remarque, et elle empêche de jouer sans regarder l'écran. Le site vitrine promet déjà une « annonce vocale des scores » inexistante (rapport 09 D3).

## 3. Objectifs
- O1 — Annoncer en français le score de la volée, le reste, le bust, le joueur suivant et la victoire.
- O2 — Fermer la boucle du mode mains libres (spec 076) : le joueur entend ce qui a été engagé.
- O3 — Coût récurrent nul (synthèse du navigateur).
- O4 — Un **propriétaire audio unique** qui coordonne haut-parleur et micro.

## 4. État actuel vérifié dans le code
- [vérifié] Aucune sortie audio : recherche `speechSynthesis`, `new Audio`, `vibrate` : 0 occurrence dans `src/`, `views/`, `components/`.
- [vérifié] Retours uniquement visuels : `triggerFeedback` (`views/MatchView.tsx:268`) et libellés de `src/features/x01/scoring/matchFeedback.ts` (dont « Bust », « Turn » en anglais).
- [vérifié] L'`AudioContext` existant appartient à la capture vocale (`src/features/x01/voice/audioContextManager.ts`) et est créé au montage d'un match voix (`useDeepgramStreaming.ts:94-107`).
- [vérifié] Le résultat d'une soumission est connu dans `buildScoreSubmissionResult` (`src/features/x01/scoring/matchSubmission.ts:38-90` : `isBust`, `status === 'finished'`) — mais aucun événement neutre n'est exposé.
- [vérifié] CSP `default-src 'self'` (`public/_headers:2`) : des fichiers audio de même origine seraient autorisés.
- [EXT] `speechSynthesis` : Chrome 33+, Firefox 49+, Safari 7+ (BCD, consulté le 2026-11-20) ; qualité et disponibilité d'une voix `fr-FR` locale variables selon l'OS [à confirmer sur la matrice d'appareils].

## 5. Comportement cible
À l'engagement d'une volée, l'application publie un **événement de partie neutre** (volée enregistrée : points, reste, bust, joueur suivant ; manche/set/match gagnés). Le caller le traduit en phrase (« Soixante. Reste deux cent quarante et un. Léa, à toi. ») et la confie au **service audio unique**, qui gère la file, les priorités, l'interruption et coupe la prise en compte du micro pendant la lecture.

## 6. Périmètre
### Inclus
Lot A : score, reste, bust, joueur suivant, checkout réussi, manche/set/match ; réglages (activé, voix, volume, verbosité) ; service audio unique ; déblocage audio au geste. Lot B (option du même lot) : moments forts sonores (180, 140+, gros finish) sur le contrôleur.
### Exclu
Voix enregistrée « Bougnat » (Q3), annonces sur la TV (Q5, spec 081), autres jeux que X01 (après 079), accessibilité exhaustive (082).

## 7. User stories
- En tant que joueur, je veux entendre mon score et mon reste afin de ne pas regarder l'écran.
- En tant que groupe d'amis, je veux un « Cent quatre-vingts ! » pour l'ambiance.
- En tant que joueur gêné par le son, je veux couper le caller en un geste.

## 8. Règles métier
- RM-01 — Le caller ne calcule rien : il consomme des événements produits par le moteur (aucune règle de jeu dans l'audio).
- RM-02 — Une annonce n'est émise qu'après engagement (jamais pour une proposition vocale non confirmée).
- RM-03 — Une correction ou un undo annule l'annonce en cours et peut annoncer « Correction : reste N ».
- RM-04 — Le service audio est l'**unique** propriétaire du haut-parleur et de l'`AudioContext` : capture (076) et lecture s'y enregistrent ; pendant la lecture, les transcriptions sont ignorées.
- RM-05 — Les nombres sont prononcés en français (« quatre-vingt-dix-neuf ») par un formateur pur testé.

## 9. Parcours utilisateurs
1. Démarrage du match : l'option « Caller » (selon Q1) est visible dans les réglages du match ; le premier tap débloque l'audio.
2. Paul engage 60 → « Soixante. Reste deux cent quarante et un. Léa, à toi. »
3. Léa fait trop → « Trop ! Reste trente-deux. Paul, à toi. »
4. Paul finit → « Game shot, et la manche pour Paul ! »

## 10. Exigences fonctionnelles
- FR-01 — Événements neutres de partie X01 publiés par la couche application après chaque commande (spec 057) : `TurnRecorded {points, remaining, isBust, nextPlayer}`, `LegWon`, `SetWon`, `MatchWon`, `TurnUndone`.
- FR-02 — Formateur pur événement → texte français (nombres 0-1001, prénoms, gabarits par verbosité).
- FR-03 — `AudioOutputPort` (application) et `WebSpeechSynthesizer` (infrastructure) ; sélection d'une voix `fr-*`, de préférence locale (`localService`).
- FR-04 — Service audio unique : file avec priorités, interruption par l'événement plus récent, signal « lecture en cours » consommé par le contrôleur vocal.
- FR-05 — Réglages : activé/désactivé, verbosité (score seul ; score + reste ; complet), volume ; mémorisés sur l'appareil.
- FR-06 — Déblocage audio sur un geste utilisateur (politique d'autoplay) ; sans voix française disponible, l'option est désactivée avec explication.
- FR-07 — Lot B : sons courts de moments forts (180, 140+, checkout ≥ 100) générés ou fichiers de même origine, déclenchés par les mêmes événements (mutualisés avec la détection de temps forts de la spec 084 si disponible).
- FR-08 — Libellés « Bust »/« Turn » de `matchFeedback.ts` traduits pour cohérence avec les annonces.

## 11. Exigences non fonctionnelles
- NFR-01 Coût récurrent : 0 €. Option voix enregistrée : coût ponctuel (quelques centaines d'euros [hypothèse]) + contrat de cession de droits.
- NFR-02 Latence engagement → début d'annonce ≤ 300 ms [à mesurer].
- NFR-03 Confidentialité : préférer les voix locales ; certaines voix de navigateur sont distantes (prénoms envoyés au fournisseur de la voix) [à confirmer par OS] — signalé à la spec 080.
- NFR-04 Aucune nouvelle dépendance d'exécution pour le lot A.
- NFR-05 Respect de `prefers-reduced-motion` pour les effets visuels associés (spec 067) ; le son reste désactivable indépendamment.

## 12. Cas nominaux et alternatifs
Nominal : parcours 2-4. Alternatifs : verbosité minimale ; caller coupé ; robot adversaire (annonce de sa volée).

## 13. Cas limites
Volées engagées en rafale (file) ; undo pendant une annonce ; changement d'onglet ; casque Bluetooth (latence) ; prénoms étrangers mal prononcés ; voix système absente (Linux) ; iOS mode silencieux [à confirmer].

## 14. Gestion des erreurs
Échec de synthèse → silencieux, sans bloquer ; compteur d'échecs local ; aucune erreur visible répétitive.

## 15. Impacts architecturaux
Nouveau port de sortie audio et service audio unique (application), adaptateur navigateur (infrastructure). Les événements neutres sont émis par la couche application (spec 057) et réutilisables par la TV (084) et l'accessibilité (082). Le service audio absorbe la gestion de l'`AudioContext` aujourd'hui portée par la capture.

## 16. Impacts sur les données et les interfaces
Préférences locales (clé versionnée). Contrat interne d'événements de partie (versionné dans le code).

## 17. Compatibilité avec l'existant
Retours visuels inchangés ; caller optionnel ; parcours de base inchangé.

## 18. Dépendances
**V2-VOICE-04 / spec 075** (contrôleur et état vocal pour le semi-duplex) ; événements produits via **V2-ARCH-03 / spec 057**. Liens : 076 (boucle mains libres), 082 (accessibilité), 084/086 (temps forts TV), V2-DOC-01 / 034 (promesse du site vitrine à aligner tant que le caller n'est pas livré).

## 19. Critères d'acceptation
- AC-01 — Formateur : 0 à 180 et restes jusqu'à 1 001 corrects en français (tests table-driven).
- AC-02 — Engagement de 60 avec reste 241 → une seule annonce « Soixante. Reste deux cent quarante et un. » (synthétiseur factice).
- AC-03 — Bust → annonce « Trop ! » produite à partir de `isBust` du moteur.
- AC-04 — Undo pendant une annonce → annonce interrompue.
- AC-05 — Pendant la lecture, une transcription factice est ignorée par le contrôleur vocal.
- AC-06 — Sans voix `fr-*` (simulé), l'option est désactivée avec explication.
- AC-07 — Terrain : annonces audibles et intelligibles à 3 m sur la tablette de référence (Chrome Android, Safari iPadOS) [à confirmer].

## 20. Scénarios de tests
Unitaires : formateur, file du service audio. Composants : réglages. E2E : synthétiseur espionné (stub de `speechSynthesis`). Terrain : salon, club.

## 21. Exigences de non-régression
Retours visuels, keypad, voix en entrée, performances INP (spec 020 : annonce hors chemin d'interaction).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Qualité de voix variable selon l'OS | Image dégradée | Élevée | Choix de voix, verbosité, option voix enregistrée (Q3) |
| Auto-captation par le micro | Faux transcripts | Moyenne | Semi-duplex (RM-04) |
| Lassitude | Désactivation | Moyenne | Verbosité, interrupteur rapide |
| Droits sur une voix enregistrée | Juridique | Faible | Contrat de cession |

## 23. Décisions architecturales
ADR 0008 (état vocal éphémère, coordination) ; ADR 0002 (événements issus des commandes). Décision à prendre : service audio unique (proposition de cette spec).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Activé par défaut | Oui ; non | Non par défaut, proposé à l'activation de la voix ou du mode mains libres (H.14) | — |
| Q2 | Ton « Bougnat » humoristique | Sobre seul ; sobre + Bougnat | Sobre par défaut, variante Bougnat en option | — |
| Q3 | Voix enregistrée | Synthèse seule ; clips enregistrés | Synthèse en V2 ; clips étudiés après retours | — |
| Q4 | Prénoms prononcés | Oui ; non (« joueur suivant ») | Oui, avec voix locale de préférence | — |
| Q5 | Annonce sur la TV | Contrôleur seul ; TV ; au choix | Contrôleur seul en V2 (une seule source sonore) | — |

## 25. Traçabilité
Rapport 09 (INNO-02, D3, §10.4) ; rapport 04 (§5.2, §6.4) ; compte rendu §C.1, §E, §H.13, §H.14 ; specs 034, 057, 075, 076, 081, 082, 084 ; ADR 0002, 0008.
