---
id: 128-counter-cicd-doc-and-manual-ops
v2_id: V2-CICD-05
titre: Documentation DevSecOps, opérations manuelles du product owner, séquencement et recette globale
type: doc
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 23
depend_de: [V2-SEC-01, V2-DEP-01]
remplace: []
remplacee_par: []
issue: '#307'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 128 — Documentation DevSecOps, opérations manuelles du product owner, séquencement et recette globale

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§23, §25 à §28) exige une documentation permettant à un nouveau mainteneur ou agent de reprendre le projet, une checklist minimale des opérations nécessitant un accès administrateur ou un compte externe, un ordre d'activation qui ne bloque jamais le dépôt, une recette globale prouvée et une synthèse des coûts. Cette spec rassemble ces éléments transverses ; chaque outil reste spécifié par sa propre spec (113 à 127).

## 2. Problématique

La documentation actuelle décrit des contrôles partiellement inexacts (Snyk « bloquant », checks requis, environnement de production « avec reviewer »), est rédigée sans accents (`SECURITY.md`, `CONTRIBUTING.md`) contrairement à la règle d'`AGENTS.md` §5, et aucune liste n'indique ce que seul le product owner peut faire.

## 3. Objectifs

- O1 : une documentation DevSecOps exacte, en français accentué, sans présenter comme actif ce qui ne l'est pas.
- O2 : une checklist d'opérations manuelles exécutable et vérifiable.
- O3 : un séquencement sans blocage et une recette finale prouvée (matrice outil × état).

## 4. État actuel vérifié dans le code

- [vérifié] `SECURITY.md:85-99` présente Snyk comme bloquant « à partir du niveau high » et SonarCloud comme contrôle des PR ; le ruleset ne requiert pas Snyk (115 §4). Texte sans accents (`SECURITY.md:1-112`), comme `CONTRIBUTING.md`.
- [vérifié] `CONTRIBUTING.md:70-80` : consignes Sonar/Snyk ; `docs/technical.md:303-310` exige SonarCloud, Snyk, CodeQL, Gitleaks, tests/build et E2E en checks requis (Snyk et CodeQL ne sont pas dans la liste des checks requis ; CodeQL est appliqué par la règle `code_scanning`).
- [vérifié] `docs/technical.md:380` recommande un approbateur pour l'environnement de production ; aucun n'est configuré (115 §4).
- [vérifié] `README.md:100-111` : 9 badges (5 workflows dont `Validate Environments`, 4 SonarCloud) ; aucun badge de licence ni Scorecard.
- [vérifié] Absents : `CODE_OF_CONDUCT.md`, `CODEOWNERS`, documentation CI/CD dédiée, runbooks (rotation, rollback de dépendance), politique de vulnérabilités.
- [vérifié] Modèles présents : `.github/ISSUE_TEMPLATE/{bug_report,improvement,config}.yml`, `.github/pull_request_template.md`.
- [vérifié] L'organisation documentaire cible (`docs/dev/…`) dépend de V2-DOC-02 (spec 035).

## 5. Comportement cible

### 5.1 Documents

| Document | Contenu |
|---|---|
| Documentation CI/CD (emplacement 035, proposé `docs/dev/ci-cd.md`) | Catalogue des workflows, matrice de fréquences, noms de checks, agrégateurs, politique d'auto-merge, artefacts, notifications, lecture du rapport |
| Maintenance (`docs/dev/maintenance.md`) | Renovate, Dashboard, traitement d'une PR en échec, rollback d'une dépendance (revert + `ignoreDeps` temporaire), limites des offres gratuites |
| Opérations de sécurité (`docs/dev/security-operations.md`) | Politique de sévérité, exceptions datées, runbook de rotation par secret, incident de secret, faux positifs CodeQL, plan Scorecard |
| Stratégie de tests (`docs/dev/testing-strategy.md`) | Vitest (planchers), Playwright critique/complet, Lighthouse, mutation, couverture Sonar/Codecov |
| Observabilité (`docs/dev/observability.md`) | État réel (Cloudflare Web Analytics ; Sentry seulement si 125 retenue) |
| `SECURITY.md`, `CONTRIBUTING.md` | Réécriture accentuée, contrôles réellement actifs, renvois |
| `README.md` | ≤ 6 badges (Q1) |
| `CODE_OF_CONDUCT.md` | Q2 |
| `AGENTS.md` | Section CI/CD (126) ; Renovate seul générateur ; commandes |

### 5.2 Opérations manuelles du product owner (checklist)

| # | Action | Lien officiel | Chemin dans l'interface | Permission minimale | Résultat attendu | Vérification |
|---|---|---|---|---|---|---|
| M1 | Installer Mend Renovate sur ce seul dépôt | https://github.com/apps/renovate | Configure → compte → « Only select repositories » | Propriétaire du compte | PR d'onboarding, puis Dashboard | Issue « Dependency Dashboard » ; https://developer.mend.io |
| M2 | Squash seul, auto-merge, suppression des branches, mise à jour de branche | https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository | Settings → General → Pull Requests | Admin | Réglages 115 FR-01 | `gh api repos/floriangiral/Bougnat_darts_counter` |
| M3 | Exporter puis modifier le ruleset `main` (checks, conversations, squash, code owners) | https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets | Settings → Rules → Rulesets → main | Admin | 115 FR-02, après 113/114 | `gh api …/rulesets/14279738` |
| M4 | Actions autorisées et épinglage SHA obligatoire | https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository | Settings → Actions → General | Admin | `allowed_actions: selected`, `sha_pinning_required: true` | `gh api …/actions/permissions` |
| M5 | Approbateur requis sur `Production`, sans contournement admin (Q4 de 115) | https://docs.github.com/actions/deployment/targeting-different-environments | Settings → Environments → Production | Admin | Promotion en attente d'approbation | `gh api …/environments/Production` |
| M6 | Désactiver les mises à jour de sécurité Dependabot (après la 1re PR de sécurité Renovate) | https://docs.github.com/code-security/dependabot | Settings → Advanced Security → Dependabot | Admin | Alertes actives, PR Dependabot arrêtées | `gh api …/automated-security-fixes` → `enabled: false` |
| M7 | Motifs non-fournisseurs et contrôles de validité du secret scanning (si disponibles) | https://docs.github.com/code-security/secret-scanning | Settings → Advanced Security → Secret Protection | Admin | Options actives ou indisponibilité consignée | `gh api repos/…` (`security_and_analysis`) |
| M8 | Supprimer `SNYK_TOKEN` et désactiver le projet Snyk (après 117) | https://app.snyk.io | Settings → Secrets and variables → Actions ; Snyk → projet → Deactivate | Admin ; propriétaire Snyk | Plus de secret ni d'analyse Snyk | `gh api …/actions/secrets` |
| M9 | Application de promotion : finaliser ou supprimer (`BRANCH_PROMOTER_APP_*`, 115 Q2) | https://docs.github.com/apps | Settings → GitHub Apps ; Environments → secrets | Propriétaire | Configuration cohérente | `gh api …/environments/*/secrets` |
| M10 | Codecov (si 120) : activer le dépôt, application Codecov sur ce dépôt | https://app.codecov.io/gh | Connexion GitHub → dépôt → activer | Propriétaire | Premier rapport reçu (OIDC, sans jeton) | Commentaire sur une PR |
| M11 | Sentry (si 125, PoC) : organisation région UE, IP non stockées | https://sentry.io/signup/ | Création d'organisation → région ; Settings → Security & Privacy | Propriétaire du compte | Projet de test nettoyé | Événement de test sans donnée personnelle |
| M12 | Étiquettes `ci:echec-planifie`, `maintenance:*`, `agent:*`, `origine:ia`, `deps:*`, `update:*` | https://docs.github.com/issues/using-labels-and-milestones-to-track-work/managing-labels | Issues → Labels | Écriture | Étiquettes présentes | `gh label list` |
| M13 | Créer et épingler l'issue « Tableau de bord DevSecOps » | — | Issues → New → Pin | Maintenance | Issue épinglée | Mise à jour du lundi (127) |
| M14 | Supprimer les branches obsolètes validées | — | Branches | Écriture | Liste réduite | `gh api …/branches` |
| M15 | (Option) Demander l'offre Renovate Community (OSS) | https://github.com/renovatebot/renovate/discussions | Discussions → Mend Hosted Request | Compte GitHub | Ressources accrues | Portail Mend |

Aucune opération ne requiert d'offre payante ; aucune ne crée de jeton personnel à longue durée de vie.

### 5.3 Séquencement (aucun blocage du dépôt)

1. **Phase 0 (lot 0, hors gel de la release 2.0.0, 033)** : 043 ; M2 partiel (suppression des branches, mise à jour de branche), M5 ; 118 (scan historique, sorties masquées, runbook) ; correctifs des promotions (115 FR-07).
2. **Phase 1** : 113 (nouveaux workflows en cohabitation), 117 en parallèle de Snyk, 124 (verrouillage strict), 119, 126 ; M4 après inventaire des actions.
3. **Phase 2** : 114 (agrégateurs) → M3 (migration des checks) ; M1 + 116 sans auto-merge → auto-merge des catégories sûres → M6 ; retrait de Snyk (M8).
4. **Phase 3** : 120 (M10), 121, 123, 127 (M12, M13) ; études 122 et 125 (M11).
5. **Phase 4** : documentation finale, recette globale (§5.4), revue indépendante.

Règle : un check n'est requis qu'après fusion sur `main` du workflow qui le publie ; chaque modification de ruleset est précédée d'un export JSON.

### 5.4 Recette globale (scénarios de la demande §26)

| Scénario | Preuve attendue |
|---|---|
| Patch détecté, PR Renovate, CI complète, fusion automatique | 116 AC-02, 114 AC-01 |
| Majeure non fusionnée automatiquement | 114 AC-02 |
| Test en échec bloquant | 114 AC-03 |
| Nouvelle vulnérabilité bloquante | 117 AC-01 |
| Secret fictif détecté (environnement contrôlé) | 118 AC-01, AC-02 |
| Baisse de couverture détectée | 120 AC-03 (ou Sonar si 120 non retenue) |
| Régression fonctionnelle détectée par Playwright | 113 AC-06 (PR jetable cassant un parcours critique) |
| Mutation du code critique détectée | 122 §8.3 |
| Dépendance inutilisée détectée | 121 AC-01 |
| Régression de performance détectée | 123 AC-03 |
| Erreur de production sans donnée personnelle | 125 §8.2 (si retenue) |
| `main` protégée ; contribution externe sans secrets | 115 AC-02, AC-07 |
| Workflows planifiés fonctionnels | 113 AC-02, AC-03 ; 127 AC-03 |
| Déploiement existant opérationnel | Promotion preprod à blanc ; rappel : l'auto-merge sur `main` ne déploie rien |
| Pas de PR de dépendances en double | 116 AC-08 |
| Aucune fonctionnalité dégradée | E2E complet vert sur `main` après chaque phase |

Matrice finale publiée : Outil | Installé | Configuré | Intégré CI | Testé | Bloquant | Coût | Action restante, avec les statuts « opérationnel », « partiel », « non validé », « bloqué ».

### 5.5 Coûts et quotas (au 2026-11-20)

| Élément | Coût | Quota ou limite | Source |
|---|---|---|---|
| GitHub Actions (runners standard, dépôt public) | 0 € | 20 jobs simultanés (Free) ; artefacts : rétention réglée à 7-14 jours | docs.github.com « Actions billing », « Actions limits » |
| CodeQL, secret scanning, protection des pushes, Dependabot alerts, rulesets | 0 € | Dépôt public | docs.github.com |
| Mend Renovate Community Cloud | 0 € | 1 tâche concurrente, planification toutes les 4 h | docs.renovatebot.com |
| OSV-Scanner, Gitleaks (compte personnel), Scorecard, Knip, Stryker, Lighthouse CI | 0 € | Temps runner | Sources des specs 117-123 |
| Codecov (si retenu) | 0 € | Envois illimités pour les dépôts publics | about.codecov.io/pricing |
| Sentry (si retenu) | 0 € | 5 000 erreurs/mois, 1 utilisateur, 30 jours | sentry.io/pricing |
| Snyk (actuel, à retirer) | 0 € | 200 tests OSS + 100 tests conteneur/mois | snyk.io/plans |

Temps runner estimé : ≈ 2 400 min/mois (≈ 40 pushes de PR × 17 min, nightly 30 × 15 min, hebdomadaires ≈ 70 min × 4, PR Renovate ≈ 8/semaine avec E2E complet) [estimation à mesurer] — gratuit, sans quota pour un dépôt public.

## 6. Périmètre

### Inclus
- Documents §5.1, checklist §5.2, séquencement §5.3, recette §5.4, coûts §5.5.

### Exclu
- Configuration des outils (specs dédiées) ; réorganisation générale de `docs/` (035).

## 7. User stories

- En tant que product owner, je veux une liste d'actions avec leur vérification, afin de configurer le dépôt sans expertise préalable.
- En tant que nouveau mainteneur, je veux comprendre en une heure la chaîne CI/CD et ses règles.

## 8. Règles métier

- RM-01 Aucune fonctionnalité ou contrôle non actif n'est présenté comme actif (`AGENTS.md` §5).
- RM-02 Chaque document porte une date de vérification et renvoie au code ou à la configuration.
- RM-03 Français accentué ; identifiants et commandes en anglais.

## 9. Parcours utilisateurs

Product owner : §5.2 → cases cochées avec preuve. Mainteneur : documentation CI → rapport hebdomadaire → runbooks.

## 10. Exigences fonctionnelles

- FR-01 Rédiger les documents §5.1 au fil des livraisons, chacun mis à jour dans la PR qui change le comportement.
- FR-02 Réécrire `SECURITY.md` et `CONTRIBUTING.md` en français accentué, alignés sur l'état réel.
- FR-03 Publier la checklist §5.2 avec une colonne « fait le / preuve ».
- FR-04 Tenir la matrice finale §5.4 et la synthèse §5.5 à jour à la clôture du chantier.
- FR-05 Corriger `docs/technical.md:303-310` et `:375-382`.
- FR-06 Modèle d'issue « Échec CI ou maintenance » (Q3).

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 €.
- NFR-02 Chaque lien relatif vérifié par le contrôle de documentation (035/036).

## 12. Cas nominaux et alternatifs

- Nominal : documentation livrée avec chaque spec.
- Alternatif : 035 non validée → documents dans `docs/` à plat, déplacés ensuite.

## 13. Cas limites

- Opération manuelle impossible (option indisponible gratuitement) : consignée « bloquée » avec la raison.

## 14. Gestion des erreurs

Sans objet (documentation).

## 15. Impacts architecturaux

Aucun.

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Les documents historiques (`docs/release/*`) ne sont pas modifiés.

## 18. Dépendances

- Bloquantes : V2-SEC-01 (115), V2-DEP-01 (116).
- Liées : V2-DOC-02 (035, emplacement), V2-DOC-03 (036), toutes les specs 113 à 127.

## 19. Critères d'acceptation

- AC-01 `SECURITY.md` et `CONTRIBUTING.md` sont accentués et ne citent que des contrôles actifs.
- AC-02 La checklist §5.2 est entièrement cochée ou chaque ligne non faite porte une raison.
- AC-03 La recette §5.4 est prouvée (lien de run, capture ou PR jetable) pour chaque scénario retenu.
- AC-04 Le README affiche au plus six badges, tous valides.
- AC-05 Un nouveau mainteneur (ou agent sans contexte) explique la politique d'auto-merge et la procédure de rotation à partir des seuls documents [essai manuel].

## 20. Scénarios de tests

Contrôle des liens ; essai de lecture (AC-05) ; revue croisée.

## 21. Exigences de non-régression

Documentation des promotions et du lien partenaire inchangée sur le fond.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Documentation en retard sur la configuration | Moyen | Élevée | Mise à jour dans la même PR ; script 115 FR-11 |
| Checklist exécutée dans le désordre | Élevé | Faible | Séquencement §5.3, exports JSON |

## 23. Décisions architecturales

Aucun ADR ; ADR proposés par 114, 116, 117.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Badges du README | Actuels (9) / ≤ 6 | ≤ 6 : CI, Sécurité, Couverture (un seul outil), Scorecard, Licence, Version | — |
| Q2 | Code de conduite | Contributor Covenant 2.1 (traduction française, CC BY 4.0) / texte maison / aucun | Contributor Covenant 2.1, contact = adresse de `SECURITY.md` ou dédiée | — |
| Q3 | Modèle d'issue « Échec CI ou maintenance » | Oui / non | Oui (alimente les agents, 126) | — |
| Q4 | Emplacement des documents | `docs/dev/` (035) / racine `docs/` | `docs/dev/` si 035 validée | — |
| Q5 | Adresse de contact sécurité (`SECURITY.md:15`) | Conserver / alias dédié | Conserver après vérification de sa réception | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §23, §25 à §28 ; specs 033, 035, 036, 113 à 127.
