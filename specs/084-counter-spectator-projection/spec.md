---
id: 084-counter-spectator-projection
v2_id: V2-TV-02
titre: Projection spectateur versionnée
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: tv
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

# 084 — Projection spectateur versionnée

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Le mode TV (mission §5.6) exige que l'écran de diffusion affiche l'état de la partie **sans dupliquer les règles de jeu**. Les rapports `07-tv-mode.md` (§5.2-5.3) et `02-architecture.md` (§6.1, §8.3) recommandent une **projection spectateur** pure, calculée sur l'appareil de contrôle, envoyée en **snapshot complet versionné**. Cette spec définit ce contrat et la projection X01 ; elle est le socle commun de la TV locale (085), de l'interface TV X01 (086), du relais (087), des autres jeux (089), de l'état vocal sur la TV (081, V2-VOICE-11), du thème TV (098, V2-BRAND-06) et du cadrage BDT (109, V2-INT-07). Elle est décrite par l'ADR 0005 « Projection spectateur et transport ».

## 2. Problématique

Aucun contrat d'affichage indépendant de l'état interne n'existe. Diffuser `MatchState` brut figerait l'état interne comme contrat public, imposerait des règles côté TV (checkout, bust) et déclencherait une émission par seconde à cause du chrono.

## 3. Objectifs

- Un contrat `SpectatorSnapshot` v1 unique pour tous les transports (local, relais, futurs).
- Une projection X01 pure, testée sans DOM, réutilisant les view-models existants.
- Zéro règle de jeu dans l'écran de diffusion ; zéro émission due au seul chrono.
- Un snapshot X01 ≤ 12 288 octets sérialisé (cible 1 à 3 Ko).

## 4. État actuel vérifié dans le code

- [vérifié] `MatchState` est un objet JSON simple (`types.ts:43-55`) ; `Player.name` est stocké en clair (`types.ts:6-12`).
- [vérifié] Le snapshot `{ match, hasGameStarted, elapsedSeconds }` remonte au shell à chaque changement (`views/MatchView.tsx:211-217` → `App.tsx:360`).
- [vérifié] `elapsedSeconds` augmente chaque seconde (`src/features/x01/hooks/useMatchTimer.ts:27-32`) : le snapshot remonté change chaque seconde, la persistance réécrit chaque seconde (`App.tsx:170-199`, debounce 300 ms `src/app/appShell.ts:130-149`).
- [vérifié] **Moteur non immuable** : `submitTurn` copie superficiellement l'état (`src/application/scoring/matchLifecycle.ts:275-282`) puis `finishLeg` mute `legsWon`/`setsWon` partagés avec l'état précédent (`matchLifecycle.ts:215-231`) ; l'UI l'appelle sur l'état vivant (`src/features/x01/scoring/matchSubmission.ts:63,96`). Comparer l'ancien et le nouvel état peut donc **masquer** un leg gagné.
- [vérifié] View-models purs réutilisables : `buildPlayerScoreViewModel` (`src/features/x01/scoring/matchPlayerScore.ts:20-60`, qui accepte un aperçu de saisie `remainingPreview` à ne jamais diffuser), `getMatchFormatText`, `getWinnerDisplayName` (`matchPresentation.ts:3,36`), `isCheckoutPossible` (`checkoutEligibility.ts:5`), `calculateDetailedStatsForTeam` (`src/application/scoring/matchStats.ts:330`).
- [vérifié] `CHECKOUT_GUIDE` est une table « Double Out » (`constants.ts:1-3`) affichée quelle que soit la règle (`components/game/CheckoutHint.tsx:9`).
- [vérifié] Abstractions mortes : `useSharedX01Session` (`src/features/x01/session/useSharedX01Session.ts:11-21`), `SyncRepository` (`src/application/scoring/ports.ts:9-10`).
- [vérifié] La transition de leg est calculée dans la vue (`views/MatchView.tsx:438-452`).

## 5. Comportement cible

Après chaque changement **métier** (volée validée, annulation, fin de leg, fin de match, pause), le contrôleur calcule une projection spectateur pure à partir de l'état engagé, la compare à la dernière projection publiée (copie sérialisée, jamais une référence à l'état vivant), en déduit les temps forts, puis remet une enveloppe numérotée au port de transport. Le chrono voyage dans chaque snapshot comme une donnée (`elapsedSecondsAtSend`, `running`) et l'écran l'incrémente localement.

## 6. Périmètre

### Inclus
- Types du contrat (enveloppe, vue X01 schéma 1, temps forts, fin de diffusion) et validateur d'enveloppe partagé (importable par un Worker).
- Projection X01 pure, minimisation des prénoms, déduction des temps forts et de la cause.
- Port `SpectatorPublisher` et adaptateur nul (`Noop`) ; hook de shell branché sur `matchRuntime`.
- Retrait de `useSharedX01Session` et `SyncRepository` (s'ils n'ont pas déjà été retirés par V2-ARCH-01, 056).

### Exclu
- Transports (085 local, 087 relais), UI TV (086), projections des autres jeux (089), contenu du message `branding` et profil d'asset TV (098), état vocal (081).
- Journal d'événements (V2-ARCH-05, 059) : compatible mais non requis.

## 7. User stories

- En tant que joueur, je veux que l'écran TV montre exactement le score validé sur la tablette, y compris après une annulation.
- En tant que mainteneur, je veux un contrat versionné testable sans navigateur, afin de faire évoluer l'UI interne sans casser les écrans.
- En tant que gérant de bar, je veux que seuls des prénoms raccourcis ou des initiales quittent la tablette.

## 8. Règles métier

- RM-01 Le contrôleur est l'unique source de vérité et l'unique émetteur ; l'écran ne calcule aucune règle (bust, checkout, fin de leg).
- RM-02 Un snapshot est complet : sa réception répétée est sans effet.
- RM-03 `seq` est strictement croissant dans une génération ; une génération plus récente remplace intégralement l'état affiché ; un message d'une génération plus ancienne est ignoré.
- RM-04 Le chrono et l'heure ne déclenchent jamais d'émission.
- RM-05 Un aperçu de saisie non validée (`remainingPreview`) n'est jamais projeté.
- RM-06 La suggestion de checkout n'est projetée que si `checkOut === 'Double'` et `isCheckoutPossible` (jusqu'à la spec 045, V2-GAMES-01).
- RM-07 La minimisation des prénoms est appliquée par la projection, avant tout envoi.

## 9. Parcours utilisateurs

Aucun parcours visible : la projection est invisible tant qu'aucun transport n'est actif (085, 087). Parcours de base inchangé.

## 10. Exigences fonctionnelles

- FR-01 Définir l'enveloppe `SpectatorSnapshot` v1 : `t: 'snapshot'`, `v: 1`, `sessionId` (aléa 128 bits, distinct de l'id de match), `generation` (entier, attribué par le transport), `seq`, `sentAt`, `cause` (`turn | undo | correction | leg | match_end | pause | resume | sync | settings`), `view`, `highlights[]`, `clock { running, elapsedSecondsAtSend }`, `brandingHash?` (référence au message `branding` séparé, envoyé rarement, ≤ 12 Ko grâce au profil d'asset TV borné défini par 098, V2-BRAND-06 ; jamais de logo dans un snapshot).
- FR-02 Définir le message `{ t: 'end', reason: 'stopped' | 'expired' | 'match_closed' }`.
- FR-03 Définir la vue X01 schéma 1 (`kind: 'x01'`, `schema: 1`) : format (score de départ, règle de sortie, mode, legs/sets à gagner, libellé), statut (`waiting_start | active | finished`), numéro de leg et de set, équipes (nom affiché, membres en doublette, actif, lanceur du match, restant, legs, sets, moyenne match, moyenne leg, fléchettes du leg, 3 dernières volées avec `isBust`, bot et niveau), lanceur actif, suggestion de checkout ou `null`, vainqueur et statistiques clés en fin de match.
- FR-04 `projectX01SpectatorView(runtime, options)` est pure, sans import React/DOM, et réutilise `buildPlayerScoreViewModel` (avec `remainingPreview = null`), `getMatchFormatText`, `getWinnerDisplayName`, `isCheckoutPossible`, `calculateDetailedStatsForTeam`.
- FR-05 Option `nameDisplay: 'full' | 'short' | 'initials'` : `short` tronque à 12 caractères, `initials` produit « A. » ; appliquée à tous les noms de la vue. La valeur par défaut est une question ouverte (§24).
- FR-06 `deriveHighlights(previousProjection, nextProjection, cause)` pure : `180`, `ton_forty` (≥ 140), `ton_plus` (≥ 100), `bust`, `checkout` (valeur), `leg_won`, `set_won`, `match_won` ; identifiant `generation:seq:index` ; aucun temps fort pour `undo`, `correction`, `sync`.
- FR-07 `inferCause(previousProjection, nextProjection)` déduit la cause sans modifier `MatchView` (nombre de volées, legs, statut).
- FR-08 L'émission n'a lieu que si l'**empreinte métier** de la projection (projection hors `clock`) change, ou sur demande `sync`.
- FR-09 Coalescence : délai de 150 ms après le commit, au plus 2 émissions par seconde, hors du chemin d'interaction (spec 020).
- FR-10 Port `SpectatorPublisher { publish(envelope), end(reason), status }` dans la couche application ; adaptateur `Noop` par défaut ; aucun import du port depuis `domain`.
- FR-11 Validateur d'enveloppe partagé `validateSpectatorEnvelope` (type, version, taille, monotonicité) utilisable côté navigateur et Worker, sans dépendance.
- FR-12 Retirer `useSharedX01Session` et `SyncRepository` ou les remplacer explicitement par le port.

## 11. Exigences non fonctionnelles

- NFR-01 Taille : snapshot ≤ 12 288 octets UTF-8 (marge sous les 16 384 octets d'un attachement WebSocket du relais) ; test sur partie 4 joueurs, 2 sets de 5 legs, noms de 32 caractères.
- NFR-02 Performance : projection + empreinte < 2 ms sur tablette milieu de gamme [à confirmer par mesure] ; aucune régression INP (spec 020, V2-PERF-01 044).
- NFR-03 Confidentialité : aucun champ hors de l'affichage (pas d'id joueur interne, pas de configuration partenaire, pas de jeton).
- NFR-04 Compatibilité : contrat additif ; un écran ignore les champs inconnus et les types de message inconnus (par exemple `voice` de 081 ou `branding` de 098 sur un écran ancien) ; schéma non supporté → écran « Mettez à jour cet écran ».
- NFR-05 Couverture : modules purs couverts à 100 % des branches (spec 029).

## 12. Cas nominaux et alternatifs

- Volée validée → `cause: turn`, temps fort éventuel.
- Annulation → `cause: undo`, état corrigé, aucun temps fort.
- Leg gagné → `cause: leg`, `leg_won` (+ `set_won`).
- Victoire → `cause: match_end`, `match_won`, statistiques.
- Écran (re)connecté → le transport renvoie le dernier snapshot (`cause` inchangée, aucune animation rejouée car identifiants déjà vus ou snapshot `sync`).

## 13. Cas limites

- Leg gagné alors que l'état précédent a été muté (`finishLeg`) : le temps fort est quand même produit car la comparaison porte sur la projection publiée précédente.
- Annulation traversant une fin de leg : `inferCause` donne `undo`, pas `leg`.
- Doublette : nom affiché = lanceur courant de l'équipe, membres listés.
- Bot : niveau affiché, pas de règle.
- Noms vides ou identiques : repli « Joueur 1 », « Joueur 2 ».
- Snapshot dépassant la taille : la projection retire d'abord l'historique des volées, puis les statistiques détaillées.

## 14. Gestion des erreurs

Toute exception de projection ou de publication est capturée, journalisée au niveau `warn` sans prénoms, et n'interrompt jamais la saisie ; l'état de diffusion passe à « dégradé ».

## 15. Impacts architecturaux

- `src/shared/broadcast/` : types et validateur (aucune dépendance applicative).
- `src/features/x01/broadcast/` : projection, empreinte, temps forts, cause (pure).
- `src/application/broadcast/ports.ts` : port `SpectatorPublisher`.
- `src/app/useSpectatorBroadcast.ts` : composition dans le shell, sans toucher `MatchView`.
- Direction : `app → features → application/shared` ; la TV n'importe que `shared/broadcast` et ses composants.

## 16. Impacts sur les données et les interfaces

Nouveau contrat public interne `SpectatorSnapshot` v1, documenté (statut « expérimental » jusqu'à validation de 086). Aucune donnée persistée nouvelle (les sessions de diffusion relèvent de 085/087).

## 17. Compatibilité avec l'existant

`MatchView` et le schéma de session persistée sont inchangés. Le contrat partenaire `v=1` (spec 030) n'est pas touché.

## 18. Dépendances

- V2-ARCH-03 (057) : règles X01 uniques (le moteur qualifie le bust) — évite que la projection réplique une règle.
- Recommandé : V2-QA-01 (039) pour les fixtures ; compatible V2-ARCH-05 (059) sans en dépendre.
- Consommée par : 085, 086, 087, 089, 081, 098, 109.

## 19. Critères d'acceptation

- AC-01 Partie X01 501 à 2 joueurs, volée de 180 validée → une enveloppe `cause: turn` avec un temps fort `180` ; aucune autre émission dans les 5 s suivantes (test unitaire avec horloge simulée).
- AC-02 Partie active, 60 s sans saisie → 0 émission (le chrono ne déclenche rien).
- AC-03 Annulation de la dernière volée → `cause: undo`, `highlights: []`, restant restauré.
- AC-04 Fin de leg via `submitTurn` réel (avec mutation de `legsWon`) → `leg_won` présent.
- AC-05 Règle de sortie `Open`, restant 40 → `checkoutHint: null`.
- AC-06 `nameDisplay: 'initials'`, joueurs « Alice », « Bob » → aucune occurrence de « Alice » ou « Bob » dans le JSON sérialisé.
- AC-07 Partie 4 joueurs, 2 sets de 5 legs, noms de 32 caractères → snapshot ≤ 12 288 octets.
- AC-08 Enveloppe de génération inférieure ou de `seq` déjà vu → rejetée par `validateSpectatorEnvelope`/l'état de réception.
- AC-09 `rg "useSharedX01Session|SyncRepository" src views` → aucun résultat (ou remplacement explicite par le port).

## 20. Scénarios de tests

- Unitaires (Vitest) : projection X01 (simple, doublette, bot, sets), empreinte, `deriveHighlights` sur fixtures `submitTurn` réelles, `inferCause`, minimisation, taille, validateur.
- Composant : hook de shell avec publisher factice (coalescence, aucune émission au tic).
- Non requis ici : E2E (portés par 085/086).

## 21. Exigences de non-régression

Tests X01 existants verts ; persistance de session inchangée ; aucune nouvelle dépendance npm.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Contrat figé trop tôt | Moyen | Moyenne | Statut expérimental, champs additifs, `schema` par jeu |
| Mutation du moteur faussant les diffs | Élevé | Haute (avéré) | Diff sur projection sérialisée, test AC-04 |
| Fuite de prénoms | Moyen | Faible | Minimisation dans la projection, AC-06 |
| Émission au chrono | Élevé (coût relais ×4) | Haute sans garde | Empreinte métier, AC-02 |

## 23. Décisions architecturales

ADR 0005 « Projection spectateur et transport » (snapshot complet, mono-écrivain, port à adaptateurs). Lien ADR proposé « L'état d'une partie n'appartient pas aux vues » (V2-ARCH-04, 058).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Valeur par défaut de `nameDisplay` (H.18) | `full` / `short` / `initials` | `short` (12 caractères) ; `initials` proposé pour les liens publics | — |
| 2 | Emplacement de la projection X01 | `features/x01/broadcast` / `application/x01/projection` | `features/x01/broadcast` tant que V2-ARCH-04 n'a pas fixé l'arborescence | — |
| 3 | Contrat public (partenaires, BDT) ou interne | Interne expérimental / public versionné | Interne expérimental en V2, revu avec 109 | — |
| 4 | Notion de pause (H.19) | Ajouter `pause` côté contrôleur / non | Réserver `cause: pause` dans le contrat, décision produit séparée | — |

## 25. Traçabilité

- Rapports : `07-tv-mode.md` §2.1, §5.2-5.3, §6.3 ; `02-architecture.md` §6.1, §8.3 ; compte rendu C.6, H.18, H.19.
- Revue croisée : moteur X01 non immuable (`finishLeg`) ; chrono = 1 émission/s (≈ 385 000 req/j contre ≈ 97 000).
- Specs : 083, 085, 086, 087, 089, 057, 059, 081, 098, 109, 020, 029.
