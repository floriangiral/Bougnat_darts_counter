# Feuille de route V2 — propositions à valider

> **Document de pilotage provisoire (2026-11-20).** Rien de ce qui figure ici n'est engagé : chaque ligne correspond à une spec au statut `a-valider` et à une issue GitHub. Aucun calendrier n'est fixé. Suivi : [projet GitHub « Bougnat Darts V2 »](https://github.com/users/floriangiral/projects/2) · [index des specs](../specs/README.md) · [audit du 2026-11-20](v2/README.md).

## Vision proposée

*« La station de scoring française, gratuite et sans compte, qui se pilote à la voix et s'affiche en grand. »* Dans cet ordre : (1) des règles justes et des parties qui ne se perdent jamais ; (2) un socle commun (état de partie sérialisable, design tokens, classes de taille, commandes métier partagées) ; (3) les expériences signature (voix mains libres et caller, mode TV, tablette « arène ») ; (4) la personnalisation et les leviers d'adoption. Le parcours de base — ouvrir, choisir un jeu, saisir les prénoms, jouer — ne gagne aucune étape obligatoire.

## Comment lire

- **Poids** (1-100) : rapport valeur/effort = valeur × priorité × 5 ÷ difficulté.
- **Reco** : recommandation de l'audit (Recommandé, Optionnel, Déconseillé, Étude préalable).
- Chaque lot est un milestone GitHub. Le product owner valide les issues une par une (label `decision:*` et champ « Décision » du projet).

## Lot 0 — Assainir et publier 2.0.0

| Issue | ID V2 | Titre | Statut | Famille | Prio | Diff. | Poids | Reco | Dépend de |
|---|---|---|---|---|---|---|---|---|---|
| [#204](https://github.com/floriangiral/Bougnat_darts_counter/issues/204) | V2-GAMES-01 | [X01 — conformité des sorties (finishes impossibles, Master-Out, aide checkout)](../specs/045-counter-x01-checkout-rules-compliance/spec.md) | `implementee` | Jeux & règles | P0 | S | 100 | Recommandé | V2-QA-01 |
| [#205](https://github.com/floriangiral/Bougnat_darts_counter/issues/205) | V2-INT-01 | [Lien de match externe v1 — finalisation pour publication](../specs/030-counter-external-match-link/spec.md) | `implementee` | Intégrations | P0 | S | 80 | Recommandé | — |
| [#206](https://github.com/floriangiral/Bougnat_darts_counter/issues/206) | V2-GAMES-04 | [Cricket — écran de victoire, annulation et départage](../specs/047-counter-cricket-end-of-game/spec.md) | `implementee` | Jeux & règles | P0 | S | 80 | Recommandé | — |
| [#300](https://github.com/floriangiral/Bougnat_darts_counter/issues/300) | V2-SEC-01 | [Gouvernance du dépôt GitHub (paramètres, ruleset main, permissions Actions, environnements)](../specs/115-counter-sec-github-governance/spec.md) | `a-valider` | DevSecOps & CI/CD | P0 | S | 80 | Recommandé | — |
| [#207](https://github.com/floriangiral/Bougnat_darts_counter/issues/207) | V2-DOC-01 | [Corrections documentaires immédiates](../specs/034-counter-doc-immediate-corrections/spec.md) | `a-valider` | Documentation | P0 | S | 60 | Recommandé | — |
| [#208](https://github.com/floriangiral/Bougnat_darts_counter/issues/208) | V2-VOICE-09 | [Voix — confidentialité (UE, mip_opt_out, information)](../specs/080-counter-voice-privacy/spec.md) | `a-valider` | Scoring vocal | P0 | S | 60 | Recommandé | — |
| [#301](https://github.com/floriangiral/Bougnat_darts_counter/issues/301) | V2-SEC-03 | [Secrets — Gitleaks, secret scanning, protection des pushes et procédure de rotation](../specs/118-counter-sec-secrets-detection/spec.md) | `a-valider` | DevSecOps & CI/CD | P0 | S | 60 | Recommandé | — |
| [#209](https://github.com/floriangiral/Bougnat_darts_counter/issues/209) | V2-TAB-02 | [Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé)](../specs/071-counter-tablet-landscape-fixes/spec.md) | `a-valider` | Tablette & responsive | P0 | M | 50 | Recommandé | — |
| [#210](https://github.com/floriangiral/Bougnat_darts_counter/issues/210) | V2-VOICE-01 | [Voix — fiabilité du pipeline et parseur français](../specs/003-counter-voice-scoring-reliability/spec.md) | `implementee` | Scoring vocal | P0 | M | 50 | Recommandé | V2-ARCH-03 |
| [#211](https://github.com/floriangiral/Bougnat_darts_counter/issues/211) | V2-REL-01 | [Clôture et publication de la release 2.0.0](../specs/033-counter-release-v2-0-0-publication/spec.md) | `a-valider` | Gouvernance & release | P0 | M | 40 | Recommandé | V2-INT-01, V2-DOC-01, V2-QA-10, V2-GAMES-01, V2-GAMES-02 |
| [#212](https://github.com/floriangiral/Bougnat_darts_counter/issues/212) | V2-QA-10 | [Durcissement de la CI](../specs/043-counter-qa-ci-hardening/spec.md) | `a-valider` | Qualité & tests | P0 | S | 40 | Recommandé | — |
| [#213](https://github.com/floriangiral/Bougnat_darts_counter/issues/213) | V2-GAMES-02 | [X01 — ouverture Double/Master-In (implémenter ou retirer)](../specs/046-counter-x01-double-master-in/spec.md) | `implementee` | Jeux & règles | P0 | M | 40 | Recommandé | V2-INT-01 |
| [#214](https://github.com/floriangiral/Bougnat_darts_counter/issues/214) | V2-SDD-01 | [Conventions SDD v2 (statuts, en-tête YAML, gabarits, index)](../specs/032-counter-sdd-conventions-v2/spec.md) | `a-valider` | Gouvernance & release | P0 | M | 30 | Recommandé | — |
| [#215](https://github.com/floriangiral/Bougnat_darts_counter/issues/215) | V2-SDD-02 | [Clôtures vérifiées des specs historiques et traitement du backlog workspace](../specs/032-counter-sdd-conventions-v2/spec.md) | `a-valider` | Gouvernance & release | P1 | S | 30 | Recommandé | V2-SDD-01 |
| [#216](https://github.com/floriangiral/Bougnat_darts_counter/issues/216) | V2-REL-02 | [PWA — livraison statique du manifeste et du service worker](../specs/031-counter-pwa-static-delivery/spec.md) | `a-valider` | Gouvernance & release | P1 | M | 30 | Recommandé | — |
| [#217](https://github.com/floriangiral/Bougnat_darts_counter/issues/217) | V2-DOC-03 | [Onboarding des agents IA (AGENTS.md)](../specs/036-counter-doc-ai-agents-onboarding/spec.md) | `a-valider` | Documentation | P1 | S | 30 | Recommandé | V2-SDD-01 |

## Lot 1 — Fondations communes

| Issue | ID V2 | Titre | Statut | Famille | Prio | Diff. | Poids | Reco | Dépend de |
|---|---|---|---|---|---|---|---|---|---|
| [#218](https://github.com/floriangiral/Bougnat_darts_counter/issues/218) | V2-QA-01 | [Golden tests de règles et tests de caractérisation par jeu](../specs/039-counter-qa-golden-rules-characterization/spec.md) | `a-valider` | Qualité & tests | P0 | M | 40 | Recommandé | — |
| [#219](https://github.com/floriangiral/Bougnat_darts_counter/issues/219) | V2-ARCH-03 | [Règles X01 uniques et commandes partagées (keypad, voix, robot, partenaire)](../specs/057-counter-x01-single-rules-shared-commands/spec.md) | `a-valider` | Architecture | P0 | M | 40 | Recommandé | V2-QA-01 |
| [#220](https://github.com/floriangiral/Bougnat_darts_counter/issues/220) | V2-DS-00 | [Baseline navigateurs (iOS 12, navigateurs TV) — décision](../specs/018-counter-ios12-compatibility/spec.md) | `a-revoir` | Design system & thèmes | P0 | M | 40 | Étude préalable | — |
| [#221](https://github.com/floriangiral/Bougnat_darts_counter/issues/221) | V2-TAB-01 | [Résolveur unique classes de taille et orientation](../specs/070-counter-size-class-resolver/spec.md) | `a-valider` | Tablette & responsive | P0 | M | 40 | Recommandé | — |
| [#222](https://github.com/floriangiral/Bougnat_darts_counter/issues/222) | V2-TV-01 | [Étude et ADR — diffusion TV et frontière serveur](../specs/083-counter-tv-broadcast-study/spec.md) | `a-valider` | Mode TV | P0 | M | 40 | Étude préalable | — |
| [#302](https://github.com/floriangiral/Bougnat_darts_counter/issues/302) | V2-CICD-02 | [Quality gate agrégé et politique d'auto-merge vérifiable](../specs/114-counter-cicd-quality-gate-automerge/spec.md) | `a-valider` | DevSecOps & CI/CD | P0 | M | 40 | Recommandé | V2-CICD-01, V2-SEC-01 |
| [#223](https://github.com/floriangiral/Bougnat_darts_counter/issues/223) | V2-ARCH-06 | [Reprise fiable de tous les jeux après rechargement](../specs/010-counter-offline-session-recovery-guarantees/spec.md) | `implementee` | Architecture | P0 | L | 33 | Recommandé | V2-ARCH-04 |
| [#224](https://github.com/floriangiral/Bougnat_darts_counter/issues/224) | V2-QA-09 | [Matrice d’appareils et de viewports réalistes](../specs/042-counter-qa-real-device-matrix/spec.md) | `a-valider` | Qualité & tests | P0 | M | 30 | Recommandé | — |
| [#225](https://github.com/floriangiral/Bougnat_darts_counter/issues/225) | V2-VOICE-03 | [Voix — corpus de référence et banc de mesure](../specs/074-counter-voice-corpus-benchmark/spec.md) | `a-valider` | Scoring vocal | P0 | M | 30 | Recommandé | — |
| [#303](https://github.com/floriangiral/Bougnat_darts_counter/issues/303) | V2-CICD-01 | [Architecture des workflows GitHub Actions et fréquences des contrôles](../specs/113-counter-cicd-workflow-architecture/spec.md) | `a-valider` | DevSecOps & CI/CD | P0 | M | 30 | Recommandé | V2-QA-10 |
| [#226](https://github.com/floriangiral/Bougnat_darts_counter/issues/226) | V2-ARCH-04 | [État de partie sérialisable et reducer pur par jeu](../specs/058-counter-serializable-game-state/spec.md) | `a-valider` | Architecture | P0 | L | 27 | Recommandé | V2-QA-01 |
| [#227](https://github.com/floriangiral/Bougnat_darts_counter/issues/227) | V2-DS-01 | [Design tokens (socle unique Dark/Light/club/TV)](../specs/063-counter-design-tokens/spec.md) | `a-valider` | Design system & thèmes | P0 | L | 20 | Recommandé | V2-DS-00, V2-QA-05 |
| [#228](https://github.com/floriangiral/Bougnat_darts_counter/issues/228) | V2-DS-04 | [Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif)](../specs/066-counter-reserved-game-colors/spec.md) | `a-valider` | Design system & thèmes | P1 | S | 45 | Recommandé | V2-DS-01 |
| [#229](https://github.com/floriangiral/Bougnat_darts_counter/issues/229) | V2-TAB-06 | [Affichage téléphone (028) — arbitrage portrait imposé](../specs/028-counter-smartphone-display/spec.md) | `a-revoir` | Tablette & responsive | P1 | S | 45 | Recommandé | — |
| [#304](https://github.com/floriangiral/Bougnat_darts_counter/issues/304) | V2-QA-16 | [TypeScript strict et règles ESLint — verrouillage et trajectoire progressive](../specs/124-counter-qa-typescript-eslint-strictness/spec.md) | `a-valider` | DevSecOps & CI/CD | P1 | S | 45 | Recommandé | V2-QA-10 |
| [#230](https://github.com/floriangiral/Bougnat_darts_counter/issues/230) | V2-QA-08 | [E2E autonomes et fiables — finalisation](../specs/008-counter-e2e-runtime-reliability/spec.md) | `en-cours` | Qualité & tests | P1 | S | 30 | Recommandé | — |
| [#231](https://github.com/floriangiral/Bougnat_darts_counter/issues/231) | V2-DS-02 | [Composants de base accessibles (focus visible, états, cibles 48 px)](../specs/064-counter-accessible-base-components/spec.md) | `a-valider` | Design system & thèmes | P1 | M | 30 | Recommandé | V2-DS-01 |
| [#232](https://github.com/floriangiral/Bougnat_darts_counter/issues/232) | V2-TAB-04 | [Affichage tablette (027) — révision et succession](../specs/027-counter-tablet-display/spec.md) | `a-revoir` | Tablette & responsive | P1 | S | 30 | Recommandé | V2-TAB-01 |
| [#305](https://github.com/floriangiral/Bougnat_darts_counter/issues/305) | V2-DEP-01 | [Renovate, unique générateur des mises à jour, et Dependabot limité à la veille de sécurité](../specs/116-counter-dep-renovate-dependabot/spec.md) | `a-valider` | DevSecOps & CI/CD | P1 | M | 30 | Recommandé | V2-SEC-01, V2-CICD-02 |
| [#233](https://github.com/floriangiral/Bougnat_darts_counter/issues/233) | V2-QA-05 | [Accessibilité automatisée et régression visuelle](../specs/041-counter-qa-accessibility-visual-regression/spec.md) | `a-valider` | Qualité & tests | P1 | M | 23 | Recommandé | — |
| [#234](https://github.com/floriangiral/Bougnat_darts_counter/issues/234) | V2-GAMES-26 | [Rétro-spécifications des règles (X01, Cricket, Capital, Triathlon)](../specs/050-counter-games-rules-reference/spec.md) | `a-valider` | Jeux & règles | P1 | M | 23 | Recommandé | V2-SDD-01 |
| [#306](https://github.com/floriangiral/Bougnat_darts_counter/issues/306) | V2-SEC-02 | [Analyse de sécurité du code et des dépendances (CodeQL, OSV-Scanner, Dependency Review) et politique de sévérité](../specs/117-counter-sec-vulnerability-scanning/spec.md) | `a-valider` | DevSecOps & CI/CD | P1 | M | 23 | Recommandé | V2-CICD-01 |
| [#307](https://github.com/floriangiral/Bougnat_darts_counter/issues/307) | V2-CICD-05 | [Documentation DevSecOps, opérations manuelles du product owner, séquencement et recette globale](../specs/128-counter-cicd-doc-and-manual-ops/spec.md) | `a-valider` | DevSecOps & CI/CD | P1 | M | 23 | Recommandé | V2-SEC-01, V2-DEP-01 |
| [#235](https://github.com/floriangiral/Bougnat_darts_counter/issues/235) | V2-ARCH-01 | [Frontières de couches et sort du domaine X01 inutilisé](../specs/056-counter-arch-layer-boundaries/spec.md) | `a-valider` | Architecture | P1 | M | 15 | Recommandé | V2-QA-01 |
| [#308](https://github.com/floriangiral/Bougnat_darts_counter/issues/308) | V2-CICD-03 | [Cadre d'intervention des agents IA dans la chaîne CI/CD](../specs/126-counter-cicd-ai-agents/spec.md) | `a-valider` | DevSecOps & CI/CD | P1 | M | 15 | Recommandé | V2-DOC-03, V2-CICD-02 |
| [#309](https://github.com/floriangiral/Bougnat_darts_counter/issues/309) | V2-SEC-04 | [OpenSSF Scorecard — évaluation hebdomadaire de la sécurité du dépôt](../specs/119-counter-sec-openssf-scorecard/spec.md) | `a-valider` | DevSecOps & CI/CD | P2 | S | 20 | Recommandé | V2-SEC-01 |

## Lot 2 — Expérience de jeu

| Issue | ID V2 | Titre | Statut | Famille | Prio | Diff. | Poids | Reco | Dépend de |
|---|---|---|---|---|---|---|---|---|---|
| [#236](https://github.com/floriangiral/Bougnat_darts_counter/issues/236) | V2-GAMES-30 | [Refus des totaux impossibles (Gotcha, Capital)](../specs/054-counter-impossible-totals-validation/spec.md) | `implementee` | Jeux & règles | P1 | S | 45 | Recommandé | V2-ARCH-03 |
| [#237](https://github.com/floriangiral/Bougnat_darts_counter/issues/237) | V2-THEME-02 | [Préférence de thème (système, sombre, clair)](../specs/069-counter-theme-preference/spec.md) | `a-valider` | Design system & thèmes | P1 | S | 45 | Recommandé | V2-DS-01 |
| [#238](https://github.com/floriangiral/Bougnat_darts_counter/issues/238) | V2-INT-02 | [Retour d’expérience badarts.fr / DartsHub](../specs/106-counter-partner-feedback-badarts/spec.md) | `a-valider` | Intégrations | P1 | S | 45 | Étude préalable | V2-INT-01 |
| [#239](https://github.com/floriangiral/Bougnat_darts_counter/issues/239) | V2-QA-11 | [Gouvernance de couverture — réduction des exclusions de vues](../specs/029-counter-sonar-coverage-governance/spec.md) | `implementee` | Qualité & tests | P1 | S | 30 | Recommandé | V2-ARCH-04 |
| [#240](https://github.com/floriangiral/Bougnat_darts_counter/issues/240) | V2-GAMES-06 | [Cadre de jeu commun (barre de partie, fin, revanche, undo, sortie)](../specs/049-counter-common-game-frame/spec.md) | `a-valider` | Jeux & règles | P1 | M | 30 | Recommandé | V2-ARCH-04 |
| [#241](https://github.com/floriangiral/Bougnat_darts_counter/issues/241) | V2-GAMES-10 | [Libellés français — finalisation (stats et écrans de jeu)](../specs/013-counter-stats-french-clean-architecture/spec.md) | `en-cours` | Jeux & règles | P1 | S | 30 | Recommandé | — |
| [#242](https://github.com/floriangiral/Bougnat_darts_counter/issues/242) | V2-THEME-01 | [Mode Light](../specs/068-counter-light-mode/spec.md) | `a-valider` | Design system & thèmes | P1 | M | 30 | Recommandé | V2-DS-03, V2-THEME-02 |
| [#243](https://github.com/floriangiral/Bougnat_darts_counter/issues/243) | V2-HIST-01 | [« Mes parties » — historique local](../specs/101-counter-my-games-history/spec.md) | `a-valider` | Innovation produit | P1 | M | 30 | Recommandé | V2-ARCH-06 |
| [#244](https://github.com/floriangiral/Bougnat_darts_counter/issues/244) | V2-TAB-03 | [Disposition « arène » tablette paysage](../specs/072-counter-arena-layout/spec.md) | `a-valider` | Tablette & responsive | P1 | L | 25 | Recommandé | V2-TAB-01, V2-DS-01 |
| [#245](https://github.com/floriangiral/Bougnat_darts_counter/issues/245) | V2-QA-04 | [Parcours E2E complets par jeu (partie, undo, reload)](../specs/040-counter-qa-e2e-full-game-journeys/spec.md) | `a-valider` | Qualité & tests | P1 | M | 23 | Recommandé | V2-ARCH-06 |
| [#246](https://github.com/floriangiral/Bougnat_darts_counter/issues/246) | V2-GAMES-05 | [Triathlon — barème v2 versionné](../specs/048-counter-triathlon-scoring-v2/spec.md) | `implementee` | Jeux & règles | P1 | M | 23 | Recommandé | V2-QA-01 |
| [#247](https://github.com/floriangiral/Bougnat_darts_counter/issues/247) | V2-TAB-05 | [Orientation tablette (verrou Android plein écran, invite non bloquante)](../specs/073-counter-tablet-orientation/spec.md) | `a-valider` | Tablette & responsive | P1 | M | 23 | Recommandé | V2-TAB-01 |
| [#248](https://github.com/floriangiral/Bougnat_darts_counter/issues/248) | V2-VOICE-10 | [Voix — durcissement du token et protection budgétaire](../specs/006-counter-voice-token-provisioning-hardening/spec.md) | `en-cours` | Scoring vocal | P1 | M | 23 | Recommandé | — |
| [#249](https://github.com/floriangiral/Bougnat_darts_counter/issues/249) | V2-DOC-02 | [Organisation documentaire, statuts de page et ADR](../specs/035-counter-doc-organisation-and-adr/spec.md) | `a-valider` | Documentation | P1 | M | 15 | Recommandé | V2-SDD-01 |
| [#250](https://github.com/floriangiral/Bougnat_darts_counter/issues/250) | V2-DS-03 | [Migration écran par écran vers les tokens](../specs/065-counter-screen-migration-to-tokens/spec.md) | `a-valider` | Design system & thèmes | P1 | L | 10 | Recommandé | V2-DS-01, V2-QA-05 |
| [#251](https://github.com/floriangiral/Bougnat_darts_counter/issues/251) | V2-DS-05 | [Animations et prefers-reduced-motion](../specs/067-counter-motion-reduced-motion/spec.md) | `a-valider` | Design system & thèmes | P2 | S | 20 | Recommandé | V2-DS-01 |
| [#310](https://github.com/floriangiral/Bougnat_darts_counter/issues/310) | V2-QA-12 | [Codecov — suivi de la couverture et couverture du code modifié dans les PR](../specs/120-counter-qa-codecov/spec.md) | `a-valider` | DevSecOps & CI/CD | P2 | S | 20 | Optionnel | V2-QA-11, V2-CICD-01 |
| [#311](https://github.com/floriangiral/Bougnat_darts_counter/issues/311) | V2-QA-13 | [Knip — détection hebdomadaire du code, des exports et des dépendances inutilisés](../specs/121-counter-qa-knip/spec.md) | `a-valider` | DevSecOps & CI/CD | P2 | S | 20 | Recommandé | V2-CICD-01 |
| [#252](https://github.com/floriangiral/Bougnat_darts_counter/issues/252) | V2-ARCH-12 | [Modes d’accès scoring — révision intégrale](../specs/001-counter-scoring-access-modes/spec.md) | `a-revoir` | Architecture | P2 | M | 10 | Recommandé | V2-TAB-01 |
| [#312](https://github.com/floriangiral/Bougnat_darts_counter/issues/312) | V2-QA-15 | [Lighthouse CI — performance, accessibilité et bonnes pratiques sur un build de production](../specs/123-counter-qa-lighthouse-ci/spec.md) | `a-valider` | DevSecOps & CI/CD | P2 | M | 10 | Recommandé | V2-CICD-01, V2-PERF-01 |
| [#313](https://github.com/floriangiral/Bougnat_darts_counter/issues/313) | V2-OBS-01 | [Étude — observabilité des erreurs en production (Sentry) compatible RGPD, CSP et gratuité](../specs/125-counter-obs-sentry-study/spec.md) | `a-valider` | DevSecOps & CI/CD | P2 | M | 10 | Étude préalable | — |
| [#314](https://github.com/floriangiral/Bougnat_darts_counter/issues/314) | V2-CICD-04 | [Rapport hebdomadaire DevSecOps et pilotage par indicateurs](../specs/127-counter-cicd-reporting/spec.md) | `a-valider` | DevSecOps & CI/CD | P2 | M | 10 | Recommandé | V2-CICD-01, V2-DEP-01, V2-SEC-02 |
| [#253](https://github.com/floriangiral/Bougnat_darts_counter/issues/253) | V2-ARCH-11 | [Découpage de MatchView (reliquat 022)](../specs/061-counter-matchview-decomposition/spec.md) | `a-valider` | Architecture | P2 | M | 5 | Recommandé | V2-ARCH-03 |
| [#315](https://github.com/floriangiral/Bougnat_darts_counter/issues/315) | V2-QA-14 | [Étude-pilote — tests de mutation StrykerJS sur les moteurs de jeu](../specs/122-counter-qa-mutation-testing-study/spec.md) | `a-valider` | DevSecOps & CI/CD | P3 | M | 5 | Étude préalable | V2-QA-01, V2-CICD-01 |

## Lot 3 — Signatures voix et TV

| Issue | ID V2 | Titre | Statut | Famille | Prio | Diff. | Poids | Reco | Dépend de |
|---|---|---|---|---|---|---|---|---|---|
| [#254](https://github.com/floriangiral/Bougnat_darts_counter/issues/254) | V2-VOICE-06 | [Caller « Bougnat » — annonces vocales en français](../specs/077-counter-voice-caller/spec.md) | `a-valider` | Scoring vocal | P1 | M | 38 | Recommandé | V2-VOICE-04 |
| [#255](https://github.com/floriangiral/Bougnat_darts_counter/issues/255) | V2-TV-06 | [Interface TV X01](../specs/086-counter-tv-x01-screen/spec.md) | `a-valider` | Mode TV | P1 | M | 38 | Recommandé | V2-TV-02, V2-DS-01 |
| [#256](https://github.com/floriangiral/Bougnat_darts_counter/issues/256) | V2-QR-01 | [Générateur de QR côté client partagé](../specs/092-counter-client-qr-generator/spec.md) | `a-valider` | Architecture | P1 | S | 30 | Recommandé | — |
| [#257](https://github.com/floriangiral/Bougnat_darts_counter/issues/257) | V2-TV-04 | [TV locale (fenêtre secondaire, HDMI, hors ligne)](../specs/085-counter-tv-local-window/spec.md) | `a-valider` | Mode TV | P1 | M | 30 | Recommandé | V2-TV-02 |
| [#258](https://github.com/floriangiral/Bougnat_darts_counter/issues/258) | V2-VOICE-05 | [Voix — mode partie mains libres](../specs/076-counter-voice-hands-free-mode/spec.md) | `a-valider` | Scoring vocal | P1 | L | 25 | Recommandé | V2-VOICE-01, V2-VOICE-03, V2-VOICE-04, V2-VOICE-10 |
| [#259](https://github.com/floriangiral/Bougnat_darts_counter/issues/259) | V2-VOICE-04 | [Voix — port de reconnaissance et commandes vocales](../specs/075-counter-voice-recognizer-port-commands/spec.md) | `a-valider` | Scoring vocal | P1 | M | 23 | Recommandé | V2-ARCH-03 |
| [#260](https://github.com/floriangiral/Bougnat_darts_counter/issues/260) | V2-TV-02 | [Projection spectateur versionnée](../specs/084-counter-spectator-projection/spec.md) | `a-valider` | Mode TV | P1 | M | 23 | Recommandé | V2-ARCH-03 |
| [#261](https://github.com/floriangiral/Bougnat_darts_counter/issues/261) | V2-VOICE-11 | [Voix — état vocal affiché sur la TV](../specs/081-counter-voice-state-on-tv/spec.md) | `a-valider` | Scoring vocal | P2 | S | 30 | Optionnel | V2-TV-02, V2-VOICE-05 |
| [#262](https://github.com/floriangiral/Bougnat_darts_counter/issues/262) | V2-TV-07 | [Appairage TV par code court ou QR](../specs/088-counter-tv-pairing/spec.md) | `a-valider` | Mode TV | P2 | M | 20 | Recommandé | V2-TV-05, V2-QR-01 |
| [#263](https://github.com/floriangiral/Bougnat_darts_counter/issues/263) | V2-TV-05 | [Relais TV distant (Worker + Durable Object)](../specs/087-counter-tv-remote-relay/spec.md) | `a-valider` | Mode TV | P2 | L | 17 | Recommandé | V2-TV-01, V2-TV-02 |
| [#264](https://github.com/floriangiral/Bougnat_darts_counter/issues/264) | V2-TV-11 | [Qualification sur TV réelles](../specs/090-counter-tv-field-qualification/spec.md) | `a-valider` | Mode TV | P2 | M | 10 | Recommandé | V2-TV-05, V2-DS-00 |

## Lot 4 — Personnalisation et adoption

| Issue | ID V2 | Titre | Statut | Famille | Prio | Diff. | Poids | Reco | Dépend de |
|---|---|---|---|---|---|---|---|---|---|
| [#265](https://github.com/floriangiral/Bougnat_darts_counter/issues/265) | V2-BRAND-06 | [Thème transmis à l’écran TV](../specs/098-counter-theme-to-tv/spec.md) | `a-valider` | Personnalisation | P2 | S | 30 | Recommandé | V2-TV-02, V2-BRAND-01 |
| [#266](https://github.com/floriangiral/Bougnat_darts_counter/issues/266) | V2-INT-04 | [Retour du résultat par QR (inter-appareils)](../specs/107-counter-result-return-qr/spec.md) | `a-valider` | Intégrations | P2 | S | 30 | Optionnel | V2-QR-01, V2-INT-01 |
| [#267](https://github.com/floriangiral/Bougnat_darts_counter/issues/267) | V2-BRAND-01 | [Modèle de thème club (graines, dérivation, garde-fous)](../specs/093-counter-club-theme-model/spec.md) | `a-valider` | Personnalisation | P2 | M | 20 | Recommandé | V2-DS-01, V2-DS-04 |
| [#268](https://github.com/floriangiral/Bougnat_darts_counter/issues/268) | V2-BRAND-02 | [Éditeur visuel de thème](../specs/094-counter-theme-visual-editor/spec.md) | `a-valider` | Personnalisation | P2 | M | 20 | Recommandé | V2-BRAND-01 |
| [#269](https://github.com/floriangiral/Bougnat_darts_counter/issues/269) | V2-BRAND-03 | [Import du logo du club](../specs/095-counter-logo-import/spec.md) | `a-valider` | Personnalisation | P2 | M | 20 | Recommandé | V2-BRAND-01 |
| [#270](https://github.com/floriangiral/Bougnat_darts_counter/issues/270) | V2-BRAND-04 | [Partage de thème sans compte (fichier, lien, QR)](../specs/096-counter-theme-sharing-no-account/spec.md) | `a-valider` | Personnalisation | P2 | M | 20 | Recommandé | V2-BRAND-01, V2-QR-01 |
| [#271](https://github.com/floriangiral/Bougnat_darts_counter/issues/271) | V2-BRAND-05 | [Mention Bougnat Darts obligatoire (co-branding)](../specs/097-counter-mandatory-bougnat-mention/spec.md) | `a-valider` | Personnalisation | P2 | S | 20 | Recommandé | V2-BRAND-01 |
| [#272](https://github.com/floriangiral/Bougnat_darts_counter/issues/272) | V2-STATION-01 | [« Station en un scan » — configuration de lieu par QR](../specs/100-counter-station-one-scan/spec.md) | `a-valider` | Personnalisation | P2 | M | 20 | Recommandé | V2-BRAND-04, V2-QR-01 |
| [#273](https://github.com/floriangiral/Bougnat_darts_counter/issues/273) | V2-SHARE-01 | [« La partie à emporter » — récap partageable](../specs/102-counter-take-away-recap/spec.md) | `a-valider` | Innovation produit | P2 | M | 20 | Recommandé | V2-QR-01 |
| [#274](https://github.com/floriangiral/Bougnat_darts_counter/issues/274) | V2-INT-08 | [Politique d’admission des partenaires](../specs/110-counter-partner-admission-policy/spec.md) | `a-valider` | Intégrations | P2 | S | 20 | Recommandé | V2-INT-01 |
| [#275](https://github.com/floriangiral/Bougnat_darts_counter/issues/275) | V2-DOC-05 | [Guides utilisateur V2 (voix, TV, thèmes, station)](../specs/037-counter-doc-user-guides-v2/spec.md) | `a-valider` | Documentation | P2 | M | 15 | Recommandé | V2-VOICE-05, V2-TV-04, V2-THEME-01, V2-BRAND-02 |
| [#276](https://github.com/floriangiral/Bougnat_darts_counter/issues/276) | V2-GAMES-23 | [Mode Découverte — première partie guidée](../specs/055-counter-discovery-mode/spec.md) | `a-valider` | Innovation produit | P2 | M | 15 | Optionnel | V2-GAMES-06 |
| [#277](https://github.com/floriangiral/Bougnat_darts_counter/issues/277) | V2-TV-08 | [Interfaces TV des autres jeux](../specs/089-counter-tv-other-games/spec.md) | `a-valider` | Mode TV | P2 | L | 13 | Recommandé | V2-ARCH-04, V2-TV-06 |

## Lot 5 — Extensions et ultérieur

| Issue | ID V2 | Titre | Statut | Famille | Prio | Diff. | Poids | Reco | Dépend de |
|---|---|---|---|---|---|---|---|---|---|
| [#278](https://github.com/floriangiral/Bougnat_darts_counter/issues/278) | V2-PERF-01 | [Budgets de performance mesurés (INP, bundle)](../specs/044-counter-perf-budgets/spec.md) | `a-valider` | Qualité & tests | P2 | S | 20 | Recommandé | — |
| [#279](https://github.com/floriangiral/Bougnat_darts_counter/issues/279) | V2-GAMES-12 | [Cricket — variantes Cut-throat et multi-manches](../specs/051-counter-cricket-variants/spec.md) | `a-valider` | Jeux & règles | P2 | M | 15 | Optionnel | V2-ARCH-04 |
| [#280](https://github.com/floriangiral/Bougnat_darts_counter/issues/280) | V2-GAMES-16 | [X01 — 3 à 4 joueurs en simple](../specs/052-counter-x01-three-four-players/spec.md) | `a-valider` | Jeux & règles | P2 | M | 15 | Optionnel | V2-TAB-03 |
| [#281](https://github.com/floriangiral/Bougnat_darts_counter/issues/281) | V2-ARCH-05 | [Journal de partie append-only (undo persistant, correction)](../specs/059-counter-append-only-game-journal/spec.md) | `a-valider` | Architecture | P2 | M | 15 | Optionnel | V2-ARCH-04 |
| [#282](https://github.com/floriangiral/Bougnat_darts_counter/issues/282) | V2-VOICE-07 | [Étude — moteurs vocaux sur l’appareil](../specs/078-counter-voice-on-device-study/spec.md) | `a-valider` | Scoring vocal | P2 | M | 15 | Étude préalable | V2-VOICE-03 |
| [#283](https://github.com/floriangiral/Bougnat_darts_counter/issues/283) | V2-INT-07 | [Cadrage du contrat compteur ↔ Bougnat_Darts_Tournaments](../specs/109-counter-bdt-contract-framing/spec.md) | `a-valider` | Intégrations | P2 | M | 15 | Étude préalable | V2-TV-02 |
| [#284](https://github.com/floriangiral/Bougnat_darts_counter/issues/284) | V2-VOICE-08 | [Voix — extension aux autres jeux (Cricket d’abord)](../specs/079-counter-voice-multi-game/spec.md) | `a-valider` | Scoring vocal | P2 | L | 13 | Optionnel | V2-ARCH-04, V2-VOICE-04 |
| [#285](https://github.com/floriangiral/Bougnat_darts_counter/issues/285) | V2-REL-03 | [Contrat d’environnement — finalisation](../specs/009-counter-env-contract-and-validation/spec.md) | `en-cours` | Gouvernance & release | P2 | S | 10 | Recommandé | — |
| [#286](https://github.com/floriangiral/Bougnat_darts_counter/issues/286) | V2-GAMES-13 | [Killer et Gotcha — variantes et règles de référence](../specs/053-counter-killer-gotcha-variants/spec.md) | `a-valider` | Jeux & règles | P3 | S | 10 | Optionnel | V2-GAMES-06 |
| [#287](https://github.com/floriangiral/Bougnat_darts_counter/issues/287) | V2-INT-09 | [Programme de prises de contact partenaires](../specs/112-counter-partner-outreach-program/spec.md) | `a-valider` | Intégrations | P3 | S | 10 | Étude préalable | — |
| [#288](https://github.com/floriangiral/Bougnat_darts_counter/issues/288) | V2-VOICE-14 | [Mode accessibilité audio](../specs/082-counter-audio-accessibility-mode/spec.md) | `a-valider` | Scoring vocal | P3 | M | 8 | Optionnel | V2-VOICE-05, V2-VOICE-06 |
| [#289](https://github.com/floriangiral/Bougnat_darts_counter/issues/289) | V2-TRAIN-01 | [Étude — atelier finitions (entraînement)](../specs/103-counter-training-checkout-study/spec.md) | `a-valider` | Innovation produit | P3 | M | 8 | Étude préalable | V2-VOICE-05 |
| [#290](https://github.com/floriangiral/Bougnat_darts_counter/issues/290) | V2-DOC-06 | [Changelog in-app généré depuis les notes de release](../specs/038-counter-in-app-changelog-source/spec.md) | `a-valider` | Documentation | P3 | S | 5 | Optionnel | — |
| [#291](https://github.com/floriangiral/Bougnat_darts_counter/issues/291) | V2-GAMES-11 | [Taux de checkout — définition enrichie](../specs/023-counter-x01-double-out-checkout-rate/spec.md) | `implementee` | Jeux & règles | P3 | S | 5 | Optionnel | — |
| [#292](https://github.com/floriangiral/Bougnat_darts_counter/issues/292) | V2-ARCH-15 | [Étude — point d’entrée de score agnostique (caméras type Scolia)](../specs/062-counter-score-input-agnostic-study/spec.md) | `a-valider` | Architecture | P3 | M | 5 | Étude préalable | V2-ARCH-03 |
| [#293](https://github.com/floriangiral/Bougnat_darts_counter/issues/293) | V2-TV-10 | [Étude — multi-écrans, Google Cast, Presentation API](../specs/091-counter-tv-multi-screen-cast-study/spec.md) | `a-valider` | Mode TV | P3 | M | 5 | Étude préalable | V2-TV-05 |
| [#294](https://github.com/floriangiral/Bougnat_darts_counter/issues/294) | V2-BRAND-07 | [Étude — stockage serveur des thèmes (code court)](../specs/099-counter-theme-server-storage-study/spec.md) | `a-valider` | Personnalisation | P3 | M | 5 | Déconseillé | V2-BRAND-04 |
| [#295](https://github.com/floriangiral/Bougnat_darts_counter/issues/295) | V2-GAMES-24 | [Défi du comptoir](../specs/104-counter-bar-challenge/spec.md) | `a-valider` | Innovation produit | P3 | M | 5 | Optionnel | V2-ARCH-04 |
| [#296](https://github.com/floriangiral/Bougnat_darts_counter/issues/296) | V2-GAMES-25 | [Étude — « Soirée éclair » (mini-tournoi local)](../specs/105-counter-flash-night-study/spec.md) | `a-valider` | Innovation produit | P3 | L | 5 | Étude préalable | V2-ARCH-04, V2-INT-07 |
| [#297](https://github.com/floriangiral/Bougnat_darts_counter/issues/297) | V2-INT-05 | [Étude — contrat de lien v=2](../specs/108-counter-link-contract-v2-study/spec.md) | `a-valider` | Intégrations | P3 | M | 5 | Étude préalable | V2-INT-02 |
| [#298](https://github.com/floriangiral/Bougnat_darts_counter/issues/298) | V2-ARCH-09 | [Registre de jeux](../specs/060-counter-game-registry/spec.md) | `a-valider` | Architecture | P3 | M | 3 | Optionnel | V2-ARCH-04 |
| [#299](https://github.com/floriangiral/Bougnat_darts_counter/issues/299) | V2-INT-03 | [Module neutre « match lié » (au 2e canal)](../specs/111-counter-linked-match-module/spec.md) | `a-valider` | Intégrations | P3 | M | 3 | Optionnel | V2-INT-05 |

## Fondations à ne pas sauter

1. Tests de caractérisation validés métier avant toute extraction (V2-QA-01).
2. État de partie sérialisable par jeu (V2-ARCH-04) : sert la reprise, la TV, la voix multi-jeux et le contrat avec `Bougnat_Darts_Tournaments`.
3. Design tokens uniques pour Dark, Light, thèmes de club et TV (V2-DS-01), après la décision de baseline navigateurs (V2-DS-00).
4. Résolveur unique de classes de taille (V2-TAB-01).
5. Commandes métier partagées par le keypad, la voix, le robot et les partenaires (V2-ARCH-03).

## Arbitrages ouverts

| # | Question | Issue de rattachement |
|---|---|---|
| 1 | Périmètre de la 2.0.0 : publier après le lot 0, puis livrer la V2 en versions 2.x | [#211](https://github.com/floriangiral/Bougnat_darts_counter/issues/211) (V2-REL-01) |
| 2 | Double/Master In : implémenter ou retirer (paramètre `in=` du contrat v1) | [#213](https://github.com/floriangiral/Bougnat_darts_counter/issues/213) (V2-GAMES-02) |
| 3 | Baseline navigateurs : iOS 12, générations de TV, appareils de test | [#220](https://github.com/floriangiral/Bougnat_darts_counter/issues/220) (V2-DS-00) |
| 4 | Relais serveur optionnel pour la TV distante ; plan Free ou Paid plafonné | [#222](https://github.com/floriangiral/Bougnat_darts_counter/issues/222) (V2-TV-01) |
| 5 | Budget voix, plafond, région UE et `mip_opt_out` | [#248](https://github.com/floriangiral/Bougnat_darts_counter/issues/248) (V2-VOICE-10) |
| 6 | Confirmation vocale : tactile, vocale explicite ou temporisée | [#258](https://github.com/floriangiral/Bougnat_darts_counter/issues/258) (V2-VOICE-05) |
| 7 | Orientation : invite non bloquante, portrait imposé sur téléphone (WCAG 1.3.4) | [#229](https://github.com/floriangiral/Bougnat_darts_counter/issues/229) (V2-TAB-06) |
| 8 | Adoption des conventions SDD v2 | [#214](https://github.com/floriangiral/Bougnat_darts_counter/issues/214) (V2-SDD-01) |
| 9 | Reprise de tous les jeux en P0 | [#223](https://github.com/floriangiral/Bougnat_darts_counter/issues/223) (V2-ARCH-06) |
| 10 | Règles maison, barème Triathlon, départage Cricket | [#246](https://github.com/floriangiral/Bougnat_darts_counter/issues/246) (V2-GAMES-05) |
| 11 | X01 à 3-4 joueurs, saisie par fléchette, variantes Cricket | [#280](https://github.com/floriangiral/Bougnat_darts_counter/issues/280) (V2-GAMES-16) |
| 12 | Historique local : afficher ou cesser d’enregistrer | [#243](https://github.com/floriangiral/Bougnat_darts_counter/issues/243) (V2-HIST-01) |
| 13 | Fonctionnalités signature retenues | [#254](https://github.com/floriangiral/Bougnat_darts_counter/issues/254) (V2-VOICE-06) |
| 14 | Caller : activation par défaut, ton, voix | [#254](https://github.com/floriangiral/Bougnat_darts_counter/issues/254) (V2-VOICE-06) |
| 15 | Plage du robot Pro (spec 016) | [#215](https://github.com/floriangiral/Bougnat_darts_counter/issues/215) (V2-SDD-02) |
| 16 | Logo : SVG, présence dans le lien/QR, couleur du joueur actif | [#269](https://github.com/floriangiral/Bougnat_darts_counter/issues/269) (V2-BRAND-03) |
| 17 | Formule de co-branding, thème TV | [#271](https://github.com/floriangiral/Bougnat_darts_counter/issues/271) (V2-BRAND-05) |
| 18 | Prénoms ou initiales avant envoi à la TV ; spectateurs par lien | [#263](https://github.com/floriangiral/Bougnat_darts_counter/issues/263) (V2-TV-05) |
| 19 | Pause ; Google Cast | [#293](https://github.com/floriangiral/Bougnat_darts_counter/issues/293) (V2-TV-10) |
| 20 | Contrat v1 figé ; Cricket partenaire | [#205](https://github.com/floriangiral/Bougnat_darts_counter/issues/205) (V2-INT-01) |
| 21 | Autorisation de contacter des partenaires | [#287](https://github.com/floriangiral/Bougnat_darts_counter/issues/287) (V2-INT-09) |
| 22 | Autorité en tournoi (BDT fait foi) | [#283](https://github.com/floriangiral/Bougnat_darts_counter/issues/283) (V2-INT-07) |
| 23 | Abandon de l’item workspace 003 | [#215](https://github.com/floriangiral/Bougnat_darts_counter/issues/215) (V2-SDD-02) |
| 24 | Domaine X01 inutilisé : rebrancher ou supprimer | [#235](https://github.com/floriangiral/Bougnat_darts_counter/issues/235) (V2-ARCH-01) |
| 25 | Nouvelles dépendances : `@axe-core/playwright`, captures, `qrcode` côté client | [#233](https://github.com/floriangiral/Bougnat_darts_counter/issues/233) (V2-QA-05) |
| 26 | Organisation de `docs/` ; changelog in-app | [#249](https://github.com/floriangiral/Bougnat_darts_counter/issues/249) (V2-DOC-02) |
| 27 | Mesure d’adoption sans cookie ; site vitrine | [#275](https://github.com/floriangiral/Bougnat_darts_counter/issues/275) (V2-DOC-05) |

## Top 15 par poids (rapport valeur/effort)

| Issue | ID V2 | Titre | Poids | Lot |
|---|---|---|---|---|
| [#204](https://github.com/floriangiral/Bougnat_darts_counter/issues/204) | V2-GAMES-01 | X01 — conformité des sorties (finishes impossibles, Master-Out, aide checkout) | 100 | 0 |
| [#205](https://github.com/floriangiral/Bougnat_darts_counter/issues/205) | V2-INT-01 | Lien de match externe v1 — finalisation pour publication | 80 | 0 |
| [#206](https://github.com/floriangiral/Bougnat_darts_counter/issues/206) | V2-GAMES-04 | Cricket — écran de victoire, annulation et départage | 80 | 0 |
| [#300](https://github.com/floriangiral/Bougnat_darts_counter/issues/300) | V2-SEC-01 | Gouvernance du dépôt GitHub (paramètres, ruleset main, permissions Actions, environnements) | 80 | 0 |
| [#207](https://github.com/floriangiral/Bougnat_darts_counter/issues/207) | V2-DOC-01 | Corrections documentaires immédiates | 60 | 0 |
| [#208](https://github.com/floriangiral/Bougnat_darts_counter/issues/208) | V2-VOICE-09 | Voix — confidentialité (UE, mip_opt_out, information) | 60 | 0 |
| [#301](https://github.com/floriangiral/Bougnat_darts_counter/issues/301) | V2-SEC-03 | Secrets — Gitleaks, secret scanning, protection des pushes et procédure de rotation | 60 | 0 |
| [#209](https://github.com/floriangiral/Bougnat_darts_counter/issues/209) | V2-TAB-02 | Correctifs tablette et paysage (score 0 px, touches hors écran, keypad écrasé) | 50 | 0 |
| [#210](https://github.com/floriangiral/Bougnat_darts_counter/issues/210) | V2-VOICE-01 | Voix — fiabilité du pipeline et parseur français | 50 | 0 |
| [#236](https://github.com/floriangiral/Bougnat_darts_counter/issues/236) | V2-GAMES-30 | Refus des totaux impossibles (Gotcha, Capital) | 45 | 2 |
| [#228](https://github.com/floriangiral/Bougnat_darts_counter/issues/228) | V2-DS-04 | Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif) | 45 | 1 |
| [#237](https://github.com/floriangiral/Bougnat_darts_counter/issues/237) | V2-THEME-02 | Préférence de thème (système, sombre, clair) | 45 | 2 |
| [#229](https://github.com/floriangiral/Bougnat_darts_counter/issues/229) | V2-TAB-06 | Affichage téléphone (028) — arbitrage portrait imposé | 45 | 1 |
| [#238](https://github.com/floriangiral/Bougnat_darts_counter/issues/238) | V2-INT-02 | Retour d’expérience badarts.fr / DartsHub | 45 | 2 |
| [#304](https://github.com/floriangiral/Bougnat_darts_counter/issues/304) | V2-QA-16 | TypeScript strict et règles ESLint — verrouillage et trajectoire progressive | 45 | 1 |
