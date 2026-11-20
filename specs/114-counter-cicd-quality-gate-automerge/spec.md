---
id: 114-counter-cicd-quality-gate-automerge
v2_id: V2-CICD-02
titre: Quality gate agrégé et politique d'auto-merge vérifiable
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 40
depend_de: [V2-CICD-01, V2-SEC-01]
remplace: []
remplacee_par: []
issue: '#302'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 114 — Quality gate agrégé et politique d'auto-merge vérifiable

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§21) exige qu'une PR ne fusionne qu'après des contrôles **réellement exécutés et acceptables**, et que les mises à jour Renovate courantes fusionnent seules selon une politique explicite. GitHub considère un job ignoré (`if:` faux) comme réussi pour un check requis, et un ruleset ne sait pas exiger un check « seulement pour certaines PR » : il faut donc un mécanisme d'agrégation et de vérification d'éligibilité versionné dans le dépôt.

## 2. Problématique

Aujourd'hui la protection de `main` liste huit checks dont la présence dépend des déclencheurs ; un job conditionnel ignoré passe pour vert ; l'auto-merge est désactivé ; aucune règle ne distingue une mise à jour patch sûre d'une montée majeure.

## 3. Objectifs

- O1 : un check requis par workflow (« agrégateur ») qui échoue si un contrôle attendu est absent, ignoré à tort, annulé ou en échec.
- O2 : une politique d'auto-merge écrite, vérifiée par la CI à partir de faits non falsifiables (identité de l'auteur, fichiers modifiés, nature de la montée de version).
- O3 : toute PR en échec reste ouverte et identifiable ; aucune fusion forcée.

## 4. État actuel vérifié dans le code

- [vérifié] Ruleset `main` (id 14279738, actif, aucun contournement) : checks requis `NPM Audit`, `Dependency Review`, `Gitleaks`, `Lint, Typecheck, Unit Tests, Build`, `smoke / Local Integration Smoke`, `SonarCloud`, `SonarCloud Code Analysis` (application SonarQube Cloud), `Global Quality Baseline`, avec `strict_required_status_checks_policy: true` ; règle `code_scanning` CodeQL (`security_alerts_threshold: high_or_higher`, `alerts_threshold: errors`) ; règle `code_quality` (`severity: errors`) ; règle `pull_request` avec 0 approbation, `require_code_owner_review: true`, `dismiss_stale_reviews_on_push: true`, résolution des conversations non exigée, méthodes `merge`, `squash`, `rebase` [vérifié `gh api …/rulesets/14279738`, 2026-11-20].
- [vérifié] Aucun fichier `CODEOWNERS` (`.github/`, racine, `docs/`) : l'exigence de revue des propriétaires est sans effet.
- [vérifié] `Global Quality Baseline` ne s'exécute que pour les PR vers `main` (`.github/workflows/quality-gate.yml:81`) ; sur la PR #203 (vers `release/v2.0.0`) il est « skipped » [vérifié `gh run view`].
- [vérifié] Paramètres du dépôt : `allow_auto_merge: false`, `allow_update_branch: false`, trois méthodes de fusion autorisées, `delete_branch_on_merge: false` [vérifié `gh api repos/…`].
- [vérifié] Les PR Dependabot de novembre (#191 à #198, vers `develop`) ont été fermées sans fusion [vérifié `gh pr list --author app/dependabot`].
- [vérifié, source externe] Les files de fusion (merge queue) ne sont disponibles que pour les dépôts publics **d'organisation** ; le dépôt appartient à un compte personnel (`owner.type: User`) — docs.github.com « Managing a merge queue », consulté le 2026-11-20.
- [vérifié, source externe] L'auto-merge natif fusionne une PR « après que toutes les revues et tous les checks requis sont passés » ; il est désactivé si quelqu'un sans droit d'écriture pousse sur la branche — docs.github.com « Automatically merging a pull request », consulté le 2026-11-20.
- [vérifié, source externe] Renovate recommande d'activer les checks requis avant `platformAutomerge`, faute de quoi la plateforme peut fusionner avant la fin des tests — docs.renovatebot.com « Configuration options / platformAutomerge », source consultée le 2026-11-20.
- [à confirmer] Comportement GitHub documenté : un job ignoré par condition rapporte « Success » et ne bloque pas une PR même s'il est requis (documentation Actions, « Using conditions to control job execution »).

## 5. Comportement cible

1. Chaque workflow applicatif (113) se termine par un job agrégateur `requis` (`if: always()`, `needs:` = tous les jobs) qui calcule la liste **attendue** des jobs selon l'événement et l'origine de la PR, puis échoue si l'un d'eux n'est pas `success` (sauf exemption explicite et justifiée dans le code, par exemple `e2e-complet` non attendu sur une PR humaine ordinaire).
2. Le ruleset `main` exige uniquement les agrégateurs, la règle CodeQL et le statut externe SonarQube Cloud (si conservé, Q3).
3. Une PR est **éligible à l'auto-merge** si et seulement si : auteur `renovate[bot]` de type `Bot` ; branche dans le dépôt (pas un fork) ; fichiers modifiés dans une liste blanche (manifestes, lockfile, `.nvmrc`, Dockerfiles, workflows pour un changement d'épinglage SHA uniquement) ; nature de la montée conforme à la politique (§8) calculée par un script à partir du diff ; suite Playwright complète verte.
4. Renovate active l'auto-merge natif ; GitHub fusionne quand l'agrégateur est vert. Sinon la PR reste ouverte avec l'étiquette `maintenance:revue-humaine` ou `maintenance:echec`.

## 6. Périmètre

### Inclus
- Jobs agrégateurs et script de vérification d'éligibilité (`scripts/ci/`).
- Politique d'auto-merge par type de mise à jour ; règles de revue humaine.
- Paramètres de fusion liés (auto-merge, squash) en coordination avec 115.

### Exclu
- Configuration Renovate (116) : elle **propose** l'auto-merge ; cette spec le **vérifie**.
- Contenu des contrôles (113, 117-123).

## 7. User stories

- En tant que mainteneur, je veux qu'un patch de `vitest` validé par toute la CI fusionne seul, afin de ne pas trier dix PR par semaine.
- En tant que mainteneur, je veux qu'une montée majeure de React ou de Vite attende ma revue, afin de ne pas casser les parcours.
- En tant que mainteneur, je veux qu'une étiquette ajoutée par un tiers ne rende jamais une PR éligible, afin que la politique soit infalsifiable.

## 8. Règles métier

| Type de mise à jour | Auto-merge proposé | Conditions |
|---|---|---|
| Patch (≥ 1.0.0) | Oui | Maturité 7 jours (116), agrégateurs verts, E2E complet vert |
| Minor, dépendances de développement non critiques | Oui | Idem |
| Minor, dépendances d'exécution (`react`, `react-dom`, `@deepgram/sdk`, `lucide-react`, `qrcode`) | Non par défaut (Q1) | Revue humaine |
| Major, versions 0.x (ex. `eslint-plugin-react-refresh` `^0.5.8`) | Non | Revue humaine, changelog lu |
| Outillage critique (Node, TypeScript, Vite, Vitest, Playwright + image Docker, Wrangler, Tailwind, ESLint) | Patch seulement (Q2) | PR dédiée (116) |
| Maintenance du lockfile | Oui | Agrégateurs verts, E2E complet vert |
| GitHub Actions (changement de SHA, patch/minor) | Oui sauf actions de sécurité et de déploiement (Q4) | Diff limité à la ligne `uses:` et au commentaire de version |
| Correctif de sécurité | Patch : oui hors fenêtre ; autre : revue | Sévérité et politique 117 |

- RM-01 Un job `skipped`, `cancelled` ou absent n'est jamais compté comme réussi par l'agrégateur, sauf exemption codée et commentée.
- RM-02 L'éligibilité ne repose jamais sur une étiquette, un titre ou un nom de branche seuls.
- RM-03 Aucune fusion forcée ; aucun contournement accordé aux bots.
- RM-04 Une PR d'agent IA (126) n'est jamais éligible à l'auto-merge.

## 9. Parcours utilisateurs

Renovate ouvre la PR (lundi) → CI complète → agrégateurs verts → auto-merge natif → suppression de branche. Échec → PR étiquetée, visible dans le Dependency Dashboard et le rapport hebdomadaire (127) → analyse humaine ou par agent (126).

## 10. Exigences fonctionnelles

- FR-01 Job agrégateur par workflow applicatif ; nom stable (`ci / requis`, `e2e / requis`, `security / requis`, `performance / requis`).
- FR-02 Script `scripts/ci/expected-jobs.mjs` (ou équivalent) : liste attendue par événement, comparaison avec `toJSON(needs)`, résumé tabulaire des écarts.
- FR-03 Script `scripts/ci/automerge-eligibility.mjs` : identité (`github.event.pull_request.user.login`, `user.type`, `head.repo.full_name`), liste blanche de fichiers, classification de la montée de version à partir du diff de `package.json`/`package-lock.json`/`uses:` ; sortie booléenne et motif.
- FR-04 Si éligible : `e2e-complet` attendu par l'agrégateur `e2e / requis` ; sinon `e2e-critique` suffit.
- FR-05 Si non éligible alors que Renovate a activé l'auto-merge : le job désactive l'auto-merge (`gh pr merge --disable-auto`, permission `pull-requests: write` au niveau du job) et ajoute `maintenance:revue-humaine`.
- FR-06 Activer `allow_auto_merge` et réduire les méthodes de fusion à `squash` (opérations manuelles, 115/128).
- FR-07 Ruleset `main` : checks requis = agrégateurs (+ Sonar selon Q3) ; règle CodeQL conservée ; politique « à jour avec la base » conservée (Renovate rebase automatiquement).
- FR-08 Tests unitaires des deux scripts (fixtures d'événements GitHub) dans `tests/unit/tooling/`.

## 11. Exigences non fonctionnelles

- NFR-01 Agrégateur ≤ 30 s ; aucune installation npm (Node natif).
- NFR-02 Coût : 0 € (runners standard, auto-merge natif gratuit).
- NFR-03 Sécurité : les scripts lisent le contexte d'événement comme des données ; aucune interpolation `${{ }}` de champs contrôlés par l'auteur dans un `run:`.

## 12. Cas nominaux et alternatifs

- Nominal : patch `vitest` → éligible → fusion automatique.
- Alternatif : major `vite` → non éligible → revue humaine.
- Alternatif : PR Renovate qui modifie aussi `src/` (post-upgrade) → hors liste blanche → revue humaine.

## 13. Cas limites

- Plusieurs PR Renovate simultanées avec « à jour avec la base » : fusion en série, chaque PR rebasée puis retestée (borné par `prConcurrentLimit`, 116).
- Un contributeur crée une branche nommée `renovate/…` : auteur non `renovate[bot]` → non éligible.
- Renovate rebase pendant l'exécution : exécution annulée, agrégateur non vert, nouvelle exécution.

## 14. Gestion des erreurs

Résumé de l'agrégateur : jobs attendus, résultat de chacun, motif d'inéligibilité ; aucun extrait de log brut.

## 15. Impacts architecturaux

Scripts d'outillage sous `scripts/ci/` (hors code applicatif) ; aucune dépendance ajoutée.

## 16. Impacts sur les données et les interfaces

Interface ruleset ↔ noms des agrégateurs (stables, documentés).

## 17. Compatibilité avec l'existant

Le statut externe `SonarCloud Code Analysis` reste requis tant que Sonar est conservé. Les promotions preprod/production restent manuelles : **un auto-merge sur `main` ne déploie rien** (Cloudflare Pages construit les branches miroirs `preprod`/`production`, `docs/technical.md` « Flux GitHub Actions »).

## 18. Dépendances

- Bloquantes : V2-CICD-01 (113), V2-SEC-01 (115).
- Liées : V2-DEP-01 (116), V2-SEC-02 (117), V2-CICD-03 (126).

## 19. Critères d'acceptation

- AC-01 Une PR Renovate patch compatible est fusionnée automatiquement après agrégateurs et E2E complet verts.
- AC-02 Une PR Renovate major reste ouverte avec `maintenance:revue-humaine`.
- AC-03 Une PR avec un test unitaire en échec reste bloquée ; l'auto-merge ne s'exécute pas.
- AC-04 Un job requis rendu `skipped` artificiellement (branche jetable) fait échouer l'agrégateur.
- AC-05 Une PR humaine portant l'étiquette ou le nom de branche d'une PR Renovate n'est pas éligible.
- AC-06 Une PR Renovate modifiant un fichier hors liste blanche n'est pas fusionnée automatiquement.
- AC-07 Une PR Renovate en échec reste ouverte et apparaît dans le rapport hebdomadaire (127).
- AC-08 Tests unitaires des scripts verts, y compris les cas `cancelled` et `skipped`.

## 20. Scénarios de tests

Fixtures d'événements (`pull_request` humain, Renovate patch, Renovate major, fork) pour les scripts ; PR jetables pour AC-03 et AC-04 ; observation de la première vague Renovate pour AC-01, AC-02, AC-07.

## 21. Exigences de non-régression

Aucune PR humaine n'est fusionnée automatiquement sans action explicite de son auteur ; la règle CodeQL du ruleset reste active.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Faux positif d'éligibilité | Élevé | Faible | Liste blanche stricte, tests des scripts, E2E complet obligatoire |
| Blocage permanent (check attendu jamais publié) | Moyen | Moyenne | Pas de filtre de chemins sur les workflows requis ; résumé explicite |
| Régression comportementale non couverte par les tests | Élevé | Moyenne | Maturité 7 jours, E2E complet, golden tests (039), rollback par revert |
| Fusions en série lentes | Faible | Élevée | `prConcurrentLimit`, groupement (116) |

## 23. Décisions architecturales

ADR proposé : « Politique d'auto-merge des dépendances » (à rédiger si Q1-Q4 tranchées).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Minor des dépendances d'exécution en auto-merge ? | Oui / non | Non au démarrage (5 paquets, faible volume) ; réévaluer après 3 mois | — |
| Q2 | Outillage critique : patch auto-mergé ? | Oui / non | Oui pour patch, non pour minor et major | — |
| Q3 | Statut externe Sonar requis ? | Conserver / retirer | Conserver tant que Sonar est l'outil de quality gate (voir 120) | — |
| Q4 | Actions GitHub de sécurité et de déploiement (`codeql-action`, `scorecard-action`, `upload-artifact`…) | Auto-merge / revue | Revue pour les actions qui écrivent (`security-events`, `contents`) ; auto-merge pour `checkout`, `setup-node` | — |
| Q5 | Résolution des conversations obligatoire ? | Oui / non | Oui (sans effet sur les PR Renovate sans commentaire) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (§5, §6) ; demande DevSecOps §21 et §26 ; specs 113, 115, 116, 117, 126, 127.
