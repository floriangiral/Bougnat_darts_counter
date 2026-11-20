---
id: 081-counter-voice-state-on-tv
v2_id: V2-VOICE-11
titre: Voix — état vocal affiché sur la TV
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: voix
priorite: P2
difficulte: S
recommandation: optionnel
lot: 3
poids: 30
depend_de: [V2-TV-02, V2-VOICE-05]
remplace: []
remplacee_par: []
issue: '#261'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 081 — Voix — état vocal affiché sur la TV

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 (mission §5.1, dernier paragraphe « voix + TV »), rapport 07 §6.3 (« Voix + TV ») et proposition V2-TV-12, rapport 04 §6.6 parcours 4 et §8 V2-VOICE-11, compte rendu §F.4. La TV affiche une **projection spectateur** calculée sur le contrôleur (spec 084, ADR 0005) ; la voix vit sur le contrôleur (ADR 0008 : « état vocal éphémère séparé du score engagé, diffusable sur la TV »).

## 2. Problématique
En partie mains libres avec une TV, les joueurs regardent la TV, pas la tablette : ils ne voient ni que le micro écoute, ni ce qui a été compris, ni si la proposition attend une confirmation.

## 3. Objectifs
- O1 — Afficher sur la TV l'état vocal (écoute, proposition en attente, confirmée, annulée) **visuellement distinct** du score engagé.
- O2 — Ne jamais présenter une proposition comme un score officiel.
- O3 — Coût nul sur la TV locale ; impact négligeable sur le relais.

## 4. État actuel vérifié dans le code
- [vérifié] Aucune diffusion n'existe : `src/features/x01/session/useSharedX01Session.ts` est un no-op (`src/features/x01/session/useSharedX01Session.ts:11-20`, ADR 0005).
- [vérifié] La proposition vocale pré-remplit le champ et attend une validation (`views/MatchView.tsx:202-207`, `:377-386`) ; l'état vocal (`voiceStreamingState`, `voiceProposal`) est local à `MatchView` (`:124`, `:178-189`).
- [vérifié] Le snapshot X01 est remonté au shell (`App.tsx:353-361`, `onStateChange`), mais pas l'état vocal.
- [vérifié] La spec 086 réserve une zone désactivée par défaut pour l'état vocal (`specs/086-counter-tv-x01-screen/spec.md`, FR-11) ; la spec 085 exclut tout chunk voix de la page TV (FR-05).

## 5. Comportement cible
Le contrôleur publie, en plus des snapshots de partie, un **état vocal éphémère** minimal : `listening`, `proposing {score, joueur}`, `committed`, `cancelled`, `idle`. La TV affiche un pictogramme micro, puis « 60 ? » dans un cartouche distinct (pointillés, couleur neutre), puis l'efface au snapshot de partie suivant (le score engagé apparaît alors dans le tableau, avec son éventuel temps fort). Aucune transcription brute n'est diffusée.

## 6. Périmètre
### Inclus
Contrat de message vocal éphémère, publication par le contrôleur, rendu dans la zone réservée de la spec 086, réglage d'activation.
### Exclu
Micro côté TV (jamais) ; annonces sonores sur la TV (spec 077, Q5) ; autres jeux que X01 (après 079 et 089).

## 7. User stories
- En tant que joueur en mode mains libres, je veux voir sur la TV que mon annonce « 60 » a été comprise avant de dire « valide ».
- En tant que spectateur, je veux distinguer une proposition d'un score officiel.

## 8. Règles métier
- RM-01 — L'état vocal n'altère jamais le score affiché : il est rendu hors du tableau de score.
- RM-02 — Seul le score proposé (nombre) et le joueur sont diffusés ; **jamais la transcription** (elle peut contenir une conversation).
- RM-03 — L'état vocal expire : effacé au snapshot de partie suivant, à l'annulation ou après 10 s sans mise à jour.
- RM-04 — Un état vocal d'une génération ou d'une séquence antérieure est ignoré (même règles d'ordre que la spec 084).
- RM-05 — La TV ne contient ni micro ni règle : elle affiche ce que le contrôleur envoie.

## 9. Parcours utilisateurs
1. Paul parle → TV : pictogramme micro animé (« Écoute… »).
2. Proposition → TV : cartouche « Paul : 60 ? ».
3. « valide » → snapshot de partie → cartouche effacé, reste mis à jour, temps fort éventuel.
4. « non » → cartouche barré 1 s puis effacé.

## 10. Exigences fonctionnelles
- FR-01 — Message éphémère `voice` versionné, distinct du snapshot de partie, sur le même transport (BroadcastChannel local, relais si livré) : `{ t: 'voice', v: 1, sessionId, generation, seq, state, playerId?, proposedScore? }` (format exact aligné sur la spec 084, Q1).
- FR-02 — Le contrôleur publie l'état vocal exposé par le contrôleur de la spec 075, avec coalescence (≤ 2 messages/s).
- FR-03 — Le relais (si livré) ne conserve pas le message vocal comme « dernier état » rejoué à la connexion.
- FR-04 — La TV rend l'état dans la zone réservée de la spec 086, avec style distinct (pointillés, pas de couleur de joueur pleine, libellé « proposé »).
- FR-05 — Réglage « Afficher la voix sur la TV » côté contrôleur, activé par défaut quand le mode mains libres et une TV sont actifs (Q2).
- FR-06 — Une TV de version antérieure ignore les messages `voice` sans erreur (tolérance de version).

## 11. Exigences non fonctionnelles
- NFR-01 Latence contrôleur → TV ≤ 300 ms en local [à mesurer].
- NFR-02 Coût : 0 € en local ; sur le relais, quelques messages par volée, dans le plafond de débit de la spec 087.
- NFR-03 Lisibilité à 3-5 m (spec 086) ; animation respectant `prefers-reduced-motion` (spec 067).
- NFR-04 Confidentialité : aucune transcription, prénom selon la minimisation de la spec 084.

## 12. Cas nominaux et alternatifs
Nominal : parcours 1-3. Alternatifs : annulation (4) ; mode annonce (tap micro) avec TV.

## 13. Cas limites
TV reconnectée pendant une proposition (rien affiché jusqu'au prochain message) ; deux propositions successives ; undo d'une volée engagée ; réglage désactivé en cours de partie.

## 14. Gestion des erreurs
Message mal formé → ignoré ; transport indisponible → aucune incidence sur la saisie (invariant de diffusion).

## 15. Impacts architecturaux
Contrôleur : publication de l'état vocal par le port de transport de l'ADR 0005 ; TV : composant d'affichage sans dépendance voix. Aucune règle de jeu ni moteur vocal côté TV.

## 16. Impacts sur les données et les interfaces
Nouveau type de message versionné ; aucune persistance.

## 17. Compatibilité avec l'existant
Sans TV, aucun changement. Snapshots de partie inchangés.

## 18. Dépendances
**V2-TV-02 / spec 084** (contrat et transport) et **V2-VOICE-05 / spec 076** (mode mains libres) ; utilise l'état vocal de **V2-VOICE-04 / spec 075**. Liens : 085 (TV locale), 086 (zone réservée), 087 (relais).

## 19. Critères d'acceptation
- AC-01 — En TV locale (spec 085), une proposition « 60 » apparaît sur la TV dans le cartouche distinct ≤ 300 ms après son affichage sur le contrôleur.
- AC-02 — Le tableau de score de la TV ne change qu'au snapshot de partie (test de rendu).
- AC-03 — Aucun message `voice` ne contient de texte de transcription (test de contrat).
- AC-04 — Le cartouche disparaît au snapshot suivant, à l'annulation, ou après 10 s.
- AC-05 — Un message `voice` d'une génération antérieure est ignoré.
- AC-06 — Une TV qui ne connaît pas `voice` continue d'afficher la partie sans erreur.

## 20. Scénarios de tests
Unitaires (contrat, expiration, ordre), composants TV (cartouche), E2E (fenêtre secondaire locale + faux moteur vocal), terrain (lisibilité à 4 m).

## 21. Exigences de non-régression
Projection, transport et UI TV de 084-086 ; voix sur le contrôleur.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Confusion proposition / score | Perte de confiance | Moyenne | Style distinct, libellé « proposé », RM-01 |
| Fuite de conversation | Vie privée | Faible | RM-02 |
| Bruit de messages sur le relais | Coût, débit | Faible | Coalescence, non rejoué |

## 23. Décisions architecturales
ADR 0005 (projection et transport), ADR 0008 (état vocal éphémère).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Forme du message | Message `voice` séparé ; champ éphémère dans le snapshot | Message séparé, non rejoué (le snapshot reste la vérité de partie) | — |
| Q2 | Activation | Par défaut en mains libres ; opt-in | Par défaut en mains libres avec TV | — |
| Q3 | Mode annonce (tap) | Diffusé aussi ; mains libres seulement | Diffusé aussi (même état) | — |

## 25. Traçabilité
Rapport 07 (§6.3, V2-TV-12, §9.10) ; rapport 04 (§6.6) ; compte rendu §F.4, §F.5 ; specs 075, 076, 084, 085, 086, 087 ; ADR 0005, 0008.
