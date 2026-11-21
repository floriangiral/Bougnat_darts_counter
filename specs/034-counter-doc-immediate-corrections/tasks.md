# Tâches — 034 Corrections documentaires immédiates

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre. Statuts du tableau : **PR docs/v2-specs** = correction appliquée par anticipation dans la PR de rédaction des specs V2 (autorisée par le product owner, à vérifier en revue) ; **À faire** = correction documentaire restant à réaliser ici ; **Rattaché** = écart hors documentation, porté par la spec indiquée.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et relire la PR `docs/v2-specs`

## Inventaire exhaustif (lignes au commit `508dfa6`)

| # | Chemin:ligne | Écart | Statut |
|---|---|---|---|
| C-01 | `README.md:22` | Reprise promise pour toute partie (X01 seulement) | PR docs/v2-specs |
| C-02 | `README.md:30` | « l'ouverture » réglable (jamais appliquée) | PR docs/v2-specs |
| C-03 | `README.md:21,60` | « écran de comptoir… tout le monde suit » (aucun mode TV) | PR docs/v2-specs |
| C-04 | `docs/specifications.md:20,243` | Reprise de session tous jeux | PR docs/v2-specs |
| C-05 | `docs/specifications.md:21,236,245` | Historique local présenté comme disponible | PR docs/v2-specs |
| C-06 | `docs/specifications.md:80` | « open / double / master in » | PR docs/v2-specs |
| C-07 | `docs/specifications.md:68` | « 501 Double Out » listé comme mode | PR docs/v2-specs |
| C-08 | `docs/product-scope.md:10-11` | Reprise et historique locaux | PR docs/v2-specs |
| C-09 | `docs/product-scope.md:28` | « mode bot IA » | PR docs/v2-specs |
| C-10 | `docs/technical.md:12` | « 501 Double Out » listé comme jeu | PR docs/v2-specs |
| C-11 | `docs/integration/external-match-link.md:46` | `in` accepté sans effet | PR docs/v2-specs |
| C-12 | `docs/architecture.md:36` | Reprise de session | PR docs/v2-specs |
| C-13 | `docs/architecture.md:60-65` | `CONNECTED_MODE` inexistant | PR docs/v2-specs |
| C-14 | `docs/architecture.md:69-101,112-118` | Arbre faux, règle de dépendance violée non signalée | PR docs/v2-specs |
| C-15 | `docs/release/v2.0.0.md:9` | Lien « désactivé » alors que badarts.fr est déclaré (contradiction 030) | PR docs/v2-specs |
| C-16 | `docs/product-scope.md:41`, `docs/architecture.md:158,172` | Idem (contradiction 030) | PR docs/v2-specs |
| C-17 | `docs/release/v2.0.0.md:70` | Manifeste dit non livré (il l'est, haché) ; `/sw.js` absent | À faire |
| C-18 | `specs/028-counter-smartphone-display/spec.md:14,30-31` | « Landscape never blocked » vs portrait imposé (contradiction 028) | PR docs/v2-specs (signalement) ; arbitrage Rattaché V2-TAB-06 (028) |
| C-19 | `specs/README.md:142` | 727 tests vs 746 (`docs/release/v2.0.0.md:87`) | PR docs/v2-specs |
| C-20 | `docs/technical.md:132` | « 61 tests E2E passent » vs suite non exécutée | PR docs/v2-specs |
| C-21 | `docs/technical.md:333-336` | Chiffres du 3 novembre (398 tests) non datés comme historiques | PR docs/v2-specs |
| C-22 | `docs/release/v2.0.0.md:100` | 28 scénarios E2E annoncés vs 29 comptés statiquement | À faire (recompter avec V2-REL-01) |
| C-23 | `docs/technical.md:187,218` | Liens absolus `/home/...` | PR docs/v2-specs |
| C-24 | `.specify/memory/constitution.md:4` | Lien absolu local | PR docs/v2-specs |
| C-25 | `.github/ISSUE_TEMPLATE/bug_report.yml:21-33,113` | Zones sans Killer/Gotcha/lien/tablette ; placeholder `v1.0.1` | PR docs/v2-specs |
| C-26 | `.github/ISSUE_TEMPLATE/improvement.yml:20-32` | Idem | PR docs/v2-specs |
| C-27 | `.github/ISSUE_TEMPLATE/config.yml:3-5` | Lien WhatsApp public | À faire après Q1 |
| C-28 | `AGENTS.md` (absent) | Aucune instruction pour agents IA | PR docs/v2-specs (contenu : V2-DOC-03, 036) |
| C-29 | `docs/adr/` (absent) | Aucun ADR | PR docs/v2-specs (initialisation ; suite : V2-DOC-02, 035) |
| C-30 | `docs/release/v1.1.md:3`, `v1.1.1…v1.1.5.md:3` (+ coverage maps) | « La version active est v2.0.0 » | PR docs/v2-specs |
| C-31 | `docs/release/v1.0.0.md:5`, `v1.0.1.md:5`, `v1.0.2.md:5` | « stable » sans bandeau historique | À faire |
| C-32 | `docs/release/react-19-validation-matrix.md:5` | React 19.2.0 (actuel 19.3.1), sans bandeau | À faire |
| C-33 | `docs/technical.md:7` | Branche `release/v2.0.0` vs `feat/v2.0.0` | PR docs/v2-specs |
| C-34 | `docs/technical.md:167` | « socle Node 24 » vs `.nvmrc` 26.13.1 | PR docs/v2-specs |
| C-35 | `docs/technical.md:393-412` | Index sans `v1.0.0`, `v1.0.2-coverage-map`, matrice React 19 | À faire |
| C-36 | `docs/technical.md` (section Playwright) | Prérequis E2E (WebKit, `https://partner.example`), Docker de dev, navigateurs non documentés | À faire |
| C-37 | `docs/technical.md:187` | `VITE_APP_*` dits déclarés dans `wrangler.jsonc` ; `VITE_APP_VERSION` absent | À faire (avec V2-REL-03, 009) |
| C-38 | `docs/specifications.md:166` (§5.bis) et §4 | 13 slugs sur 29 ; aucune règle Killer/Gotcha | À faire (renvoi specs 017/019) |
| C-39 | `docs/architecture/scoring-access-modes.md:5` | Renvoie à `specifications.md` qui ne traite pas le sujet | Rattaché V2-ARCH-12 (001), V2-DOC-02 (035) |
| C-40 | `docs/audit-security-hosting-performance-2026-04-24.md`, `docs/architecture/*.md` | Pas de bandeau historique | Rattaché V2-DOC-02 (035) |
| C-41 | `specs/README.md:112,152` | « release active v2.0.0 », slug fantôme, 027/028 absents | Rattaché V2-SDD-01 (032) |
| C-42 | `tests/e2e/completion.smoke.spec.ts:1` | Slug `smoke-e2e-per-game-navigation` inexistant | Rattaché V2-SDD-02 (032), V2-QA-04 (040) |
| C-43 | `SECURITY.md:15` | Domaine `.net` vs `.fr` | À faire après Q2 |
| C-44 | `CONTRIBUTING.md:35-48` | `guard:clean`, prérequis E2E, renvoi `AGENTS.md` absents | À faire |
| C-45 | `.env.local.example:19` | `VITE_ENABLE_BETA_BADGE` inutilisé ; `DEEPGRAM_PROJECT_ID` absent | Rattaché V2-REL-03 (009) |
| C-46 | `.github/workflows/quality-gate.yml:115` | Planchers affichés 75/60/75 au lieu de 90/80/90/90 | Rattaché V2-QA-10 (043) |
| C-47 | `src/features/game-setup/setupPresentation.ts:109` | « ne commence qu'après une ouverture valide » | Rattaché V2-GAMES-02 (046) |
| C-48 | `components/match/MatchSettingsModal.tsx:89` | « Assistance vocale IA » | Rattaché V2-GAMES-10 (013) après Q5 |
| C-49 | `components/ui/ChangelogModal.tsx:29` | v2.0.0 datée du 19/11/2026 sans être publiée | Rattaché V2-REL-01 (033), V2-DOC-06 (038) |
| C-50 | `specs/030-counter-external-match-link/tasks.md:21-23` | Tâche « configurer les origines » faite de fait | Rattaché V2-INT-01 (030) |
| C-51 | Site vitrine (hors dépôt) [à confirmer] | « annonce vocale des scores » | À faire après Q4 |

## Implémentation
- [ ] T001 Relire en revue chaque ligne « PR docs/v2-specs » et cocher sa conformité (AC-01 à AC-06)
- [ ] T002 Corriger C-17 et C-22 dans `docs/release/v2.0.0.md` (AC-04, AC-05)
- [ ] T003 Ajouter les bandeaux historiques C-31, C-32 (AC-08)
- [ ] T004 Compléter `docs/technical.md` : C-35, C-36, C-37 (AC-02)
- [ ] T005 Ajouter les renvois Killer/Gotcha de C-38 dans `docs/specifications.md` (AC-03)
- [ ] T006 Mettre à jour `CONTRIBUTING.md` (C-44)
- [ ] T007 Appliquer C-27, C-43, C-51 selon les décisions Q1, Q2, Q4
- [ ] T008 Inscrire chaque ligne « Rattaché » dans la spec propriétaire (AC-07)

## Tests
- [ ] T009 Exécuter les `grep` des AC-01, AC-02, AC-06 et joindre la sortie à la PR

## Documentation et clôture
- [ ] T010 Relecture du `README.md` par le product owner (AC-08)
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
