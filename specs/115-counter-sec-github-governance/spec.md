---
id: 115-counter-sec-github-governance
v2_id: V2-SEC-01
titre: Gouvernance du dépôt GitHub (paramètres, ruleset main, permissions Actions, environnements)
type: gouvernance
statut: en-cours
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 80
depend_de: []
remplace: []
remplacee_par: []
issue: '#300'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-24
---

# 115 — Gouvernance du dépôt GitHub (paramètres, ruleset main, permissions Actions, environnements)

> **Statut : EN COURS.** Le product owner retient toutes les recommandations du tableau des décisions ; les dépendances et conditions de déploiement restent applicables.

## 1. Origine et contexte

La demande DevSecOps (§20) exige de configurer le dépôt lui-même et pas seulement les fichiers versionnés. La configuration a été lue en **lecture seule** le 2026-11-20 (`gh api`, requêtes GET). Cette spec décrit l'écart et la cible ; toutes les modifications sont des **opérations manuelles du product owner** (administrateur), recensées dans la spec 128.

## 2. Problématique

La protection de `main` est déjà solide (ruleset actif, CodeQL bloquant), mais plusieurs réglages contredisent la documentation ou affaiblissent la sécurité : environnement de production sans approbation, actions tierces non restreintes, secrets inutilisés, exigence de revue des propriétaires sans `CODEOWNERS`, auto-merge et suppression des branches désactivés.

## 3. Objectifs

- O1 : un état de configuration cible écrit, vérifiable par `gh api` et par Scorecard (119).
- O2 : permettre l'auto-merge Renovate (114) sans affaiblir la protection des autres PR ni accorder de contournement aux bots.
- O3 : réduire la surface d'attaque des workflows (actions autorisées, épinglage SHA obligatoire, secrets minimaux).

## 4. État actuel vérifié dans le code

Lecture `gh api` du 2026-11-20 (dépôt public `floriangiral/Bougnat_darts_counter`, propriétaire de type **User**) :

- [vérifié] Paramètres : `allow_auto_merge: false`, `allow_squash_merge`/`allow_merge_commit`/`allow_rebase_merge: true`, `delete_branch_on_merge: false`, `allow_update_branch: false`, `has_discussions: true`, licence détectée `NOASSERTION` alors que `LICENSE.md:1` est un texte MIT [cause à confirmer].
- [vérifié] Sécurité : `secret_scanning` et `secret_scanning_push_protection` **activés** ; `secret_scanning_non_provider_patterns` et `secret_scanning_validity_checks` désactivés ; alertes Dependabot activées (`/vulnerability-alerts` → 204) ; **mises à jour de sécurité Dependabot activées** (`/automated-security-fixes` → `enabled: true`) ; signalement privé de vulnérabilités activé ; « default setup » CodeQL non configuré (configuration avancée par workflow), langages détectés : `actions`, `javascript-typescript`.
- [vérifié] Alertes ouvertes : 0 code scanning, 0 secret scanning, 0 Dependabot (100 alertes Dependabot historiques, toutes `fixed`).
- [vérifié] Ruleset `main` : voir spec 114 §4 (huit checks requis stricts, règle CodeQL `high_or_higher`, règle `code_quality`, 0 approbation, `require_code_owner_review: true`, aucun contournement). Aucune protection de branche classique.
- [vérifié] Ruleset « preprod et production » : seule la suppression est interdite ; contournement permanent accordé à l'intégration `3200236` [identité de l'application à confirmer dans l'interface].
- [vérifié] Actions : `allowed_actions: all`, `sha_pinning_required: false`, `default_workflow_permissions: read`, `can_approve_pull_request_reviews: false` ; approbation requise pour **tous les contributeurs externes** (`fork-pr-contributor-approval`) ; rétention des artefacts et journaux : 90 jours.
- [vérifié] Secrets (noms seulement) : dépôt `SNYK_TOKEN`, `SONAR_TOKEN` ; environnements `preprod` et `Production` : `BRANCH_PROMOTER_APP_ID`, `BRANCH_PROMOTER_APP_PRIVATE_KEY`, `DEEPGRAM_API_KEY` ; variables d'environnement `DEEPGRAM_PROJECT_ID` et `VITE_*` ; aucune variable de dépôt.
- [vérifié] `BRANCH_PROMOTER_APP_*` n'est référencé par aucun workflow (`grep` sur `.github/`) ; les promotions poussent en force avec `github.token` (`promote-preprod.yml:103`, `promote-production.yml:116`).
- [vérifié] Environnements : `preprod` (déploiement limité à `main`) et `Production` (limité à `preprod`), **sans approbateur** ni délai, `can_admins_bypass: true` — alors que `docs/technical.md:380` recommande « au moins un reviewer manuel » pour la production.
- [vérifié] `promote-preprod.yml:112` et `promote-production.yml:125` interpolent `${{ inputs.reason }}` dans un script `run:` (injection possible par un utilisateur ayant le droit d'écriture) ; `promote-*.yml:90-91` affichent la réponse de l'API Deepgram en cas d'échec.
- [vérifié] 21 branches distantes dont des branches obsolètes (`online_fetures`, `develop_backup_before_align_2026-07-28`, `dependabot/npm_and_yarn/…`) [`gh api …/branches`].
- [vérifié] Ni `CODEOWNERS` ni `CODE_OF_CONDUCT.md`.
- [non lu] Applications GitHub installées : `GET /repos/…/installation` et `/user/installations` refusés au jeton utilisateur (401/403) ; seules l'application SonarQube Cloud (`integration_id` 12526 dans le ruleset) et l'intégration 3200236 sont déduites.

## 5. Comportement cible

| Domaine | Cible |
|---|---|
| Fusion | Squash seul (titre = titre de PR), auto-merge autorisé, suppression automatique des branches fusionnées, bouton « mettre à jour la branche » |
| Ruleset `main` | PR obligatoire ; suppression et force push interdits ; checks requis = agrégateurs (114) + Sonar si conservé ; « à jour avec la base » ; résolution des conversations ; règle CodeQL conservée ; aucun contournement (bots compris) |
| Revues | Politique Q1 (compromis documenté pour un mainteneur unique) |
| Branches de livraison | `preprod`/`production` modifiables uniquement par l'application de promotion (Q2) |
| Actions | Actions GitHub, éditeurs vérifiés et liste explicite ; épinglage SHA obligatoire ; `GITHUB_TOKEN` en lecture ; approbation des contributeurs externes conservée |
| Environnements | `Production` avec approbation du mainteneur ; secrets au niveau environnement uniquement ; secrets inutilisés supprimés |
| Sécurité | Graphe de dépendances, alertes Dependabot, secret scanning, protection des pushes, signalement privé : actifs ; mises à jour de sécurité Dependabot **désactivées après** activation de Renovate (116) ; motifs non-fournisseurs activés si disponibles |

## 6. Périmètre

### Inclus
- Paramètres du dépôt, rulesets, permissions Actions, environnements, secrets (inventaire), réglages de sécurité, branches obsolètes, `CODEOWNERS`.
- Correctifs de sécurité des workflows de promotion (injection `inputs.reason`, affichage de réponse API, jeton de promotion).

### Exclu
- Contenu des scans (117, 118, 119) et politique d'auto-merge (114).
- Hébergement Cloudflare (hors GitHub).

## 7. User stories

- En tant que product owner, je veux une liste de réglages à appliquer avec leur vérification, afin de ne rien casser.
- En tant que mainteneur, je veux qu'une promotion en production exige mon approbation explicite, afin d'éviter un déploiement accidentel.

## 8. Règles métier

- RM-01 Aucun bot ni application n'obtient de contournement du ruleset `main`.
- RM-02 Toute modification du ruleset est précédée d'un export JSON et consignée (date, raison) dans la documentation CI (128).
- RM-03 Un secret non utilisé par un workflow est supprimé ou justifié.
- RM-04 L'activation d'un check requis suit la disponibilité réelle du workflow correspondant (pas de check requis jamais publié).

## 9. Parcours utilisateurs

Product owner : checklist 128 → réglage → vérification `gh api` → case cochée.

## 10. Exigences fonctionnelles

- FR-01 Fusion : `allow_squash_merge` seul, `squash_merge_commit_title: PR_TITLE`, `allow_auto_merge: true`, `delete_branch_on_merge: true`, `allow_update_branch: true`.
- FR-02 Ruleset `main` : `required_review_thread_resolution: true`, méthodes autorisées `squash`, checks requis migrés (113 §6, 114), `require_code_owner_review` aligné sur Q3.
- FR-03 Rulesets `release/**` (et `develop` si conservée, 113 Q1) : PR obligatoire, checks requis identiques, suppression et force push interdits.
- FR-04 Branches `preprod`/`production` selon Q2 : soit restriction des mises à jour avec contournement réservé à l'application de promotion **et** workflows utilisant un jeton d'application à courte durée (`actions/create-github-app-token`), soit suppression de l'application et des secrets `BRANCH_PROMOTER_APP_*`.
- FR-05 Actions : `allowed_actions: selected` (GitHub, éditeurs vérifiés, liste : `gitleaks/gitleaks-action`, `SonarSource/sonarqube-scan-action`, `google/osv-scanner-action`, `ossf/scorecard-action`, `codecov/codecov-action` si 120 retenue) ; `sha_pinning_required: true`.
- FR-06 Environnement `Production` : approbateur requis (le mainteneur), `can_admins_bypass: false` (Q4).
- FR-07 Promotions : `inputs.reason` passé par variable d'environnement ; ne plus afficher la réponse brute de l'API Deepgram ; permissions `contents: write` au niveau du job.
- FR-08 Sécurité : désactiver les mises à jour de sécurité Dependabot **après** la première PR de sécurité Renovate réussie (116) ; activer les motifs non-fournisseurs et les contrôles de validité si l'offre gratuite d'un dépôt public le permet [à confirmer].
- FR-09 Nettoyage des branches obsolètes (liste validée par le product owner).
- FR-10 Vérifier et corriger la détection de licence (`NOASSERTION`) si elle provient d'une altération du texte MIT.
- FR-11 Script de vérification en lecture (`scripts/ci/check-github-settings.mjs`, jeton en lecture) comparant l'état réel à la cible, utilisable par le rapport hebdomadaire (127).

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € — rulesets disponibles pour les dépôts publics sur GitHub Free (docs.github.com « About rulesets », consulté le 2026-11-20).
- NFR-02 Aucune interruption : chaque réglage est appliqué hors période de gel de release (033).

## 12. Cas nominaux et alternatifs

- Nominal : réglages appliqués dans l'ordre de 128, vérifiés, aucune PR bloquée.
- Alternatif : un check requis n'est jamais publié → retour arrière immédiat par l'export JSON.

## 13. Cas limites

- Mainteneur unique : impossible d'approuver sa propre PR ; une exigence d'approbation bloquerait toutes ses PR (Q1).
- Contournement d'urgence : modifier temporairement le ruleset (tracé dans le journal d'audit), jamais par contournement permanent.

## 14. Gestion des erreurs

Le script FR-11 liste chaque écart (attendu / constaté) ; un écart critique (contournement accordé, épinglage non obligatoire) est signalé dans le rapport hebdomadaire.

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Interface ruleset ↔ noms de checks (113, 114).

## 17. Compatibilité avec l'existant

Les workflows de promotion restent manuels ; la documentation `docs/technical.md:375-382` est alignée sur l'état réel.

## 18. Dépendances

- Aucune dépendance bloquante pour FR-01, FR-05 à FR-10 (réglages indépendants).
- FR-02 (migration des checks) attend 113/114 ; FR-08 attend 116.

## 19. Critères d'acceptation

- AC-01 `gh api repos/…` montre squash seul, auto-merge autorisé, suppression des branches fusionnées, mise à jour de branche autorisée.
- AC-02 Un push direct et un force push sur `main` sont refusés (branche de test ou essai documenté).
- AC-03 Un workflow de test utilisant une action non autorisée ou une référence par tag échoue au démarrage.
- AC-04 Le lancement de « Promote Production » attend l'approbation du mainteneur.
- AC-05 Aucun secret non référencé ne subsiste (inventaire comparé au `grep` des workflows).
- AC-06 Le script FR-11 ne remonte aucun écart.
- AC-07 Une PR de fork ne voit aucun secret (journal : variables vides) et attend l'approbation d'exécution.

## 20. Scénarios de tests

Lecture `gh api` avant/après ; workflow de test sur branche jetable (AC-03) ; promotion à blanc vers `preprod` (AC-04 sur `Production` lors de la prochaine release).

## 21. Exigences de non-régression

Promotions preprod/production fonctionnelles ; analyses Sonar et CodeQL toujours publiées ; aucune PR existante bloquée.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Liste d'actions autorisées incomplète | Moyen | Moyenne | Inventaire `grep uses:` avant bascule ; workflow de test |
| Ruleset trop strict bloquant les PR | Élevé | Faible | Export JSON, application progressive |
| Approbation production oubliée pendant une urgence | Faible | Faible | Le mainteneur est l'approbateur ; procédure documentée |

## 23. Décisions architecturales

Aucun ADR ; compromis de revue (Q1) documenté dans `CONTRIBUTING.md` et la documentation CI.

## 24. Questions ouvertes et décisions

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Approbations requises sur `main` | 0 (checks seuls) / 1 (bloque les PR du mainteneur unique) / 1 + contournement admin | 0 + résolution des conversations + checks stricts ; revue IA facultative ; passer à 1 dès qu'un second mainteneur existe | 0 + résolution des conversations + checks stricts ; revue IA facultative ; passer à 1 dès qu'un second mainteneur existe (décision du product owner, 2026-11-24) |
| Q2 | Application de promotion (`BRANCH_PROMOTER_APP_*`, intégration 3200236) | Finaliser (jeton d'application, mises à jour restreintes) / supprimer | Finaliser : seul moyen d'empêcher un push arbitraire sur `production` | Finaliser : seul moyen d'empêcher un push arbitraire sur `production` (décision du product owner, 2026-11-24) |
| Q3 | `CODEOWNERS` | Aucun / chemins sensibles avec revue obligatoire | Aucun tant que mainteneur unique ; désactiver `require_code_owner_review` pour lever l'ambiguïté | Aucun tant que mainteneur unique ; désactiver `require_code_owner_review` pour lever l'ambiguïté (décision du product owner, 2026-11-24) |
| Q4 | Contournement administrateur de l'environnement `Production` | Autorisé / interdit | Interdit (l'approbation suffit au mainteneur) | Interdit (l'approbation suffit au mainteneur) (décision du product owner, 2026-11-24) |
| Q5 | Archiver `develop` et les branches obsolètes | Oui / non | Oui après décision 113 Q1, avec tag d'archive | Oui après décision 113 Q1, avec tag d'archive (décision du product owner, 2026-11-24) |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (§3, matrice) ; demande DevSecOps §20, §27 ; `docs/technical.md:375-382` ; specs 113, 114, 116, 119, 128.
