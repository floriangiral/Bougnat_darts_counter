# Tâches — 034 Corrections documentaires immédiates

> Spec validée par le product owner le 2026-11-23 (« Go », recommandations retenues) et implémentée le même jour. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (validation du product owner du 2026-11-23) et relire les corrections anticipées de la PR `docs/v2-specs` (commit `6ca78eb`)

## Inventaire revérifié le 2026-11-23

L'inventaire C-01 à C-51 a été établi au commit `508dfa6`. Chaque ligne a été revérifiée contre le code au commit `863b4bd` (`origin/develop`) ; le code fait foi. C-52 et C-53 ont été relevés pendant cette revérification.

Classement :

- **Déjà corrigé (commit)** : l'écart n'existe plus, corrigé par la documentation ou parce que le code livre désormais la fonctionnalité ;
- **Corrigé dans cette PR** : correction apportée par le commit `0116952` ;
- **Reporté à la spec X** : écart hors du périmètre de 034 (code, CI, fichiers réservés à une autre spec ou hors dépôt), inscrit dans la spec propriétaire.

| # | Chemin:ligne (au commit `508dfa6`) | Écart | Classement au 2026-11-23 | Preuve |
|---|---|---|---|---|
| C-01 | `README.md:22` | Reprise promise pour toute partie (X01 seulement) | Déjà corrigé (`97c0947` à `208d709`, spec 010) | Les sept jeux sont repris (`App.tsx`, `restoredState` de chaque vue) ; `README.md:23,40` est exact |
| C-02 | `README.md:30` | « l'ouverture » réglable (jamais appliquée) | Déjà corrigé (`ebb5969`, spec 046) | `src/domain/scoring/x01OpeningRules.ts` applique Double/Master-In |
| C-03 | `README.md:21,60` | « écran de comptoir… tout le monde suit » (aucun mode TV) | Corrigé dans cette PR | Toujours présent (`README.md:35,84`) ; reformulé sans laisser croire à un affichage TV |
| C-04 | `docs/specifications.md:20,243` | Reprise de session tous jeux | Déjà corrigé (`6ca78eb`, puis spec 010 `d892e2c`) | Reprise réelle des sept jeux, §7 « Reprise de session » |
| C-05 | `docs/specifications.md:21,236,245` | Historique local présenté comme disponible | Déjà corrigé (`6ca78eb`) | Qualifié « enregistré, non affiché » (spec 101) ; `listLocalGameHistory` toujours sans consommateur UI |
| C-06 | `docs/specifications.md:80` | « open / double / master in » | Déjà corrigé (`ebb5969`, `58dee55`) | Fonction livrée et documentée (spec 046) |
| C-07 | `docs/specifications.md:68` | « 501 Double Out » listé comme mode | Déjà corrigé (`6ca78eb`) | Qualifié « configuration X01, pas un jeu distinct » |
| C-08 | `docs/product-scope.md:10-11` | Reprise et historique locaux | Déjà corrigé (`6ca78eb`, spec 010) | Reprise exacte, historique qualifié (spec 101) |
| C-09 | `docs/product-scope.md:28` | « mode bot IA » | Déjà corrigé (`6ca78eb`) | « adversaire robot — tirage probabiliste… pas une IA » |
| C-10 | `docs/technical.md:12` | « 501 Double Out » listé comme jeu | Déjà corrigé (`6ca78eb`) | « `X01` (dont la configuration 501 Double Out) » |
| C-11 | `docs/integration/external-match-link.md:46` | `in` accepté sans effet | Déjà corrigé (`ebb5969`, `008eaa8`) | `in=` appliqué au match lié ; guide à jour |
| C-12 | `docs/architecture.md:36` | Reprise de session | Déjà corrigé (spec 010) | Exact depuis la reprise des sept jeux |
| C-13 | `docs/architecture.md:60-65` | `CONNECTED_MODE` inexistant | Déjà corrigé (`6ca78eb`) | Section marquée « futur — non implémenté » |
| C-14 | `docs/architecture.md:69-101,112-118` | Arbre faux, règle de dépendance violée non signalée | Corrigé dans cette PR (complément de `6ca78eb`) | Écarts signalés depuis `6ca78eb` ; arbre redevenu incomplet (180 Around the Clock, Réglages, partage, `screens/`) et complété |
| C-15 | `docs/release/v2.0.0.md:9` | Lien « désactivé » alors que badarts.fr est déclaré (contradiction 030) | Déjà corrigé (`ad86dfb`) | `v2.0.0.md:11` : actif pour `https://badarts.fr` |
| C-16 | `docs/product-scope.md:41`, `docs/architecture.md:158,172` | Idem (contradiction 030) | Déjà corrigé (`6ca78eb`, `ad86dfb`) | Les deux documents citent la configuration livrée |
| C-17 | `docs/release/v2.0.0.md:70` | Manifeste dit non livré (il l'est, haché) ; `/sw.js` absent | Déjà corrigé (`92d398c` code, `ad86dfb` doc, spec 031) | `public/manifest.json` et `public/sw.js` livrés, garde `scripts/validate-pwa-build.mjs` |
| C-18 | `specs/028-counter-smartphone-display/spec.md:14,30-31` | « Landscape never blocked » vs portrait imposé | Déjà corrigé (`21969b2` code, `6730d6b` spec, option B) | Verrou et écran bloquant supprimés ; invite non bloquante (`src/features/layout/orientationHint.ts`) |
| C-19 | `specs/README.md:142` | 727 tests vs 746 | Déjà corrigé (`c4af817`) | `specs/README.md` renvoie au dernier rapport de CI, sans chiffre figé |
| C-20 | `docs/technical.md:132` | « 61 tests E2E passent » vs suite non exécutée | Déjà corrigé (`6ca78eb`) | Bilan daté du 19 novembre, renvoi à la release |
| C-21 | `docs/technical.md:333-336` | Chiffres du 3 novembre (398 tests) non datés comme historiques | Corrigé dans cette PR | Introduits comme « mesures historiques », renvoi à la dernière mesure datée des notes v2.1.0 |
| C-22 | `docs/release/v2.0.0.md:100` | 28 scénarios E2E annoncés vs 29 comptés statiquement | Corrigé dans cette PR | 29 au commit `daef027` (25 tests nommés + 4 cas paramétrés), 28 exécutés lors de la préparation |
| C-23 | `docs/technical.md:187,218` | Liens absolus `/home/...` | Déjà corrigé (`6ca78eb`) | AC-02 : aucun lien Markdown `](/home/` |
| C-24 | `.specify/memory/constitution.md:4` | Lien absolu local | Déjà corrigé (`5eaacab`) | Contenu transverse cité, sans chemin local |
| C-25 | `.github/ISSUE_TEMPLATE/bug_report.yml:21-33,113` | Zones sans Killer/Gotcha/lien/tablette ; placeholder `v1.0.1` | Corrigé dans cette PR (complément de `6ca78eb`) | Ajout de 180 Around the Clock et Réglages / thème ; placeholder `v2.1.0` (la 2.0.0 n'a jamais été publiée) |
| C-26 | `.github/ISSUE_TEMPLATE/improvement.yml:20-32` | Idem | Corrigé dans cette PR (complément de `6ca78eb`) | Idem C-25 |
| C-27 | `.github/ISSUE_TEMPLATE/config.yml:3-5` | Lien WhatsApp public | Corrigé dans cette PR (décision Q1 : conserver, aucune modification) | Lien ajouté volontairement par le mainteneur (`e4f5829`) |
| C-28 | `AGENTS.md` (absent) | Aucune instruction pour agents IA | Déjà corrigé (`6ca78eb`) | `AGENTS.md` présent (contenu : spec 036) |
| C-29 | `docs/adr/` (absent) | Aucun ADR | Déjà corrigé (`6ca78eb`) | `docs/adr/README.md`, ADR 0006 et 0007 acceptées |
| C-30 | `docs/release/v1.1.md:3`, `v1.1.1…v1.1.5.md:3` (+ coverage maps) | « La version active est v2.0.0 » | Corrigé dans cette PR (complément de `6ca78eb`) | Bandeaux « dernière version préparée : v2.0.0 (non publiée) » rendus faux par la 2.1.0 : renvoi vers v2.1.0 ; v1.1.4 signalée en production |
| C-31 | `docs/release/v1.0.0.md:5`, `v1.0.1.md:5`, `v1.0.2.md:5` | « stable » sans bandeau historique | Corrigé dans cette PR | Bandeau historique sur les notes et coverage maps v1.0.x |
| C-32 | `docs/release/react-19-validation-matrix.md:5` | React 19.2.0 (actuel 19.3.1), sans bandeau | Corrigé dans cette PR | Bandeau historique (19.2.0 vs 19.3.1) |
| C-33 | `docs/technical.md:7` | Branche `release/v2.0.0` vs `feat/v2.0.0` | Déjà corrigé (`6ca78eb`) | Branche `release/v2.1.0` ; statut corrigé par C-53 |
| C-34 | `docs/technical.md:167` | « socle Node 24 » vs `.nvmrc` 26.13.1 | Déjà corrigé (`6ca78eb`) | « socle Node 26 » |
| C-35 | `docs/technical.md:393-412` | Index sans `v1.0.0`, `v1.0.2-coverage-map`, matrice React 19 | Corrigé dans cette PR | Ajout de ces entrées, des ADR, du design system, du périmètre, de la feuille de route et de l'audit V2 |
| C-36 | `docs/technical.md` (section Playwright) | Prérequis E2E (WebKit, `https://partner.example`), Docker de dev, navigateurs non documentés | Corrigé dans cette PR | Sections « Tests E2E en local », « Développement dans Docker », « Navigateurs pris en charge » |
| C-37 | `docs/technical.md:187` | `VITE_APP_*` dits déclarés dans `wrangler.jsonc` ; `VITE_APP_VERSION` absent | Corrigé dans cette PR (documentation) ; contrat reporté à la spec 009 | Liste exacte des variables déclarées ; contrat de `VITE_APP_VERSION` déjà inscrit dans la spec 009 |
| C-38 | `docs/specifications.md:166` (§5.bis) et §4 | 13 slugs sur 29 ; aucune règle Killer/Gotcha | Corrigé dans cette PR | Sections Killer et Gotcha (specs 017, 019) ; §5.bis signalée comme liste historique, renvoi à `specs/README.md` |
| C-39 | `docs/architecture/scoring-access-modes.md:5` | Renvoie à `specifications.md` qui ne traite pas le sujet | Corrigé dans cette PR (renvoi) ; bandeau normalisé reporté à la spec 035 | Renvoi vers la Révision V2 de la spec 001 |
| C-40 | `docs/audit-security-hosting-performance-2026-04-24.md`, `docs/architecture/*.md` | Pas de bandeau historique | Reporté à la spec 035 (V2-DOC-02) | Inscrit (spec 035, O1 et §4) |
| C-41 | `specs/README.md:112,152` | « release active v2.0.0 », slug fantôme, 027/028 absents | Déjà corrigé (`5eaacab`, `c4af817`) | 027 et 028 indexées, slugs historiques rattachés (`specs/README.md:59`) |
| C-42 | `tests/e2e/completion.smoke.spec.ts:1` | Slug `smoke-e2e-per-game-navigation` inexistant | Reporté à la spec 040 (V2-QA-04) | Toujours présent ; inscrit (spec 040, AC-04, T008) |
| C-43 | `SECURITY.md:15` | Domaine `.net` vs `.fr` | Corrigé dans cette PR (décision Q2) | `bougnatdarts.net` n'existe pas (DNS NXDOMAIN le 2026-11-23) ; `security_code@bougnatdarts.fr` (MX présents) |
| C-44 | `CONTRIBUTING.md:35-48` | `guard:clean`, prérequis E2E, renvoi `AGENTS.md` absents | Corrigé dans cette PR (renvois) ; `guard:clean` dans « Vérification minimale » reporté à la spec 043 | Section « Avant de commencer » et renvoi aux prérequis E2E ; spec 043 FR-10 |
| C-45 | `.env.local.example:19` | `VITE_ENABLE_BETA_BADGE` inutilisé ; `DEEPGRAM_PROJECT_ID` absent | Reporté à la spec 009 (V2-REL-03) | Toujours présent ; inscrit (spec 009, V2-FR-05) |
| C-46 | `.github/workflows/quality-gate.yml:115` | Planchers affichés 75/60/75 au lieu de 90/80/90/90 | Reporté à la spec 043 (V2-QA-10) | Toujours présent ; inscrit (spec 043, C3) |
| C-47 | `src/features/game-setup/setupPresentation.ts:109` | « ne commence qu'après une ouverture valide » | Déjà corrigé (`ebb5969`, spec 046) | Le texte décrit désormais une règle appliquée |
| C-48 | `components/match/MatchSettingsModal.tsx:89` | « Assistance vocale IA » | Reporté à la spec 013 (V2-GAMES-10), décision Q5 | Toujours présent (`MatchSettingsModal.tsx:94`, `views/SettingsView.tsx:59`) ; inscrit (spec 013, C14) |
| C-49 | `components/ui/ChangelogModal.tsx:29` | v2.0.0 datée du 19/11/2026 sans être publiée | Déjà corrigé (`af63834`) | Entrée v2.1.0 du 23/11/2026, version publiée (tag et GitHub Release) |
| C-50 | `specs/030-counter-external-match-link/tasks.md:21-23` | Tâche « configurer les origines » faite de fait | Déjà corrigé (`c64b9cb`) | T001 cochée |
| C-51 | Site vitrine (hors dépôt) | « annonce vocale des scores » | Reporté (hors dépôt, décision Q4) | Confirmé le 2026-11-23 sur `https://bougnatdarts.fr/scoring/` (description et JSON-LD) ; à corriger dans le dépôt du site ; la promesse revient avec le caller vocal (spec 077) |
| C-52 | `.github/workflows/issue-auto-label.yml` (`zoneMap`) | Table figée : « 501 Double Out » et « Historique » obsolètes, zones récentes non étiquetées ; libellés non accentués imposés aux formulaires | Reporté à la spec 113 (V2-CICD-01) | Relevé pendant la revérification ; inscrit (spec 113, §4) |
| C-53 | `docs/technical.md:7`, `docs/product-scope.md:3`, `AGENTS.md:14`, `specs/README.md:15` | 2.1.0 dite « non publiée » alors que le tag et la GitHub Release sont publiés (`docs/release/v2.1.0.md`) | Corrigé dans cette PR pour `technical.md` et `product-scope.md` ; reporté aux specs 036 (`AGENTS.md`) et 032 (`specs/README.md`), fichiers réservés | Relevé pendant la revérification |

Décompte : **28 déjà corrigés**, **18 corrigés dans cette PR** (dont C-27, traité par la décision Q1 sans modification), **7 reportés** (C-40, C-42, C-45, C-46, C-48, C-51, C-52). Reports partiels d'items corrigés : C-37 (009), C-39 (035), C-44 (043), C-53 (036, 032).

Hors périmètre de cette PR par coordination : confidentialité de la voix (spec 080), commandes de « Vérification minimale » de `CONTRIBUTING.md` (spec 043), règles agents et maintenance (spec 036), sécurité et rotation des secrets (spec 118).

## Implémentation
- [x] T001 Relire en revue chaque ligne « PR docs/v2-specs » et cocher sa conformité (AC-01 à AC-06)
- [x] T002 Corriger C-17 et C-22 dans `docs/release/v2.0.0.md` (AC-04, AC-05)
- [x] T003 Ajouter les bandeaux historiques C-31, C-32 (AC-08)
- [x] T004 Compléter `docs/technical.md` : C-35, C-36, C-37 (AC-02)
- [x] T005 Ajouter les renvois Killer/Gotcha de C-38 dans `docs/specifications.md` (AC-03)
- [x] T006 Mettre à jour `CONTRIBUTING.md` (C-44)
- [x] T007 Appliquer C-27, C-43, C-51 selon les décisions Q1, Q2, Q4 (C-51 hors dépôt : signalé)
- [x] T008 Inscrire chaque ligne « Reporté » dans la spec propriétaire (AC-07) ; C-53 (036, 032) signalé dans la PR, fichiers réservés à d'autres chantiers

## Tests
- [x] T009 Exécuter les `grep` des AC-01, AC-02, AC-06 et joindre la sortie à la PR

## Documentation et clôture
- [ ] T010 Relecture du `README.md` par le product owner (AC-08)
- [x] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit` (l'issue #207 reste ouverte jusqu'à la relecture T010)
