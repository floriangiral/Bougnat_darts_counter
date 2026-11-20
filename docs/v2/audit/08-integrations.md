> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 08 — Backend et intégrations externes / écosystème fléchettes (chantier 5.10)

Agent : « Backend et intégrations externes ». Date : 2026-11-20. Mode : lecture seule sur les deux dépôts, aucune prise de contact.
Repo analysé : `../ (workspace) Bougnat_darts_counter`, branche `feat/v2.0.0` (HEAD `508dfa6`), plus survol du dépôt voisin `Bougnat_Darts_Tournaments` (BDT).

Légende des marqueurs : **[VÉRIFIÉ code]**, **[VÉRIFIÉ source externe + URL]**, **[HYPOTHÈSE]**, **[À CONFIRMER]**.
Classement des points pour chaque plateforme : **Confirmé techniquement** | **Envisageable** | **Nécessite prise de contact** | **Impossible / non documenté**.

---

## 0. Synthèse exécutive

1. **Une intégration partenaire existe déjà et elle est en service côté partenaire.** La spec 030 (contrat d'URL `v=1`, X01 seulement, sans réseau ni backend) est implémentée, très testée (≈ 1 600 lignes de tests unitaires et 28 scénarios Playwright) et documentée (guide partenaire et simulateur). Le commit `f9ac4c2` déclare `https://badarts.fr` en préprod et en production. L'analyse du bundle JavaScript public de badarts.fr montre que ce site **utilise déjà le contrat `v=1`** : il construit le lien, a une page `/bougnat-retour`, contrôle la cohérence du résultat, puis le relaie par `BroadcastChannel` à l'onglet de gestion du tournoi, où un humain le valide.
2. **badarts.fr n'est aucune des quatre plateformes étudiées.** C'est le site du club « Montpellier Hérault Darts Club », construit sur l'API et l'authentification **DartsHub** (`api.dartshub.fr`, `auth.dartshub.fr`), une plateforme française de licences, tournois et inscriptions.
3. **Aucune des quatre plateformes ne publie de mécanisme qui permette à Bougnat de pousser un score dans leur système :**
   - **3K Darts** (ex-2K Dart Software) refuse explicitement toute API publique. Il ne propose que l'intégration par iframe et facture la transmission automatique de son propre scorer. En revanche, la saisie manuelle d'un résultat venu « d'une autre app » est explicitement admise.
   - **DartConnect** a une API REST à accès restreint (jeton Bearer, sur demande). Elle sert à lire des tournois, ligues et matchs et à écrire des joueurs, équipes et inscriptions, mais **n'a aucun endpoint de soumission de score**. Ses CGU interdisent tout usage automatisé ou le scraping.
   - **Darts for Windows** est un logiciel Windows payant (27,99 GBP par poste). Il importe des joueurs en CSV au format documenté et exporte ou importe des tableaux dans un format propriétaire. Sa page de live scoring est publique, sans API documentée.
   - **La Bomabull Darts (« Labo MaBULL »)** est une application française d'entraînement (exercices, Skillomètre, défis, clubs), avec compte obligatoire et sans API ni import/export documentés.
4. **Recommandation :**
   - Ne pas créer de backend d'intégration dans le compteur et garder `v=1` comme contrat public figé.
   - Ajouter seulement des mécanismes **sans secret et sans serveur** : retour par QR code pour le multi-appareil, export local du résultat, et éventuellement un retour par `window.opener` pour les partenaires qui ouvrent le compteur dans un nouvel onglet.
   - Préparer un **petit port applicatif neutre** (« match lié » en entrée, « résultat lié » en sortie), à extraire seulement quand un 2ᵉ canal sera accepté.
   - Confier toute intégration authentifiée (signature, sessions, idempotence) au **contrat inter-dépôts avec BDT** (`001-xrepo-scoring-contract-v1` du backlog), qui sait déjà émettre des jetons QR signés.
   - Pour les quatre plateformes, l'étape suivante est une **prise de contact** (soumise à autorisation). Aucune intégration technique n'est réalisable aujourd'hui sans elle.

---

## 1. Périmètre et fichiers analysés

### 1.1 Repo `Bougnat_darts_counter` (lecture seule)

| Domaine | Fichiers |
|---|---|
| Cœur du contrat | `src/features/external-match/externalMatchLink.ts` (478 l.), `externalMatchStartup.ts` (44 l.), `externalMatchAddressBar.ts` (18 l.) |
| Présentation | `src/presentation/externalMatch/externalMatchLabels.fr.ts` (82 l.), `components/external-match/ExternalMatchDialogs.tsx` (148 l.), `components/game-setup/SetupExternalMatchBanner.tsx` (29 l.), `components/game-setup/SetupPlayersSection.tsx`, `views/SetupView.tsx` (l. 52-69, 285-328), `views/StatsView.tsx` (l. 7-66) |
| Orchestration | `App.tsx` (l. 27-50, 86-168, 196-320, 346-441), `src/app/appShell.ts` (`flushAppSessionPersistence`, l. 150-162), `src/shared/session/persistedAppSession.ts` (l. 12-53), `src/lib/env.ts` (l. 10-49) |
| Configuration et outillage | `wrangler.jsonc`, `scripts/lib/externalReturnOrigins.mjs`, `scripts/validate-wrangler-config.mjs`, `scripts/deployment-check.mjs`, `scripts/validate-pages-build-env.mjs`, `.env.local.example`, `.github/workflows/promote-*.yml`, `public/_headers` (CSP), `scripts/generate-app-qr.mjs`, `package.json` |
| Spécification et documentation | `specs/030-counter-external-match-link/{spec,plan,tasks}.md`, `docs/integration/external-match-link.md` (221 l.), `docs/integration/partner-simulator/index.html` (258 l.), `README.md` (l. 68-78), `CONTRIBUTING.md` (l. 21-24), `specs/README.md` (l. 122-141), `docs/release/v2.0.0.md`, `docs/release/v2.0.0-coverage-map.md`, `docs/technical.md` |
| Tests (inventaire, pas d'exécution) | `tests/unit/externalMatch/*.test.ts` (5 fichiers, 1 079 l.), `tests/unit/tooling/partnerSimulator.test.ts` (191 l.), `tests/unit/tooling/externalReturnOrigins.test.ts` (235 l.), `tests/unit/components/setupViewExternalMatch.test.tsx`, `externalMatchDialogs.test.tsx`, `tests/e2e/external-match-link.smoke.spec.ts` (446 l., 28 scénarios) |
| Git | `git show f9ac4c2` (badarts.fr), `git log` |
| Modèle de match | `types.ts` (l. 28-55 : `Turn`, `LegState`, `MatchState`), `utils/arenaFlow.ts` (`GameType`) |

Les tests n'ont pas été exécutés : `vitest` peut écrire un cache dans le dépôt, ce qui est interdit.

### 1.2 Repo `Bougnat_Darts_Tournaments` (survol)

`README.md`, `specs/042-bdt-runtime-scoring-live/spec.md`, `internal/platform/config/config.go` (`CounterConfig`, l. 82-87, 189-193), `internal/modules/runtimeops/domain/runtime.go` (`ScorePayload`, l. 196-250), `internal/modules/runtimeops/http/handler.go` et `public_handler.go`, `docs/deployment/fly-io.md` (l. 80-122), plus, dans le workspace, `.specify-workspace/constitution.transverse.md` (§4-7) et `backlog/next-specs.md`.

### 1.3 Sources externes consultées

L'outil `web_fetch` a échoué (résolution du proxy). Les pages ont donc été récupérées par `curl` (lecture de pages publiques, sans authentification ni contournement) dans un dossier de travail de session, supprimé ensuite. Toutes les URL sont citées dans les fiches. Aucune requête n'a visé un endpoint d'API non documenté, ni utilisé un jeton ou un compte.

---

## 2. Audit interne : le contrat `v=1` (spec 030)

### 2.1 Architecture du code [VÉRIFIÉ code]

| Responsabilité | Où | Nature |
|---|---|---|
| Lecture et validation du lien entrant | `externalMatchLink.ts` : `analyzeExternalMatchLink` (l. 264), `parseExternalMatch` (l. 215), `parsePlayers` (l. 168), `sanitizeExternalPlayerName` (l. 148) | Fonctions pures (pas de DOM ni de React) |
| Politique des origines de retour | `parseAllowedOrigins` (l. 92), `ExternalReturnPolicy` (l. 100), `isAllowedReturnUrl` (l. 135), `isPrivateIPv4` (l. 119) | Pure, politique injectée |
| Contexte persistant | `createExternalMatchContext` (l. 302), `isExternalMatchContext` (l. 329), `restoreExternalMatchContext` (l. 349), TTL de 12 h (l. 61) | Pure ; type dans `shared/session/persistedAppSession.ts` l. 22 |
| Garde d'appartenance du match | `matchFollowsExternalLink` (l. 379) : mêmes joueurs, même ordre, mêmes équipes, pas de robot, même format | Pure |
| Construction du résultat | `buildExternalReturnUrl` (l. 438), `appendExternalResultStats` (l. 420), `countLegsWonByTeam` (l. 406), `buildExternalCancelUrl` (l. 469) | Pure ; dépend de `application/scoring/matchStats.calculateDetailedStatsForTeam` |
| Arbitrage au démarrage | `externalMatchStartup.ts` `getExternalLinkConflict` (l. 30) | Pure |
| Nettoyage de la barre d'adresse | `externalMatchAddressBar.ts` | Adaptateur navigateur |
| Orchestration | `App.tsx` : environ 24 `useState` au total, dont 7 dédiés au match lié ; `leaveForPartner` (l. 279), `guardExternalExit` (l. 292), navigation `window.location.assign` après `flushAppSessionPersistence` (l. 202-209) | Composition React |
| Interface | `SetupExternalMatchBanner`, `ExternalMatchDialogs` (fuite, conflit, lien invalide), `StatsView.externalReturn` | Vues |
| Activation | `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` (`src/lib/env.ts` l. 11/49) ; `wrangler.jsonc` l. 17 et 29 = `https://badarts.fr` | Configuration de build publique |

**Appréciation :**
- Séparation nette entre domaine pur et adaptateurs, injection de la politique et de l'horloge, garde d'exécution sur l'état persistant, et règles de jeu non dupliquées : le résultat est calculé à partir du `MatchState` produit par le moteur X01 existant. Cela respecte bien la Clean Architecture (§7 de la mission).
- Les points faibles portent sur l'évolutivité, pas sur la qualité :
  - le module mélange l'adaptateur d'entrée (URL), l'adaptateur de sortie (URL), la persistance et le calcul des statistiques ;
  - le type `ExternalMatchConfig` est un `Pick<GameConfig>` propre au X01 ;
  - l'orchestration reste dans `App.tsx`.

### 2.2 Contrat d'entrée `v=1` [VÉRIFIÉ code + spec 030 l. 23-44 + guide]

| Paramètre | Valeurs | Défaut | Code |
|---|---|---|---|
| `v` | `1` (toute autre valeur : `unsupported-version`) | `1` si absent | l. 191-196 |
| `game` | `x01` uniquement (sinon `unsupported-game`) | obligatoire | l. 195 |
| `p1`, `p2` / `t1p1`, `t1p2`, `t2p1`, `t2p2` | Noms nettoyés (Cc et Cf retirés, NFC, 32 caractères au plus sans couper un emoji). Le format double est prioritaire | obligatoire | l. 148-174 |
| `start` | entier de 2 à 9999 | 501 | l. 220-223 |
| `in` / `out` | `open`, `double`, `master` | `open` / `double` | l. 225-231 |
| `legs` | manches à gagner, de 1 à 15 | 3 | l. 233-236 |
| `sets` | sets à gagner, de 1 à 15 (active le format sets) | format manches | l. 238-239 |
| `stats` | `1` ou `0` | `0` | l. 179-185 |
| `return` | URL absolue dont l'origine figure dans la liste autorisée | obligatoire | l. 201-211 |

Règles :
- Une requête qui contient `game` ou `return` est traitée comme une tentative de lien (l. 269).
- La première erreur rend tout le lien invalide ; un dialogue en explique la raison (`ExternalLinkIssueDialog`).
- Les paramètres inconnus sont ignorés.
- Les paramètres du lien sont retirés de la barre d'adresse après lecture.

### 2.3 Contrat de sortie `v=1` [VÉRIFIÉ code l. 438-478]

Le retour est une navigation de premier niveau dans le même onglet (`window.location.assign`), déclenchée **par un geste des joueurs** : bouton « ENVOYER LE RÉSULTAT » ou choix « Retour au tournoi ».

| Paramètre | Quand | Signification |
|---|---|---|
| `v=1` | toujours | version |
| `status` | toujours | `completed` ou `cancelled` |
| `legs1`, `legs2` | `completed` | manches gagnées sur **tout le match**, comptées dans l'historique (l. 406-412) |
| `sets1`, `sets2` | `completed` + format sets | sets gagnés |
| `winner` | `completed` | `1` ou `2` (ordre du lien) |
| `avg1/2`, `n180_1/2`, `hco1/2`, `duration` | `completed` + `stats=1` | moyenne sur 3 fléchettes (2 décimales), nombre de 180, meilleur checkout, durée en secondes |

Les paramètres déjà présents dans l'URL de retour (par exemple un jeton ou un identifiant) sont conservés ; ceux de même nom sont écrasés (liste réservée).

### 2.4 Sécurité [VÉRIFIÉ code + spec 030 §Result integrity]

**Garanties actuelles :**
- Liste blanche d'origines exactes, `https` obligatoire, aucun identifiant dans l'URL. `http` n'est accepté que pour localhost, ou pour une IPv4 privée si `VITE_APP_ENV=local` est explicite (l. 127-139).
- Contrôle au build (`externalReturnOrigins.mjs` : origine seule, pas de doublon, pas de localhost en environnement déployé).
- Re-validation à chaque affichage : un `localStorage` modifié ne permet ni de rediriger ailleurs ni d'envoyer le résultat d'un autre match (`App.tsx` l. 270-277 et `matchFollowsExternalLink`).
- Expiration du contexte après 12 h, avec une tolérance d'horloge de 5 min.
- Aucun appel réseau : `fetch`, `postMessage` et iframe sont exclus. La CSP contient `frame-ancestors 'none'` et `frame-src 'none'` (`public/_headers` l. 2) : le compteur ne peut pas être intégré dans une iframe et ne peut pas en afficher.
- `Referrer-Policy: strict-origin-when-cross-origin` : le partenaire ne reçoit que l'origine en référent.

**Limite assumée :** le résultat **n'est pas signé**. Le 2026-11-19, le PO a rejeté une signature côté serveur (Pages Function avec secret par partenaire) pour ne pas ajouter de backend. La validation est donc reportée chez le partenaire : jeton à usage unique, idempotence, contrôles de cohérence, validation humaine.

### 2.5 Limites fonctionnelles du contrat `v=1`

| # | Limite | Constat |
|---|---|---|
| L1 | **X01 seulement** | [VÉRIFIÉ] l. 195 ; `ExternalMatchConfig` est propre au X01 (`persistedAppSession.ts` l. 13) |
| L2 | **Pas de signature ni d'authentification** | [VÉRIFIÉ] décision PO |
| L3 | **Validation déportée chez le partenaire** | [VÉRIFIÉ] guide §Sécurité, 5 obligations |
| L4 | **Retour sur le même appareil uniquement** : le résultat ne quitte la tablette que par navigation | [VÉRIFIÉ] ; aucun mécanisme multi-appareil |
| L5 | **Granularité du résultat** : manches, sets, vainqueur et 4 statistiques agrégées ; pas de détail des volées | [VÉRIFIÉ] ; `Turn` stocke pourtant `score`, `isBust`, `remainingAfter` et `dartsThrown` par volée (`types.ts` l. 28-34), donc un export détaillé est possible sans toucher au moteur |
| L6 | **Pas d'identifiant de joueur** : identification par position et par nom | [VÉRIFIÉ] ; le partenaire porte l'identifiant dans son URL de retour |
| L7 | **Ajouter un partenaire exige un redéploiement** (`wrangler.jsonc`) | [VÉRIFIÉ] guide l. 24-29 ; c'est voulu pour la sécurité |
| L8 | **Libellés en dur** « Match de tournoi » (`externalMatchLabels.fr.ts` l. 15), en français seulement | [VÉRIFIÉ] ; inadapté à un match de ligue ou d'entraînement (gravité faible) |
| L9 | **Pas de remontée en direct** : le partenaire ne voit le score qu'à la fin | [VÉRIFIÉ] ; pas de canal TV externe |
| L10 | **Lien rejeté si le compteur ne connaît pas l'origine**, et seule la 1ʳᵉ erreur est affichée | [VÉRIFIÉ] |

### 2.6 Tests et outillage [VÉRIFIÉ inventaire]

- Tests unitaires : `externalMatchLink` (602 l.), `externalMatchLinkEdgeCases` (319 l.), `externalMatchStartup` (91 l.), `externalMatchAddressBar` (23 l.), `externalMatchStatsFormatting` (44 l.), plus le simulateur (jsdom, 191 l.), l'outillage des origines (235 l.) et les composants.
- E2E : `external-match-link.smoke.spec.ts`, 28 scénarios, avec une origine fictive `https://partner.example` injectée par `.github/actions/run-local-smoke`.
- La carte de couverture v2.0.0 annonce 100 % des lignes et des branches sur les modules purs (`docs/release/v2.0.0-coverage-map.md` l. 8-15). Ce chiffre n'a pas été réexécuté.

### 2.7 Le partenaire déclaré : badarts.fr (observation externe)

Toutes les observations ci-dessous sont **[VÉRIFIÉ source externe]** : lecture du bundle public minifié `https://badarts.fr/assets/index-Bp2NMd6v.js` et du chunk `BougnatReturn-D0_B8Rp9.js`, consultés le 2026-11-20. Elles peuvent changer à tout moment.

**Identité :**
- Titre « Badarts - Montpellier Hérault Darts Club | Association de Fléchettes traditionnelles à Montpellier » (https://badarts.fr/).
- Constantes `ab="https://api.badarts.fr"`, `ud="https://api.dartshub.fr"`, `lb="https://auth.dartshub.fr"`, `b1="https://badarts.fr"`.
- Logo « DartsHub ». DartsHub (https://dartshub.fr/) se présente comme « Licences, tournois et inscriptions fléchettes ».
- → **badarts.fr ne relève d'aucune des quatre plateformes** ; il s'appuie sur DartsHub. Le lien commercial ou technique exact entre badarts.fr et DartsHub est [À CONFIRMER].

**Construction du lien :**
- Paramètres `URLSearchParams({v:"1",game:"x01",start,out:"double",legs,stats:"1"})`, en simple (`p1`/`p2`) ou en double (`t1p1`…`t2p2`).
- Retour vers `https://badarts.fr/bougnat-retour?bougnat_match=<id>`.
- Ouverture par **`window.open(url, "_blank")`**, donc dans un nouvel onglet.
- **Aucun jeton** dans l'URL de retour, contrairement à la recommandation n° 1 du guide.

**Lecture du retour :**
- Exige `v==="1"`, `status` égal à `completed` ou `cancelled`, `legs1`/`legs2` de 1 ou 2 chiffres (≤ 15) et différents, et un `winner` cohérent.
- Statistiques validées par expressions régulières (moyenne ≤ 180, 180 ≤ 99, checkout ≤ 170, durée ≤ 86 400).
- **Ignore `sets1`/`sets2`** et ne demande jamais `sets`.

**Relais :**
- La page `/bougnat-retour` publie `{type:"result", matchId, scores, stats}` sur un `BroadcastChannel("badarts-bougnat")`.
- L'onglet de gestion du tournoi pré-remplit le score si le match est `pending`, ce qui le rend idempotent, puis l'organisateur « vérifie puis valide ». Recommandations n° 2 à 4 du guide respectées.
- Si l'onglet du tournoi est fermé, la page affiche « Saisissez ce score à la main ».

**Conséquences pour Bougnat :**
- Le contrat `v=1` est **réellement consommé** ; un changement incompatible casserait un partenaire en production. Ce n'est pas encore le cas côté compteur, puisque `v2.0.0` n'est pas publiée, mais le partenaire est prêt.
- Le partenaire a dû **réinventer un canal inter-onglets** (`BroadcastChannel`) parce que le retour par navigation remplace l'onglet du compteur. Cela confirme un besoin : un retour vers la fenêtre ouvreuse (`window.opener.postMessage`) serait plus simple pour les partenaires qui ouvrent un nouvel onglet.
- `BroadcastChannel` ne fonctionne **que sur le même appareil et le même navigateur**. Si la tablette de cible n'est pas l'appareil de l'organisateur, il ne reste que la saisie manuelle. C'est le besoin d'un **retour multi-appareil** (QR code), cf. V2-INT-04.

### 2.8 Ce que BDT attend (survol)

- [VÉRIFIÉ code BDT] `CounterConfig{AppURL, APIBaseURL, LaunchTokenTTLDays, MatchLockTTLMin}` (`config.go` l. 82-87). `docs/deployment/fly-io.md` l. 86-90 et 119-122 prévoit `COUNTER_APP_URL='https://play.bougnatdarts.fr'` et ajoute le compteur à `HTTP_ALLOWED_ORIGINS` (CORS).
- Seul `LaunchTokenTTLDays` est utilisé (`bootstrap.go` l. 230). **Aucune construction de lien `v=1` n'existe dans BDT** (recherche de `game=x01`, `legs1`, `play.bougnatdarts` dans le code Go et HTML : aucun résultat).
- [VÉRIFIÉ spec BDT 042] Le runtime de scoring de BDT suppose :
  - une session ouverte à partir d'un **jeton QR signé** ;
  - des soumissions qui portent `client_event_id`, `client_sequence` et `session_version` (GF-06), avec des reprises idempotentes (GF-07) ;
  - une validation par le staff (E2) ;
  - un **snapshot live public / wallboard** (E4, `GET /public/tournaments/{id}/runtime/live/snapshot`).
- BDT a sa propre interface terrain minimale (`runtime_scoring.js`).
- [VÉRIFIÉ code BDT] `ScorePayload{version, winner_participant_id, sets[], legs[], visits[]{participant_id,set_number,leg_number,visit_number,points_scored,remaining_points,checkout_attempt,darts[]}, checkout, summary}` (`runtime.go` l. 196-250).
- [VÉRIFIÉ workspace] La constitution transverse §5 exige que tout flux inter-dépôts passe par un contrat spécifié (commande, événement, snapshot, projection, erreur, autorisation). Elle refuse qu'une intégration critique repose sur des conventions implicites de champs. Le backlog place `001-xrepo-scoring-contract-v1` en tête.
- **Conclusion :**
  - Le contrat `v=1` **ne répond pas** aux attentes de BDT : pas de session, d'idempotence par événement, de remontée en direct ni de détail des volées.
  - Ce n'est pas un défaut : `v=1` est un contrat léger pour partenaires tiers non authentifiés, alors que BDT demandera un contrat authentifié et en ligne.
  - Les deux doivent **coexister**. Le modèle `Turn` du compteur se projette presque directement en `ScoreVisit` (`points_scored`=`score`, `remaining_points`=`remainingAfter`). Le détail fléchette par fléchette (`darts[]`) n'existe pas en saisie par volée [VÉRIFIÉ `types.ts`].

### 2.9 Divergences documentation/spec ↔ code

| # | Divergence | Gravité |
|---|---|---|
| D1 | `specs/030/tasks.md` : « [ ] Configure the allowed origins in `wrangler.jsonc` … once a partner is validated » reste non cochée alors que `f9ac4c2` l'a fait (production et préprod) | Faible (traçabilité) |
| D2 | `docs/release/v2.0.0.md` l. 9 : « Le lien de match externe reste désactivé tant qu'aucune origine partenaire n'est déclarée » ; la note de version ne mentionne pas l'activation de badarts.fr, que le README annonce (l. 76) | Moyenne (note de version d'un contrat public) |
| D3 | `docs/release/v2.0.0-coverage-map.md` l. 32 : « pas essayé avec une application partenaire réelle ». Un partenaire réel existe désormais ; un essai de bout en bout est [À CONFIRMER] | Moyenne (risque de publication) |
| D4 | `spec 030` l. 5 : « implemented on `release/v2.0.0` » alors que la branche courante est `feat/v2.0.0` | Faible |
| D5 | Variable GitHub `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` (build de validation CI, `promote-*.yml` l. 44) : son alignement avec `wrangler.jsonc` est [À CONFIRMER]. `deployment-check.mjs` l. 96 se contente d'avertir | Faible |
| D6 | Le guide recommande un jeton à usage unique et une navigation dans le même onglet ; badarts.fr n'utilise ni jeton ni même onglet, mais compense par la validation humaine. Ce n'est pas une divergence du compteur, mais un **retour terrain à intégrer au guide** (variante « nouvel onglet + relais ») | Info |
| D7 | `www.badarts.fr` n'est pas autorisé. Ce n'est pas un problème tant que badarts.fr construit ses retours sur `https://badarts.fr` (constaté), mais une redirection `badarts.fr` → `www` future casserait les retours. La résolution DNS de `www.badarts.fr` a échoué lors du test [À CONFIRMER] | Faible |

---

## 3. Fiches plateformes

### 3.1 Darts for Windows (DfW)

**Sources [VÉRIFIÉ source externe] :**
- https://www.dartsforwindows.com/ (accueil, notes de version 2.9.4.2 et 2.9.4.3, licence)
- https://www.dartsforwindows.com/howto/live/livescorewww.html (live scoring)
- https://www.dartsforwindows.com/howto/imp/importcsv.html (import CSV)
- https://www.dartsforwindows.com/howto/mergedraws.html (export et import de tableaux)
- https://www.dartsforwindows.com/howto/opendatabase.html (bases `.dfw`)
- https://www.dartsforwindows.com/live/livescore.html (page publique de live)

**Positionnement :** logiciel **Windows de bureau** (`.msi`, version 2.9.4.3 du 09.08.2026) d'un développeur indépendant (Roger Boyesen). Il est très présent dans les compétitions britanniques et internationales sous l'égide de la BDO/WDF : bases téléchargeables de centaines d'événements et de divisions UKDA, matchs de comté BICC, Super League, Six Nations.

**Fonctionnalités vérifiées :**
- Gestion de joueurs et d'équipes, tableaux, round robin multi-tours, Super League, tournois avec tirage.
- Saisie des scores au clavier ou au touchpad, éditeur de match, jeu contre l'ordinateur, impression.
- Live scoring web, nuage de tableaux (désormais à sens unique, sans synchronisation depuis la 2.9.4.2).
- Import de plus de 3 000 joueurs PDC depuis le serveur DfW.

**Mécanismes d'intégration connus :**

| Mécanisme | Statut |
|---|---|
| Import de joueurs en **CSV point-virgule** sans en-tête, colonnes documentées : 1 type/sexe (0 à 3), 2 prénom, 3 nom, 4 équipe, 5 abréviation (3 lettres), 6 suffixe, 7 identifiant (≤ 32 caractères) | **Confirmé techniquement** (documenté) |
| Export et import de **tableaux** (« Export selected draw to file ») : format de fichier non documenté | **Impossible / non documenté** (format propriétaire) |
| Bases `.dfw` partagées en zip : format non documenté | **Impossible / non documenté** |
| Import de matchs « depuis une base DfW externe » : entre instances DfW uniquement | **Impossible** pour Bougnat |
| **Live scoring web** : DfW téléverse un instantané ; page publique `livescore.html?matchid=<serial+3 lettres>`. La page s'appuie sur des endpoints internes (`score_proxy.php`) non documentés | Lecture par Bougnat : **Impossible / non documenté** (ne pas utiliser d'endpoint interne) |
| API publique, webhooks, liens profonds, import de résultats venant d'une app tierce | **Non documenté** |
| Cibles électroniques | Non documenté |

**Opportunités pour Bougnat :**
- (a) Un **export CSV de joueurs au format DfW** depuis Bougnat a une valeur faible, car Bougnat n'a pas de base de joueurs, seulement des prénoms saisis.
- (b) Bougnat comme **interface de scoring (et de voix) d'un match DfW** : la saisie manuelle dans DfW reste nécessaire. La valeur dépend d'une carte de résultat lisible (V2-INT-06). **Envisageable** sans contact, mais avec une valeur modeste.
- (c) Diffusion TV d'un match DfW : **impossible** sans flux documenté.

**Contraintes :**
- Licence payante par poste (27,99 GBP, mises à jour pendant au moins 12 mois), Windows uniquement.
- Aucune CGU ni politique d'API trouvée [À CONFIRMER].
- Les noms complets des joueurs (prénom et nom) sont des données personnelles : un export ou un import CSV relève du RGPD local (fichier sur l'appareil, pas de transfert).

**Infos manquantes :** format des fichiers de tableaux et des bases, existence d'un import de résultats ou de matchs depuis un fichier, conditions de réutilisation du live scoring.

**Contact nécessaire ?** Oui pour tout ce qui dépasse le CSV joueurs. Priorité faible : public principalement britannique, outil de bureau, peu de recouvrement avec l'usage navigateur de Bougnat [HYPOTHÈSE].

**Valeur pour les deux parties :** faible à moyenne. DfW pourrait trouver une saisie tablette ou vocale moderne côté cible, et Bougnat une visibilité auprès de ligues britanniques [HYPOTHÈSE].

### 3.2 3K Darts (ex-2K Dart Software)

**Sources [VÉRIFIÉ source externe] :**
- https://portal.3k-darts.com/ : SPA Angular, auteur Robert Mützner, mots-clés « Turnierverwaltung, Ligaverwaltung » ; `www.3k-darts.com` y redirige.
- https://dart-software.de/ : « **Aus 2K Dart Software wird 3K Darts** ».
- https://2k-dartsoftware.freshdesk.com/support/solutions/articles/103000362923-interface-api-integration-into-websites (portail d'aide « 3K Darts », modifié le 29/08/2025).
- https://2k-dartsoftware.freshdesk.com/support/solutions/articles/103000294712-use-darts-scorer-with-2nd-monitor-tv-android-
- https://dart-software.de/darts-scorer/, https://dart-software.de/preise/, https://dart-software.de/darts-scorer-zusatzgebuehren/
- https://scorer.3k-darts.com/ (« 3K Darts Scorer », PWA)

**Positionnement :** solution allemande de **gestion de tournois et de ligues** (fédérations, ligues, clubs : NWDV, DDV…), avec un scorer maison (« Darts Scorer », Android, Windows et web) et un live ticker public.

**Fonctionnalités vérifiées :**
- Tournois, classements, ligues par équipes, gestion de fédération.
- Le Darts Scorer, connecté par login, reçoit automatiquement les matchs et formats du tournoi et remonte automatiquement résultats, statistiques et meilleures performances.
- Live ticker, vue spectateur sur 2ᵉ écran (Miracast ou Chromecast, plusieurs modes d'affichage).
- Inscription par QR code. Connexion **Scolia**, facturée en supplément.

**Mécanismes d'intégration connus :**

| Mécanisme | Statut |
|---|---|
| **API publique : refus explicite.** « We have made a conscious decision not to provide a public API that allows results or tables to be read », avec trois raisons : contrats avec les fédérations, contrôle de l'affichage, exigences légales | **Impossible** (position officielle) |
| **Intégration par iframe** de pages publiques fixes (participants, matchs, classement) | **Confirmé techniquement** pour un site web. Pour Bougnat, il faudrait lever `frame-src 'none'` dans la CSP, ce qui est une décision de sécurité |
| Transmission automatique des résultats : **réservée au Darts Scorer maison** et facturée de 0,25 à 0,40 € par participant et par tournoi (+ 0,30 € avec Scolia) | **Impossible** pour un scorer tiers sans partenariat |
| **Saisie manuelle des résultats dans 3K** : « Hierbei ist es unerheblich, ob Sie die Darts Scorer App benutzen oder eine andere App » (l'app de scoring importe peu), sans frais supplémentaires | **Confirmé** (usage admis par l'éditeur) |
| Liens profonds, webhooks, import/export de fichiers | **Non documenté** |
| CGU et politique de confidentialité | Liens présents dans le portail (« Terms of Use, Privacy Policy, Imprint »), contenu non lisible hors JavaScript [À CONFIRMER] |

**Opportunités :**
- (a) Bougnat comme **scorer libre et gratuit dans un événement 3K** avec retranscription manuelle par l'organisateur : déjà possible et admis ; la valeur augmente avec une carte de résultat claire (V2-INT-06).
- (b) La voix et le mode TV de Bougnat deviennent alors un différenciant sur la cible, mais le **live ticker 3K ne serait pas alimenté**.
- (c) Une intégration automatique n'est envisageable que par un partenariat commercial, contraire à la stratégie publique de l'éditeur et à son modèle de revenus (frais de scorer).

**Contraintes :** refus d'API publique, modèle payant, contrats avec les fédérations, données personnelles de licenciés allemands (RGPD).

**Infos manquantes :** contenu des CGU, ouverture éventuelle à un scorer tiers certifié, format interne des matchs.

**Contact nécessaire ?** Oui avant toute idée d'automatisation. La probabilité d'accord paraît faible au vu de la position publiée et des frais de scorer [HYPOTHÈSE].

**Valeur :** pour Bougnat, une forte visibilité potentielle dans les clubs germanophones ; pour 3K, faible, car Bougnat concurrence son scorer. **Priorité de contact : basse.**

### 3.3 DartConnect

**Sources [VÉRIFIÉ source externe] :**
- https://www.dartconnect.com/ : « The Official Scoring App of the Professional Darts Corporation. Official Partner of the World Darts Federation. »
- https://public-api.dartconnect.com/ : documentation de l'API, consultée via son application publique.
- https://www.dartconnect.com/members/terms-of-use/
- https://www.dartconnect.com/leagues/league-pricing/, https://www.dartconnect.com/events/event-pricing-new/, https://www.dartconnect.com/events/digital-steel-certification/
- https://www.dartconnect.com/videoconnect/
- https://www.dartconnect.com/league-administrator-updates/download-regular-post-season-csv-reports/ (exports CSV du portail ligue)
- https://tv.dartconnect.com/ (DCTV)

**Positionnement :** leader mondial du scoring de ligues et de tournois steel. App de scoring hors ligne avec synchronisation, logiciel de tableaux, DCTV (scoreboards en direct et streams), statistiques avancées, jeu en ligne avec VideoConnect. Partenaire officiel de la PDC et de la WDF.

**Fonctionnalités vérifiées :**
- Ligues : planification, rapports de match, classements, frais de 1 $ par joueur et par compétition, pilote gratuit jusqu'à 8 joueurs ou équipes.
- Événements « Digital Steel » : 2 $ par joueur pour une compétition simple, 1 $ par joueur et par compétition au-delà ; envoi automatique des matchs aux tablettes ; nouveaux tarifs au 01/01/2027.
- Comptes Premium, VideoConnect, exports **CSV** de rapports et de classements depuis le portail ligue.

**Mécanismes d'intégration connus :**

| Mécanisme | Statut |
|---|---|
| **API REST publique documentée, à accès restreint.** « The DartConnect API is currently a limited-access program… contact customerservice@dartconnect.com to request an API key. » Authentification `Authorization: Bearer {token}` | **Nécessite prise de contact** |
| Endpoints **en lecture** : `/api/v1/tournaments`, `/tournaments/:id/{events,players,teams}`, `/tournaments/:id/events/:id/matches`, `/leagues/{league}/seasons/{season}/{divisions,teams,players,matches}`, `/matches/{match}?include=leg_breakdown`, `/ukda-*`, `/event-registrations/*`, `/orgs/{org}/groups/{group}/members` | Documenté, sous réserve d'une clé |
| Endpoints **en écriture** : création ou suppression de joueurs et d'équipes (tournois, ligues, UKDA), inscriptions, divisions, membres de groupe | Documenté, sous réserve d'une clé |
| **Soumission de score ou de résultat de match par un scorer tiers** | **Impossible / non documenté** : aucun `POST`/`PUT` sur des matchs dans la documentation |
| Exports CSV (portail ligue : rapports et classements) | **Confirmé** pour un administrateur de ligue, manuellement |
| DCTV : scoreboards publics | Lecture ou reprise par Bougnat : **Impossible**. Les CGU interdisent « any automated use of the Site, the Service » et « scrape, spider, or crawl the Service or harvest… data » |
| Webhooks, liens profonds vers l'app de scoring | **Non documenté** |

**Opportunités :**
- (a) **Import d'un appariement de tournoi DartConnect dans Bougnat** (lecture `tournaments/:id/events/:id/matches`, puis pré-remplissage du X01). C'est techniquement plausible, mais il faut une clé API, qui est un **secret** : elle ne peut pas vivre dans le bundle public. Il faudrait donc un backend (BDT ou une fonction), ce qui contredit la frontière actuelle.
- (b) Le **scoring Bougnat** ne peut pas remplacer l'app DartConnect pour un match DartConnect : pas d'endpoint de soumission, et les statistiques de ligue ou de tour dépendent du scoring DC.
- (c) Le mode TV de Bougnat pour un match DC est **impossible** (CGU).
- (d) **Cohabitation** : la saisie vocale de Bougnat pour des parties amicales ou d'entraînement, DartConnect pour les compétitions. Aucune intégration n'est nécessaire.

**Contraintes :** clé sur demande, CGU strictes (usage personnel non commercial, interdiction de l'automatisation), confidentialité (la politique DC mentionne de la publicité et des cookies Google AdSense, incompatible avec la promesse « sans publicité » si Bougnat intégrait des contenus DC), coûts côté organisateur.

**Infos manquantes :** conditions d'attribution d'une clé (usage non commercial ?), quotas, feuille de route d'endpoints de résultats (« expanded league support » sans date), possibilité d'un lien profond « scorer externe ».

**Contact nécessaire ?** Oui pour tout scénario. Une demande de clé API reste une prise de contact, donc soumise à autorisation.

**Valeur :** pour Bougnat, la crédibilité et l'accès aux tableaux ; pour DartConnect, faible. **Priorité de contact : basse à moyenne**, et seulement si BDT porte le besoin, par exemple importer des joueurs ou des tournois DC dans BDT.

### 3.4 La Bomabull Darts (« Labo MaBULL »)

**Sources [VÉRIFIÉ source externe] :**
- https://app.labomabull-darts.fr/ : application Laravel + Inertia + React servie par FrankenPHP. Statistiques publiques dans la page : 56 exercices, 776 joueurs, 12 621 sessions.
- Pages publiques https://app.labomabull-darts.fr/mode-emploi, `/histoire`, `/philosophie`.
- Navigation lue dans le bundle public (`/play` « Le laboratoire », `/pharmacie` « La Pharmacie du Doc », `/analyse-du-doc` « Les prescriptions du Doc », `/skillometre`, `/battles` « Défis », `/club`, `/classement`, `/chiffres`, `/news`), la plupart avec `requiresAuth`.
- Page Facebook « Docteur MaBull » (https://www.facebook.com/DrMaBULL/) : le Skillomètre « simule un match 501 / cricket sans adversaire ».

**Positionnement :** application **française d'entraînement et de progression** fondée sur une méthode (« focus bulle », vol de la fléchette, gestion de la pression), portée par une personne (« Docteur MaBull ») et une communauté. Ce n'est **ni un gestionnaire de tournois ni un scorer de compétition**.

**Fonctionnalités vérifiées :**
- Exercices à objectif mesurable ou qualitatif, sessions enregistrées avec courbe de progression, « prescriptions » (recommandations).
- Skillomètre (501 ou cricket en solo), défis entre joueurs, clubs (recherche, invitation, défis de club), classement, amis, playlists d'exercices, notes.

**Mécanismes d'intégration :**

| Mécanisme | Statut |
|---|---|
| API publique, import/export, webhooks, liens profonds | **Impossible / non documenté** (rien de public) |
| Données de page Inertia (`data-page`) | Ce n'est **pas** une API : à ne pas exploiter |
| CGU, mentions légales, politique RGPD | Non trouvées dans les pages publiques [À CONFIRMER] |
| Compte obligatoire pour l'essentiel | Confirmé (`requiresAuth`) |

**Opportunités :**
- (a) **Complémentarité forte** : Bougnat sert à jouer (scoring, voix, TV), Labo MaBULL à s'entraîner avec méthode. Communauté francophone commune.
- (b) **Le plus simple, sans technique** : liens croisés (« S'entraîner avec le Labo » / « Compter avec Bougnat »). **Envisageable**, sous réserve de l'accord du PO et de l'éditeur.
- (c) **Contrat de lien du type `v=1`** : Labo ouvrirait Bougnat pour une partie 501 de Skillomètre et récupérerait moyenne, 180 et checkout. La plomberie existe, mais le Skillomètre a déjà sa propre saisie : valeur à vérifier. **Nécessite prise de contact.**
- (d) **Saisie vocale de Bougnat pour des exercices Labo** (par exemple « 100 fléchettes sur la bulle ») : forte valeur différenciante, mais il faudrait que Labo expose un contrat d'entrée, ou que Bougnat implémente des modes d'entraînement, ce qui touche au chantier des jeux. **Nécessite prise de contact.**
- (e) Synergie possible avec les specs BDT 044/045 (coach IA et évaluation) : hors périmètre du compteur.

**Contraintes :**
- Comptes et données de progression personnelles (RGPD) : une intégration ne devrait transmettre que des agrégats, à l'initiative du joueur.
- Projet manifestement individuel : stabilité et engagement [À CONFIRMER].

**Infos manquantes :** feuille de route, ouverture à des échanges, statut juridique, CGU.

**Contact nécessaire ?** Oui. C'est le **meilleur candidat de prise de contact** parmi les quatre : francophone, complémentaire, sans modèle payant visible et sans conflit d'intérêt évident [HYPOTHÈSE].

**Valeur :** pour les deux parties, une audience croisée et un parcours « jouer → progresser ». Pour Bougnat, cela renforce l'axe « particuliers et clubs » sans rien ajouter au parcours de base.

### 3.5 Fiche annexe : DartsHub (via badarts.fr) et systèmes à caméra

- **DartsHub** (https://dartshub.fr/, « Licences, tournois et inscriptions fléchettes »). Son API et son authentification sont utilisées par badarts.fr [VÉRIFIÉ bundle]. Si DartsHub équipe plusieurs clubs ou ligues, une intégration `v=1` **au niveau de DartsHub** toucherait plusieurs clubs d'un coup [HYPOTHÈSE, À CONFIRMER]. Prise de contact à envisager, en passant par badarts.fr, déjà partenaire.
- **Scolia** (caméras d'auto-scoring) publie une API d'événements de lancer (https://scoliadarts.com/api/ : « Throw events (including scores, X-Y coordinates, 3D inclined angles) », intégration sur contact). Ce n'est pas demandé, mais cela répond à la question « intégration avec cibles électroniques » : 3K facture déjà un supplément Scolia. Pour Bougnat, ce serait une **source d'entrée de score** au même titre que la voix. À traiter comme une étude exploratoire liée au port de saisie (chantier voix et jeux), pas comme une intégration de plateforme. **Nécessite prise de contact.**

### 3.6 Matrice de synthèse

| Scénario | DfW | 3K Darts | DartConnect | La Bomabull |
|---|---|---|---|---|
| API publique documentée | Non documenté | **Refus explicite** | **Oui, accès restreint** (clé sur demande) | Non documenté |
| Import de joueurs vers Bougnat | CSV documenté (sens DfW ← fichier) | Impossible | Lecture API avec clé (secret, donc backend) | Impossible |
| Import de rencontres ou appariements | Non documenté | Impossible | Lecture API avec clé : prise de contact + backend | Sans objet |
| Bougnat comme scorer (+ voix), retranscription manuelle | **Envisageable** | **Confirmé (admis par l'éditeur)** | Envisageable hors compétitions DC ; contraire au modèle de ligue DC | Sans objet (entraînement) |
| Bougnat comme scorer avec remontée automatique | Non documenté | Impossible sans partenariat | **Impossible** (pas d'endpoint de score) | Prise de contact |
| Diffusion TV Bougnat d'une rencontre externe | Impossible (endpoint interne) | Iframe seulement (CSP à lever) | **Impossible** (CGU) | Sans objet |
| Export de résultats Bougnat → plateforme | Saisie manuelle | Saisie manuelle | Saisie manuelle | Prise de contact |
| Authentification | Licence par poste | Compte 3K | Bearer, compte Premium | Compte Labo |
| Coût pour l'utilisateur final | 27,99 GBP par PC | Abonnement + frais de scorer | 1 à 2 $ par joueur et par compétition | Gratuit (constaté) [À CONFIRMER] |
| Prise de contact recommandée | Basse | Basse | Basse à moyenne (via BDT) | **Haute** |

---

## 4. Scénarios transverses demandés

| Scénario | Faisable aujourd'hui | Analyse |
|---|---|---|
| **Bougnat comme interface de scoring d'une rencontre externe** | **Oui, avec `v=1`** pour tout partenaire qui l'adopte (badarts.fr) | Pour les 4 plateformes, seulement en retranscription manuelle |
| **…avec scoring vocal** | **Oui, a priori** : un match lié est un match X01 standard (`MatchView`) | Que la voix soit active pendant un match lié et que le verrouillage du setup ne gêne pas la voix est [À CONFIRMER] : aucun test e2e ne combine voix et lien. À ajouter en non-régression (V2-INT-01) |
| **Mode TV d'une rencontre externe** | Seulement si le match est **joué sur Bougnat** : le mode TV lit l'état local, comme pour un match ordinaire | Pour un match joué sur DfW, 3K ou DC : aucun flux documenté, donc impossible. Pour BDT : le snapshot public `wallboard` de la spec 042 est un **contrat candidat** pour un futur « TV tournoi », à traiter dans le contrat inter-dépôts |
| **Import de joueurs** | Non | DfW CSV possible mais faible valeur ; DartConnect demande une clé, donc un backend |
| **Import de rencontres** | `v=1` (le partenaire pousse le match par URL) | C'est le modèle d'import « poussé » le plus sobre ; il n'a besoin d'aucun secret |
| **Export de résultats** | `v=1` (URL) | Ajouts envisageables sans backend : carte de résultat, QR code, fichier local (V2-INT-04/06) |
| **Intégrations sortantes** (Bougnat expose ses capacités) | `v=1` | Bougnat expose déjà un « service de scoring » sans état aux partenaires. C'est l'axe « Bougnat pour les partenaires » de la vision (§6 de la mission) |

---

## 5. Architecture d'intégration générique

### 5.1 Options comparées

| Option | Description | Avantages | Inconvénients et risques | Coût récurrent |
|---|---|---|---|---|
| **A. Statu quo `v=1` figé + ajouts compatibles** | Garder `v=1`. N'ajouter que des paramètres **optionnels et additifs** (par exemple `label=` pour le libellé d'événement ou de cible), ignorés par les compteurs plus anciens. Documenter cette politique | Aucun risque pour badarts.fr, coût nul | Ne lève aucune des limites L1, L4, L5 | 0 € |
| **B. Port neutre + adaptateurs (sans changer le contrat)** | Extraire `LinkedMatchRequest` (jeu, joueurs, format, origine, options) et `LinkedMatchResult` (statut, score, statistiques, détail optionnel), indépendants de l'URL. Adaptateurs : `urlV1Inbound`, `urlV1Outbound`, plus tard `openerOutbound`, `qrOutbound`, `fileOutbound`. Hook `useLinkedMatch` pour alléger `App.tsx` | Rend V2-INT-04/05/06 et un contrat BDT faisables sans dupliquer le parsing ni les gardes. Rend `ExternalMatchConfig` générique (union discriminée par `game`) | Abstraction prématurée si aucun 2ᵉ canal n'est accepté | 0 € |
| **C. Contrat `v=2` par URL** | Multi-jeux (Cricket d'abord), choix du canal de retour (`ret=nav\|opener`), détail des volées encodé (base64url JSON compact, quelques Ko), `label` | Lève L1, L5 et en partie L4 | Deux versions à maintenir ; longueur d'URL ; jamais de signature | 0 € |
| **D. Signature HMAC ou JWT des résultats par le compteur** | Pages Function avec un secret par partenaire | Intégrité du résultat | **Déjà rejetée** (backend dans le dépôt open source, contraire à CONTRIBUTING). La sécurité réelle reste faible : un joueur peut fausser la *saisie* avant la signature. La signature prouve l'origine « compteur », pas la véracité | Cloudflare Workers gratuit jusqu'à 100 000 requêtes/jour, puis 0,30 $/million [VÉRIFIÉ https://developers.cloudflare.com/workers/platform/pricing/] ; coût de gestion des secrets et de la rotation |
| **E. Jeton de capacité émis par le partenaire** (modèle BDT) | Le partenaire signe un jeton (match, cible, expiration) et le met dans le lien. Le compteur le **transporte** sans le comprendre et le renvoie, puis le serveur partenaire le valide | Aucun secret dans le compteur ; c'est déjà possible en `v=1` (paramètres conservés dans l'URL de retour). BDT le fait déjà (QR signé, spec 042) | Ne protège pas contre un faux score saisi par les joueurs (seule la validation humaine ou la remontée en direct y répond) | 0 € côté compteur |
| **F. Intégration en ligne authentifiée (API)** | Le compteur parle à une API (BDT ou plateforme) : session, événements idempotents, remontée en direct | Couvre l'idempotence, le direct et le wallboard | Exige des comptes et des secrets. **Ne doit pas** vivre dans le compteur seul (frontière CONTRIBUTING et constitution transverse §4) : c'est le rôle du contrat `001-xrepo` porté par BDT | Hébergement BDT (Fly.io + PostgreSQL), hors compteur |
| **G. Iframe ou `postMessage` bidirectionnel** (partenaire qui embarque le compteur) | Le partenaire affiche Bougnat en iframe | Intégration très fluide | Contraire à la CSP (`frame-ancestors 'none'`), risque de clickjacking, perte d'identité visuelle. **Déconseillé** | 0 € |

### 5.2 Recommandation argumentée

1. **Pour v2.0.0 : option A.** Figer `v=1`, documenter la politique de compatibilité (paramètres additifs autorisés, changement incompatible = nouvelle version, comme le dit déjà CONTRIBUTING l. 24) et corriger les divergences D1 à D3. Coût nul, et le partenaire en production est protégé.
2. **Option E à promouvoir dans le guide** comme *la* réponse à la question « signature ». Le compteur n'a pas besoin de secret si le partenaire émet un jeton opaque et le vérifie ; c'est le même modèle que BDT. L'option D reste écartée, ce qui est cohérent avec la décision du 2026-11-19.
3. **Option B à déclencher seulement au 2ᵉ canal accepté** (règle des deux usages, constitution transverse §6 « ports/adapters quand ils réduisent vraiment le couplage »). Candidats :
   - le QR de retour (V2-INT-04), qui ne demande pas de nouveau contrat ;
   - un adaptateur BDT (V2-INT-07).
   
   Découpage minimal proposé :
   - `src/features/external-match/contract/v1/{inbound,outbound}.ts` (parsing et construction d'URL) ;
   - `src/features/external-match/linkedMatch.ts` (modèle neutre, gardes `matchFollowsExternalLink`, TTL) ;
   - `src/features/external-match/linkedMatchResult.ts` (projection `MatchState` → résultat, y compris `Turn[]` → volées) ;
   - `src/app/useLinkedMatch.ts` (extraction de `App.tsx`).
   
   Pas de nouvelle dépendance.
4. **Option C à garder en réserve** (V2-INT-05) jusqu'à une demande partenaire réelle de Cricket, de détail des volées ou de retour vers l'ouvreur. Le retour d'expérience de badarts.fr (V2-INT-02) décidera s'il faut la déclencher.
5. **Option F : responsabilité de BDT.** Le compteur n'implémentera un adaptateur en ligne qu'en consommant un contrat `001-xrepo` spécifié des deux côtés : commandes, événements, erreurs, autorisation, mode hors ligne.

### 5.3 Entrant / sortant

- **Entrant** (Bougnat consomme) :
  - match poussé par URL (`v=1`, en place) ;
  - plus tard, session de cible BDT (jeton QR signé) ;
  - **pas** de récupération active chez des tiers (pas d'API ouverte utilisable sans secret ni contact).
- **Sortant** (Bougnat expose) :
  - « scoring en tant que service » sans état, par lien (en place) ;
  - plus tard : résultat par QR, fichier ou ouvreur, puis remontée en direct vers BDT.
- **Ce que Bougnat ne doit pas exposer :** une API serveur propre, des comptes, de l'hébergement de données de joueurs. Ce serait contraire à la gratuité sans compte et à la frontière avec BDT.

### 5.4 Respect de la Clean Architecture

- Les adaptateurs partenaires ne contiennent aucune règle de jeu : le résultat dérive toujours du `MatchState` du moteur.
- Le port neutre ne dépend ni de React ni du DOM.
- Les canaux (URL, QR, ouvreur, fichier) sont des adaptateurs d'infrastructure ou de présentation.
- Un futur support du Cricket exige une projection `CricketMatchSummary` → `LinkedMatchResult` côté application, et non une ré-implémentation des règles dans l'adaptateur.

---

## 6. Problèmes, dettes et incohérences (avec gravité)

| # | Sujet | Gravité | Réf. |
|---|---|---|---|
| P1 | Notes de version et carte de couverture v2.0.0 non alignées avec l'activation de badarts.fr (D2, D3) | **Moyenne** : contrat public | §2.9 |
| P2 | Pas de test de bout en bout avec le vrai partenaire avant la publication de v2.0.0 [À CONFIRMER] | **Moyenne** | coverage-map l. 32 |
| P3 | Non-régression voix + match lié et (futur) TV + match lié non couverte | Moyenne | §4 |
| P4 | Le partenaire contourne la limite du même onglet par `BroadcastChannel`, qui ne marche pas d'un appareil à l'autre ; l'expérience multi-appareil se dégrade en saisie manuelle | Moyenne (UX club) | §2.7 |
| P5 | `App.tsx` porte environ 25 lignes d'état et de callbacks du match lié | Faible (dette de lisibilité ; à coordonner avec l'agent structure) | §2.1 |
| P6 | `ExternalMatchConfig` est propre au X01 dans la session persistée : extension multi-jeux coûteuse | Faible tant que X01 seul | `persistedAppSession.ts` l. 13 |
| P7 | Libellé « Match de tournoi » en dur, français seul | Faible | `externalMatchLabels.fr.ts` l. 15 |
| P8 | Guide partenaire sans variante « nouvel onglet + relais » ni recommandation sur le jeton de capacité (option E) | Faible | guide §Sécurité |
| P9 | RGPD : les noms des joueurs transitent en clair dans l'URL (historique du navigateur, journaux éventuels). Cloudflare Web Analytics est actif ; que la balise capture ou non la chaîne de requête **avant** le nettoyage de la barre d'adresse est [À CONFIRMER] | Faible à moyenne | `public/_headers`, `App.tsx` l. 125 |
| P10 | Politique d'admission d'une origine partenaire non formalisée (critères, révocation, contact RGPD) | Faible | guide « Demandez l'ajout » |
| P11 | La tâche « Run the full Playwright suite on the v2.0.0 release branch » reste ouverte | Moyenne (publication) | tasks.md |

---

## 7. Propositions de spécifications

| ID | Titre | Origine | Description | Valeur | Cplx | Prio | Dépendances / spec existante |
|---|---|---|---|---|---|---|---|
| **V2-INT-01** | Clôture publiable du contrat `v=1` | Backlog existant + Documentation | **Enrichir la spec 030**, sans nouvelle spec : cocher ou ajuster les tâches (D1) ; mettre à jour `docs/release/v2.0.0.md` et la carte de couverture (badarts.fr actif, essai réel) ; aligner la variable GitHub ; ajouter une politique de compatibilité (« paramètres additifs ») et une section « jeton de capacité émis par le partenaire » (option E) ; ajouter la variante « nouvel onglet + relais » au guide ; ajouter des scénarios e2e de non-régression « voix sur match lié » (et TV plus tard) | Sécurise la 1ʳᵉ publication d'un contrat public consommé | S | **P0** | Spec 030 (enrichir), spec 031 (PWA, indépendante) |
| **V2-INT-02** | Retour d'expérience du partenaire badarts.fr | Étude exploratoire | Avec l'autorisation du PO, interroger badarts.fr : usage réel (même appareil ou non), besoin de sets, de Cricket, de détail des volées, d'un retour vers l'ouvreur, d'un libellé ; satisfaction ; lien avec DartsHub | Décide de V2-INT-04/05 sur des faits | S | P1 | Autorisation de contact (D2) |
| **V2-INT-03** | Port neutre « match lié » et extraction de l'orchestration | Reco archi | Option B : modèle `LinkedMatchRequest/Result`, adaptateurs v1 séparés, hook `useLinkedMatch`, union discriminée par `game` pour le contexte persistant. **Comportement inchangé** (non-régression : les 28 scénarios e2e, tous les tests unitaires). À **déclencher seulement** quand V2-INT-04 ou V2-INT-07 est accepté | Évite de dupliquer gardes et parsing ; prépare le multi-canal | M | P2 | V2-INT-04 ou 07 ; coordination avec l'agent structure (5.9) |
| **V2-INT-04** | Retour multi-appareil par QR code | Innovation / Étude exploratoire | Sur l'écran de fin d'un match lié, afficher **en plus** du bouton un QR code de l'URL de retour (même URL et mêmes garanties `v=1`). L'organisateur la scanne avec son propre appareil. Sans backend ni changement de contrat. `qrcode` est déjà une dépendance, mais seulement au build (`scripts/generate-app-qr.mjs`) : l'embarquer côté client a un coût en poids à mesurer, l'alternative étant un QR SVG minimal | Lève L4 pour les clubs (cible ≠ table de marque) | S-M | P2 | V2-INT-02 (validation du besoin) ; décision D5 |
| **V2-INT-05** | Contrat de lien `v=2` (étude) | Étude exploratoire | Étudier, sans implémenter : `game=cricket` ; `ret=opener` (`window.opener.postMessage` avec `targetOrigin` = origine autorisée, repli en navigation) ; `detail=visits` (projection `Turn[]` compacte) ; `label` ; règles de coexistence avec v1 ; limites de longueur d'URL ; menaces (ouvreur usurpé : `targetOrigin` strict) | Prépare l'extension multi-jeux et la variante « nouvel onglet » | M | P3 | V2-INT-02, V2-INT-03, chantier jeux (5.5) |
| **V2-INT-06** | Carte de résultat et export local d'un match | Innovation | En fin de match (lié ou non) : résumé lisible pour retranscription (format, score, manches/sets, moyenne, 180, meilleur checkout, durée) ; partage natif (Web Share) ou téléchargement JSON/CSV **local**, sans serveur. Sert les cas 3K, DfW et DartConnect par saisie manuelle | Utilité immédiate dans les clubs qui utilisent déjà une plateforme | S-M | P2 | Statistiques existantes ; chantier UX/TV ; RGPD (données sur l'appareil seulement) |
| **V2-INT-07** | Contrat inter-dépôts compteur ↔ BDT (cadrage) | Backlog existant (`001-xrepo-scoring-contract-v1`) + Étude exploratoire | Cadrer, dans le workspace, la coexistence de `v=1` (public, léger) et du contrat BDT : jeton QR signé par BDT, session, `client_event_id`, correspondance `Turn` → `ScoreVisit`, snapshot wallboard comme source TV ; mode hors ligne (`005-counter-offline-scoring-session-store`). Le compteur reste sans secret | Évite deux vérités et deux contrats divergents | L | P2 | Backlog workspace 001/004/005 ; spec BDT 042 ; constitution transverse §5 |
| **V2-INT-08** | Politique d'admission et de révocation des partenaires | Documentation | Critères (https, mentions légales, contact RGPD, validation humaine obligatoire, jeton recommandé) ; procédure (PR `wrangler.jsonc` préprod puis production) ; révocation ; registre public des partenaires (README) ; règle sur l'affichage de l'identité du partenaire | Transparence et sécurité ; prépare DartsHub ou Labo | S | P2 | V2-INT-01 |
| **V2-INT-09** | Programme de prises de contact écosystème | Étude exploratoire (partenariat) | Après autorisation, contacter dans l'ordre : badarts.fr / DartsHub → La Bomabull → DartConnect (seulement si BDT porte le besoin) → 3K Darts → DfW. Livrables : questionnaire type (API, CGU, coûts, RGPD, intérêt), compte rendu par plateforme, mise à jour des fiches §3 | Transforme les « nécessite prise de contact » en faits | S | P3 | Décision D2 |
| **V2-INT-10** | Libellés de match lié génériques | Reco UX/UI | Remplacer « Match de tournoi » par un libellé neutre (« Match organisé par {host} »), ou par le `label` du partenaire (v2) avec une protection contre l'usurpation (le domaine reste toujours affiché) | Évite un contresens pour une ligue ou l'entraînement | S | P3 | Design system / i18n ; V2-INT-05 pour `label` |
| **V2-INT-11** | Étude « source de score externe » (caméras type Scolia) | Étude exploratoire | Évaluer un port d'entrée de score commun à la voix, au clavier et aux caméras. Hors des 4 plateformes, à relier au chantier voix | Différenciant pour les bars et clubs équipés | M | P3 | Chantier voix (5.1) ; contact Scolia |

**Specs existantes concernées :**
- **030** : à enrichir (V2-INT-01), pas à remplacer.
- **031** (PWA) : indépendante, mais la recommandation « onglet de navigateur plutôt qu'app installée » du guide reste valable.
- Aucune spec du dépôt n'est à abandonner.

---

## 8. Décisions nécessitant l'arbitrage du product owner

| # | Décision | Options | Recommandation |
|---|---|---|---|
| D1 | Statut du contrat `v=1` pour v2.0.0 | (a) figé, avec ajouts optionnels sans changement de version ; (b) figé strict | (a), documenté (V2-INT-01) |
| D2 | **Autoriser les prises de contact** | badarts.fr/DartsHub, Labo MaBULL, DartConnect, 3K, DfW | Autoriser au minimum badarts.fr (déjà partenaire) et Labo MaBULL ; différer DartConnect, 3K et DfW |
| D3 | Reconfirmer « pas de backend d'intégration dans le compteur » ; l'intégration authentifiée passe par BDT | oui / non | Oui (cohérent avec la décision du 2026-11-19, CONTRIBUTING et la constitution transverse) |
| D4 | Multi-jeux pour les liens partenaires (Cricket) en V2 ou plus tard | V2 / V2.x / jamais | Plus tard, sur demande d'un partenaire (V2-INT-02) |
| D5 | Retour par QR code : accepter d'embarquer un générateur QR côté client | `qrcode` existant / générateur minimal / non | Étudier le poids, puis décider (V2-INT-04) |
| D6 | Politique d'admission des partenaires : qui décide, quels critères, registre public | — | Formaliser (V2-INT-08) |
| D7 | Personnalisation : afficher un libellé ou une marque du partenaire sur un match lié ? | non / libellé texte / logo | Libellé texte avec le domaine toujours visible ; pas de logo (risque d'usurpation, identité Bougnat) |
| D8 | Lever `frame-src 'none'` pour afficher des iframes tierces (3K) dans un mode TV | non / oui | **Non** : sécurité, publicité tierce possible, identité |
| D9 | Ordre de priorité entre V2-INT-04 (QR), V2-INT-06 (carte de résultat) et V2-INT-05 (v2) | — | 06 et 04 avant 05 |

---

## 9. Bénéfices, contraintes, risques

- **Bénéfices :**
  - L'axe « Bougnat pour les partenaires » repose sur un mécanisme existant, sobre et gratuit.
  - Les ajouts proposés (QR, carte de résultat) servent aussi les clubs qui utilisent déjà DfW, 3K ou DartConnect, sans dépendre de leur bon vouloir.
  - Le parcours de base reste intact : tout le dispositif est inactif sans paramètre.
- **Contraintes :** pas de secret dans le bundle public, CGU tierces strictes (DartConnect), refus d'API (3K), outils payants ou de bureau (DfW).
- **Risques :**
  - (R1) Casser badarts.fr par un changement de contrat : contre-mesure, figer v1 et passer par des tests de contrat.
  - (R2) Glissement vers un backend dans le compteur : contre-mesure, D3.
  - (R3) Présenter une intégration de plateforme comme acquise alors qu'aucune n'est documentée pour le score : contre-mesure, la matrice §3.6.
  - (R4) Données personnelles dans les URL : contre-mesure, P9 et V2-INT-08.
  - (R5) Dépendance à un partenaire unique et à un projet individuel (Labo) : à prendre en compte avant d'investir.

---

## 10. Limites de l'analyse

- `web_fetch` était inopérant (proxy). Les pages ont été lues par `curl` et nettoyées à la main. Les SPA (3K portal, DartConnect API, Labo) ont été lues via leurs bundles publics ou leurs données de page, ce qui donne une vision partielle du contenu.
- Les contenus des CGU de 3K Darts et de La Bomabull, et ceux de DfW s'ils existent, n'ont pas pu être lus [À CONFIRMER].
- L'analyse de badarts.fr repose sur du JavaScript minifié du 2026-11-20 et peut évoluer. Aucun test réel de bout en bout n'a été mené (interdiction de contacter et lecture seule).
- Les tests du compteur n'ont pas été exécutés (risque d'écriture de cache). Les taux de couverture cités viennent de la documentation.
- Survol seulement de BDT : spec 042, configuration et domaine runtime. Aucun audit des autres modules.
- Les coûts tiers (tarifs DartConnect, 3K, DfW) sont ceux publiés au 2026-11-20 et sont susceptibles de changer.
- Aucune hypothèse n'a été faite sur une API non documentée. Les endpoints internes rencontrés (`score_proxy.php` de DfW, données Inertia de Labo) sont signalés pour mémoire et **ne doivent pas être utilisés**.
