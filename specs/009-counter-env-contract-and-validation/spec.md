---
id: 009-counter-env-contract-and-validation
v2_id: V2-REL-03
type: fonctionnel
statut: en-cours
validation: en-attente
statut_reel: "Partielle."
traitement_propose: "Finaliser (Révision V2)."
decision_traitement: a-valider
issue: '#285'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 009 - counter env contract and validation

## Meta

- ID: `009-counter-env-contract-and-validation`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Definir un contrat d environnement explicite et verifiable par cible (`dev`, `preprod`, `production`) pour reduire les incidents de configuration.

## Decisions

- distinguer variables requises, optionnelles et deprecation
- valider en amont des promotions les variables critiques
- afficher des erreurs actionnables avec contexte cible
- eviter la duplication incoherente des contrats env entre scripts/workflows/docs

## Invariants critiques

- aucune cle privee exposee cote client
- aucune variable obsolete requise par erreur
- fallback explicite sur les options non critiques

## Impacted Code

- `src/lib/env.ts`
- `scripts/deployment-check.mjs`
- `.env.local.example`
- `README.md`

## Canonical Entry Points

- `deployment-check.mjs`
- `readPublic` / `env` mapping

## Key Tests

- `npm run env:check`
- `npm run preprod:check`
- `npm run production:check`

## Validation

- contrat env unique et coherent dans doc + scripts
- aucun warning ambigu sur variables critiques

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 (V2-REL-03) ; aucune exigence ci-dessous n'est validée. Le contenu historique ci-dessus est conservé tel quel.

### Constats vérifiés (code au commit `508dfa6`)

- [vérifié] Le contrat runtime compte 9 variables publiques (`src/lib/env.ts:1-50`) ; seule `VITE_APP_URL` émet un avertissement si absente (`env.ts:24-32,44`).
- [vérifié] **Quatre** contrôles coexistent avec des listes différentes :
  - `package.json:23` (`env:check`) ne vérifie que la présence de `VITE_APP_URL=` dans `.env.local.example` ;
  - `scripts/deployment-check.mjs:26-36` lit les variables GitHub (workflows `promote-*`, `validate-environments`) ; `VITE_APP_VERSION` y est « optionnelle » (l.124) ; `VITE_APP_ACCESS_MODE` et `VITE_LOG_LEVEL` ne sont pas contrôlées ;
  - `scripts/validate-pages-build-env.mjs:16-56` ne s'exécute que sur Cloudflare Pages (`CF_PAGES=1`) et contrôle `VITE_APP_ENV`, `VITE_APP_URL`, `VITE_CF_WEB_ANALYTICS_TOKEN` et les origines partenaires ;
  - `scripts/validate-wrangler-config.mjs:11-20` exige 8 clés dans `wrangler.jsonc`, sans `VITE_APP_VERSION` ni `VITE_CF_WEB_ANALYTICS_TOKEN`.
- [vérifié] Deux sources de vérité : les variables d'environnement GitHub (builds de contrôle) et `wrangler.jsonc` (build réellement servi par Pages, `scripts/deployment-check.mjs:38-39`). Leur cohérence n'est comparée que pour les origines partenaires (`deployment-check.mjs:89-98`).
- [vérifié] `VITE_APP_VERSION` est absente de `wrangler.jsonc:10-19,22-31` ; elle nomme le cache du service worker (`index.tsx:46`, `sw.js:1-2`) → risque de valeur `dev` en production [à confirmer : tableau de bord Cloudflare]. Deux notions de version coexistent : `__APP_SEMVER__` (`vite.config.ts:9-18`, affichée par `views/HomeView.tsx:53`) et `VITE_APP_VERSION`.
- [vérifié] `VITE_CF_WEB_ANALYTICS_TOKEN` est exigée par Pages (`validate-pages-build-env.mjs:41-43`) mais absente de `wrangler.jsonc` → définie hors dépôt [à confirmer].
- [vérifié] `VITE_APP_URL` de preview vaut une URL de déploiement précise (`wrangler.jsonc:27`, `https://ccdc74ab.bougnat-darts-counter.pages.dev`) ; elle alimente l'allowlist d'origine du token voix (`functions/api/deepgram/token.ts:110-114`), le QR généré (`scripts/generate-app-qr.mjs:32`) et le partage (`views/HomeView.tsx:41`) [à confirmer : alias stable ou URL figée].
- [vérifié] `.env.local.example:19` déclare `VITE_ENABLE_BETA_BADGE` (aucun usage dans le code) et omet `DEEPGRAM_PROJECT_ID` (lu par `vite.config.ts:54`).
- [vérifié] Tests : seul `tests/unit/tooling/externalReturnOrigins.test.ts` exécute `deployment-check.mjs` (cas spec 030) ; `validate-pages-build-env.mjs` et `validate-wrangler-config.mjs` ne sont pas testés.
- [vérifié] Tâches 009 : 2/4 cochées ; matrice par cible et tests de non-régression ouverts (`tasks.md:5-6`).

### Écarts avec la spec

- « Éviter la duplication incohérente des contrats env » : quatre listes divergentes, deux sources de vérité.
- « Distinguer variables requises, optionnelles et dépréciées » : aucune déclaration unique de ce statut.
- « Aucune variable obsolète » : `VITE_ENABLE_BETA_BADGE` subsiste dans l'exemple.

### Exigences proposées

- V2-FR-01 Un registre unique des variables (`scripts/lib/envContract.mjs`) : nom, portée (public `VITE_*` / serveur), statut (requise / optionnelle / dépréciée) par cible (`local`, `ci`, `preprod`, `production`), source (`wrangler.jsonc`, tableau de bord, secret GitHub), règle de validation.
- V2-FR-02 Les quatre contrôles (`env:check`, `deployment-check`, `validate-pages-build-env`, `validate-wrangler-config`) consomment ce registre ; aucune liste codée en dur ailleurs.
- V2-FR-03 Tout build Cloudflare Pages a un identifiant de build non `dev` (exigé, ou dérivé de `CF_PAGES_COMMIT_SHA`) — prérequis de V2-REL-02 (031).
- V2-FR-04 La documentation de la matrice par cible est générée ou vérifiée depuis le registre (tâche historique « matrice env »).
- V2-FR-05 `.env.local.example` aligné : retrait de `VITE_ENABLE_BETA_BADGE`, ajout commenté de `DEEPGRAM_PROJECT_ID`.
- V2-FR-06 `deployment-check` signale tout écart entre variables GitHub et `wrangler.jsonc` pour chaque clé déclarée dans les deux.
- V2-NFR-01 Aucun secret dans un `VITE_*` (règle existante `deployment-check.mjs:52-68` conservée) ; aucun coût, aucune dépendance.

### Critères d'acceptation

- V2-AC-01 Retirer une variable requise du registre ou de `wrangler.jsonc` fait échouer le contrôle concerné avec un message citant la cible.
- V2-AC-02 Un build simulé `CF_PAGES=1` sans identifiant de build valide échoue (ou produit un identifiant dérivé du commit, selon Q1).
- V2-AC-03 Tests unitaires couvrant `validate-pages-build-env.mjs`, `validate-wrangler-config.mjs` et `deployment-check.mjs` (cas requis/optionnel/déprécié, preprod/production).
- V2-AC-04 `.env.local.example` ne contient que des variables du registre.
- V2-AC-05 La matrice documentée correspond au registre (test ou script de comparaison).

### Questions ouvertes

| # | Question | Options | Recommandation |
|---|---|---|---|
| Q1 | Identifiant de build sur Pages | Variable obligatoire / dérivée de `CF_PAGES_COMMIT_SHA` dans `vite.config.ts` | Dérivée du commit (aucune saisie manuelle), version sémantique conservée pour l'affichage |
| Q2 | Source de vérité des variables publiques | `wrangler.jsonc` seul / GitHub + wrangler | `wrangler.jsonc` pour le public ; GitHub seulement pour les secrets et les builds de contrôle |
| Q3 | URL de preview | URL de déploiement figée / alias de branche `preprod` | Alias de branche [à confirmer côté Cloudflare] |
| Q4 | Jeton analytics | Dans `wrangler.jsonc` (public) / tableau de bord | Le documenter dans le registre avec sa source réelle ; décision liée à H.27 (mesure d'adoption) |

### Dépendances

Aucune bloquante. Liens : V2-REL-02 (031, identifiant de build), V2-DOC-01 (034, C-37 et C-45), V2-QA-10 (043, exécution des contrôles en CI), V2-VOICE-10 (006, allowlist d'origine du token).
