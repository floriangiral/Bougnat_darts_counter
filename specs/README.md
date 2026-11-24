# Spécifications — Bougnat_darts_counter

> Index généré lors de la revue V2 du 2026-11-20. Conventions : [.specify/conventions.md](../.specify/conventions.md). Feuille de route : [docs/roadmap-v2.md](../docs/roadmap-v2.md). Projet GitHub : [Bougnat Darts V2](https://github.com/users/floriangiral/projects/2).

## Règles

- Nouvelle spec : `specs/NNN-counter-sujet/` avec `spec.md`, `plan.md`, `tasks.md` (gabarits dans `.specify/templates/`). Les numéros ne sont jamais réutilisés.
- Les identifiants `V2-<DOMAINE>-NN` sont des alias portés par l'en-tête YAML et le titre de l'issue.
- **Toutes les propositions V2 sont au statut `a-valider`** : rien ne s'implémente avant une décision explicite du product owner (label `decision:validee` sur l'issue, statut `validee` dans la spec).
- Un contrat inter-repos majeur relève d'une spec transverse du workspace, référencée ici.
- Le contenu de `specs/` et `.specify/` est versionné dans ce dépôt.
- Décision du product owner du 2026-11-24 : retrait de tout l'outillage Docker ; développement Node/npm natif et E2E/smoke exclusivement en CI. Les mentions Docker des anciens audits, notes de version et propositions sont conservées pour la traçabilité, mais ne justifient pas de réintroduire cet outillage ; les propositions concernées doivent être réévaluées avant implémentation.

## Release active

- `v2.1.0` : tag et GitHub Release publiés le 2026-11-23, pas encore promue en production ; branche `release/v2.1.0` ; notes : [release v2.1.0](../docs/release/v2.1.0.md) ; traçabilité : [coverage map](../docs/release/v2.1.0-coverage-map.md) ; gate : [checklist](../docs/release/checklist.md). Première version 2 publiée : elle reprend toute la `v2.0.0` (préparée et fusionnée dans `main`, jamais promue en production, sans tag ni GitHub Release ; production actuelle `v1.1.4`).
- Ajouts propres à la `v2.1.0` : correctifs de recette preprod (#322 à #326) et trois évolutions X01 réalisées **hors spec** à la demande du product owner (2026-11-23) : partie rapide, limite de volées par manche avec départage au bull, score personnalisé plafonné à 2501.
- Contenu repris de la `v2.0.0` : lien de match externe `X01` (030, finalisé par sa Révision V2), application installable et hors ligne (031), améliorations X01 sur téléphone (PR #203), corrections de règles et reprise des parties (045-048, 054, 010), X01 jusqu'à 4 joueurs (052), chantier « refonte tablette et thèmes » (063-066, 068-072, révisions de 027 et 028 : tablette portrait de référence et arène paysage, invite non bloquante sur téléphone en paysage, thèmes Auto / Sombre / Clair ; 073 rejetée). Le portrait imposé sur téléphone (commit `1e8becd`) est retiré avant publication (spec 028, option B).
- Avant publication : voir [V2-REL-01](033-counter-release-v2-0-0-publication/spec.md) (lot 0 de la feuille de route V2), appliquée à la `v2.1.0`.
- Le nombre de tests unitaires évolue à chaque commit : se référer au dernier rapport de CI plutôt qu'à un chiffre figé dans la documentation.

## Specs historiques (001-031)

Statut réel vérifié dans le code au commit `508dfa6` et traitement proposé ; clôtures arbitrées par le product owner le 2026-11-23 et vérifiées au commit `863b4bd` (V2-SDD-02, [spec 032 §26](032-counter-sdd-conventions-v2/spec.md)). Une spec `cloturee` avec reliquat indique sa spec cible (`transfere_a`).

| Spec | Statut | Statut réel constaté | Traitement proposé | ID V2 | Issue |
|---|---|---|---|---|---|
| [001](001-counter-scoring-access-modes/spec.md) | `a-revoir` | Contredite par le code : mode `social` inexistant, garde `isScreenAllowedForAccessMode` non branché. | Revoir intégralement (absorbe workspace 007). | V2-ARCH-12 | [#252](https://github.com/floriangiral/Bougnat_darts_counter/issues/252) |
| [002](002-counter-setup-clean-architecture/spec.md) | `cloturee` | Clôturée le 2026-11-23 au commit `863b4bd` : frontière local-first vérifiée. | Reliquat (découpe de `SetupView`) transféré à V2-ARCH-01 (056). | — | — |
| [003](003-counter-voice-scoring-reliability/spec.md) | `implementee` | Largement implémentée ; défauts de fiabilité (pipeline, parseur). | Enrichir (Révision V2). | V2-VOICE-01 | [#210](https://github.com/floriangiral/Bougnat_darts_counter/issues/210) |
| [004](004-counter-release-v1-0-1-stabilization/spec.md) | `cloturee` | Clôturée le 2026-11-23 : release v1.0.1 publiée (tag et GitHub Release). | — | — | — |
| [005](005-counter-ui-scoreboard-layout-consistency/spec.md) | `implementee` | Partielle. | Fusionner comme invariants dans V2-TAB-02/V2-TAB-03 et V2-QA-09. | — | — |
| [006](006-counter-voice-token-provisioning-hardening/spec.md) | `en-cours` | Partielle : runbook absent, Origin facultatif, limite non globale. | Finaliser dans la V2 (Révision V2). | V2-VOICE-10 | [#248](https://github.com/floriangiral/Bougnat_darts_counter/issues/248) |
| [007](007-counter-release-governance-v1-0-x/spec.md) | `en-cours` | Partielle. | Enrichir via V2-REL-01. | — | — |
| [008](008-counter-e2e-runtime-reliability/spec.md) | `en-cours` | Partielle : E2E locaux non autonomes. | Finaliser (Révision V2). | V2-QA-08 | [#230](https://github.com/floriangiral/Bougnat_darts_counter/issues/230) |
| [009](009-counter-env-contract-and-validation/spec.md) | `en-cours` | Partielle. | Finaliser (Révision V2). | V2-REL-03 | [#285](https://github.com/floriangiral/Bougnat_darts_counter/issues/285) |
| [010](010-counter-offline-session-recovery-guarantees/spec.md) | `implementee` | Non respectée hors X01 ; cite des fonctions inexistantes. | Enrichir — reprise multi-jeux P0 (Révision V2). | V2-ARCH-06 | [#223](https://github.com/floriangiral/Bougnat_darts_counter/issues/223) |
| [011](011-counter-home-install-shortcut/spec.md) | `implementee` | Implémentée ; manifeste et service worker livrés par 031 ; validation terrain Android/iOS restante. | Valider sur appareil avec 031. | — | — |
| [012](012-counter-custom-observability-retired/spec.md) | `retiree` | Retirée avant la v1.1 : remplacée par l'observabilité native de la plateforme, sans couche métier. | Conserver retirée (fiche de traçabilité). | — | — |
| [013](013-counter-stats-french-clean-architecture/spec.md) | `en-cours` | Partielle : libellés anglais résiduels. | Finaliser (Révision V2). | V2-GAMES-10 | [#241](https://github.com/floriangiral/Bougnat_darts_counter/issues/241) |
| [014](014-counter-x01-keypad-digit-scale/spec.md) | `cloturee` | Clôturée le 2026-11-23 au commit `863b4bd` : chiffres agrandis, touches textuelles inchangées. | Évolutions du pavé portées par 065 et 072. | — | — |
| [015](015-counter-x01-simple-two-player-limit/spec.md) | `implementee` | Implémentée, puis révisée le 2026-11-20 : limite portée à 4 joueurs en simple, robot à 2 (spec 052). | Révisée par V2-GAMES-16 (spec 052). | — | — |
| [016](016-counter-x01-simple-bot-opponent/spec.md) | `cloturee` | Clôturée le 2026-11-23 au commit `863b4bd` ; plage Pro alignée sur le code (86-120, « + de 85 »), décision PO. | — | — | — |
| [017](017-counter-killer-game/spec.md) | `implementee` | Implémentée (5 tests unitaires). | Conserver ; variantes dans V2-GAMES-13 (spec 053). | — | — |
| [018](018-counter-ios12-compatibility/spec.md) | `a-revoir` | Très probablement cassée : Tailwind 4 cible Safari 16.4+. | Revoir intégralement (décision de baseline navigateurs, Révision V2). | V2-DS-00 | [#220](https://github.com/floriangiral/Bougnat_darts_counter/issues/220) |
| [019](019-counter-gotcha-game/spec.md) | `implementee` | Implémentée (5 tests unitaires). | Conserver ; variantes dans V2-GAMES-13 (spec 053). | — | — |
| [020](020-counter-inp-phase1-quick-wins/spec.md) | `cloturee` | Clôturée le 2026-11-23 au commit `863b4bd` : corrections livrées ; mesure INP non faite. | Mesure INP P75 transférée à V2-PERF-01 (044). | — | — |
| [021](021-counter-score-layout-font-scale-resilience/spec.md) | `implementee` | Implémentée. | Conserver comme exigence de non-régression. | — | — |
| [022](022-counter-arch-single-responsibility-split/spec.md) | `cloturee` | Clôturée le 2026-11-23 au commit `863b4bd` : modules extraits présents, métriques périmées. | Reliquats transférés à V2-ARCH-11 (061, MatchView) et V2-ARCH-01 (056, SetupView). | — | — |
| [023](023-counter-x01-double-out-checkout-rate/spec.md) | `implementee` | Implémentée. | Conserver, enrichir la définition (Révision V2). | V2-GAMES-11 | [#291](https://github.com/floriangiral/Bougnat_darts_counter/issues/291) |
| [024](024-counter-spa-pageviews-retired/spec.md) | `retiree` | Retirée du périmètre v1.1 pour éviter des événements analytics métier dans le runtime open source. | Conserver retirée (fiche de traçabilité). | — | — |
| [025](025-counter-react-19-migration/spec.md) | `cloturee` | Clôturée le 2026-11-23 au commit `863b4bd` : React 19 en place ; validations manuelles ouvertes. | Validations transférées à V2-REL-01 (gate 2.1.0), V2-DS-00 (018) et V2-QA-09 (042). | — | — |
| [026](026-counter-release-v1-1-stabilization/spec.md) | `cloturee` | Clôturée le 2026-11-23 : release v1.1 publiée (tag et GitHub Release). | — | — | — |
| [027](027-counter-tablet-display/spec.md) | `retiree` | Retirée le 2026-11-20 : remplacée par 070, 071 et 072 (livrées sur `feat/v2.0.0`, validation terrain et E2E en CI à faire) ; portrait = présentation de référence sur tablette (décision PO). | Révision V2 appliquée : `remplacee_par` 070-072, fiche conservée. | V2-TAB-04 | [#232](https://github.com/floriangiral/Bougnat_darts_counter/issues/232) |
| [028](028-counter-smartphone-display/spec.md) | `implementee` | Option B livrée le 2026-11-20 : paysage opérable, invite non bloquante sur les écrans de jeu, blocage et verrou portrait retirés ; validation terrain et E2E en CI à faire. | Révision V2 appliquée ; classification fusionnée dans 070. | V2-TAB-06 | [#229](https://github.com/floriangiral/Bougnat_darts_counter/issues/229) |
| [029](029-counter-sonar-coverage-governance/spec.md) | `implementee` | Appliquée ; exclusions de vues contenant de la logique. | Enrichir (Révision V2). | V2-QA-11 | [#239](https://github.com/floriangiral/Bougnat_darts_counter/issues/239) |
| [030](030-counter-external-match-link/spec.md) | `implementee` | Publiée avec le tag `v2.1.0` déplacé le 2026-11-24 (Révision V2 et R8 : envoi automatique du résultat dans un nouvel onglet, actions de secours). | Recette terrain et E2E en CI restent à réaliser. | V2-INT-01 | [#205](https://github.com/floriangiral/Bougnat_darts_counter/issues/205) |
| [031](031-counter-pwa-static-delivery/spec.md) | `implementee` | Implémentée (Révision V2) ; validation préprod et terrain restante. | Valider en préprod puis publier avec 2.1.0. | V2-REL-02 | [#216](https://github.com/floriangiral/Bougnat_darts_counter/issues/216) |

Slugs historiques sans dossier, rattachés lors de la revue : `spec:counter/release-v1.1.3-sonar-debt` (historique v1.1.3, voir [notes](../docs/release/v1.1.3.md)), `spec:counter/smoke-e2e-per-game-navigation` (→ 008), `spec:counter/capital-game` (→ 050), `security-review` (→ gouvernance sécurité, [SECURITY.md](../SECURITY.md)).

## Propositions V2 (statut `a-valider` sauf mention contraire)

Poids = valeur (1-5) × priorité (P0=4 … P3=1) × 5 ÷ difficulté (S=1 … XL=4), borné à 100 : plus il est élevé, meilleur est le rapport valeur/effort.

### Gouvernance & release

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-REL-01 | [033](033-counter-release-v2-0-0-publication/spec.md) | Clôture et publication de la release 2.0.0 | `a-valider` | Gouvernance | P0 | M | 40 | Recommandé | 0 | [#211](https://github.com/floriangiral/Bougnat_darts_counter/issues/211) |
| V2-SDD-01 | [032](032-counter-sdd-conventions-v2/spec.md) | Conventions SDD v2 (statuts, en-tête YAML, gabarits, index) | `implementee` | Gouvernance | P0 | M | 30 | Recommandé | 0 | [#214](https://github.com/floriangiral/Bougnat_darts_counter/issues/214) |
| V2-SDD-02 | [032](032-counter-sdd-conventions-v2/spec.md) | Clôtures vérifiées des specs historiques et traitement du backlog workspace | `implementee` | Gouvernance | P1 | S | 30 | Recommandé | 0 | [#215](https://github.com/floriangiral/Bougnat_darts_counter/issues/215) |
| V2-REL-02 | [031](031-counter-pwa-static-delivery/spec.md) | PWA — livraison statique du manifeste et du service worker | `implementee` | Fonctionnalité | P1 | M | 30 | Recommandé | 0 | [#216](https://github.com/floriangiral/Bougnat_darts_counter/issues/216) |
| V2-REL-03 | [009](009-counter-env-contract-and-validation/spec.md) | Contrat d’environnement — finalisation | `en-cours` | Fonctionnalité | P2 | S | 10 | Recommandé | 5 | [#285](https://github.com/floriangiral/Bougnat_darts_counter/issues/285) |

### Documentation

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-DOC-01 | [034](034-counter-doc-immediate-corrections/spec.md) | Corrections documentaires immédiates | `a-valider` | Documentation | P0 | S | 60 | Recommandé | 0 | [#207](https://github.com/floriangiral/Bougnat_darts_counter/issues/207) |
| V2-DOC-03 | [036](036-counter-doc-ai-agents-onboarding/spec.md) | Onboarding des agents IA (AGENTS.md) | `implementee` | Documentation | P1 | S | 30 | Recommandé | 0 | [#217](https://github.com/floriangiral/Bougnat_darts_counter/issues/217) |
| V2-DOC-02 | [035](035-counter-doc-organisation-and-adr/spec.md) | Organisation documentaire, statuts de page et ADR | `a-valider` | Documentation | P1 | M | 15 | Recommandé | 2 | [#249](https://github.com/floriangiral/Bougnat_darts_counter/issues/249) |
| V2-DOC-05 | [037](037-counter-doc-user-guides-v2/spec.md) | Guides utilisateur V2 (voix, TV, thèmes, station) | `a-valider` | Documentation | P2 | M | 15 | Recommandé | 4 | [#275](https://github.com/floriangiral/Bougnat_darts_counter/issues/275) |
| V2-DOC-06 | [038](038-counter-in-app-changelog-source/spec.md) | Changelog in-app généré depuis les notes de release | `a-valider` | Documentation | P3 | S | 5 | Optionnel | 5 | [#290](https://github.com/floriangiral/Bougnat_darts_counter/issues/290) |

### Qualité & tests

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-QA-10 | [043](043-counter-qa-ci-hardening/spec.md) | Durcissement de la CI | `a-valider` | Fonctionnalité | P0 | S | 40 | Recommandé | 0 | [#212](https://github.com/floriangiral/Bougnat_darts_counter/issues/212) |
| V2-QA-01 | [039](039-counter-qa-golden-rules-characterization/spec.md) | Golden tests de règles et tests de caractérisation par jeu | `a-valider` | Fonctionnalité | P0 | M | 40 | Recommandé | 1 | [#218](https://github.com/floriangiral/Bougnat_darts_counter/issues/218) |
| V2-QA-09 | [042](042-counter-qa-real-device-matrix/spec.md) | Matrice d’appareils et de viewports réalistes | `a-valider` | Fonctionnalité | P0 | M | 30 | Recommandé | 1 | [#224](https://github.com/floriangiral/Bougnat_darts_counter/issues/224) |
| V2-QA-08 | [008](008-counter-e2e-runtime-reliability/spec.md) | E2E autonomes et fiables — finalisation | `en-cours` | Fonctionnalité | P1 | S | 30 | Recommandé | 1 | [#230](https://github.com/floriangiral/Bougnat_darts_counter/issues/230) |
| V2-QA-05 | [041](041-counter-qa-accessibility-visual-regression/spec.md) | Accessibilité automatisée et régression visuelle | `a-valider` | Fonctionnalité | P1 | M | 23 | Recommandé | 1 | [#233](https://github.com/floriangiral/Bougnat_darts_counter/issues/233) |
| V2-QA-11 | [029](029-counter-sonar-coverage-governance/spec.md) | Gouvernance de couverture — réduction des exclusions de vues | `implementee` | Fonctionnalité | P1 | S | 30 | Recommandé | 2 | [#239](https://github.com/floriangiral/Bougnat_darts_counter/issues/239) |
| V2-QA-04 | [040](040-counter-qa-e2e-full-game-journeys/spec.md) | Parcours E2E complets par jeu (partie, undo, reload) | `a-valider` | Fonctionnalité | P1 | M | 23 | Recommandé | 2 | [#245](https://github.com/floriangiral/Bougnat_darts_counter/issues/245) |
| V2-PERF-01 | [044](044-counter-perf-budgets/spec.md) | Budgets de performance mesurés (INP, bundle) | `a-valider` | Fonctionnalité | P2 | S | 20 | Recommandé | 5 | [#278](https://github.com/floriangiral/Bougnat_darts_counter/issues/278) |

### Jeux & règles

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-GAMES-01 | [045](045-counter-x01-checkout-rules-compliance/spec.md) | X01 — conformité des sorties (finishes impossibles, Master-Out, aide checkout) | `implementee` | Bug | P0 | S | 100 | Recommandé | 0 | [#204](https://github.com/floriangiral/Bougnat_darts_counter/issues/204) |
| V2-GAMES-04 | [047](047-counter-cricket-end-of-game/spec.md) | Cricket — écran de victoire, annulation et départage | `implementee` | Bug | P0 | S | 80 | Recommandé | 0 | [#206](https://github.com/floriangiral/Bougnat_darts_counter/issues/206) |
| V2-GAMES-02 | [046](046-counter-x01-double-master-in/spec.md) | X01 — ouverture Double/Master-In (implémenter ou retirer) | `implementee` | Bug | P0 | M | 40 | Recommandé | 0 | [#213](https://github.com/floriangiral/Bougnat_darts_counter/issues/213) |
| V2-GAMES-26 | [050](050-counter-games-rules-reference/spec.md) | Rétro-spécifications des règles (X01, Cricket, Capital, Triathlon) | `a-valider` | Documentation | P1 | M | 23 | Recommandé | 1 | [#234](https://github.com/floriangiral/Bougnat_darts_counter/issues/234) |
| V2-GAMES-30 | [054](054-counter-impossible-totals-validation/spec.md) | Refus des totaux impossibles (Gotcha, Capital) | `implementee` | Bug | P1 | S | 45 | Recommandé | 2 | [#236](https://github.com/floriangiral/Bougnat_darts_counter/issues/236) |
| V2-GAMES-06 | [049](049-counter-common-game-frame/spec.md) | Cadre de jeu commun (barre de partie, fin, revanche, undo, sortie) | `a-valider` | Fonctionnalité | P1 | M | 30 | Recommandé | 2 | [#240](https://github.com/floriangiral/Bougnat_darts_counter/issues/240) |
| V2-GAMES-10 | [013](013-counter-stats-french-clean-architecture/spec.md) | Libellés français — finalisation (stats et écrans de jeu) | `en-cours` | Fonctionnalité | P1 | S | 30 | Recommandé | 2 | [#241](https://github.com/floriangiral/Bougnat_darts_counter/issues/241) |
| V2-GAMES-05 | [048](048-counter-triathlon-scoring-v2/spec.md) | Triathlon — barème v2 versionné | `implementee` | Bug | P1 | M | 23 | Recommandé | 2 | [#246](https://github.com/floriangiral/Bougnat_darts_counter/issues/246) |
| V2-GAMES-12 | [051](051-counter-cricket-variants/spec.md) | Cricket — variantes Cut-throat et multi-manches | `a-valider` | Fonctionnalité | P2 | M | 15 | Optionnel | 5 | [#279](https://github.com/floriangiral/Bougnat_darts_counter/issues/279) |
| V2-GAMES-16 | [052](052-counter-x01-three-four-players/spec.md) | X01 — 3 à 4 joueurs en simple | `implementee` | Fonctionnalité | P2 | M | 15 | Optionnel | 5 | [#280](https://github.com/floriangiral/Bougnat_darts_counter/issues/280) |
| V2-GAMES-31 | [130](130-counter-180-around-the-clock/spec.md) | Nouveau jeu « 180 Around the Clock » (1 à 4 joueurs, sans variante) | `implementee` | Fonctionnalité | P1 | M | 23 | Recommandé | 2 | à créer |
| V2-GAMES-32 | [131](131-counter-x01-bust-voice-default/spec.md) | Bouton trop X01 et voix désactivée par défaut | `en-cours` | Fonctionnalité | P1 | M | 30 | Recommandé | 2 | à créer |
| V2-GAMES-33 | [132](132-counter-x01-order-and-placements/spec.md) | X01 à 3 ou 4 joueurs — ordre de passage et places jouées | `implementee` | Fonctionnalité | P1 | M | 30 | Recommandé | 2 | [#342](https://github.com/floriangiral/Bougnat_darts_counter/issues/342) |
| V2-GAMES-13 | [053](053-counter-killer-gotcha-variants/spec.md) | Killer et Gotcha — variantes et règles de référence | `a-valider` | Fonctionnalité | P3 | S | 10 | Optionnel | 5 | [#286](https://github.com/floriangiral/Bougnat_darts_counter/issues/286) |
| V2-GAMES-11 | [023](023-counter-x01-double-out-checkout-rate/spec.md) | Taux de checkout — définition enrichie | `implementee` | Fonctionnalité | P3 | S | 5 | Optionnel | 5 | [#291](https://github.com/floriangiral/Bougnat_darts_counter/issues/291) |

### Architecture

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-ARCH-03 | [057](057-counter-x01-single-rules-shared-commands/spec.md) | Règles X01 uniques et commandes partagées (keypad, voix, robot, partenaire) | `a-valider` | Fonctionnalité | P0 | M | 40 | Recommandé | 1 | [#219](https://github.com/floriangiral/Bougnat_darts_counter/issues/219) |
| V2-ARCH-06 | [010](010-counter-offline-session-recovery-guarantees/spec.md) | Reprise fiable de tous les jeux après rechargement | `implementee` | Bug | P0 | L | 33 | Recommandé | 1 | [#223](https://github.com/floriangiral/Bougnat_darts_counter/issues/223) |
| V2-ARCH-04 | [058](058-counter-serializable-game-state/spec.md) | État de partie sérialisable et reducer pur par jeu | `a-valider` | Fonctionnalité | P0 | L | 27 | Recommandé | 1 | [#226](https://github.com/floriangiral/Bougnat_darts_counter/issues/226) |
| V2-ARCH-01 | [056](056-counter-arch-layer-boundaries/spec.md) | Frontières de couches et sort du domaine X01 inutilisé | `a-valider` | Fonctionnalité | P1 | M | 15 | Recommandé | 1 | [#235](https://github.com/floriangiral/Bougnat_darts_counter/issues/235) |
| V2-ARCH-12 | [001](001-counter-scoring-access-modes/spec.md) | Modes d’accès scoring — révision intégrale | `a-revoir` | Fonctionnalité | P2 | M | 10 | Recommandé | 2 | [#252](https://github.com/floriangiral/Bougnat_darts_counter/issues/252) |
| V2-ARCH-11 | [061](061-counter-matchview-decomposition/spec.md) | Découpage de MatchView (reliquat 022) | `a-valider` | Fonctionnalité | P2 | M | 5 | Recommandé | 2 | [#253](https://github.com/floriangiral/Bougnat_darts_counter/issues/253) |
| V2-QR-01 | [092](092-counter-client-qr-generator/spec.md) | Générateur de QR côté client partagé | `a-valider` | Fonctionnalité | P1 | S | 30 | Recommandé | 3 | [#256](https://github.com/floriangiral/Bougnat_darts_counter/issues/256) |
| V2-ARCH-05 | [059](059-counter-append-only-game-journal/spec.md) | Journal de partie append-only (undo persistant, correction) | `a-valider` | Fonctionnalité | P2 | M | 15 | Optionnel | 5 | [#281](https://github.com/floriangiral/Bougnat_darts_counter/issues/281) |
| V2-ARCH-15 | [062](062-counter-score-input-agnostic-study/spec.md) | Étude — point d’entrée de score agnostique (caméras type Scolia) | `a-valider` | Étude | P3 | M | 5 | Étude préalable | 5 | [#292](https://github.com/floriangiral/Bougnat_darts_counter/issues/292) |
| V2-ARCH-09 | [060](060-counter-game-registry/spec.md) | Registre de jeux | `a-valider` | Fonctionnalité | P3 | M | 3 | Optionnel | 5 | [#298](https://github.com/floriangiral/Bougnat_darts_counter/issues/298) |

### Design system & thèmes

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-DS-00 | [018](018-counter-ios12-compatibility/spec.md) | Baseline navigateurs (iOS 12, navigateurs TV) — décision | `a-revoir` | Étude | P0 | M | 40 | Étude préalable | 1 | [#220](https://github.com/floriangiral/Bougnat_darts_counter/issues/220) |
| V2-DS-01 | [063](063-counter-design-tokens/spec.md) | Design tokens (socle unique Dark/Light/club/TV) | `implementee` | Fonctionnalité | P0 | L | 20 | Recommandé | 1 | [#227](https://github.com/floriangiral/Bougnat_darts_counter/issues/227) |
| V2-DS-04 | [066](066-counter-reserved-game-colors/spec.md) | Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif) | `implementee` | Fonctionnalité | P1 | S | 45 | Recommandé | 1 | [#228](https://github.com/floriangiral/Bougnat_darts_counter/issues/228) |
| V2-DS-02 | [064](064-counter-accessible-base-components/spec.md) | Composants de base accessibles (focus visible, états, cibles 48 px) | `implementee` | Fonctionnalité | P1 | M | 30 | Recommandé | 1 | [#231](https://github.com/floriangiral/Bougnat_darts_counter/issues/231) |
| V2-THEME-02 | [069](069-counter-theme-preference/spec.md) | Préférence de thème (système, sombre, clair) | `implementee` | Fonctionnalité | P1 | S | 45 | Recommandé | 2 | [#237](https://github.com/floriangiral/Bougnat_darts_counter/issues/237) |
| V2-THEME-01 | [068](068-counter-light-mode/spec.md) | Mode Light | `implementee` | Fonctionnalité | P1 | M | 30 | Recommandé | 2 | [#242](https://github.com/floriangiral/Bougnat_darts_counter/issues/242) |
| V2-DS-03 | [065](065-counter-screen-migration-to-tokens/spec.md) | Migration écran par écran vers les tokens | `implementee` | Fonctionnalité | P1 | L | 10 | Recommandé | 2 | [#250](https://github.com/floriangiral/Bougnat_darts_counter/issues/250) |
| V2-DS-05 | [067](067-counter-motion-reduced-motion/spec.md) | Animations et prefers-reduced-motion | `a-valider` | Fonctionnalité | P2 | S | 20 | Recommandé | 2 | [#251](https://github.com/floriangiral/Bougnat_darts_counter/issues/251) |

### Tablette & responsive

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-TAB-02 | [071](071-counter-tablet-landscape-fixes/spec.md) | Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé) | `implementee` | Bug | P0 | M | 50 | Recommandé | 0 | [#209](https://github.com/floriangiral/Bougnat_darts_counter/issues/209) |
| V2-TAB-01 | [070](070-counter-size-class-resolver/spec.md) | Résolveur unique classes de taille et orientation | `implementee` | Fonctionnalité | P0 | M | 40 | Recommandé | 1 | [#221](https://github.com/floriangiral/Bougnat_darts_counter/issues/221) |
| V2-TAB-06 | [028](028-counter-smartphone-display/spec.md) | Affichage téléphone (028) — arbitrage portrait imposé | `implementee` | Fonctionnalité | P1 | S | 45 | Recommandé | 1 | [#229](https://github.com/floriangiral/Bougnat_darts_counter/issues/229) |
| V2-TAB-04 | [027](027-counter-tablet-display/spec.md) | Affichage tablette (027) — révision et succession | `retiree` | Fonctionnalité | P1 | S | 30 | Recommandé | 1 | [#232](https://github.com/floriangiral/Bougnat_darts_counter/issues/232) |
| V2-TAB-03 | [072](072-counter-arena-layout/spec.md) | Disposition « arène » tablette paysage | `implementee` | Fonctionnalité | P1 | L | 25 | Recommandé | 2 | [#244](https://github.com/floriangiral/Bougnat_darts_counter/issues/244) |
| V2-TAB-05 | [073](073-counter-tablet-orientation/spec.md) | Orientation tablette (verrou Android plein écran, invite non bloquante) | `rejetee` | Fonctionnalité | P1 | M | 23 | Recommandé | 2 | [#247](https://github.com/floriangiral/Bougnat_darts_counter/issues/247) |

### Scoring vocal

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-VOICE-09 | [080](080-counter-voice-privacy/spec.md) | Voix — confidentialité (UE, mip_opt_out, information) | `a-valider` | Fonctionnalité | P0 | S | 60 | Recommandé | 0 | [#208](https://github.com/floriangiral/Bougnat_darts_counter/issues/208) |
| V2-VOICE-01 | [003](003-counter-voice-scoring-reliability/spec.md) | Voix — fiabilité du pipeline et parseur français | `implementee` | Bug | P0 | M | 50 | Recommandé | 0 | [#210](https://github.com/floriangiral/Bougnat_darts_counter/issues/210) |
| V2-VOICE-03 | [074](074-counter-voice-corpus-benchmark/spec.md) | Voix — corpus de référence et banc de mesure | `a-valider` | Fonctionnalité | P0 | M | 30 | Recommandé | 1 | [#225](https://github.com/floriangiral/Bougnat_darts_counter/issues/225) |
| V2-VOICE-10 | [006](006-counter-voice-token-provisioning-hardening/spec.md) | Voix — durcissement du token et protection budgétaire | `en-cours` | Fonctionnalité | P1 | M | 23 | Recommandé | 2 | [#248](https://github.com/floriangiral/Bougnat_darts_counter/issues/248) |
| V2-VOICE-06 | [077](077-counter-voice-caller/spec.md) | Caller « Bougnat » — annonces vocales en français | `a-valider` | Fonctionnalité | P1 | M | 38 | Recommandé | 3 | [#254](https://github.com/floriangiral/Bougnat_darts_counter/issues/254) |
| V2-VOICE-05 | [076](076-counter-voice-hands-free-mode/spec.md) | Voix — mode partie mains libres | `a-valider` | Fonctionnalité | P1 | L | 25 | Recommandé | 3 | [#258](https://github.com/floriangiral/Bougnat_darts_counter/issues/258) |
| V2-VOICE-04 | [075](075-counter-voice-recognizer-port-commands/spec.md) | Voix — port de reconnaissance et commandes vocales | `a-valider` | Fonctionnalité | P1 | M | 23 | Recommandé | 3 | [#259](https://github.com/floriangiral/Bougnat_darts_counter/issues/259) |
| V2-VOICE-11 | [081](081-counter-voice-state-on-tv/spec.md) | Voix — état vocal affiché sur la TV | `a-valider` | Fonctionnalité | P2 | S | 30 | Optionnel | 3 | [#261](https://github.com/floriangiral/Bougnat_darts_counter/issues/261) |
| V2-VOICE-07 | [078](078-counter-voice-on-device-study/spec.md) | Étude — moteurs vocaux sur l’appareil | `a-valider` | Étude | P2 | M | 15 | Étude préalable | 5 | [#282](https://github.com/floriangiral/Bougnat_darts_counter/issues/282) |
| V2-VOICE-08 | [079](079-counter-voice-multi-game/spec.md) | Voix — extension aux autres jeux (Cricket d’abord) | `a-valider` | Fonctionnalité | P2 | L | 13 | Optionnel | 5 | [#284](https://github.com/floriangiral/Bougnat_darts_counter/issues/284) |
| V2-VOICE-14 | [082](082-counter-audio-accessibility-mode/spec.md) | Mode accessibilité audio | `a-valider` | Fonctionnalité | P3 | M | 8 | Optionnel | 5 | [#288](https://github.com/floriangiral/Bougnat_darts_counter/issues/288) |

### Mode TV

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-TV-01 | [083](083-counter-tv-broadcast-study/spec.md) | Étude et ADR — diffusion TV et frontière serveur | `a-valider` | Étude | P0 | M | 40 | Étude préalable | 1 | [#222](https://github.com/floriangiral/Bougnat_darts_counter/issues/222) |
| V2-TV-06 | [086](086-counter-tv-x01-screen/spec.md) | Interface TV X01 | `a-valider` | Fonctionnalité | P1 | M | 38 | Recommandé | 3 | [#255](https://github.com/floriangiral/Bougnat_darts_counter/issues/255) |
| V2-TV-04 | [085](085-counter-tv-local-window/spec.md) | TV locale (fenêtre secondaire, HDMI, hors ligne) | `a-valider` | Fonctionnalité | P1 | M | 30 | Recommandé | 3 | [#257](https://github.com/floriangiral/Bougnat_darts_counter/issues/257) |
| V2-TV-02 | [084](084-counter-spectator-projection/spec.md) | Projection spectateur versionnée | `a-valider` | Fonctionnalité | P1 | M | 23 | Recommandé | 3 | [#260](https://github.com/floriangiral/Bougnat_darts_counter/issues/260) |
| V2-TV-07 | [088](088-counter-tv-pairing/spec.md) | Appairage TV par code court ou QR | `a-valider` | Fonctionnalité | P2 | M | 20 | Recommandé | 3 | [#262](https://github.com/floriangiral/Bougnat_darts_counter/issues/262) |
| V2-TV-05 | [087](087-counter-tv-remote-relay/spec.md) | Relais TV distant (Worker + Durable Object) | `a-valider` | Fonctionnalité | P2 | L | 17 | Recommandé | 3 | [#263](https://github.com/floriangiral/Bougnat_darts_counter/issues/263) |
| V2-TV-11 | [090](090-counter-tv-field-qualification/spec.md) | Qualification sur TV réelles | `a-valider` | Fonctionnalité | P2 | M | 10 | Recommandé | 3 | [#264](https://github.com/floriangiral/Bougnat_darts_counter/issues/264) |
| V2-TV-08 | [089](089-counter-tv-other-games/spec.md) | Interfaces TV des autres jeux | `a-valider` | Fonctionnalité | P2 | L | 13 | Recommandé | 4 | [#277](https://github.com/floriangiral/Bougnat_darts_counter/issues/277) |
| V2-TV-10 | [091](091-counter-tv-multi-screen-cast-study/spec.md) | Étude — multi-écrans, Google Cast, Presentation API | `a-valider` | Étude | P3 | M | 5 | Étude préalable | 5 | [#293](https://github.com/floriangiral/Bougnat_darts_counter/issues/293) |

### Personnalisation

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-SET-01 | [129](129-counter-settings-screen/spec.md) | Page Réglages (apparence et options de partie, préférences de l’appareil) | `implementee` | Fonctionnalité | P1 | M | 30 | Recommandé | 2 | à créer |
| V2-BRAND-06 | [098](098-counter-theme-to-tv/spec.md) | Thème transmis à l’écran TV | `a-valider` | Fonctionnalité | P2 | S | 30 | Recommandé | 4 | [#265](https://github.com/floriangiral/Bougnat_darts_counter/issues/265) |
| V2-BRAND-01 | [093](093-counter-club-theme-model/spec.md) | Modèle de thème club (graines, dérivation, garde-fous) | `a-valider` | Fonctionnalité | P2 | M | 20 | Recommandé | 4 | [#267](https://github.com/floriangiral/Bougnat_darts_counter/issues/267) |
| V2-BRAND-02 | [094](094-counter-theme-visual-editor/spec.md) | Éditeur visuel de thème | `a-valider` | Fonctionnalité | P2 | M | 20 | Recommandé | 4 | [#268](https://github.com/floriangiral/Bougnat_darts_counter/issues/268) |
| V2-BRAND-03 | [095](095-counter-logo-import/spec.md) | Import du logo du club | `a-valider` | Fonctionnalité | P2 | M | 20 | Recommandé | 4 | [#269](https://github.com/floriangiral/Bougnat_darts_counter/issues/269) |
| V2-BRAND-04 | [096](096-counter-theme-sharing-no-account/spec.md) | Partage de thème sans compte (fichier, lien, QR) | `a-valider` | Fonctionnalité | P2 | M | 20 | Recommandé | 4 | [#270](https://github.com/floriangiral/Bougnat_darts_counter/issues/270) |
| V2-BRAND-05 | [097](097-counter-mandatory-bougnat-mention/spec.md) | Mention Bougnat Darts obligatoire (co-branding) | `a-valider` | Fonctionnalité | P2 | S | 20 | Recommandé | 4 | [#271](https://github.com/floriangiral/Bougnat_darts_counter/issues/271) |
| V2-STATION-01 | [100](100-counter-station-one-scan/spec.md) | « Station en un scan » — configuration de lieu par QR | `a-valider` | Fonctionnalité | P2 | M | 20 | Recommandé | 4 | [#272](https://github.com/floriangiral/Bougnat_darts_counter/issues/272) |
| V2-BRAND-07 | [099](099-counter-theme-server-storage-study/spec.md) | Étude — stockage serveur des thèmes (code court) | `a-valider` | Étude | P3 | M | 5 | Déconseillé | 5 | [#294](https://github.com/floriangiral/Bougnat_darts_counter/issues/294) |

### Innovation produit

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-HIST-01 | [101](101-counter-my-games-history/spec.md) | « Mes parties » — historique local | `a-valider` | Fonctionnalité | P1 | M | 30 | Recommandé | 2 | [#243](https://github.com/floriangiral/Bougnat_darts_counter/issues/243) |
| V2-SHARE-01 | [102](102-counter-take-away-recap/spec.md) | Partage texte du résultat X01 | `implementee` | Fonctionnalité | P2 | M | 20 | Recommandé | 4 | [#273](https://github.com/floriangiral/Bougnat_darts_counter/issues/273) |
| V2-GAMES-23 | [055](055-counter-discovery-mode/spec.md) | Mode Découverte — première partie guidée | `a-valider` | Fonctionnalité | P2 | M | 15 | Optionnel | 4 | [#276](https://github.com/floriangiral/Bougnat_darts_counter/issues/276) |
| V2-TRAIN-01 | [103](103-counter-training-checkout-study/spec.md) | Étude — atelier finitions (entraînement) | `a-valider` | Étude | P3 | M | 8 | Étude préalable | 5 | [#289](https://github.com/floriangiral/Bougnat_darts_counter/issues/289) |
| V2-GAMES-24 | [104](104-counter-bar-challenge/spec.md) | Défi du comptoir | `a-valider` | Fonctionnalité | P3 | M | 5 | Optionnel | 5 | [#295](https://github.com/floriangiral/Bougnat_darts_counter/issues/295) |
| V2-GAMES-25 | [105](105-counter-flash-night-study/spec.md) | Étude — « Soirée éclair » (mini-tournoi local) | `a-valider` | Étude | P3 | L | 5 | Étude préalable | 5 | [#296](https://github.com/floriangiral/Bougnat_darts_counter/issues/296) |

### Intégrations

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-INT-01 | [030](030-counter-external-match-link/spec.md) | Lien de match externe v1 — finalisation pour publication | `implementee` | Fonctionnalité | P0 | S | 80 | Recommandé | 0 | [#205](https://github.com/floriangiral/Bougnat_darts_counter/issues/205) |
| V2-INT-02 | [106](106-counter-partner-feedback-badarts/spec.md) | Retour d’expérience badarts.fr / DartsHub | `a-valider` | Étude | P1 | S | 45 | Étude préalable | 2 | [#238](https://github.com/floriangiral/Bougnat_darts_counter/issues/238) |
| V2-INT-04 | [107](107-counter-result-return-qr/spec.md) | Retour du résultat par QR (inter-appareils) | `a-valider` | Fonctionnalité | P2 | S | 30 | Optionnel | 4 | [#266](https://github.com/floriangiral/Bougnat_darts_counter/issues/266) |
| V2-INT-08 | [110](110-counter-partner-admission-policy/spec.md) | Politique d’admission des partenaires | `a-valider` | Gouvernance | P2 | S | 20 | Recommandé | 4 | [#274](https://github.com/floriangiral/Bougnat_darts_counter/issues/274) |
| V2-INT-07 | [109](109-counter-bdt-contract-framing/spec.md) | Cadrage du contrat compteur ↔ Bougnat_Darts_Tournaments | `a-valider` | Étude | P2 | M | 15 | Étude préalable | 5 | [#283](https://github.com/floriangiral/Bougnat_darts_counter/issues/283) |
| V2-INT-09 | [112](112-counter-partner-outreach-program/spec.md) | Programme de prises de contact partenaires | `a-valider` | Étude | P3 | S | 10 | Étude préalable | 5 | [#287](https://github.com/floriangiral/Bougnat_darts_counter/issues/287) |
| V2-INT-05 | [108](108-counter-link-contract-v2-study/spec.md) | Étude — contrat de lien v=2 | `a-valider` | Étude | P3 | M | 5 | Étude préalable | 5 | [#297](https://github.com/floriangiral/Bougnat_darts_counter/issues/297) |
| V2-INT-03 | [111](111-counter-linked-match-module/spec.md) | Module neutre « match lié » (au 2e canal) | `a-valider` | Fonctionnalité | P3 | M | 3 | Optionnel | 5 | [#299](https://github.com/floriangiral/Bougnat_darts_counter/issues/299) |

### DevSecOps & CI/CD

| ID V2 | Spec | Titre | Statut | Nature | Prio | Diff. | Poids | Reco | Lot | Issue |
|---|---|---|---|---|---|---|---|---|---|---|
| V2-SEC-01 | [115](115-counter-sec-github-governance/spec.md) | Gouvernance du dépôt GitHub (paramètres, ruleset main, permissions Actions, environnements) | `en-cours` | Gouvernance | P0 | S | 80 | Recommandé | 0 | [#300](https://github.com/floriangiral/Bougnat_darts_counter/issues/300) |
| V2-SEC-03 | [118](118-counter-sec-secrets-detection/spec.md) | Secrets — Gitleaks, secret scanning, protection des pushes et procédure de rotation | `en-cours` | Fonctionnalité | P0 | S | 60 | Recommandé | 0 | [#301](https://github.com/floriangiral/Bougnat_darts_counter/issues/301) |
| V2-CICD-02 | [114](114-counter-cicd-quality-gate-automerge/spec.md) | Quality gate agrégé et politique d'auto-merge vérifiable | `validee` | Fonctionnalité | P0 | M | 40 | Recommandé | 1 | [#302](https://github.com/floriangiral/Bougnat_darts_counter/issues/302) |
| V2-CICD-01 | [113](113-counter-cicd-workflow-architecture/spec.md) | Architecture des workflows GitHub Actions et fréquences des contrôles | `en-cours` | Fonctionnalité | P0 | M | 30 | Recommandé | 1 | [#303](https://github.com/floriangiral/Bougnat_darts_counter/issues/303) |
| V2-QA-16 | [124](124-counter-qa-typescript-eslint-strictness/spec.md) | TypeScript strict et règles ESLint — verrouillage et trajectoire progressive | `a-valider` | Fonctionnalité | P1 | S | 45 | Recommandé | 1 | [#304](https://github.com/floriangiral/Bougnat_darts_counter/issues/304) |
| V2-DEP-01 | [116](116-counter-dep-renovate-dependabot/spec.md) | Renovate, unique générateur des mises à jour, et Dependabot limité à la veille de sécurité | `en-cours` | Fonctionnalité | P1 | M | 30 | Recommandé | 1 | [#305](https://github.com/floriangiral/Bougnat_darts_counter/issues/305) |
| V2-SEC-02 | [117](117-counter-sec-vulnerability-scanning/spec.md) | Analyse de sécurité du code et des dépendances (CodeQL, OSV-Scanner, Dependency Review) et politique de sévérité | `en-cours` | Fonctionnalité | P1 | M | 23 | Recommandé | 1 | [#306](https://github.com/floriangiral/Bougnat_darts_counter/issues/306) |
| V2-CICD-05 | [128](128-counter-cicd-doc-and-manual-ops/spec.md) | Documentation DevSecOps, opérations manuelles du product owner, séquencement et recette globale | `a-valider` | Documentation | P1 | M | 23 | Recommandé | 1 | [#307](https://github.com/floriangiral/Bougnat_darts_counter/issues/307) |
| V2-CICD-03 | [126](126-counter-cicd-ai-agents/spec.md) | Cadre d'intervention des agents IA dans la chaîne CI/CD | `a-valider` | Gouvernance | P1 | M | 15 | Recommandé | 1 | [#308](https://github.com/floriangiral/Bougnat_darts_counter/issues/308) |
| V2-SEC-04 | [119](119-counter-sec-openssf-scorecard/spec.md) | OpenSSF Scorecard — évaluation hebdomadaire de la sécurité du dépôt | `en-cours` | Fonctionnalité | P2 | S | 20 | Recommandé | 1 | [#309](https://github.com/floriangiral/Bougnat_darts_counter/issues/309) |
| V2-QA-12 | [120](120-counter-qa-codecov/spec.md) | Codecov — suivi de la couverture et couverture du code modifié dans les PR | `a-valider` | Fonctionnalité | P2 | S | 20 | Optionnel | 2 | [#310](https://github.com/floriangiral/Bougnat_darts_counter/issues/310) |
| V2-QA-13 | [121](121-counter-qa-knip/spec.md) | Knip — détection hebdomadaire du code, des exports et des dépendances inutilisés | `a-valider` | Fonctionnalité | P2 | S | 20 | Recommandé | 2 | [#311](https://github.com/floriangiral/Bougnat_darts_counter/issues/311) |
| V2-QA-15 | [123](123-counter-qa-lighthouse-ci/spec.md) | Lighthouse CI — performance, accessibilité et bonnes pratiques sur un build de production | `a-valider` | Fonctionnalité | P2 | M | 10 | Recommandé | 2 | [#312](https://github.com/floriangiral/Bougnat_darts_counter/issues/312) |
| V2-OBS-01 | [125](125-counter-obs-sentry-study/spec.md) | Étude — observabilité des erreurs en production (Sentry) compatible RGPD, CSP et gratuité | `a-valider` | Étude | P2 | M | 10 | Étude préalable | 2 | [#313](https://github.com/floriangiral/Bougnat_darts_counter/issues/313) |
| V2-CICD-04 | [127](127-counter-cicd-reporting/spec.md) | Rapport hebdomadaire DevSecOps et pilotage par indicateurs | `a-valider` | Fonctionnalité | P2 | M | 10 | Recommandé | 2 | [#314](https://github.com/floriangiral/Bougnat_darts_counter/issues/314) |
| V2-QA-14 | [122](122-counter-qa-mutation-testing-study/spec.md) | Étude-pilote — tests de mutation StrykerJS sur les moteurs de jeu | `a-valider` | Étude | P3 | M | 5 | Étude préalable | 2 | [#315](https://github.com/floriangiral/Bougnat_darts_counter/issues/315) |

## Specs retirées

- `012` : observabilité custom, remplacée par une observabilité native sans couche métier ([fiche](012-counter-custom-observability-retired/spec.md)).
- `024` : pageviews SPA, retirée du périmètre v1.1 ([fiche](024-counter-spa-pageviews-retired/spec.md)).
- `027` : affichage tablette historique, retirée le 2026-11-20 et remplacée par 070, 071 et 072 ([fiche](027-counter-tablet-display/spec.md)).

## Backlog du workspace (`.specify-workspace/backlog/next-specs.md`)

Fichier hors dépôt ; arbitrage du product owner du 2026-11-23 (recommandations de l'audit retenues), détaillé dans la [spec 032 §27](032-counter-sdd-conventions-v2/spec.md).

| Item | Décision (2026-11-23) |
|---|---|
| `001-xrepo-scoring-contract-v1` | Reporté ; cadrage dans [109](109-counter-bdt-contract-framing/spec.md) (V2-INT-07) |
| `002-bdt-extract-organizer-…` | Suivi côté `Bougnat_Darts_Tournaments` |
| `003-counter-split-scoring-client-from-player-social-shell` | Abandonné (shell social inexistant) |
| `004-xrepo-device-board-session-model` | Reporté ; lié à l'appairage TV ([088](088-counter-tv-pairing/spec.md)) |
| `005-counter-offline-scoring-session-store` | Fusionné dans [010](010-counter-offline-session-recovery-guarantees/spec.md) (file d'opérations reportée) |
| `006-bdt-live-sync-projections-hardening` | Suivi côté `Bougnat_Darts_Tournaments` |
| `007-xrepo-smartphone-vs-tablet-access-bounds` | Fusionné dans [001](001-counter-scoring-access-modes/spec.md) |

Décision globale : [V2-SDD-02](032-counter-sdd-conventions-v2/spec.md) [#215](https://github.com/floriangiral/Bougnat_darts_counter/issues/215).
