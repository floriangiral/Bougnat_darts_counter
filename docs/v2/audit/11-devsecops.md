> **Document historique — audit V2 du 2026-11-20.** Analyse figée du chantier DevSecOps ; les décisions et l'état courant sont suivis dans les specs 113 à 128 et les issues du projet « Bougnat Darts V2 ».

# Rapport 11 — Industrialisation CI/CD et DevSecOps

Agent : Architecte DevSecOps / CI-CD — préparation V2 Bougnat Darts
Date d'analyse : 20 novembre 2026 — branche `docs/v2-specs` (HEAD `2325744`) ; les workflows, actions composites et fichiers de configuration audités sont identiques au commit de référence de l'audit V2 `508dfa6` (`git diff --stat 508dfa6 HEAD` : seuls modèles d'issue/PR, `AGENTS.md`, `README.md` et `docs/technical.md` ont changé).
Mode : **lecture seule** — aucun workflow, aucune configuration d'outil, aucune dépendance, aucun réglage GitHub modifié ; uniquement des requêtes `gh api` en GET.

Légende : [vérifié] = constaté dans le code, la configuration ou l'API GitHub ; [source externe] = documentation officielle consultée le 2026-11-20 ; [à confirmer] ; [non lu].

---

## 1. Périmètre et méthode

- Demande du product owner : industrialisation CI/CD et DevSecOps (Renovate, Dependabot veille, CodeQL, Gitleaks, Vitest, Playwright, ESLint, TypeScript, OSV-Scanner, Lighthouse CI, Codecov, Knip, StrykerJS, OpenSSF Scorecard, Sentry), dépôt public, GitHub gratuit, coût ≈ 0, sans Trivy, sans offre payante. La demande vise une implémentation ; conformément au cadre V2, ce rapport produit l'**audit** et des **specs à valider**, sans rien implémenter.
- Fichiers lus : `package.json`, `package-lock.json` (versions ciblées), `.nvmrc`, scripts npm, 10 workflows et 2 actions composites de `.github/`, `.github/dependabot.yml`, `.gitleaksignore`, `sonar-project.properties`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `eslint.type-aware.config.js`, `tsconfig.json`, `scripts/*`, `wrangler.jsonc`, `public/_headers`, `docker/*`, `compose.yml`, `SECURITY.md`, `CONTRIBUTING.md`, `docs/technical.md`, `README.md`, `AGENTS.md`, specs 006, 008, 029, 031, 033, 036, 041, 042, 043, 044.
- Configuration GitHub lue (`gh api`, GET) : dépôt, `security_and_analysis`, protection de branche, rulesets, permissions Actions, secrets et variables (noms), environnements, alertes (code scanning, secret scanning, Dependabot), « default setup » CodeQL, signalement privé, exécutions récentes (`gh run list`, `gh run view`).
- Mesures en lecture seule : `tsc --noEmit` avec options strictes supplémentaires ; ESLint avec une configuration de sonde stockée hors dépôt ; `node scripts/validate-sonar-coverage.mjs`.
- **Non lu** : `.npmrc` (refusé par la politique d'exclusion de contenu de l'organisation) ; applications GitHub installées (`GET /repos/…/installation` → 401, `/user/installations` → 403 avec un jeton utilisateur) ; réglages Cloudflare Pages. La connexion réseau a été intermittente (échecs DNS) : chaque requête a été rejouée jusqu'au succès ; aucune donnée n'a été déduite d'une requête en échec.

## 2. État actuel

### 2.1 Workflows et actions

| Workflow | Déclencheurs | Contenu | Constat |
|---|---|---|---|
| `quality-gate.yml` | PR (`main`, `preprod`, `develop`, `release/**`), push `main`, lundi 06:47 UTC, manuel | `validate` (env, lint, typecheck, unit, build), `global-quality-baseline` (PR vers `main`), `sonar` | Couverture calculée deux fois ; planchers affichés faux (`:115`) ; `lint:type-aware`, `guard:clean`, `wrangler:check` absents (043) |
| `security-review.yml` | PR, push `main`/`develop`/`preprod`, lundi 06:17, manuel | Dependency Review, npm audit, Snyk, Snyk Container, CodeQL | CodeQL `javascript-typescript` seul ; suite hebdomadaire plus étroite que celle des PR (`:166`) ; Snyk dépend d'un secret et d'un quota |
| `secret-scan.yml` | PR, push `main`/`preprod`, lundi 06:11, manuel | Gitleaks v3.0.0 | `security-events: write` au niveau workflow sans usage ; commentaires et artefact par défaut |
| `e2e.yml` + `reusable-integration-smoke.yml` | PR (`main`, `preprod`, `release/**`), manuel | Smoke Playwright 7 projets | Pas de nightly ; rapport seulement en échec, sans rétention définie |
| `dependency-watch.yml` | lundi 06:43, manuel | `npm outdated` en résumé | Redondant avec un Dependency Dashboard |
| `promote-preprod.yml`, `promote-production.yml` | manuels | Build, validation Deepgram, push forcé des branches miroirs | `${{ inputs.reason }}` interpolé dans `run:` (`:112`, `:125`) ; réponse API affichée (`:90`, `:91`) ; `contents: write` au niveau workflow |
| `validate-environments.yml` | manuel | Contrat d'environnement | — |
| `issue-auto-label.yml` | issues | Étiquetage depuis les formulaires | Lecture du corps comme donnée (bon modèle) ; `issues: write` au niveau workflow |

- Toutes les actions tierces sont épinglées par SHA [vérifié] ; `concurrency` et `timeout-minutes` partout [vérifié].
- Durées mesurées (PR #203) : ≈ 615 s de runner par push (smoke 225 s, Sonar 92 s, Snyk Container 72 s, validate 66 s, CodeQL 62 s, Snyk 56 s, npm audit 25 s, Dependency Review 9 s, Gitleaks 8 s).
- **Échecs silencieux** : `Security Review` planifié en échec les lundis 2, 9 et 16 novembre (Snyk : `undici@7.30.1`, 1 critique, 5 hautes) ; aucune issue ni notification ; au même moment, 0 alerte Dependabot ouverte (sources divergentes, cause [à confirmer]).

### 2.2 Configuration GitHub (lecture du 2026-11-20)

- Dépôt public, propriétaire **compte personnel** ; `allow_auto_merge: false`, trois méthodes de fusion, `delete_branch_on_merge: false`, `allow_update_branch: false` ; licence détectée `NOASSERTION` alors que `LICENSE.md` est un texte MIT.
- Sécurité : graphe de dépendances et alertes Dependabot actifs, **mises à jour de sécurité Dependabot actives**, secret scanning et **protection des pushes actifs**, motifs non-fournisseurs et contrôles de validité inactifs, signalement privé actif, « default setup » CodeQL non configuré (langages détectés : `actions`, `javascript-typescript`). Alertes ouvertes : 0 / 0 / 0 (100 alertes Dependabot historiques corrigées).
- Ruleset `main` actif sans contournement : suppression et force push interdits ; PR obligatoire, **0 approbation**, `require_code_owner_review: true` **sans fichier CODEOWNERS** ; 8 checks requis stricts (`NPM Audit`, `Dependency Review`, `Gitleaks`, `Lint, Typecheck, Unit Tests, Build`, `smoke / Local Integration Smoke`, `SonarCloud`, `SonarCloud Code Analysis`, `Global Quality Baseline`) ; règle `code_scanning` CodeQL (alertes ≥ haute et erreurs bloquantes) ; règle `code_quality`.
- Ruleset `preprod et production` : suppression interdite, contournement permanent pour l'intégration 3200236 [identité à confirmer].
- Actions : toutes actions autorisées, épinglage SHA non obligatoire, `GITHUB_TOKEN` en lecture, approbation des PR interdite au jeton, approbation requise pour tous les contributeurs externes, rétention 90 jours.
- Secrets (noms) : `SNYK_TOKEN`, `SONAR_TOKEN` (dépôt) ; `DEEPGRAM_API_KEY`, `BRANCH_PROMOTER_APP_ID`, `BRANCH_PROMOTER_APP_PRIVATE_KEY` (environnements) — `BRANCH_PROMOTER_APP_*` n'est utilisé par aucun workflow.
- Environnements `preprod` (depuis `main`) et `Production` (depuis `preprod`) **sans approbateur**, contournement admin autorisé — contraire à `docs/technical.md:380`.
- 21 branches distantes, dont plusieurs obsolètes ; PR Dependabot de novembre (#191-#198, vers `develop`) fermées sans fusion.

### 2.3 Qualité du code et tests

- TypeScript : aucune option stricte (`tsconfig.json`) ; mesure : `--strict` → **0 erreur**, `exactOptionalPropertyTypes` → 33, `noUncheckedIndexedAccess` → 323.
- ESLint : `no-explicit-any` en erreur ; 3 règles React Hooks désactivées (réactivation mesurée : `purity` 0, `set-state-in-effect` 9, `refs` 6) ; 2 désactivations ponctuelles (`views/MatchView.tsx:164, 228`) ; 0 `@ts-ignore`.
- Vitest : 80 fichiers de tests, planchers 90/80/90/90, 17 exclusions gouvernées (029, script vert).
- Playwright : 7 fichiers, 7 projets, tout exécuté à chaque PR, `retries: 1` en CI.
- Absents : Renovate, OSV-Scanner, Lighthouse CI, Codecov, Knip, StrykerJS, Scorecard, Sentry, `CODE_OF_CONDUCT.md`, `CODEOWNERS`, `ErrorBoundary`.

## 3. Matrice des composants

| Composant | État actuel | État cible | Écart | Action nécessaire | Priorité |
|---|---|---|---|---|---|
| Architecture des workflows | 10 workflows, sans nightly ni notification | Catalogue ≤ 8 workflows, matrice de fréquences, notifications | Redondances, échecs silencieux | Spec 113 | P0 |
| Quality gate | 8 checks requis, job conditionnel compté « réussi » | Agrégateurs vérifiant les jobs attendus | Skipped/absent non détecté | Spec 114 | P0 |
| Auto-merge | Désactivé | Natif, éligibilité vérifiée (auteur, fichiers, semver) | Total | Spec 114, 115 | P0 |
| Renovate | Absent | Seul générateur de PR de dépendances | Total | Spec 116 (+ installation manuelle) | P1 |
| Dependabot | Version updates (`develop`) + security updates (`main`) + alertes | Alertes seules | Doublons de mécanismes | Spec 116 (suppression `dependabot.yml`, désactivation security updates) | P1 |
| CodeQL | JS/TS, PR + push + hebdo, bloquant par ruleset | + langage `actions`, suites cohérentes, faux positifs documentés | Workflows non analysés | Spec 117 | P1 |
| Gitleaks | PR, push, hebdo ; sorties non masquées | Historique complet hebdo, sorties masquées, exceptions justifiées | Exposition possible dans commentaires/artefacts | Spec 118 | P0 |
| Secret scanning / push protection | Actifs | Actifs + motifs supplémentaires si disponibles | Faible | Spec 118 (manuel) | P1 |
| Rotation des secrets | Aucun runbook | Runbook par secret, exercice à blanc | Total | Spec 118 (+ 006) | P0 |
| OSV-Scanner | Absent | PR (nouvelles vulnérabilités) + nocturne SARIF + exceptions datées | Total | Spec 117 | P1 |
| Snyk | Dépendances + conteneur, secret, quota 200/100 tests/mois | Retiré après comparaison (décision) | Redondant | Spec 117 Q1 | P1 |
| npm audit | Requis | Remplacé par OSV ; `npm audit signatures` | Redondant | Spec 117 Q2 | P2 |
| Dependency Review | PR, ≥ haute | Conservé (+ licences en avertissement) | Faible | Spec 117 | P2 |
| Vitest | 80 fichiers, planchers stricts, couverture ×2 | Couverture unique partagée, JUnit | Duplication | Spec 113 (+ 043) | P1 |
| Playwright | Toute la suite à chaque PR | Critique par PR, complet nightly + PR Renovate éligibles | Pas de niveaux, pas de nightly | Spec 113, 114, 042 | P1 |
| ESLint | Standard en CI ; type-aware hors CI | Type-aware bloquant ; règles Hooks réactivées ; cliquet | Moyen | Spec 043, 124 | P1 |
| TypeScript | Non strict (mais conforme) | `strict` + options à 0 erreur ; trajectoire | Verrouillage absent | Spec 124 | P1 |
| SonarCloud | Gate nouveau code, requis, échoue sur forks | Conservé (juge du nouveau code) | Forks | Spec 043, 120 | P2 |
| Codecov | Absent | Informatif, OIDC, composants métier | Total (recouvre Sonar) | Spec 120 (option) | P2 |
| Knip | Absent | Hebdomadaire, nettoyage par PR dédiées | Total | Spec 121 | P2 |
| StrykerJS | Absent | Pilote hebdomadaire sur moteurs | Total | Étude 122 | P3 |
| Lighthouse CI | Absent | PR, baseline, budgets partagés avec 044 | Total | Spec 123 (+ 044) | P2 |
| OpenSSF Scorecard | Absent | Hebdomadaire, SARIF, plan d'amélioration | Total | Spec 119 | P2 |
| Sentry | Absent ; aucune gestion globale d'erreur | Étude RGPD/CSP ; `ErrorBoundary` d'abord | Total | Étude 125 | P2 |
| Paramètres du dépôt | Merge/rebase/squash, pas d'auto-merge, branches non supprimées | Squash, auto-merge, suppression, mise à jour de branche | Moyen | Spec 115 (manuel) | P0 |
| Permissions Actions | Toutes actions autorisées, SHA non obligatoire, écritures au niveau workflow | Actions sélectionnées, SHA obligatoire, écritures par job | Moyen | Spec 113, 115 | P0 |
| Environnements | Sans approbateur ; secrets inutilisés | Approbation production ; secrets minimaux | Moyen | Spec 115 (manuel) | P0 |
| Promotions | Injection d'entrée, réponse API affichée | Variables d'environnement, sorties sobres | Faible à moyen | Spec 115, 118 | P0 |
| Reporting | Résumés épars | Issue épinglée hebdomadaire, alerte unique | Total | Spec 127 | P2 |
| Agents IA | `AGENTS.md` sans volet CI | Matrice, interdits, entrées structurées | Moyen | Spec 126 (+ 036) | P1 |
| Documentation | Inexacte sur Snyk/checks/environnements ; non accentuée | Exacte, accentuée, runbooks, CoC | Moyen | Spec 128 | P1 |

## 4. Éligibilité gratuite des outils (sources consultées le 2026-11-20)

| Outil | Verdict pour ce dépôt | Source |
|---|---|---|
| GitHub Actions | Runners standard gratuits pour un dépôt public ; 20 jobs simultanés (Free) | https://docs.github.com/en/billing/concepts/product-billing/github-actions ; https://docs.github.com/en/actions/reference/limits |
| CodeQL / code scanning | Gratuit pour les dépôts publics (licence pour le privé) | https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning |
| Secret scanning, push protection | Disponibles pour les dépôts publics ; protection « utilisateur » active par défaut vers les dépôts publics | https://docs.github.com/en/code-security/concepts/secret-security/push-protection |
| Dependabot alerts | Disponibles pour les dépôts de comptes personnels et d'organisations | https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts |
| Rulesets | Disponibles pour les dépôts publics en GitHub Free | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets |
| Merge queue | **Non disponible** : réservée aux dépôts publics d'organisation | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue |
| Auto-merge natif | Disponible ; fusion après revues et checks requis | https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request |
| Renovate (Mend Community Cloud) | Gratuit ; 1 tâche concurrente, planification toutes les 4 h ; offre OSS sur demande (licence OSI) | https://docs.renovatebot.com/mend-hosted/overview/ ; options : https://docs.renovatebot.com/configuration-options/ (lu via la source `renovatebot/renovate`, `docs/usage/configuration-options.md`) |
| OSV-Scanner (action) | Gratuit ; workflow PR « nouvelles vulnérabilités » et scan planifié avec SARIF | https://google.github.io/osv-scanner/github-action/ |
| Gitleaks (action) | Licence propriétaire depuis v2 ; **gratuite sans clé pour un compte personnel** ; clé gratuite requise pour une organisation | https://github.com/gitleaks/gitleaks-action (README) |
| OpenSSF Scorecard | Gratuit ; `id-token: write` pour `publish_results` ; PAT seulement pour la protection de branche classique | https://github.com/ossf/scorecard-action (README) |
| Codecov | Offre « Developer » gratuite : dépôts publics, envois illimités ; OIDC possible ; envoi sans jeton pour les PR de forks | https://about.codecov.io/pricing/ ; https://github.com/codecov/codecov-action (README) |
| Lighthouse CI | Gratuit ; stockage public temporaire optionnel, sinon artefacts | https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md |
| Knip | Gratuit, open source | https://knip.dev |
| StrykerJS (lanceur Vitest) | Gratuit ; analyse « perTest » imposée, mode navigateur non pris en charge ; compatibilité Vitest 5 [à confirmer] | https://github.com/stryker-mutator/stryker-js/blob/master/docs/vitest-runner.md |
| Sentry | Offre « Developer » 0 $ : 1 utilisateur, 5 000 erreurs, rétention 30 jours ; région UE (Francfort) disponible ; nettoyage des données à configurer | https://sentry.io/pricing/ ; https://docs.sentry.io/organization/data-storage-location/ ; https://docs.sentry.io/platforms/javascript/guides/react/data-management/sensitive-data/ |
| Snyk (existant) | Gratuit limité : 200 tests Open Source, 100 tests Container par mois | https://snyk.io/plans/ |

## 5. Redondances, conflits et manques

- **Conflit Dependabot version updates ↔ Renovate** : deux générateurs de PR ; la demande impose Renovate seul → suppression de `.github/dependabot.yml` et désactivation des mises à jour de sécurité Dependabot **après** preuve du relais Renovate (116).
- **Vulnérabilités de dépendances** : Dependency Review, `npm audit`, Snyk, alertes Dependabot, et demain OSV-Scanner → cinq sources. Proposition : OSV (PR + nocturne) + Dependency Review + alertes Dependabot ; retrait de Snyk et de `npm audit` (vulnérabilités) après 4 semaines de comparaison (117 Q1, Q2). Les divergences observées (Snyk rouge, Dependabot à 0) justifient la période de comparaison.
- **Couverture** : Sonar (gate nouveau code) et Codecov (demandé) se recouvrent. Proposition : Sonar reste juge, Codecov informatif trois mois (120 Q1). Exclusions : source unique (029).
- **Lighthouse ↔ 044 ↔ 041** : budgets de poids uniques (044), chargement par Lighthouse (123), accessibilité par écran par axe (041).
- **Snyk Container** analyse une image de développement non déployée : valeur faible.
- **Manques** : notification des échecs planifiés ; nightly ; niveaux Playwright ; agrégation des checks ; langage CodeQL `actions` ; exceptions datées ; runbooks ; mode strict TypeScript ; reporting ; gouvernance des agents dans la CI.
- **Mauvaises pratiques** : écritures au niveau workflow ; interpolation d'entrée dans `run:` ; affichage de réponses d'API ; exigence de revue des propriétaires sans `CODEOWNERS` ; secrets inutilisés ; documentation affirmant des contrôles non requis.

## 6. Risques principaux

| Risque | Impact | Probabilité | Réponse |
|---|---|---|---|
| Échec de sécurité planifié non vu (déjà arrivé) | Élevé | Élevée | 043 DSO-FR-01, 113 FR-11, 127 |
| Auto-merge d'une mise à jour cassant un comportement non testé | Élevé | Moyenne | Maturité 7 jours, E2E complet, éligibilité vérifiée, golden tests (039) |
| Blocage de `main` par un check requis jamais publié | Élevé | Moyenne | Migration en deux temps, exports JSON (113, 115) |
| Fuite de la clé Deepgram (coût) | Élevé | Faible | 118 runbook, 006 protection budgétaire |
| Application tierce (Renovate) avec droits d'écriture | Moyen | Faible | Dépôt unique, ruleset sans contournement |
| Injection de prompt via contenus tiers lus par des agents | Élevé | Moyenne | 126 RM-03, entrées structurées |
| Données personnelles dans un outil d'erreurs | Élevé | Moyenne sans nettoyage | 125 (étude, nettoyage testé, région UE) |
| Dérive de la documentation | Moyen | Élevée | 128, contrôle de liens |

## 7. Découpage proposé (specs à valider)

| n | ID V2 | Titre | Type | Prio | Diff | Lot |
|---|---|---|---|---|---|---|
| 113 | V2-CICD-01 | Architecture des workflows et fréquences | fonctionnel | P0 | M | 1 |
| 114 | V2-CICD-02 | Quality gate agrégé et auto-merge vérifiable | fonctionnel | P0 | M | 1 |
| 115 | V2-SEC-01 | Gouvernance du dépôt GitHub | gouvernance | P0 | S | 0 |
| 116 | V2-DEP-01 | Renovate seul générateur, Dependabot veille | fonctionnel | P1 | M | 1 |
| 117 | V2-SEC-02 | CodeQL, OSV-Scanner, Dependency Review, politique de sévérité | fonctionnel | P1 | M | 1 |
| 118 | V2-SEC-03 | Secrets : Gitleaks, protections natives, rotation | fonctionnel | P0 | S | 0 |
| 119 | V2-SEC-04 | OpenSSF Scorecard | fonctionnel | P2 | S | 1 |
| 120 | V2-QA-12 | Codecov | fonctionnel | P2 | S | 2 |
| 121 | V2-QA-13 | Knip | fonctionnel | P2 | S | 2 |
| 122 | V2-QA-14 | Étude-pilote StrykerJS | étude | P3 | M | 2 |
| 123 | V2-QA-15 | Lighthouse CI | fonctionnel | P2 | M | 2 |
| 124 | V2-QA-16 | TypeScript strict et ESLint | fonctionnel | P1 | S | 1 |
| 125 | V2-OBS-01 | Étude Sentry (RGPD, CSP, gratuité) | étude | P2 | M | 2 |
| 126 | V2-CICD-03 | Agents IA dans la CI/CD | gouvernance | P1 | M | 1 |
| 127 | V2-CICD-04 | Rapport hebdomadaire | fonctionnel | P2 | M | 2 |
| 128 | V2-CICD-05 | Documentation, opérations manuelles, séquencement, recette | doc | P1 | M | 1 |

**Révisions de specs existantes** (sections « Révision DevSecOps » ajoutées, sans suppression) : 043 (notification des planifiés en lot 0, branche cible, noms de checks), 044 (budgets partagés avec Lighthouse, lot), 029 (source unique d'exclusions face à Codecov, scripts `scripts/ci/`), 033 (gel DevSecOps pendant la gate, item Snyk), 036 (section CI/CD d'`AGENTS.md`), 041 (axe vs Lighthouse), 042 (niveaux critique/complet), 006 (runbook commun, sorties des promotions). Choix : extension quand le sujet est déjà porté (voix, couverture, release, onboarding, matrice d'appareils, budgets) ; nouvelle spec quand l'outil ou la gouvernance est nouveau.

## 8. Décisions à arbitrer (extrait des questions ouvertes)

1. Modèle de branches et branche cible de Renovate (113 Q1) — recommandation : `main`, `develop` archivée.
2. Approbations sur `main` avec un mainteneur unique (115 Q1) — recommandation : 0 + conversations + checks, compromis documenté.
3. Application de promotion (115 Q2) — recommandation : la finaliser (jeton d'application), sinon supprimer secrets et contournement.
4. Politique d'auto-merge (114 Q1, Q2, Q4) — patch et minor dev oui ; minor d'exécution, majeures et 0.x non ; actions qui écrivent en revue.
5. Mend hébergé vs auto-hébergé ; majeures via Dashboard (116 Q1, Q2).
6. Retrait de Snyk et de `npm audit` (117 Q1, Q2).
7. Rôle de Codecov face à Sonar (120 Q1).
8. Seuils de mutation et périmètre (122) ; budgets Lighthouse relatifs (123 Q2).
9. Sentry : adoption, consentement, source maps (125).
10. Runtime IA (126 Q1) — recommandation : aucun runtime automatisé payant.
11. Gel DevSecOps pendant la gate 2.0.0 (033 DSO-Q1).

## 9. Opérations manuelles et coûts

La checklist complète (action, lien officiel, chemin, permission minimale, résultat attendu, vérification) est dans la spec 128 §5.2 (M1 à M15) ; le séquencement sans blocage en §5.3 ; la recette des scénarios de la demande en §5.4 ; la synthèse des coûts en §5.5. **Coût récurrent attendu : 0 €** ; temps runner estimé ≈ 2 400 min/mois, gratuit pour un dépôt public, avec une limite de 20 jobs simultanés.

## 10. Limites

- Aucune exécution des outils cibles (Renovate, OSV, Knip, Stryker, Lighthouse, Scorecard, Sentry) : les prévisions (scores Scorecard, candidats Knip, durées) sont marquées [à confirmer].
- `.npmrc` et la liste des applications installées n'ont pas pu être lus ; l'identité de l'intégration 3200236 est déduite.
- Les comportements GitHub « job ignoré compté réussi » et l'accès du `GITHUB_TOKEN` aux alertes Dependabot et secret scanning sont à confirmer dans la documentation au moment de l'implémentation.
- La qualification juridique d'un suivi d'erreurs (125) n'est pas tranchée.
