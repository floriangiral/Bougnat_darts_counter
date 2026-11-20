> **Document historique — audit V2 du 2026-11-20 (commit `508dfa6`).** Analyse figée ; les décisions et l'état courant sont suivis dans les specs et les issues.

# Bougnat Darts V2 — Compte rendu consolidé (avant rédaction des spécifications)

Date : 2026-11-20 · Repo : `Bougnat_darts_counter` @ `508dfa6` (branche `feat/v2.0.0`) · Aucune modification du repository (vérifié : `git status` vide, HEAD inchangé).
Rapports détaillés (hors repo) : [01..10-*.md](audit/01..10-*.md) du dossier de session.

Légende : [V] vérifié dans le code · [V+] vérifié par ≥ 2 agents indépendants ou par revue croisée · [EXT] source externe consultée le 20/11/2026 · [H] hypothèse · [AC] à confirmer (terrain/appareil).

---

## A. Synthèse exécutive

**État général.** Application React 19/TypeScript solide sur le plan de l'outillage (CI, Sonar, 700+ tests unitaires, lint, CSP stricte, contrat partenaire propre), mais dont **la logique de jeu réelle vit encore largement dans les vues React**, avec un domaine X01 « officiel » (`src/domain/scoring`, use cases `RecordThrow`…) **utilisé uniquement par les tests** [V+]. La V2.0.0 (lien de match externe, spec 030) est prête mais **non publiée** ; la production est en 1.1.x.

**Maturité.** Bonne maturité « outil de scoring X01 local » ; maturité faible sur : conformité de certaines règles, reprise des jeux non-X01, design system (inexistant), tablette paysage, gouvernance des specs (statuts non fiables).

**Forces.**
- Cumul gratuit + sans pub + sans compte + open source + français + jeux « de comptoir » (Capital, Triathlon) — aucun des 19 concurrents consultés ne réunit l'ensemble [EXT].
- Voix X01 en français comprenant le « reste » (« il me reste 32 ») [V].
- Contrat partenaire `v=1` sans backend, déjà consommé par badarts.fr [V][EXT].
- Base technique moderne, CI exigeante, X01 déjà sérialisable et remonté au shell (`App.tsx:353-361`) [V+].

**Faiblesses majeures (vérifiées).**
1. **Règles X01 non conformes** : Double/Master-In réglable mais jamais appliqué (`matchLifecycle.ts:259-291`) ; finishes impossibles acceptés en Double-Out (180, 168, 165, 162, 159 — `matchSubmission.ts:59-96`) ; Master-Out ne bust pas à 1 (`matchLifecycle.ts:264`) [V+].
2. **Perte silencieuse des parties** Cricket/Capital/Killer/Gotcha/Triathlon au rechargement (`App.tsx:364-422`), contraire à la spec 010 et au README [V+].
3. **Tablette paysage** : un iPad 10,2" Safari paysage (1080×750) ou une Galaxy Tab 1280×800 reçoivent la mise en page téléphone ; le keypad X01 est écrasé (cascade `tailwind.css:198` vs `:535`) ; touches < 48 px [V+].
4. **Aucun design token** ; ~1 465 classes de couleur codées en dur dans 48 fichiers ; focus clavier invisible (`Button.tsx:15`) [V+].
5. **Voix** : 2 contacts par volée (peu de gain face au keypad), `utterance_end_ms` absent, bust annoncé rejeté alors que le keypad l'accepte, coût cloud proportionnel à l'usage [V+].
6. **Gouvernance** : 27/29 specs « active » quelle que soit leur réalité ; 11 écarts doc↔code ; aucune instruction pour agents IA ; aucun ADR [V+].

**Opportunités majeures.** Voix mains libres + caller français (combinaison non trouvée chez les concurrents consultés), mode TV local gratuit, personnalisation club sans compte, carnet/récap de parties, publication rapide du contrat partenaire déjà attendu par badarts.fr.

**Vision recommandée.** *« La station de scoring française, gratuite et sans compte, qui se pilote à la voix et s'affiche en grand. »* — mais **dans cet ordre** : (1) des règles justes et des parties qui ne se perdent jamais, (2) un socle commun (état de partie sérialisable, tokens, classes de taille), (3) les expériences signature (voix mains libres + caller, TV, tablette arène), (4) la personnalisation et les leviers d'adoption. Le parcours de base (ouvrir → jeu → prénoms → jouer) ne doit gagner **aucune étape obligatoire**.

---

## B. Bilan de la version actuelle

### B.1 Fonctionnalités effectivement disponibles [V]
- **Jeux** : X01 (301/501/701/perso, legs/sets, out Open/Double/Master, 1–2 joueurs ou 2v2, robot 5 niveaux — tirage aléatoire calibré, pas une « IA »), Cricket (2–3 joueurs ou 2v2, 10/20/30 tours, 1 manche), Capital (1–4 joueurs, 17 objectifs maison), Triathlon (Capital → Cricket → 501, barème /100), Killer (2–6, 3 vies), Gotcha (2–6, score cible).
- Voix X01 (et 501 du Triathlon) via Deepgram nova-3, token éphémère par Pages Function.
- Reprise après rechargement : **X01 seulement**.
- Statistiques de fin de partie (affichées 2 min puis retour auto).
- Lien de match externe `v=1` (X01) — badarts.fr déclaré dans `wrangler.jsonc`.
- Bouton d'installation, changelog in-app, QR d'accès (généré au build), portrait imposé sur téléphone (commit `1e8becd`).
- **Enregistré mais jamais affiché** : historique local (`listLocalGameHistory` sans consommateur UI).
- **Code présent mais inactif** : `useSharedX01Session` (no-op), port `SyncRepository` vide, domaine/use cases X01 non branchés, garde `isScreenAllowedForAccessMode` non appelé.

### B.2 Statut réel des spécifications (vérifié dans le code)

| Spec | Statut déclaré | Statut réel constaté | Traitement proposé |
|---|---|---|---|
| 001 scoring-access-modes | active | Contredite (mode `social` inexistant, garde non branché) | **Revoir intégralement** (absorbe workspace 007) |
| 002 setup-clean-architecture | active | Implémentée | **Clôturer après vérification** (reliquat → ARCH-01/02) |
| 003 voice-scoring-reliability | active | Largement implémentée, défauts de fiabilité | **Enrichir** (fiabilité/parseur) ; nouvelle spec seulement si invariant « confirmation » modifié |
| 004 release-v1.0.1 | active | Historique (tagué) | **Clôturer** |
| 005 scoreboard-layout | active | Partielle | **Fusionner** comme invariants dans TAB/QA |
| 006 voice-token-hardening | active | Partielle (runbook absent, Origin facultatif, rate-limit non global) | **Finaliser dans la V2** |
| 007 release-governance | active | Partielle | **Enrichir** via REL-01 |
| 008 e2e-runtime-reliability | active | Partielle (E2E non autonomes, 64 échecs locaux : WebKit + origine partenaire) | **Finaliser** |
| 009 env-contract | active | Partielle | **Finaliser** |
| 010 offline-session-recovery | active | **Non respectée** hors X01 ; cite des fonctions inexistantes | **Enrichir** (P0 : reprise multi-jeux, schéma versionné) |
| 011 home-install-shortcut | active | Implémentée non validée (dépend de 031) | **Finaliser** avec 031 |
| 012 (retirée) | — | Pas de trace dans `specs/` | **Conserver retirée** + fiche de traçabilité |
| 013 stats-french | active | Partielle (libellés EN restants) | **Finaliser** (absorbe GAMES-10) |
| 014 keypad-digit-scale | active | Implémentée | **Clôturer après vérification** |
| 015 x01-two-player-limit | active | Implémentée | **Conserver** ; évolution 3–4 joueurs sur décision |
| 016 x01-bot | active | Implémentée, écart plage Pro (spec 100–120 / code 86+) | **Clôturer** après arbitrage de la plage |
| 017 killer | (sans statut) | Implémentée (5 tests) | **Conserver** ; variantes → GAMES-13 |
| 018 ios12-compat | active | **Très probablement cassée** (Tailwind 4 ⇒ Safari 16.4+ [EXT]) | **Revoir intégralement** (décision baseline navigateurs) |
| 019 gotcha | (sans statut) | Implémentée (5 tests) | **Conserver** ; variantes → GAMES-14 |
| 020 inp-quick-wins | active | Implémentée non mesurée | **Clôturer après mesure** → PERF-01 |
| 021 font-scale-resilience | active | Implémentée | **Conserver** comme non-régression |
| 022 arch-SRP-split | active | Partielle (MatchView 869 l., App 479 l. — plus que l'objectif) | **Clôturer en distribuant** (→ ARCH-11) |
| 023 double-out-checkout-rate | active | Implémentée | **Conserver**, enrichir la définition |
| 024 (retirée) | — | — | **Conserver retirée** + fiche |
| 025 react-19-migration | active | Implémentée, validations manuelles ouvertes | **Clôturer** après validations (REL-01) |
| 026 release-v1.1 | active | Historique | **Clôturer** |
| 027 tablet-display | (absente de l'index) | Partielle, invariants violés (48 px, 1280×800) | **Revoir intégralement** → TAB-01/02/03/05 |
| 028 smartphone-display | (absente de l'index) | **Contredite** (portrait imposé vs « paysage jamais bloqué ») | **Revoir** (arbitrage orientation), puis fusion avec 027 |
| 029 sonar-coverage-governance | active | Appliquée, mais ~3 400 lignes de vues exclues contenant de la logique | **Enrichir** |
| 030 external-match-link | accepted | Implémentée ; tâches/notes non à jour | **Finaliser** (publication) |
| 031 pwa-static-delivery | planned | **Non traitée** ; `sw.js` précache `/logo.svg` absent du build | **Finaliser** (séquencement à arbitrer) |
| Workspace 001-xrepo-scoring-contract | — | Non ouvert | **Reporter / cadrer** (INT-07) |
| Workspace 002/006 bdt-* | — | Hors repo | **Suivre côté BDT** |
| Workspace 003 split social-shell | — | Shell social inexistant | **Abandonner** (validation humaine requise) |
| Workspace 004 device-board-session | — | Non ouvert | **Reporter** (lié à TV-07) |
| Workspace 005 offline-session-store | — | Non ouvert | **Fusionner** avec 010 |
| Workspace 007 smartphone-vs-tablet | — | Non ouvert | **Fusionner** avec 001 |

Sources « orphelines » à rattacher : `release-v1.1.3-sonar-debt`, `security-review`, `capital-game`, `smoke-e2e-per-game-navigation` ; issues fermées « not planned » à reprendre comme origines : #45 (suivi live → TV), #46/#47 (QR), #48 (identifiant de partie), #50 (offline → 031). PR #203 ouverte (raccourcis téléphone, portrait-only) sans spec.

### B.3 Dettes techniques principales [V+]
- Règles X01 dupliquées (scores impossibles ×4, `isCheckoutPossible` ×3) ; validation réimplémentée dans `MatchView.handleRemainingSubmit` ; le robot contourne la validation.
- `finishLeg` **mute** `legsWon/setsWon` de l'état d'entrée (`matchLifecycle.ts:217-220`) — bloquant pour toute extraction/diffusion.
- État des jeux non-X01 dans les vues (Cricket : 7 `useState`), 5 variantes d'undo en mémoire.
- Persistance réécrite **chaque seconde** (chrono dans l'état), `current_matches` jamais purgé, restauration par simple cast sans version de schéma.
- Cycle de types `types.ts ↔ domain ↔ utils/triathlonScoring ↔ matchStats` ; 7 imports violant la règle d'architecture ; aucun garde ESLint.
- ~16 fichiers à toucher pour ajouter un jeu.
- CI : `lint:type-aware`, `guard:clean`, `wrangler:check` non exécutés ; résumé CI affichant 75/60 au lieu de 90/80.
- Tests : aucun jeu joué jusqu'au bout en E2E (hors X01 partenaire) ; e2e tablette force `?mode=dedicated_tablet` (contourne la détection) ; aucun test visuel/a11y/voix E2E.

### B.4 Incohérences documentation ↔ code (extrait)
Double-In présenté comme disponible ; « historique local » annoncé ; « 501 Double Out » listé comme jeu ; « Bot IA » ; `CONNECTED_MODE` inexistant ; `docs/architecture.md` (arbre et règle de dépendance faux) ; notes v2.0.0 « lien désactivé » vs badarts.fr configuré ; 727 vs 746 tests ; liens absolus `/home/...` dans `docs/technical.md` ; formulaires d'issue sans Killer/Gotcha ; site vitrine promettant une « annonce vocale des scores » inexistante.

### B.5 Recommandations de traitement du backlog
1. **Assainir avant d'ajouter** : clôtures vérifiées en lot (002, 004, 014, 016, 020, 022, 025, 026), corrections de règles P0, reprise multi-jeux.
2. **Un seul propriétaire par sujet** (ex. 010 = reprise ; TAB-* = disposition ; QA = preuves) — plusieurs rapports proposaient des specs concurrentes, dédoublonnées en F.
3. **Nouvelles conventions SDD avant rédaction des specs V2** (SDD-01).

---

## C. Analyse des onze chantiers

### C.1 Scoring vocal (5.1) — détail : `reports/04-voice.md`
- **Constats** : X01 seul ; micro à la demande, fenêtre fixe 6,5 s, validation tactile (2 contacts/volée) ; worklet 128 échantillons → 375 messages/s, ré-échantillonnage 16 kHz sur le thread principal ; nova-3 FR, endpointing 300 ms, 14 keyterms ; token 55 s (2 appels Deepgram/token) ; gestion des réponses tardives solide et testée.
- **Références** : `src/features/x01/voice/useDeepgramStreaming.ts`, `voiceConfig.ts:19-35`, `dartsSpeechParserShared.ts:126-135`, `functions/api/deepgram/token.ts`, `public/pcmCaptureWorklet.js`.
- **Problèmes** : début d'annonce perdu (« Écoute » affiché avant ouverture du socket, ~64 ms tamponnés) ; `utterance_end_ms` absent alors qu'un handler existe ; bust annoncé rejeté (règle dans le parseur au lieu du moteur) ; nombres en lettres multi-mots rejetés, « un triple vingt » → 61, « il a fait 60 » lu comme reste ; aucune commande (annule/valide/suivant/corrige), aucun retour sonore/TTS ; token accepté sans `Origin`, rate-limit non global, aucun plafond de dépense ; aucune information utilisateur sur l'envoi de l'audio, région US, `mip_opt_out` non activé.
- **Solutions** : voir D.1. **Recommandation** : rester sur Deepgram (meilleur rapport fiabilité/coût/maintenance aujourd'hui) **avec** pipeline fiabilisé, parseur réécrit qui délègue les règles au moteur, corpus de mesure, VAD sur l'appareil pour réduire la durée facturée, « mode partie » mains libres, caller TTS ; étude mesurée des moteurs on-device en parallèle.
- **Cible mesurable** : ≥ 97 % volées correctes au calme / ≥ 92 % en bruit ; p95 affichage < 1 s ; ≥ 80 % des volées sans toucher l'écran en mode partie ; ≤ 0,02 $/match.
- **Bénéfices** : fonctionnalité signature « Parle, Bougnat compte ». **Contraintes/risques** : le bar est le pire environnement acoustique ; coût récurrent proportionnel (0,02 $/match = 600 $/mois à 1 000 parties vocales/jour) ; « double seize » ne dit pas quelle fléchette → précision statistique limitée ; iOS/permissions [AC].
- **À valider** : confirmation vocale explicite vs validation temporisée (modifie l'invariant 003) ; plafond budgétaire et comportement au dépassement ; serveur UE + `mip_opt_out` ; Web Speech « serveur » (audio vers Google/Apple) acceptable ? ; FR seul ou FR+EN ; voix et caller activés par défaut ?

### C.2 Mode Light (5.2) — détail : `reports/05-design-system.md`
- **Constats** : pas de `@theme` sémantique, pas de `dark:`, sombre codé en dur ; 1 465 classes couleur (305 distinctes, 100 couvrent 83 %) ; 213 transparences blanc/noir et 100 ombres/lueurs supposant un fond sombre ; 51 `!important` ; `theme-color #1a1a1a` vs manifeste `#ea580c` ; `animate-in` sans plugin ; `prefers-reduced-motion` ignoré ; contrastes insuffisants (score inactif 2,04:1).
- **Recommandation** : un seul système — tokens CSS 3 niveaux (primitives → rôles sémantiques → composants) exposés à Tailwind 4 via `@theme inline`, `data-theme` sur la racine, préférence système/sombre/clair persistée + script anti-flash. Light = palette « craie » conçue (pas une inversion), contours plutôt que lueurs. Migration : socle sans changement visuel + garde CI anti-régression → conversion mécanique → écran par écran → activation Light quand 100 % migré.
- **Risques** : régression visuelle (capturer l'existant **avant**) ; compatibilité navigateurs (C.4/D) ; effort L.
- **À valider** : tokens avant ou pendant la refonte tablette (recommandé : **dans les mêmes lots écran par écran**, après un socle commun) ; Light livré seulement à 100 % ; captures de référence + `@axe-core/playwright` (nouvelle dépendance dev).

### C.3 Expérience tablette (5.3) — détail : `reports/06-tablet.md`, captures `(captures de session, non versionnées) `
- **Constats** : détection par dimensions + `pointer: coarse` (`tabletLayout.ts:22-56`) **et** seconde détection dans `MatchView.tsx:246-266` ; iPad 10,2" paysage Safari, Galaxy Tab 1280×800, 7-8" → téléphone ; iPad Pro 12,9" → bureau ; à 960×520 le score X01 tombe à 0 px et les 21 touches Killer sont hors écran ; ligne Bull Cricket coupée ; keypad X01 ~236 px de haut, touches 26-34 px ; seul X01 lisible à distance.
- **Recommandation** : résolveur unique par **classe de taille + orientation** (seuils de largeur 600/840/1200, de hauteur 480/900), 4 recettes (`stack`, `stack-wide`, `arena`, `phone-landscape`) ; disposition **« arène »** commune à tous les jeux (bandeau, joueur actif dominant + checkout, zone de saisie au pouce avec Annuler près d'OK), un seul composant à zones, variantes « voix prioritaire » et « contrôleur TV ».
- **À valider** : arène aussi sur PC ? ; X01 2 joueurs : cartes égales ou joueur actif dominant ? ; réglage main dominante ? ; correctifs TAB-02 dans 2.0.0 (recommandé).

### C.4 Verrouillage paysage tablette (5.4)
- **Faisabilité** [EXT][V] : iPadOS Safari — ni `screen.orientation.lock()` ni `orientation` du manifeste ; Android Chrome — `lock()` possible **uniquement en plein écran** (l'app demande déjà le plein écran au lancement d'une partie) ; manifeste `orientation` pris en compte seulement en PWA installée Android (dépend de 031). Le `usePortraitLock` actuel n'est appelé qu'au montage, sans lien avec le plein écran : effet non démontré.
- **Recommandation** : (1) Android plein écran → `lock('landscape')` à l'entrée en partie, `unlock()` à la sortie ; (2) ailleurs → invite **non bloquante** limitée aux écrans de jeu, avec « Continuer en portrait » ; le portrait tablette reste supporté. Ne pas transposer aux téléphones/PC. 8 critères d'acceptation testables (AC-O1…O8) dans le rapport.
- **Challenge** : la demande d'un verrouillage strict n'est pas réalisable sur iPad ; un blocage strict serait en outre contraire à WCAG 1.3.4 sans justification d'essentialité — le même argument s'applique **au portrait imposé déjà livré sur téléphone** (spec 028 contredite).
- **À valider** : invite non bloquante vs blocage ; périmètre (écrans de jeu seulement recommandé) ; maintien du portrait-only téléphone.

### C.5 Revue de tous les jeux (5.5) — détail : une fiche par jeu dans `reports/03-games.md`
| Jeu | Bugs de règles / données | Recommandations clés |
|---|---|---|
| X01 | Double/Master-In non appliqué ; finishes impossibles acceptés ; Master-Out 1 sans bust (robot bloqué à 1) ; aide checkout « Double-Out » affichée en Open/Master (sous-optimale) ; `finishLeg` mutant | Sorties conformes, ouverture (implémenter ou retirer, impact `in=` du contrat 030), checkout contextuel, 3–4 joueurs ?, saisie fléchette par fléchette ? |
| Cricket | Écran de victoire jamais affiché (`CricketGameView.tsx:95-103`) ; égalité aux tours départagée par ordre alphabétique ; « C » = annuler (≠ X01) ; non repris au reload | Fin de partie + undo, départage, variantes Cut-throat/multi-manches (P2), voix (P2) |
| Capital | Couleurs de multiplicateurs incohérentes dans le même keypad ; totaux impossibles acceptés ; variante maison 17 objectifs | Aligner couleurs, valider totaux, documenter la variante (rétro-spec) |
| Triathlon | Barème biaisé : perdant 501 à 461 reçoit 14 (défaite « serrée ») ; Cricket 0-0 → 20 pts chacun sans tenir compte du vainqueur ; X01 embarqué non repris | Nouveau barème versionné, reprise des sous-états |
| Killer | 5 tests ; pas de confirmation de sortie, ni revanche, ni stats, ni choix du premier joueur ; touches hors écran en petit paysage | Cadre commun de jeu, variante 5 vies (P3) |
| Gotcha | Idem Killer ; totaux impossibles acceptés ; aucune source de règles vérifiée | Cadre commun, rétro-spec des règles |
- **Transverse** : 4 libellés différents pour « retour menu », ordres de boutons de fin différents, textes EN résiduels, undo depuis la fin seulement au Capital, voix seulement en X01, ~1 100 couleurs en dur dans les écrans de jeu. → **Cadre de jeu commun** (barre de partie, fin de partie, revanche avec alternance, undo, confirmation de sortie) sans uniformiser les spécificités.
- **Préalable obligatoire** : tests de caractérisation **validés métier** (pour ne pas figer les bugs) avant toute extraction.
- **À valider** : Double-In ; règles maison vs référence ; barème Triathlon ; départage Cricket ; X01 3–4 joueurs ; saisie par fléchette ; variantes en V2 ou plus tard ; retour auto après 2 min.

### C.6 Mode TV (5.6) — détail : `reports/07-tv-mode.md`
- **Constats** : rien n'existe (sync no-op) ; X01 déjà diffusable (état JSON, fonctions d'affichage pures réutilisables) ; autres jeux non exposés ; undo = restauration d'état complet ; CSP `connect-src 'self'` + Deepgram + Insights ; Pages ne peut pas **héberger** de Durable Object mais peut en **consommer** un via un Worker séparé [EXT] ; le chrono déclencherait un envoi par seconde (×5 trafic).
- **Architecture recommandée** : le contrôleur est l'unique source de vérité et l'unique écrivain ; il calcule une **projection spectateur** versionnée (sans règles côté TV) et l'envoie **complète**, numérotée (séquence + génération de session) ; corrections = nouvel envoi ; reconnexion = dernier état. Le journal d'événements (ARCH-05) est **compatible mais non requis** pour la TV. Chrono dérivé côté affichage.
- **Solution principale** : (1) **TV locale sans serveur** — fenêtre secondaire même appareil (PC + HDMI) via BroadcastChannel : 0 €, hors ligne ; (2) **si autorisé**, relais Cloudflare (Worker + DO, hibernation) pour écrans distants (navigateur Smart TV, mini-PC, Fire TV, téléphones spectateurs) avec appairage par code 6 caractères, lien lecture seule distinct du contrôle, TTL 12 h, aucun stockage ; (3) plus tard Presentation API / Google Cast ; repli : recopie d'écran.
- **Risques** : navigateurs TV anciens (Samsung 2022 = Chromium 85, LG = 87 [EXT]) vs Tailwind 4 (Chrome 111+) → **rendu TV possiblement cassé** sur TV 2022-2024 [AC] ; mono-écrivain (deux onglets restaurés) ; RGPD (prénoms en transit) ; dépassement du quota gratuit = coupure jusqu'à minuit UTC.
- **Challenge** : « écran indépendant sur une TV sans rien installer » **exige** un relais réseau (ou Cast/Presentation, limités à Chrome) — ce qui touche la frontière « pas de backend » ; la recopie (AirPlay/HDMI miroir) ne donne pas d'écran spectateur dédié. En tournoi, l'autorité live revient à BDT (constitution transverse) : l'affichage compteur y serait « provisoire ».
- **À valider** : relais optionnel sans logique métier ni stockage ? ; plan Free (coupure) ou Paid plafonné (~5,3 $/mois nominal, ~22 $ ×10) ; MVP X01 local d'abord ; prénoms/initiales minimisés **avant** envoi ; baseline navigateurs TV et achat d'appareils de test ; Cast reporté ; notion de pause.

### C.7 Personnalisation clubs/bars (5.7) — détail : `reports/05-design-system.md`
- **Recommandation** : thème club = **surcharge de quelques tokens dérivés** du système unique (pas de système parallèle) ; éditeur simple : presets + 1 à 3 couleurs de base, couleurs de texte dérivées automatiquement, garde-fous WCAG, couleurs de jeu (bust, fermé, multiplicateurs) **non personnalisables** + distance minimale avec la couleur club ; logo PNG/JPEG/WebP (SVG converti en raster via canvas ou refusé), 2 Mo max en entrée, réduit à 512 px / ~100 Ko en IndexedDB ; partage sans compte : **fichier JSON complet** + lien/QR pour les couleurs (le logo ne tient pas dans un QR) ; pas de serveur de partage en V2.
- **Co-branding non désactivable** (hors des réglages) : logo club + « BOUGNAT DARTS » réduit en en-tête de jeu ; pastille « Powered by » en TV ; intermède TV avec QR « Jouez avec Bougnat Darts » ; liseré « feu ».
- **Risques** : sécurité des fichiers importés (valider à chaque entrée, borner octets/pixels avant décodage) ; contrat TV (logo 100 Ko vs message ≤ 12 Ko → profil d'asset TV séparé) ; complexification du parcours (entrée secondaire « Préparer une station », jamais obligatoire).
- **À valider** : SVG refusé ou rasterisé ; logo dans le lien/QR ou fichier seulement ; joueur actif aux couleurs du club ? ; formule de co-branding ; noms des thèmes ; QR généré dans l'app.

### C.8 Documentation (5.8) — détail : `reports/10-docs-quality.md`
- NB : le dossier est `docs/` (et non `doc/`).
- **Constats** : sur-promesses (Double-In, historique, reprise multi-jeux, « IA »), contradictions (030, 028, compteurs de tests), arbre d'architecture faux, liens `/home/...`, notes de release « v2.0.0 active » non publiée, aucun `AGENTS.md`/instructions IA, aucun template de PR, aucun ADR, templates de spec couvrant ~10/26 rubriques demandées, langues FR/EN mélangées.
- **Organisation cible** : `docs/` par public avec statut en tête de page (implémenté / spécifié / futur / décision / historique) : `product/`, `user/`, `architecture/` + `adr/`, `dev/`, `integration/`, `ops/`, `release/` (archives) ; `AGENTS.md` racine ; index des specs généré + contrôle CI.
- **Immédiat (après autorisation)** : corrections de sur-promesses/contradictions/liens/templates d'issue. **Avec l'implémentation** : guides voix/TV/thèmes, ADR, rétro-specs.
- **À valider** : réorganiser `docs/` (déplacements) ou corriger sur place ; langue unique (français accentué recommandé) ; changelog in-app manuel.

### C.9 Structure du projet / Clean Architecture (5.9) — détail : `reports/02-architecture.md`
- **Problème central** : la vérité métier n'est pas dans le domaine. **Recommandation P0 (ARCH-04)** : état sérialisable + reducer pur `(état, commande) → état` par jeu, migré jeu par jeu (Gotcha → Killer → Capital → Cricket → X01 → Triathlon) **après** caractérisation ; débloque reprise, TV multi-jeux, voix multi-jeux, tests, contrat BDT.
- **Autres** : règles X01 uniques (le moteur qualifie le bust, voix/keypad/robot passent par la même commande) ; frontières de couches par ESLint (outil déjà présent) ; types/moteurs `utils/` → `domain` ; persistance versionnée/purgée/horodatée ; journal append-only (P2, granularité à décider) ; découpage MatchView ; registre de jeux seulement si nouveaux jeux ; **pas** de port d'intégration générique avant un 2ᵉ canal.
- **Décision sur l'existant** : ne pas rebrancher aveuglément `src/domain/scoring` — le faire passer d'abord par les mêmes tests que le chemin réel, sinon le supprimer.
- 9 ADR proposés (dossier `docs/adr/`), aucune nouvelle dépendance runtime, aucun coût hors relais TV.

### C.10 Intégrations écosystème (5.10) — détail : fiches dans `reports/08-integrations.md`
- **Existant** : contrat `v=1` propre (pures fonctions, origines `https` allowlistées au build, CSP anti-iframe, ~1 600 lignes de tests + 28 E2E) ; résultat **non signé** (choix PO 2026-11-19) ; retour même appareil ; X01 seul. **badarts.fr** = club Montpellier Hérault (plateforme DartsHub), **utilise déjà `v=1`** (page `/bougnat-retour`) [EXT]. BDT attend un contrat plus riche (jeton signé, idempotence, volées).
- **Plateformes** : voir D.4. Aucune ne permet aujourd'hui d'**envoyer** un score automatiquement de façon documentée et autorisée.
- **Recommandation** : figer `v=1` (ajouts optionnels seulement) ; sorties sans serveur (QR résultat, carte/export) pour la ressaisie manuelle (admise par 3K) ; module « match lié » neutre seulement au 2ᵉ canal ; contrat compteur↔BDT dans le workspace ; prises de contact (badarts/DartsHub, La Bomabull) **uniquement après autorisation**.
- **À valider** : statut de `v=1` ; contacts ; Cricket partenaire en V2 ? ; QR client ; critères d'admission ; libellé « Match de tournoi » ; refus de l'ouverture CSP aux iframes.

### C.11 Innovation (5.11) — détail : `reports/09-innovation.md`
Voir section E.

---

## D. Études comparatives techniques

### D.1 Scoring vocal (prix relevés le 20/11/2026 [EXT])
| Option | Coût récurrent | Fiabilité FR attendue | Hors ligne | Compatibilité | Verdict |
|---|---|---|---|---|---|
| Deepgram nova-3 + keyterms (actuel) | ~0,0061 $/min promo ≈ 0,012 $/match ; 200 $ offerts | Bonne [AC bruit] | Non | Tous navigateurs avec micro | **Garder, fiabiliser, plafonner** |
| AssemblyAI streaming | ~0,005 $/min | Non mesurée | Non | Idem | Alternative de repli à évaluer |
| Google / OpenAI realtime | 0,016–0,017 $/min | Bonne | Non | Idem | Plus cher, sans gain démontré |
| Web Speech API on-device | 0 $ | Variable, pas de grammaire | Oui (desktop) | Chrome desktop 139+, Firefox desktop 160 ; **pas mobile** | Option desktop/TV, étude |
| Web Speech « serveur » | 0 $ | Moyenne | Non | Chrome/Safari | Audio envoyé à Google/Apple → décision confidentialité |
| Moonshine-fr / Whisper WASM | 0 $ | À mesurer | Oui | Lourd (28–41 Mo), CPU tablette | **Étude mesurée (VOICE-07)** |
| Vosk WASM grammaire fermée | 0 $ | Bonne sur grammaire | Oui | Paquet non maintenu depuis 2022 | Déconseillé |
| Picovoice | Offre entreprise | — | Oui | — | Incompatible gratuité |
| Wake word | — | Faux positifs en bar | — | — | **Déconseillé en V2** |

### D.2 Diffusion TV
| Solution | Écran indépendant ? | Étapes | Infra/coût | Hors ligne | Compatibilité | Verdict |
|---|---|---|---|---|---|---|
| Fenêtre secondaire + BroadcastChannel (PC/HDMI) | Oui | 2 | 0 € | Oui | Même navigateur/appareil | **Principal (MVP)** |
| URL spectateur + relais Cloudflare DO + code court | Oui | 3 (puis 0 pour les revanches) | Free ~97 k req/j au scénario imposé (limite 100 k) ; Paid ~5,3 $/mois | Non | Smart TV (Chromium ≥ 85 [AC]), Fire TV, mini-PC, téléphones | **Principal distant, si autorisé** |
| WebRTC P2P | Oui | 3+ | Signalisation + TURN | LAN partiel | Bonne | Complexité injustifiée en V2 |
| Ably/Pusher/Supabase/Firebase | Oui | 3 | 29–99 $/mois+, nouveau sous-traitant | Non | Bonne | Écarté |
| PartyKit hébergé | — | — | Fermé le 23/10/2026 [EXT] | — | — | Écarté |
| Presentation / Window Management API | Oui | 2 | 0 € | Oui | Chrome/Edge seulement | Complément ultérieur |
| Google Cast (Custom Receiver) | Oui | 2 | 5 $ unique + hébergement | Non | Chrome ; **pas iOS** | Reporté |
| AirPlay / recopie native / HDMI miroir | **Non (recopie)** | 1–2 | 0 € | Oui | Selon appareil | Repli |

### D.3 Personnalisation, stockage et partage des thèmes
| Mécanisme | Compte ? | Serveur ? | Logo | Coût | Risques | Verdict |
|---|---|---|---|---|---|---|
| localStorage/IndexedDB (local) | Non | Non | Oui (IndexedDB) | 0 € | Par appareil | **Base** |
| Fichier JSON export/import | Non | Non | Oui (base64) | 0 € | Validation à l'import | **Partage complet recommandé** |
| Lien encodé dans l'URL | Non | Non | Non (taille) | 0 € | Longueur, validation | **Couleurs/nom** |
| QR code (client) | Non | Non | Non | 0 € (+ lib dans le bundle, chargée à la demande) | — | **Couleurs/nom, « station en un scan »** |
| Code court (Cloudflare KV/R2) | Non | Oui | Oui | Free KV = 1 000 écritures/j | Modération, abus, RGPD | **Étude P3 (BRAND-07)** |

### D.4 Plateformes externes
| Plateforme | Positionnement | Intégration vérifiée | Confirmé | Envisageable | Contact nécessaire | Impossible / non documenté |
|---|---|---|---|---|---|---|
| Darts for Windows | Logiciel Windows payant (27,99 GBP/poste) | Import CSV joueurs documenté | Import joueurs | Export résultats pour ressaisie | Partenariat format | Live scoring (pages internes non documentées — **à ne pas utiliser**) |
| 3K Darts | Portail ligues/compétitions | Iframe uniquement ; **refus public d'API** ; saisie manuelle d'un score issu d'une autre app admise | Ressaisie manuelle | Carte/QR de résultat pour faciliter la ressaisie | Si intérêt | Push automatique (réservé à leur scorer, facturé) |
| DartConnect | Ligues/tournois (US/intl.) | API REST à accès restreint (clé sur demande) ; lecture tournois/ligues, écriture joueurs/inscriptions ; CGU interdisant l'automatisation | Existence de l'API | Import de rencontres (avec clé) | **Oui** | Envoi de score (aucun endpoint) ; reprise de leur diffusion en TV |
| La Bomabull Darts | App FR d'entraînement, compte obligatoire | Aucune API/import/export publique | — | Complémentarité entraînement | **Oui (meilleur candidat)** | Intégration technique actuelle |
| (badarts.fr — hors liste) | Club, plateforme DartsHub | **Consomme déjà `v=1`** | Oui | REX, `v=2` | Oui (après autorisation) | — |

---

## E. Propositions d'innovation (classées)

Constat de veille (19 concurrents consultés, pages publiques uniquement [EXT]) : **aucune brique isolée n'est inédite** (voix : MyDarts, Darts Scorer 180… ; TV : Darts Scorer 180, Dartcaster, Scolia ; offre lieux : The Darts App à 199 $/an). Signal fort : chez DartCounter, saisie vocale (550 votes) et TV (741 votes) demandées depuis ~4 ans sans livraison. **La différenciation viendra de la combinaison et des valeurs** (FR, gratuit, sans compte, sans pub, sans limite), pas de la nouveauté technique. L'hypothèse « voix + TV + personnalisation = station club/bar » est **partiellement confirmée** : pertinente pour les clubs (fiabilité, résultats, affichage), **moins pour les bars** (pire acoustique, besoin d'animation plutôt que de terminal).

| Rang | Proposition | Valeur | Différenciation | Complexité | Coût | Signature ? |
|---|---|---|---|---|---|---|
| 1 | **« Parle, Bougnat compte »** : boucle vocale mains libres + caller FR (TTS, moments forts 180/gros finish) | Très haute | Combinaison FR entrée+sortie non trouvée chez les 19 consultés | L | Voix cloud (budget) ; TTS navigateur 0 € | **Oui** |
| 2 | **Mode TV local → distant** | Très haute (clubs, salon) | Faible seul, forte combinée gratuite | L | 0 € local ; ~0–5 $/mois relais | **Oui (avec 1)** |
| 3 | **« Mes parties »** : carnet local (données déjà enregistrées) | Haute | Faible | M | 0 € | Non (indispensable) |
| 4 | **« La partie à emporter »** : récap image + QR sans serveur | Haute (adoption virale sans pub) | Moyenne | M | 0 € | **Oui** |
| 5 | **« Station en un scan »** : QR/lien de configuration du lieu + affiche imprimable | Haute (clubs/bars) | Équivalent gratuit d'offres payantes | M | 0 € | **Oui** |
| 6 | Mode Découverte (première partie guidée, règles interactives) | Moyenne-haute | Moyenne | M | 0 € | Non |
| 7 | Atelier finitions (entraînement checkout, jouable à la voix) | Moyenne | Faible | M | 0 € (+voix) | Non |
| 8 | « Soirée éclair » : mini-tournoi local sans compte | Moyenne-haute | Moyenne | L | 0 € | Conditionnelle (frontière BDT) |
| 9 | Défi du comptoir | Moyenne (bars) | Moyenne | M | 0 € | Non |
| 10 | Mode accessibilité audio (jouer sans voir l'écran) | Niche mais forte image | Forte [AC] | M | 0 € | Non |

Non retenu en V2 : caméras d'auto-scoring (étude P3 d'un point d'entrée agnostique uniquement), wake word, comptes/cloud.

---

## F. Catalogue consolidé des spécifications proposées

Règles : IDs existants `NNN` conservés quand une spec existante est enrichie ; nouvelles entrées `V2-<DOMAINE>-NN` (alias des IDs des rapports conservés dans les rapports). Toutes au statut **À VALIDER**. Complexité S/M/L/XL. Priorité P0 (indispensable avant/pendant fondations) → P3 (ultérieur).

### F.1 Gouvernance, release, documentation, qualité
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| V2-SDD-01 | Conventions SDD v2 | Documentation | 6 statuts + `validation`, en-tête YAML commun, 3 gabarits (fonctionnel/étude/ADR), index généré + `governance:specs`, règles de clôture, fiches 012/024 | Indirecte (fiabilité du suivi) | M | P0 | — | À VALIDER |
| V2-REL-01 | Clôture et publication 2.0.0 | Backlog existant (007, 025, 026) | Validations 025, E2E complète Chromium/WebKit, Sonar/Snyk, notes corrigées, séquencement 031 | Haute (contrat attendu par badarts.fr) | M | P0 | 030, V2-DOC-01, V2-QA-10 | À VALIDER |
| 030 | Lien de match externe — finalisation | Backlog existant | Tâches/notes à jour, voix en match lié testée, libellés génériques (INT-10), `v=1` figé + ajouts optionnels | Haute | S | P0 | — | À VALIDER |
| 031 | PWA livraison statique | Backlog existant | Manifeste/SW livrés, précache corrigé (`/logo.svg`), mises à jour hors partie, offline | Haute | M | P0/P1 | — | À VALIDER |
| 018 | Baseline navigateurs (iOS 12, TV) | Backlog existant + Reco archi | Étude/décision de compatibilité (Tailwind 4 = Safari 16.4/Chrome 111 ; TV Chromium 85–108) et stratégie CSS de repli | Haute (sinon écrans cassés) | M | P0 | — | À VALIDER |
| V2-DOC-01 | Corrections documentaires immédiates | Documentation | Sur-promesses, contradictions, liens `/home`, compteurs, templates d'issue Killer/Gotcha | Moyenne | S | P0 | — | À VALIDER |
| V2-DOC-02 | Organisation documentaire + ADR | Documentation | `docs/` par public, statut en tête, `docs/adr/`, index | Moyenne | M | P1 | V2-SDD-01 | À VALIDER |
| V2-DOC-03 | Onboarding agents IA (`AGENTS.md`) | Documentation | Conventions, architecture réelle, commandes, règles de lecture/écriture | Moyenne | S | P1 | V2-DOC-02 | À VALIDER |
| V2-DOC-05 | Guides utilisateur V2 | Documentation | Voix, TV, thèmes, station (avec l'implémentation) | Moyenne | M | P2 | specs concernées | À VALIDER |
| V2-QA-10 | Durcissement CI | Reco architecturale | `lint:type-aware`, `guard:clean`, `wrangler:check`, seuils affichés corrects, E2E planifiés | Indirecte | S | P0 | — | À VALIDER |
| V2-QA-01 | Golden tests de règles + caractérisation | Reco architecturale | Fixtures validées métier par jeu **avant** extraction ; tests d'immutabilité | Haute (anti-régression) | M | P0 | décisions GAMES | À VALIDER |
| V2-QA-04 | Parcours E2E complets par jeu | Reco QA | Partie jouée jusqu'au bout, undo, reload | Haute | M | P1 | 010 | À VALIDER |
| V2-QA-05/06 | Accessibilité (axe) + régression visuelle | Reco UX/UI | Captures de référence Docker Playwright, contrastes automatisés | Moyenne | M | P1 | V2-DS-01 | À VALIDER |
| V2-QA-09 | Matrice appareils réalistes | Reco QA | Viewports avec barres navigateur, sans forçage `dedicated_tablet` ; Android/Firefox planifiés | Haute | M | P0 | V2-TAB-01 | À VALIDER |
| 008 | E2E runtime reliability — finalisation | Backlog existant | E2E autonomes (WebKit, origine partenaire de test) | Indirecte | S | P1 | — | À VALIDER |
| 029 | Gouvernance couverture — enrichissement | Backlog existant | Réduire les exclusions de vues contenant de la logique | Indirecte | S | P1 | ARCH-04 | À VALIDER |
| 006 / 009 / 013 | Finalisations | Backlog existant | Token voix (Origin, rate-limit global, plafond, kill switch, runbook) ; contrat env ; libellés FR | Moyenne | S–M | P1 | — | À VALIDER |
| V2-PERF-01 | Budgets de performance | Backlog existant (020) | INP mesuré, poids de bundle par chunk | Moyenne | S | P2 | — | À VALIDER |

### F.2 Règles de jeu et architecture
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| V2-GAMES-01 | Conformité des sorties X01 | Backlog existant (bug) | Finishes impossibles refusés, Master-Out 1 = bust, aide checkout contextuelle | Très haute | S | P0 | V2-QA-01 | À VALIDER |
| V2-GAMES-02 | Ouverture Double/Master-In | Backlog existant (sur-promesse) | Implémenter (attestation d'ouverture) **ou** retirer l'option + `in=` du contrat | Haute | M | P0 | 030 | À VALIDER |
| V2-GAMES-04 | Fin de partie Cricket | Backlog existant (bug) | Écran de victoire + annulation de la fléchette gagnante ; départage aux tours | Haute | S | P0 | — | À VALIDER |
| V2-GAMES-05 | Barème Triathlon v2 | Backlog existant (bug) | Barème versionné tenant compte des écarts et du vainqueur réel | Moyenne | M | P1 | décision | À VALIDER |
| 010 | Reprise fiable multi-jeux | Backlog existant | Tous les jeux (et sous-états Triathlon), schéma versionné validé, purge, chrono horodaté, erreurs visibles | Très haute | L | P0 | V2-ARCH-04 | À VALIDER |
| V2-ARCH-04 | État de partie sérialisable par jeu | Reco architecturale | Reducer pur par jeu, migration jeu par jeu | Indirecte mais structurante | L | P0 | V2-QA-01 | À VALIDER |
| V2-ARCH-03 | Règles X01 uniques et commandes partagées | Reco architecturale | Une source de règles ; keypad, voix, robot, partenaire via la même commande ; moteur qualifie le bust | Haute | M | P0/P1 | V2-QA-01 | À VALIDER |
| V2-ARCH-01/02 | Frontières de couches + domaine legacy | Reco architecturale | Garde ESLint, `utils/` → `domain`, sort du domaine X01 inutilisé, cycle de types | Indirecte | M | P1 | — | À VALIDER |
| V2-ARCH-05 | Journal de partie append-only | Reco architecturale | Undo persistant, correction d'une volée passée ; granularité à décider | Moyenne | M | P2 | ARCH-04 | À VALIDER |
| V2-ARCH-11 | Découpage de MatchView | Backlog existant (022) | Reliquat SRP | Indirecte | M | P2 | ARCH-03 | À VALIDER |
| V2-ARCH-09 | Registre de jeux | Reco architecturale | Seulement si de nouveaux jeux sont validés | Indirecte | M | P3 | ARCH-04 | À VALIDER |
| V2-GAMES-06/07/08 | Cadre de jeu commun | Reco UX/UI | Barre de partie, fin commune, revanche avec alternance, undo cohérent, confirmation de sortie | Haute | M | P1 | ARCH-04 | À VALIDER |
| V2-GAMES-26..29 | Rétro-specs X01/Cricket/Capital/Triathlon | Documentation | Règles de référence des golden tests | Moyenne | M | P1 | V2-SDD-01 | À VALIDER |
| 015 / 017 / 019 / 023 | Évolutions jeux existants | Backlog existant | X01 3–4 joueurs ; variantes Killer/Gotcha ; définition taux de checkout | Moyenne | S–M | P2 | décisions | À VALIDER |
| V2-GAMES-12 | Variantes Cricket (Cut-throat, multi-manches) | Demande V2 | — | Moyenne | M | P2 | ARCH-04 | À VALIDER |

### F.3 Design system, thèmes, tablette
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| V2-DS-01 | Design tokens (socle) | Demande V2 + Reco UX/UI | 3 niveaux, `@theme inline`, `data-theme`, garde CI anti-classes brutes, Dark identique | Indirecte, structurante | L | P0 | 018 | À VALIDER |
| V2-DS-02 | Composants de base accessibles | Reco UX/UI | Button (focus visible — quick win P0), états, cibles 48 px | Haute | M | P1 | DS-01 | À VALIDER |
| V2-DS-03 | Migration écran par écran | Reco UX/UI | Conversion mécanique puis manuelle, avec TAB-03 | Indirecte | L | P1 | DS-01, QA-05/06 | À VALIDER |
| V2-DS-04 | Couleurs métier réservées | Reco UX/UI | Multiplicateurs, bust, fermé, joueur actif (convention commune) | Haute | S | P1 | DS-01 | À VALIDER |
| V2-DS-05 | Motion et `prefers-reduced-motion` | Reco UX/UI | — | Moyenne | S | P2 | DS-01 | À VALIDER |
| V2-THEME-01 | Mode Light | Demande V2 | Palette conçue, activée à 100 % de migration | Haute | M | P1 | DS-03 | À VALIDER |
| V2-THEME-02 | Préférence de thème | Demande V2 | Système/sombre/clair, persistance, anti-flash, `theme-color` dynamique | Haute | S | P1 | DS-01 | À VALIDER |
| V2-TAB-01 | Résolveur classes de taille/orientation | Demande V2 + Reco archi | Une seule source (supprime la détection de MatchView) | Haute | M | P0 | — | À VALIDER |
| V2-TAB-02 | Correctifs tablette/paysage | Backlog existant (027) | Score 0 px, touches Killer, Bull coupé, keypad écrasé, 48 px | Très haute | M | P0 | TAB-01 | À VALIDER |
| V2-TAB-03 | Disposition « arène » | Demande V2 | Composant à zones commun, lisibilité à distance, main dominante, variantes voix/TV | Très haute | L | P1 | TAB-01, DS-01 | À VALIDER |
| V2-TAB-05 | Orientation tablette | Demande V2 | Verrou Android plein écran + invite non bloquante, écrans de jeu ; révision 028 (téléphone) | Haute | M | P1 | TAB-01, 031 | À VALIDER |
| 027 / 028 / 005 / 021 | Specs d'affichage existantes | Backlog existant | 027 → remplacée par TAB ; 028 révisée puis fusionnée ; 005/021 invariants | — | S | P1 | TAB-* | À VALIDER |

### F.4 Voix
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| 003 | Fiabilité et parseur voix FR | Backlog existant | Pré-connexion/tampon, `utterance_end_ms`, nombres en lettres, faux « reste », bust délégué au moteur | Très haute | M | P0 | ARCH-03 | À VALIDER |
| V2-VOICE-03 | Corpus et banc de mesure | Demande V2 | Corpus FR (calme/bruit), métriques, E2E simulé (micro + WS factices) | Indirecte, indispensable | M | P0 | — | À VALIDER |
| V2-VOICE-09 | Confidentialité voix | Demande V2 | `mip_opt_out`, région UE, information utilisateur | Haute (confiance) | S | P0 | — | À VALIDER |
| V2-VOICE-04 | Port de reconnaissance + commandes | Reco architecturale | Interface `SpeechRecognizer`, grammaire par jeu, commandes métier partagées | Indirecte | M | P1 | ARCH-03 | À VALIDER |
| V2-VOICE-05 | Mode partie mains libres | Demande V2 + Innovation | Écoute continue avec VAD, commandes (annule/valide/suivant/corrige/reste), confirmation choisie | Très haute | L | P1 | VOICE-03/04, 003 | À VALIDER |
| V2-VOICE-06 | Caller « Bougnat » (TTS FR) | Innovation produit | Annonce scores/restes/moments forts, propriétaire audio unique | Très haute | M | P1 | VOICE-04 | À VALIDER |
| V2-VOICE-07 | Étude moteurs on-device | Étude exploratoire | Web Speech, Moonshine/Whisper WASM : mesure fiabilité/poids/CPU | Moyenne | M | P2 | VOICE-03 | À VALIDER |
| V2-VOICE-08 | Voix multi-jeux (Cricket d'abord) | Demande V2 | — | Haute | L | P2 | ARCH-04, VOICE-04 | À VALIDER |
| V2-VOICE-11 | État vocal sur la TV | Demande V2 | État vocal éphémère séparé du score engagé | Moyenne | S | P2 | TV-02 | À VALIDER |
| V2-VOICE-14 | Accessibilité audio | Innovation produit | Jeu sans voir l'écran | Moyenne | M | P3 | VOICE-05/06 | À VALIDER |

### F.5 Mode TV
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| V2-TV-01 | Étude/ADR diffusion + frontière serveur | Étude exploratoire | Décision relais optionnel, autorité en tournoi (BDT), PoC | Structurante | M | P0 | — | À VALIDER |
| V2-TV-02 | Projection spectateur versionnée | Reco architecturale | Contrat snapshot + séquence + génération, sans règles côté TV, sans chrono déclencheur | Indirecte | M | P1 | ARCH-03 (X01) | À VALIDER |
| V2-TV-04 | TV locale (fenêtre secondaire) | Demande V2 | BroadcastChannel, HDMI, hors ligne, 0 € | Haute | M | P1 | TV-02 | À VALIDER |
| V2-TV-06 | Interface TV X01 | Demande V2 | Lisibilité 3–5 m, 16:9, animations 180/checkout, victoire | Très haute | M | P1 | TV-02, DS-01 | À VALIDER |
| V2-TV-05 | Relais distant (Worker + DO) | Demande V2 | Lecture seule, mono-écrivain, TTL, minimisation des prénoms, plafond | Très haute | L | P2 | TV-01 (décision) | À VALIDER |
| V2-TV-07 | Appairage par code/QR | Demande V2 | 3 étapes, reconnexion auto, revanches sans ré-appairage | Haute | M | P2 | TV-05, QR-01 | À VALIDER |
| V2-TV-08 | Interfaces TV autres jeux | Demande V2 | Présentation propre à chaque jeu | Haute | L | P2 | ARCH-04, TV-06 | À VALIDER |
| V2-TV-11 | Qualification sur TV réelles | Reco QA | Samsung/LG/Android TV/Fire TV | Indirecte | M | P2 | TV-05 | À VALIDER |
| V2-TV-10 / 13 / 16 | Multi-écrans ; étude Cast ; mur multi-cibles | Étude exploratoire | Non obligatoires ; mur = BDT | Moyenne | M–L | P3 | TV-05 | À VALIDER |

### F.6 Personnalisation et adoption
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| V2-QR-01 | Générateur QR côté client partagé | Reco architecturale | Chargé à la demande ; payloads distincts (thème, TV, résultat, récap) | Indirecte | S | P1 | — | À VALIDER |
| V2-BRAND-01 | Modèle de thème club | Demande V2 | Graines → tokens dérivés, garde-fous WCAG, couleurs métier protégées | Haute (clubs) | M | P2 | DS-01, DS-04 | À VALIDER |
| V2-BRAND-02 | Éditeur visuel | Demande V2 | Presets, 1–3 couleurs, aperçu jeu/TV, réinitialisation | Haute | M | P2 | BRAND-01 | À VALIDER |
| V2-BRAND-03 | Import de logo | Demande V2 | Raster borné, SVG refusé/rasterisé, IndexedDB | Haute | M | P2 | BRAND-01 | À VALIDER |
| V2-BRAND-04 | Partage sans compte | Demande V2 | Fichier JSON + lien/QR couleurs | Haute | M | P2 | BRAND-01, QR-01 | À VALIDER |
| V2-BRAND-05 | Mention Bougnat Darts obligatoire | Demande V2 | Co-branding non désactivable | Indirecte (marque) | S | P2 | BRAND-01 | À VALIDER |
| V2-BRAND-06 | Thème transmis à la TV | Demande V2 | Profil d'asset TV séparé (taille bornée) | Haute | S | P2 | TV-02, BRAND-01 | À VALIDER |
| V2-STATION-01 | « Station en un scan » | Innovation produit | Configuration de lieu par QR/lien + affiche | Haute | M | P2 | BRAND-04, QR-01 | À VALIDER |
| V2-HIST-01 | « Mes parties » (historique local) | Backlog existant + Innovation | Afficher l'historique déjà enregistré (ou arrêter de l'enregistrer) | Haute | M | P1 | 010 | À VALIDER |
| V2-SHARE-01 | « La partie à emporter » | Innovation produit | Récap image + QR sans serveur, export local | Haute | M | P2 | QR-01 | À VALIDER |
| V2-GAMES-23 | Mode Découverte | Innovation produit | Première partie guidée | Moyenne | M | P2 | GAMES-06/07 | À VALIDER |
| V2-TRAIN-01 | Étude entraînement (finitions) | Étude exploratoire | — | Moyenne | M | P3 | VOICE-05 | À VALIDER |
| V2-GAMES-24 / 25 | Défi du comptoir ; Soirée éclair (étude, frontière BDT) | Innovation produit | — | Moyenne | M–L | P3 | ARCH-04 | À VALIDER |
| V2-BRAND-07 | Étude stockage serveur de thèmes | Étude exploratoire | Code court KV/R2 | Faible | M | P3 | BRAND-04 | À VALIDER |

### F.7 Intégrations
| ID proposé | Spécification | Origine | Description | Valeur utilisateur | Complexité | Priorité | Dépendances | Décision |
|---|---|---|---|---|---|---|---|---|
| V2-INT-02 | REX badarts.fr / DartsHub | Étude exploratoire | Retour d'usage réel de `v=1` (contact soumis à autorisation) | Haute | S | P1 | 030 | À VALIDER |
| V2-INT-04 | Retour résultat par QR | Demande V2 | Transfert inter-appareils sans serveur | Moyenne | S | P2 | QR-01 | À VALIDER |
| V2-INT-07 | Cadrage contrat compteur ↔ BDT | Backlog existant (workspace 001) | Commandes/événements/snapshots, idempotence | Structurante | M | P2 | TV-02 | À VALIDER |
| V2-INT-08 | Politique d'admission partenaires | Reco architecturale | Critères, compatibilité, révocation | Moyenne | S | P2 | — | À VALIDER |
| V2-INT-05 | Étude contrat `v=2` | Étude exploratoire | Cricket, retour onglet d'origine, détail des volées | Moyenne | M | P3 | INT-02 | À VALIDER |
| V2-INT-03 | Module neutre « match lié » | Reco architecturale | Seulement au 2ᵉ canal accepté | Indirecte | M | P3 | INT-05 | À VALIDER |
| V2-INT-09 | Programme de prises de contact | Étude exploratoire | La Bomabull, DartConnect (clé API), etc. — **sur autorisation** | Moyenne | S | P3 | — | À VALIDER |
| V2-ARCH-15 | Étude point d'entrée de score agnostique (caméras) | Étude exploratoire | Scolia/Autodarts : faisabilité seulement | Faible | M | P3 | ARCH-03 | À VALIDER |

---

## G. Roadmap prévisionnelle (provisoire, sans calendrier)

**Lot 0 — Assainir et publier 2.0.0** *(rapide, débloque la confiance)*
V2-SDD-01, V2-DOC-01, V2-QA-10, 030, V2-GAMES-01, V2-GAMES-04, décision V2-GAMES-02, V2-TAB-02 (+ focus visible), quick wins 003 (`utterance_end_ms`, bust), V2-VOICE-09, V2-REL-01, décision 031 (avant/après publication), clôtures vérifiées en lot.

**Lot 1 — Fondations communes** *(évite les refontes successives)*
Décision 018 (baseline navigateurs, y compris TV) → V2-QA-01 (caractérisation) → V2-ARCH-03 → V2-ARCH-04 jeu par jeu + 010 (reprise multi-jeux) ; V2-ARCH-01/02 ; V2-DS-01/02/04 (Dark identique) ; V2-TAB-01 + V2-QA-09 ; V2-VOICE-03 ; décision V2-TV-01.

**Lot 2 — Expérience de jeu** *(par écran, tokens + arène dans les mêmes PR)*
V2-DS-03 + V2-TAB-03 + V2-TAB-05 ; V2-GAMES-06/07/08, 013, V2-GAMES-05 ; V2-THEME-02 puis V2-THEME-01 à 100 % ; V2-QA-04/05/06 ; V2-HIST-01 ; 006.

**Lot 3 — Signatures voix et TV** *(la TV locale n'attend pas le relais)*
003 complet, V2-VOICE-04/05/06 ; V2-QR-01 ; V2-TV-02/04/06 (X01 local) ; puis, si autorisé, V2-TV-05/07/11 ; V2-VOICE-11.

**Lot 4 — Personnalisation et adoption**
V2-BRAND-01…06, V2-STATION-01, V2-SHARE-01, V2-GAMES-23 ; V2-TV-08 (autres jeux) ; V2-DOC-02/03/05.

**Lot 5 — Ouverture et extensions (V2.x ou ultérieur)**
V2-VOICE-07/08/14, V2-INT-*, V2-GAMES-12, 015/017/019, V2-TRAIN-01, V2-GAMES-24/25, V2-ARCH-05/09/11/15, V2-TV-10/13/16, V2-BRAND-07, V2-PERF-01.

**Fondations clés à ne pas sauter** : (1) caractérisation des règles avant extraction ; (2) état sérialisable par jeu (sert reprise + TV + voix + BDT) ; (3) tokens uniques (Dark + Light + club + TV) ; (4) résolveur de taille unique (téléphone + tablette + TV contrôleur) ; (5) commandes métier partagées (keypad + voix + robot + partenaire).

---

## H. Questions et arbitrages

**Bloquants (avant toute rédaction)**
1. **Périmètre « V2 »** : la 2.0.0 (lien partenaire) est prête et attendue par badarts.fr. Recommandation : publier 2.0.0 après le Lot 0, et livrer la vision V2 en 2.x incrémentales. Ou bien conserver tout sous 2.0.0 ?
2. **Double/Master-In** : implémenter (et comment saisir l'ouverture) ou retirer (impact `in=` du contrat `v=1`) ?
3. **Baseline navigateurs** : maintenir iOS 12 (spec 018, probablement déjà cassée) ? Quelles générations de TV (Chromium ≥ 85 ?) ? Budget d'appareils de test ?
4. **Relais serveur optionnel pour la TV distante** (sans logique métier ni stockage) : autorisé ? Plan Free avec coupure ou Paid plafonné (~5 $/mois) ?
5. **Budget voix** : plafond mensuel et comportement au dépassement (retour clavier) ; serveur UE + `mip_opt_out`.
6. **Confirmation vocale** : tactile, vocale explicite, ou validation temporisée opt-in (modifie l'invariant 003) ?
7. **Orientation** : invite non bloquante (recommandé) vs blocage ; écrans de jeu seulement ; maintien du portrait imposé sur téléphone (WCAG 1.3.4) et révision de 028.
8. **Conventions SDD** : adopter V2-SDD-01 avant de rédiger les specs V2 ? Langue unique (français accentué) ?

**Produit / jeux**
9. Reprise multi-jeux en P0 (recommandé) ?
10. Règles maison vs règles de référence par défaut (Capital 17 objectifs, Killer) ; barème Triathlon ; départage Cricket.
11. X01 3–4 joueurs ; saisie fléchette par fléchette ; variantes Cricket en V2 ?
12. Historique local : afficher (« Mes parties ») ou cesser d'enregistrer ?
13. Signatures retenues : voix mains libres + caller, TV, « Station en un scan », « Partie à emporter » ? « Soirée éclair » vs frontière BDT ?
14. Caller : activé par défaut ? ton humoristique « Bougnat » ? TTS navigateur ou voix enregistrée ?
15. Bot Pro : plage de la spec (100–120) ou du code (86+) ?

**Personnalisation / TV**
16. SVG refusé ou rasterisé ; logo dans le lien/QR ou fichier seulement ; joueur actif aux couleurs du club ?
17. Formule de co-branding ; TV sombre par défaut ou thème hérité.
18. Prénoms complets ou initiales **avant envoi** ; spectateurs publics par lien ?
19. Notion de pause (inexistante) ; Google Cast reporté ?

**Intégrations / gouvernance**
20. `v=1` figé avec ajouts optionnels ? Cricket partenaire en V2 ?
21. Autorisation de contacter badarts.fr/DartsHub, La Bomabull, DartConnect ?
22. Autorité en tournoi : l'affichage compteur reste « provisoire », BDT fait foi ?
23. Workspace : abandon de l'item `003-counter-split-scoring-client-from-player-social-shell` ?
24. Domaine X01 inutilisé : rebrancher (après tests) ou supprimer ?
25. Nouvelles dépendances dev : `@axe-core/playwright`, captures de référence versionnées ; `qrcode` embarqué côté client ?
26. Réorganisation physique de `docs/` ou corrections sur place ? Changelog in-app manuel ?
27. Mesure d'adoption (Cloudflare Web Analytics sans cookie) ou y renoncer ? Correction du site vitrine (promesse « annonce vocale ») maintenant ?

**Incertitudes non levées** : aucun test sur appareil réel (iPad Safari, Android plein écran, Smart TV, iOS 12) ; qualité Deepgram FR en bruit ; transcription réelle des nombres FR ; coûts relais/voix fondés sur hypothèses de charge ; CGU de 3K et La Bomabull non lues ; pages PDC/WDF inaccessibles (règles via Wikipédia) ; état réel de la production non vérifié.

---

## I. Bilan des travaux multi-agents

**Exécution réelle** : 10 agents spécialistes indépendants exécutés en parallèle (contextes séparés), chacun ayant analysé lui-même le code de son périmètre, puis 4 relecteurs transverses indépendants ; coordination, vérifications ponctuelles et consolidation par l'agent coordinateur.

| Agent | Périmètre | Principaux fichiers analysés | Conclusions principales |
|---|---|---|---|
| Specs & backlog (PM) | 4, 10.B | `specs/001-031`, `.specify/`, workspace, issues/PR | Statuts non fiables ; traitement de chaque spec ; 28 entrées backlog |
| Architecture | 5.9, fondations | `App.tsx`, `src/**`, `utils/**`, persistance | Domaine X01 non branché ; état dans les vues ; ARCH-04 P0 |
| Fonctionnel jeux | 5.5 | moteurs, vues, keypads, stats, tests des 6 jeux | Bugs de règles X01/Cricket/Triathlon ; cadre commun |
| Voix | 5.1 | `src/features/x01/voice/**`, `functions/`, worklet | Pipeline à fiabiliser, parseur, coûts, vision mains libres |
| Design system / personnalisation | 5.2, 5.7 | `tailwind.css`, 48 fichiers UI, manifest | Aucun token ; architecture unique ; co-branding |
| Frontend / tablette | 5.3, 5.4 | `tabletLayout.ts`, CSS, vues ; émulation Playwright | Mauvaise classification ; arène ; orientation |
| TV / sync | 5.6 | état X01, sync no-op, CSP, Pages/DO | TV locale d'abord, relais optionnel chiffré |
| Intégrations | 5.10 | `external-match/**`, spec 030, BDT (survol), 4 plateformes | `v=1` à figer ; aucune API d'envoi de score |
| Innovation | 5.11, 6 | produit, 19 concurrents | Signatures ; différenciation par combinaison |
| Docs & qualité | 5.8, QA | tous les `.md`, tests, CI, couverture | Sur-promesses ; CI incomplète ; stratégie non-régression |
| Revue Voix × Jeux × TV | 9 | rapports 02/03/04/07 + code | 9 constats confirmés, 1 infirmé (moteur « immuable » : faux) |
| Revue DS × Tablette × Perso | 9 | rapports 05/06/07/09 + code | Baseline navigateurs commune ; contrat thème TV ; WCAG 1.3.4 |
| Revue Archi × Sync × Intégrations | 9 | rapports 02/07/08 + constitution | Calcul DO confirmé ; chrono ×5 ; mono-écrivain ; « pas de backend métier » ≠ « aucun relais » |
| Revue Docs × QA × Specs | 9 | rapports 01/10 + toutes propositions | Couverture backlog complète ; schéma d'IDs ; dédoublonnage |

**Désaccords mis en évidence et arbitrage proposé**
- *Moteur X01 « immuable »* (TV) vs **mutation de `finishLeg`** (revue) → la revue a raison [V].
- *« Pas de backend »* interprété comme interdiction de tout relais (TV) vs « backend **métier** » seulement (revue) → à trancher par ADR (question 4).
- *Spec 003* : clôturer/remplacer (voix, backlog) vs enrichir (revue, la spec interdit ses doublons) → **enrichir**, nouvelle spec seulement si l'invariant de confirmation change.
- *Ordre tokens / tablette* : avant (DS) vs pendant (TAB) → socle tokens d'abord, puis migration et arène **dans les mêmes lots**.
- *TV Chromium ≥ 87 couvre 2022* (TV) vs Samsung 2022 = 85 (revue) → baseline à fixer en 018.
- *Journal événementiel prérequis de la TV* → non : compatibles, mais indépendants.
- *Manifeste absent du build* (backlog) vs manifeste hashé livré (revue) → nuancé : `/manifest.json` et `/sw.js` racine absents, manifeste hashé référencé ; installabilité Android non démontrée.

**Limites et incidents**
- Aucun test/build/couverture n'a été lancé dans le repo (pour garantir zéro écriture) ; chiffres de tests issus des documents/rapports existants.
- Aucune vérification sur appareil réel, TV, ni session Deepgram réelle ; tablette mesurée en émulation Chromium uniquement.
- `web_fetch` indisponible pour certains agents (proxy) → pages publiques lues via `curl` ; certaines pages inaccessibles (PDC, WDF, tarifs Firebase, CGU 3K/La Bomabull).
- `.env.local` exclu par la politique de contenu — non lu.
- **Incident** : l'agent TV a créé par erreur un fichier temporaire dans le repo puis l'a supprimé immédiatement ; vérification finale par le coordinateur : `git status` vide, HEAD `508dfa6` inchangé.
- Le repo voisin BDT contenait des modifications locales préexistantes non liées à ces travaux (non touchées).
- Aucun partenaire contacté.
