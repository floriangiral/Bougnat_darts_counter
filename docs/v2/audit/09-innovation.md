> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Rapport 09 — Innovation produit et veille concurrentielle (chantier 5.11 + vision produit §6)

- Agent : « Innovation et veille concurrentielle » — préparation V2 Bougnat Darts.
- Date d'analyse et de consultation des sources externes : **20 novembre 2026**.
- Repository analysé en **lecture seule** : `../ (workspace) Bougnat_darts_counter`, branche `feat/v2.0.0` (HEAD `508dfa6`). Aucun fichier du repo modifié.
- Méthode web : `web_fetch` indisponible (échec du proxy) ; pages récupérées avec `curl` + extraction de texte, et recherche via DuckDuckGo HTML. Les extraits cités proviennent des pages officielles listées (consultées le 20/11/2026).

### Légende des niveaux de vérification

| Marqueur | Signification |
|---|---|
| **[VÉRIFIÉ code]** | Constaté dans le code du repo (chemin:ligne). |
| **[VÉRIFIÉ ext.]** | Constaté sur la page officielle du produit (URL citée, consultée le 20/11/2026). |
| **[VÉRIFIÉ tiers]** | Constaté sur une source tierce (ex. : comparatif publié par un concurrent, donc potentiellement biaisé). |
| **[EXTRAIT MOTEUR]** | Seulement vu dans l'extrait d'un moteur de recherche, page non lue en entier. |
| **[NON TROUVÉ]** | Cherché dans les pages consultées sans le trouver. **Cela ne prouve pas que la fonctionnalité n'existe pas.** |
| **[HYPOTHÈSE]** / **[À CONFIRMER]** | Raisonnement ou estimation non vérifiés. |

> Règle appliquée : aucune fonctionnalité n'est présentée comme « inédite ». Au mieux, elle est notée « non trouvée parmi les N concurrents consultés ».

---

## 1. Périmètre et fichiers analysés

**Produit (code)**
- `README.md`, `docs/product-scope.md`, `docs/release/v2.0.0.md`, `specs/015-…/spec.md`, `specs/030-counter-external-match-link/spec.md`.
- `App.tsx`, `views/HomeView.tsx`, `views/GameSelectionView.tsx`, `views/SetupView.tsx` (survol), `views/StatsView.tsx`, `views/MatchView.tsx` (flux vocal).
- `src/app/useGameLifecycle.ts`, `src/infrastructure/local/IndexedDBSessionRepository.ts`, `src/infrastructure/local/sessionPersistence.ts`, `src/shared/session/persistedAppSession.ts`.
- `src/application/scoring/matchStats.ts`, `src/domain/x01Bot/x01Bot.ts`, `src/application/x01Bot/x01BotTurn.ts`.
- `src/features/x01/voice/*` (`voiceConfig.ts`, `voiceProposalModel.ts`, `VoiceScoringControl.tsx`, `dartsSpeechTypes.ts`, `dartsSpeechParserIntent.ts`, `useDeepgramStreaming.ts`).
- `src/features/x01/scoring/matchFeedback.ts`, `components/game/CheckoutHint.tsx`, `components/game-setup/SetupRulesModal.tsx`, `utils/capitalLogic.ts`, `src/features/game-setup/setupModel.ts`.
- `src/features/app-install/installPromptModel.ts`, `src/features/external-match/*` (survol), `public/_headers`, `wrangler.jsonc`, `package.json`.
- Issues GitHub #45, #46, #47, #48, #49 (`gh issue view`).
- Site vitrine externe `bougnatdarts.fr` (hors repo) pour vérifier la cohérence du discours.

**Concurrents consultés (20/11/2026)** : Autodarts, DartCounter (+ portail de demandes), n01 / n01darts.com, Voice Darts (extension n01), Dartsmind, Scolia, My Dart Training, Target (Omni), DartConnect, Darts for Windows, Lidarts, The Darts App (thedarts.app), Darts Scorer 180, MyDarts, Dartcaster, Darts Score Handsfree, DartSociety (FR), FrenchDarts (FR), « Fléchettes – Score » (FR, extrait moteur). Les apps PDC n'ont pas pu être vérifiées directement (voir §12).

---

## 2. Analyse du produit existant

### 2.1 Constats

| # | Constat | Référence | Niveau |
|---|---|---|---|
| P1 | Parcours de base très court : Accueil → « Lancer une partie » → choix du jeu → setup → partie. Aucun compte, aucune pub. | `views/HomeView.tsx` (`onQuickGame`), `App.tsx` (écrans `HOME` / `GAME_SELECTION` / `SETUP`) | [VÉRIFIÉ code] |
| P2 | 6 jeux : X01, Triathlon, Cricket, Capital, Gotcha, Killer. **Capital** (17 cibles « La Suite », « 3 à côté », « La Couleur »…) et **Triathlon** (Capital → Cricket → 501) relèvent de la culture des bars français. | `views/GameSelectionView.tsx:21-28`, `utils/capitalLogic.ts:3-25`, `src/domain/triathlon/` | [VÉRIFIÉ code] |
| P3 | Limites de joueurs : X01 simple **2 joueurs max** (doubles 2×2), Cricket 3, Triathlon 2, Killer/Gotcha 6, Capital 4. La spec 015 n'indique pas la raison produit de la limite X01. | `src/features/game-setup/setupModel.ts:59-65`, `specs/015-…/spec.md` | [VÉRIFIÉ code] |
| P4 | Bot X01 seulement, 5 niveaux (Amateur 30-40 → Pro 86-120 de moyenne), prénoms « [BOT] Alice »… Probabilité de checkout par niveau (0,08 → 0,72). | `src/domain/x01Bot/x01Bot.ts:11-17`, `src/application/x01Bot/x01BotTurn.ts` (`getCheckoutProbability`) | [VÉRIFIÉ code] |
| P5 | Statistiques X01 détaillées et de bon niveau : moyenne 3 fléchettes, First 9, moyenne hors checkout, % checkout par nombre de fléchettes, meilleur/pire leg, comptes 60+…180. | `src/application/scoring/matchStats.ts:13-31` | [VÉRIFIÉ code] |
| P6 | L'écran de fin de match revient **automatiquement à l'accueil après 2 minutes** (sauf match lié) : les stats sont perdues de vue, sans possibilité de les emporter. | `views/StatsView.tsx:30-36` | [VÉRIFIÉ code] |
| P7 | **Historique local écrit mais jamais affiché** : chaque fin de partie est enregistrée (`saveFinishedMatchLocally`, `saveLocalGameHistoryEntry`), mais `listLocalGameHistory` n'est appelé que par les tests. Le store IndexedDB `match_history` n'est pas plafonné (seul le fallback localStorage est limité à 50). | `src/app/useGameLifecycle.ts:89-170`, `IndexedDBSessionRepository.ts:129-165`, `sessionPersistence.ts:30` | [VÉRIFIÉ code] |
| P8 | Scoring vocal X01 en français (Deepgram Nova-3, `language: 'fr'`, mots-clés « bulle », « demi bulle », « manque »…), avec 3 intentions : score de volée, **score restant** et **séquence de fléchettes**. | `voiceConfig.ts:2-34`, `dartsSpeechTypes.ts:8` | [VÉRIFIÉ code] |
| P9 | Le vocal **n'est pas mains libres** : un appui sur le micro par volée (écoute ≤ 6,5 s), puis la proposition pré-remplit la saisie et doit être **validée par un second appui**. | `views/MatchView.tsx:186-208, 375-385, 509-525`, `voiceConfig.ts:1` | [VÉRIFIÉ code] |
| P10 | **Aucune sortie sonore** : pas de `speechSynthesis`, pas de sons, pas de vibration. Le retour est uniquement visuel (« Belles Fléchettes! », « Bust »…). | recherche `speechSynthesis|Audio(|vibrate` négative ; `matchFeedback.ts:3-45` | [VÉRIFIÉ code] |
| P11 | Partage de l'app : un QR code statique (généré au build) ouvre l'URL de l'app. Rien pour partager une partie, une config ou des stats. | `views/HomeView.tsx:41-44`, `scripts/generate-app-qr.mjs` | [VÉRIFIÉ code] |
| P12 | Lien de match externe (spec 030) : contrat d'URL versionné, setup X01 verrouillé, résultat renvoyé par simple navigation, **sans backend**. C'est un mécanisme **réutilisable** pour d'autres usages (station, défis, mini-tournois). | `specs/030-…/spec.md`, `src/features/external-match/externalMatchLink.ts` | [VÉRIFIÉ code] |
| P13 | Installation PWA : bouton présent, mais `manifest.json` et `sw.js` ne sont pas livrés au build (connu, spec 031). | `src/features/app-install/installPromptModel.ts`, `docs/release/v2.0.0.md` (Points connus) | [VÉRIFIÉ code + doc] |
| P14 | Pas de Wake Lock, pas de Web Share, pas de `BroadcastChannel`. Une tablette posée près de la cible peut se mettre en veille. | recherche `wakeLock|navigator.share|BroadcastChannel` négative | [VÉRIFIÉ code] |
| P15 | Règles : modale de règles textuelles au setup ; aide de finish via une table statique `CHECKOUT_GUIDE`. Aucun accompagnement en cours de partie pour un débutant. | `components/game-setup/SetupRulesModal.tsx`, `constants.ts:3`, `components/game/CheckoutHint.tsx` | [VÉRIFIÉ code] |
| P16 | Aucun mode d'entraînement (Tour de l'horloge, Bob's 27, 121…) : c'est le principal manque fonctionnel face à **tous** les concurrents consultés. | `utils/arenaFlow.ts:1` (`GameType` = 6 jeux) | [VÉRIFIÉ code] |
| P17 | Mesure d'audience : seul un jeton Cloudflare Web Analytics, optionnel et sans cookie, est prévu. Il n'existe aucune télémétrie produit : l'adoption d'une fonctionnalité ne pourra pas être mesurée finement sans décision explicite. | `src/lib/env.ts:7,46`, `public/_headers` (CSP `cloudflareinsights`) | [VÉRIFIÉ code] |
| P18 | Issues terrain : #45 (suivre un match depuis un autre écran), #46 (stats de fin par QR), #47 (QR dans le résumé de setup) et #48 (identifiant unique de partie) ont été **fermées NOT_PLANNED le 24/04/2026**. #49 (auto-scoring vocal) est fermée COMPLETED. | `gh issue view 45..49` | [VÉRIFIÉ] |

### 2.2 Ce qui est déjà différenciant (et à quel niveau)

1. **La combinaison des valeurs** : gratuit, sans pub, sans compte, sans limite, open source (MIT), en français, dans le navigateur. Seuls **Lidarts** (open source, sans pub, mais compte requis et usage en ligne) et **The Darts App** (sans pub, sans compte pour commencer, mais offres lieux et ligues payantes dès 2027) s'en approchent. Aucun concurrent consulté ne réunit l'ensemble. [VÉRIFIÉ ext. pour chaque concurrent cité, voir §3]
2. **Le vocal en français avec une sémantique fléchettes** : « il me reste 32 », séquences de fléchettes, « bulle », « manque ». D'autres apps ont une saisie vocale (voir §3), mais aucune page consultée ne revendique une compréhension du **score restant** ou des séquences en français. Niveau : [NON TROUVÉ] ailleurs, vérification partielle.
3. **Les jeux de comptoir français** : Capital, et surtout Triathlon (Capital + Cricket + 501). Capital existe aussi chez **DartSociety** (« Le Capital ») [VÉRIFIÉ ext.]. Triathlon n'a été trouvé chez aucun des concurrents consultés [NON TROUVÉ].
4. **Le lien partenaire sans backend (030)** : approche rare et élégante. Les concurrents intègrent tournois et ligues dans leur propre plateforme, avec compte (DartConnect, n01, The Darts App).
5. **L'ancrage terrain** : le site `bougnatdarts.fr` montre que Bougnat Darts organise aussi des tournois et des événements, « de la partie entre amis aux tournois de plusieurs centaines de joueurs », à Clermont-Ferrand [VÉRIFIÉ ext. https://bougnatdarts.fr/]. C'est un **terrain d'expérimentation réel** pour les fonctionnalités événementielles, et un atout qu'aucune app « pure logicielle » n'a.

### 2.3 Manques notables (non différenciants, mais visibles)
Pas de caller, pas de TV, pas d'historique consultable, pas d'entraînement, bot limité à X01, X01 simple limité à 2 joueurs, vocal limité à X01 et non mains libres, PWA non installable en production.

---

## 3. Veille concurrentielle

### 3.1 Fiches synthétiques (sources consultées le 20/11/2026)

**Autodarts** — https://autodarts.io/ [VÉRIFIÉ ext.]
- Auto-scoring par caméra : « Lens » (téléphone ou tablette) et matériel (Autodarts X à 4 caméras HD). 13 modes de jeu, bot, jeu en ligne, tournois, « AI referee ».
- Offre gratuite : Lens limité à 5 matchs par mois, stats de base, **voice caller**, tournois en ligne, 11 modes. Offre Plus : 5,99 £/mois ou 59,99 £/an (Lens illimité, caller premium Huw Ware, création de tournois, Killer/121, fléchettes personnalisées).
- Compte : « One account and one set of stats » (compte implicite). Saisie vocale et TV : [NON TROUVÉ].

**DartCounter** — https://dartcounter.net/, FAQ, fiche Google Play [VÉRIFIÉ ext.]
- 1,5 M de joueurs actifs revendiqués, plus de 10 jeux d'entraînement, DartBot, jeu en ligne, Ranked (caméra requise), tournois, connexion au Target Omni. **Caller** (« MasterCaller » : John McDonald sur le site, Ray Martin sur Google Play).
- Freemium : 3 matchs en ligne par semaine, 8 modes, une seule partie précédente consultable. Ultimate : 29,99 à 39,99 $/an [VÉRIFIÉ tiers, thedarts.app].
- Compte : « You can use DartCounter without an account for basic scoring ».
- **Signaux marché clés** sur le portail de demandes de DartCounter :
  - #332 **« speech-to-score »** : **550 votes**, statut « Planned/Future plan » depuis environ 4 ans (https://requests.dartcounter.net/332).
  - #333 **« Cast your game to a TV »** : **741 votes**, « Planned/Future plan » depuis environ 4 ans ; un utilisateur propose le recopiage d'écran comme solution de contournement (https://requests.dartcounter.net/333).
  - [VÉRIFIÉ ext.] **La voix en entrée et la TV sont des attentes fortes et anciennes que le leader n'a pas satisfaites.**

**n01 (Nakka) / n01darts.com** — https://nakka.com/n01/, https://en.n01darts.com/, https://en.n01darts.com/pricing/ [VÉRIFIÉ ext.]
- Scoreur web et Windows gratuit, jeu en ligne, n01 Live. Système de tournois et de ligues : plus de 200 000 tournois, 3,3 M de participations.
- Tournois gratuits jusqu'à 64 joueurs **avec publicité**, puis abonnement de 10 à 90 $/mois ou 1 $ par joueur. **API** payante pour l'écriture (25 $/mois) ; lecture publique gratuite.
- Saisie vocale uniquement via l'extension tierce **Voice Darts** (Chrome, gratuite, 32 langues dont le français, problème connu sur les nombres de 1 à 9) [VÉRIFIÉ ext. https://chromewebstore.google.com/detail/voice-darts/ddhakfmfbeeeajonamdnceanogbfmiec].

**Dartsmind** — https://www.dartsmind.com/ [VÉRIFIÉ ext.]
- Auto-scoring par la caméra arrière du téléphone, **IA exécutée sur l'appareil** (hors ligne, confidentialité), mode à deux appareils, lobby en ligne, bot, plus de 25 jeux (dont Gotcha, Killer). Prix [À CONFIRMER]. Voix et TV : [NON TROUVÉ].

**Scolia** — https://scoliadarts.com/ [VÉRIFIÉ ext.]
- Matériel d'auto-scoring (Home, Home 2, **Pro « ideal for bars and venues »**), annonce des scores en temps réel (Mastercaller), heatmaps, tournois.
- L'app tourne dans le navigateur sur « smartphone, tablette, PC ou TV », avec connexion obligatoire (« log in and start playing »).
- « Scolia Social » (divertissement pour pubs, à venir), « Club Sponsorship », API. Modèle : vente de matériel + offre « FLEX » [À CONFIRMER].

**My Dart Training** — fiche Google Play `at.steirersoft.mydarttraining` [VÉRIFIÉ ext.]
- Orientée entraînement (plus de 20 exercices, CPU à 15 niveaux), multijoueur sans limite de joueurs, **caller (Kirk Bevins)**, sauvegarde Google Drive. Modèle et voix en entrée : [NON TROUVÉ].

**Target (Omni)** — https://www.targetdarts.com/us/omni-unlocks [VÉRIFIÉ ext.]
- Auto-scoring matériel couplé à DartCounter. « Target Live » et « Target Arcade » (jeux festifs) gratuits jusqu'en février 2027 pour les acheteurs d'Omni.

**DartConnect** — https://www.dartconnect.com/ [VÉRIFIÉ ext.]
- « Official Scoring App of the PDC », partenaire WDF. Ligues, événements, **location de tablettes**, DCTV (diffusion, alertes fans, classements), VideoConnect.
- Premium 36 $/an ; ligues facturées par équipe [VÉRIFIÉ tiers, thedarts.app].

**Darts for Windows** — https://www.dartsforwindows.com/ [VÉRIFIÉ ext.]
- Logiciel Windows : tournois, ligues, live scoring, imports CSV, possibilité d'utiliser les sons du jeu PDC. Version d'essai bridée, donc licence payante.

**Lidarts** — https://lidarts.org/ [VÉRIFIÉ ext.]
- « Open-source, forever free », « No costs, no ads, no trackers » ; jeu en ligne avec ou sans webcam. Inscription nécessaire pour jouer en ligne.

**The Darts App** — https://thedarts.app/, https://thedarts.app/pubs-and-clubs, https://thedarts.app/darts-app-comparison [VÉRIFIÉ ext.]
- **Concurrent le plus proche en valeurs** : « Free for players, no ads », « no account needed to start » (les parties sans compte sont supprimées après 30 jours sans jeu). 26 jeux, dont Gotcha et Killer. **Caller** (« reads out each score, like the referee on TV »). Bots de 20 à 110 de moyenne, avec styles et « mirror bot ».
- Tournois gratuits (compte requis pour l'organisateur) avec tableau en direct. Ligues à 249 $/an et **offre lieu à 199 $/an et par lieu à partir du 1er janvier 2027** : inscription par QR code, tablette par cible, **tableau affiché sur la TV du bar**, comptes staff.
- Pas d'entrée vocale : « you tap in each dart or visit ».

**Darts Scorer 180** — https://dartsscorer.app/en, fiche Google Play `io.pawelsas.dartsscorer` [VÉRIFIÉ ext.]
- « No account, no setup », hors ligne, tous les jeux gratuits. **Saisie vocale** en X01, Elimination et 121.
- **Live Mode** : code à 6 chiffres sur `dartsscorer180.live` pour afficher le match « on any phone, tablet, laptop or TV with a browser ».
- QR code pour comptabiliser ses parties sur le téléphone d'un ami (compte requis).
- **Publicité dans la version gratuite**. Pro à 9,49 $/an (sans pub, Live Mode illimité, bot illimité). Langues de la reconnaissance vocale [À CONFIRMER].

**MyDarts** — https://mydarts.co.uk/faq.html [VÉRIFIÉ ext.]
- Web, **voice-first** (« just speak your score »), positionné contre les solutions caméra coûteuses. Gratuit pour le 501 et quelques modes, Premium à 9,99 £/an (tous les modes, coaching IA). Inscription. Anglophone [HYPOTHÈSE : reconnaissance optimisée pour l'anglais].

**Dartcaster** — App Store `id6833950782` [VÉRIFIÉ ext.]
- iPhone : caméra sur trépied (traitement sur l'appareil) et **tableau de score « broadcast-style » sur la TV via Chromecast**. « Scoring by hand is always free, with no ads. » Achats intégrés.

**Darts Score Handsfree** — fiche Google Play `nl.selwyn420.dartscorevoicecontrolled` [VÉRIFIÉ ext.]
- Auto-scoring IA par caméra, saisie par fléchette, **reconnaissance vocale**, **« Cast your game »**, bot, équipes, jeu en ligne.

**DartSociety (FR)** — https://dartsociety.fr/ [VÉRIFIÉ ext.]
- Français, « 100 % gratuite », « Sans pub, sans abonnement obligatoire ». **« Scores annoncés à la voix » (caller)** et son « Game On ».
- Bot à 10 niveaux, X01, 5 variantes de Cricket, Killer, Shanghai, **Le Capital**, Halve It, Bob's 27. Réseau social, jeu en ligne avec caméra.
- « Bientôt sur Android et iPhone ». Compte probable (profil, amis) [À CONFIRMER].

**FrenchDarts (FR)** — https://frenchdarts.fr/ (métadonnées seulement) [VÉRIFIÉ ext. partiel]
- « 100 % gratuite », 501/301/701/901 et Cricket, bot, jusqu'à 8 joueurs, « animations de victoire ».

**« Fléchettes – Score » (Android, `it.mic.freccette`)** [EXTRAIT MOTEUR]
- Saisie par image de cible, grille ou **commandes vocales**.

**Apps PDC** : non vérifiées (recherche infructueuse). DartConnect se présente comme l'app de scoring officielle de la PDC [VÉRIFIÉ ext.].

### 3.2 Tableau comparatif

Légende : ✅ oui ; ❌ non ou non proposé ; ◐ partiel ou limité ; ? non trouvé ou à confirmer.

| App | Plateformes | Gratuit / modèle | Pub | Compte obligatoire | Saisie vocale | Caller (voix qui annonce) | TV / 2e écran | Perso club/bar | Tournois | Source principale |
|---|---|---|---|---|---|---|---|---|---|---|
| **Bougnat Darts** | Web (PWA non livrée) | ✅ 100 % gratuit, MIT | ❌ | ❌ | ◐ FR, X01, 2 appuis par volée | ❌ | ❌ | ❌ | ❌ (lien partenaire 030) | code |
| Autodarts | Web, iOS, Android + matériel | Freemium, Plus 5,99 £/mois | ? | ✅ (implicite) | ? | ✅ (gratuit + premium) | ? | ◐ (fléchettes perso) | ✅ | autodarts.io |
| DartCounter | iOS, Android, web | Freemium, Ultimate ~30-40 $/an | ? | ❌ pour le scoring de base | ❌ (demande #332, 550 votes) | ✅ MasterCaller | ❌ (demande #333, 741 votes) | ? | ✅ | dartcounter.net |
| n01 / n01darts | Web, Windows | Scoreur gratuit ; tournois gratuits ≤ 64 avec pub | ◐ (tournois gratuits) | ? | ◐ via extension tierce | ? | ◐ n01 Live | ? | ✅ (+ API payante) | n01darts.com |
| Dartsmind | iOS, Android | ? | ? | ? | ? | ? | ? | ? | ◐ lobby | dartsmind.com |
| Scolia | Matériel + navigateur (dont TV) | Vente de matériel (+ FLEX ?) | ? | ✅ | ? | ✅ | ✅ navigateur TV | ◐ (Pro « bars », Social à venir, sponsoring) | ✅ | scoliadarts.com |
| My Dart Training | Android, iOS | ? | ? | ? | ? | ✅ Kirk Bevins | ? | ? | ? | Google Play |
| DartConnect | Web app | Premium 36 $/an, ligues payantes | ? | ✅ (compte invité) | ? | ? | ✅ DCTV (diffusion) | ◐ (ligues, lieux) | ✅ (PDC, WDF) | dartconnect.com |
| Darts for Windows | Windows | Licence (essai bridé) | ? | ❌ (logiciel local) | ? | ◐ (sons PDC importés) | ◐ live scoring | ? | ✅ | dartsforwindows.com |
| Lidarts | Web | ✅ gratuit, open source | ❌ | ✅ (pour jouer en ligne) | ? | ? | ◐ « Watch » | ❌ | ? | lidarts.org |
| **The Darts App** | iOS, Android, web | Gratuit pour les joueurs ; lieu 199 $/an, ligue 249 $/an (2027) | ❌ | ❌ pour commencer | ❌ | ✅ | ◐ tableau de tournoi sur la TV | ◐ (offre lieu) | ✅ | thedarts.app |
| **Darts Scorer 180** | iOS, Android, Mac | Gratuit avec pub, Pro 9,49 $/an | ✅ (gratuit) | ❌ | ✅ (X01, Elim., 121) | ? | ✅ Live Mode par code (illimité en Pro) | ? | ? | Google Play |
| MyDarts | Web | Freemium, 9,99 £/an | ? | ✅ (inscription) | ✅ voice-first (EN) | ? | ? | ? | ? | mydarts.co.uk |
| Dartcaster | iPhone | Gratuit + achats intégrés | ❌ (manuel) | ? | ? | ? | ✅ Chromecast « broadcast » | ? | ? | App Store |
| Darts Score Handsfree | Android | ? | ? | ? | ✅ | ? | ✅ cast | ? | ◐ en ligne | Google Play |
| DartSociety (FR) | Web, stores « bientôt » | ✅ gratuit | ❌ | ? (profils) | ? | ✅ « scores annoncés à la voix » | ◐ matchs en direct | ? | ◐ défis | dartsociety.fr |
| FrenchDarts (FR) | ? | ✅ gratuit | ? | ? | ? | ? | ? | ? | ? | frenchdarts.fr (méta) |

### 3.3 Enseignements de la veille

1. **Aucune des trois briques de l'hypothèse « voix + TV + personnalisation » n'est inédite.**
   - Saisie vocale : MyDarts, Darts Scorer 180, Darts Score Handsfree, Voice Darts, Fléchettes – Score.
   - TV : Darts Scorer 180 Live Mode, Dartcaster, Darts Score Handsfree, DCTV, Scolia dans le navigateur de la TV, tableau TV de The Darts App.
   - Offre lieux : The Darts App, Scolia Pro et Social, DartConnect. [VÉRIFIÉ ext.]
2. **Le caller est un standard du marché** : DartCounter, Autodarts (gratuit), Scolia, My Dart Training, The Darts App, DartSociety (en français). Bougnat Darts n'en a pas. C'est une **fonctionnalité de parité**, pas de différenciation.
3. **La tendance de fond « mains libres » passe par la caméra** : Autodarts Lens, Dartsmind sur l'appareil, Dartcaster, Darts Score Handsfree. La voix reste pertinente : pas de trépied, pas de calibration, tous types de cibles, coût matériel nul.
4. **Les attentes non satisfaites du leader sont documentées** : voix en entrée (550 votes) et TV (741 votes), en attente depuis environ 4 ans chez DartCounter. Elles valident le **besoin**, pas l'originalité.
5. **La monétisation des lieux arrive** : The Darts App facturera 199 $/an par lieu à partir de 2027, et n01 affiche de la pub au-delà de 64 joueurs ou en gratuit. Une offre **gratuite, sans compte et sans pub** pour les bars et clubs devient un **vrai contre-positionnement**, si elle reste simple.
6. **Le français est sous-servi** : seules DartSociety et FrenchDarts (pas encore sur les stores ou peu documentée) se positionnent en français. Aucune page consultée ne mentionne une reconnaissance vocale **française** spécialisée fléchettes [NON TROUVÉ].

---

## 4. Besoins mal couverts par contexte

| Contexte | Besoin principal | Couverture marché (consultée) | Couverture Bougnat actuelle | Opportunité |
|---|---|---|---|---|
| Joueur seul | Progresser sans aller-retour cible ↔ écran | Bon (bots, entraînement, caméra payante) | Bot X01 seul, aucun entraînement (P4, P16) | Entraînement **mains libres** à la voix (INNO-08) |
| Entraînement | Exercices ciblés (finitions) et suivi | Très bon (DartCounter, My Dart Training, Dartsmind, The Darts App) | ❌ | Parité minimale + angle voix et finition (INNO-08) |
| Amis | Lancer vite, ambiance, garder un souvenir | Bon (caller, animations) mais souvent compte ou pub | Lancement rapide ✅ ; pas d'ambiance sonore (P10) ; stats perdues après 2 min (P6) ; X01 limité à 2 (P3) | Caller FR (INNO-02), récap à emporter (INNO-04) |
| Clubs | Station fiable à la cible, résultats officiels, identité | DartConnect, n01, Darts for Windows (compte, payant) | Lien 030 ✅ ; pas de station ni de Wake Lock (P14) | Station en un scan (INNO-05) + TV (chantier 5.6) + 030 |
| Bars | Animer, attirer, faire revenir ; zéro administration | The Darts App (payant 2027), Scolia Pro (matériel), Target Arcade | QR statique seulement | Soirée éclair (INNO-06), Défi du comptoir (INNO-09) |
| Compétitions | Résultats sans litige, diffusion | DartConnect, n01 (payant au-delà d'un seuil) | Lien 030 (résultat non signé) | Rester **client de scoring** des systèmes maîtres (030, backend Tournaments) ; ne pas reconstruire un gestionnaire de tournoi |
| Découverte / débutants | Comprendre les règles et quoi viser, sans honte | Guides web statiques (The Darts App) ; [NON TROUVÉ] d'aide contextuelle en partie | Règles textuelles au setup (P15) | Mode Découverte (INNO-07) |
| Experts | Stats fines, rythme, pas de friction | Très bon chez les payants | Stats X01 ✅ (P5) mais non conservées | Carnet local (INNO-03) |
| Mains libres | Ne jamais toucher l'écran | Caméra (payant ou matériel) ; voix EN | Voix FR mais 2 appuis par volée (P9) | Boucle vocale complète (INNO-01 + INNO-02) |
| Écran partagé | Lisible à 3 m, pour tous | Live Mode et cast (souvent payant ou limité) | ❌ | Chantier 5.6 + « moments » (INNO-02 lot B) |
| Animation d'événements | Mini-tournoi, défis, public | Payant ou avec compte | ❌ | Soirée éclair + défis + TV (terrain réel Bougnat Darts) |
| Diffusion | Montrer la partie au public ou en stream | DCTV, Legcast (extension OBS pour DartCounter) | ❌ | Chantier 5.6 ; vue spectateur réutilisable comme source OBS |
| Accessibilité | Jouer sans voir l'écran (malvoyants) | Matériel « talking dartboard », recherche académique (TARGET, Springer 2024) ; [NON TROUVÉ] côté apps | ❌ | Mode audio complet (INNO-10) |

Sources accessibilité : https://lhblind.org/audible-darts-for-blind-or-visually-impaired-individuals/ et https://link.springer.com/chapter/10.1007/978-3-031-62846-7_14 (extraits moteur, consultés le 20/11/2026).

---

## 5. Challenge de l'hypothèse « voix + TV + personnalisation = station de scoring club/bar »

### 5.1 Ce qui tient
- Le besoin est réel et documenté (votes DartCounter #332/#333, offre lieu de The Darts App, Scolia Pro et Social).
- Les trois briques se renforcent mutuellement : la voix libère les mains, la TV libère le regard, la personnalisation donne une raison au lieu de l'afficher.
- Bougnat Darts peut proposer gratuitement ce que les autres vendent 199 $/an par lieu, ou avec du matériel.

### 5.2 Ce qui fragilise l'hypothèse
1. **Rien d'inédit par brique** (§3.3). La différenciation ne viendra pas de « avoir » la voix ou la TV, mais de **comment** elles sont faites : français natif, zéro compte, zéro limite, zéro pub, ouverture instantanée.
2. **Le bar est le pire environnement pour la voix** (bruit, conversations, musique). Promettre « la voix au bar » est risqué ; la voix est d'abord un atout **à domicile, à l'entraînement et en club calme** [HYPOTHÈSE à valider par l'agent 5.1 et des essais terrain].
3. **Un bar n'achète pas un « terminal de scoring »**, il cherche de l'**animation** et de la **fréquentation** (soirées, défis, habitués). La station est un moyen, pas une fin [HYPOTHÈSE appuyée par le discours « Run darts nights » de The Darts App et « Attract more guests » de Scolia].
4. **Un club cherche d'abord la fiabilité et l'intégration** (résultats vers la ligue ou le tournoi) : le lien 030 et le futur backend Tournaments pèsent plus que les couleurs du club.
5. **Coût de la voix** : dans une station allumée toute une soirée, une écoute continue avec Deepgram devient la principale dépense récurrente (§6, INNO-01).
6. **Exploitation sans backend** : une station sans compte n'a pas de gestion de flotte. La configuration doit donc tenir dans un **lien ou QR** (INNO-05) et la tablette ne doit pas s'endormir (Wake Lock absent, P14).

### 5.3 Propositions de valeur alternatives ou complémentaires
- **A. « Parle, Bougnat compte »** : le compagnon vocal français, bidirectionnel (tu annonces, il répond à voix haute). Cible : domicile, entraînement, club. *Candidat signature n°1.*
- **B. « L'animateur de soirée »** : mini-tournoi éclair, défis de comptoir, TV, caller. Cible : bars, associations, événements (terrain Bougnat Darts). *Candidat signature n°4 (conditionnel).*
- **C. « La partie à emporter »** : récap partageable et carnet local, sans compte. Boucle de bouche-à-oreille sans publicité. *Candidat signature n°2.*
- **(Signature n°3 : « Station en un scan », voir INNO-05, qui sert de socle à A, B et C dans un lieu.)**
- **D. « L'appli des jeux de comptoir français »** : Capital, Triathlon, Killer, Gotcha, plus un mode Découverte. C'est un axe d'**identité** plus qu'une fonctionnalité.

**Recommandation** : présenter la station club/bar comme **la somme A + B + C dans un lieu**, et non comme un produit en soi. Ne communiquer sur « la voix au bar » qu'après mesure terrain.

---

## 6. Propositions de fonctionnalités (10 propositions)

Hypothèses de coût communes :
- Hébergement Cloudflare Pages ou fichiers statiques : 0 € supplémentaire [HYPOTHÈSE : rester dans le plan gratuit, à confirmer par l'agent infra].
- Deepgram (https://deepgram.com/pricing, 20/11/2026) : Nova-3 monolingue en streaming à **0,0048 $/min** (prix promotionnel, 0,0077 $ hors promo), keyterm prompting à **+0,0013 $/min**, crédit initial gratuit de 200 $ [VÉRIFIÉ ext.].
- Synthèse vocale du navigateur (`speechSynthesis`) : 95,6 % de support ; Wake Lock : 96,4 % ; Web Share : 91,9 % (+2,5 % partiel) [VÉRIFIÉ ext. données caniuse, https://github.com/Fyrd/caniuse].

### INNO-01 — Boucle vocale mains libres (cadre d'expérience pour le chantier 5.1)
- **Concept** : une partie X01 se joue entièrement à la voix. Le micro s'active automatiquement à chaque volée, le score est validé seul quand la confiance est haute, et des commandes vocales permettent de corriger (« annule », « non, 85 »), d'interroger (« combien il reste ? ») et d'enchaîner les joueurs. La confirmation est sonore (voir INNO-02).
- **Problème** : aujourd'hui, une volée vocale demande 2 appuis (P9). Le joueur regarde encore l'écran.
- **Cible** : domicile, entraînement solo, club calme ; secondairement le bar.
- **Scénario** : Léa s'entraîne seule. Elle lance, dit « soixante », entend « soixante, il reste 441 », va chercher ses fléchettes, relance. Après une erreur, elle dit « annule » et entend « annulé, il reste 441 ».
- **Valeur** : rythme préservé, concentration sur la cible, accessibilité.
- **Différenciation** : voix en entrée existante ailleurs (MyDarts, Darts Scorer 180, Darts Score Handsfree, Voice Darts) [VÉRIFIÉ ext.]. **Boucle bidirectionnelle en français avec sémantique fléchettes** (score restant, séquences, corrections) : [NON TROUVÉ] parmi les 19 apps consultées.
- **Communication** : très forte (« Annoncez, c'est compté », démo vidéo de 15 s). Elle répond publiquement à une attente du leader (#332, 550 votes).
- **Faisabilité** : le parseur existe déjà (`dartsSpeechParser*`, 3 intentions). Il manque l'écoute continue ou l'auto-réarmement, une validation automatique par seuil de confiance, une grammaire de commandes et la coupure du micro pendant que le caller parle.
- **Complexité** : L. **Dépendances** : chantier 5.1 (prioritaire, **à fusionner** dans sa spec), INNO-02.
- **Coûts** : actuellement ≤ 6,5 s d'écoute par volée, soit environ 2 min par match 501 à 2 joueurs, environ **0,012 $/match** [HYPOTHÈSE]. En écoute continue sur un best-of-5 d'environ 40 min : environ **0,24 $/match**, soit **environ 240 $/mois pour 1 000 matchs** [HYPOTHÈSE]. Une coupure locale (VAD) n'envoyant que la parole pourrait diviser ce coût par 3 à 5 [HYPOTHÈSE].
  - **Recommandation** : réarmement automatique par volée, pas de streaming permanent, plafond par session, et piste d'un moteur local ou navigateur étudiée par l'agent 5.1.
- **Risques** : coût, faux positifs dus aux conversations, confidentialité (audio envoyé à Deepgram), compatibilité iOS.
- **Valeurs** : ✅ si optionnel et si le clavier reste maître ; ⚠️ la gratuité impose un **budget voix plafonné** et une dégradation propre (retour au manuel).

### INNO-02 — « Le Caller Bougnat » : annonceur vocal français + moments forts
- **Concept** :
  - Lot A : annonce vocale des scores (« Cent quatre-vingts ! »), du restant (« Il vous reste 32 »), du joueur suivant, de « Game shot, et la manche », du bust.
  - Lot B : moments forts visuels et sonores (180, ton-80, gros finish, 9-darter en cours, élimination Killer, Gotcha qui renvoie à zéro) sur l'écran de contrôle et sur la TV.
  - Deux voix possibles : « Sobre » et « Bougnat » (répliques humoristiques, dans le ton du README : « Oui, ça pique »).
- **Problème** : aucune sortie sonore (P10). L'ambiance « TV » attendue des joueurs est absente, alors qu'elle est standard ailleurs.
- **Cible** : amis, bars, événements, malvoyants (INNO-10).
- **Scénario** : soirée entre amis, Paul claque un 180. La tablette crie « Cent… quatre-vingts ! » et la TV affiche une animation.
- **Valeur** : émotion, ambiance, confirmation des saisies sans regarder l'écran. Il ferme la boucle d'INNO-01.
- **Différenciation** : **faible en soi** (callers chez DartCounter, Autodarts, Scolia, My Dart Training, The Darts App et DartSociety en français) [VÉRIFIÉ ext.]. Le différenciant vient de la **personnalité « Bougnat »**, de la gratuité totale (Autodarts réserve son caller premium à l'offre payante) et du couplage avec la voix en entrée.
- **Communication** : forte (contenus vidéo courts, « la voix du Bougnat »).
- **Faisabilité** :
  - Clips audio pré-enregistrés : 0-180 + environ 40 phrases ≈ 220 clips, quelques Mo [HYPOTHÈSE].
  - `speechSynthesis` pour les prénoms ou en repli.
  - Déblocage audio au geste « Lancer la partie » (politique d'autoplay) ; réutiliser `audioContextManager.ts`.
  - La CSP (`default-src 'self'`) autorise les médias de même origine.
  - Le caller s'appuie sur les **événements de domaine** (volée enregistrée, leg gagné…). Aucune logique de jeu dans l'audio (§7 de la mission).
- **Complexité** : M (lot A), S (lot B). **Dépendances** : événements de match exposés de façon neutre (Clean Architecture), mode TV (5.6) pour le lot B.
- **Coûts** : **0 €/mois**. Coût ponctuel d'enregistrement (voix bénévole ou comédien, quelques centaines d'euros) [HYPOTHÈSE] ; à défaut, synthèse vocale seule.
- **Risques** : lassitude (prévoir l'interrupteur et le choix de voix), qualité variable de `speechSynthesis` selon l'OS, **micro qui capte le caller** (coordination indispensable avec INNO-01), droits sur la voix (contrat de cession avec la personne enregistrée).
- **Valeurs** : ✅.

### INNO-03 — Carnet de parties local
- **Concept** : un écran « Mes parties » sur l'appareil, qui liste les parties terminées (tous jeux), les rouvre en lecture et propose « Revanche » ou « Rejouer avec les mêmes joueurs ». Il affiche quelques tendances locales (moyenne des 10 derniers X01 par prénom). Purge et export JSON possibles.
- **Problème** : l'historique est déjà écrit mais invisible (P7). Les stats disparaissent après 2 min (P6).
- **Cible** : joueurs réguliers, clubs (tablette partagée), experts.
- **Scénario** : jeudi au club, la tablette affiche les 20 dernières parties ; Marc retrouve sa finale d'hier et la rejoue.
- **Valeur** : mémoire sans compte ; valorise un investissement existant.
- **Différenciation** : faible (historique partout), mais **sans compte** c'est rare. Chez The Darts App, les parties sans compte sont effacées après 30 jours [VÉRIFIÉ ext.].
- **Communication** : moyenne. **Faisabilité** : élevée (`listLocalGameHistory` existe). **Complexité** : M.
- **Dépendances** : plafonnement et rétention du store `match_history` (P7) ; respect de la vie privée sur un appareil partagé (bouton « effacer »).
- **Coûts** : 0 €. **Risques** : croissance d'IndexedDB, prénoms de tiers stockés sur un appareil de bar (rétention courte par défaut à prévoir).
- **Valeurs** : ✅.

### INNO-04 — « Récap à emporter » : carte de partie partageable + QR sans serveur
- **Concept** : en fin de partie, deux actions.
  1. « Partager » génère une **image** du récap (vainqueur, score, moyenne, 180, meilleur finish, mention Bougnat Darts et éventuellement logo du club) via Web Share.
  2. Un **QR code** encode le récap **dans le fragment de l'URL** (`#r=…`, compressé, jamais envoyé au serveur). Le joueur le scanne et retrouve ses stats sur son téléphone, sans compte ni stockage distant.
- **Problème** : #46 (« Récupérer ses stats de fin de partie avec un QR code ») est fermée NOT_PLANNED. Les stats restent sur l'appareil qui a servi au scoring (P6).
- **Cible** : tous ; effet de bouche-à-oreille.
- **Scénario** : fin de match au bar, Julie scanne le QR, garde son récap et l'envoie au groupe WhatsApp. Chaque image porte la mention « Compté avec Bougnat Darts ».
- **Valeur** : souvenir, fierté, **acquisition gratuite sans publicité**.
- **Différenciation** : Darts Scorer 180 a un QR, mais pour rattacher la partie à un **compte** [VÉRIFIÉ ext.]. Un récap portable **sans compte ni serveur** : [NON TROUVÉ] parmi les apps consultées.
- **Communication** : **très forte** (chaque partage est une vitrine). *Candidat signature n°2.*
- **Faisabilité** : canvas vers PNG (la CSP `img-src blob:` est déjà autorisée), Web Share à 91,9 % avec repli téléchargement, QR via la dépendance `qrcode` déjà présente (utilisée seulement au build aujourd'hui, `scripts/generate-app-qr.mjs`). Elle doit alors être embarquée dans le bundle (environ 20-30 Ko gzip [HYPOTHÈSE]). Contrainte : taille limitée des données d'un QR, donc un récap résumé, pas toute la partie.
- **Complexité** : M. **Dépendances** : INNO-03 (optionnelle), personnalisation 5.7 (logo).
- **Coûts** : 0 €.
- **Risques** : un récap modifiable à la main dans l'URL (sans enjeu : c'est un souvenir, pas un résultat officiel) ; vie privée (prénoms dans l'image, partage volontaire).
- **Valeurs** : ✅ (aucune donnée côté serveur).

### INNO-05 — « Station en un scan » : configuration de lieu par lien/QR + affiche imprimable
- **Concept** : un club ou un bar compose **une fois**, dans un écran « Préparer ma station » (sans compte), sa configuration : nom du lieu, couleurs et logo (chantier 5.7), jeux mis en avant, réglages par défaut (501 double out…), caller activé, écran allumé. Bougnat Darts produit :
  - un **lien et un QR « station »** : scanner sur une tablette suffit à la configurer ;
  - une **affiche A4 imprimable** aux couleurs du lieu, avec le QR « Jouer ici ».
  - La configuration est stockée localement. Le lien est la seule « sauvegarde » (aucun serveur).
- **Problème** : sans compte ni backend, il faut un moyen simple de déployer et de restaurer une identité de lieu ; les tablettes se mettent en veille (P14).
- **Cible** : bars, clubs, associations, organisateurs.
- **Scénario** : le gérant du « Café de la Gare » ouvre la page, choisit ses couleurs et son logo, imprime l'affiche, scanne le QR station sur la tablette du comptoir. Le lendemain, une nouvelle tablette est configurée en 5 secondes.
- **Valeur** : appropriation (chantier 5.7), déploiement sans support, réversibilité totale.
- **Différenciation** : The Darts App propose une offre lieu avec QR d'inscription, mais à 199 $/an et avec comptes staff (dès 2027) [VÉRIFIÉ ext.]. Une configuration de lieu **portable par QR, gratuite et sans compte** : [NON TROUVÉ].
- **Communication** : forte auprès des lieux (« Votre bar à vos couleurs en un scan »).
- **Faisabilité** : même principe que le contrat 030 (paramètres d'URL versionnés, validation stricte). Logo : passer par une URL `https` sous liste blanche ou intégrer un petit logo dans le lien (taille à arbitrer avec 5.7). Wake Lock pendant les parties. Mode kiosque via la PWA (spec 031).
- **Complexité** : M. **Dépendances** : 5.7 (personnalisation), 031 (PWA), 5.6 (TV), 5.3 (tablette).
- **Coûts** : 0 €.
- **Risques** : logo distant (sécurité, CSP `img-src https:` déjà ouvert, à resserrer ?), usurpation d'identité visuelle d'un lieu (sans conséquence de sécurité, mais prévoir une mention « configuration locale »), QR trop dense.
- **Valeurs** : ✅ ; la mention Bougnat Darts reste visible (5.7).

### INNO-06 — « Soirée éclair » : mini-tournoi local sans compte (étude exploratoire, puis spec)
- **Concept** : sur **un seul appareil organisateur**, on saisit 4 à 16 prénoms, on choisit un format (poules, élimination directe, montante-descendante), un jeu (X01, Cricket, Killer…) et le nombre de cibles. Bougnat Darts tire le tableau, l'affiche sur la TV et appelle les matchs (« Cible 2 : Alice contre Bob », éventuellement via le caller). Deux façons de jouer les matchs :
  - sur l'appareil organisateur, en lançant le match depuis le tableau. Le **contrat 030 peut servir de contrat interne** (setup verrouillé, résultat renvoyé au tableau) ;
  - sur une autre cible, avec saisie du score final sur l'appareil organisateur. En V2+, retour par QR « résultat » scanné par l'organisateur.
- **Problème** : animer une soirée sans outil payant ni création de compte.
- **Cible** : bars, associations, anniversaires, comités d'entreprise ; **terrain Bougnat Darts** (organisateur d'événements).
- **Scénario** : vendredi soir, 12 joueurs, 2 cibles. Le barman saisit les prénoms sur la tablette, la TV affiche le tableau, les matchs s'enchaînent, le vainqueur est annoncé avec le récap à emporter (INNO-04).
- **Valeur** : animation clé en main, fréquentation.
- **Différenciation** : tournois gratuits chez The Darts App (compte requis pour l'organisateur) et n01 (avec pub au-delà de 64 joueurs) [VÉRIFIÉ ext.]. **Sans compte, hors ligne, mono-appareil, aux couleurs du lieu** : [NON TROUVÉ].
- **Communication** : forte (« Votre soirée fléchettes en 2 minutes »). *Candidat signature n°4*, sous condition de l'arbitrage sur la frontière.
- **Faisabilité** :
  - Logique de tableau à placer **dans le domaine** (tirage, avancement, classement), indépendante de l'UI.
  - La synchronisation multi-appareils n'est **pas** nécessaire en V2 (mono-appareil).
- **Complexité** : L (mono-appareil), XL avec plusieurs appareils.
- **Dépendances** : **arbitrage de frontière avec `Bougnat_Darts_Tournaments`** (CONTRIBUTING et `docs/product-scope.md` : « logique tournoi avancée » exclue de ce repo). Mode TV (5.6), INNO-05, 030.
- **Coûts** : 0 € (local).
- **Risques** :
  - **Conflit de périmètre** avec le backend Tournaments ; la limiter explicitement à un « éphémère, local, ≤ 16 joueurs, sans historique distant ».
  - Perte de l'appareil organisateur (persister localement la soirée).
  - Dérive fonctionnelle (seeding, handicaps, ligues).
- **Valeurs** : ✅ si le parcours de base reste intact (entrée séparée « Soirée » hors du flux « Lancer une partie »).

### INNO-07 — Mode Découverte : première partie guidée
- **Concept** : une option « Je découvre » au setup, avec :
  1. une explication interactive de la cible (simple, double, triple, bulle) ;
  2. en partie, un **coaching contextuel** : « Il te reste 40 : vise le double 20 », « Au Cricket, ferme le 20 avant ton adversaire » ;
  3. des règles simplifiées (pas de double out en 301 découverte) ;
  4. une saisie par zones de cible plutôt que par calcul mental (« j'ai touché triple 20 »).
- **Problème** : les débutants (bars, familles, événements) ne savent ni compter ni quoi viser. Les règles sont statiques (P15).
- **Cible** : débutants, enfants, animations, bars.
- **Scénario** : animation Bougnat Darts dans un comité d'entreprise. Les participants jouent un 301 découverte, l'app leur dit quoi viser et le caller encourage.
- **Valeur** : abaisse la barrière d'entrée et élargit le public des fléchettes (cohérent avec la mission « découverte »).
- **Différenciation** : guides web statiques chez The Darts App ; **coaching contextuel en partie** : [NON TROUVÉ] parmi les apps consultées (vérification partielle : pages d'accueil et FAQ seulement).
- **Communication** : bonne (« L'appli qui t'apprend les fléchettes en jouant »).
- **Faisabilité** : le moteur de finish existe (`CHECKOUT_GUIDE`, `checkoutEligibility.ts`). Les conseils doivent être produits par une fonction **pure du domaine ou de l'application** (aucune règle dans l'UI).
- **Complexité** : M. **Dépendances** : revue des jeux (5.5), design system (5.2/5.3), INNO-02 (voix des conseils).
- **Coûts** : 0 €. **Risques** : surcharge visuelle pour les joueurs confirmés (mode strictement opt-in), justesse pédagogique (relecture par un joueur ou entraîneur).
- **Valeurs** : ✅.

### INNO-08 — Atelier finitions mains libres (entraînement)
- **Concept** : quelques exercices orientés finition, pensés pour être **joués à la voix** :
  - « Checkout aléatoire » : l'app tire 2-170, annonce « 81 », le joueur dit « réussi » ou son score ;
  - « 121 » ;
  - « Tour des doubles ».
  - Statistiques locales par double (taux de réussite D16, D20…), stockées dans le carnet (INNO-03).
- **Problème** : aucun entraînement (P16). Seul, chaque saisie tactile casse le rythme.
- **Cible** : joueur seul, club.
- **Scénario** : Thomas fait 15 minutes de finitions le soir sans toucher sa tablette.
- **Valeur** : parité indispensable avec le marché, avec l'angle voix.
- **Différenciation** : exercices de finition partout (DartCounter, My Dart Training, The Darts App, Dartsmind) [VÉRIFIÉ ext.] ; MyDarts combine voix et entraînement (premium, anglais) [VÉRIFIÉ ext.]. Différenciation **modeste** : français, gratuit, mains libres.
- **Communication** : moyenne. **Faisabilité** : bonne (nouveau jeu dans le domaine, saisie par nombre ou réussi/raté). **Complexité** : M.
- **Dépendances** : INNO-01 (voix hors X01 : la grammaire du parseur doit être paramétrable par jeu), revue des jeux (5.5).
- **Coûts** : coûts voix (cf. INNO-01). **Risques** : multiplication des modes, à cantonner à 2-3 exercices.
- **Valeurs** : ✅.

### INNO-09 — Défi du comptoir (bars) : défis QR et tableau d'honneur local
- **Concept** : le lieu publie un **défi du mois** (« 121 en 9 fléchettes », « meilleur score sur 3 volées », « Capital > 500 ») sous forme de QR ou lien, comme pour la configuration de station (INNO-05). Les tentatives se jouent **sur la tablette du lieu**. Un **tableau d'honneur local** (stocké sur la tablette) s'affiche sur la TV.
- **Problème** : faire revenir les clients et animer les temps creux sans organisation lourde.
- **Cible** : bars, clubs (défis internes).
- **Scénario** : le « Bar des Sports » affiche « Défi de novembre : battez 87 points en 3 fléchettes ». Le classement tourne sur la TV, le vainqueur gagne un café.
- **Valeur** : fréquentation, convivialité, communication locale.
- **Différenciation** : Target Arcade (matériel Omni) et Scolia Social (à venir, matériel) visent l'animation de pub [VÉRIFIÉ ext.]. **Sans matériel ni compte, en web** : [NON TROUVÉ].
- **Communication** : bonne localement.
- **Faisabilité** : moyenne. Sans backend, pas de classement inter-bars ni d'anti-triche (fonctionnement sur l'honneur et sur l'appareil du lieu). La version « défis entre bars » nécessiterait un backend : réservée à une version ultérieure ou au backend Tournaments.
- **Complexité** : L. **Dépendances** : INNO-05, 5.6, INNO-03.
- **Coûts** : 0 € (local). **Risques** : périmètre, triche, prénoms affichés publiquement (consentement : pseudonyme libre).
- **Valeurs** : ✅ si local et opt-in.

### INNO-10 — « Jouer sans voir l'écran » : mode accessibilité audio
- **Concept** : un réglage qui active un **retour audio exhaustif** : à qui le tour, score restant, finish proposé, résultat de la saisie. Il combine la saisie vocale (INNO-01) et un pavé utilisable avec un lecteur d'écran (régions ARIA live, ordre de focus).
- **Problème** : les apps de scoring sont visuelles. Les malvoyants passent par du matériel spécialisé.
- **Cible** : joueurs malvoyants, joueurs âgés, darts handisport ; profite aussi aux joueurs « mains libres ».
- **Scénario** : Gérard, malvoyant, joue au club. Il annonce ses scores, l'app lui répond le restant et le finish conseillé.
- **Valeur** : inclusion, image, cohérence avec la gratuité.
- **Différenciation** : [NON TROUVÉ] dans les apps consultées ; seuls du matériel (talking dartboard) et un prototype de recherche ont été trouvés [EXTRAIT MOTEUR].
- **Communication** : forte en image (presse locale, associations, handisport) ; à ne pas surexploiter.
- **Faisabilité** : découle d'INNO-01 et INNO-02, plus un audit a11y. **Complexité** : S-M au-dessus d'INNO-01/02.
- **Dépendances** : INNO-01, INNO-02, design system (contrastes, 5.2).
- **Coûts** : 0 € hors voix. **Risques** : promesse d'accessibilité non tenue : tester avec des utilisateurs concernés avant toute communication.
- **Valeurs** : ✅.

### Propositions écartées ou reportées (et pourquoi)
- **Auto-scoring par caméra** : XL (modèle de vision, calibration), concurrence forte (Autodarts, Dartsmind, Dartcaster). Report : garder une **entrée de score agnostique** (étude V2-INNO-12) pour accueillir un jour un adaptateur caméra ou un autoscoreur externe.
- **Jeu en ligne** : nécessite un backend temps réel et des comptes, contraire aux principes et au périmètre (`docs/product-scope.md`).
- **Défis inter-bars et classements nationaux** : backend requis, donc renvoyés au backend Tournaments.
- **Coaching par IA générative** (MyDarts) : coût récurrent, faible valeur au regard des valeurs du produit.

### Matrice valeur / effort (synthèse)

| ID | Valeur | Différenciation | Communication | Effort | Coût récurrent | Priorité proposée |
|---|---|---|---|---|---|---|
| INNO-01 Boucle vocale | Très haute | Haute (FR, bidirectionnelle) | Très haute | L | **Variable (Deepgram)** | P0 (dans 5.1) |
| INNO-02 Caller + moments | Haute | Moyenne (parité + identité) | Haute | M | 0 € | P1 |
| INNO-03 Carnet local | Moyenne | Faible-moyenne | Moyenne | M | 0 € | P1 |
| INNO-04 Récap à emporter | Haute | Haute | Très haute | M | 0 € | P1 |
| INNO-05 Station en un scan | Haute (lieux) | Haute | Haute | M | 0 € | P1 |
| INNO-06 Soirée éclair | Haute (lieux, événements) | Haute | Haute | L | 0 € | P2 (après arbitrage) |
| INNO-07 Mode Découverte | Moyenne-haute | Moyenne-haute | Bonne | M | 0 € | P2 |
| INNO-08 Atelier finitions | Moyenne | Faible | Moyenne | M | Voix | P2 |
| INNO-09 Défi du comptoir | Moyenne | Moyenne-haute | Bonne (local) | L | 0 € | P3 |
| INNO-10 Accessibilité audio | Moyenne (sociale forte) | Haute | Forte (image) | S-M | 0 € | P2 |

### Fonctionnalités signature proposées (2 à 4)
1. **« Parle, Bougnat compte »** = INNO-01 + INNO-02 (+ INNO-10) : la boucle vocale française bidirectionnelle. Niveau : combinaison [NON TROUVÉE] parmi 19 apps consultées, chaque brique existant séparément.
2. **« La partie à emporter »** = INNO-04 (+ INNO-03) : récap partageable et QR sans compte ni serveur, moteur d'acquisition sans publicité.
3. **« Station en un scan »** = INNO-05 + mode TV (5.6) + personnalisation (5.7) : l'équivalent gratuit et sans compte des offres lieu payantes.
4. *(Conditionnelle)* **« Soirée éclair »** = INNO-06 (+ INNO-09) : si l'arbitrage de frontière avec `Bougnat_Darts_Tournaments` l'autorise.

Indicateurs de réussite proposés (mesurables sans tracking individuel, via Cloudflare Web Analytics sans cookie ou des compteurs agrégés opt-in, à arbitrer) :
- INNO-01 : ≥ 80 % des volées validées sans toucher l'écran en environnement calme, pendant un test terrain encadré de 20 parties [HYPOTHÈSE de cible].
- INNO-04 : taux d'utilisation de « Partager » ou du QR ≥ 15 % des fins de partie [HYPOTHÈSE].
- INNO-05 : nombre d'affiches et de stations générées par mois ; 10 lieux pilotes en Auvergne via le réseau Bougnat Darts [HYPOTHÈSE].

---

## 7. Vision produit synthétique (contribution §6)

**Positionnement cible**
> *Bougnat Darts, le compteur de fléchettes français qui écoute, parle et s'affiche, gratuit, sans pub, sans compte, du salon au comptoir.*

**Proposition de valeur**
- Pour le joueur : « Ouvre, joue, annonce ; Bougnat compte, te répond et te laisse emporter ta partie. »
- Pour le lieu : « Votre bar ou votre club à vos couleurs, sur votre TV, en un scan, sans abonnement. »

**Avantages différenciants (vérifiés ou à vérifier)**
1. Le cumul gratuit + sans pub + sans compte + sans limite + open source : aucun concurrent consulté ne le réunit (§3.2).
2. La voix en français avec sémantique fléchettes, bidirectionnelle (INNO-01/02) : [NON TROUVÉ] ailleurs.
3. Les jeux de comptoir français (Capital, Triathlon) et le ton « Bougnat ».
4. Un ancrage terrain réel (organisation de tournois et d'événements) et un lien partenaire sans backend (030).

**Usages prioritaires** : (1) parties entre amis à domicile ; (2) entraînement solo mains libres ; (3) club avec tablette et TV ; (4) bar et animation de soirée.

**Leviers d'adoption (sans publicité)**
- Récap partagé (INNO-04) : chaque partage est une vitrine.
- Affiche QR aux couleurs du lieu (INNO-05) : présence physique à côté de la cible.
- TV du bar (5.6) avec mention « Bougnat Darts » discrète.
- Réseau d'événements Bougnat Darts (démonstrations).
- Contenus vidéo courts (180 annoncé par le caller, démo vocale).
- Lien partenaire 030 (organisateurs).

**Synergies entre chantiers**
- Voix (5.1) + caller (INNO-02) + TV (5.6) : le joueur annonce, la TV affiche, la tablette confirme à voix haute.
- Tablette (5.3) + orientation (5.4) + Wake Lock + PWA (031) + station (INNO-05) : un terminal de cible fiable.
- Personnalisation (5.7) + affiche + récap + TV : l'identité du lieu partout, avec la mention Bougnat Darts.
- Design system (5.2) + mode Découverte et accessibilité (INNO-07/10).
- Revue des jeux (5.5) + entraînement (INNO-08) + Soirée éclair (INNO-06).
- Intégrations (5.10) + 030 comme contrat interne (INNO-06) et pour les partenaires.

**Fondations techniques nécessaires** (à valider par les agents architecture, voix et TV)
1. **Événements de match neutres** émis par la couche application (volée enregistrée, leg/set gagné, bust, 180…), consommés par le caller, les moments TV et l'accessibilité. Aucune règle dans ces consommateurs.
2. **Port d'entrée de score unique** (clavier, voix, futur autoscoreur) vers les cas d'usage existants (`RecordThrow`, `UndoThrow` dans `src/application/scoring/`).
3. **Contrats d'URL versionnés** généralisés (030 → station, défis, récap), avec la même rigueur de validation.
4. Service **audio** (déblocage, file de lecture, coupure du micro pendant la lecture).
5. PWA livrée (031) + Wake Lock.

**Évolutions indispensables (V2)** : boucle vocale améliorée (5.1 / INNO-01, au moins le réarmement automatique et la confirmation sonore), caller lot A (INNO-02), récap à emporter (INNO-04), carnet local (INNO-03), station en un scan (INNO-05), en cohérence avec les chantiers imposés 5.6 et 5.7.

**Évolutions optionnelles (V2 si capacité, sinon V2.x)** : moments forts (INNO-02 lot B), mode Découverte (INNO-07), atelier finitions (INNO-08), accessibilité audio (INNO-10).

**Versions suivantes** : Soirée éclair multi-appareils (INNO-06), défis du comptoir (INNO-09), retour de résultat par QR scanné, défis inter-bars (backend), adaptateur caméra ou autoscoreur, voix hors X01 généralisée.

**Les 4 axes (sans offre payante)**
- **Particuliers** : rien ne change au parcours « ouvrir → jeu → prénoms → jouer ». Voix, caller et récap sont des options visibles mais non intrusives.
- **Clubs** : station en un scan, TV, carnet local, lien 030 vers les systèmes de compétition, entraînement à la voix.
- **Bars** : affiche aux couleurs du lieu, TV, caller, moments forts, Soirée éclair, défis du comptoir.
- **Partenaires** : contrat 030 (et futurs contrats d'URL), vue spectateur réutilisable, aucune dépendance runtime.

**Garde-fou parcours de base** : toutes les fonctions « lieu » (station, soirée, défis) passent par une **entrée distincte** (lien ou QR, ou menu secondaire), jamais par des étapes supplémentaires dans « Lancer une partie ».

---

## 8. Problèmes, dettes et incohérences relevés (avec gravité)

| # | Problème | Référence | Gravité |
|---|---|---|---|
| D1 | Historique local écrit mais non consultable ; `docs/product-scope.md` annonce un « historique local » comme fonctionnalité. | `useGameLifecycle.ts:89-170`, `IndexedDBSessionRepository.ts:159`, `docs/product-scope.md` | Moyenne (divergence doc ↔ produit) |
| D2 | Store IndexedDB `match_history` non plafonné (payload `MatchState` complet), contrairement au fallback localStorage (50). | `IndexedDBSessionRepository.ts:129-157` | Faible à moyenne (croissance sur une tablette de club) |
| D3 | Le site vitrine `bougnatdarts.fr/scoring` annonce « **avec annonce vocale des scores** » alors que l'app n'a **aucune sortie vocale** (seulement une saisie vocale). | https://bougnatdarts.fr/scoring/ (méta-description) vs P10 | Moyenne (promesse trompeuse, hors repo) |
| D4 | Libellés en anglais dans une app revendiquée française : puces « Most Played », « Endgame », « Head-to-head », « Party Mode » ; feedback « Turn », « Info », « Bust ». | `views/GameSelectionView.tsx:40,49,58,67`, `matchFeedback.ts:6,17,28` | Faible (à transmettre à l'agent UX) |
| D5 | X01 simple limité à 2 joueurs sans justification produit dans la spec 015 : frein pour les parties entre amis (DartCounter : 1-4 joueurs, My Dart Training : sans limite [VÉRIFIÉ ext.]). | `setupModel.ts:64`, `specs/015-…` | Moyenne (à arbitrer, agent revue des jeux 5.5) |
| D6 | Retour automatique à l'accueil 2 min après la fin : perte des stats en contexte de bar (on va chercher ses fléchettes, on boit un verre). | `views/StatsView.tsx:30-36` | Faible à moyenne (résolu en partie par INNO-03/04) |
| D7 | Issues #45/#46/#47/#48 fermées NOT_PLANNED alors que la V2 relance la TV (≈ #45) : besoins à **rouvrir ou retracer** dans les nouvelles specs (traçabilité SDD). | GitHub | Faible (gouvernance) |
| D8 | Pas de Wake Lock : une tablette de station ou de TV peut s'éteindre en pleine partie. | recherche négative (P14) | Moyenne pour les usages club/bar |
| D9 | Aucun moyen de mesurer l'adoption des fonctionnalités V2 (pas de télémétrie produit, par choix). | `src/lib/env.ts:46` | Information (arbitrage) |

---

## 9. Propositions de spécifications

Convention : ID provisoire `V2-INNO-NN`. Origine « Innovation » sauf mention.

> Correspondance propositions → specs : INNO-01 → V2-INNO-01 ; INNO-02 → V2-INNO-02 (lot A) + V2-INNO-03 (lot B) ; INNO-03 → V2-INNO-04 ; INNO-04 → V2-INNO-05 ; INNO-05 → V2-INNO-06 ; INNO-06 → V2-INNO-07 ; INNO-07 → V2-INNO-08 ; INNO-08 → V2-INNO-09 ; INNO-09 → V2-INNO-10 ; INNO-10 → V2-INNO-11 ; étude complémentaire → V2-INNO-12.

| ID | Titre | Origine | Description | Valeur | Complexité | Priorité | Dépendances | Specs existantes concernées |
|---|---|---|---|---|---|---|---|---|
| V2-INNO-01 | Boucle vocale mains libres X01 | Demande V2 + Innovation | Réarmement automatique par volée, validation automatique sur confiance haute, commandes vocales (annuler, corriger, restant), confirmation sonore, budget voix plafonné | Signature n°1 | L | P0 | Chantier 5.1, V2-INNO-02 | **À fusionner** dans la spec voix 5.1 ; enrichit 003 et 006 (fiabilité voix, jetons) |
| V2-INNO-02 | Caller Bougnat (annonceur vocal FR) | Innovation | Annonces audio (clips + `speechSynthesis`), 2 voix, interrupteur, déclenchées par des événements de domaine | Parité + identité | M | P1 | Événements de match (archi), service audio | — (nouvelle) |
| V2-INNO-03 | Moments forts (contrôle + TV) | Innovation | 180, ton-80, gros finish, éliminations : animation et son | Émotion, démo | S | P2 | V2-INNO-02, mode TV 5.6 | Peut être intégrée à la spec TV |
| V2-INNO-04 | Carnet de parties local | Innovation + Reco archi | Liste et relecture des parties, revanche, tendances locales, purge et export, rétention plafonnée | Exploite l'existant | M | P1 | — | Corrige l'écart avec `docs/product-scope.md` ; touche la spec 010 (sessions hors ligne) |
| V2-INNO-05 | Récap à emporter (image + QR sans serveur) | Innovation (reprend #46) | Carte PNG partageable (Web Share) + QR avec récap dans le fragment d'URL, vue de lecture | Signature n°2 | M | P1 | V2-INNO-04 (optionnelle), 5.7 | Retrace #46 |
| V2-INNO-06 | Station en un scan (config de lieu par lien/QR + affiche) | Innovation (reprend #47 en partie) | Contrat d'URL « station » versionné, affiche A4, Wake Lock pendant les parties | Signature n°3 | M | P1 | 5.7, 031, 5.6, 5.3 | S'appuie sur le modèle de la spec 030 ; dépend de 031 |
| V2-INNO-07 | Étude : Soirée éclair (mini-tournoi local) | Étude exploratoire | Frontière avec Bougnat_Darts_Tournaments, modèle de domaine du tableau, 030 comme contrat interne, UX mono-appareil | Lieux, événements | M (étude) puis L | P2 | Arbitrage PO, 5.6, V2-INNO-06 | `docs/product-scope.md` (périmètre), CONTRIBUTING |
| V2-INNO-08 | Mode Découverte | Innovation | Opt-in au setup, conseils contextuels issus d'une fonction pure, règles simplifiées, explication de la cible | Élargit le public | M | P2 | 5.5, 5.2, V2-INNO-02 | — |
| V2-INNO-09 | Atelier finitions (entraînement compatible voix) | Innovation | 2-3 exercices (checkout aléatoire, 121, tour des doubles) et stats par double | Parité + voix | M | P2 | V2-INNO-01, 5.5, V2-INNO-04 | — |
| V2-INNO-10 | Défi du comptoir | Innovation | Contrat d'URL « défi », tableau d'honneur local sur la TV | Bars | L | P3 | V2-INNO-06, 5.6, V2-INNO-04 | — |
| V2-INNO-11 | Jouer sans voir l'écran (accessibilité audio) | Innovation | Retour audio exhaustif, régions ARIA live, audit lecteur d'écran, tests avec des utilisateurs concernés | Inclusion | S-M | P2 | V2-INNO-01, V2-INNO-02, 5.2 | — |
| V2-INNO-12 | Étude : entrée de score agnostique | Étude exploratoire / Reco archi | Port unique d'entrée (clavier, voix, autoscoreur futur) vers `RecordThrow` / `UndoThrow` ; examen d'API d'autoscoreurs (Autodarts, Scolia : API mentionnée, non vérifiée) | Pérennité | M | P3 | Agent architecture, 5.10 | 002, 022 (architecture) |

Traitement des issues historiques : retracer #45 (vers le mode TV), #46 (vers V2-INNO-05), #47 (vers V2-INNO-06 et la spec TV), #48 (identifiant de partie, prérequis de V2-INNO-04/05) dans les nouvelles specs.

---

## 10. Décisions nécessitant l'arbitrage du product owner

1. **Budget voix** : accepter un coût Deepgram récurrent (ordre de grandeur de 10 à 250 $/mois selon le mode d'écoute et l'usage [HYPOTHÈSE]) ou imposer un plafond et un mode dégradé ? Préférez-vous étudier un moteur local ou navigateur ?
2. **Signatures retenues** : valider les 3 signatures (voix bidirectionnelle, récap à emporter, station en un scan) et le statut conditionnel de la Soirée éclair.
3. **Frontière tournoi** : une « Soirée éclair » locale, éphémère et limitée à 16 joueurs est-elle compatible avec le rôle déclaré de `Bougnat_Darts_Tournaments` ?
4. **Caller** : activé par défaut ou non ? Voix « Bougnat » humoristique : oui ou non ? Enregistrement d'une voix humaine (budget ponctuel, droits) ou synthèse vocale uniquement ?
5. **Mention de marque** sur le récap partagé et l'affiche : forme et taille minimales (en lien avec le chantier 5.7).
6. **Limite X01 à 2 joueurs** (spec 015) : la lever pour les parties entre amis ? (en lien avec 5.5)
7. **Mesure d'adoption** : activer Cloudflare Web Analytics (sans cookie) et des compteurs agrégés anonymes, ou renoncer à mesurer ?
8. **Correction du site vitrine** (« annonce vocale des scores ») : à aligner tout de suite ou après la livraison du caller ?
9. **Entraînement** : le marché l'impose comme standard. L'inclure en V2 (2-3 exercices) ou le reporter ?

---

## 11. Bénéfices, contraintes et risques transverses

- **Bénéfices** : un positionnement lisible face à des concurrents payants ou avec compte ; des fonctionnalités démontrables en vidéo ; une acquisition sans publicité (récap, affiche, TV) ; l'exploitation de briques existantes (historique, contrat 030, parseur vocal, `qrcode`).
- **Contraintes** : pas de backend métier dans ce repo ; gratuité (coût voix) ; parcours de base inchangé ; Clean Architecture (événements et ports, aucune règle dans l'audio, la TV ou les récaps).
- **Risques** : dispersion (10 propositions, ce qui impose de prioriser) ; promesse vocale en bar ; dérive vers un gestionnaire de tournoi ; dette de contrats d'URL multiples (prévoir un registre et un versionnement communs) ; vie privée des prénoms sur les appareils de lieux.

---

## 12. Limites de l'analyse

- `web_fetch` était indisponible (proxy). Les pages ont été lues via `curl` ; certaines pages dynamiques (notes de version de DartCounter, partie de My Dart Training, SmartDart) n'ont pas pu être lues. **Les apps PDC n'ont pas été vérifiées directement.**
- La vérification des concurrents porte sur leurs **pages publiques** (accueil, FAQ, fiches store) à la date du 20/11/2026, sans essai des apps. Les mentions [NON TROUVÉ] n'excluent pas l'existence des fonctionnalités.
- Le comparatif publié par The Darts App est une source **concurrente** (biais possible) ; il n'est utilisé que pour des prix déclarés.
- Les coûts voix et les indicateurs sont des **ordres de grandeur** [HYPOTHÈSE], à recalculer par l'agent 5.1 avec la durée réelle des sessions et la facturation exacte de Deepgram (audio réellement transmis vs temps de connexion).
- Le code UI de `SetupView.tsx` et des vues de jeux hors X01 n'a été que survolé ; l'analyse détaillée des jeux relève du chantier 5.5.
- Aucun test n'a été exécuté (inutile pour ce périmètre, et risque d'écriture dans le repo).
