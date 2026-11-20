---
id: 008-counter-e2e-runtime-reliability
v2_id: V2-QA-08
type: fonctionnel
statut: en-cours
validation: en-attente
statut_reel: "Partielle : E2E locaux non autonomes."
traitement_propose: "Finaliser (Révision V2)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 008 - counter e2e runtime reliability

## Meta

- ID: `008-counter-e2e-runtime-reliability`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#to-create`

## Objectif

Rendre les smoke e2e fiables entre local et CI en eliminant les causes frequentes de flakiness runtime (serveur non demarre, parallellisme instable, environnement incomplet).

## Decisions

- execution e2e locale stable priorisee sur la vitesse
- preconditions explicites: build, preview server, base URL joignable
- artifacts de debug conserves en cas d echec
- parite de comportement local/CI documentee

## Invariants critiques

- les scenarios critiques gameplay restent couverts
- pas de couplage aux services backend metier
- tests reproductibles sur runner standard

## Impacted Code

- `playwright.config.ts`
- `scripts/run-playwright.sh`
- `.github/workflows/reusable-integration-smoke.yml`
- `.github/workflows/e2e.yml`

## Canonical Entry Points

- commande `npm run test:e2e`
- workflow `Reusable Integration Smoke`

## Key Tests

- `npm run test:e2e`
- echec volontaire sans preview pour verifier message d erreur

## Validation

- 100% pass sur scenarios smoke cibles en local stable
- execution CI reproductible sans erreur environnementale recurrente

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 (V2-QA-08) ; aucune exigence ci-dessous n'est validée. Le contenu historique ci-dessus est conservé tel quel.

### Constats vérifiés (code, commit 508dfa6)

- `npm run test:e2e` → `scripts/run-playwright.sh` ne construit pas l'application : il sert le `dist/` existant via `vite preview` (`scripts/run-playwright.sh:75-91`). Le résultat dépend donc d'un build antérieur et de ses variables.
- Le build local lit `.env.local`, restauré depuis `.env.local.example` (`scripts/ensure-local-env.mjs:10-25`) où `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=` est vide (`.env.local.example:27`). La CI injecte `https://partner.example` (`.github/actions/run-local-smoke/action.yml:38`) ; en local, les scénarios du lien externe (`tests/e2e/external-match-link.smoke.spec.ts:2`) échouent faute d'origine.
- Le dernier run local conservé (`test-results/.last-run.json`, 20/11) est en échec ; selon le rapport 10 (C9), 25 échecs viennent de l'origine partenaire absente et 39 de WebKit non installé [vérifié sur artefact ; auteur du run inconnu].
- La procédure locale documentée (`docs/technical.md:275-282`) lance `vite preview` dans un terminal puis `npm run test:e2e`, qui en démarre un second sur le même port faute de `PLAYWRIGHT_EXTERNAL_SERVER` (`run-playwright.sh:75-78`) ; `vite preview` n'a pas `--strictPort`. Le même double démarrage existe en CI (rapport 10, C4 ; traité par V2-QA-10, spec 043).
- L'installation des navigateurs (`npm exec -- playwright install chromium webkit`) n'est mentionnée que dans la section « Versions Playwright » (`docs/technical.md:165`), pas dans la procédure de smoke ; l'origine partenaire de test n'est documentée nulle part pour un usage local.
- Le journal du serveur est écrit dans `/tmp/bougnat-playwright-preview.log` (`run-playwright.sh:82`), hors du dossier de rapports.
- Docker : le profil Compose `e2e` cible le serveur de **développement** avec `.env.local` (`compose.yml:13-14, 26`) et l'image ne lance que les projets tablette (`docker/playwright.Dockerfile:7`) : ce n'est ni le build testé en CI, ni la suite complète.
- `playwright.config.ts` n'utilise pas l'option native `webServer` ; `retries: 0` et `workers: 1` en local (`playwright.config.ts:7-8`).
- Tâches historiques : 1 sur 4 cochée (`specs/008-…/tasks.md`).

### Écarts avec la spec

| Exigence historique | Constat |
|---|---|
| « préconditions explicites : build, preview server, base URL joignable » | Build non vérifié ni produit ; aucune vérification des navigateurs ni des variables d'E2E |
| « parité de comportement local/CI documentée » | Variables E2E différentes (origine partenaire) ; double serveur non documenté |
| « 100 % pass sur scénarios smoke cibles en local stable » | Dernier run local : 64 échecs environnementaux |
| « tests reproductibles sur runner standard » | Vrai en CI ; faux en local et en Docker |

### Exigences proposées

- V2-FR-01 `npm run test:e2e` est autonome depuis un clone propre : il construit l'application avec un environnement E2E versionné et non secret (origine partenaire de test `https://partner.example`, voix désactivée, mode `local`), dans un dossier distinct du `dist/` de production (proposé : `dist-e2e/`).
- V2-FR-02 Le serveur est géré par l'option `webServer` de Playwright (un seul serveur, port strict, réutilisation d'un serveur existant en local seulement) ; `run-playwright.sh` ne conserve que l'amorçage des bibliothèques Linux.
- V2-FR-03 Une vérification préalable signale en moins de 10 s tout navigateur manquant pour les projets demandés, avec la commande exacte d'installation.
- V2-FR-04 L'origine `https://partner.example` est documentée comme origine **de test uniquement** ; elle n'apparaît jamais dans `wrangler.jsonc` (contrôlé par `wrangler:check`).
- V2-FR-05 Le profil Docker `e2e` exécute le même build E2E et toute la suite (projets paramétrables), dans l'image Playwright épinglée.
- V2-FR-06 Journaux du serveur et rapports dans le dossier du projet (`test-results/`), jamais dans `/tmp`.
- V2-FR-07 La procédure locale de `docs/technical.md` (ou du guide de test de V2-DOC-02, spec 035) est réécrite : prérequis, commande unique, diagnostic des échecs courants.
- V2-NFR-01 Depuis un clone propre : au plus 3 commandes (`npm ci`, installation des navigateurs, `npm run test:e2e`).
- V2-NFR-02 Coût : 0 € ; aucune nouvelle dépendance.

### Critères d'acceptation proposés

- V2-AC-01 Clone propre, `npm ci`, `npm exec -- playwright install chromium webkit`, `npm run test:e2e` : tous les projets passent, scénarios du lien externe compris, sans modifier `.env.local`.
- V2-AC-02 WebKit non installé : la commande échoue en moins de 10 s avec un message citant la commande d'installation.
- V2-AC-03 Un serveur déjà actif sur le port 4173 est réutilisé en local ; en CI, un port occupé provoque une erreur explicite ; jamais de second serveur sur un autre port.
- V2-AC-04 Le contenu de `dist/` (build de production) n'est pas modifié par `npm run test:e2e`.
- V2-AC-05 `docker compose --profile e2e run --rm playwright` exécute toute la suite avec succès.
- V2-AC-06 5 exécutions locales consécutives sans échec (tâche historique « Mesurer la stabilité »).

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Où vit l'environnement E2E ? | Fichier versionné `.env.e2e` / variables dans `playwright.config.ts` | `.env.e2e` versionné (lisible, réutilisé par la CI et Docker), sans aucune valeur secrète | — |
| Q2 | Build E2E systématique ou réutilisé ? | Toujours reconstruire / reconstruire si sources plus récentes | Toujours en CI ; en local, reconstruire sauf option `--no-build` explicite | — |
| Q3 | Dossier de build E2E séparé ? | `dist-e2e/` / `dist/` | `dist-e2e/` (évite de livrer par erreur un build avec origine de test) | — |
| Q4 | Docker : serveur de dev ou build ? | Dev / build | Build (identique à la CI) ; le dev reste pour le développement | — |

### Dépendances

- Aucune dépendance bloquante (catalogue).
- Coordination : V2-QA-10 (043) pour le serveur unique en CI ; V2-DOC-01 (034) et V2-DOC-02 (035) pour la documentation ; V2-QA-04 (040) et V2-QA-09 (042) en bénéficient.
- Spec 029 : toute modification de workflow exige une note de validation CI.
- Sources : `docs/v2/audit/10-docs-quality.md` (§3.4 C4, C9) ; `docs/v2/compte-rendu-audit-2026-11-20.md` (§B.2, §F.1).
