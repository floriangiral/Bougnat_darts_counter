---
id: 113-counter-cicd-workflow-architecture
v2_id: V2-CICD-01
titre: Architecture des workflows GitHub Actions et fréquences des contrôles
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 30
depend_de: [V2-QA-10]
remplace: []
remplacee_par: []
issue: '#303'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 113 — Architecture des workflows GitHub Actions et fréquences des contrôles

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Le product owner a demandé l'industrialisation CI/CD et DevSecOps du dépôt (chantier « DevSecOps », audit `docs/v2/audit/11-devsecops.md`). Cette spec fixe le **socle commun** : quels workflows existent, quand ils tournent, avec quelles permissions, quels artefacts et quelles notifications. Les outils eux-mêmes sont spécifiés ailleurs (Renovate 116, scans 117-119, Codecov 120, Knip 121, Stryker 122, Lighthouse 123, quality gate 114). Elle **prolonge** la spec 043 (V2-QA-10, corrections ponctuelles de la CI existante) sans la remplacer : 043 corrige les défauts actuels, 113 organise la cible.

## 2. Problématique

Les contrôles sont répartis dans des workflows qui se recouvrent (installation npm répétée, couverture calculée deux fois), sans exécution nocturne, sans distinction entre tests critiques et suite complète, et sans notification des échecs planifiés : un scan hebdomadaire peut échouer trois semaines de suite sans que personne ne le voie.

## 3. Objectifs

- O1 : une architecture lisible (≤ 8 workflows applicatifs) où chaque contrôle a un déclencheur, une fréquence et un propriétaire.
- O2 : appliquer la matrice de fréquences cible (§5) en restant gratuit (runners standard d'un dépôt public).
- O3 : aucun échec planifié silencieux.
- O4 : permissions minimales, artefacts à durée de rétention maîtrisée, résumés de job exploitables.

## 4. État actuel vérifié dans le code

- [vérifié] 10 workflows et 2 actions composites dans `.github/` : `quality-gate.yml`, `security-review.yml`, `secret-scan.yml`, `e2e.yml` (+ `reusable-integration-smoke.yml`), `dependency-watch.yml`, `promote-preprod.yml`, `promote-production.yml`, `validate-environments.yml`, `issue-auto-label.yml` ; `actions/setup-ci-app`, `actions/run-local-smoke`.
- [vérifié] Déclencheurs : `quality-gate.yml:6-18` (PR vers `main`, `preprod`, `develop`, `release/**`, push `main`, lundi 06:47 UTC) ; `security-review.yml:6-20` (PR, push `main`/`develop`/`preprod`, lundi 06:17) ; `secret-scan.yml:6-19` (PR, push `main`/`preprod`, lundi 06:11) ; `e2e.yml:6-12` (PR vers `main`, `preprod`, `release/**`, manuel) ; `dependency-watch.yml:6-9` (lundi 06:43). Aucune exécution nocturne ; aucun déclencheur `merge_group`.
- [vérifié] (rattaché par la spec 034, item C-52, au commit `863b4bd`) `issue-auto-label.yml` associe les zones des formulaires d'issue à des labels par une table `zoneMap` figée : elle garde « 501 Double Out » et « Historique », retirés des formulaires, et ignore Killer, Gotcha, 180 Around the Clock, Mode tablette, Lien de match partenaire et Réglages / thème ; elle lit aussi les intitulés de champ non accentués des formulaires, qui ne peuvent donc pas être corrigés sans modifier le workflow.
- [vérifié] `concurrency` avec `cancel-in-progress` et `timeout-minutes` (5 à 30 min) présents dans tous les workflows ; actions tierces épinglées par SHA (ex. `quality-gate.yml:35`).
- [vérifié] Permissions par défaut `contents: read`, sauf au niveau workflow : `secret-scan.yml:25-27` (`security-events: write`), `promote-preprod.yml:26-27` et `promote-production.yml:26-27` (`contents: write`), `issue-auto-label.yml:10-11` (`issues: write`). Réglage du dépôt : `default_workflow_permissions: read`, `can_approve_pull_request_reviews: false` [vérifié `gh api …/actions/permissions/workflow`, 2026-11-20].
- [vérifié] `npm ci` est exécuté dans 5 à 6 jobs par push de PR (`validate`, `sonar`, `global-quality-baseline`, `npm-audit`, `snyk`, `smoke`), via `setup-ci-app/action.yml:34-41` ; npm est installé globalement sans vérification de la version obtenue au-delà de l'affichage (`action.yml:31-32`).
- [vérifié] Durées mesurées sur la PR #203 (20/11) : `Lint, Typecheck, Unit Tests, Build` 66 s, `SonarCloud` 92 s, `Snyk Container` 72 s, `CodeQL` 62 s, `Snyk Dependencies` 56 s, `NPM Audit` 25 s, `Dependency Review` 9 s, `Gitleaks` 8 s, `smoke / Local Integration Smoke` 225 s ⇒ ≈ 10 min de runner par push [vérifié `gh run view`].
- [vérifié] Le workflow planifié `Security Review` a échoué les lundis 2, 9 et 16 novembre (job `Snyk Dependencies`, `undici@7.30.1` : 1 critique, 5 hautes) sans issue ni notification visible [vérifié `gh run list --event schedule`, `gh run view --log-failed`].
- [vérifié] Le rapport Playwright n'est publié qu'en cas d'échec, sans `retention-days` (`reusable-integration-smoke.yml:33-40`) ; aucun autre artefact n'est publié.
- [vérifié] Playwright : 7 projets (Chromium bureau, 3 tablettes et 3 téléphones WebKit) exécutés intégralement à chaque PR (`playwright.config.ts:16-53`) ; aucun marquage « critique ».
- [vérifié] `dependency-watch.yml:33-55` produit un tableau `npm outdated` hebdomadaire dans le résumé, redondant avec le Dependency Dashboard de Renovate (spec 116).

## 5. Comportement cible

### Catalogue des workflows (proposé, noms à confirmer par Q2)

| Workflow | Rôle | Déclencheurs |
|---|---|---|
| `ci.yml` (évolution de `quality-gate.yml`) | Installation, lint, types, Vitest + couverture, build, budgets (044), Codecov (120), Sonar, agrégateur (114) | PR, push `main`, manuel |
| `e2e.yml` | Playwright critique (PR) et complet (nightly, PR Renovate éligibles, PR de release) | PR, nightly, manuel |
| `security.yml` (évolution de `security-review.yml` + `secret-scan.yml`) | Gitleaks, CodeQL, OSV-Scanner, Dependency Review (117, 118) | PR, push `main`, nightly (OSV), hebdo (CodeQL étendu, Gitleaks historique), manuel |
| `performance.yml` | Lighthouse CI (123) | PR, manuel |
| `weekly-maintenance.yml` | Knip (121), rapport hebdomadaire (127) | hebdo, manuel |
| `mutation.yml` | StrykerJS (122) | hebdo, manuel |
| `scorecard.yml` | OpenSSF Scorecard (119) — fichier isolé exigé par l'action | hebdo, push `main`, manuel |
| `promote-preprod.yml`, `promote-production.yml`, `validate-environments.yml`, `issue-auto-label.yml` | Inchangés fonctionnellement, durcis par 115 | manuels / issues |

### Matrice de fréquences cible (adaptée de la demande)

| Contrôle | Chaque PR | Push `main` | Nocturne | Hebdomadaire |
|---|---|---|---|---|
| Installation propre (`npm ci`) | Oui | Oui | Oui | Oui |
| ESLint (standard + type-aware), TypeScript | Oui | Oui | | |
| Vitest + couverture (une seule fois) | Oui | Oui | | |
| Codecov (envoi) | Oui | Oui | | |
| Build production + budgets de bundle | Oui | Oui | | |
| Playwright critique | Oui | Oui | | |
| Playwright complet | PR Renovate éligibles et PR de release | | Oui | |
| Gitleaks | Oui (commits de la PR) | Oui | | Oui (historique complet) |
| CodeQL | Oui | Oui | | Oui (`security-extended`) |
| Dependency Review | Oui | | | |
| OSV-Scanner | Oui (nouvelles vulnérabilités seulement) | | Oui (complet) | |
| Lighthouse CI | Oui (informatif puis bloquant, 123) | | | |
| Knip, StrykerJS, Scorecard, rapport | | | | Oui |
| Renovate | Hors cycle pour la sécurité | | | Vague du lundi |

## 6. Périmètre

### Inclus
- Organisation des workflows, déclencheurs, `workflow_dispatch`, concurrence, délais, permissions, cache, artefacts, résumés, notifications.
- Distinction Playwright critique / complet ; production des rapports Vitest une seule fois.
- Plan de migration des noms de checks requis (coordonné avec 114 et 115).

### Exclu
- Correctifs ponctuels déjà spécifiés par 043 (garde `rg`, serveur unique, seuils affichés) : consommés tels quels.
- Configuration de chaque outil (specs 116 à 123), règles de protection (115), politique d'auto-merge (114).
- Contenu des tests (039, 040, 042).

## 7. User stories

- En tant que mainteneur, je veux savoir en un tableau quel contrôle tourne quand, afin de diagnostiquer vite une PR rouge.
- En tant que mainteneur absent plusieurs semaines, je veux qu'un échec nocturne ou hebdomadaire ouvre une issue, afin de ne pas découvrir une dette de sécurité au retour.
- En tant que contributeur externe, je veux une PR de fork qui passe sans secret, afin de contribuer sans privilège.

## 8. Règles métier

- RM-01 Aucun workflow planifié sans `workflow_dispatch`.
- RM-02 Permissions de niveau workflow : `contents: read` au maximum ; toute écriture est déclarée au niveau du job qui en a besoin.
- RM-03 Aucun `pull_request_target` ; tout nouvel usage exige une revue sécurité (115).
- RM-04 Aucun runner payant (larger runners) ni auto-hébergé.
- RM-05 Un échec planifié produit une issue unique par workflow, mise à jour tant qu'il persiste, fermée au premier succès.

## 9. Parcours utilisateurs

PR → `ci`, `e2e` (critique), `security`, `performance` en parallèle → agrégateur (114) → fusion. Nuit → E2E complet + OSV complet → issue si échec. Lundi → Renovate, CodeQL étendu, Gitleaks historique, Knip, Stryker, Scorecard, rapport (127).

## 10. Exigences fonctionnelles

- FR-01 Mettre en place le catalogue de workflows du §5 (fusion `security-review.yml` + `secret-scan.yml`, ajout `performance.yml`, `weekly-maintenance.yml`, `mutation.yml`, `scorecard.yml`) ; `dependency-watch.yml` est retiré quand le Dependency Dashboard (116) est actif.
- FR-02 Appliquer la matrice de fréquences du §5 ; horaires planifiés en UTC, documentés avec leur équivalent Europe/Paris.
- FR-03 Chaque job déclare `timeout-minutes` (≤ 20 min sauf mutation ≤ 90 min) et chaque workflow un groupe de `concurrency` ; `cancel-in-progress: true` pour les PR, `false` pour `main`, les promotions et les planifications.
- FR-04 Permissions : `permissions: {}` ou `contents: read` au niveau workflow ; `security-events: write`, `id-token: write`, `issues: write`, `pull-requests: write` uniquement au niveau du job concerné (correction de `secret-scan.yml:25-27`, `issue-auto-label.yml:10-11`).
- FR-05 Une seule installation par job, cache npm de `actions/setup-node` ; aucun cache de `node_modules` ; version de npm installée puis vérifiée (`npm --version` = `packageManager`).
- FR-06 Couverture Vitest calculée une seule fois par exécution (reporters `lcov`, `json-summary`, `junit`), partagée par artefact entre Sonar, Codecov et le résumé.
- FR-07 Build de production produit une fois et partagé par artefact (`dist/`) entre budgets (044), Lighthouse (123) et Playwright quand c'est possible.
- FR-08 Playwright : marquage `@critique` des parcours de base (ouvrir → jeu → prénoms → jouer, lien externe `v=1`) ; projet(s) critiques sur chaque PR ; suite complète en nightly, sur les PR Renovate éligibles à l'auto-merge et sur les PR vers `release/**` (règle d'éligibilité : 114).
- FR-09 Artefacts : rapports Playwright (traces, captures, vidéos) en cas d'échec, couverture, SARIF, rapports Lighthouse/Knip/Stryker ; `retention-days` 7 (PR) ou 14 (planifiés).
- FR-10 Chaque job écrit un résumé (`GITHUB_STEP_SUMMARY`) : résultat, chiffres clés, lien vers l'artefact.
- FR-11 Notification d'échec planifié selon RM-05 (job final `if: failure()` avec `issues: write`), étiquette `ci:echec-planifie`, sans service tiers.
- FR-12 Noms de checks stables, listés dans la documentation CI (128) ; tout renommage suit le plan de migration (plan §6).
- FR-13 Déclencheurs alignés sur le modèle de branches décidé (Q1).

## 11. Exigences non fonctionnelles

- NFR-01 Durée murale d'une PR ≤ 12 min (chemin critique actuel ≈ 4 min, smoke 225 s) [à mesurer après ajout de Lighthouse et OSV].
- NFR-02 Temps runner par push de PR ≤ 20 min (≈ 10 min aujourd'hui).
- NFR-03 Coût : 0 € — les runners standard sont gratuits pour un dépôt public (docs.github.com, « GitHub Actions billing », consulté le 2026-11-20). Limite de concurrence du plan Free : 20 jobs simultanés (docs.github.com, « Actions limits », consulté le 2026-11-20) ; un push de PR ne lance pas plus de 12 jobs.
- NFR-04 Sécurité : workflows sûrs face à une PR de fork malveillante (aucun secret exposé, aucun code de PR exécuté avec un jeton en écriture).

## 12. Cas nominaux et alternatifs

- Nominal : PR applicative → tous les contrôles verts en ≤ 12 min.
- Alternatif : PR de documentation seule → même liste de contrôles (pas de filtre de chemins sur les checks requis, cf. 114) ; durée acceptée.
- Alternatif : nightly rouge → issue `ci:echec-planifie` ouverte ; fermée au succès suivant.

## 13. Cas limites

- Deux pushes rapprochés sur une PR : l'exécution obsolète est annulée ; l'agrégateur (114) ne compte jamais une exécution annulée comme réussie.
- File d'attente saturée (20 jobs) pendant la vague Renovate du lundi : `prConcurrentLimit` (116) borne le nombre de PR simultanées.

## 14. Gestion des erreurs

Message d'échec explicite par étape ; artefacts publiés sur échec ; issue d'échec planifié contenant le lien du run (pas d'extrait de log brut, cf. 126).

## 15. Impacts architecturaux

Aucun sur l'application. Touche `.github/workflows/`, `.github/actions/`, `playwright.config.ts` (marquage critique), `vitest.config.ts` (reporter `junit`).

## 16. Impacts sur les données et les interfaces

Les noms de checks requis sont une interface avec le ruleset `main` (115) : migration coordonnée.

## 17. Compatibilité avec l'existant

`promote-production.yml:95-98` continue d'appeler `run-local-smoke` ; les badges du README (`README.md:100-104`) sont mis à jour avec les nouveaux noms (128).

## 18. Dépendances

- Bloquante : V2-QA-10 (043) — corrections de la CI existante.
- Coordination : V2-CICD-02 (114, agrégateur et auto-merge), V2-SEC-01 (115, ruleset), V2-QA-09 (042, matrice nightly), V2-QA-08 (008, serveur Playwright), V2-PERF-01 (044, budgets), V2-QA-11 (029, note de validation CI obligatoire).

## 19. Critères d'acceptation

- AC-01 Le tableau des workflows et la matrice de fréquences publiés dans la documentation CI correspondent aux déclencheurs réels (vérification par lecture des fichiers YAML).
- AC-02 Une exécution nocturne E2E complète et une exécution OSV complète apparaissent dans l'onglet Actions le lendemain de la fusion.
- AC-03 Un échec simulé d'un workflow planifié (branche jetable, `workflow_dispatch`) ouvre une issue `ci:echec-planifie` ; la relance réussie la ferme.
- AC-04 Aucun workflow ne déclare d'écriture au niveau workflow hors promotions ; vérifié par Scorecard « Token-Permissions » (119) ou par lecture.
- AC-05 La couverture n'est calculée qu'une fois par exécution de `ci` (journal).
- AC-06 Une PR modifiant un parcours critique exécute les tests `@critique` ; une PR Renovate éligible exécute la suite complète.
- AC-07 Une PR de fork de test passe tous les contrôles sans accès aux secrets.
- AC-08 Temps runner par push de PR mesuré et consigné (NFR-02).

## 20. Scénarios de tests

PR de démonstration (branches jetables) ; `workflow_dispatch` des planifiés ; fork de test ; lecture du journal de concurrence lors de deux pushes successifs.

## 21. Exigences de non-régression

Aucun contrôle existant retiré sans remplaçant validé (Snyk : décision 117) ; promotions preprod/production inchangées ; parcours de base couvert à chaque PR.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Renommage de checks bloquant `main` | Élevé | Moyenne | Migration en deux temps (plan §6), agrégateur requis avant retrait des anciens noms |
| Bruit d'issues d'échec | Moyen | Moyenne | Une issue par workflow, mise à jour plutôt que recréée |
| Temps CI accru | Faible | Élevée | Suite complète réservée au nightly et aux PR Renovate/release |
| Workflows planifiés désactivés par GitHub après une longue inactivité du dépôt [à confirmer : durée actuelle] | Moyen | Moyenne | Activité Renovate hebdomadaire ; rapport hebdomadaire (127) qui signale un planifié absent |

## 23. Décisions architecturales

Aucun ADR obligatoire ; la matrice de fréquences validée est reprise dans la documentation CI (128).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Modèle de branches cible (Dependabot vise `develop`, les PR V2 visent `release/v2.0.0`) | A : tronc `main` + branches courtes / B : `develop` → `main` | A pour la maintenance (Renovate, correctifs) ; `release/**` conservé pour les versions ; `develop` archivée après accord | — |
| Q2 | Regrouper en `ci.yml`/`security.yml` ou conserver les fichiers actuels | Regrouper / conserver + ajouter | Regrouper progressivement, noms de checks stables via l'agrégateur (114) | — |
| Q3 | Heure du nightly | 02:00 / 03:00 / 04:00 UTC | 02:30 UTC (hors vague Renovate et hors heures de jeu) | — |
| Q4 | Épingler l'image de runner (`ubuntu-24.04`) plutôt que `ubuntu-latest` | Épingler / `latest` | Épingler (reproductibilité), revue semestrielle | — |
| Q5 | Canal de notification des échecs planifiés | Issue / e-mail GitHub par défaut | Issue (traçable, exploitable par les agents, 126) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (matrice, §4) ; demande DevSecOps du product owner (§19 « Architecture des workflows ») ; specs 008, 029, 042, 043, 044, 114 à 128.
