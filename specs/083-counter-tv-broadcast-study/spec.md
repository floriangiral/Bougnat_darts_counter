---
id: 083-counter-tv-broadcast-study
v2_id: V2-TV-01
titre: Étude et ADR — diffusion TV et frontière serveur
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: tv
priorite: P0
difficulte: M
recommandation: etude
lot: 1
poids: 40
depend_de: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 083 — Étude : diffusion TV et frontière serveur

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
>
> Une étude ne crée aucune exigence. Elle produit une recommandation, l'ADR 0005 « Projection spectateur et transport » et, si elle est retenue, débloque les specs fonctionnelles 087 (V2-TV-05), 088 (V2-TV-07) et 090 (V2-TV-11).

## 1. Contexte et origine

La mission V2 (§5.6) demande un mode TV : un appareil de contrôle (tablette, téléphone, ordinateur) et un écran de diffusion indépendant, sans clavier, lisible à distance. Le rapport d'audit `reports/07-tv-mode.md` et le compte rendu consolidé (C.6, D.2, H.4, H.18, H.22) concluent :

- la **TV locale** (fenêtre secondaire sur le même appareil, `BroadcastChannel`) fonctionne sans serveur, hors ligne, à 0 € ; elle **ne dépend pas** de la présente étude (spec 085, V2-TV-04) ;
- un **écran distant** (navigateur de Smart TV, mini-PC, clé Fire TV, téléphones de spectateurs) exige un **relais réseau**, ce qui touche la frontière « pas de backend métier » du projet.

Cette étude instruit la décision du product owner sur ce relais et fige l'architecture commune de diffusion dans l'ADR 0005.

## 2. Questions à trancher

- **Q1 — Frontière.** Un relais de transport optionnel, sans règle de jeu, sans stockage durable, sans compte, désactivable, est-il compatible avec la frontière open source ? Faut-il amender `CONTRIBUTING.md`, `docs/product-scope.md` et `docs/architecture.md` ?
- **Q2 — Hébergement.** Worker Cloudflare séparé portant un Durable Object consommé par le projet Pages, ou migration du projet Pages vers Workers + static assets ?
- **Q3 — Budget.** Plan Workers Free (coupure jusqu'à 00:00 UTC en cas de dépassement) ou Workers Paid plafonné ?
- **Q4 — Autorité en tournoi.** En contexte Bougnat_Darts_Tournaments (BDT), l'affichage du compteur reste-t-il « provisoire », BDT faisant foi ?
- **Q5 — Mono-écrivain.** Comment garantir un seul émetteur par session (deux onglets restaurés, rechargement) ?
- **Q6 — Dernier état.** Où conserver le dernier snapshot côté relais sans stockage durable, sachant que les attachements WebSocket disparaissent avec la socket ?
- **Q7 — Confidentialité.** Prénoms complets, tronqués ou initiales, minimisés **avant** envoi ?
- **Q8 — Baseline TV.** Quelles générations de TV supporter (décision portée par la spec 018, V2-DS-00) ?

## 3. État actuel vérifié dans le code

- [vérifié] Aucune brique de diffusion : `useSharedX01Session` est un bouchon (`src/features/x01/session/useSharedX01Session.ts:11-21`) et `SyncRepository` un type vide (`src/application/scoring/ports.ts:9-10`). Aucun usage de `BroadcastChannel`, `navigator.presentation` ni Wake Lock dans `src`, `views`, `components`.
- [vérifié] L'état X01 est un objet JSON (`types.ts:43-55`) remonté au shell à chaque changement (`views/MatchView.tsx:211-217` → `App.tsx:360`).
- [vérifié] Le moteur X01 **n'est pas immuable** : `submitTurn` fait une copie superficielle (`src/application/scoring/matchLifecycle.ts:275-282`) puis `finishLeg` mute `legsWon`/`setsWon` partagés avec l'état précédent (`matchLifecycle.ts:215-221`). L'UI appelle `submitTurn` sur l'état vivant (`src/features/x01/scoring/matchSubmission.ts:63,96`).
- [vérifié] Le chrono incrémente `elapsedSeconds` chaque seconde (`src/features/x01/hooks/useMatchTimer.ts:27-32`), qui fait partie du snapshot remonté (`views/MatchView.tsx:212-217`) : sans précaution, une diffusion « à chaque changement » émettrait une fois par seconde.
- [vérifié] Les autres jeux gardent leur état dans la vue et ne le remontent pas (`App.tsx:365-422`) : prérequis V2-ARCH-04 (058).
- [vérifié] Le projet est un projet **Pages** sans binding (`wrangler.jsonc`) ; une seule Function, `functions/api/deepgram/token.ts`, avec limitation de débit en mémoire par isolat (`token.ts:15-17`) ; routes Functions limitées à `/api/*` (`public/_routes.json`).
- [vérifié] CSP : `connect-src 'self' https://api.deepgram.com wss://api.deepgram.com https://cloudflareinsights.com` (`public/_headers:2`).
- [vérifié] Frontière : « ne pas reintroduire de dependance runtime a un backend metier » (`CONTRIBUTING.md:9`) ; la spec 030 a refusé une Function de signature (`specs/030-counter-external-match-link/spec.md:114`) ; `docs/architecture.md:165`. Le texte vise un backend **métier** et n'interdit pas explicitement un relais de transport : la décision relève d'un ADR.
- [vérifié] La constitution transverse range « supervision/live » côté backend Tournois et interdit de faire reposer le scoring critique sur la synchronisation libre d'un document mutable (`../.specify-workspace/constitution.transverse.md:32,59`).

## 4. Contraintes

- Gratuité, sans publicité, **sans compte** ; parcours de base inchangé (ouvrir → jeu → prénoms → jouer) : la diffusion n'ajoute aucune étape obligatoire.
- Clean Architecture : aucune règle de jeu dans le relais ni dans l'écran TV ; le contrôleur est l'unique source de vérité.
- Saisie jamais bloquée par la diffusion (envoi « fire-and-forget »).
- Coût récurrent nul en local ; coût du relais chiffré, plafonné et désactivable.
- Compatibilité des navigateurs TV : Samsung Tizen 2022 = Chromium 85, LG webOS 2022 = Chromium 87 ; Tailwind 4 vise Chrome 111+ [EXT, consulté le 2026-11-20].

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Local seul | `BroadcastChannel` + recopie native en repli | 0 €, hors ligne, aucune frontière touchée | Même navigateur et même appareil seulement ; pas de Smart TV autonome | 0 € | Faible |
| B. Relais Cloudflare Worker + DO (hibernation) | Worker séparé `bougnat-darts-broadcast`, classe DO par session, Pages consomme le DO par binding | Hébergeur déjà utilisé, aucun SDK, même origine possible, pas de compte | Service serveur à exploiter, quota Free serré | 0 € (Free) ou ~5,3 $/mois (Paid nominal), ~21,85 $/mois à ×10 | Moyenne |
| C. Migration Pages → Workers + assets | Un seul déploiement portant l'app et le DO | Un seul projet | Refonte du déploiement, CI, `wrangler:check` | Idem B | Élevée |
| D. SaaS temps réel (Ably, Pusher, Supabase, Firebase) | Canal hébergé | Peu de code serveur | Nouveau sous-traitant, SDK, CSP élargie | 29 à 99 $/mois et plus | Moyenne |
| E. WebRTC P2P | DataChannel + signalisation | Latence | Signalisation et TURN = serveur quand même | TURN au-delà du quota | Élevée |
| F. PartyKit hébergé | — | — | Plateforme fermée le 23/10/2026 [EXT] | — | — |

## 6. Critères d'évaluation et analyse

**Charge et coût (scénario de la mission : 1 000 parties/j × 2 h, 1 contrôleur + 1 TV).** Sources : tarifs Durable Objects et Workers (developers.cloudflare.com, consultés le 2026-11-20) [confirmé] ; hypothèses de charge [envisageable, à mesurer en PoC].

| Émission | Requêtes DO facturées/j | Plan Free (100 000 req/j) | Plan Paid |
|---|---|---|---|
| À chaque tic du chrono (1 msg/s) | ≈ 385 000 | **Hors quota** | Exclu par conception |
| 1 msg / 5 s (hypothèse de la mission) | ≈ 97 000 | À la limite (3 % de marge) | ≈ 5,3 $/mois |
| Au changement métier (≈ 1 msg par volée) | ≈ 45 000 | OK (≈ 55 % de marge) | ≈ 5 $/mois |
| ×10 (10 000 parties/j, 1 msg/5 s) | ≈ 970 000 | Hors quota | ≈ 21,85 $/mois (chiffre corrigé en revue croisée) |

Conclusions [vérifié en revue croisée] : le chrono ne doit **jamais** déclencher d'émission (il est dérivé côté affichage) ; sans hibernation, le coût passerait à ≈ 340 $/mois : hibernation et absence de minuterie dans le DO sont des exigences.

**Points d'architecture DO** [confirmé, documentation Cloudflare] :
- un projet Pages ne peut pas **héberger** de classe DO mais peut en **consommer** une, hébergée par un Worker séparé, via un binding ;
- `serializeAttachment` conserve au plus **16 384 octets par WebSocket** à travers l'hibernation, mais l'attachement **disparaît à la fermeture de la socket** : si l'émetteur se déconnecte, le dernier snapshot rangé dans son attachement est perdu ;
- une mise à jour du Worker déconnecte les WebSockets : reconnexion automatique obligatoire.

**Mono-écrivain.** Le relais attribue une **génération** croissante à chaque connexion émettrice authentifiée ; il ferme la socket de génération inférieure (« diffusion reprise ailleurs ») et rejette tout message d'une génération ancienne. En local, l'équivalent est porté par la spec 085.

## 7. Recommandation (non validée)

1. Livrer d'abord la **TV locale** (085) et l'**interface X01** (086) sur la projection (084), **sans attendre** cette décision.
2. Autoriser par ADR un **relais de transport optionnel** (option B) : payload opaque, enveloppe validée, aucune règle, aucun stockage durable, aucun compte, aucun journal contenant des prénoms, kill switch, auto-hébergeable.
3. Démarrer en **plan Free** avec émission au changement et quotas par session ; décision PO sur le passage en Paid (~5,3 $/mois) avant ouverture large.
4. **Autorité en tournoi** : l'affichage compteur d'un match lié est « provisoire » ; BDT fait foi et porte le live officiel.
5. **Prénoms minimisés avant envoi** par la projection ; le relais ne reçoit jamais plus que ce que l'écran affiche.
6. Dernier état côté relais : copie du dernier snapshot dans l'attachement de chaque socket (émetteur et écrans), aucun stockage ; écran « En attente de la tablette » si toutes les sockets ont fermé.

## 8. Protocole de vérification (PoC, mesures, terrain)

- **PoC-1 relais** : Worker + DO SQLite, hibernation, attachement, binding depuis un projet Pages de préproduction, Function `/api/tv/*` relayant l'upgrade. Mesures : durée facturée par message, nombre de requêtes par partie de 2 h simulée, comportement à la mise à jour du Worker, perte d'attachement à la fermeture.
- **PoC-2 rendu** : page TV statique en CSS conservatrice sur Chromium 85, 87, 94, 108 (émulation puis appareils, spec 090).
- **PoC-3 mono-écrivain** : deux onglets émetteurs restaurés, vérification du rejet de l'ancienne génération.
- Critère de sortie : écart ≤ 30 % entre coût mesuré et estimation, sinon révision du tableau §6.

## 9. Livrables attendus de l'étude

- ADR **0005 — Projection spectateur et transport** (`docs/adr/0005-…`, emplacement défini par V2-DOC-02, spec 035) : source de vérité contrôleur, snapshot complet versionné, port de transport à adaptateurs, mono-écrivain, frontière serveur.
- Proposition d'amendement de `CONTRIBUTING.md:9,28`, `docs/product-scope.md:19,26`, `docs/architecture.md:165` (appliquée seulement après validation).
- Rapport de PoC chiffré et décision Free/Paid.
- Mise à jour des specs 087, 088, 090 (passage en `en-discussion` ou `rejetee`).

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Glissement du relais vers un backend métier | Élevé | Moyenne | ADR : payload opaque, pas de stockage, pas de comptes, revue obligatoire |
| Dépassement du quota Free → diffusion coupée jusqu'à 00:00 UTC | Moyen | Moyenne si succès | Émission au changement, quotas, message clair, bascule Paid |
| Coût Paid sous-estimé | Faible | Moyenne | PoC chiffré, alerte de facturation [à confirmer : plafond de dépense disponible] |
| Rendu cassé sur TV 2022-2024 | Élevé | Haute | CSS TV conservatrice, spec 018, qualification 090 |
| Fuite de prénoms | Moyen | Faible | Minimisation avant envoi, aucun journal, TTL |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Relais optionnel autorisé (H.4) ? | Oui par ADR / Non (local + recopie seulement) | Oui, avec garde-fous de l'ADR 0005 | — |
| 2 | Hébergement | Worker séparé + binding / migration Workers | Worker séparé (moins invasif) | — |
| 3 | Budget | Free / Paid plafonné | Free au lancement, Paid décidé avant ouverture large | — |
| 4 | Autorité en tournoi (H.22) | Compteur provisoire, BDT fait foi / compteur officiel | BDT fait foi | — |
| 5 | Prénoms (H.18) | Complets / tronqués / initiales | Tronqués à 12 caractères par défaut, initiales en option, appliqués avant envoi | — |
| 6 | Dernier état relais | Copie dans les attachements / stockage DO avec TTL / aucun | Copie dans les attachements, sans stockage | — |
| 7 | Baseline TV (H.3) | Chromium ≥ 85 / ≥ 87 / ≥ 94 | Chromium ≥ 85 (Samsung 2022), à trancher en 018 | — |
| 8 | Budget d'appareils de test | Achat clé Fire TV / prêt de TV / laboratoire distant | Prêt + une clé Fire TV [à confirmer : prix] | — |

## 12. Traçabilité

- Rapports : `reports/07-tv-mode.md` §0, §2.3, §4.2, §5.3-5.7, §9 ; `reports/02-architecture.md` §6.1, §8.3 ; compte rendu C.6, D.2, H.3, H.4, H.18, H.22.
- Revue croisée « Archi × Sync × Intégrations » : calcul DO confirmé, chrono ×5 (≈ 385 000 req/j), mono-écrivain, « pas de backend métier » ≠ « aucun relais ».
- Specs liées : 084 (V2-TV-02), 085 (V2-TV-04, indépendante de cette étude), 087 (V2-TV-05), 088 (V2-TV-07), 090 (V2-TV-11), 091 (V2-TV-10), 018 (V2-DS-00), 030, 035 (V2-DOC-02).
